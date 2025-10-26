-- KB Portal Quota Management System
-- Migration: 005_quota_management.sql

-- Quota usage table (replaces Redis for quota tracking)
CREATE TABLE IF NOT EXISTS quota_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    quota_type TEXT NOT NULL, -- 'search', 'export', 'api_call'
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    usage_count INTEGER DEFAULT 0,
    limit_value INTEGER NOT NULL,
    tier user_tier NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, quota_type, period_start)
);

-- Quota events table (for detailed tracking and analytics)
CREATE TABLE IF NOT EXISTS quota_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    quota_type TEXT NOT NULL,
    event_type TEXT NOT NULL, -- 'increment', 'reset', 'limit_reached', 'upgrade_prompt'
    usage_before INTEGER,
    usage_after INTEGER,
    limit_value INTEGER,
    tier user_tier NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quota reset log table
CREATE TABLE IF NOT EXISTS quota_reset_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reset_date DATE NOT NULL UNIQUE,
    users_reset INTEGER DEFAULT 0,
    quotas_reset INTEGER DEFAULT 0,
    execution_time_ms INTEGER,
    status TEXT NOT NULL, -- 'success', 'failed', 'partial'
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Upgrade prompts table
CREATE TABLE IF NOT EXISTS upgrade_prompts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    prompt_type TEXT NOT NULL, -- 'quota_exceeded', 'feature_locked', 'trial_ending'
    quota_type TEXT,
    current_tier user_tier NOT NULL,
    suggested_tier user_tier NOT NULL,
    shown_at TIMESTAMPTZ DEFAULT NOW(),
    dismissed_at TIMESTAMPTZ,
    converted_at TIMESTAMPTZ,
    metadata JSONB
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_quota_usage_user_period ON quota_usage(user_id, period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_quota_usage_period_start ON quota_usage(period_start);
CREATE INDEX IF NOT EXISTS idx_quota_events_user ON quota_events(user_id);
CREATE INDEX IF NOT EXISTS idx_quota_events_created ON quota_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_upgrade_prompts_user ON upgrade_prompts(user_id);
CREATE INDEX IF NOT EXISTS idx_upgrade_prompts_shown ON upgrade_prompts(shown_at DESC);

-- Trigger for updated_at
CREATE TRIGGER update_quota_usage_updated_at
    BEFORE UPDATE ON quota_usage
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to get current quota usage
CREATE OR REPLACE FUNCTION get_quota_usage(
    p_user_id UUID,
    p_quota_type TEXT
)
RETURNS TABLE(
    usage_count INTEGER,
    limit_value INTEGER,
    remaining INTEGER,
    period_start TIMESTAMPTZ,
    period_end TIMESTAMPTZ,
    is_unlimited BOOLEAN
) AS $$
DECLARE
    v_tier user_tier;
    v_limit INTEGER;
    v_period_start TIMESTAMPTZ;
    v_period_end TIMESTAMPTZ;
BEGIN
    -- Get user tier
    SELECT tier INTO v_tier
    FROM user_profiles
    WHERE id = p_user_id;
    
    -- Get tier limit
    SELECT 
        CASE 
            WHEN p_quota_type = 'search' THEN searches_per_day
            ELSE -1
        END INTO v_limit
    FROM tier_limits
    WHERE tier = v_tier;
    
    -- Calculate period (daily)
    v_period_start := DATE_TRUNC('day', NOW());
    v_period_end := v_period_start + INTERVAL '1 day';
    
    -- Get or create quota usage record
    INSERT INTO quota_usage (user_id, quota_type, period_start, period_end, usage_count, limit_value, tier)
    VALUES (p_user_id, p_quota_type, v_period_start, v_period_end, 0, v_limit, v_tier)
    ON CONFLICT (user_id, quota_type, period_start) DO NOTHING;
    
    -- Return current usage
    RETURN QUERY
    SELECT 
        qu.usage_count,
        qu.limit_value,
        CASE 
            WHEN qu.limit_value = -1 THEN -1
            ELSE GREATEST(0, qu.limit_value - qu.usage_count)
        END as remaining,
        qu.period_start,
        qu.period_end,
        qu.limit_value = -1 as is_unlimited
    FROM quota_usage qu
    WHERE qu.user_id = p_user_id
        AND qu.quota_type = p_quota_type
        AND qu.period_start = v_period_start;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment quota usage
CREATE OR REPLACE FUNCTION increment_quota_usage(
    p_user_id UUID,
    p_quota_type TEXT,
    p_increment INTEGER DEFAULT 1
)
RETURNS TABLE(
    success BOOLEAN,
    usage_count INTEGER,
    limit_value INTEGER,
    remaining INTEGER,
    quota_exceeded BOOLEAN
) AS $$
DECLARE
    v_tier user_tier;
    v_limit INTEGER;
    v_period_start TIMESTAMPTZ;
    v_period_end TIMESTAMPTZ;
    v_current_usage INTEGER;
    v_new_usage INTEGER;
    v_quota_exceeded BOOLEAN;
BEGIN
    -- Get user tier
    SELECT tier INTO v_tier
    FROM user_profiles
    WHERE id = p_user_id;
    
    -- Get tier limit
    SELECT 
        CASE 
            WHEN p_quota_type = 'search' THEN searches_per_day
            ELSE -1
        END INTO v_limit
    FROM tier_limits
    WHERE tier = v_tier;
    
    -- Calculate period (daily)
    v_period_start := DATE_TRUNC('day', NOW());
    v_period_end := v_period_start + INTERVAL '1 day';
    
    -- Get or create quota usage record
    INSERT INTO quota_usage (user_id, quota_type, period_start, period_end, usage_count, limit_value, tier)
    VALUES (p_user_id, p_quota_type, v_period_start, v_period_end, 0, v_limit, v_tier)
    ON CONFLICT (user_id, quota_type, period_start) DO NOTHING;
    
    -- Get current usage
    SELECT qu.usage_count INTO v_current_usage
    FROM quota_usage qu
    WHERE qu.user_id = p_user_id
        AND qu.quota_type = p_quota_type
        AND qu.period_start = v_period_start;
    
    -- Check if quota would be exceeded
    v_quota_exceeded := (v_limit != -1 AND v_current_usage + p_increment > v_limit);
    
    -- Increment usage if not exceeded or unlimited
    IF NOT v_quota_exceeded OR v_limit = -1 THEN
        UPDATE quota_usage
        SET usage_count = usage_count + p_increment,
            updated_at = NOW()
        WHERE user_id = p_user_id
            AND quota_type = p_quota_type
            AND period_start = v_period_start;
        
        v_new_usage := v_current_usage + p_increment;
        
        -- Log event
        INSERT INTO quota_events (user_id, quota_type, event_type, usage_before, usage_after, limit_value, tier)
        VALUES (p_user_id, p_quota_type, 'increment', v_current_usage, v_new_usage, v_limit, v_tier);
    ELSE
        v_new_usage := v_current_usage;
        
        -- Log limit reached event
        INSERT INTO quota_events (user_id, quota_type, event_type, usage_before, usage_after, limit_value, tier)
        VALUES (p_user_id, p_quota_type, 'limit_reached', v_current_usage, v_current_usage, v_limit, v_tier);
    END IF;
    
    -- Return result
    RETURN QUERY
    SELECT 
        NOT v_quota_exceeded as success,
        v_new_usage as usage_count,
        v_limit as limit_value,
        CASE 
            WHEN v_limit = -1 THEN -1
            ELSE GREATEST(0, v_limit - v_new_usage)
        END as remaining,
        v_quota_exceeded as quota_exceeded;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reset daily quotas
CREATE OR REPLACE FUNCTION reset_daily_quotas()
RETURNS TABLE(
    users_reset INTEGER,
    quotas_reset INTEGER
) AS $$
DECLARE
    v_users_reset INTEGER;
    v_quotas_reset INTEGER;
BEGIN
    -- Delete old quota usage records (older than 7 days for history)
    DELETE FROM quota_usage
    WHERE period_end < NOW() - INTERVAL '7 days';
    
    -- Count affected records
    GET DIAGNOSTICS v_quotas_reset = ROW_COUNT;
    
    -- Count unique users
    SELECT COUNT(DISTINCT user_id) INTO v_users_reset
    FROM quota_usage
    WHERE period_start = DATE_TRUNC('day', NOW() - INTERVAL '1 day');
    
    -- Log reset event
    INSERT INTO quota_events (user_id, quota_type, event_type, usage_before, usage_after, limit_value, tier)
    SELECT 
        qu.user_id,
        qu.quota_type,
        'reset',
        qu.usage_count,
        0,
        qu.limit_value,
        qu.tier
    FROM quota_usage qu
    WHERE qu.period_start = DATE_TRUNC('day', NOW() - INTERVAL '1 day');
    
    RETURN QUERY SELECT v_users_reset, v_quotas_reset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get usage statistics
CREATE OR REPLACE FUNCTION get_usage_statistics(
    p_user_id UUID,
    p_days INTEGER DEFAULT 7
)
RETURNS TABLE(
    quota_type TEXT,
    total_usage BIGINT,
    avg_daily_usage NUMERIC,
    max_daily_usage INTEGER,
    days_at_limit INTEGER,
    current_tier user_tier
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        qu.quota_type,
        SUM(qu.usage_count) as total_usage,
        ROUND(AVG(qu.usage_count), 2) as avg_daily_usage,
        MAX(qu.usage_count) as max_daily_usage,
        COUNT(*) FILTER (WHERE qu.usage_count >= qu.limit_value AND qu.limit_value != -1) as days_at_limit,
        qu.tier as current_tier
    FROM quota_usage qu
    WHERE qu.user_id = p_user_id
        AND qu.period_start >= NOW() - (p_days || ' days')::INTERVAL
    GROUP BY qu.quota_type, qu.tier;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if upgrade prompt should be shown
CREATE OR REPLACE FUNCTION should_show_upgrade_prompt(
    p_user_id UUID,
    p_quota_type TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_last_prompt TIMESTAMPTZ;
    v_quota_exceeded BOOLEAN;
BEGIN
    -- Check if quota is exceeded
    SELECT 
        CASE 
            WHEN qu.limit_value = -1 THEN FALSE
            ELSE qu.usage_count >= qu.limit_value
        END INTO v_quota_exceeded
    FROM quota_usage qu
    WHERE qu.user_id = p_user_id
        AND qu.quota_type = p_quota_type
        AND qu.period_start = DATE_TRUNC('day', NOW());
    
    IF NOT v_quota_exceeded THEN
        RETURN FALSE;
    END IF;
    
    -- Check if prompt was shown recently (within 24 hours)
    SELECT MAX(shown_at) INTO v_last_prompt
    FROM upgrade_prompts
    WHERE user_id = p_user_id
        AND quota_type = p_quota_type
        AND dismissed_at IS NULL
        AND shown_at > NOW() - INTERVAL '24 hours';
    
    RETURN v_last_prompt IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Row Level Security (RLS) Policies

ALTER TABLE quota_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE quota_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE upgrade_prompts ENABLE ROW LEVEL SECURITY;

-- Quota usage policies
CREATE POLICY "Users can view own quota usage"
    ON quota_usage FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "System can manage quota usage"
    ON quota_usage FOR ALL
    USING (true);

-- Quota events policies
CREATE POLICY "Users can view own quota events"
    ON quota_events FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "System can insert quota events"
    ON quota_events FOR INSERT
    WITH CHECK (true);

-- Upgrade prompts policies
CREATE POLICY "Users can view own upgrade prompts"
    ON upgrade_prompts FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can dismiss own upgrade prompts"
    ON upgrade_prompts FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "System can insert upgrade prompts"
    ON upgrade_prompts FOR INSERT
    WITH CHECK (true);

-- Grant permissions
GRANT ALL ON quota_usage TO authenticated;
GRANT ALL ON quota_events TO authenticated;
GRANT ALL ON upgrade_prompts TO authenticated;
GRANT ALL ON quota_reset_log TO authenticated;

