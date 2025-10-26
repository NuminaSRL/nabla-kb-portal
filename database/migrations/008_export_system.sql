-- Export System Migration
-- Adds export queue, export jobs, and watermarking support

-- Export jobs table
CREATE TABLE IF NOT EXISTS export_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_type VARCHAR(50) NOT NULL CHECK (job_type IN ('single_pdf', 'batch_pdf', 'csv', 'json', 'markdown')),
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  
  -- Job configuration
  document_ids TEXT[] NOT NULL,
  include_annotations BOOLEAN DEFAULT false,
  include_watermark BOOLEAN DEFAULT false,
  watermark_text TEXT,
  
  -- Output
  output_url TEXT,
  file_size BIGINT,
  
  -- Metadata
  error_message TEXT,
  processing_started_at TIMESTAMPTZ,
  processing_completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Export statistics
CREATE TABLE IF NOT EXISTS export_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  export_type VARCHAR(50) NOT NULL,
  document_count INTEGER NOT NULL DEFAULT 1,
  file_size BIGINT,
  processing_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_export_jobs_user_id ON export_jobs(user_id);
CREATE INDEX idx_export_jobs_status ON export_jobs(status);
CREATE INDEX idx_export_jobs_created_at ON export_jobs(created_at DESC);
CREATE INDEX idx_export_stats_user_id ON export_stats(user_id);
CREATE INDEX idx_export_stats_created_at ON export_stats(created_at DESC);

-- RLS Policies
ALTER TABLE export_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE export_stats ENABLE ROW LEVEL SECURITY;

-- Users can only see their own export jobs
CREATE POLICY export_jobs_select_own ON export_jobs
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY export_jobs_insert_own ON export_jobs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY export_jobs_update_own ON export_jobs
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can only see their own export stats
CREATE POLICY export_stats_select_own ON export_stats
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY export_stats_insert_own ON export_stats
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Function to update export job status
CREATE OR REPLACE FUNCTION update_export_job_status()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  
  IF NEW.status = 'processing' AND OLD.status = 'pending' THEN
    NEW.processing_started_at = NOW();
  END IF;
  
  IF NEW.status IN ('completed', 'failed') AND OLD.status = 'processing' THEN
    NEW.processing_completed_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER export_job_status_trigger
  BEFORE UPDATE ON export_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_export_job_status();

-- Function to clean up old export jobs (older than 7 days)
CREATE OR REPLACE FUNCTION cleanup_old_export_jobs()
RETURNS void AS $$
BEGIN
  DELETE FROM export_jobs
  WHERE created_at < NOW() - INTERVAL '7 days'
    AND status IN ('completed', 'failed');
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON export_jobs TO authenticated;
GRANT SELECT, INSERT ON export_stats TO authenticated;
