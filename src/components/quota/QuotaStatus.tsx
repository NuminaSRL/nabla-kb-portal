'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, TrendingUp, Zap } from 'lucide-react';
import Link from 'next/link';

interface QuotaUsage {
  usage_count: number;
  limit_value: number;
  remaining: number;
  period_start: string;
  period_end: string;
  is_unlimited: boolean;
}

interface QuotaStatusData {
  user_id: string;
  tier: string;
  subscription_status: string | null;
  quotas: {
    search: QuotaUsage;
    export: QuotaUsage;
    api_call: QuotaUsage;
  };
}

export function QuotaStatus() {
  const [quotaData, setQuotaData] = useState<QuotaStatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchQuotaStatus();
  }, []);

  const fetchQuotaStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/quota/status');
      const result = await response.json();

      if (result.success) {
        setQuotaData(result.data);
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

  const getUsageColor = (percentage: number): string => {
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 75) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getProgressColor = (percentage: number): string => {
    if (percentage >= 90) return 'bg-red-600';
    if (percentage >= 75) return 'bg-yellow-600';
    return 'bg-green-600';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Quota Status</CardTitle>
          <CardDescription>Loading your usage information...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 bg-gray-200 rounded animate-pulse" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !quotaData) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error || 'Failed to load quota status'}</AlertDescription>
      </Alert>
    );
  }

  const searchUsage = quotaData.quotas.search;
  const searchPercentage = getUsagePercentage(searchUsage);
  const isNearLimit = searchPercentage >= 75 && !searchUsage.is_unlimited;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Quota Status</CardTitle>
              <CardDescription>
                Your current plan: <Badge variant="outline">{quotaData.tier.toUpperCase()}</Badge>
              </CardDescription>
            </div>
            {quotaData.tier === 'free' && (
              <Link href="/pricing">
                <Button size="sm">
                  <Zap className="mr-2 h-4 w-4" />
                  Upgrade
                </Button>
              </Link>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Search Quota */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Daily Searches</span>
              <span className={`text-sm font-bold ${getUsageColor(searchPercentage)}`}>
                {searchUsage.is_unlimited ? (
                  'Unlimited'
                ) : (
                  <>
                    {searchUsage.usage_count} / {searchUsage.limit_value}
                  </>
                )}
              </span>
            </div>
            {!searchUsage.is_unlimited && (
              <>
                <Progress value={searchPercentage} className={getProgressColor(searchPercentage)} />
                <p className="text-xs text-gray-500">
                  {searchUsage.remaining} searches remaining today
                </p>
              </>
            )}
          </div>

          {/* Export Quota (if applicable) */}
          {quotaData.quotas.export && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Daily Exports</span>
                <span className="text-sm font-bold">
                  {quotaData.quotas.export.is_unlimited ? (
                    'Unlimited'
                  ) : (
                    <>
                      {quotaData.quotas.export.usage_count} / {quotaData.quotas.export.limit_value}
                    </>
                  )}
                </span>
              </div>
              {!quotaData.quotas.export.is_unlimited && (
                <Progress value={getUsagePercentage(quotaData.quotas.export)} />
              )}
            </div>
          )}

          {/* API Calls (if applicable) */}
          {quotaData.quotas.api_call && quotaData.tier !== 'free' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">API Calls</span>
                <span className="text-sm font-bold">
                  {quotaData.quotas.api_call.is_unlimited ? (
                    'Unlimited'
                  ) : (
                    <>
                      {quotaData.quotas.api_call.usage_count} / {quotaData.quotas.api_call.limit_value}
                    </>
                  )}
                </span>
              </div>
              {!quotaData.quotas.api_call.is_unlimited && (
                <Progress value={getUsagePercentage(quotaData.quotas.api_call)} />
              )}
            </div>
          )}

          {/* Reset Time */}
          <div className="pt-4 border-t">
            <p className="text-xs text-gray-500">
              Quota resets: {new Date(searchUsage.period_end).toLocaleString()}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Upgrade Alert */}
      {isNearLimit && (
        <Alert>
          <TrendingUp className="h-4 w-4" />
          <AlertTitle>Approaching Limit</AlertTitle>
          <AlertDescription>
            You've used {searchPercentage.toFixed(0)}% of your daily search quota.
            {quotaData.tier === 'free' && (
              <>
                {' '}
                <Link href="/pricing" className="font-medium underline">
                  Upgrade to Pro
                </Link>{' '}
                for 500 searches per day.
              </>
            )}
            {quotaData.tier === 'pro' && (
              <>
                {' '}
                <Link href="/pricing" className="font-medium underline">
                  Upgrade to Enterprise
                </Link>{' '}
                for unlimited searches.
              </>
            )}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

