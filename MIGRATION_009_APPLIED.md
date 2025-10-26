# Migration 009: Citation Metadata - APPLIED ✅

**Migration**: 009_citation_metadata.sql  
**Applied**: 2024-10-16  
**Project**: nabla-mcp-ultimate (qrczmdhhrzyxwbnpixta)  
**Status**: ✅ SUCCESS

## Migration Summary

Successfully applied citation metadata migration to enable comprehensive citation generation in multiple formats (APA, MLA, Chicago, Bluebook).

## Changes Applied

### 1. Documents Table - New Columns ✅

Added 10 new columns to the `documents` table for citation metadata:

| Column | Type | Nullable | Default | Purpose |
|--------|------|----------|---------|---------|
| `authors` | TEXT[] | YES | '{}' | Array of author names |
| `publication_date` | TIMESTAMP | YES | NULL | Publication date |
| `publisher` | TEXT | YES | NULL | Publisher name |
| `doi` | TEXT | YES | NULL | Digital Object Identifier |
| `document_type` | TEXT | YES | 'article' | Document type (regulation, case, statute, etc.) |
| `jurisdiction` | TEXT | YES | NULL | Legal jurisdiction |
| `volume` | TEXT | YES | NULL | Volume number |
| `issue` | TEXT | YES | NULL | Issue number |
| `pages` | TEXT | YES | NULL | Page numbers |
| `edition` | TEXT | YES | NULL | Edition |

**Verification Query**:
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'documents' 
AND column_name IN ('authors', 'publication_date', 'publisher', 'doi', 'document_type', 'jurisdiction', 'volume', 'issue', 'pages', 'edition');
```

**Result**: ✅ All 10 columns created successfully

### 2. Citation History Table ✅

Created `citation_history` table to track citation usage:

**Schema**:
```sql
CREATE TABLE citation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  citation_style TEXT NOT NULL CHECK (citation_style IN ('apa', 'mla', 'chicago', 'bluebook')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT citation_history_user_document_idx UNIQUE (user_id, document_id, citation_style, created_at)
);
```

**Verification Query**:
```sql
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_name = 'citation_history';
```

**Result**: ✅ Table created successfully

### 3. Indexes Created ✅

Created 8 indexes for optimal query performance:

**Documents Table Indexes**:
1. ✅ `idx_documents_document_type` - For filtering by document type
2. ✅ `idx_documents_publication_date` - For sorting by publication date

**Citation History Table Indexes**:
3. ✅ `citation_history_pkey` - Primary key index
4. ✅ `citation_history_user_document_idx` - Unique constraint index
5. ✅ `idx_citation_history_user` - For user-based queries
6. ✅ `idx_citation_history_document` - For document-based queries
7. ✅ `idx_citation_history_style` - For style-based queries
8. ✅ `idx_citation_history_created` - For time-based queries (DESC)

**Verification Query**:
```sql
SELECT indexname, tablename 
FROM pg_indexes 
WHERE tablename IN ('documents', 'citation_history')
AND (indexname LIKE '%citation%' OR indexname LIKE '%document_type%' OR indexname LIKE '%publication_date%')
ORDER BY tablename, indexname;
```

**Result**: ✅ All 8 indexes created successfully

### 4. Row Level Security (RLS) ✅

Enabled RLS on `citation_history` table with 2 policies:

**Policies**:
1. ✅ **"Users can view their own citation history"** (SELECT)
   - Users can only view their own citation records
   - Policy: `auth.uid() = user_id`

2. ✅ **"Users can insert their own citation history"** (INSERT)
   - Users can only create citation records for themselves
   - Policy: `auth.uid() = user_id`

**Verification Query**:
```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'citation_history'
ORDER BY policyname;
```

**Result**: ✅ Both RLS policies created successfully

### 5. Citation Statistics View ✅

Created `citation_statistics` view for aggregated analytics:

**View Definition**:
```sql
CREATE VIEW citation_statistics AS
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
```

**Verification Query**:
```sql
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_name = 'citation_statistics';
```

**Result**: ✅ View created successfully

### 6. Helper Function ✅

Created `track_citation_usage()` function for easy citation tracking:

**Function Signature**:
```sql
track_citation_usage(p_document_id UUID, p_citation_style TEXT) RETURNS VOID
```

**Usage Example**:
```sql
SELECT track_citation_usage('document-uuid', 'apa');
```

**Result**: ✅ Function created and granted to authenticated users

## Verification Results

### Complete Verification Checklist

- ✅ All 10 columns added to documents table
- ✅ citation_history table created
- ✅ citation_statistics view created
- ✅ All 8 indexes created
- ✅ RLS enabled on citation_history
- ✅ Both RLS policies created
- ✅ track_citation_usage() function created
- ✅ Permissions granted correctly
- ✅ Comments added to tables/views

### Test Queries

**1. Check Citation History Structure**:
```sql
SELECT * FROM citation_history LIMIT 1;
```

**2. Check Citation Statistics**:
```sql
SELECT * FROM citation_statistics LIMIT 5;
```

**3. Test Citation Tracking**:
```sql
-- This will work when called by an authenticated user
SELECT track_citation_usage('some-document-id', 'apa');
```

**4. View Most Cited Documents**:
```sql
SELECT document_id, title, total_citations, unique_users
FROM citation_statistics
WHERE total_citations > 0
ORDER BY total_citations DESC
LIMIT 10;
```

## Performance Impact

### Expected Query Performance

- **Document metadata retrieval**: < 50ms (indexed columns)
- **Citation history insert**: < 10ms (simple insert with indexes)
- **Citation statistics query**: < 100ms (materialized view recommended for large datasets)
- **User citation history**: < 50ms (indexed by user_id)

### Storage Impact

- **Documents table**: +10 columns (minimal impact, mostly NULL initially)
- **Citation history**: ~100 bytes per citation record
- **Indexes**: ~1-2 MB per 10,000 records

## Next Steps

### 1. Populate Existing Documents ⬜

Update existing documents with citation metadata:

```sql
-- Example: Update a regulation document
UPDATE documents
SET 
  authors = ARRAY['European Parliament', 'Council of the European Union'],
  publication_date = '2016-04-27',
  publisher = 'Official Journal of the European Union',
  document_type = 'regulation',
  jurisdiction = 'EU'
