# Citation System Deployment Guide

This guide covers the deployment of the Citation Generation System for the NABLA KB Portal.

## Overview

The Citation System provides comprehensive citation generation in multiple academic and legal formats:
- APA 7th Edition
- MLA 9th Edition
- Chicago 17th Edition
- Bluebook 21st Edition

## Prerequisites

- Supabase project with database access
- Next.js application deployed
- Node.js 18+ environment

## Deployment Steps

### 1. Database Migration

Apply the citation metadata migration:

```bash
cd kb-portal
psql $DATABASE_URL -f database/migrations/009_citation_metadata.sql
```

Or using Supabase CLI:

```bash
supabase db push database/migrations/009_citation_metadata.sql
```

**Verify migration**:

```sql
-- Check new columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'documents' 
AND column_name IN ('authors', 'publication_date', 'publisher', 'doi', 'document_type');

-- Check citation_history table exists
SELECT * FROM citation_history LIMIT 1;

-- Check citation_statistics view exists
SELECT * FROM citation_statistics LIMIT 1;
```

### 2. Install Dependencies

No additional dependencies required - the citation system uses built-in browser APIs and existing project dependencies.

### 3. Environment Variables

No additional environment variables required for basic functionality.

Optional for analytics:

```env
# Optional: Enable citation analytics
NEXT_PUBLIC_ENABLE_CITATION_ANALYTICS=true
```

### 4. Deploy Frontend Components

The citation system includes:

**Components**:
- `src/lib/citations/citation-service.ts` - Core citation generation
- `src/components/citations/CitationDialog.tsx` - Citation UI dialog
- `src/components/citations/CitationButton.tsx` - Citation trigger button

**API Routes**:
- `src/app/api/citations/route.ts` - Citation metadata endpoint

Deploy using your standard Next.js deployment process:

```bash
npm run build
npm run start
```

Or deploy to Vercel:

```bash
vercel deploy --prod
```

### 5. Update Document Metadata

Populate citation metadata for existing documents:

```sql
-- Example: Update document with citation metadata
UPDATE documents
SET 
  authors = ARRAY['European Parliament', 'Council of the European Union'],
  publication_date = '2016-04-27',
  publisher = 'Official Journal of the European Union',
  doi = '10.2345/example',
  document_type = 'regulation',
  jurisdiction = 'EU'
WHERE id = 'your-document-id';
```

Bulk update script:

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

### 6. Integration with Document Viewer

The citation button is automatically integrated into the document viewer when `documentMetadata` is provided:

```tsx
<ViewerControls
  currentPage={currentPage}
  totalPages={totalPages}
  zoom={zoom}
  searchQuery={searchQuery}
  documentMetadata={{
    id: document.id,
    title: document.title,
    authors: document.authors,
    publicationDate: document.publication_date,
    // ... other metadata
  }}
  onPageChange={setCurrentPage}
  onZoomChange={setZoom}
  onSearchChange={setSearchQuery}
/>
```

## Testing

### 1. Run Automated Tests

```bash
# Run citation tests
npm run test:citations

# Run all tests
npm test
```

### 2. Manual Testing Checklist

- [ ] Citation button appears in document viewer
- [ ] Citation dialog opens when button clicked
- [ ] All 4 citation formats display correctly
- [ ] Copy to clipboard works
- [ ] Export all formats downloads file
- [ ] Export BibTeX downloads .bib file
- [ ] Citations format correctly for different document types
- [ ] Multiple authors handled correctly
- [ ] Legal documents format correctly in Bluebook

### 3. Test Citation Formats

**Test Document**:
```json
{
  "id": "test-doc-1",
  "title": "General Data Protection Regulation",
  "authors": ["European Parliament", "Council of the European Union"],
  "publicationDate": "2016-04-27",
  "publisher": "Official Journal of the European Union",
  "url": "https://eur-lex.europa.eu/eli/reg/2016/679/oj",
  "documentType": "regulation",
  "jurisdiction": "EU"
}
```

**Expected APA Output**:
```
European Parliament, & Council of the European Union. (2016). _General Data Protection Regulation_. Official Journal of the European Union. https://eur-lex.europa.eu/eli/reg/2016/679/oj.
```

**Expected MLA Output**:
```
European Parliament, and Council of the European Union. _General Data Protection Regulation_. Official Journal of the European Union, 27 Apr. 2016. https://eur-lex.europa.eu/eli/reg/2016/679/oj.
```

## Monitoring

### Citation Usage Analytics

Query citation statistics:

