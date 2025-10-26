import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check user tier
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('tier')
      .eq('id', user.id)
      .single();

    if (!profile || (profile.tier !== 'pro' && profile.tier !== 'enterprise')) {
      return NextResponse.json(
        { error: 'Annotations are only available for Pro and Enterprise users' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const pageNumber = searchParams.get('page');

    let query = supabase
      .from('document_highlights')
      .select('*')
      .eq('document_id', params.id)
      .order('created_at', { ascending: true });

    if (pageNumber) {
      query = query.eq('page_number', parseInt(pageNumber));
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check user tier
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('tier')
      .eq('id', user.id)
      .single();

    if (!profile || (profile.tier !== 'pro' && profile.tier !== 'enterprise')) {
      return NextResponse.json(
        { error: 'Annotations are only available for Pro and Enterprise users' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { selection_text, color, position, page_number } = body;

    if (!selection_text || !color || !position) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('document_highlights')
      .insert({
        document_id: params.id,
        user_id: user.id,
        selection_text,
        color,
        position,
        page_number,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

