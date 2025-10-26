'use client';

import { DocumentMetadata } from '@/lib/documents/types';
import { Calendar, User, FileText, Tag, ExternalLink } from 'lucide-react';

interface DocumentMetadataPanelProps {
  metadata: DocumentMetadata;
}

export function DocumentMetadataPanel({ metadata }: DocumentMetadataPanelProps) {
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    const kb = bytes / 1024;
    const mb = kb / 1024;
    if (mb >= 1) return `${mb.toFixed(2)} MB`;
    return `${kb.toFixed(2)} KB`;
  };

  return (
    <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 overflow-y-auto">
      <div className="p-6 space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">Document Information</h3>
        </div>

        {/* Title */}
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-1">
            <FileText className="h-4 w-4" />
            <span className="font-medium">Title</span>
          </div>
          <p className="text-sm">{metadata.title}</p>
        </div>

        {/* Author */}
        {metadata.author && (
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-1">
              <User className="h-4 w-4" />
              <span className="font-medium">Author</span>
            </div>
            <p className="text-sm">{metadata.author}</p>
          </div>
        )}

        {/* Domain */}
        {metadata.domain && (
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-1">
              <Tag className="h-4 w-4" />
              <span className="font-medium">Domain</span>
            </div>
            <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
              {metadata.domain.toUpperCase()}
            </span>
          </div>
        )}

        {/* Created Date */}
        {metadata.created_date && (
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-1">
              <Calendar className="h-4 w-4" />
              <span className="font-medium">Created</span>
            </div>
            <p className="text-sm">{formatDate(metadata.created_date)}</p>
          </div>
        )}

        {/* Modified Date */}
        {metadata.modified_date && (
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-1">
              <Calendar className="h-4 w-4" />
              <span className="font-medium">Modified</span>
            </div>
            <p className="text-sm">{formatDate(metadata.modified_date)}</p>
          </div>
        )}

        {/* File Info */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-medium mb-3">File Details</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Type</span>
              <span className="font-medium uppercase">{metadata.content_type}</span>
            </div>
            {metadata.file_size && (
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Size</span>
                <span className="font-medium">{formatFileSize(metadata.file_size)}</span>
              </div>
            )}
            {metadata.page_count && (
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Pages</span>
                <span className="font-medium">{metadata.page_count}</span>
              </div>
            )}
          </div>
        </div>

        {/* Source URL */}
        {metadata.source_url && (
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
              <ExternalLink className="h-4 w-4" />
              <span className="font-medium">Source</span>
            </div>
            <a
              href={metadata.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline break-all"
            >
              {metadata.source_url}
            </a>
          </div>
        )}

        {/* Additional Metadata */}
        {metadata.metadata && Object.keys(metadata.metadata).length > 0 && (
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-medium mb-3">Additional Information</h4>
            <div className="space-y-2 text-sm">
              {Object.entries(metadata.metadata).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400 capitalize">
                    {key.replace(/_/g, ' ')}
                  </span>
                  <span className="font-medium">{String(value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
