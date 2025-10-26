'use client';

import { useEffect, useState } from 'react';
import { Activity, AlertCircle, CheckCircle, Zap } from 'lucide-react';
import Link from 'next/link';
import type { UserTier } from '@/lib/auth/types';

interface QuotaUsage {
  usage_count: number;
  limit_value: number;
  remaining: number;
  period_start: string;
  period_end: string;
  is_unlimited: boolean;
}

interface QuotaProgressProps {
  userId: string;
  tier: UserTier;
}

export function QuotaProgress({ userId, tier }: QuotaProgressProps) {
  const [quotas, setQuotas] = useState<Record<string, QuotaUsage>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchQuotaStatus();
  }, [userId]);

  const fetchQuotaStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/quota/status');
      const result = await response.json();

      if (result.success) {
        setQuotas(result.data.quotas);
      } else {
        setError(result.message || 'Failed to fetch quota status');
      }
    } catch (err) {
      setError('Failed to fetch quota status');
      console.error('Error fetching quota status:', err);
    } finally {
      setLoading(false);
    }
  };

  const getUsagePercentage = (usage: QuotaUsage): number => {
    if (usage.is_unlimited) return 0;
    return (usage.usage_count / usage.limit_value) * 100;
  };

  const getStatusIcon = (percentage: number, isUnlimited: boolean) => {
    if (isUnlimited) return <CheckCircle className="h-5 w-5 text-green-600" />;
    if (percentage >= 90) return <AlertCircle className="h-5 w-5 text-red-600" />;
    if (percentage >= 75) return <AlertCircle className="h-5 w-5 text-yellow-600" />;
    return <CheckCircle className="h-5 w-5 text-green-600" />;
  };

  const getStatusColor = (percentage: number, isUnlimited: boolean) => {
    if (isUnlimited) return 'text-green-600';
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 75) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-600';
    if (percentage >= 75) return 'bg-yellow-600';
    return 'bg-green-600';
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <div className="space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
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

  const searchQuota = quotas.search;
  const searchPercentage = searchQuota ? getUsagePercentage(searchQuota) : 0;
  const showUpgradePrompt = searchPercentage >= 75 && !searchQuota?.is_unlimited && tier !== 'enterprise';

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Activity className="h-5 w-5 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Quota Status</h2>
          </div>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Resets: {searchQuota ? new Date(searchQuota.period_end).toLocaleTimeString() : 'N/A'}
          </span>
        </div>

        {searchQuota && (
          <div className="space-y-4">
            {/* Search Quota */}
            <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(searchPercentage, searchQuota.is_unlimited)}
                  <span className="font-medium text-gray-900 dark:text-white">Daily Searches</span>
                </div>
                <span className={`text-lg font-bold ${getStatusColor(searchPercentage, searchQuota.is_unlimited)}`}>
                  {searchQuota.is_unlimited ? (
                    'Unlimited'
                  ) : (
                    <>
                      {searchQuota.usage_count} / {searchQuota.limit_value}
                    </>
                  )}
                </span>
              </div>

              {!searchQuota.is_unlimited && (
                <>
                  <div className="relative h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-2">
                    <div
                      className={`absolute top-0 left-0 h-full rounded-full transition-all ${getProgressColor(searchPercentage)}`}
                      style={{ width: `${Math.min(searchPercentage, 100)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      {searchQuota.remaining} remaining
                    </span>
                    <span className="text-gray-600 dark:text-gray-400">
                      {searchPercentage.toFixed(0)}% used
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Additional Quotas (if applicable) */}
            {quotas.export && tier !== 'free' && (
              <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(getUsagePercentage(quotas.export), quotas.export.is_unlimited)}
                    <span className="font-medium text-gray-900 dark:text-white">Daily Exports</span>
                  </div>
                  <span className="text-lg font-bold text-gray-900 dark:text-white">
                    {quotas.export.is_unlimited ? (
                      'Unlimited'
                    ) : (
                      <>
                        {quotas.export.usage_count} / {quotas.export.limit_value}
                      </>
                    )}
                  </span>
                </div>
                {!quotas.export.is_unlimited && (
                  <div className="relative h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`absolute top-0 left-0 h-full rounded-full transition-all ${getProgressColor(getUsagePercentage(quotas.export))}`}
                      style={{ width: `${Math.min(getUsagePercentage(quotas.export), 100)}%` }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Upgrade Prompt */}
      {showUpgradePrompt && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <Zap className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Approaching Your Limit
                </h3>
              </div>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                You've used {searchPercentage.toFixed(0)}% of your daily search quota.
                {tier === 'free' && ' Upgrade to Pro for 500 searches per day.'}
                {tier === 'pro' && ' Upgrade to Enterprise for unlimited searches.'}
              </p>
              <Link
                href="/pricing"
                className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                <Zap className="h-4 w-4" />
                <span>Upgrade Now</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
