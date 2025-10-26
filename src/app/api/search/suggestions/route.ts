import { NextRequest, NextResponse } from 'next/server';
import { searchService } from '@/lib/search/search-service';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');

    if (!query || query.length < 2) {
      return NextResponse.json({ suggestions: [] });
    }

    // Get suggestions
    const suggestions = await searchService.getSuggestions(query, 5);

    // Get recent searches
    const recentSearches = await searchService.getRecentSearches(session.user.id, 3);

    // Combine suggestions with recent searches
    const allSuggestions = [
      ...recentSearches
        .filter((s) => s.toLowerCase().includes(query.toLowerCase()))
        .map((text) => ({
          id: `history-${text}`,
          text,
          type: 'history' as const,
        })),
      ...suggestions.map((text) => ({
        id: `suggestion-${text}`,
        text,
        type: 'suggestion' as const,
      })),
    ];

    // Remove duplicates and limit
    const uniqueSuggestions = Array.from(
      new Map(allSuggestions.map((item) => [item.text, item])).values()
    ).slice(0, 8);

    return NextResponse.json({ suggestions: uniqueSuggestions });
  } catch (error) {
    console.error('Suggestions API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
