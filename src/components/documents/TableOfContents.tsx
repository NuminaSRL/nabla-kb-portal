'use client';

import { TableOfContentsItem } from '@/lib/documents/types';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { useState } from 'react';

interface TableOfContentsProps {
  items: TableOfContentsItem[];
  currentPage?: number;
  onNavigate: (page: number) => void;
}

export function TableOfContents({ items, currentPage, onNavigate }: TableOfContentsProps) {
  return (
    <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-4">Table of Contents</h3>
        <nav>
          {items.map((item) => (
            <TOCItem
              key={item.id}
              item={item}
              currentPage={currentPage}
              onNavigate={onNavigate}
            />
          ))}
        </nav>
      </div>
    </div>
  );
}

interface TOCItemProps {
  item: TableOfContentsItem;
  currentPage?: number;
  onNavigate: (page: number) => void;
  level?: number;
}

function TOCItem({ item, currentPage, onNavigate, level = 0 }: TOCItemProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = item.children && item.children.length > 0;
  const isActive = item.page === currentPage;

  const handleClick = () => {
    if (item.page) {
      onNavigate(item.page);
    }
    if (hasChildren) {
      setIsExpanded(!isExpanded);
    }
  };

  return (
    <div className="mb-1">
      <button
        onClick={handleClick}
        className={`
          w-full text-left px-2 py-1.5 rounded flex items-center gap-2
          hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors
          ${isActive ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : ''}
        `}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
      >
        {hasChildren && (
          <span className="flex-shrink-0">
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </span>
        )}
        <span className="flex-1 text-sm truncate" title={item.title}>
          {item.title}
        </span>
        {item.page && (
          <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
            {item.page}
          </span>
        )}
      </button>
      {hasChildren && isExpanded && (
        <div>
          {item.children!.map((child) => (
            <TOCItem
              key={child.id}
              item={child}
              currentPage={currentPage}
              onNavigate={onNavigate}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
