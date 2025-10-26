-- Migration: Document Viewer System
-- Description: Add document metadata and viewer tracking
-- Version: 006
-- Date: 2025-01-16

-- Document metadata table
CREATE TABLE IF NOT EXISTS document_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  content_type TEXT NOT NULL, -- 'pdf', 'html', 'markdown'
  file_size BIGINT,
  page_count INTEGER,
  author TEXT,
  created_date TIMESTAMPTZ,
  modified_date TIMESTAMPTZ,
  domain TEXT, -- 'gdpr', 'tax', 'aml', etc.
  source_url TEXT,
  storage_path TEXT NOT NULL,
  thumbnail_url TEXT,
  table_of_contents JSONB, -- Structured TOC
  metadata JSONB, -- Additional metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Document view tracking
CREATE TABLE IF NOT EXISTS document_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id TEXT NOT NULL REFERENCES document_metadata(document_id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  view_duration INTEGER, -- seconds
  pages_viewed INTEGER[],
  last_page INTEGER,
  search_queries TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Document bookmarks
CREATE TABLE IF NOT EXISTS document_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id TEXT NOT NULL REFERENCES document_metadata(document_id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  page_number INTEGER,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(document_id, user_id, page_number)
);

-- Indexes
CREATE INDEX idx_document_metadata_domain ON document_metadata(domain);
CREATE INDEX idx_document_metadata_content_type ON document_metadata(content_type);
CREATE INDEX idx_document_views_user ON document_views(user_id);
CREATE INDEX idx_document_views_document ON document_views(document_id);
CREATE INDEX idx_document_bookmarks_user ON document_bookmarks(user_id);
CREATE INDEX idx_document_bookmarks_document ON document_bookmarks(document_id);

-- RLS Policies
ALTER TABLE document_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_bookmarks ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view document metadata
CREATE POLICY "Users can view document metadata"
  ON document_metadata FOR SELECT
  TO authenticated
  USING (true);

-- Users can only view their own view history
CREATE POLICY "Users can view own view history"
  ON document_views FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own view history"
  ON document_views FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can manage their own bookmarks
CREATE POLICY "Users can view own bookmarks"
  ON document_bookmarks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bookmarks"
  ON document_bookmarks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bookmarks"
  ON document_bookmarks FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own bookmarks"
  ON document_bookmarks FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_document_metadata_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER document_metadata_updated_at
  BEFORE UPDATE ON document_metadata
  FOR EACH ROW
  EXECUTE FUNCTION update_document_metadata_updated_at();
