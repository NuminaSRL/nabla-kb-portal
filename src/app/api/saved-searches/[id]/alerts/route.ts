import { NextRequest, NextResponse } from 'next/server';
import { savedSearchService } from '@/lib/saved-searches/saved-search-service';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/saved-searches/[id]/alerts
 * Get alerts for a specific saved search
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '10');

    const alerts = await savedSearchService.getSearchAlerts(
      session.user.id,
      params.id,
      limit
    );

    return NextResponse.json({ alerts });
  } catch (error) {
    console.error('Get search alerts API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
