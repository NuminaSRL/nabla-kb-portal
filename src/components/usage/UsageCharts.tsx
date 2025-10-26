'use client';

import { useEffect, useState } from 'react';
import { BarChart3, TrendingUp } from 'lucide-react';

interface DailyUsage {
  date: string;
  searches: number;
  exports: number;
}

interface UsageChartsProps {
  userId: string;
}

export function UsageCharts({ userId }: UsageChartsProps) {
  const [dailyUsage, setDailyUsage] = useState<DailyUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(7);

  useEffect(() => {
    fetchDailyUsage();
  }, [userId, days]);

  const fetchDailyUsage = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/usage/daily?days=${days}`);
      const result = await response.json();

      if (result.success) {
        setDailyUsage(result.data);
      } else {
        setError(result.message || 'Failed to fetch daily usage');
      }
    } catch (err) {
      setError('Failed to fetch daily usage');
      console.error('Error fetching daily usage:', err);
    } finally {
      setLoading(false);
    }
  };

  const getMaxValue = () => {
    if (dailyUsage.length === 0) return 100;
    return Math.max(...dailyUsage.map((d) => d.searches), 10);
  };

  const getBarHeight = (value: number) => {
    const max = getMaxValue();
    return `${(value / max) * 100}%`;
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
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
          <BarChart3 className="h-5 w-5 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Usage Trends</h2>
        </div>
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value={7}>Last 7 days</option>
          <option value={14}>Last 14 days</option>
          <option value={30}>Last 30 days</option>
        </select>
      </div>

      {dailyUsage.length > 0 ? (
        <div className="space-y-6">
          {/* Bar Chart */}
          <div className="h-64 flex items-end justify-between space-x-2">
            {dailyUsage.map((day, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div className="w-full flex flex-col items-center justify-end h-full">
                  <div
                    className="w-full bg-blue-600 rounded-t-lg hover:bg-blue-700 transition-all cursor-pointer relative group"
                    style={{ height: getBarHeight(day.searches) }}
                  >
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {day.searches} searches
                    </div>
                  </div>
                </div>
                <div className="mt-2 text-xs text-gray-600 dark:text-gray-400 text-center">
                  {new Date(day.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center space-x-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-blue-600 rounded"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Searches</span>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid md:grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {dailyUsage.reduce((sum, day) => sum + day.searches, 0)}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Searches</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {(dailyUsage.reduce((sum, day) => sum + day.searches, 0) / dailyUsage.length).toFixed(1)}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Daily Average</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {Math.max(...dailyUsage.map((d) => d.searches))}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Peak Day</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 dark:text-gray-400">No usage data available</p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
            Start searching to see your trends
          </p>
        </div>
      )}
    </div>
  );
}
