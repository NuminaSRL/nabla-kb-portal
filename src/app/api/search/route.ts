import { NextRequest, NextResponse } from 'next/server';
import { searchService } from '@/lib/search/search-service';
import { createClient } from '@/lib/supabase/server';
import { checkQuotaMiddleware, addQuotaHeaders } from '@/lib/quota/quota-middleware';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Check quota before processing search
    const quotaResult = await checkQuotaMiddleware(request, {
      quotaType: 'search',
      increment: 1,
    });

    if (!quotaResult.allowed) {
      return quotaResult.response!;
    }

    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');

    if (!query) {
      return NextResponse.json({ error: 'Query parameter required' }, { status: 400 });
    }

    // Parse search options
    const options = {
      limit: parseInt(searchParams.get('limit') || '20'),
      offset: parseInt(searchParams.get('offset') || '0'),
      domainFilter: searchParams.get('domain')?.split(',').filter(Boolean),
      documentTypeFilter: searchParams.get('type')?.split(',').filter(Boolean),
      sourceFilter: searchParams.get('source')?.split(',').filter(Boolean),
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
      minRelevanceScore: parseFloat(searchParams.get('minScore') || '0.5'),
    };

    // Perform semantic search
    const searchResponse = await searchService.semanticSearch(query, options);

    // Save search to history
    await searchService.saveSearchHistory(session.user.id, query);

    // Create response with quota headers
    const response = NextResponse.json({
      success: true,
      ...searchResponse,
    });

    // Add quota information to response headers
    const responseWithHeaders = await addQuotaHeaders(response, session.user.id, 'search');

    return responseWithHeaders;
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check quota before processing search
    const quotaResult = await checkQuotaMiddleware(request, {
      quotaType: 'search',
      increment: 1,
    });

    if (!quotaResult.allowed) {
      return quotaResult.response!;
    }

    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { query, options } = body;

    if (!query) {
      return NextResponse.json({ error: 'Query required' }, { status: 400 });
    }

    // Perform semantic search
    const searchResponse = await searchService.semanticSearch(query, options || {});

    // Save search to history
    await searchService.saveSearchHistory(session.user.id, query);

    // Create response with quota headers
    const response = NextResponse.json({
      success: true,
      ...searchResponse,
    });

    // Add quota information to response headers
    const responseWithHeaders = await addQuotaHeaders(response, session.user.id, 'search');

    return responseWithHeaders;
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
