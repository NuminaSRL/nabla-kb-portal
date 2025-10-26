-- Migration: Saved Searches with Alerts System
-- Description: Tables and functions for saved searches with email alerts

-- Saved searches table (enhanced from 001 migration)
-- Drop existing table if it exists and recreate with alert features
DROP TABLE IF EXISTS saved_searches CASCADE;

CREATE TABLE saved_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  query TEXT NOT NULL,
  filters JSONB DEFAULT '{}',
  alert_enabled BOOLEAN DEFAULT FALSE,
  alert_frequency TEXT CHECK (alert_frequency IN ('daily', 'weekly', 'monthly')) DEFAULT 'weekly',
  last_alert_sent_at TIMESTAMP WITH TIME ZONE,
  last_result_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Search alerts table
CREATE TABLE search_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  saved_search_id UUID NOT NULL REFERENCES saved_searches(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  new_documents_count INTEGER DEFAULT 0,
  alert_sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  email_sent BOOLEAN DEFAULT FALSE,
  email_error TEXT,
  document_ids UUID[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}'
);

-- Alert queue table (for processing)
CREATE TABLE alert_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  saved_search_id UUID NOT NULL REFERENCES saved_searches(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT CHECK (status IN ('pending', 'processing', 'completed', 'failed')) DEFAULT 'pending',
  attempts INTEGER DEFAULT 0,
  last_attempt_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email notifications table
CREATE TABLE email_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email_type TEXT NOT NULL, -- 'search_alert', 'digest', etc.
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  body_text TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  status TEXT CHECK (status IN ('pending', 'sent', 'failed')) DEFAULT 'pending',
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_saved_searches_user_id ON saved_searches(user_id);
CREATE INDEX idx_saved_searches_alert_enabled ON saved_searches(alert_enabled) WHERE alert_enabled = TRUE;
CREATE INDEX idx_saved_searches_created_at ON saved_searches(created_at DESC);

CREATE INDEX idx_search_alerts_saved_search ON search_alerts(saved_search_id);
CREATE INDEX idx_search_alerts_user_id ON search_alerts(user_id);
CREATE INDEX idx_search_alerts_sent_at ON search_alerts(alert_sent_at DESC);

CREATE INDEX idx_alert_queue_status ON alert_queue(status);
CREATE INDEX idx_alert_queue_scheduled_for ON alert_queue(scheduled_for);
CREATE INDEX idx_alert_queue_user_id ON alert_queue(user_id);

CREATE INDEX idx_email_notifications_user_id ON email_notifications(user_id);
CREATE INDEX idx_email_notifications_status ON email_notifications(status);
CREATE INDEX idx_email_notifications_created_at ON email_notifications(created_at DESC);

-- Function: Check saved search limit based on tier
CREATE OR REPLACE FUNCTION check_saved_search_limit(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_tier user_tier;
  v_current_count INTEGER;
  v_limit INTEGER;
BEGIN
  -- Get user tier
  SELECT tier INTO v_tier
  FROM user_profiles
  WHERE id = p_user_id;
  
  -- Set limits based on tier
  CASE v_tier
    WHEN 'free' THEN
      RETURN FALSE; -- Free tier doesn't have saved searches
    WHEN 'pro' THEN
      v_limit := 20;
    WHEN 'enterprise' THEN
      v_limit := -1; -- Unlimited
    ELSE
      RETURN FALSE;
  END CASE;
  
  -- Unlimited for enterprise
  IF v_limit = -1 THEN
    RETURN TRUE;
  END IF;
  
  -- Count current saved searches
  SELECT COUNT(*) INTO v_current_count
  FROM saved_searches
  WHERE user_id = p_user_id;
  
  RETURN v_current_count < v_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get saved searches count for user
CREATE OR REPLACE FUNCTION get_saved_searches_count(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM saved_searches
  WHERE user_id = p_user_id;
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Schedule alert for saved search
CREATE OR REPLACE FUNCTION schedule_search_alert(
  p_saved_search_id UUID,
  p_user_id UUID,
  p_frequency TEXT
)
RETURNS UUID AS $$
DECLARE
  v_scheduled_for TIMESTAMP WITH TIME ZONE;
  v_queue_id UUID;
BEGIN
  -- Calculate next scheduled time based on frequency
  CASE p_frequency
    WHEN 'daily' THEN
      v_scheduled_for := NOW() + INTERVAL '1 day';
    WHEN 'weekly' THEN
      v_scheduled_for := NOW() + INTERVAL '7 days';
    WHEN 'monthly' THEN
      v_scheduled_for := NOW() + INTERVAL '30 days';
    ELSE
      v_scheduled_for := NOW() + INTERVAL '7 days'; -- Default to weekly
  END CASE;
  
  -- Insert into alert queue
  INSERT INTO alert_queue (saved_search_id, user_id, scheduled_for, status)
  VALUES (p_saved_search_id, p_user_id, v_scheduled_for, 'pending')
  RETURNING id INTO v_queue_id;
  
  RETURN v_queue_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Process alert queue (called by scheduler)
CREATE OR REPLACE FUNCTION process_alert_queue()
RETURNS TABLE (
  queue_id UUID,
  saved_search_id UUID,
  user_id UUID,
  query TEXT,
  filters JSONB
) AS $$
BEGIN
  RETURN QUERY
  UPDATE alert_queue aq
  SET 
    status = 'processing',
    last_attempt_at = NOW(),
    attempts = attempts + 1,
    updated_at = NOW()
  FROM saved_searches ss
  WHERE aq.saved_search_id = ss.id
    AND aq.status = 'pending'
    AND aq.scheduled_for <= NOW()
    AND aq.attempts < 3 -- Max 3 attempts
  RETURNING 
    aq.id,
    aq.saved_search_id,
    aq.user_id,
    ss.query,
    ss.filters;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Mark alert as completed
CREATE OR REPLACE FUNCTION complete_alert(
  p_queue_id UUID,
  p_new_documents_count INTEGER,
  p_document_ids UUID[]
)
RETURNS VOID AS $$
DECLARE
  v_saved_search_id UUID;
  v_user_id UUID;
BEGIN
  -- Get saved search and user info
  SELECT saved_search_id, user_id INTO v_saved_search_id, v_user_id
  FROM alert_queue
  WHERE id = p_queue_id;
  
  -- Update alert queue
  UPDATE alert_queue
  SET 
    status = 'completed',
    updated_at = NOW()
  WHERE id = p_queue_id;
  
  -- Insert alert record
  INSERT INTO search_alerts (
    saved_search_id,
    user_id,
    new_documents_count,
    document_ids,
    alert_sent_at
  ) VALUES (
    v_saved_search_id,
    v_user_id,
    p_new_documents_count,
    p_document_ids,
    NOW()
  );
  
  -- Update saved search
  UPDATE saved_searches
  SET 
    last_alert_sent_at = NOW(),
    last_result_count = p_new_documents_count,
    updated_at = NOW()
  WHERE id = v_saved_search_id;
  
  -- Schedule next alert
  PERFORM schedule_search_alert(
    v_saved_search_id,
    v_user_id,
    (SELECT alert_frequency FROM saved_searches WHERE id = v_saved_search_id)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Mark alert as failed
CREATE OR REPLACE FUNCTION fail_alert(
  p_queue_id UUID,
  p_error_message TEXT
)
RETURNS VOID AS $$
DECLARE
  v_attempts INTEGER;
BEGIN
  -- Get current attempts
  SELECT attempts INTO v_attempts
  FROM alert_queue
  WHERE id = p_queue_id;
  
  -- If max attempts reached, mark as failed, otherwise reset to pending
  IF v_attempts >= 3 THEN
    UPDATE alert_queue
    SET 
      status = 'failed',
      error_message = p_error_message,
      updated_at = NOW()
    WHERE id = p_queue_id;
  ELSE
    UPDATE alert_queue
    SET 
      status = 'pending',
      error_message = p_error_message,
      scheduled_for = NOW() + INTERVAL '1 hour', -- Retry in 1 hour
      updated_at = NOW()
    WHERE id = p_queue_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Queue email notification
CREATE OR REPLACE FUNCTION queue_email_notification(
  p_user_id UUID,
  p_email_type TEXT,
  p_recipient_email TEXT,
  p_subject TEXT,
  p_body_html TEXT,
  p_body_text TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO email_notifications (
    user_id,
    email_type,
    recipient_email,
    subject,
    body_html,
    body_text,
    metadata
  ) VALUES (
    p_user_id,
    p_email_type,
    p_recipient_email,
    p_subject,
    p_body_html,
    p_body_text,
    p_metadata
  )
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Mark email as sent
CREATE OR REPLACE FUNCTION mark_email_sent(
  p_notification_id UUID,
  p_success BOOLEAN,
  p_error_message TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  UPDATE email_notifications
  SET 
    status = CASE WHEN p_success THEN 'sent' ELSE 'failed' END,
    sent_at = CASE WHEN p_success THEN NOW() ELSE NULL END,
    error_message = p_error_message
  WHERE id = p_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Update updated_at on saved_searches
CREATE OR REPLACE FUNCTION update_saved_searches_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_saved_searches_updated_at
  BEFORE UPDATE ON saved_searches
  FOR EACH ROW
  EXECUTE FUNCTION update_saved_searches_updated_at();

-- Trigger: Update updated_at on alert_queue
CREATE TRIGGER trigger_update_alert_queue_updated_at
  BEFORE UPDATE ON alert_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_saved_searches_updated_at();

-- Trigger: Schedule alert when saved search is created with alerts enabled
CREATE OR REPLACE FUNCTION trigger_schedule_alert_on_create()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.alert_enabled = TRUE THEN
    PERFORM schedule_search_alert(NEW.id, NEW.user_id, NEW.alert_frequency);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_schedule_alert_on_saved_search_create
  AFTER INSERT ON saved_searches
  FOR EACH ROW
  EXECUTE FUNCTION trigger_schedule_alert_on_create();

-- Trigger: Reschedule alert when frequency changes
CREATE OR REPLACE FUNCTION trigger_reschedule_alert_on_update()
RETURNS TRIGGER AS $$
BEGIN
  -- If alert was disabled and now enabled, schedule new alert
  IF OLD.alert_enabled = FALSE AND NEW.alert_enabled = TRUE THEN
    PERFORM schedule_search_alert(NEW.id, NEW.user_id, NEW.alert_frequency);
  END IF;
  
  -- If frequency changed and alert is enabled, reschedule
  IF OLD.alert_frequency != NEW.alert_frequency AND NEW.alert_enabled = TRUE THEN
    -- Cancel pending alerts
    DELETE FROM alert_queue
    WHERE saved_search_id = NEW.id AND status = 'pending';
    
    -- Schedule new alert
    PERFORM schedule_search_alert(NEW.id, NEW.user_id, NEW.alert_frequency);
  END IF;
  
  -- If alert was disabled, cancel pending alerts
  IF OLD.alert_enabled = TRUE AND NEW.alert_enabled = FALSE THEN
    DELETE FROM alert_queue
    WHERE saved_search_id = NEW.id AND status = 'pending';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_reschedule_alert_on_saved_search_update
  AFTER UPDATE ON saved_searches
  FOR EACH ROW
  EXECUTE FUNCTION trigger_reschedule_alert_on_update();

-- Row Level Security (RLS) Policies

ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_notifications ENABLE ROW LEVEL SECURITY;

-- Saved searches policies
CREATE POLICY "Users can view own saved searches"
  ON saved_searches FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own saved searches"
  ON saved_searches FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND check_saved_search_limit(auth.uid()));

CREATE POLICY "Users can update own saved searches"
  ON saved_searches FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved searches"
  ON saved_searches FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Search alerts policies
CREATE POLICY "Users can view own search alerts"
  ON search_alerts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Alert queue policies (system managed)
CREATE POLICY "Users can view own alert queue"
  ON alert_queue FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Email notifications policies
CREATE POLICY "Users can view own email notifications"
  ON email_notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON saved_searches TO authenticated;
GRANT SELECT ON search_alerts TO authenticated;
GRANT SELECT ON alert_queue TO authenticated;
GRANT SELECT ON email_notifications TO authenticated;

-- Comments
COMMENT ON TABLE saved_searches IS 'User saved searches with alert configuration';
COMMENT ON TABLE search_alerts IS 'History of sent search alerts';
COMMENT ON TABLE alert_queue IS 'Queue for processing scheduled alerts';
COMMENT ON TABLE email_notifications IS 'Email notification queue and history';
COMMENT ON FUNCTION check_saved_search_limit IS 'Check if user can create more saved searches based on tier';
COMMENT ON FUNCTION schedule_search_alert IS 'Schedule next alert for a saved search';
COMMENT ON FUNCTION process_alert_queue IS 'Process pending alerts (called by scheduler)';

