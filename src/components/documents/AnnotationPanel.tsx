'use client';

import { useState } from 'react';
import { Highlighter, StickyNote, Trash2, Edit2, Share2, X } from 'lucide-react';
import type { DocumentHighlight, DocumentNote, HighlightColor } from '@/lib/documents/types';

interface AnnotationPanelProps {
  highlights: DocumentHighlight[];
  notes: DocumentNote[];
  onHighlightClick: (highlight: DocumentHighlight) => void;
  onNoteClick: (note: DocumentNote) => void;
  onHighlightDelete: (highlightId: string) => void;
  onNoteDelete: (noteId: string) => void;
  onNoteEdit: (noteId: string, content: string) => void;
  onHighlightColorChange: (highlightId: string, color: HighlightColor) => void;
  onHighlightShare?: (highlightId: string) => void;
  onNoteShare?: (noteId: string) => void;
  canShare: boolean;
}

const COLOR_CLASSES: Record<HighlightColor, string> = {
  yellow: 'bg-yellow-300',
  green: 'bg-green-300',
  blue: 'bg-blue-300',
  pink: 'bg-pink-300',
  purple: 'bg-purple-300',
};

export function AnnotationPanel({
  highlights,
  notes,
  onHighlightClick,
  onNoteClick,
  onHighlightDelete,
  onNoteDelete,
  onNoteEdit,
  onHighlightColorChange,
  onHighlightShare,
  onNoteShare,
  canShare,
}: AnnotationPanelProps) {
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [filter, setFilter] = useState<'all' | 'highlights' | 'notes'>('all');

  const handleEditStart = (note: DocumentNote) => {
    setEditingNoteId(note.id);
    setEditContent(note.content);
  };

  const handleEditSave = (noteId: string) => {
    onNoteEdit(noteId, editContent);
    setEditingNoteId(null);
    setEditContent('');
  };

  const handleEditCancel = () => {
    setEditingNoteId(null);
    setEditContent('');
  };

  // Get notes associated with highlights
  const highlightNotes = new Map(
    notes.filter(n => n.highlight_id).map(n => [n.highlight_id!, n])
  );

  // Get standalone notes
  const standaloneNotes = notes.filter(n => !n.highlight_id);

  // Filter items
  const filteredHighlights = filter === 'notes' ? [] : highlights;
  const filteredNotes = filter === 'highlights' ? [] : standaloneNotes;

  return (
    <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 overflow-y-auto">
      <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 z-10">
        <h3 className="text-lg font-semibold mb-3">Annotations</h3>
        
        {/* Filter tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              filter === 'all'
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                : 'hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            All ({highlights.length + standaloneNotes.length})
          </button>
          <button
            onClick={() => setFilter('highlights')}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              filter === 'highlights'
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                : 'hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            Highlights ({highlights.length})
          </button>
          <button
            onClick={() => setFilter('notes')}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              filter === 'notes'
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                : 'hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            Notes ({standaloneNotes.length})
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Highlights */}
        {filteredHighlights.map(highlight => {
          const note = highlightNotes.get(highlight.id);
          return (
            <div
              key={highlight.id}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => onHighlightClick(highlight)}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Highlighter className="h-4 w-4 text-gray-500" />
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Page {highlight.page_number || 'N/A'}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {/* Color indicator */}
                  <div className={`w-4 h-4 rounded ${COLOR_CLASSES[highlight.color]}`} />
                  
                  {canShare && onHighlightShare && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onHighlightShare(highlight.id);
                      }}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                      title="Share highlight"
                    >
                      <Share2 className="h-3 w-3" />
                    </button>
                  )}
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onHighlightDelete(highlight.id);
                    }}
                    className="p-1 hover:bg-red-100 dark:hover:bg-red-900 rounded text-red-600"
                    title="Delete highlight"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
              
              <p className="text-sm mb-2 line-clamp-3">{highlight.selection_text}</p>
              
              {note && (
                <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-start gap-2">
                    <StickyNote className="h-3 w-3 text-gray-500 mt-0.5" />
                    <p className="text-xs text-gray-600 dark:text-gray-400 flex-1">
                      {note.content}
                    </p>
                  </div>
                </div>
              )}
              
              <div className="mt-2 text-xs text-gray-400">
                {new Date(highlight.created_at).toLocaleDateString()}
              </div>
            </div>
          );
        })}

        {/* Standalone Notes */}
        {filteredNotes.map(note => (
          <div
            key={note.id}
            className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <StickyNote className="h-4 w-4 text-gray-500" />
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Page {note.page_number || 'N/A'}
                </span>
              </div>
              <div className="flex items-center gap-1">
                {editingNoteId !== note.id && (
                  <>
                    <button
                      onClick={() => handleEditStart(note)}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                      title="Edit note"
                    >
                      <Edit2 className="h-3 w-3" />
                    </button>
                    
                    {canShare && onNoteShare && (
                      <button
                        onClick={() => onNoteShare(note.id)}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                        title="Share note"
                      >
                        <Share2 className="h-3 w-3" />
                      </button>
                    )}
                    
                    <button
                      onClick={() => onNoteDelete(note.id)}
                      className="p-1 hover:bg-red-100 dark:hover:bg-red-900 rounded text-red-600"
                      title="Delete note"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </>
                )}
              </div>
            </div>
            
            {editingNoteId === note.id ? (
              <div className="space-y-2">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditSave(note.id)}
                    className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Save
                  </button>
                  <button
                    onClick={handleEditCancel}
                    className="px-3 py-1 text-xs bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm">{note.content}</p>
            )}
            
            <div className="mt-2 text-xs text-gray-400">
              {new Date(note.created_at).toLocaleDateString()}
            </div>
          </div>
        ))}

        {/* Empty state */}
        {filteredHighlights.length === 0 && filteredNotes.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p className="text-sm">No annotations yet</p>
            <p className="text-xs mt-1">
              {filter === 'all'
                ? 'Start highlighting or adding notes'
                : filter === 'highlights'
                ? 'No highlights yet'
                : 'No notes yet'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

