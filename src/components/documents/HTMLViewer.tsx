'use client';

import { useEffect, useState } from 'react';

interface HTMLViewerProps {
  content: string;
  searchQuery?: string;
  zoom: number;
}

export function HTMLViewer({ content, searchQuery, zoom }: HTMLViewerProps) {
  const [highlightedContent, setHighlightedContent] = useState(content);

  useEffect(() => {
    if (!searchQuery) {
      setHighlightedContent(content);
      return;
    }

    // Highlight search terms
    const regex = new RegExp(`(${searchQuery})`, 'gi');
    const highlighted = content.replace(
      regex,
      '<mark class="bg-yellow-300 dark:bg-yellow-600">$1</mark>'
    );
    setHighlightedContent(highlighted);
  }, [content, searchQuery]);

  return (
    <div 
      className="prose dark:prose-invert max-w-none p-8 overflow-auto"
      style={{ 
        fontSize: `${zoom * 100}%`,
        maxHeight: '100%'
      }}
    >
      <div 
        dangerouslySetInnerHTML={{ __html: highlightedContent }}
        className="html-content"
      />
    </div>
  );
}
