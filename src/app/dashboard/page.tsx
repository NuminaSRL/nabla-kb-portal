'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Shield, 
  Search, 
  TrendingUp, 
  Clock, 
  Star,
  Settings,
  LogOut,
  Crown,
  AlertCircle
} from 'lucide-react';
import { useDashboard } from './layout-client';
import { tierService } from '@/lib/auth/tier-service';
import { logout } from '@/lib/auth/actions';

export default function DashboardPage() {
  const router = useRouter();
  const { user, profile, tierLimits, usageData } = useDashboard();
  const [trialDays, setTrialDays] = useState(0);

  useEffect(() => {
    if (profile && user) {
      loadTrialDays();
    }
  }, [profile, user]);

  const loadTrialDays = async () => {
    if (!user) return;
    
    try {
      const days = await tierService.getTrialDaysRemaining(user.id);
      setTrialDays(days);
    } catch (error) {
      console.error('Error loading trial days:', error);
      // Set to 0 if error
      setTrialDays(0);
    }
  };

  const handleSignOut = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
      router.push('/login');
    }
  };

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Calculate usage stats from server data
  const searchesToday = usageData?.action_count || 0;
  const searchesLimit = tierLimits?.searches_per_day === -1 ? Infinity : (tierLimits?.searches_per_day || 0);
  const percentageUsed = searchesLimit === Infinity ? 0 : (searchesToday / searchesLimit) * 100;
  const canSearch = searchesLimit === Infinity || searchesToday < searchesLimit;

  const tierFeatures = tierService.getTierFeatures(profile.tier);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900 dark:text-white">NABLA KB Portal</span>
          </div>
          <nav className="flex items-center space-x-6">
            <Link href="/search" className="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400">
              Search
            </Link>
            <Link href="/dashboard/profile" className="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400">
              <Settings className="h-5 w-5" />
            </Link>
            <button
              onClick={handleSignOut}
              className="text-gray-600 hover:text-red-600 dark:text-gray-300 dark:hover:text-red-400"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </nav>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome back, {profile.full_name || 'User'}!
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Here's your account overview and recent activity
          </p>
        </div>

        {/* Trial Banner */}
        {profile.tier === 'free' && trialDays > 0 && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  {trialDays} days left in your free trial
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  Upgrade to Pro or Enterprise to unlock unlimited searches and advanced features
                </p>
              </div>
            </div>
            <Link
              href="/pricing"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium whitespace-nowrap"
            >
              Upgrade Now
            </Link>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Current Tier */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Current Plan</h3>
              <Crown className={`h-5 w-5 ${profile.tier === 'enterprise' ? 'text-yellow-500' : profile.tier === 'pro' ? 'text-blue-500' : 'text-gray-400'}`} />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {tierFeatures.name}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              ${tierFeatures.price}/month
            </p>
            {profile.tier !== 'enterprise' && (
              <Link
                href="/pricing"
                className="mt-4 block text-center py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
              >
                Upgrade Plan
              </Link>
            )}
          </div>

          {/* Usage Stats */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Searches Today</h3>
              <Search className="h-5 w-5 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {searchesToday}
              {searchesLimit !== Infinity && (
                <span className="text-lg text-gray-500 dark:text-gray-400">
                  {' '}/ {searchesLimit}
                </span>
              )}
            </p>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${Math.min(percentageUsed, 100)}%` }}
              ></div>
            </div>
          </div>

          {/* Account Status */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Account Status</h3>
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400 mb-2">
              Active
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Member since {new Date(profile.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
          <div className="grid md:grid-cols-4 gap-4">
            <Link
              href="/search"
              className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
            >
              <Search className="h-8 w-8 text-blue-600 mb-2" />
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">New Search</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Search regulatory documents
              </p>
            </Link>

            <Link
              href="/dashboard/usage"
              className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
            >
              <TrendingUp className="h-8 w-8 text-green-600 mb-2" />
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Usage Dashboard</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                View usage statistics
              </p>
            </Link>

            <Link
              href="/dashboard/saved-searches"
              className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
            >
              <Star className="h-8 w-8 text-yellow-600 mb-2" />
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Saved Searches</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Access your saved queries
              </p>
            </Link>

            <Link
              href="/dashboard/history"
              className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
            >
              <Clock className="h-8 w-8 text-purple-600 mb-2" />
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Search History</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                View recent searches
              </p>
            </Link>
          </div>
        </div>

        {/* Features Overview */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Your Plan Features</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {tierFeatures.features.map((feature, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mt-0.5">
                  <svg className="w-3 h-3 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-gray-700 dark:text-gray-300">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