```sql
-- Most cited documents
SELECT 
  title,
  total_citations,
  unique_users,
  apa_count,
  mla_count,
  chicago_count,
  bluebook_count
FROM citation_statistics
ORDER BY total_citations DESC
LIMIT 10;

-- Citation trends over time
SELECT 
  DATE_TRUNC('day', created_at) AS date,
  citation_style,
  COUNT(*) AS count
FROM citation_history
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY date, citation_style
ORDER BY date DESC;

-- Most popular citation style
SELECT 
  citation_style,
  COUNT(*) AS count,
  COUNT(DISTINCT user_id) AS unique_users
FROM citation_history
GROUP BY citation_style
ORDER BY count DESC;
```

### Performance Monitoring

Monitor citation generation performance:

```sql
-- Average citations per user
SELECT 
  AVG(citation_count) AS avg_citations_per_user
FROM (
  SELECT user_id, COUNT(*) AS citation_count
  FROM citation_history
  GROUP BY user_id
) AS user_citations;

-- Citation activity by hour
SELECT 
  EXTRACT(HOUR FROM created_at) AS hour,
  COUNT(*) AS citations
FROM citation_history
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY hour
ORDER BY hour;
```

## Troubleshooting

### Issue: Citations not generating

**Symptoms**: Citation dialog shows empty or error

**Solutions**:
1. Check document metadata is complete:
   ```sql
   SELECT id, title, authors, publication_date 
   FROM documents 
   WHERE id = 'problem-document-id';
   ```

2. Verify minimum required fields (id, title) are present

3. Check browser console for JavaScript errors

### Issue: Copy to clipboard fails

**Symptoms**: "Copy failed" toast notification

**Solutions**:
1. Ensure site is served over HTTPS (required for clipboard API)
2. Check browser permissions for clipboard access
3. Fallback method should work in older browsers

### Issue: Bluebook format incorrect

**Symptoms**: Legal citations don't follow Bluebook style

**Solutions**:
1. Verify `documentType` is set correctly:
   - Use `statute` for laws
   - Use `case` for court cases
   - Use `regulation` for regulations

2. Ensure jurisdiction is specified for legal documents

3. Check volume, issue, and pages fields are populated

### Issue: Export downloads empty file

**Symptoms**: Downloaded file is empty or corrupted

**Solutions**:
1. Check browser download settings
2. Verify blob creation in browser console
3. Test with different browsers

## Rollback Procedure

If issues occur, rollback the citation system:

### 1. Remove Database Changes

```sql
-- Drop citation tables and views
DROP VIEW IF EXISTS citation_statistics;
DROP TABLE IF EXISTS citation_history;
DROP FUNCTION IF EXISTS track_citation_usage;

-- Remove citation columns (optional - may affect other features)
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

### 2. Remove Frontend Components

```bash
# Remove citation components
rm -rf kb-portal/src/lib/citations
rm -rf kb-portal/src/components/citations
rm kb-portal/src/app/api/citations/route.ts
```

### 3. Revert ViewerControls Integration

Remove citation button from `ViewerControls.tsx`:
- Remove `CitationButton` import
- Remove `documentMetadata` prop
- Remove citation button from render

## Performance Optimization

### 1. Enable Citation Caching

Cache generated citations to reduce computation:

```typescript
// In citation-service.ts
const citationCache = new Map<string, Citation>();

generateCitation(metadata: DocumentMetadata, style: CitationStyle): Citation {
  const cacheKey = `${metadata.id}-${style}`;
  
  if (citationCache.has(cacheKey)) {
    return citationCache.get(cacheKey)!;
  }
  
  const citation = this.generateCitationInternal(metadata, style);
  citationCache.set(cacheKey, citation);
  
  return citation;
}
```

### 2. Lazy Load Citation Dialog

Improve initial page load by lazy loading the citation dialog:

```typescript
import dynamic from 'next/dynamic';

const CitationDialog = dynamic(() => 
  import('@/components/citations/CitationDialog').then(mod => mod.CitationDialog),
  { ssr: false }
);
```

### 3. Batch Citation Generation

For multiple documents, generate citations in batch:

```typescript
async function batchGenerateCitations(documentIds: string[]) {
  const citations = await Promise.all(
    documentIds.map(id => fetchCitationMetadata(id))
  );
  return citations;
}
```

## Security Considerations

1. **Input Validation**: All document metadata is validated before citation generation
2. **XSS Prevention**: HTML output is properly escaped
3. **Rate Limiting**: Consider adding rate limits to citation API endpoints
4. **Access Control**: Citations respect document access permissions via RLS

## Support

For issues or questions:
- Check the [Citation System README](src/lib/citations/README.md)
- Review test cases in `tests/citations.spec.ts`
- Contact development team

## Changelog

### Version 1.0.0 (2024-10-16)
- Initial release
- Support for APA, MLA, Chicago, Bluebook formats
- Copy to clipboard functionality
- Export to text and BibTeX
- Integration with document viewer
- Citation usage analytics
