# Annotation System - Quick Reference

## For Developers

### Service Usage

```typescript
import { annotationService } from '@/lib/documents/annotation-service';

// Create highlight
const { data, error } = await annotationService.createHighlight(
  documentId,
  'Selected text',
  'yellow',
  { start: { x: 0, y: 0 }, end: { x: 100, y: 20 }, rects: [] },
  pageNumber
);

// Create note
const { data, error } = await annotationService.createNote(
  documentId,
  'My note content',
  { pageNumber: 5 }
);

// Export annotations
const markdown = await annotationService.exportAsMarkdown(documentId, title);
annotationService.downloadExport(markdown, 'annotations', 'md');
```

### Component Integration

```typescript
import { DocumentViewer } from '@/components/documents/DocumentViewer';

<DocumentViewer 
  documentId="doc-123" 
  userTier={user.tier} // 'free' | 'pro' | 'enterprise'
/>
```

### API Endpoints

```bash
# Get highlights
GET /api/documents/{id}/annotations/highlights?page=5

# Create highlight
POST /api/documents/{id}/annotations/highlights
{
  "selection_text": "Text",
  "color": "yellow",
  "position": {...},
  "page_number": 5
}

# Get notes
GET /api/documents/{id}/annotations/notes?page=5

# Create note
POST /api/documents/{id}/annotations/notes
{
  "content": "My note",
  "page_number": 5
}
```

## For Users

### Creating Highlights
1. Click "Highlight" button
2. Select color
3. Select text in document
4. Highlight saved automatically

### Adding Notes
1. Click "Note" button
2. Click location or highlight
3. Enter note content
4. Note saved automatically

### Exporting
1. Click "Export" button
2. Choose format (Markdown/JSON)
3. Click "Export" to download

### Sharing (Enterprise)
1. Click "Share" button
2. Enter email address
3. Select permission (view/edit)
4. Click "Share"

## Tier Features

| Feature | Free | Pro | Enterprise |
|---------|------|-----|------------|
| Highlights | ❌ | ✅ | ✅ |
| Notes | ❌ | ✅ | ✅ |
| Export | ❌ | ✅ | ✅ |
| Sharing | ❌ | ❌ | ✅ |

## Color Options

- 🟨 Yellow (default)
- 🟩 Green
- 🟦 Blue
- 🟪 Pink
- 🟪 Purple

## Keyboard Shortcuts (Future)

- `H` - Toggle highlight mode
- `N` - Toggle note mode
- `E` - Export annotations
- `Esc` - Exit mode

## Troubleshooting

### Annotations not showing?
- Check user tier (Pro/Enterprise required)
- Verify database migration applied
- Check browser console for errors

### Can't share?
- Verify Enterprise tier
- Check email address format
- Verify share permissions

### Export failing?
- Check annotation count > 0
- Verify document metadata
- Check browser download permissions

## Database Schema

```sql
-- Highlights
document_highlights (
  id, document_id, user_id, page_number,
  selection_text, color, position,
  created_at, updated_at
)

-- Notes
document_notes (
  id, document_id, user_id, highlight_id,
  page_number, position, content,
  created_at, updated_at
)

-- Shares (Enterprise)
annotation_shares (
  id, annotation_id, annotation_type,
  owner_id, shared_with_user_id,
  shared_with_email, permission,
  created_at
)
```

## Testing

```bash
# Run annotation tests
npm run test:e2e -- annotations.spec.ts

# Run specific test
npm run test:e2e -- annotations.spec.ts -g "should create a highlight"
```

## Support

- 📖 Full Guide: `ANNOTATION_SYSTEM_GUIDE.md`
- ✅ Completion Report: `TASK_042_COMPLETION_REPORT.md`
- 📋 Verification: `TASK_042_VERIFICATION_CHECKLIST.md`

