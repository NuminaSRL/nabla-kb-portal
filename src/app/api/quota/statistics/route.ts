// API endpoint to get usage statistics
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

    // Get days parameter from query
    const searchParams = request.nextUrl.searchParams;
    const days = parseInt(searchParams.get('days') || '7', 10);

    // Get usage statistics
    const statistics = await quotaManager.getUsageStatistics(user.id, days);

    return NextResponse.json({
      success: true,
      data: {
        user_id: user.id,
        period_days: days,
        statistics,
      },
    });
  } catch (err) {
    console.error('Error getting usage statistics:', err);
    return NextResponse.json(
      { error: 'Internal server error', message: 'Failed to get usage statistics' },
      { status: 500 }
    );
  }
}

