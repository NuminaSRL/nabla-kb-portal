import { NextRequest, NextResponse } from 'next/server';
import { savedSearchService } from '@/lib/saved-searches/saved-search-service';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/saved-searches
 * Get all saved searches for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const savedSearches = await savedSearchService.getSavedSearches(session.user.id);

    // Get count and limit
    const count = await savedSearchService.getSavedSearchesCount(session.user.id);
    const limit = await savedSearchService.getSavedSearchLimit(session.user.id);

    return NextResponse.json({
      saved_searches: savedSearches,
      count,
      limit,
    });
  } catch (error) {
    console.error('Get saved searches API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/saved-searches
 * Create a new saved search
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, query, filters, alert_enabled, alert_frequency } = body;

    if (!name || !query) {
      return NextResponse.json(
        { error: 'Name and query are required' },
        { status: 400 }
      );
    }

    // Check if user can create more saved searches
    const canCreate = await savedSearchService.checkSavedSearchLimit(session.user.id);
    if (!canCreate) {
      const limit = await savedSearchService.getSavedSearchLimit(session.user.id);
      return NextResponse.json(
        {
          error: 'Saved search limit reached',
          message: `You have reached the limit of ${limit} saved searches for your tier. Please upgrade to create more.`,
        },
        { status: 403 }
      );
    }

    const savedSearch = await savedSearchService.createSavedSearch(session.user.id, {
      name,
      query,
      filters,
      alert_enabled,
      alert_frequency,
    });

    return NextResponse.json({ saved_search: savedSearch }, { status: 201 });
  } catch (error) {
    console.error('Create saved search API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
