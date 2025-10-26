'use client';

import { useState } from 'react';
import { X, Download, FileJson, FileText } from 'lucide-react';

interface ExportAnnotationsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (format: 'json' | 'md') => Promise<void>;
  annotationCount: number;
}

export function ExportAnnotationsDialog({
  isOpen,
  onClose,
  onExport,
  annotationCount,
}: ExportAnnotationsDialogProps) {
  const [format, setFormat] = useState<'json' | 'md'>('md');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleExport = async () => {
    setLoading(true);
    try {
      await onExport(format);
      onClose();
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold">Export Annotations</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Export {annotationCount} {annotationCount === 1 ? 'annotation' : 'annotations'} from this document.
          </p>

          {/* Format selection */}
          <div className="space-y-3">
            <label className="block text-sm font-medium">Export format</label>
            
            <button
              onClick={() => setFormat('md')}
              className={`w-full flex items-start gap-3 p-4 border-2 rounded-lg transition-colors ${
                format === 'md'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <FileText className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <div className="text-left flex-1">
                <div className="font-medium">Markdown (.md)</div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Human-readable format with highlights and notes organized by page
                </div>
              </div>
            </button>

            <button
              onClick={() => setFormat('json')}
              className={`w-full flex items-start gap-3 p-4 border-2 rounded-lg transition-colors ${
                format === 'json'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <FileJson className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <div className="text-left flex-1">
                <div className="font-medium">JSON (.json)</div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Structured data format for programmatic use or import
                </div>
              </div>
            </button>
          </div>

          {/* Info */}
          <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <p className="text-xs text-gray-600 dark:text-gray-400">
              <strong>What's included:</strong>
            </p>
            <ul className="text-xs text-gray-600 dark:text-gray-400 mt-1 space-y-1 ml-4 list-disc">
              <li>All highlights with colors and text</li>
              <li>All notes (both attached and standalone)</li>
              <li>Page numbers and timestamps</li>
              <li>Document metadata</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Download className="h-4 w-4" />
            {loading ? 'Exporting...' : 'Export'}
          </button>
        </div>
      </div>
    </div>
  );
}

