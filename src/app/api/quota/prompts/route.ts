// API endpoint to manage upgrade prompts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { quotaManager } from '@/lib/quota/quota-manager';

export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get include_dismissed parameter
    const searchParams = request.nextUrl.searchParams;
    const includeDismissed = searchParams.get('include_dismissed') === 'true';

    // Get upgrade prompts
    const prompts = await quotaManager.getUpgradePrompts(user.id, includeDismissed);

    return NextResponse.json({
      success: true,
      data: {
        user_id: user.id,
        prompts,
      },
    });
  } catch (err) {
    console.error('Error getting upgrade prompts:', err);
    return NextResponse.json(
      { error: 'Internal server error', message: 'Failed to get upgrade prompts' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { prompt_id, action } = body;

    if (!prompt_id || !action) {
      return NextResponse.json(
        { error: 'Bad request', message: 'prompt_id and action are required' },
        { status: 400 }
      );
    }

    // Perform action
    if (action === 'dismiss') {
      await quotaManager.dismissUpgradePrompt(prompt_id);
    } else if (action === 'convert') {
      await quotaManager.markUpgradePromptConverted(prompt_id);
    } else {
      return NextResponse.json(
        { error: 'Bad request', message: 'Invalid action. Use "dismiss" or "convert"' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Prompt ${action}ed successfully`,
    });
  } catch (err) {
    console.error('Error updating upgrade prompt:', err);
    return NextResponse.json(
      { error: 'Internal server error', message: 'Failed to update upgrade prompt' },
      { status: 500 }
    );
  }
}

