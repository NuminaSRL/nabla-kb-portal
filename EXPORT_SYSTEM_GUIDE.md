# Export System Implementation Guide

## Overview

The Export System provides comprehensive document export functionality with support for multiple formats (PDF, CSV, JSON, Markdown), batch processing, annotations, and watermarking for Enterprise users.

## Features

### Core Features
- ✅ Single document PDF export
- ✅ Batch PDF export (up to 10 docs for Pro, unlimited for Enterprise)
- ✅ CSV export for search results metadata
- ✅ JSON export for structured data
- ✅ Markdown export with annotations
- ✅ Annotation inclusion (highlights and notes)
- ✅ Watermarking (Enterprise only)
- ✅ Export queue for large batches
- ✅ Export history and management
- ✅ Tier-based access control

### Performance Targets
- Single document PDF export: < 2s
- Batch export (10 docs): < 10s
- CSV export: < 1s
- Export queue processing: Asynchronous

## Architecture

### Components

1. **Database Layer** (`migrations/008_export_system.sql`)
   - `export_jobs` table for job tracking
   - `export_stats` table for analytics
   - RLS policies for security
   - Automatic cleanup of old jobs

2. **Service Layer** (`lib/export/export-service.ts`)
   - Export job creation and management
   - Format-specific export handlers
   - Tier permission checking
   - Job status polling

3. **API Layer**
   - `/api/export/pdf` - Single PDF generation
   - `/api/export/pdf/batch` - Batch PDF generation
   - `/api/export/csv` - CSV generation
   - `/api/export/jobs` - Job management
   - `/api/export/jobs/[id]` - Individual job operations

4. **UI Components**
   - `ExportDialog` - Export configuration dialog
   - `ExportHistory` - Export history viewer
   - Export buttons in search results and document viewer

## Installation

### 1. Install Dependencies

```bash
cd kb-portal
npm install pdfkit @types/pdfkit date-fns
```

### 2. Apply Database Migration

```bash
# Using Supabase CLI
supabase db push

# Or apply manually via Supabase Dashboard
# Copy contents of migrations/008_export_system.sql
```

### 3. Create Storage Bucket

```sql
-- Create exports bucket in Supabase Storage
INSERT INTO storage.buckets (id, name, public)
VALUES ('exports', 'exports', true);

-- Set up RLS policies
CREATE POLICY "Users can upload their own exports"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'exports' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can read their own exports"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'exports' AND auth.uid()::text = (storage.foldername(name))[1]);
```

### 4. Update Tier Limits

Ensure tier limits include export permissions:

```sql
UPDATE tier_limits
SET export_enabled = true
WHERE tier IN ('pro', 'enterprise');

UPDATE tier_limits
SET export_enabled = false
WHERE tier = 'free';
```

## Usage

### Single Document Export

```typescript
import { exportService } from '@/lib/export/export-service';

// Export single document as PDF
const { data: job, error } = await exportService.createExportJob(
  ['document-id'],
  'single_pdf',
  {
    includeAnnotations: true,
    includeWatermark: false,
  }
);

// Poll for completion
const { data: completedJob } = await exportService.getExportJob(job.id);
if (completedJob.status === 'completed') {
  await exportService.downloadExport(job.id);
}
```

### Batch Export

```typescript
// Export multiple documents as batch PDF
const { data: job, error } = await exportService.createExportJob(
  ['doc-1', 'doc-2', 'doc-3'],
  'batch_pdf',
  {
    includeAnnotations: true,
    includeWatermark: true,
    watermarkText: 'CONFIDENTIAL',
  }
);
```

### CSV Export

```typescript
// Export search results as CSV
const { data: job, error } = await exportService.createExportJob(
  documentIds,
  'csv',
  {}
);
```

### Using Export Dialog Component

```tsx
import { ExportDialog } from '@/components/export/ExportDialog';

function SearchResults() {
  const [showExport, setShowExport] = useState(false);
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);

  return (
    <>
      <Button onClick={() => setShowExport(true)}>
        Export Selected
      </Button>

      <ExportDialog
        open={showExport}
        onOpenChange={setShowExport}
        documentIds={selectedDocs}
        userTier="pro"
      />
    </>
  );
}
```

## Tier Restrictions

### Free Tier
- ❌ No export functionality
- Must upgrade to Pro or Enterprise

### Pro Tier
- ✅ Single document PDF export
- ✅ Batch PDF export (up to 10 documents)
- ✅ CSV export
- ✅ JSON export
- ✅ Markdown export
- ✅ Annotation inclusion
- ❌ No watermarking

