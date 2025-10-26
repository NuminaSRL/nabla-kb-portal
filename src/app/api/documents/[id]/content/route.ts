import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get document metadata to find storage path
    const { data: document, error: docError } = await supabase
      .from('document_metadata')
      .select('storage_path, content_type')
      .eq('document_id', params.id)
      .single();

    if (docError || !document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Download document from storage
    const { data: fileData, error: storageError } = await supabase
      .storage
      .from('documents')
      .download(document.storage_path);

    if (storageError || !fileData) {
      return NextResponse.json(
        { error: 'Failed to download document' },
        { status: 500 }
      );
    }

    // Return file with appropriate content type
    const contentType = document.content_type === 'pdf' 
      ? 'application/pdf'
      : document.content_type === 'html'
      ? 'text/html'
      : 'text/markdown';

    return new NextResponse(fileData, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600'
      }
    });
  } catch (error) {
    console.error('Error fetching document content:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
