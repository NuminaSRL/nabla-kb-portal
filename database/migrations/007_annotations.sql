-- Migration: Annotation System
-- Description: Add highlights, notes, and annotation sharing for Pro/Enterprise users
-- Version: 007
-- Date: 2025-01-16

-- Document highlights table
CREATE TABLE IF NOT EXISTS document_highlights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id TEXT NOT NULL REFERENCES document_metadata(document_id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  page_number INTEGER,
  selection_text TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT 'yellow', -- 'yellow', 'green', 'blue', 'pink', 'purple'
  position JSONB NOT NULL, -- { start: { x, y }, end: { x, y }, rects: [...] }
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Document notes table
CREATE TABLE IF NOT EXISTS document_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id TEXT NOT NULL REFERENCES document_metadata(document_id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  highlight_id UUID REFERENCES document_highlights(id) ON DELETE CASCADE,
  page_number INTEGER,
  position JSONB, -- { x, y } for standalone notes
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Annotation sharing table (Enterprise only)
CREATE TABLE IF NOT EXISTS annotation_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  annotation_id UUID NOT NULL, -- Can be highlight_id or note_id
  annotation_type TEXT NOT NULL, -- 'highlight' or 'note'
  owner_id UUID NOT NULL REFERENCES auth.users(id),
  shared_with_user_id UUID REFERENCES auth.users(id),
  shared_with_email TEXT,
  permission TEXT NOT NULL DEFAULT 'view', -- 'view' or 'edit'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT check_shared_with CHECK (
    (shared_with_user_id IS NOT NULL) OR (shared_with_email IS NOT NULL)
  )
);

-- Indexes
CREATE INDEX idx_highlights_document ON document_highlights(document_id);
CREATE INDEX idx_highlights_user ON document_highlights(user_id);
CREATE INDEX idx_highlights_page ON document_highlights(document_id, page_number);
CREATE INDEX idx_notes_document ON document_notes(document_id);
CREATE INDEX idx_notes_user ON document_notes(user_id);
CREATE INDEX idx_notes_highlight ON document_notes(highlight_id);
CREATE INDEX idx_annotation_shares_owner ON annotation_shares(owner_id);
CREATE INDEX idx_annotation_shares_user ON annotation_shares(shared_with_user_id);
CREATE INDEX idx_annotation_shares_email ON annotation_shares(shared_with_email);

-- RLS Policies
ALTER TABLE document_highlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE annotation_shares ENABLE ROW LEVEL SECURITY;

-- Highlights policies
CREATE POLICY "Users can view own highlights"
  ON document_highlights FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view shared highlights"
  ON document_highlights FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM annotation_shares
      WHERE annotation_shares.annotation_id = document_highlights.id
        AND annotation_shares.annotation_type = 'highlight'
        AND (
          annotation_shares.shared_with_user_id = auth.uid()
          OR annotation_shares.shared_with_email = (
            SELECT email FROM auth.users WHERE id = auth.uid()
          )
        )
    )
  );

CREATE POLICY "Users can insert own highlights"
  ON document_highlights FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own highlights"
  ON document_highlights FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own highlights"
  ON document_highlights FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Notes policies
CREATE POLICY "Users can view own notes"
  ON document_notes FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view shared notes"
  ON document_notes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM annotation_shares
      WHERE annotation_shares.annotation_id = document_notes.id
        AND annotation_shares.annotation_type = 'note'
        AND (
          annotation_shares.shared_with_user_id = auth.uid()
          OR annotation_shares.shared_with_email = (
            SELECT email FROM auth.users WHERE id = auth.uid()
          )
        )
    )
  );

CREATE POLICY "Users can insert own notes"
  ON document_notes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notes"
  ON document_notes FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notes"
  ON document_notes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Annotation shares policies
CREATE POLICY "Users can view own shares"
  ON annotation_shares FOR SELECT
  TO authenticated
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can view shares with them"
  ON annotation_shares FOR SELECT
  TO authenticated
  USING (
    shared_with_user_id = auth.uid()
    OR shared_with_email = (
      SELECT email FROM auth.users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can create own shares"
  ON annotation_shares FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own shares"
  ON annotation_shares FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete own shares"
  ON annotation_shares FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id);

-- Functions to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_highlights_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER highlights_updated_at
  BEFORE UPDATE ON document_highlights
  FOR EACH ROW
  EXECUTE FUNCTION update_highlights_updated_at();

CREATE TRIGGER notes_updated_at
  BEFORE UPDATE ON document_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_notes_updated_at();

