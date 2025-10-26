import { NextRequest, NextResponse } from 'next/server';
import { recommendationScheduler } from '@/lib/recommendations/recommendation-scheduler';

/**
 * POST /api/recommendations/scheduler
 * Run the recommendation scheduler (for Railway cron job)
 */
export const dynamic = 'force-dynamic';
export async function POST(request: NextRequest) {
  try {
    // Verify the request is from Railway or has the correct secret
    const authHeader = request.headers.get('authorization');
    const expectedSecret = process.env.SCHEDULER_SECRET || 'default-secret';

    if (authHeader !== `Bearer ${expectedSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Run the scheduler
    await recommendationScheduler.runScheduledTasks();

    return NextResponse.json({
      success: true,
      message: 'Recommendation scheduler completed successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Scheduler error:', error);
    return NextResponse.json(
      { error: 'Scheduler failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/recommendations/scheduler
 * Check scheduler status
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: 'ready',
    message: 'Recommendation scheduler is ready',
    timestamp: new Date().toISOString(),
  });
}
