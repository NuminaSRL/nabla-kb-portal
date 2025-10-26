// Authentication and tier management types

export type UserTier = 'free' | 'pro' | 'enterprise';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  tier: UserTier;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  subscription_status: string | null;
  trial_ends_at: string | null;
  two_factor_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface TierLimits {
  tier: UserTier;
  searches_per_day: number;
  results_per_search: number;
  advanced_filters: boolean;
  saved_searches: boolean;
  export_enabled: boolean;
  api_access: boolean;
  priority_support: boolean;
  custom_integrations: boolean;
}

export interface UsageStats {
  searches_today: number;
  searches_limit: number;
  percentage_used: number;
  can_search: boolean;
}

export interface AuthError {
  message: string;
  code?: string;
}

export interface SignUpData {
  email: string;
  password: string;
  full_name?: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export interface OAuthProvider {
  id: string;
  user_id: string;
  provider: 'google' | 'microsoft';
  provider_user_id: string;
  provider_email: string | null;
  created_at: string;
}

export interface SavedSearch {
  id: string;
  user_id: string;
  search_name: string;
  search_query: string;
  filters: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

export interface SearchHistoryItem {
  id: string;
  user_id: string;
  search_query: string;
  filters: Record<string, any> | null;
  results_count: number | null;
  created_at: string;
}
