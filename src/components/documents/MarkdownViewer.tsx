'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';

interface MarkdownViewerProps {
  content: string;
  searchQuery?: string;
  zoom: number;
}

export function MarkdownViewer({ content, searchQuery, zoom }: MarkdownViewerProps) {
  // Highlight search terms in markdown
  const highlightedContent = searchQuery
    ? content.replace(
        new RegExp(`(${searchQuery})`, 'gi'),
        '**$1**'
      )
    : content;

  return (
    <div 
      className="prose dark:prose-invert max-w-none p-8 overflow-auto"
      style={{ 
        fontSize: `${zoom * 100}%`,
        maxHeight: '100%'
      }}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          // Custom components for better styling
          h1: ({ node, ...props }) => <h1 className="text-4xl font-bold mb-4" {...props} />,
          h2: ({ node, ...props }) => <h2 className="text-3xl font-bold mb-3" {...props} />,
          h3: ({ node, ...props }) => <h3 className="text-2xl font-bold mb-2" {...props} />,
          code: ({ node, inline, ...props }: any) => 
            inline ? (
              <code className="bg-gray-200 dark:bg-gray-800 px-1 py-0.5 rounded" {...props} />
            ) : (
              <code className="block bg-gray-100 dark:bg-gray-900 p-4 rounded-lg overflow-x-auto" {...props} />
            ),
          table: ({ node, ...props }) => (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700" {...props} />
            </div>
          ),
        }}
      >
        {highlightedContent}
      </ReactMarkdown>
    </div>
  );
}
