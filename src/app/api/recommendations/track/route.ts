import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { recommendationService } from '@/lib/recommendations/recommendation-service';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * POST /api/recommendations/track
 * Track recommendation metrics (impressions, clicks, dismissals)
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
    const { recommendationId, metricType, metricValue } = body;

    if (!recommendationId || !metricType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate metric type
    const validMetricTypes = ['impression', 'click', 'dismiss', 'engagement'];
    if (!validMetricTypes.includes(metricType)) {
      return NextResponse.json(
        { error: 'Invalid metric type' },
        { status: 400 }
      );
    }

    // Track the metric
    await recommendationService.trackRecommendationMetric(user.id, {
      recommendationId,
      metricType,
      metricValue,
    });

    return NextResponse.json({
      success: true,
      message: 'Metric tracked successfully',
    });
  } catch (error) {
    console.error('Track recommendation metric error:', error);
    return NextResponse.json(
      { error: 'Failed to track metric' },
      { status: 500 }
    );
  }
}
