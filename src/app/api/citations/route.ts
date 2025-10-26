import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/citations
 * Generate citations for a document
 */
export const dynamic = 'force-dynamic';
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { documentId, styles } = body;

    if (!documentId) {
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      );
    }

    // Fetch document metadata
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (docError || !document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Build document metadata for citation
    const metadata = {
      id: document.id,
      title: document.title,
      authors: document.authors || [],
      publicationDate: document.publication_date,
      publisher: document.publisher,
      url: document.url,
      doi: document.doi,
      documentType: document.document_type,
      jurisdiction: document.jurisdiction,
      volume: document.volume,
      issue: document.issue,
      pages: document.pages,
      edition: document.edition,
      accessDate: new Date().toISOString(),
    };

    // Generate citations (we'll do this client-side for now)
    // This endpoint primarily validates access and returns metadata
    return NextResponse.json({
      success: true,
      metadata,
      message: 'Document metadata retrieved for citation generation',
    });
  } catch (error) {
    console.error('Citation generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate citations' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/citations/[documentId]
 * Get citation metadata for a document
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('documentId');

    if (!documentId) {
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      );
    }

    // Fetch document metadata
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (docError || !document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Build document metadata for citation
    const metadata = {
      id: document.id,
      title: document.title,
      authors: document.authors || [],
      publicationDate: document.publication_date,
      publisher: document.publisher,
      url: document.url,
      doi: document.doi,
      documentType: document.document_type,
      jurisdiction: document.jurisdiction,
      volume: document.volume,
      issue: document.issue,
      pages: document.pages,
      edition: document.edition,
      accessDate: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      metadata,
    });
  } catch (error) {
    console.error('Citation metadata error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve citation metadata' },
      { status: 500 }
    );
  }
}
