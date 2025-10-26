// Tier management and subscription service
import { createClient } from '@/lib/supabase/client';
import type { UserTier, TierLimits, UserProfile } from './types';

export interface TierFeatures {
  name: string;
  price: number;
  priceId?: string; // Stripe price ID
  features: string[];
  limits: TierLimits;
}

export const TIER_FEATURES: Record<UserTier, TierFeatures> = {
  free: {
    name: 'Free',
    price: 0,
    features: [
      '20 searches per day',
      '5 results per search',
      'Basic filters',
      'Search history (7 days)',
    ],
    limits: {
      tier: 'free',
      searches_per_day: 20,
      results_per_search: 5,
      advanced_filters: false,
      saved_searches: false,
      export_enabled: false,
      api_access: false,
      priority_support: false,
      custom_integrations: false,
    },
  },
  pro: {
    name: 'Pro',
    price: 49,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID,
    features: [
      '500 searches per day',
      '50 results per search',
      'Advanced filters',
      'Saved searches',
      'Export to PDF/CSV',
      'Search history (unlimited)',
      'Email support',
    ],
    limits: {
      tier: 'pro',
      searches_per_day: 500,
      results_per_search: 50,
      advanced_filters: true,
      saved_searches: true,
      export_enabled: true,
      api_access: false,
      priority_support: false,
      custom_integrations: false,
    },
  },
  enterprise: {
    name: 'Enterprise',
    price: 299,
    priceId: process.env.NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID,
    features: [
      'Unlimited searches',
      '100 results per search',
      'All advanced filters',
      'Unlimited saved searches',
      'Export to all formats',
      'API access',
      'Priority support',
      'Custom integrations',
      'Dedicated account manager',
      'SLA guarantee',
    ],
    limits: {
      tier: 'enterprise',
      searches_per_day: -1, // Unlimited
      results_per_search: 100,
      advanced_filters: true,
      saved_searches: true,
      export_enabled: true,
      api_access: true,
      priority_support: true,
      custom_integrations: true,
    },
  },
};

export class TierService {
  private supabase = createClient();

  /**
   * Get tier features for a specific tier
   */
  getTierFeatures(tier: UserTier): TierFeatures {
    return TIER_FEATURES[tier];
  }

  /**
   * Get all tier features for comparison
   */
  getAllTierFeatures(): TierFeatures[] {
    return Object.values(TIER_FEATURES);
  }

  /**
   * Check if user has access to a feature
   */
  async hasFeatureAccess(userId: string, feature: keyof TierLimits): Promise<boolean> {
    try {
      const { data: profile } = await this.supabase
        .from('user_profiles')
        .select('tier')
        .eq('id', userId)
        .single();

      if (!profile) return false;

      const { data: limits } = await this.supabase
        .from('tier_limits')
        .select(feature)
        .eq('tier', profile.tier)
        .single();

      return (limits as any)?.[feature] === true || (limits as any)?.[feature] === -1;
    } catch (err) {
      console.error('Error checking feature access:', err);
      return false;
    }
  }

  /**
   * Upgrade user tier
   */
  async upgradeTier(
    userId: string,
    newTier: UserTier,
    stripeSubscriptionId?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const updates: Partial<UserProfile> = {
        tier: newTier,
        subscription_status: 'active',
      };

      if (stripeSubscriptionId) {
        updates.stripe_subscription_id = stripeSubscriptionId;
      }

      const { error } = await this.supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', userId);

      if (error) {
        return { success: false, error: error.message };
      }

      // Log audit event
      await this.supabase.from('audit_log').insert({
        user_id: userId,
        action: 'tier_upgrade',
        resource_type: 'subscription',
        metadata: { new_tier: newTier },
      });

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Downgrade user tier
   */
  async downgradeTier(userId: string, newTier: UserTier): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('user_profiles')
        .update({
          tier: newTier,
          subscription_status: newTier === 'free' ? null : 'active',
        })
        .eq('id', userId);

      if (error) {
        return { success: false, error: error.message };
      }

      // Log audit event
      await this.supabase.from('audit_log').insert({
        user_id: userId,
        action: 'tier_downgrade',
        resource_type: 'subscription',
        metadata: { new_tier: newTier },
      });

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('user_profiles')
        .update({
          subscription_status: 'canceled',
        })
        .eq('id', userId);

      if (error) {
        return { success: false, error: error.message };
      }

      // Log audit event
      await this.supabase.from('audit_log').insert({
        user_id: userId,
        action: 'subscription_canceled',
        resource_type: 'subscription',
      });

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Check if user is on trial
   */
  async isOnTrial(userId: string): Promise<boolean> {
    try {
      const { data: profile } = await this.supabase
        .from('user_profiles')
        .select('trial_ends_at, tier')
        .eq('id', userId)
        .single();

      if (!profile || !profile.trial_ends_at) return false;

      const trialEnd = new Date(profile.trial_ends_at);
      const now = new Date();

      return trialEnd > now && profile.tier === 'free';
    } catch (err) {
      console.error('Error checking trial status:', err);
      return false;
    }
  }

  /**
   * Get days remaining in trial
   */
  async getTrialDaysRemaining(userId: string): Promise<number> {
    try {
      const { data: profile } = await this.supabase
        .from('user_profiles')
        .select('trial_ends_at')
        .eq('id', userId)
        .single();

      if (!profile || !profile.trial_ends_at) return 0;

      const trialEnd = new Date(profile.trial_ends_at);
      const now = new Date();
      const diffTime = trialEnd.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      return Math.max(0, diffDays);
    } catch (err) {
      console.error('Error getting trial days:', err);
      return 0;
    }
  }

  /**
   * Update Stripe customer ID
   */
  async updateStripeCustomerId(userId: string, customerId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('user_profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', userId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Get subscription status
   */
  async getSubscriptionStatus(userId: string): Promise<{
    tier: UserTier;
    status: string | null;
    trial_ends_at: string | null;
    is_trial: boolean;
    days_remaining: number;
  } | null> {
    try {
      const { data: profile } = await this.supabase
        .from('user_profiles')
        .select('tier, subscription_status, trial_ends_at')
        .eq('id', userId)
        .single();

      if (!profile) return null;

      const isTrial = await this.isOnTrial(userId);
      const daysRemaining = await this.getTrialDaysRemaining(userId);

      return {
        tier: profile.tier as UserTier,
        status: profile.subscription_status,
        trial_ends_at: profile.trial_ends_at,
        is_trial: isTrial,
        days_remaining: daysRemaining,
      };
    } catch (err) {
      console.error('Error getting subscription status:', err);
      return null;
    }
  }
}

// Export singleton instance
export const tierService = new TierService();
