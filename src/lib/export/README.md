# Export System

Comprehensive document export functionality for KB Portal with multi-format support, batch processing, and Enterprise features.

## Features

- 📄 **PDF Export**: Single and batch documents with professional formatting
- 📊 **CSV Export**: Search results metadata for analysis
- 📋 **JSON Export**: Structured data for integration
- 📝 **Markdown Export**: Human-readable format with annotations
- 🎨 **Annotations**: Include highlights and notes in exports
- 🔒 **Watermarking**: Enterprise-only document watermarking
- ⚡ **Batch Processing**: Export multiple documents efficiently
- 📈 **Export History**: Track and manage all exports
- 🎯 **Tier-Based Access**: Free, Pro, and Enterprise tiers

## Quick Start

### Installation

```bash
npm install pdfkit @types/pdfkit date-fns
```

### Basic Usage

```typescript
import { exportService } from '@/lib/export/export-service';

// Export single document as PDF
const { data: job, error } = await exportService.createExportJob(
  ['document-id'],
  'single_pdf',
  {
    includeAnnotations: true,
  }
);

// Check job status
const { data: completedJob } = await exportService.getExportJob(job.id);

// Download when complete
if (completedJob.status === 'completed') {
  await exportService.downloadExport(job.id);
}
```

## Export Formats

### PDF Export

Professional PDF generation with:
- Document metadata
- Table of contents (batch)
- Annotations (highlights and notes)
- Watermarks (Enterprise)
- Page numbers and footers

```typescript
// Single document
await exportService.createExportJob(['doc-id'], 'single_pdf', {
  includeAnnotations: true,
});

// Batch documents
await exportService.createExportJob(
  ['doc-1', 'doc-2', 'doc-3'],
  'batch_pdf',
  {
    includeAnnotations: true,
    includeWatermark: true, // Enterprise only
    watermarkText: 'CONFIDENTIAL',
  }
);
```

### CSV Export

Export search results metadata:

```typescript
await exportService.createExportJob(documentIds, 'csv', {});
```

Includes:
- Document ID
- Title
- Domain
- Document type
- Source
- Published date
- Relevance score
- URL
- Summary

### JSON Export

Structured data export:

```typescript
await exportService.createExportJob(documentIds, 'json', {
  includeAnnotations: true,
});
```

### Markdown Export

Human-readable format:

```typescript
await exportService.createExportJob(documentIds, 'markdown', {
  includeAnnotations: true,
});
```

## UI Components

### ExportDialog

```tsx
import { ExportDialog } from '@/components/export/ExportDialog';

function MyComponent() {
  const [showExport, setShowExport] = useState(false);
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);

  return (
    <>
      <Button onClick={() => setShowExport(true)}>
        Export Documents
      </Button>

      <ExportDialog
        open={showExport}
        onOpenChange={setShowExport}
        documentIds={selectedDocs}
        documentTitles={['Doc 1', 'Doc 2']}
        userTier="pro"
      />
    </>
  );
}
```

### ExportHistory

```tsx
import { ExportHistory } from '@/components/export/ExportHistory';

function ExportsPage() {
  return (
    <div>
      <h1>My Exports</h1>
      <ExportHistory />
    </div>
  );
}
```

## Tier Restrictions

### Free Tier
- ❌ No export functionality
- Must upgrade to Pro or Enterprise

### Pro Tier ($49/month)
- ✅ Single document PDF export
- ✅ Batch PDF export (max 10 documents)
- ✅ CSV, JSON, Markdown export
- ✅ Annotation inclusion
- ❌ No watermarking

### Enterprise Tier ($299/month)
- ✅ All Pro features
- ✅ Unlimited batch export
- ✅ Watermarking support
- ✅ Custom watermark text
- ✅ Priority processing

## API Reference

### ExportService

#### createExportJob()

Create a new export job.

```typescript
async createExportJob(
  documentIds: string[],
  jobType: ExportJobType,
  options?: ExportOptions
): Promise<{ data: ExportJob | null; error: string | null }>
```

