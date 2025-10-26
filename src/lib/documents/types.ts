// Document viewer types

export type ContentType = 'pdf' | 'html' | 'markdown';

export interface DocumentMetadata {
  id: string;
  document_id: string;
  title: string;
  content_type: ContentType;
  file_size?: number;
  page_count?: number;
  author?: string;
  created_date?: string;
  modified_date?: string;
  domain?: string;
  source_url?: string;
  storage_path: string;
  thumbnail_url?: string;
  table_of_contents?: TableOfContentsItem[];
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface TableOfContentsItem {
  id: string;
  title: string;
  page?: number;
  level: number;
  children?: TableOfContentsItem[];
}

export interface DocumentView {
  id: string;
  document_id: string;
  user_id: string;
  view_duration?: number;
  pages_viewed?: number[];
  last_page?: number;
  search_queries?: string[];
  created_at: string;
}

export interface DocumentBookmark {
  id: string;
  document_id: string;
  user_id: string;
  page_number?: number;
  note?: string;
  created_at: string;
}

export interface ViewerState {
  currentPage: number;
  totalPages: number;
  zoom: number;
  searchQuery: string;
  searchResults: SearchResult[];
  currentSearchIndex: number;
}

export interface SearchResult {
  page: number;
  text: string;
  position: {
    x: number;
    y: number;
  };
}

// Annotation types
export type HighlightColor = 'yellow' | 'green' | 'blue' | 'pink' | 'purple';

export interface HighlightPosition {
  start: { x: number; y: number };
  end: { x: number; y: number };
  rects: Array<{ x: number; y: number; width: number; height: number }>;
}

export interface DocumentHighlight {
  id: string;
  document_id: string;
  user_id: string;
  page_number?: number;
  selection_text: string;
  color: HighlightColor;
  position: HighlightPosition;
  created_at: string;
  updated_at: string;
}

export interface NotePosition {
  x: number;
  y: number;
}

export interface DocumentNote {
  id: string;
  document_id: string;
  user_id: string;
  highlight_id?: string;
  page_number?: number;
  position?: NotePosition;
  content: string;
  created_at: string;
  updated_at: string;
}

export type AnnotationType = 'highlight' | 'note';
export type SharePermission = 'view' | 'edit';

export interface AnnotationShare {
  id: string;
  annotation_id: string;
  annotation_type: AnnotationType;
  owner_id: string;
  shared_with_user_id?: string;
  shared_with_email?: string;
  permission: SharePermission;
  created_at: string;
}

export interface AnnotationExport {
  document_title: string;
  document_id: string;
  export_date: string;
  highlights: Array<{
    page: number;
    text: string;
    color: HighlightColor;
    note?: string;
  }>;
  notes: Array<{
    page: number;
    content: string;
  }>;
}
