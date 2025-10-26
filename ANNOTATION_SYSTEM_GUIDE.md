# Annotation System Implementation Guide

## Overview

The annotation system provides Pro and Enterprise users with powerful tools to highlight text, add notes, and share annotations. This guide covers the complete implementation including database schema, services, UI components, and testing.

## Features

### Pro Tier Features
- ✅ Text highlighting with 5 color options (yellow, green, blue, pink, purple)
- ✅ Note-taking (attached to highlights or standalone)
- ✅ Annotation panel with filtering
- ✅ Export annotations (Markdown and JSON)
- ✅ Persistent storage across sessions
- ✅ Page-specific annotations

### Enterprise Tier Features
- ✅ All Pro features
- ✅ Annotation sharing with team members
- ✅ Permission management (view/edit)
- ✅ Share via email
- ✅ Shared annotation management

## Architecture

### Database Schema

```sql
-- Highlights table
document_highlights
  - id (UUID, PK)
  - document_id (TEXT, FK)
  - user_id (UUID, FK)
  - page_number (INTEGER)
  - selection_text (TEXT)
  - color (TEXT)
  - position (JSONB)
  - created_at, updated_at (TIMESTAMPTZ)

-- Notes table
document_notes
  - id (UUID, PK)
  - document_id (TEXT, FK)
  - user_id (UUID, FK)
  - highlight_id (UUID, FK, optional)
  - page_number (INTEGER)
  - position (JSONB, optional)
  - content (TEXT)
  - created_at, updated_at (TIMESTAMPTZ)

-- Shares table (Enterprise only)
annotation_shares
  - id (UUID, PK)
  - annotation_id (UUID)
  - annotation_type (TEXT: 'highlight' | 'note')
  - owner_id (UUID, FK)
  - shared_with_user_id (UUID, FK, optional)
  - shared_with_email (TEXT, optional)
  - permission (TEXT: 'view' | 'edit')
  - created_at (TIMESTAMPTZ)
```

### Services

#### AnnotationService (`annotation-service.ts`)

Main service for managing annotations:

```typescript
// Highlights
createHighlight(documentId, text, color, position, page?)
getHighlights(documentId, page?)
updateHighlightColor(highlightId, color)
deleteHighlight(highlightId)

// Notes
createNote(documentId, content, options?)
getNotes(documentId, page?)
updateNote(noteId, content)
deleteNote(noteId)

// Sharing (Enterprise only)
shareAnnotation(annotationId, type, shareWith, permission)
getAnnotationShares(annotationId)
removeShare(shareId)

// Export
exportAnnotations(documentId, title)
exportAsJSON(documentId, title)
exportAsMarkdown(documentId, title)
downloadExport(content, filename, format)
```

### Components

#### AnnotationToolbar
- Highlight button with color picker
- Note button
- Share button (Enterprise only)
- Export button
- Clear all button
- Annotation count display
- Tier-based access control

#### AnnotationPanel
- Filter tabs (All, Highlights, Notes)
- Annotation list with previews
- Edit/delete actions
- Share actions (Enterprise only)
- Click to navigate to page

#### ShareAnnotationDialog (Enterprise)
- Email input for sharing
- Permission selection (view/edit)
- Existing shares list
- Remove share functionality

#### ExportAnnotationsDialog
- Format selection (Markdown/JSON)
- Export preview
- Download functionality

## Usage

### For Developers

#### 1. Apply Database Migration

```bash
cd kb-portal
# Apply migration 007
psql $DATABASE_URL -f database/migrations/007_annotations.sql
```

#### 2. Update Document Viewer

The DocumentViewer component now accepts a `userTier` prop:

```typescript
<DocumentViewer 
  documentId="doc-123" 
  userTier={user.tier} // 'free' | 'pro' | 'enterprise'
/>
```

#### 3. API Routes

Annotation API routes are available at:
- `GET/POST /api/documents/[id]/annotations/highlights`
- `GET/POST /api/documents/[id]/annotations/notes`

