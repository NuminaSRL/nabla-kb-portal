import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { recommendationService } from '@/lib/recommendations/recommendation-service';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * POST /api/recommendations/behavior
 * Track user behavior (document interactions, search patterns)
 */
export const dynamic = 'force-dynamic';
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get authenticated user
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { type, data } = body;

    if (!type || !data) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Handle different behavior types
    switch (type) {
      case 'document_interaction':
        await recommendationService.trackDocumentInteraction(user.id, {
          documentId: data.documentId,
          interactionType: data.interactionType,
          duration: data.duration,
          metadata: data.metadata,
        });
        break;

      case 'search_pattern':
        await recommendationService.updateSearchPattern(user.id, {
          query: data.query,
          domain: data.domain,
          documentType: data.documentType,
          relevanceScore: data.relevanceScore,
        });
        break;

      case 'user_interest':
        await recommendationService.updateUserInterest(
          user.id,
          data.interestVector,
          data.domain,
          data.keywords
        );
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid behavior type' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      message: 'Behavior tracked successfully',
    });
  } catch (error) {
    console.error('Track behavior error:', error);
    return NextResponse.json(
      { error: 'Failed to track behavior' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/recommendations/behavior
 * Get user behavior summary
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get authenticated user
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get behavior summary
    const summary = await recommendationService.getUserBehaviorSummary(user.id);

    return NextResponse.json(summary);
  } catch (error) {
    console.error('Get behavior summary error:', error);
    return NextResponse.json(
      { error: 'Failed to get behavior summary' },
      { status: 500 }
    );
  }
}
