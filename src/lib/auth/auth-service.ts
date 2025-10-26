// Authentication service for KB Portal
import { createClient } from '@/lib/supabase/client';
import type { 
  UserProfile, 
  SignUpData, 
  SignInData, 
  AuthError,
  TierLimits,
  UsageStats 
} from './types';

export class AuthService {
  private supabase = createClient();

  /**
   * Sign up a new user with email and password
   */
  async signUp(data: SignUpData): Promise<{ user: any; error: AuthError | null }> {
    try {
      const { data: authData, error } = await this.supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.full_name || '',
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        return { user: null, error: { message: error.message, code: error.code } };
      }

      return { user: authData.user, error: null };
    } catch (err: any) {
      return { user: null, error: { message: err.message } };
    }
  }

  /**
   * Sign in with email and password
   */
  async signIn(data: SignInData): Promise<{ user: any; error: AuthError | null }> {
    try {
      const { data: authData, error } = await this.supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        return { user: null, error: { message: error.message, code: error.code } };
      }

      // Log audit event
      // TODO: Create audit_log table
      // await this.logAuditEvent('sign_in', 'auth', authData.user?.id);

      return { user: authData.user, error: null };
    } catch (err: any) {
      return { user: null, error: { message: err.message } };
    }
  }

  /**
   * Sign in with OAuth provider (Google or Microsoft)
   */
  async signInWithOAuth(provider: 'google' | 'azure'): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await this.supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        return { error: { message: error.message, code: error.code } };
      }

      return { error: null };
    } catch (err: any) {
      return { error: { message: err.message } };
    }
  }

  /**
   * Sign out the current user
   */
  async signOut(): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await this.supabase.auth.signOut();

      if (error) {
        return { error: { message: error.message, code: error.code } };
      }

      return { error: null };
    } catch (err: any) {
      return { error: { message: err.message } };
    }
  }

  /**
   * Get current user session
   */
  async getSession() {
    const { data: { session }, error } = await this.supabase.auth.getSession();
    return { session, error };
  }

  /**
   * Get current user
   */
  async getUser() {
    const { data: { user }, error } = await this.supabase.auth.getUser();
    return { user, error };
  }

  /**
   * Get user profile with tier information
   */
  async getUserProfile(userId: string): Promise<{ profile: UserProfile | null; error: AuthError | null }> {
    try {
      const { data, error } = await this.supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        return { profile: null, error: { message: error.message, code: error.code } };
      }

      return { profile: data as UserProfile, error: null };
    } catch (err: any) {
      return { profile: null, error: { message: err.message } };
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, updates: Partial<UserProfile>): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await this.supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', userId);

      if (error) {
        return { error: { message: error.message, code: error.code } };
      }

      // Log audit event
      // TODO: Create audit_log table
      // await this.logAuditEvent('profile_update', 'user_profile', userId);

      return { error: null };
    } catch (err: any) {
      return { error: { message: err.message } };
    }
  }

  /**
   * Get tier limits for a specific tier
   */
  async getTierLimits(tier: string): Promise<{ limits: TierLimits | null; error: AuthError | null }> {
    try {
      const { data, error } = await this.supabase
        .from('tier_limits')
        .select('*')
        .eq('tier', tier)
        .single();

      if (error) {
        return { limits: null, error: { message: error.message, code: error.code } };
      }

      return { limits: data as TierLimits, error: null };
    } catch (err: any) {
      return { limits: null, error: { message: err.message } };
    }
  }

  /**
   * Check if user can perform an action based on usage limits
   */
  async checkUsageLimit(userId: string, actionType: string): Promise<{ allowed: boolean; error: AuthError | null }> {
    try {
      const { data, error } = await this.supabase.rpc('check_usage_limit', {
        p_user_id: userId,
        p_action_type: actionType,
      });

      if (error) {
        return { allowed: false, error: { message: error.message, code: error.code } };
      }

      return { allowed: data as boolean, error: null };
    } catch (err: any) {
      return { allowed: false, error: { message: err.message } };
    }
  }

  /**
   * Track user action for usage limits
   */
  async trackUsage(userId: string, actionType: string, metadata?: Record<string, any>): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await this.supabase.rpc('track_usage', {
        p_user_id: userId,
        p_action_type: actionType,
        p_metadata: metadata || null,
      });

      if (error) {
        return { error: { message: error.message, code: error.code } };
      }

      return { error: null };
    } catch (err: any) {
      return { error: { message: err.message } };
    }
  }

  /**
   * Get usage statistics for the current user
   */
  async getUsageStats(userId: string): Promise<{ stats: UsageStats | null; error: AuthError | null }> {
    try {
      // Get user profile to determine tier
      const { profile, error: profileError } = await this.getUserProfile(userId);
      if (profileError || !profile) {
        return { stats: null, error: profileError };
      }

      // Get tier limits
      const { limits, error: limitsError } = await this.getTierLimits(profile.tier);
      if (limitsError || !limits) {
        return { stats: null, error: limitsError };
      }

      // Get today's usage
      const { data: usageData, error: usageError } = await this.supabase
        .from('usage_tracking')
        .select('action_count')
        .eq('user_id', userId)
        .eq('action_type', 'search')
        .eq('action_date', new Date().toISOString().split('T')[0])
        .single();

      const searchesToday = usageData?.action_count || 0;
      const searchesLimit = limits.searches_per_day === -1 ? Infinity : limits.searches_per_day;
      const percentageUsed = searchesLimit === Infinity ? 0 : (searchesToday / searchesLimit) * 100;
      const canSearch = searchesLimit === Infinity || searchesToday < searchesLimit;

      return {
        stats: {
          searches_today: searchesToday,
          searches_limit: searchesLimit,
          percentage_used: percentageUsed,
          can_search: canSearch,
        },
        error: null,
      };
    } catch (err: any) {
      return { stats: null, error: { message: err.message } };
    }
  }

  /**
   * Send password reset email
   */
  async resetPassword(email: string): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        return { error: { message: error.message, code: error.code } };
      }

      return { error: null };
    } catch (err: any) {
      return { error: { message: err.message } };
    }
  }

  /**
   * Update password
   */
  async updatePassword(newPassword: string): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await this.supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        return { error: { message: error.message, code: error.code } };
      }

      return { error: null };
    } catch (err: any) {
      return { error: { message: err.message } };
    }
  }

  /**
   * Enable 2FA for user
   */
  async enable2FA(userId: string): Promise<{ secret: string | null; error: AuthError | null }> {
    try {
      // Generate TOTP secret
      const { data, error } = await this.supabase.auth.mfa.enroll({
        factorType: 'totp',
      });

      if (error) {
        return { secret: null, error: { message: error.message, code: error.code } };
      }

      // Update user profile
      await this.updateProfile(userId, { two_factor_enabled: true });

      // Log audit event
      // TODO: Create audit_log table
      // await this.logAuditEvent('2fa_enabled', 'auth', userId);

      return { secret: data.totp.secret, error: null };
    } catch (err: any) {
      return { secret: null, error: { message: err.message } };
    }
  }

  /**
   * Verify 2FA code
   */
  async verify2FA(factorId: string, code: string): Promise<{ verified: boolean; error: AuthError | null }> {
    try {
      const { data, error } = await this.supabase.auth.mfa.challenge({
        factorId,
      });

      if (error) {
        return { verified: false, error: { message: error.message, code: error.code } };
      }

      const { error: verifyError } = await this.supabase.auth.mfa.verify({
        factorId,
        challengeId: data.id,
        code,
      });

      if (verifyError) {
        return { verified: false, error: { message: verifyError.message, code: verifyError.code } };
      }

      return { verified: true, error: null };
    } catch (err: any) {
      return { verified: false, error: { message: err.message } };
    }
  }

  /**
   * Log audit event
   */
  private async logAuditEvent(action: string, resourceType: string, resourceId?: string): Promise<void> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      
      await this.supabase.from('audit_log').insert({
        user_id: user?.id,
        action,
        resource_type: resourceType,
        resource_id: resourceId,
        metadata: {},
      });
    } catch (err) {
      console.error('Failed to log audit event:', err);
    }
  }
}

// Export singleton instance
export const authService = new AuthService();
