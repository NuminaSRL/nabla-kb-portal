'use client';

import { useState } from 'react';
import { Highlighter, StickyNote, Share2, Download, Trash2 } from 'lucide-react';
import type { HighlightColor } from '@/lib/documents/types';
import type { UserTier } from '@/lib/auth/types';

interface AnnotationToolbarProps {
  userTier: UserTier;
  selectedColor: HighlightColor;
  onColorChange: (color: HighlightColor) => void;
  onHighlightMode: () => void;
  onNoteMode: () => void;
  onShare?: () => void;
  onExport: () => void;
  onClearAnnotations: () => void;
  highlightMode: boolean;
  noteMode: boolean;
  annotationCount: number;
}

const HIGHLIGHT_COLORS: Array<{ color: HighlightColor; label: string; class: string }> = [
  { color: 'yellow', label: 'Yellow', class: 'bg-yellow-300' },
  { color: 'green', label: 'Green', class: 'bg-green-300' },
  { color: 'blue', label: 'Blue', class: 'bg-blue-300' },
  { color: 'pink', label: 'Pink', class: 'bg-pink-300' },
  { color: 'purple', label: 'Purple', class: 'bg-purple-300' },
];

export function AnnotationToolbar({
  userTier,
  selectedColor,
  onColorChange,
  onHighlightMode,
  onNoteMode,
  onShare,
  onExport,
  onClearAnnotations,
  highlightMode,
  noteMode,
  annotationCount,
}: AnnotationToolbarProps) {
  const [showColorPicker, setShowColorPicker] = useState(false);

  // Check if user has access to annotations
  const hasAccess = userTier === 'pro' || userTier === 'enterprise';
  const canShare = userTier === 'enterprise';

  if (!hasAccess) {
    return (
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Highlighter className="h-4 w-4" />
            <span>Annotations available for Pro and Enterprise users</span>
          </div>
          <a
            href="/pricing"
            className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
          >
            Upgrade
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Highlight button with color picker */}
          <div className="relative">
            <button
              onClick={onHighlightMode}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
                highlightMode
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              title="Highlight text"
            >
              <Highlighter className="h-4 w-4" />
              <span className="text-sm">Highlight</span>
            </button>

            {highlightMode && (
              <div className="absolute top-full left-0 mt-1 z-10">
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-2">
                  <div className="flex gap-1">
                    {HIGHLIGHT_COLORS.map(({ color, label, class: colorClass }) => (
                      <button
                        key={color}
                        onClick={() => onColorChange(color)}
                        className={`w-8 h-8 rounded ${colorClass} ${
                          selectedColor === color
                            ? 'ring-2 ring-blue-500 ring-offset-2'
                            : 'hover:ring-2 hover:ring-gray-300'
                        }`}
                        title={label}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Note button */}
          <button
            onClick={onNoteMode}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
              noteMode
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                : 'hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
            title="Add note"
          >
            <StickyNote className="h-4 w-4" />
            <span className="text-sm">Note</span>
          </button>

          {/* Divider */}
          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-2" />

          {/* Share button (Enterprise only) */}
          {canShare && onShare && (
            <button
              onClick={onShare}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Share annotations"
              disabled={annotationCount === 0}
            >
              <Share2 className="h-4 w-4" />
              <span className="text-sm">Share</span>
            </button>
          )}

          {/* Export button */}
          <button
            onClick={onExport}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Export annotations"
            disabled={annotationCount === 0}
          >
            <Download className="h-4 w-4" />
            <span className="text-sm">Export</span>
          </button>

          {/* Clear button */}
          <button
            onClick={onClearAnnotations}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900 text-red-600 dark:text-red-400 transition-colors"
            title="Clear all annotations"
            disabled={annotationCount === 0}
          >
            <Trash2 className="h-4 w-4" />
            <span className="text-sm">Clear</span>
          </button>
        </div>

        {/* Annotation count */}
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {annotationCount} {annotationCount === 1 ? 'annotation' : 'annotations'}
        </div>
      </div>
    </div>
  );
}

