// API endpoint to get quota status
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { quotaManager } from '@/lib/quota/quota-manager';

export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get all quota status
    const quotaStatus = await quotaManager.getAllQuotaStatus(user.id);

    // Get user profile for tier info
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('tier, subscription_status')
      .eq('id', user.id)
      .single();

    return NextResponse.json({
      success: true,
      data: {
        user_id: user.id,
        tier: profile?.tier || 'free',
        subscription_status: profile?.subscription_status,
        quotas: quotaStatus,
      },
    });
  } catch (err) {
    console.error('Error getting quota status:', err);
    return NextResponse.json(
      { error: 'Internal server error', message: 'Failed to get quota status' },
      { status: 500 }
    );
  }
}

