# Export System - Quick Reference

## Quick Start

### Install
```bash
cd kb-portal
npm install pdfkit @types/pdfkit date-fns
```

### Setup
```bash
# Run setup script
./scripts/setup-export-system.sh

# Apply migration
supabase db push
```

## Usage Examples

### Single Document Export
```typescript
import { exportService } from '@/lib/export/export-service';

const { data: job } = await exportService.createExportJob(
  ['doc-id'],
  'single_pdf',
  { includeAnnotations: true }
);
```

### Batch Export
```typescript
const { data: job } = await exportService.createExportJob(
  ['doc-1', 'doc-2', 'doc-3'],
  'batch_pdf',
  { includeAnnotations: true }
);
```

### CSV Export
```typescript
const { data: job } = await exportService.createExportJob(
  documentIds,
  'csv',
  {}
);
```

### With Watermark (Enterprise)
```typescript
const { data: job } = await exportService.createExportJob(
  ['doc-id'],
  'single_pdf',
  {
    includeWatermark: true,
    watermarkText: 'CONFIDENTIAL'
  }
);
```

## UI Components

### Export Dialog
```tsx
import { ExportDialog } from '@/components/export/ExportDialog';

<ExportDialog
  open={showExport}
  onOpenChange={setShowExport}
  documentIds={selectedDocs}
  userTier="pro"
/>
```

### Export History
```tsx
import { ExportHistory } from '@/components/export/ExportHistory';

<ExportHistory />
```

## API Endpoints

### Create Export Job
```
POST /api/export/jobs
Body: { documentIds, jobType, options }
```

### Get Job Status
```
GET /api/export/jobs/[id]
```

### List Jobs
```
GET /api/export/jobs?limit=20
```

## Tier Limits

| Feature | Free | Pro | Enterprise |
|---------|------|-----|------------|
| Export | ❌ | ✅ | ✅ |
| Batch Size | - | 10 | Unlimited |
| Watermark | ❌ | ❌ | ✅ |
| Formats | - | All | All |

## Performance Targets

- Single PDF: < 2s
- Batch (10 docs): < 10s
- CSV: < 1s
- JSON: < 1s
- Markdown: < 2s

## Formats Supported

- **PDF**: Single or batch with annotations
- **CSV**: Metadata only
- **JSON**: Complete structured data
- **Markdown**: Human-readable with annotations

## Common Issues

### Export Timeout
- Reduce batch size
- Check Railway logs
- Verify Supabase Storage

### PDF Generation Error
- Check pdfkit installation
- Verify content size
- Check memory limits

### Storage Upload Failed
- Verify bucket exists
- Check RLS policies
- Verify storage quota

## Testing

```bash
# Run all export tests
npm run test tests/export.spec.ts

# Run specific test
npm run test tests/export.spec.ts -g "single document"
```

## Monitoring

### Check Export Stats
```sql
SELECT export_type, COUNT(*), AVG(processing_time_ms)
FROM export_stats
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY export_type;
```

### Check Failed Exports
```sql
SELECT * FROM export_jobs
WHERE status = 'failed'
ORDER BY created_at DESC
LIMIT 10;
```

## Files Reference

### Core Files
- `lib/export/export-service.ts` - Main service
- `lib/export/types.ts` - Type definitions
- `components/export/ExportDialog.tsx` - Export UI
- `components/export/ExportHistory.tsx` - History UI

### API Routes
- `app/api/export/pdf/route.ts` - Single PDF
- `app/api/export/pdf/batch/route.ts` - Batch PDF
- `app/api/export/csv/route.ts` - CSV export
- `app/api/export/jobs/route.ts` - Job management

### Database
- `database/migrations/008_export_system.sql` - Migration

### Documentation
- `EXPORT_SYSTEM_GUIDE.md` - Complete guide
- `TASK_043_VERIFICATION_CHECKLIST.md` - Checklist
- `TASK_043_COMPLETION_REPORT.md` - Report

## Support

For detailed information, see:
- **Full Guide**: EXPORT_SYSTEM_GUIDE.md
- **Verification**: TASK_043_VERIFICATION_CHECKLIST.md
- **Completion Report**: TASK_043_COMPLETION_REPORT.md
