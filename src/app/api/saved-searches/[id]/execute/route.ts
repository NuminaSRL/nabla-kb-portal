import { NextRequest, NextResponse } from 'next/server';
import { savedSearchService } from '@/lib/saved-searches/saved-search-service';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/saved-searches/[id]/execute
 * Execute a saved search
 */
export async function POST(
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

    const results = await savedSearchService.executeSavedSearch(
      session.user.id,
      params.id
    );

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Execute saved search API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
