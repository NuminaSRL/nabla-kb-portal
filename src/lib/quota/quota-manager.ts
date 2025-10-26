// Quota management service with tier-based enforcement
import { createClient } from '@/lib/supabase/client';
import type { UserTier } from '@/lib/auth/types';

export interface QuotaUsage {
  usage_count: number;
  limit_value: number;
  remaining: number;
  period_start: string;
  period_end: string;
  is_unlimited: boolean;
}

export interface QuotaCheckResult {
  allowed: boolean;
  usage: QuotaUsage;
  quota_exceeded: boolean;
  show_upgrade_prompt: boolean;
  suggested_tier?: UserTier;
}

export interface UsageStatistics {
  quota_type: string;
  total_usage: number;
  avg_daily_usage: number;
  max_daily_usage: number;
  days_at_limit: number;
  current_tier: UserTier;
}

export interface UpgradePrompt {
  id: string;
  prompt_type: string;
  quota_type: string;
  current_tier: UserTier;
  suggested_tier: UserTier;
  shown_at: string;
  dismissed_at?: string;
  converted_at?: string;
  metadata?: Record<string, any>;
}

export type QuotaType = 'search' | 'export' | 'api_call';

export class QuotaManager {
  private supabase = createClient();

  /**
   * Check if user can perform action (without incrementing)
   */
  async checkQuota(userId: string, quotaType: QuotaType): Promise<QuotaCheckResult> {
    try {
      // Get current quota usage
      const { data: usageData, error: usageError } = await this.supabase
        .rpc('get_quota_usage', {
          p_user_id: userId,
          p_quota_type: quotaType,
        })
        .single();

      if (usageError) {
        console.error('Error checking quota:', usageError);
        throw usageError;
      }

      const usage: QuotaUsage = usageData as QuotaUsage;
      const quotaExceeded = !usage.is_unlimited && usage.usage_count >= usage.limit_value;

      // Check if upgrade prompt should be shown
      const { data: shouldShowPrompt } = await this.supabase
        .rpc('should_show_upgrade_prompt', {
          p_user_id: userId,
          p_quota_type: quotaType,
        })
        .single();

      // Determine suggested tier
      let suggestedTier: UserTier | undefined;
      if (quotaExceeded) {
        const { data: profile } = await this.supabase
          .from('user_profiles')
          .select('tier')
          .eq('id', userId)
          .single();

        if (profile) {
          suggestedTier = this.getSuggestedTier(profile.tier as UserTier);
        }
      }

      return {
        allowed: !quotaExceeded,
        usage,
        quota_exceeded: quotaExceeded,
        show_upgrade_prompt: Boolean(shouldShowPrompt),
        suggested_tier: suggestedTier,
      };
    } catch (err) {
      console.error('Error in checkQuota:', err);
      throw err;
    }
  }

  /**
   * Increment quota usage and check if allowed
   */
  async incrementQuota(
    userId: string,
    quotaType: QuotaType,
    increment: number = 1
  ): Promise<QuotaCheckResult> {
    try {
      // Increment usage
      const { data: incrementData, error: incrementError } = await this.supabase
        .rpc('increment_quota_usage', {
          p_user_id: userId,
          p_quota_type: quotaType,
          p_increment: increment,
        })
        .single();

      if (incrementError) {
        console.error('Error incrementing quota:', incrementError);
        throw incrementError;
      }

      const { success, usage_count, limit_value, remaining, quota_exceeded } = incrementData as any;

      // If quota exceeded, create upgrade prompt
      if (quota_exceeded) {
        await this.createUpgradePrompt(userId, quotaType);
      }

      // Get full usage data
      const { data: usageData } = await this.supabase
        .rpc('get_quota_usage', {
          p_user_id: userId,
          p_quota_type: quotaType,
        })
        .single();

      // Check if upgrade prompt should be shown
      const { data: shouldShowPrompt } = await this.supabase
        .rpc('should_show_upgrade_prompt', {
          p_user_id: userId,
          p_quota_type: quotaType,
        })
        .single();

      // Get suggested tier
      const { data: profile } = await this.supabase
        .from('user_profiles')
        .select('tier')
        .eq('id', userId)
        .single();

      const suggestedTier = profile ? this.getSuggestedTier(profile.tier as UserTier) : undefined;

      return {
        allowed: success,
        usage: (usageData || {
          usage_count,
          limit_value,
          remaining,
          period_start: new Date().toISOString(),
          period_end: new Date(Date.now() + 86400000).toISOString(),
          is_unlimited: limit_value === -1,
        }) as QuotaUsage,
        quota_exceeded,
        show_upgrade_prompt: Boolean(shouldShowPrompt),
        suggested_tier: quota_exceeded ? suggestedTier : undefined,
      };
    } catch (err) {
      console.error('Error in incrementQuota:', err);
      throw err;
    }
  }

