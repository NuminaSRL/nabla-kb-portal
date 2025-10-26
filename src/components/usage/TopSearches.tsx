'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, Search, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface TopSearch {
  query: string;
  count: number;
  last_searched: string;
}

interface TopSearchesProps {
  userId: string;
}

export function TopSearches({ userId }: TopSearchesProps) {
  const [topSearches, setTopSearches] = useState<TopSearch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [limit, setLimit] = useState(10);

  useEffect(() => {
    fetchTopSearches();
  }, [userId, limit]);

  const fetchTopSearches = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/usage/top-searches?limit=${limit}`);
      const result = await response.json();

      if (result.success) {
        setTopSearches(result.data);
      } else {
        setError(result.message || 'Failed to fetch top searches');
      }
    } catch (err) {
      setError('Failed to fetch top searches');
      console.error('Error fetching top searches:', err);
    } finally {
      setLoading(false);
    }
  };

  const getMaxCount = () => {
    if (topSearches.length === 0) return 1;
    return Math.max(...topSearches.map((s) => s.count));
  };

  const getBarWidth = (count: number) => {
    const max = getMaxCount();
    return `${(count / max) * 100}%`;
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
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
          <TrendingUp className="h-5 w-5 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Most Frequent Searches</h2>
        </div>
        <select
          value={limit}
          onChange={(e) => setLimit(Number(e.target.value))}
          className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value={5}>Top 5</option>
          <option value={10}>Top 10</option>
          <option value={20}>Top 20</option>
        </select>
      </div>

      {topSearches.length > 0 ? (
        <div className="space-y-3">
          {topSearches.map((item, index) => (
            <Link
              key={index}
              href={`/search?q=${encodeURIComponent(item.query)}`}
              className="block group"
            >
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                  <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                    {index + 1}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-2">
                      <Search className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-900 dark:text-white font-medium group-hover:text-blue-600 dark:group-hover:text-blue-400">
                        {item.query}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {item.count} time{item.count > 1 ? 's' : ''}
                      </span>
                      <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                    </div>
                  </div>
                  <div className="relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="absolute top-0 left-0 h-full bg-blue-600 rounded-full transition-all"
                      style={{ width: getBarWidth(item.count) }}
                    />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 dark:text-gray-400">No search data yet</p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
            Your most frequent searches will appear here
          </p>
        </div>
      )}
    </div>
  );
}
