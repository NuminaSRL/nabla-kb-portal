// Quota check middleware for API endpoints
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { quotaManager, type QuotaType } from './quota-manager';

export interface QuotaMiddlewareOptions {
  quotaType: QuotaType;
  increment?: number;
  checkOnly?: boolean; // Only check, don't increment
}

export interface QuotaMiddlewareResult {
  allowed: boolean;
  response?: NextResponse;
  userId?: string;
}

/**
 * Middleware to check and enforce quota limits
 */
export async function checkQuotaMiddleware(
  request: NextRequest,
  options: QuotaMiddlewareOptions
): Promise<QuotaMiddlewareResult> {
  try {
    // Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        allowed: false,
        response: NextResponse.json(
          { error: 'Unauthorized', message: 'Authentication required' },
          { status: 401 }
        ),
      };
    }

    const userId = user.id;

    // Check or increment quota
    const quotaResult = options.checkOnly
      ? await quotaManager.checkQuota(userId, options.quotaType)
      : await quotaManager.incrementQuota(userId, options.quotaType, options.increment || 1);

    // If quota exceeded, return error with upgrade prompt
    if (!quotaResult.allowed) {
      const response = {
        error: 'Quota exceeded',
        message: `You have reached your ${options.quotaType} limit for today`,
        quota: {
          usage: quotaResult.usage.usage_count,
          limit: quotaResult.usage.limit_value,
          remaining: quotaResult.usage.remaining,
          period_end: quotaResult.usage.period_end,
        },
        upgrade: quotaResult.show_upgrade_prompt
          ? {
              current_tier: quotaResult.usage.is_unlimited ? 'enterprise' : 'free',
              suggested_tier: quotaResult.suggested_tier,
              message: `Upgrade to ${quotaResult.suggested_tier} for higher limits`,
            }
          : undefined,
      };

      return {
        allowed: false,
        response: NextResponse.json(response, { status: 429 }), // 429 Too Many Requests
        userId,
      };
    }

    // Quota check passed
    return {
      allowed: true,
      userId,
    };
  } catch (err) {
    console.error('Error in quota middleware:', err);
    return {
      allowed: false,
      response: NextResponse.json(
        { error: 'Internal server error', message: 'Failed to check quota' },
        { status: 500 }
      ),
    };
  }
}

/**
 * Higher-order function to wrap API routes with quota checking
 */
export function withQuotaCheck(
  handler: (request: NextRequest, context: any) => Promise<NextResponse>,
  options: QuotaMiddlewareOptions
) {
  return async (request: NextRequest, context: any): Promise<NextResponse> => {
    // Check quota
    const quotaResult = await checkQuotaMiddleware(request, options);

    // If not allowed, return quota error response
    if (!quotaResult.allowed) {
      return quotaResult.response!;
    }

    // Add userId to request context if needed
    if (quotaResult.userId) {
      // Store userId in headers for handler to access
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-user-id', quotaResult.userId);
      
      const modifiedRequest = new NextRequest(request, {
        headers: requestHeaders,
      });

      return handler(modifiedRequest, context);
    }

    // Continue to handler
    return handler(request, context);
  };
}

/**
 * Get quota status for response headers
 */
export async function addQuotaHeaders(
  response: NextResponse,
  userId: string,
  quotaType: QuotaType
): Promise<NextResponse> {
  try {
    const quotaResult = await quotaManager.checkQuota(userId, quotaType);

    // Add quota information to response headers
    response.headers.set('X-RateLimit-Limit', quotaResult.usage.limit_value.toString());
    response.headers.set('X-RateLimit-Remaining', quotaResult.usage.remaining.toString());
    response.headers.set('X-RateLimit-Reset', quotaResult.usage.period_end);

    if (quotaResult.usage.is_unlimited) {
      response.headers.set('X-RateLimit-Unlimited', 'true');
    }

    return response;
  } catch (err) {
    console.error('Error adding quota headers:', err);
    return response;
  }
}

