'use client';

import { Check, X, Zap, Crown } from 'lucide-react';
import Link from 'next/link';
import type { UserTier } from '@/lib/auth/types';

interface TierComparisonProps {
  currentTier: UserTier;
}

interface TierFeature {
  name: string;
  free: boolean | string;
  pro: boolean | string;
  enterprise: boolean | string;
}

const tierFeatures: TierFeature[] = [
  {
    name: 'Daily Searches',
    free: '20',
    pro: '500',
    enterprise: 'Unlimited',
  },
  {
    name: 'Results per Search',
    free: '5',
    pro: '50',
    enterprise: '100',
  },
  {
    name: 'Advanced Filters',
    free: false,
    pro: true,
    enterprise: true,
  },
  {
    name: 'Saved Searches',
    free: false,
    pro: true,
    enterprise: true,
  },
  {
    name: 'Export to PDF/CSV',
    free: false,
    pro: true,
    enterprise: true,
  },
  {
    name: 'Search History',
    free: '7 days',
    pro: '90 days',
    enterprise: 'Unlimited',
  },
  {
    name: 'API Access',
    free: false,
    pro: false,
    enterprise: true,
  },
  {
    name: 'Priority Support',
    free: false,
    pro: true,
    enterprise: true,
  },
  {
    name: 'Custom Integrations',
    free: false,
    pro: false,
    enterprise: true,
  },
  {
    name: 'Dedicated Account Manager',
    free: false,
    pro: false,
    enterprise: true,
  },
];

export function TierComparison({ currentTier }: TierComparisonProps) {
  const renderFeatureValue = (value: boolean | string) => {
    if (typeof value === 'boolean') {
      return value ? (
        <Check className="h-5 w-5 text-green-600 mx-auto" />
      ) : (
        <X className="h-5 w-5 text-gray-400 mx-auto" />
      );
    }
    return <span className="text-sm font-medium text-gray-900 dark:text-white">{value}</span>;
  };

  const getTierIcon = (tier: string) => {
    if (tier === 'enterprise') return <Crown className="h-5 w-5 text-yellow-500" />;
    if (tier === 'pro') return <Zap className="h-5 w-5 text-blue-500" />;
    return null;
  };

  const getTierPrice = (tier: string) => {
    if (tier === 'free') return '$0';
    if (tier === 'pro') return '$29';
    if (tier === 'enterprise') return '$99';
    return '';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Compare Plans</h2>
        <p className="text-gray-600 dark:text-gray-400">
          See what you're missing and upgrade to unlock more features
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="text-left py-4 px-4 font-medium text-gray-900 dark:text-white">
                Features
              </th>
              <th className="text-center py-4 px-4">
                <div className="flex flex-col items-center space-y-2">
                  <span className="font-bold text-gray-900 dark:text-white">Free</span>
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">$0</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">per month</span>
                  {currentTier === 'free' && (
                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-medium rounded">
                      Current Plan
                    </span>
                  )}
                </div>
              </th>
              <th className="text-center py-4 px-4 bg-blue-50 dark:bg-blue-900/10">
                <div className="flex flex-col items-center space-y-2">
                  <div className="flex items-center space-x-1">
                    {getTierIcon('pro')}
                    <span className="font-bold text-gray-900 dark:text-white">Pro</span>
                  </div>
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">$29</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">per month</span>
                  {currentTier === 'pro' ? (
                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-medium rounded">
                      Current Plan
                    </span>
                  ) : (
                    <Link
                      href="/pricing"
                      className="px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700"
                    >
                      Upgrade
                    </Link>
                  )}
                </div>
              </th>
              <th className="text-center py-4 px-4 bg-purple-50 dark:bg-purple-900/10">
                <div className="flex flex-col items-center space-y-2">
                  <div className="flex items-center space-x-1">
                    {getTierIcon('enterprise')}
                    <span className="font-bold text-gray-900 dark:text-white">Enterprise</span>
                  </div>
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">$99</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">per month</span>
                  {currentTier === 'enterprise' ? (
                    <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 text-xs font-medium rounded">
                      Current Plan
                    </span>
                  ) : (
                    <Link
                      href="/pricing"
                      className="px-3 py-1 bg-purple-600 text-white text-xs font-medium rounded hover:bg-purple-700"
                    >
                      Upgrade
                    </Link>
                  )}
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {tierFeatures.map((feature, index) => (
              <tr
                key={index}
                className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
              >
                <td className="py-3 px-4 text-sm text-gray-700 dark:text-gray-300">
                  {feature.name}
                </td>
                <td className="py-3 px-4 text-center">
                  {renderFeatureValue(feature.free)}
                </td>
                <td className="py-3 px-4 text-center bg-blue-50 dark:bg-blue-900/10">
                  {renderFeatureValue(feature.pro)}
                </td>
                <td className="py-3 px-4 text-center bg-purple-50 dark:bg-purple-900/10">
                  {renderFeatureValue(feature.enterprise)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <p className="text-sm text-blue-900 dark:text-blue-100">
          <strong>Need help choosing?</strong> Contact our sales team to discuss your requirements and find the perfect plan for your organization.
        </p>
      </div>
    </div>
  );
}
