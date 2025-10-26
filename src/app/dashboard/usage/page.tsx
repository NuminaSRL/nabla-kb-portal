'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
import Link from 'next/link';
import {
  Shield,
  TrendingUp,
  Clock,
  BarChart3,
  Calendar,
  Search,
  ArrowLeft,
  RefreshCw,
  Crown,
  Zap
} from 'lucide-react';
import { authService } from '@/lib/auth/auth-service';
import { UsageDashboard } from '@/components/usage/UsageDashboard';
import { UsageCharts } from '@/components/usage/UsageCharts';
import { SearchHistory } from '@/components/usage/SearchHistory';
import { TopSearches } from '@/components/usage/TopSearches';
import { QuotaProgress } from '@/components/usage/QuotaProgress';
import { TierComparison } from '@/components/usage/TierComparison';
import type { UserProfile } from '@/lib/auth/types';

export default function UsageDashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'analytics'>('overview');

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    const { user } = await authService.getUser();

    if (!user) {
      router.push('/login');
      return;
    }

    const { profile: userProfile } = await authService.getUserProfile(user.id);
    if (userProfile) {
      setProfile(userProfile);
    }

    setLoading(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadUserData();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading usage dashboard...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard"
                className="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400"
              >
                <ArrowLeft className="h-6 w-6" />
              </Link>
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-8 w-8 text-blue-600" />
                <span className="text-2xl font-bold text-gray-900 dark:text-white">Usage Dashboard</span>
              </div>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 disabled:opacity-50"
            >
              <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Tier Badge */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Crown
              className={`h-6 w-6 ${
                profile.tier === 'enterprise'
                  ? 'text-yellow-500'
                  : profile.tier === 'pro'
                  ? 'text-blue-500'
                  : 'text-gray-400'
              }`}
            />
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {profile.tier.charAt(0).toUpperCase() + profile.tier.slice(1)} Plan
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Viewing usage statistics and analytics
              </p>
            </div>
          </div>
          {profile.tier !== 'enterprise' && (
            <Link
              href="/pricing"
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Zap className="h-4 w-4" />
              <span>Upgrade Plan</span>
            </Link>
          )}
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4" />
                <span>Overview</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'history'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4" />
                <span>History</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'analytics'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-4 w-4" />
                <span>Analytics</span>
              </div>
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Quota Progress */}
            <QuotaProgress userId={profile.id} tier={profile.tier} />

            {/* Usage Dashboard */}
            <UsageDashboard userId={profile.id} tier={profile.tier} />

            {/* Tier Comparison */}
            {profile.tier !== 'enterprise' && <TierComparison currentTier={profile.tier} />}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-6">
            {/* Search History */}
            <SearchHistory userId={profile.id} />

            {/* Top Searches */}
            <TopSearches userId={profile.id} />
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* Usage Charts */}
            <UsageCharts userId={profile.id} />
          </div>
        )}
      </div>
    </div>
  );
}