### For Users

#### Creating Highlights

1. Click the "Highlight" button in the toolbar
2. Select a color from the color picker
3. Select text in the document
4. The highlight is automatically saved

#### Adding Notes

1. Click the "Note" button in the toolbar
2. Click where you want to add the note
3. Enter your note content
4. The note is automatically saved

Or attach a note to a highlight:
1. Create a highlight first
2. Click on the highlight in the annotation panel
3. Add a note in the note field

#### Managing Annotations

1. Click the annotations icon (speech bubble) to open the panel
2. Use filter tabs to view specific types
3. Click an annotation to navigate to its page
4. Use edit/delete buttons to manage annotations

#### Sharing (Enterprise Only)

1. Click the "Share" button in the toolbar
2. Enter the email address of the person to share with
3. Select permission level (view or edit)
4. Click "Share"

#### Exporting Annotations

1. Click the "Export" button in the toolbar
2. Choose format (Markdown or JSON)
3. Click "Export" to download

## Export Formats

### Markdown Format

```markdown
# Annotations for Document Title

Exported: 2025-01-16 10:30:00

## Highlights

### 1. Page 5 (yellow)

> Selected text from the document

**Note:** Optional note attached to highlight

### 2. Page 7 (blue)

> Another highlighted section

## Notes

### 1. Page 3

Standalone note content
```

### JSON Format

```json
{
  "document_title": "Document Title",
  "document_id": "doc-123",
  "export_date": "2025-01-16T10:30:00Z",
  "highlights": [
    {
      "page": 5,
      "text": "Selected text",
      "color": "yellow",
      "note": "Optional note"
    }
  ],
  "notes": [
    {
      "page": 3,
      "content": "Standalone note"
    }
  ]
}
```

## Testing

### Running Tests

```bash
cd kb-portal
npm run test:e2e -- annotations.spec.ts
```

### Test Coverage

- ✅ Annotation toolbar visibility (tier-based)
- ✅ Highlight creation
- ✅ Note creation
- ✅ Annotation panel display
- ✅ Filtering by type
- ✅ Export (Markdown and JSON)
- ✅ Sharing (Enterprise only)
- ✅ Deletion
- ✅ Persistence across reloads
- ✅ Navigation to annotation page

## Security

### Row Level Security (RLS)

All annotation tables have RLS policies:
- Users can only view/edit their own annotations
- Shared annotations are accessible based on share permissions
- Enterprise tier required for sharing functionality

### Tier Verification

All annotation operations verify user tier:
- Pro/Enterprise required for creating annotations
- Enterprise required for sharing
- Free users see upgrade prompt

## Performance Considerations

### Indexing

Indexes are created for:
- `document_id` (fast lookup by document)
- `user_id` (fast lookup by user)
- `page_number` (fast page-specific queries)
- `highlight_id` (fast note-to-highlight lookup)

### Optimization Tips

1. Load annotations per page when possible
2. Use pagination for large annotation sets
3. Cache annotation counts
4. Debounce annotation updates

## Troubleshooting

### Annotations Not Showing

1. Check user tier (Pro/Enterprise required)
2. Verify database migration applied
3. Check browser console for errors
4. Verify Supabase RLS policies

### Sharing Not Working

1. Verify user is Enterprise tier
2. Check email address is valid
3. Verify share permissions in database
4. Check RLS policies for annotation_shares table

### Export Failing

1. Check annotation count > 0
2. Verify document metadata exists
3. Check browser download permissions
4. Verify export service methods

## Future Enhancements

Potential improvements:
- [ ] Annotation templates
- [ ] Bulk operations
- [ ] Annotation search
- [ ] Collaborative editing
- [ ] Version history
- [ ] Mobile app support
- [ ] PDF annotation rendering
- [ ] Annotation analytics

## Support

For issues or questions:
1. Check this guide
2. Review test cases
3. Check Supabase logs
4. Contact support team

