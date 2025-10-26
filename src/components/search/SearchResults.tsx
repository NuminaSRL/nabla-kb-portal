'use client';

import { FileText, Calendar, Tag, ExternalLink } from 'lucide-react';

export interface SearchResult {
  id: string;
  title: string;
  content: string;
  domain: string;
  document_type: string;
  source: string;
  published_date: string;
  relevance_score: number;
  url?: string;
}

interface SearchResultsProps {
  results: SearchResult[];
  isLoading: boolean;
  query: string;
}

export function SearchResults({ results, isLoading, query }: SearchResultsProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!query) {
    return (
      <div className="text-center py-12 text-gray-500">
        <FileText className="h-16 w-16 mx-auto mb-4 text-gray-300" />
        <p className="text-lg">Enter a search query to find documents</p>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <FileText className="h-16 w-16 mx-auto mb-4 text-gray-300" />
        <p className="text-lg">No results found for &quot;{query}&quot;</p>
        <p className="text-sm mt-2">Try different keywords or check your spelling</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-600 mb-4">
        Found {results.length} result{results.length !== 1 ? 's' : ''} for &quot;{query}&quot;
      </div>

      {results.map((result) => (
        <div
          key={result.id}
          className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-900 flex-1">
              {result.title}
            </h3>
            <div className="flex items-center gap-2 ml-4">
              <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                {Math.round(result.relevance_score * 100)}% match
              </span>
            </div>
          </div>

          {/* Content preview */}
          <p className="text-sm text-gray-700 mb-4 line-clamp-3">
            {highlightQuery(result.content, query)}
          </p>

          {/* Metadata */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Tag className="h-3 w-3" />
              <span>{result.domain}</span>
            </div>
            <div className="flex items-center gap-1">
              <FileText className="h-3 w-3" />
              <span>{result.document_type}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{formatDate(result.published_date)}</span>
            </div>
            {result.url && (
              <a
                href={result.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
              >
                <ExternalLink className="h-3 w-3" />
                <span>View source</span>
              </a>
            )}
          </div>

          {/* Source */}
          <div className="mt-3 pt-3 border-t border-gray-100">
            <span className="text-xs text-gray-400">Source: {result.source}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function highlightQuery(text: string, query: string): string {
  if (!query) return text;
  
  // Simple highlighting - in production, use a proper highlighting library
  const regex = new RegExp(`(${query})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
}

function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
}
