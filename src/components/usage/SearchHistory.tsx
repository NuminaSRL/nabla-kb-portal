'use client';

import { useEffect, useState } from 'react';
import { Clock, Search, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface SearchHistoryItem {
  id: string;
  query: string;
  searched_at: string;
  result_count: number;
  filters: Record<string, any> | null;
}

interface SearchHistoryProps {
  userId: string;
}

export function SearchHistory({ userId }: SearchHistoryProps) {
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [limit, setLimit] = useState(20);

  useEffect(() => {
    fetchSearchHistory();
  }, [userId, limit]);

  const fetchSearchHistory = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/usage/history?limit=${limit}`);
      const result = await response.json();

      if (result.success) {
        setHistory(result.data);
      } else {
        setError(result.message || 'Failed to fetch search history');
      }
    } catch (err) {
      setError('Failed to fetch search history');
      console.error('Error fetching search history:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <p className="text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Clock className="h-5 w-5 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Search History</h2>
        </div>
        <select
          value={limit}
          onChange={(e) => setLimit(Number(e.target.value))}
          className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value={10}>Last 10</option>
          <option value={20}>Last 20</option>
          <option value={50}>Last 50</option>
          <option value={100}>Last 100</option>
        </select>
      </div>

      {history.length > 0 ? (
        <div className="space-y-3">
          {history.map((item) => (
            <Link
              key={item.id}
              href={`/search?q=${encodeURIComponent(item.query)}`}
              className="block p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-500 transition-colors group"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <Search className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <p className="text-gray-900 dark:text-white font-medium group-hover:text-blue-600 dark:group-hover:text-blue-400">
                      {item.query}
                    </p>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400 ml-6">
                    <span>{formatDate(item.searched_at)}</span>
                    {item.result_count !== null && (
                      <span>{item.result_count} results</span>
                    )}
                    {item.filters && Object.keys(item.filters).length > 0 && (
                      <span className="text-blue-600 dark:text-blue-400">
                        {Object.keys(item.filters).length} filter{Object.keys(item.filters).length > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>
                <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 flex-shrink-0 ml-4" />
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Clock className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 dark:text-gray-400">No search history yet</p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
            Your recent searches will appear here
          </p>
        </div>
      )}
    </div>
  );
}