### Enterprise Tier
- ✅ All Pro features
- ✅ Unlimited batch export
- ✅ Watermarking support
- ✅ Priority processing
- ✅ Custom export formats (on request)

## Export Formats

### PDF Export

**Features:**
- Professional formatting with headers and footers
- Metadata display (domain, type, source, date)
- Annotation rendering (highlights with colors, notes)
- Watermark support (Enterprise)
- Page numbers and export timestamp

**Performance:**
- Single document: < 2s
- Batch (10 docs): < 10s

### CSV Export

**Features:**
- Metadata-only export
- Includes: ID, title, domain, type, source, date, relevance score, URL, summary
- Compatible with Excel and Google Sheets

**Performance:**
- Any size: < 1s

### JSON Export

**Features:**
- Complete document data
- Structured format
- Includes annotations if requested
- Machine-readable

### Markdown Export

**Features:**
- Human-readable format
- Includes content and metadata
- Annotation rendering
- Compatible with documentation tools

## API Reference

### Create Export Job

```typescript
POST /api/export/jobs

Body:
{
  documentIds: string[];
  jobType: 'single_pdf' | 'batch_pdf' | 'csv' | 'json' | 'markdown';
  options: {
    includeAnnotations?: boolean;
    includeWatermark?: boolean;
    watermarkText?: string;
  };
}

Response:
{
  job: ExportJob;
}
```

### Get Export Job Status

```typescript
GET /api/export/jobs/[id]

Response:
{
  job: {
    id: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    output_url?: string;
    error_message?: string;
    // ... other fields
  };
}
```

### List User Export Jobs

```typescript
GET /api/export/jobs?limit=20

Response:
{
  jobs: ExportJob[];
}
```

## Testing

### Run Tests

```bash
cd kb-portal
npm run test tests/export.spec.ts
```

### Test Coverage

- ✅ Single document export
- ✅ Batch document export
- ✅ CSV export
- ✅ JSON export
- ✅ Markdown export
- ✅ Annotation inclusion
- ✅ Watermarking (Enterprise)
- ✅ Tier restrictions
- ✅ Export history
- ✅ Download functionality
- ✅ Error handling

## Monitoring

### Export Statistics

Query export statistics:

```sql
SELECT
  export_type,
  COUNT(*) as total_exports,
  AVG(document_count) as avg_documents,
  AVG(file_size) as avg_file_size,
  AVG(processing_time_ms) as avg_processing_time
FROM export_stats
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY export_type;
```

### Failed Exports

Monitor failed exports:

```sql
SELECT
  id,
  job_type,
  document_ids,
  error_message,
  created_at
FROM export_jobs
WHERE status = 'failed'
  AND created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;
```

## Troubleshooting

### Export Timeout

If exports are timing out:

1. Check Railway service logs
2. Verify Supabase Storage is accessible
3. Increase timeout in export service
4. Consider splitting large batches

### PDF Generation Errors

Common issues:

1. **Missing fonts**: Ensure pdfkit has access to system fonts
2. **Memory issues**: Reduce batch size or increase Railway memory
3. **Content too large**: Implement pagination for large documents

### Storage Upload Failures

1. Verify Supabase Storage bucket exists
2. Check RLS policies
3. Verify file size limits
4. Check storage quota

## Performance Optimization

### Tips for Fast Exports

1. **Use batch processing**: Export multiple documents in one job
2. **Async processing**: Don't wait for completion, poll status
3. **Cache frequently exported documents**: Store pre-generated PDFs
4. **Optimize PDF generation**: Use streaming for large documents
5. **CDN for downloads**: Use Supabase CDN for faster downloads

### Scaling Considerations

For high-volume exports:

1. Deploy dedicated export worker on Railway
2. Implement job queue with BullMQ
3. Use Redis for job status caching
4. Consider serverless functions for PDF generation
5. Implement rate limiting per tier

## Security

### Access Control

- RLS policies ensure users only access their exports
- Tier-based feature restrictions
- API key validation for all endpoints

### Data Protection

- Exports stored in user-specific folders
- Automatic cleanup after 7 days
- Watermarking for sensitive documents (Enterprise)
- Audit logging for all export operations

## Future Enhancements

- [ ] Email delivery of completed exports
- [ ] Scheduled exports
- [ ] Custom PDF templates
- [ ] Excel export format
- [ ] PowerPoint export format
- [ ] Bulk download as ZIP
- [ ] Export templates
- [ ] Export scheduling
- [ ] Export analytics dashboard

## Support

For issues or questions:
- Check logs in Railway dashboard
- Review Supabase Storage logs
- Contact support with export job ID
- Include error messages and timestamps
