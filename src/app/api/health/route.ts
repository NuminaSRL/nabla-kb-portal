import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

/**
 * Health check endpoint for monitoring and load balancers
 * Returns 200 OK if all critical services are operational
 */
export async function GET() {
  const checks = {
    timestamp: new Date().toISOString(),
    status: 'healthy',
    services: {} as Record<string, { status: string; latency?: number; error?: string }>,
  };

  try {
    // Check Supabase connection
    const supabaseStart = Date.now();
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      
      const { error } = await supabase.from('documents').select('id').limit(1);
      
      checks.services.supabase = {
        status: error ? 'degraded' : 'healthy',
        latency: Date.now() - supabaseStart,
        ...(error && { error: error.message }),
      };
    } catch (error) {
      checks.services.supabase = {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      checks.status = 'degraded';
    }

    // Check embedding service (if configured)
    if (process.env.EMBEDDING_SERVICE_URL) {
      const embeddingStart = Date.now();
      try {
        const response = await fetch(`${process.env.EMBEDDING_SERVICE_URL}/health`, {
          method: 'GET',
          signal: AbortSignal.timeout(5000),
        });
        
        checks.services.embedding = {
          status: response.ok ? 'healthy' : 'degraded',
          latency: Date.now() - embeddingStart,
        };
      } catch (error) {
        checks.services.embedding = {
          status: 'unhealthy',
          error: error instanceof Error ? error.message : 'Unknown error',
        };
        // Embedding service is optional, don't mark overall as degraded
      }
    }

    // Determine overall status
    const hasUnhealthyService = Object.values(checks.services).some(
      (service) => service.status === 'unhealthy'
    );
    
    if (hasUnhealthyService) {
      checks.status = 'unhealthy';
      return NextResponse.json(checks, { status: 503 });
    }

    const hasDegradedService = Object.values(checks.services).some(
      (service) => service.status === 'degraded'
    );
    
    if (hasDegradedService) {
      checks.status = 'degraded';
    }

    return NextResponse.json(checks, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        timestamp: new Date().toISOString(),
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    );
  }
}
