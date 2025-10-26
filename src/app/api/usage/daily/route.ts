import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get days parameter
    const searchParams = request.nextUrl.searchParams;
    const days = parseInt(searchParams.get('days') || '7');

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get daily usage from quota_usage table
    const { data, error } = await supabase
      .from('quota_usage')
      .select('period_start, usage_count, quota_type')
      .eq('user_id', user.id)
      .gte('period_start', startDate.toISOString())
      .lte('period_start', endDate.toISOString())
      .order('period_start', { ascending: true });

    if (error) {
      console.error('Error fetching daily usage:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch daily usage' },
        { status: 500 }
      );
    }

    // Group by date and quota type
    const dailyUsageMap = new Map<string, { searches: number; exports: number }>();
    
    // Initialize all days with zero values
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateKey = date.toISOString().split('T')[0];
      dailyUsageMap.set(dateKey, { searches: 0, exports: 0 });
    }

    // Fill in actual usage data
    data?.forEach((record) => {
      const dateKey = new Date(record.period_start).toISOString().split('T')[0];
      const existing = dailyUsageMap.get(dateKey) || { searches: 0, exports: 0 };
      
      if (record.quota_type === 'search') {
        existing.searches = record.usage_count;
      } else if (record.quota_type === 'export') {
        existing.exports = record.usage_count;
      }
      
      dailyUsageMap.set(dateKey, existing);
    });

    // Convert to array
    const dailyUsage = Array.from(dailyUsageMap.entries()).map(([date, usage]) => ({
      date,
      searches: usage.searches,
      exports: usage.exports,
    }));

    return NextResponse.json({
      success: true,
      data: dailyUsage,
    });
  } catch (error) {
    console.error('Error in daily usage API:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
