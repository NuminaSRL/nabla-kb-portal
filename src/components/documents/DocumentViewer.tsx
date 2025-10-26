'use client';

import { useState, useEffect, useCallback } from 'react';
import { DocumentMetadata, SearchResult, ViewerState, DocumentHighlight, DocumentNote, HighlightColor } from '@/lib/documents/types';
import type { UserTier } from '@/lib/auth/types';
import { documentService } from '@/lib/documents/document-service';
import { annotationService } from '@/lib/documents/annotation-service';
import { PDFViewer } from './PDFViewer';
import { HTMLViewer } from './HTMLViewer';
import { MarkdownViewer } from './MarkdownViewer';
import { ViewerControls } from './ViewerControls';
import { TableOfContents } from './TableOfContents';
import { DocumentMetadataPanel } from './DocumentMetadataPanel';
import { AnnotationToolbar } from './AnnotationToolbar';
import { AnnotationPanel } from './AnnotationPanel';
import { ShareAnnotationDialog } from './ShareAnnotationDialog';
import { ExportAnnotationsDialog } from './ExportAnnotationsDialog';
import { Menu, X, Info, MessageSquare } from 'lucide-react';

interface DocumentViewerProps {
  documentId: string;
  userTier?: UserTier;
}

export function DocumentViewer({ documentId, userTier = 'free' }: DocumentViewerProps) {
  const [metadata, setMetadata] = useState<DocumentMetadata | null>(null);
  const [content, setContent] = useState<string | Blob | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [viewerState, setViewerState] = useState<ViewerState>({
    currentPage: 1,
    totalPages: 1,
    zoom: 1.0,
    searchQuery: '',
    searchResults: [],
    currentSearchIndex: 0
  });

  const [showTOC, setShowTOC] = useState(true);
  const [showMetadata, setShowMetadata] = useState(true);
  const [showAnnotations, setShowAnnotations] = useState(false);
  const [viewStartTime] = useState(Date.now());

  // Annotation state
  const [highlights, setHighlights] = useState<DocumentHighlight[]>([]);
  const [notes, setNotes] = useState<DocumentNote[]>([]);
  const [selectedColor, setSelectedColor] = useState<HighlightColor>('yellow');
  const [highlightMode, setHighlightMode] = useState(false);
  const [noteMode, setNoteMode] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [selectedAnnotation, setSelectedAnnotation] = useState<{ id: string; type: 'highlight' | 'note' } | null>(null);

  // Load document metadata and content
  useEffect(() => {
    const loadDocument = async () => {
      try {
        setLoading(true);
        setError(null);

        const doc = await documentService.getDocument(documentId);
        if (!doc) {
          setError('Document not found');
          return;
        }

        setMetadata(doc);

        // Load content based on type
        if (doc.content_type === 'pdf') {
          const blob = await documentService.getDocumentContent(doc.storage_path);
          if (blob) {
            setContent(blob);
          } else {
            setError('Failed to load document content');
          }
        } else {
          // For HTML and Markdown, fetch as text
          const blob = await documentService.getDocumentContent(doc.storage_path);
          if (blob) {
            const text = await blob.text();
            setContent(text);
          } else {
            setError('Failed to load document content');
          }
        }
      } catch (err) {
        console.error('Error loading document:', err);
        setError('Failed to load document');
      } finally {
        setLoading(false);
      }
    };

    loadDocument();
  }, [documentId]);

  // Load annotations
  useEffect(() => {
    const loadAnnotations = async () => {
      if (!metadata || (userTier !== 'pro' && userTier !== 'enterprise')) return;

      const { data: highlightsData } = await annotationService.getHighlights(documentId);
      const { data: notesData } = await annotationService.getNotes(documentId);

      setHighlights(highlightsData);
      setNotes(notesData);
    };

    loadAnnotations();
  }, [documentId, metadata, userTier]);

  // Track view on unmount
  useEffect(() => {
    return () => {
      if (metadata) {
        const viewDuration = Math.floor((Date.now() - viewStartTime) / 1000);
        documentService.trackView(documentId, {
          view_duration: viewDuration,
          last_page: viewerState.currentPage,
          search_queries: viewerState.searchQuery ? [viewerState.searchQuery] : []
        });
      }
    };
  }, [documentId, metadata, viewerState, viewStartTime]);

  const handlePageChange = useCallback((page: number) => {
    setViewerState(prev => ({ ...prev, currentPage: page }));
  }, []);

  const handleTotalPagesChange = useCallback((total: number) => {
    setViewerState(prev => ({ ...prev, totalPages: total }));
  }, []);

  const handleZoomChange = useCallback((zoom: number) => {
    setViewerState(prev => ({ ...prev, zoom }));
  }, []);

  const handleSearchChange = useCallback((query: string) => {
    setViewerState(prev => ({ 
      ...prev, 
      searchQuery: query,
      currentSearchIndex: 0
    }));
  }, []);

  const handleSearchResults = useCallback((results: SearchResult[]) => {
    setViewerState(prev => ({ 
      ...prev, 
      searchResults: results,
      currentSearchIndex: 0
    }));
    
    // Navigate to first result
    if (results.length > 0) {
      handlePageChange(results[0].page);
    }
  }, [handlePageChange]);

  const handleSearchNavigate = useCallback((direction: 'next' | 'prev') => {
    setViewerState(prev => {
      const newIndex = direction === 'next'
        ? (prev.currentSearchIndex + 1) % prev.searchResults.length
        : (prev.currentSearchIndex - 1 + prev.searchResults.length) % prev.searchResults.length;
      
      const result = prev.searchResults[newIndex];
      if (result) {
        handlePageChange(result.page);
      }

      return { ...prev, currentSearchIndex: newIndex };
    });
  }, [handlePageChange]);

  const handleBookmark = useCallback(async () => {
    if (!metadata) return;
    
    const note = prompt('Add a note for this bookmark (optional):');
    await documentService.addBookmark(
      documentId,
      viewerState.currentPage,
      note || undefined
    );
    alert('Bookmark added!');
  }, [documentId, metadata, viewerState.currentPage]);

  const handleDownload = useCallback(() => {
    if (!metadata || !content) return;

    const blob = content instanceof Blob ? content : new Blob([content]);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${metadata.title}.${metadata.content_type}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [metadata, content]);

  // Annotation handlers
  const handleHighlightCreate = useCallback(async (selectionText: string, position: any) => {
    const { data, error } = await annotationService.createHighlight(
      documentId,
      selectionText,
      selectedColor,
      position,
      viewerState.currentPage
    );

    if (data) {
      setHighlights(prev => [...prev, data]);
    } else if (error) {
      alert(`Failed to create highlight: ${error}`);
    }
  }, [documentId, selectedColor, viewerState.currentPage]);

  const handleNoteCreate = useCallback(async (content: string, position?: any) => {
    const { data, error } = await annotationService.createNote(documentId, content, {
      pageNumber: viewerState.currentPage,
      position,
    });

    if (data) {
      setNotes(prev => [...prev, data]);
    } else if (error) {
      alert(`Failed to create note: ${error}`);
    }
  }, [documentId, viewerState.currentPage]);

  const handleHighlightDelete = useCallback(async (highlightId: string) => {
    if (!confirm('Delete this highlight?')) return;

    const { success, error } = await annotationService.deleteHighlight(highlightId);
    if (success) {
      setHighlights(prev => prev.filter(h => h.id !== highlightId));
    } else if (error) {
      alert(`Failed to delete highlight: ${error}`);
    }
  }, []);

  const handleNoteDelete = useCallback(async (noteId: string) => {
    if (!confirm('Delete this note?')) return;

    const { success, error } = await annotationService.deleteNote(noteId);
    if (success) {
      setNotes(prev => prev.filter(n => n.id !== noteId));
    } else if (error) {
      alert(`Failed to delete note: ${error}`);
    }
  }, []);

  const handleNoteEdit = useCallback(async (noteId: string, content: string) => {
    const { success, error } = await annotationService.updateNote(noteId, content);
    if (success) {
      setNotes(prev => prev.map(n => n.id === noteId ? { ...n, content } : n));
    } else if (error) {
      alert(`Failed to update note: ${error}`);
    }
  }, []);

  const handleHighlightColorChange = useCallback(async (highlightId: string, color: HighlightColor) => {
    const { success, error } = await annotationService.updateHighlightColor(highlightId, color);
    if (success) {
      setHighlights(prev => prev.map(h => h.id === highlightId ? { ...h, color } : h));
    } else if (error) {
      alert(`Failed to update color: ${error}`);
    }
  }, []);

  const handleExport = useCallback(async (format: 'json' | 'md') => {
    if (!metadata) return;

    const content = format === 'json'
      ? await annotationService.exportAsJSON(documentId, metadata.title)
      : await annotationService.exportAsMarkdown(documentId, metadata.title);

    if (content) {
      annotationService.downloadExport(content, metadata.title, format);
    } else {
      alert('Failed to export annotations');
    }
  }, [documentId, metadata]);

  const handleShare = useCallback(async (shareWith: { userId?: string; email?: string }, permission: any) => {
    if (!selectedAnnotation) return;

    const { error } = await annotationService.shareAnnotation(
      selectedAnnotation.id,
      selectedAnnotation.type,
      shareWith,
      permission
    );

    if (error) {
      throw new Error(error);
    }
  }, [selectedAnnotation]);

  const handleRemoveShare = useCallback(async (shareId: string) => {
    const { error } = await annotationService.removeShare(shareId);
    if (error) {
      throw new Error(error);
    }
  }, []);

  const handleClearAnnotations = useCallback(async () => {
    if (!confirm('Delete all annotations? This cannot be undone.')) return;

    // Delete all highlights
    await Promise.all(highlights.map(h => annotationService.deleteHighlight(h.id)));
    // Delete all notes
    await Promise.all(notes.map(n => annotationService.deleteNote(n.id)));

    setHighlights([]);
    setNotes([]);
  }, [highlights, notes]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading document...</p>
        </div>
      </div>
    );
  }

  if (error || !metadata || !content) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center text-red-600">
          <p className="text-xl font-semibold mb-2">Error</p>
          <p>{error || 'Failed to load document'}</p>
        </div>
      </div>
    );
  }

  const annotationCount = highlights.length + notes.length;
  const [shares, setShares] = useState<any[]>([]);

  return (
    <div className="flex flex-col h-screen">
      {/* Controls */}
      <ViewerControls
        currentPage={viewerState.currentPage}
        totalPages={viewerState.totalPages}
        zoom={viewerState.zoom}
        searchQuery={viewerState.searchQuery}
        searchResultsCount={viewerState.searchResults.length}
        currentSearchIndex={viewerState.currentSearchIndex}
        onPageChange={handlePageChange}
        onZoomChange={handleZoomChange}
        onSearchChange={handleSearchChange}
        onSearchNavigate={handleSearchNavigate}
        onBookmark={handleBookmark}
        onDownload={handleDownload}
      />

      {/* Annotation Toolbar */}
      <AnnotationToolbar
        userTier={userTier}
        selectedColor={selectedColor}
        onColorChange={setSelectedColor}
        onHighlightMode={() => {
          setHighlightMode(!highlightMode);
          setNoteMode(false);
        }}
        onNoteMode={() => {
          setNoteMode(!noteMode);
          setHighlightMode(false);
        }}
        onShare={userTier === 'enterprise' ? () => setShareDialogOpen(true) : undefined}
        onExport={() => setExportDialogOpen(true)}
        onClearAnnotations={handleClearAnnotations}
        highlightMode={highlightMode}
        noteMode={noteMode}
        annotationCount={annotationCount}
      />

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* TOC Toggle */}
        <button
          onClick={() => setShowTOC(!showTOC)}
          className="absolute top-32 left-4 z-10 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          title={showTOC ? 'Hide table of contents' : 'Show table of contents'}
        >
          {showTOC ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        {/* Table of Contents */}
        {showTOC && metadata.table_of_contents && metadata.table_of_contents.length > 0 && (
          <TableOfContents
            items={metadata.table_of_contents}
            currentPage={metadata.content_type === 'pdf' ? viewerState.currentPage : undefined}
            onNavigate={handlePageChange}
          />
        )}

        {/* Document Content */}
        <div className="flex-1 overflow-hidden">
          {metadata.content_type === 'pdf' && content instanceof Blob && (
            <PDFViewer
              file={content}
              currentPage={viewerState.currentPage}
              zoom={viewerState.zoom}
              searchQuery={viewerState.searchQuery}
              onPageChange={handlePageChange}
              onTotalPagesChange={handleTotalPagesChange}
              onSearchResults={handleSearchResults}
            />
          )}
          {metadata.content_type === 'html' && typeof content === 'string' && (
            <HTMLViewer
              content={content}
              searchQuery={viewerState.searchQuery}
              zoom={viewerState.zoom}
            />
          )}
          {metadata.content_type === 'markdown' && typeof content === 'string' && (
            <MarkdownViewer
              content={content}
              searchQuery={viewerState.searchQuery}
              zoom={viewerState.zoom}
            />
          )}
        </div>

        {/* Annotation Toggle */}
        {(userTier === 'pro' || userTier === 'enterprise') && (
          <button
            onClick={() => setShowAnnotations(!showAnnotations)}
            className="absolute top-32 right-20 z-10 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            title={showAnnotations ? 'Hide annotations' : 'Show annotations'}
          >
            {showAnnotations ? <X className="h-5 w-5" /> : <MessageSquare className="h-5 w-5" />}
            {annotationCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {annotationCount}
              </span>
            )}
          </button>
        )}

        {/* Metadata Toggle */}
        <button
          onClick={() => setShowMetadata(!showMetadata)}
          className="absolute top-32 right-4 z-10 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          title={showMetadata ? 'Hide metadata' : 'Show metadata'}
        >
          {showMetadata ? <X className="h-5 w-5" /> : <Info className="h-5 w-5" />}
        </button>

        {/* Annotation Panel */}
        {showAnnotations && (userTier === 'pro' || userTier === 'enterprise') && (
          <AnnotationPanel
            highlights={highlights}
            notes={notes}
            onHighlightClick={(h) => handlePageChange(h.page_number || 1)}
            onNoteClick={(n) => handlePageChange(n.page_number || 1)}
            onHighlightDelete={handleHighlightDelete}
            onNoteDelete={handleNoteDelete}
            onNoteEdit={handleNoteEdit}
            onHighlightColorChange={handleHighlightColorChange}
            onHighlightShare={userTier === 'enterprise' ? (id) => {
              setSelectedAnnotation({ id, type: 'highlight' });
              setShareDialogOpen(true);
            } : undefined}
            onNoteShare={userTier === 'enterprise' ? (id) => {
              setSelectedAnnotation({ id, type: 'note' });
              setShareDialogOpen(true);
            } : undefined}
            canShare={userTier === 'enterprise'}
          />
        )}

        {/* Metadata Panel */}
        {showMetadata && (
          <DocumentMetadataPanel metadata={metadata} />
        )}
      </div>

      {/* Share Dialog */}
      {userTier === 'enterprise' && (
        <ShareAnnotationDialog
          isOpen={shareDialogOpen}
          onClose={() => {
            setShareDialogOpen(false);
            setSelectedAnnotation(null);
          }}
          onShare={handleShare}
          onRemoveShare={handleRemoveShare}
          existingShares={shares}
          annotationType={selectedAnnotation?.type || 'highlight'}
        />
      )}

      {/* Export Dialog */}
      <ExportAnnotationsDialog
        isOpen={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
        onExport={handleExport}
        annotationCount={annotationCount}
      />
    </div>
  );
}
