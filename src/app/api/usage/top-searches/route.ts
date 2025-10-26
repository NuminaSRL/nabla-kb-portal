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

    // Get limit parameter
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '10');

    // Get top searches by counting occurrences in search history
    const { data, error } = await supabase
      .from('search_history')
      .select('query, searched_at')
      .eq('user_id', user.id)
      .order('searched_at', { ascending: false });

    if (error) {
      console.error('Error fetching search history for top searches:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch top searches' },
        { status: 500 }
      );
    }

    // Count occurrences of each query
    const queryCount = new Map<string, { count: number; last_searched: string }>();
    
    data?.forEach((record) => {
      const existing = queryCount.get(record.query);
      if (existing) {
        existing.count++;
        // Keep the most recent search date
        if (new Date(record.searched_at) > new Date(existing.last_searched)) {
          existing.last_searched = record.searched_at;
        }
      } else {
        queryCount.set(record.query, {
          count: 1,
          last_searched: record.searched_at,
        });
      }
    });

    // Convert to array and sort by count
    const topSearches = Array.from(queryCount.entries())
      .map(([query, data]) => ({
        query,
        count: data.count,
        last_searched: data.last_searched,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);

    return NextResponse.json({
      success: true,
      data: topSearches,
    });
  } catch (error) {
    console.error('Error in top searches API:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
