import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { recommendationService } from '@/lib/recommendations/recommendation-service';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * GET /api/recommendations
 * Get personalized recommendations for the authenticated user
 */
export const dynamic = 'force-dynamic';
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

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '20');
    const refresh = searchParams.get('refresh') === 'true';

    // Generate or get recommendations
    let recommendations;
    if (refresh) {
      recommendations = await recommendationService.generateRecommendations(user.id, limit);
    } else {
      recommendations = await recommendationService.getRecommendations(user.id, limit);
      
      // If no recommendations exist, generate them
      if (recommendations.length === 0) {
        recommendations = await recommendationService.generateRecommendations(user.id, limit);
      }
    }

    return NextResponse.json({
      recommendations,
      count: recommendations.length,
    });
  } catch (error) {
    console.error('Get recommendations error:', error);
    return NextResponse.json(
      { error: 'Failed to get recommendations' },
      { status: 500 }
    );
  }
}
