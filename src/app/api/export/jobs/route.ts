// API endpoint for export jobs management
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');

    const { data: jobs, error } = await supabase
      .from('export_jobs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ jobs });

  } catch (error: any) {
    console.error('Get export jobs error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { documentIds, jobType, options = {} } = body;

    if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
      return NextResponse.json({ error: 'Document IDs are required' }, { status: 400 });
    }

    if (!jobType) {
      return NextResponse.json({ error: 'Job type is required' }, { status: 400 });
    }

    // Check tier permissions
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('tier')
      .eq('id', user.id)
      .single();

    const { data: limits } = await supabase
      .from('tier_limits')
      .select('export_enabled')
      .eq('tier', profile?.tier || 'free')
      .single();

    if (!limits?.export_enabled) {
      return NextResponse.json(
        { error: 'Export is not available in your tier. Upgrade to Pro or Enterprise.' },
        { status: 403 }
      );
    }

    // Pro tier: max 10 documents
    if (profile?.tier === 'pro' && documentIds.length > 10) {
      return NextResponse.json(
        { error: 'Pro tier allows batch export of up to 10 documents. Upgrade to Enterprise for unlimited.' },
        { status: 403 }
      );
    }

    // Create export job
    const { data: job, error: jobError } = await supabase
      .from('export_jobs')
      .insert({
        user_id: user.id,
        job_type: jobType,
        document_ids: documentIds,
        include_annotations: options.includeAnnotations || false,
        include_watermark: options.includeWatermark || false,
        watermark_text: options.watermarkText,
      })
      .select()
      .single();

    if (jobError) {
      return NextResponse.json({ error: jobError.message }, { status: 500 });
    }

    return NextResponse.json({ job }, { status: 201 });

  } catch (error: any) {
    console.error('Create export job error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
