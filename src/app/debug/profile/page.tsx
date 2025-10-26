import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { CheckCircle, XCircle, AlertCircle, ExternalLink } from 'lucide-react';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

interface ProfileCheckResult {
  user: any;
  profile: any;
  tierLimits: any;
  usageData: any;
  errors: string[];
  warnings: string[];
}

async function checkUserProfile(): Promise<ProfileCheckResult> {
  const result: ProfileCheckResult = {
    user: null,
    profile: null,
    tierLimits: null,
    usageData: null,
    errors: [],
    warnings: []
  };

  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      result.errors.push(`Auth error: ${error.message}`);
      return result;
    }
    result.user = user;

    if (!user) {
      result.errors.push('No user ID available');
      return result;
    }

    // Check user_profiles table
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      if (profileError.code === 'PGRST116') {
        result.warnings.push('User profile not found - will use default values');
      } else {
        result.errors.push(`Profile error: ${profileError.message}`);
      }
    } else {
      result.profile = profile;
    }

    // Check tier_limits table
    const userTier = profile?.tier || 'free';
    const { data: tierLimits, error: tierError } = await supabase
      .from('tier_limits')
      .select('*')
      .eq('tier', userTier)
      .single();

    if (tierError) {
      if (tierError.code === 'PGRST116') {
        result.warnings.push(`Tier limits not found for tier: ${userTier}`);
      } else {
        result.errors.push(`Tier limits error: ${tierError.message}`);
      }
    } else {
      result.tierLimits = tierLimits;
    }

    // Check usage_tracking table
    const today = new Date().toISOString().split('T')[0];
    const { data: usageData, error: usageError } = await supabase
      .from('usage_tracking')
      .select('action_count')
      .eq('user_id', user.id)
      .eq('action_type', 'search')
      .eq('action_date', today)
      .maybeSingle();

    if (usageError) {
      result.errors.push(`Usage tracking error: ${usageError.message}`);
    } else {
      result.usageData = usageData;
      if (!usageData) {
        result.warnings.push('No usage data found for today - will show 0');
      }
    }

    return result;
  } catch (error: any) {
    result.errors.push(`Unexpected error: ${error.message}`);
    return result;
  }
}

export default async function ProfileDebugPage() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/login?returnUrl=/debug/profile');
  }

  const checkResult = await checkUserProfile();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Profile Debug Information
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Diagnostic information for user profile and database connections
            </p>
          </div>
          
          <div className="p-6">
            {/* User Info */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                User Authentication
              </h2>
              {checkResult.user ? (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <div className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-green-800 dark:text-green-200">
                        User authenticated
                      </p>
                      <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                        Email: {checkResult.user.email}
                      </p>
                      <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                        User ID: {checkResult.user.id}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <div className="flex items-start">
                    <XCircle className="h-5 w-5 text-red-500 mr-3 mt-0.5" />
                    <p className="text-sm text-red-800 dark:text-red-200">
                      No user found
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                User Profile
              </h2>
              {checkResult.profile ? (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <div className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-green-800 dark:text-green-200">
                        Profile loaded successfully
                      </p>
                      <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                        Name: {checkResult.profile.full_name || 'Not set'}
                      </p>
                      <p className="text-sm text-green-700 dark:text-green-300">
                        Tier: {checkResult.profile.tier || 'Not set'}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <div className="flex items-start">
                    <AlertCircle className="h-5 w-5 text-yellow-500 mr-3 mt-0.5" />
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      Profile not found - using defaults
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Tier Limits */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Tier Limits
              </h2>
              {checkResult.tierLimits ? (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <div className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-green-800 dark:text-green-200">
                        Tier limits found
                      </p>
                      <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                        Searches per day: {checkResult.tierLimits.searches_per_day === -1 ? 'Unlimited' : checkResult.tierLimits.searches_per_day}
                      </p>
                      <p className="text-sm text-green-700 dark:text-green-300">
                        Documents per month: {checkResult.tierLimits.documents_per_month === -1 ? 'Unlimited' : checkResult.tierLimits.documents_per_month}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <div className="flex items-start">
                    <AlertCircle className="h-5 w-5 text-yellow-500 mr-3 mt-0.5" />
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      No tier limits found - using defaults
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Usage Data */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Usage Tracking
              </h2>
              {checkResult.usageData ? (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <div className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-green-800 dark:text-green-200">
                        Usage data found
                      </p>
                      <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                        Searches today: {checkResult.usageData.action_count}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <div className="flex items-start">
                    <AlertCircle className="h-5 w-5 text-yellow-500 mr-3 mt-0.5" />
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      No usage data found - showing 0
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Errors */}
            {checkResult.errors.length > 0 && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Errors
                </h2>
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <ul className="space-y-2">
                    {checkResult.errors.map((error, index) => (
                      <li key={index} className="flex items-start">
                        <XCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-red-800 dark:text-red-200">{error}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Warnings */}
            {checkResult.warnings.length > 0 && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Warnings
                </h2>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <ul className="space-y-2">
                    {checkResult.warnings.map((warning, index) => (
                      <li key={index} className="flex items-start">
                        <AlertCircle className="h-5 w-5 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-yellow-800 dark:text-yellow-200">{warning}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-4">
              <Link
                href="/dashboard"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
              
              <Link
                href="/debug/dashboard"
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Dashboard Tests
              </Link>
              
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