  /**
   * Get usage statistics for user
   */
  async getUsageStatistics(userId: string, days: number = 7): Promise<UsageStatistics[]> {
    try {
      const { data, error } = await this.supabase
        .rpc('get_usage_statistics', {
          p_user_id: userId,
          p_days: days,
        });

      if (error) {
        console.error('Error getting usage statistics:', error);
        throw error;
      }

      return data || [];
    } catch (err) {
      console.error('Error in getUsageStatistics:', err);
      throw err;
    }
  }

  /**
   * Get current quota status for all quota types
   */
  async getAllQuotaStatus(userId: string): Promise<Record<QuotaType, QuotaUsage>> {
    try {
      const quotaTypes: QuotaType[] = ['search', 'export', 'api_call'];
      const results: Record<string, QuotaUsage> = {};

      for (const quotaType of quotaTypes) {
        const { data, error } = await this.supabase
          .rpc('get_quota_usage', {
            p_user_id: userId,
            p_quota_type: quotaType,
          })
          .single();

        if (!error && data) {
          results[quotaType] = data as QuotaUsage;
        }
      }

      return results as Record<QuotaType, QuotaUsage>;
    } catch (err) {
      console.error('Error in getAllQuotaStatus:', err);
      throw err;
    }
  }

  /**
   * Create upgrade prompt
   */
  private async createUpgradePrompt(userId: string, quotaType: QuotaType): Promise<void> {
    try {
      // Get user's current tier
      const { data: profile } = await this.supabase
        .from('user_profiles')
        .select('tier')
        .eq('id', userId)
        .single();

      if (!profile) return;

      const currentTier = profile.tier as UserTier;
      const suggestedTier = this.getSuggestedTier(currentTier);

      // Insert upgrade prompt
      await this.supabase.from('upgrade_prompts').insert({
        user_id: userId,
        prompt_type: 'quota_exceeded',
        quota_type: quotaType,
        current_tier: currentTier,
        suggested_tier: suggestedTier,
        metadata: {
          quota_type: quotaType,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (err) {
      console.error('Error creating upgrade prompt:', err);
      // Don't throw - this is non-critical
    }
  }

  /**
   * Get suggested tier for upgrade
   */
  private getSuggestedTier(currentTier: UserTier): UserTier {
    switch (currentTier) {
      case 'free':
        return 'pro';
      case 'pro':
        return 'enterprise';
      case 'enterprise':
        return 'enterprise'; // Already at highest tier
      default:
        return 'pro';
    }
  }

  /**
   * Get upgrade prompts for user
   */
  async getUpgradePrompts(userId: string, includeDismissed: boolean = false): Promise<UpgradePrompt[]> {
    try {
      let query = this.supabase
        .from('upgrade_prompts')
        .select('*')
        .eq('user_id', userId)
        .order('shown_at', { ascending: false });

      if (!includeDismissed) {
        query = query.is('dismissed_at', null);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error getting upgrade prompts:', error);
        throw error;
      }

      return data || [];
    } catch (err) {
      console.error('Error in getUpgradePrompts:', err);
      throw err;
    }
  }

  /**
   * Dismiss upgrade prompt
   */
  async dismissUpgradePrompt(promptId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('upgrade_prompts')
        .update({ dismissed_at: new Date().toISOString() })
        .eq('id', promptId);

      if (error) {
        console.error('Error dismissing upgrade prompt:', error);
        throw error;
      }
    } catch (err) {
      console.error('Error in dismissUpgradePrompt:', err);
      throw err;
    }
  }

  /**
   * Mark upgrade prompt as converted
   */
  async markUpgradePromptConverted(promptId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('upgrade_prompts')
        .update({ converted_at: new Date().toISOString() })
        .eq('id', promptId);

      if (error) {
        console.error('Error marking upgrade prompt as converted:', error);
        throw error;
      }
    } catch (err) {
      console.error('Error in markUpgradePromptConverted:', err);
      throw err;
    }
  }

  /**
   * Reset quotas (called by scheduler)
   */
  async resetDailyQuotas(): Promise<{ users_reset: number; quotas_reset: number }> {
    try {
      const { data, error } = await this.supabase
        .rpc('reset_daily_quotas')
        .single();

      if (error) {
        console.error('Error resetting daily quotas:', error);
        throw error;
      }

      // Log reset
      await this.supabase.from('quota_reset_log').insert({
        reset_date: new Date().toISOString().split('T')[0],
        users_reset: (data as any).users_reset,
        quotas_reset: (data as any).quotas_reset,
        execution_time_ms: 0, // Will be updated by scheduler
        status: 'success',
      });

      return data as { users_reset: number; quotas_reset: number };
    } catch (err) {
      console.error('Error in resetDailyQuotas:', err);
      
      // Log failed reset
      await this.supabase.from('quota_reset_log').insert({
        reset_date: new Date().toISOString().split('T')[0],
        users_reset: 0,
        quotas_reset: 0,
        execution_time_ms: 0,
        status: 'failed',
        error_message: err instanceof Error ? err.message : 'Unknown error',
      });

      throw err;
    }
  }
}

// Export singleton instance
export const quotaManager = new QuotaManager();

