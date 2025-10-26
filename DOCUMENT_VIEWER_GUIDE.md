# Document Viewer Guide

## Overview

The Document Viewer provides a comprehensive interface for viewing and interacting with regulatory documents in PDF, HTML, and Markdown formats. It includes features like table of contents navigation, in-document search, zoom controls, bookmarking, and metadata display.

## Features

### 1. Multi-Format Support

- **PDF Documents**: Full PDF rendering with page navigation
- **HTML Documents**: Rendered HTML with styling preservation
- **Markdown Documents**: Rendered Markdown with syntax highlighting for code blocks

### 2. Navigation

- **Page Navigation**: Previous/Next buttons and direct page input
- **Table of Contents**: Hierarchical navigation with page numbers
- **Bookmarks**: Save and navigate to specific pages with notes

### 3. Search

- **In-Document Search**: Find text across all pages
- **Search Results Navigation**: Navigate through search results
- **Highlighting**: Visual highlighting of search terms

### 4. Zoom Controls

- **Zoom In/Out**: Adjust document size from 50% to 300%
- **Responsive**: Automatically adjusts to container width
- **Smooth Transitions**: Animated zoom changes

### 5. Metadata Display

- **Document Information**: Title, author, domain, dates
- **File Details**: Type, size, page count
- **Source Information**: Original source URL
- **Additional Metadata**: Custom metadata fields

### 6. User Features

- **Bookmarking**: Add bookmarks with optional notes
- **Download**: Download documents for offline viewing
- **View Tracking**: Automatic tracking of view duration and pages viewed
- **Responsive Design**: Works on desktop and tablet devices

## Usage

### Viewing a Document

```typescript
// Navigate to document viewer
router.push(`/documents/${documentId}`);
```

### Using the Document Service

```typescript
import { documentService } from '@/lib/documents/document-service';

// Get document metadata
const metadata = await documentService.getDocument(documentId);

// Get document content
const content = await documentService.getDocumentContent(metadata.storage_path);

// Add bookmark
await documentService.addBookmark(documentId, pageNumber, 'My note');

// Get bookmarks
const bookmarks = await documentService.getBookmarks(documentId);

// Search documents
const results = await documentService.searchDocuments('query', {
  domain: 'gdpr',
  contentType: 'pdf'
});
```

## Components

### DocumentViewer

Main component that orchestrates all viewer functionality.

```typescript
<DocumentViewer documentId="doc-123" />
```

### PDFViewer

Renders PDF documents using react-pdf.

```typescript
<PDFViewer
  file={pdfBlob}
  currentPage={1}
  zoom={1.0}
  searchQuery="compliance"
  onPageChange={(page) => console.log(page)}
  onTotalPagesChange={(total) => console.log(total)}
  onSearchResults={(results) => console.log(results)}
/>
```

### HTMLViewer

Renders HTML documents with search highlighting.

```typescript
<HTMLViewer
  content={htmlString}
  searchQuery="regulation"
  zoom={1.0}
/>
```

### MarkdownViewer

Renders Markdown documents with syntax highlighting.

```typescript
<MarkdownViewer
  content={markdownString}
  searchQuery="compliance"
  zoom={1.0}
/>
```

### ViewerControls

Toolbar with navigation, zoom, and search controls.

```typescript
<ViewerControls
  currentPage={1}
  totalPages={10}
  zoom={1.0}
  searchQuery=""
  onPageChange={(page) => {}}
  onZoomChange={(zoom) => {}}
  onSearchChange={(query) => {}}
  onBookmark={() => {}}
  onDownload={() => {}}
/>
```

### TableOfContents

Hierarchical navigation sidebar.

```typescript
<TableOfContents
  items={tocItems}
  currentPage={1}
  onNavigate={(page) => {}}
/>
```

### DocumentMetadataPanel

Displays document information and metadata.

```typescript
<DocumentMetadataPanel metadata={documentMetadata} />
```

## Database Schema

### document_metadata

Stores document information and metadata.