**Parameters:**
- `documentIds`: Array of document IDs to export
- `jobType`: Type of export ('single_pdf', 'batch_pdf', 'csv', 'json', 'markdown')
- `options`: Export options (annotations, watermark, etc.)

**Returns:**
- `data`: Created export job
- `error`: Error message if failed

#### getExportJob()

Get export job status.

```typescript
async getExportJob(
  jobId: string
): Promise<{ data: ExportJob | null; error: string | null }>
```

#### getUserExportJobs()

Get user's export history.

```typescript
async getUserExportJobs(
  limit?: number
): Promise<{ data: ExportJob[]; error: string | null }>
```

#### downloadExport()

Download completed export.

```typescript
async downloadExport(jobId: string): Promise<void>
```

## Types

### ExportJobType

```typescript
type ExportJobType = 'single_pdf' | 'batch_pdf' | 'csv' | 'json' | 'markdown';
```

### ExportJobStatus

```typescript
type ExportJobStatus = 'pending' | 'processing' | 'completed' | 'failed';
```

### ExportOptions

```typescript
interface ExportOptions {
  includeAnnotations?: boolean;
  includeWatermark?: boolean;
  watermarkText?: string;
  format?: 'pdf' | 'csv' | 'json' | 'markdown';
}
```

### ExportJob

```typescript
interface ExportJob {
  id: string;
  user_id: string;
  job_type: ExportJobType;
  status: ExportJobStatus;
  document_ids: string[];
  include_annotations: boolean;
  include_watermark: boolean;
  watermark_text?: string;
  output_url?: string;
  file_size?: number;
  error_message?: string;
  created_at: string;
  updated_at: string;
}
```

## Performance

### Targets

- Single PDF: < 2s
- Batch (10 docs): < 10s
- CSV: < 1s
- JSON: < 1s
- Markdown: < 2s

### Optimization Tips

1. Use batch processing for multiple documents
2. Don't wait for completion, poll status
3. Cache frequently exported documents
4. Use streaming for large documents
5. Leverage Supabase CDN for downloads

## Error Handling

```typescript
const { data: job, error } = await exportService.createExportJob(
  documentIds,
  'single_pdf',
  options
);

if (error) {
  // Handle error
  console.error('Export failed:', error);
  return;
}

// Poll for completion
const pollStatus = async () => {
  const { data: updatedJob } = await exportService.getExportJob(job.id);
  
  if (updatedJob.status === 'completed') {
    await exportService.downloadExport(job.id);
  } else if (updatedJob.status === 'failed') {
    console.error('Export failed:', updatedJob.error_message);
  } else {
    // Still processing, poll again
    setTimeout(pollStatus, 1000);
  }
};

pollStatus();
```

## Testing

```bash
# Run export tests
npm run test tests/export.spec.ts

# Run specific test
npm run test tests/export.spec.ts -g "single document"
```

## Troubleshooting

### Export Timeout

If exports are timing out:
1. Check Railway service logs
2. Verify Supabase Storage is accessible
3. Reduce batch size
4. Check document content size

### PDF Generation Errors

Common issues:
1. Missing fonts: Ensure pdfkit has access to system fonts
2. Memory issues: Increase Railway memory allocation
3. Content too large: Implement pagination

### Storage Upload Failures

1. Verify Supabase Storage bucket exists
2. Check RLS policies
3. Verify file size limits
4. Check storage quota

## Documentation

- **Full Guide**: `../../EXPORT_SYSTEM_GUIDE.md`
- **Quick Reference**: `../../EXPORT_QUICK_REFERENCE.md`
- **Verification**: `../../TASK_043_VERIFICATION_CHECKLIST.md`
- **Completion Report**: `../../TASK_043_COMPLETION_REPORT.md`

## Support

For issues or questions:
- Check Railway logs
- Review Supabase Storage logs
- See troubleshooting guide
- Contact support with job ID
