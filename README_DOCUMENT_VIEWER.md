# Document Viewer - Quick Reference

## Overview

The NABLA KB Portal Document Viewer provides a comprehensive interface for viewing regulatory documents in PDF, HTML, and Markdown formats with advanced features like search, navigation, and bookmarking.

## Quick Links

- **User Guide**: [DOCUMENT_VIEWER_GUIDE.md](./DOCUMENT_VIEWER_GUIDE.md)
- **Installation**: [DOCUMENT_VIEWER_INSTALLATION.md](./DOCUMENT_VIEWER_INSTALLATION.md)
- **Completion Report**: [TASK_041_COMPLETION_REPORT.md](./TASK_041_COMPLETION_REPORT.md)
- **Verification Checklist**: [TASK_041_VERIFICATION_CHECKLIST.md](./TASK_041_VERIFICATION_CHECKLIST.md)

## Features at a Glance

✅ **Multi-Format Support**: PDF, HTML, Markdown
✅ **Page Navigation**: Previous/Next/Direct input
✅ **Zoom Controls**: 50% - 300% with smooth transitions
✅ **In-Document Search**: Full-text search with highlighting
✅ **Table of Contents**: Hierarchical navigation
✅ **Metadata Display**: Complete document information
✅ **Bookmarking**: Save pages with notes
✅ **Download**: Export documents
✅ **View Tracking**: Analytics and usage tracking
✅ **Responsive Design**: Works on all screen sizes
✅ **Dark Mode**: Full dark mode support

## Quick Start

### Installation

```bash
# Install dependencies
cd kb-portal
npm install

# Apply database migration
# (Run 006_document_viewer.sql in Supabase)

# Start development server
npm run dev
```

### Usage

```typescript
// Navigate to document viewer
router.push(`/documents/${documentId}`);

// Or use direct link
<Link href={`/documents/${documentId}`}>View Document</Link>
```

### Testing

```bash
# Run all tests
npm run test

# Run document viewer tests only
npx playwright test tests/document-viewer.spec.ts
```

## Architecture

```
kb-portal/
├── src/
│   ├── components/documents/
│   │   ├── DocumentViewer.tsx          # Main component
│   │   ├── PDFViewer.tsx               # PDF rendering
│   │   ├── HTMLViewer.tsx              # HTML rendering
│   │   ├── MarkdownViewer.tsx          # Markdown rendering
│   │   ├── ViewerControls.tsx          # Toolbar controls
│   │   ├── TableOfContents.tsx         # TOC navigation
│   │   └── DocumentMetadataPanel.tsx   # Metadata display
│   ├── lib/documents/
│   │   ├── types.ts                    # Type definitions
│   │   └── document-service.ts         # Business logic
│   ├── app/
│   │   ├── documents/[id]/page.tsx     # Document page
│   │   └── api/documents/              # API routes
│   └── ...
├── database/migrations/
│   └── 006_document_viewer.sql         # Database schema
├── tests/
│   └── document-viewer.spec.ts         # Playwright tests
└── ...
```

## Key Components

### DocumentViewer
Main orchestrator component that manages state and coordinates all sub-components.

### PDFViewer
Renders PDF documents using react-pdf with full text layer support.

### HTMLViewer
Displays HTML content with XSS protection and search highlighting.

### MarkdownViewer
Renders Markdown with GitHub Flavored Markdown and syntax highlighting.

### ViewerControls
Provides toolbar with page navigation, zoom, search, bookmark, and download controls.

### TableOfContents
Hierarchical navigation sidebar with expandable sections.

### DocumentMetadataPanel
Displays comprehensive document information and metadata.

## API Endpoints

- `GET /api/documents/[id]` - Get document metadata
- `GET /api/documents/[id]/content` - Download document content
- `GET /api/documents/[id]/bookmarks` - Get user bookmarks
- `POST /api/documents/[id]/bookmarks` - Create bookmark
- `DELETE /api/documents/[id]/bookmarks` - Delete bookmark

## Database Tables

- `document_metadata` - Document information and metadata
- `document_views` - View tracking and analytics
- `document_bookmarks` - User bookmarks with notes

## Dependencies

- `react-pdf@9.1.0` - PDF rendering
- `pdfjs-dist@4.4.168` - PDF.js library
- `react-markdown@9.0.1` - Markdown rendering
- `remark-gfm@4.0.0` - GitHub Flavored Markdown
- `rehype-highlight@7.0.0` - Syntax highlighting

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## Performance

- PDF Load: < 2s
- Page Navigation: < 100ms
- Search: < 500ms (100-page docs)
- Zoom: Smooth 60fps

## Security

- Authentication required
- Row Level Security (RLS)
- XSS protection
- CSRF protection
- Secure file paths

## Testing

18 comprehensive Playwright tests covering:
- Document loading (all formats)
- Navigation and zoom
- Search functionality
- Table of contents
- Metadata display
- Bookmarking
- Download
- Error handling

## Common Tasks

### View a Document
```typescript
// In your component
<Link href={`/documents/${doc.document_id}`}>
  {doc.title}
</Link>
```

### Add a Document
```typescript
// Upload to storage
const { data } = await supabase.storage
  .from('documents')
  .upload(path, file);

// Create metadata
await supabase.from('document_metadata').insert({
  document_id: 'unique-id',
  title: 'Document Title',
  content_type: 'pdf',
  storage_path: path,
  // ... other fields
});
```

### Get View Analytics
```sql
SELECT 
  d.title,
  COUNT(v.id) as view_count,
  AVG(v.view_duration) as avg_duration
FROM document_metadata d
LEFT JOIN document_views v ON d.document_id = v.document_id
GROUP BY d.id, d.title
ORDER BY view_count DESC;
```

## Troubleshooting

### PDF Not Loading
- Check PDF.js worker configuration
- Verify storage path
- Check browser console

### Search Not Working
- Ensure PDF has text layer
- Verify document is loaded
- Check search query

### Slow Performance
- Optimize PDF file size
- Use production build
- Check network connection

## Support

For detailed information, see:
- [Complete User Guide](./DOCUMENT_VIEWER_GUIDE.md)
- [Installation Guide](./DOCUMENT_VIEWER_INSTALLATION.md)
- [Completion Report](./TASK_041_COMPLETION_REPORT.md)

## Status

✅ **Complete** - Ready for production use

**Version**: 1.0.0
**Date**: 2025-01-16
**Requirement**: 26.9
