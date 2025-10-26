// API endpoint for quota reset (admin only)
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { quotaScheduler } from '@/lib/quota/quota-scheduler';
import { quotaManager } from '@/lib/quota/quota-manager';

export const dynamic = 'force-dynamic';
export async function POST(request: NextRequest) {
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

    // Check if user is admin (you can add admin role check here)
    // For now, we'll use an environment variable for admin API key
    const apiKey = request.headers.get('x-admin-api-key');
    if (apiKey !== process.env.ADMIN_API_KEY) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Admin access required' },
        { status: 403 }
      );
    }

    // Manually trigger reset
    const startTime = Date.now();
    const result = await quotaManager.resetDailyQuotas();
    const executionTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      message: 'Quota reset completed',
      data: {
        users_reset: result.users_reset,
        quotas_reset: result.quotas_reset,
        execution_time_ms: executionTime,
      },
    });
  } catch (err) {
    console.error('Error resetting quotas:', err);
    return NextResponse.json(
      { error: 'Internal server error', message: 'Failed to reset quotas' },
      { status: 500 }
    );
  }
}

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

    // Check admin access
    const apiKey = request.headers.get('x-admin-api-key');
    if (apiKey !== process.env.ADMIN_API_KEY) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Admin access required' },
        { status: 403 }
      );
    }

    // Get scheduler status
    const status = quotaScheduler.getStatus();

    // Get recent reset logs
    const { data: resetLogs } = await supabase
      .from('quota_reset_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    return NextResponse.json({
      success: true,
      data: {
        scheduler: status,
        recent_resets: resetLogs || [],
      },
    });
  } catch (err) {
    console.error('Error getting reset status:', err);
    return NextResponse.json(
      { error: 'Internal server error', message: 'Failed to get reset status' },
      { status: 500 }
    );
  }
}

