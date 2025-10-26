-- Migration 009: Citation Metadata
-- Add fields needed for proper citation generation

-- Add citation-related fields to documents table
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS authors TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS publication_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS publisher TEXT,
ADD COLUMN IF NOT EXISTS doi TEXT,
ADD COLUMN IF NOT EXISTS document_type TEXT DEFAULT 'article',
ADD COLUMN IF NOT EXISTS jurisdiction TEXT,
ADD COLUMN IF NOT EXISTS volume TEXT,
ADD COLUMN IF NOT EXISTS issue TEXT,
ADD COLUMN IF NOT EXISTS pages TEXT,
ADD COLUMN IF NOT EXISTS edition TEXT;

-- Add index for document type for faster filtering
CREATE INDEX IF NOT EXISTS idx_documents_document_type ON documents(document_type);

-- Add index for publication date for sorting
CREATE INDEX IF NOT EXISTS idx_documents_publication_date ON documents(publication_date);

-- Create citation_history table to track citation usage
CREATE TABLE IF NOT EXISTS citation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  citation_style TEXT NOT NULL CHECK (citation_style IN ('apa', 'mla', 'chicago', 'bluebook')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Indexes
  CONSTRAINT citation_history_user_document_idx UNIQUE (user_id, document_id, citation_style, created_at)
);

-- Add indexes for citation history
CREATE INDEX IF NOT EXISTS idx_citation_history_user ON citation_history(user_id);
CREATE INDEX IF NOT EXISTS idx_citation_history_document ON citation_history(document_id);
CREATE INDEX IF NOT EXISTS idx_citation_history_style ON citation_history(citation_style);
CREATE INDEX IF NOT EXISTS idx_citation_history_created ON citation_history(created_at DESC);

-- Enable RLS on citation_history
ALTER TABLE citation_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for citation_history
CREATE POLICY "Users can view their own citation history"
  ON citation_history
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own citation history"
  ON citation_history
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Function to track citation usage
CREATE OR REPLACE FUNCTION track_citation_usage(
  p_document_id UUID,
  p_citation_style TEXT
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO citation_history (user_id, document_id, citation_style)
  VALUES (auth.uid(), p_document_id, p_citation_style);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION track_citation_usage TO authenticated;

-- Create view for citation statistics
CREATE OR REPLACE VIEW citation_statistics AS
SELECT
  d.id AS document_id,
  d.title,
  d.document_type,
  COUNT(ch.id) AS total_citations,
  COUNT(DISTINCT ch.user_id) AS unique_users,
  COUNT(CASE WHEN ch.citation_style = 'apa' THEN 1 END) AS apa_count,
  COUNT(CASE WHEN ch.citation_style = 'mla' THEN 1 END) AS mla_count,
  COUNT(CASE WHEN ch.citation_style = 'chicago' THEN 1 END) AS chicago_count,
  COUNT(CASE WHEN ch.citation_style = 'bluebook' THEN 1 END) AS bluebook_count,
  MAX(ch.created_at) AS last_cited
FROM documents d
LEFT JOIN citation_history ch ON d.id = ch.document_id
GROUP BY d.id, d.title, d.document_type;

-- Grant access to the view
GRANT SELECT ON citation_statistics TO authenticated;

-- Add comment
COMMENT ON TABLE citation_history IS 'Tracks citation generation history for analytics';
COMMENT ON VIEW citation_statistics IS 'Aggregated citation statistics per document';
