'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Activity, Calendar } from 'lucide-react';
import type { UserTier } from '@/lib/auth/types';

interface UsageStats {
  quota_type: string;
  total_usage: number;
  avg_daily_usage: number;
  max_daily_usage: number;
  days_at_limit: number;
  current_tier: UserTier;
}

interface UsageDashboardProps {
  userId: string;
  tier: UserTier;
}

export function UsageDashboard({ userId, tier }: UsageDashboardProps) {
  const [stats, setStats] = useState<UsageStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(7);

  useEffect(() => {
    fetchUsageStats();
  }, [userId, days]);

  const fetchUsageStats = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/usage/statistics?days=${days}`);
      const result = await response.json();

      if (result.success) {
        setStats(result.data);
      } else {
        setError(result.message || 'Failed to fetch usage statistics');
      }
    } catch (err) {
      setError('Failed to fetch usage statistics');
      console.error('Error fetching usage statistics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <div className="space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="grid md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            ))}
          </div>
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

  const searchStats = stats.find((s) => s.quota_type === 'search');

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Usage Statistics</h2>
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-gray-500" />
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
      </div>

      {searchStats ? (
        <div className="grid md:grid-cols-3 gap-6">
          {/* Total Usage */}
          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Searches</span>
              <Activity className="h-5 w-5 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{searchStats.total_usage}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              in the last {days} days
            </p>
          </div>

          {/* Average Daily Usage */}
          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Daily Average</span>
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {searchStats.avg_daily_usage.toFixed(1)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              searches per day
            </p>
          </div>

          {/* Peak Usage */}
          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Peak Day</span>
              <TrendingDown className="h-5 w-5 text-purple-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{searchStats.max_daily_usage}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              maximum searches
            </p>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <Activity className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 dark:text-gray-400">No usage data available</p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
            Start searching to see your statistics
          </p>
        </div>
      )}

      {/* Days at Limit Warning */}
      {searchStats && searchStats.days_at_limit > 0 && (
        <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            <strong>Note:</strong> You reached your daily limit on {searchStats.days_at_limit} day
            {searchStats.days_at_limit > 1 ? 's' : ''} in the last {days} days.
            {tier !== 'enterprise' && ' Consider upgrading for higher limits.'}
          </p>
        </div>
      )}
    </div>
  );
}