WHERE id = 'your-document-id';
```

### 2. Bulk Update Document Types ⬜

Categorize existing documents:

```sql
-- Update all regulations
UPDATE documents
SET document_type = 'regulation'
WHERE title ILIKE '%regulation%' OR title ILIKE '%directive%';

-- Update all guidelines
UPDATE documents
SET document_type = 'guideline'
WHERE title ILIKE '%guideline%' OR title ILIKE '%guidance%';
```

### 3. Test Citation Generation ⬜

Test the citation system with real documents:

1. Open a document in the viewer
2. Click the "Cite" button
3. Verify all 4 citation formats generate correctly
4. Test copy to clipboard
5. Test export functionality

### 4. Monitor Usage ⬜

Set up monitoring for citation usage:

```sql
-- Daily citation counts
SELECT 
  DATE_TRUNC('day', created_at) AS date,
  COUNT(*) AS citations
FROM citation_history
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY date
ORDER BY date DESC;

-- Most popular citation style
SELECT 
  citation_style,
  COUNT(*) AS count
FROM citation_history
GROUP BY citation_style
ORDER BY count DESC;
```

## Rollback Procedure

If needed, rollback the migration:

```sql
-- Drop view
DROP VIEW IF EXISTS citation_statistics;

-- Drop function
DROP FUNCTION IF EXISTS track_citation_usage;

-- Drop table
DROP TABLE IF EXISTS citation_history;

-- Remove columns from documents (optional)
ALTER TABLE documents
DROP COLUMN IF EXISTS authors,
DROP COLUMN IF EXISTS publication_date,
DROP COLUMN IF EXISTS publisher,
DROP COLUMN IF EXISTS doi,
DROP COLUMN IF EXISTS document_type,
DROP COLUMN IF EXISTS jurisdiction,
DROP COLUMN IF EXISTS volume,
DROP COLUMN IF EXISTS issue,
DROP COLUMN IF EXISTS pages,
DROP COLUMN IF EXISTS edition;
```

## Support

For issues or questions:
- Review: `CITATION_DEPLOYMENT_GUIDE.md`
- Check: `CITATION_QUICK_REFERENCE.md`
- Tests: `tests/citations.spec.ts`

## Changelog

### 2024-10-16
- ✅ Migration 009 applied successfully
- ✅ All database objects created
- ✅ Verification completed
- ✅ Documentation updated

---

**Migration Status**: ✅ COMPLETE  
**Database**: Production Ready  
**Next Action**: Populate document metadata and test citation generation