```sql
CREATE TABLE document_metadata (
  id UUID PRIMARY KEY,
  document_id TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  content_type TEXT NOT NULL,
  file_size BIGINT,
  page_count INTEGER,
  author TEXT,
  created_date TIMESTAMPTZ,
  modified_date TIMESTAMPTZ,
  domain TEXT,
  source_url TEXT,
  storage_path TEXT NOT NULL,
  thumbnail_url TEXT,
  table_of_contents JSONB,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### document_views

Tracks document viewing activity.

```sql
CREATE TABLE document_views (
  id UUID PRIMARY KEY,
  document_id TEXT NOT NULL,
  user_id UUID NOT NULL,
  view_duration INTEGER,
  pages_viewed INTEGER[],
  last_page INTEGER,
  search_queries TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### document_bookmarks

Stores user bookmarks.

```sql
CREATE TABLE document_bookmarks (
  id UUID PRIMARY KEY,
  document_id TEXT NOT NULL,
  user_id UUID NOT NULL,
  page_number INTEGER,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(document_id, user_id, page_number)
);
```

## API Routes

### GET /api/documents/[id]

Get document metadata.

**Response:**
```json
{
  "id": "uuid",
  "document_id": "doc-123",
  "title": "GDPR Regulation",
  "content_type": "pdf",
  "page_count": 88,
  "domain": "gdpr",
  "storage_path": "documents/gdpr/regulation.pdf",
  "table_of_contents": [...]
}
```

### GET /api/documents/[id]/content

Download document content.

**Response:** Binary file data with appropriate Content-Type header.

### GET /api/documents/[id]/bookmarks

Get user's bookmarks for a document.

**Response:**
```json
[
  {
    "id": "uuid",
    "document_id": "doc-123",
    "user_id": "user-uuid",
    "page_number": 5,
    "note": "Important section",
    "created_at": "2025-01-16T10:00:00Z"
  }
]
```

### POST /api/documents/[id]/bookmarks

Create a new bookmark.

**Request:**
```json
{
  "page_number": 5,
  "note": "Important section"
}
```

**Response:**
```json
{
  "id": "uuid",
  "document_id": "doc-123",
  "user_id": "user-uuid",
  "page_number": 5,
  "note": "Important section",
  "created_at": "2025-01-16T10:00:00Z"
}
```

### DELETE /api/documents/[id]/bookmarks?bookmarkId=uuid

Delete a bookmark.

**Response:**
```json
{
  "success": true
}
```

## Testing

Run Playwright tests:

```bash
npm run test
```

Run specific test file:

```bash
npx playwright test tests/document-viewer.spec.ts
```

Run tests in headed mode:

```bash
npm run test:headed
```

## Keyboard Shortcuts

- **Arrow Left/Right**: Navigate pages (PDF only)
- **+/-**: Zoom in/out
- **Ctrl/Cmd + F**: Open search
- **Escape**: Close search
- **Ctrl/Cmd + D**: Add bookmark

## Performance Considerations

1. **PDF Rendering**: Uses PDF.js worker for non-blocking rendering
2. **Lazy Loading**: Pages are rendered on-demand
3. **Caching**: Document content is cached in browser
4. **Responsive Images**: Automatically adjusts to container size
5. **Search Optimization**: Debounced search input for better performance

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## Troubleshooting

### PDF Not Rendering

1. Check that PDF.js worker is loaded correctly
2. Verify document storage path is correct
3. Check browser console for errors

### Search Not Working

1. Verify document content is loaded
2. Check that search query is not empty
3. Ensure PDF text layer is enabled

### Slow Performance

1. Reduce zoom level for large documents
2. Close other browser tabs
3. Check network connection for cloud documents

## Future Enhancements

- [ ] Annotation tools (highlight, draw, comment)
- [ ] Collaborative viewing with real-time cursors
- [ ] Document comparison side-by-side
- [ ] OCR for scanned PDFs
- [ ] Text-to-speech for accessibility
- [ ] Mobile app support
- [ ] Offline mode with service workers
- [ ] Advanced search with regex support
