import { NextRequest, NextResponse } from 'next/server';
import { savedSearchService } from '@/lib/saved-searches/saved-search-service';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/saved-searches/[id]
 * Get a specific saved search
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

    const savedSearch = await savedSearchService.getSavedSearch(
      session.user.id,
      params.id
    );

    if (!savedSearch) {
      return NextResponse.json({ error: 'Saved search not found' }, { status: 404 });
    }

    return NextResponse.json({ saved_search: savedSearch });
  } catch (error) {
    console.error('Get saved search API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/saved-searches/[id]
 * Update a saved search
 */
export async function PATCH(
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

    const body = await request.json();
    const { name, query, filters, alert_enabled, alert_frequency } = body;

    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (query !== undefined) updates.query = query;
    if (filters !== undefined) updates.filters = filters;
    if (alert_enabled !== undefined) updates.alert_enabled = alert_enabled;
    if (alert_frequency !== undefined) updates.alert_frequency = alert_frequency;

    const savedSearch = await savedSearchService.updateSavedSearch(
      session.user.id,
      params.id,
      updates
    );

    return NextResponse.json({ saved_search: savedSearch });
  } catch (error) {
    console.error('Update saved search API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/saved-searches/[id]
 * Delete a saved search
 */
export async function DELETE(
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

    await savedSearchService.deleteSavedSearch(session.user.id, params.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete saved search API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
