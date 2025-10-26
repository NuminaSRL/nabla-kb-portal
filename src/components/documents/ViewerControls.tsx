'use client';

import { 
  ZoomIn, 
  ZoomOut, 
  ChevronLeft, 
  ChevronRight,
  Search,
  X,
  Bookmark,
  Download,
  Quote
} from 'lucide-react';
import { useState } from 'react';
import { CitationButton } from '@/components/citations/CitationButton';
import type { DocumentMetadata } from '@/lib/citations/citation-service';

interface ViewerControlsProps {
  currentPage: number;
  totalPages: number;
  zoom: number;
  searchQuery: string;
  searchResultsCount?: number;
  currentSearchIndex?: number;
  documentMetadata?: DocumentMetadata;
  onPageChange: (page: number) => void;
  onZoomChange: (zoom: number) => void;
  onSearchChange: (query: string) => void;
  onSearchNavigate?: (direction: 'next' | 'prev') => void;
  onBookmark?: () => void;
  onDownload?: () => void;
}

export function ViewerControls({
  currentPage,
  totalPages,
  zoom,
  searchQuery,
  searchResultsCount = 0,
  currentSearchIndex = 0,
  documentMetadata,
  onPageChange,
  onZoomChange,
  onSearchChange,
  onSearchNavigate,
  onBookmark,
  onDownload
}: ViewerControlsProps) {
  const [showSearch, setShowSearch] = useState(false);
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);

  const handlePrevPage = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const handleZoomIn = () => {
    onZoomChange(Math.min(zoom + 0.1, 3));
  };

  const handleZoomOut = () => {
    onZoomChange(Math.max(zoom - 0.1, 0.5));
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchChange(localSearchQuery);
  };

  const handleSearchClear = () => {
    setLocalSearchQuery('');
    onSearchChange('');
    setShowSearch(false);
  };

  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Page navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevPage}
            disabled={currentPage <= 1}
            className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Previous page"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={currentPage}
              onChange={(e) => {
                const page = parseInt(e.target.value);
                if (page >= 1 && page <= totalPages) {
                  onPageChange(page);
                }
              }}
              className="w-16 px-2 py-1 text-center border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
              min={1}
              max={totalPages}
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              / {totalPages}
            </span>
          </div>

          <button
            onClick={handleNextPage}
            disabled={currentPage >= totalPages}
            className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Next page"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Center: Zoom controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleZoomOut}
            disabled={zoom <= 0.5}
            className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Zoom out"
          >
            <ZoomOut className="h-5 w-5" />
          </button>
          
          <span className="text-sm font-medium min-w-[4rem] text-center">
            {Math.round(zoom * 100)}%
          </span>

          <button
            onClick={handleZoomIn}
            disabled={zoom >= 3}
            className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Zoom in"
          >
            <ZoomIn className="h-5 w-5" />
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {!showSearch ? (
            <button
              onClick={() => setShowSearch(true)}
              className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
              title="Search in document"
            >
              <Search className="h-5 w-5" />
            </button>
          ) : (
            <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
              <input
                type="text"
                value={localSearchQuery}
                onChange={(e) => setLocalSearchQuery(e.target.value)}
                placeholder="Search..."
                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm"
                autoFocus
              />
              {searchResultsCount > 0 && (
                <div className="flex items-center gap-1">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {currentSearchIndex + 1} / {searchResultsCount}
                  </span>
                  <button
                    type="button"
                    onClick={() => onSearchNavigate?.('prev')}
                    className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                    title="Previous result"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onSearchNavigate?.('next')}
                    className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                    title="Next result"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
              <button
                type="button"
                onClick={handleSearchClear}
                className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                title="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            </form>
          )}

          {onBookmark && (
            <button
              onClick={onBookmark}
              className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
              title="Add bookmark"
            >
              <Bookmark className="h-5 w-5" />
            </button>
          )}

          {onDownload && (
            <button
              onClick={onDownload}
              className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
              title="Download document"
            >
              <Download className="h-5 w-5" />
            </button>
          )}

          {documentMetadata && (
            <div className="ml-2 pl-2 border-l border-gray-300 dark:border-gray-600">
              <CitationButton 
                document={documentMetadata} 
                variant="ghost"
                size="sm"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
