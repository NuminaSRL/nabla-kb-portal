// API endpoint for batch PDF export
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import PDFDocument from 'pdfkit';

export const dynamic = 'force-dynamic';
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { documents, includeWatermark, watermarkText } = body;

    if (!documents || !Array.isArray(documents) || documents.length === 0) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }

    // Check tier limits
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('tier')
      .eq('id', user.id)
      .single();

    if (profile?.tier === 'pro' && documents.length > 10) {
      return NextResponse.json(
        { error: 'Pro tier allows batch export of up to 10 documents' },
        { status: 403 }
      );
    }

    // Generate batch PDF
    const pdfBuffer = await generateBatchPDF(documents, includeWatermark, watermarkText);

    // Upload to Supabase Storage
    const fileName = `batch-export-${Date.now()}.pdf`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('exports')
      .upload(fileName, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json({ error: 'Failed to upload PDF' }, { status: 500 });
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('exports')
      .getPublicUrl(fileName);

    return NextResponse.json({
      url: urlData.publicUrl,
      size: pdfBuffer.length,
    });

  } catch (error: any) {
    console.error('Batch PDF generation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function generateBatchPDF(
  documents: any[],
  includeWatermark: boolean,
  watermarkText?: string
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
    });

    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Cover page
    doc.fontSize(28).font('Helvetica-Bold').text('Document Export', { align: 'center' });
    doc.moveDown();
    doc.fontSize(14).font('Helvetica').text(`Total Documents: ${documents.length}`, { align: 'center' });
    doc.fontSize(12).text(`Exported: ${new Date().toLocaleString()}`, { align: 'center' });
    doc.moveDown(2);

    // Table of contents
    doc.fontSize(18).font('Helvetica-Bold').text('Table of Contents');
    doc.moveDown();

    documents.forEach((docData, index) => {
      doc.fontSize(11).font('Helvetica');
      doc.text(`${index + 1}. ${docData.title}`, { indent: 20 });
    });

    // Process each document
    documents.forEach((docData, index) => {
      doc.addPage();

      // Add watermark if requested
      if (includeWatermark && watermarkText) {
        addWatermark(doc, watermarkText);
      }

      // Document number
      doc.fontSize(10).font('Helvetica').fillColor('gray');
      doc.text(`Document ${index + 1} of ${documents.length}`, { align: 'right' });
      doc.fillColor('black');
      doc.moveDown();

      // Title
      doc.fontSize(20).font('Helvetica-Bold').text(docData.title);
      doc.moveDown();

      // Metadata
      if (docData.metadata) {
        doc.fontSize(9).font('Helvetica');
        if (docData.metadata.domain) {
          doc.text(`Domain: ${docData.metadata.domain}`);
        }
        if (docData.metadata.document_type) {
          doc.text(`Type: ${docData.metadata.document_type}`);
        }
        if (docData.metadata.source_url) {
          doc.text(`Source: ${docData.metadata.source_url}`, { link: docData.metadata.source_url });
        }
        if (docData.metadata.published_date) {
          doc.text(`Published: ${new Date(docData.metadata.published_date).toLocaleDateString()}`);
        }
        doc.moveDown();
      }

      // Divider
      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
      doc.moveDown();

      // Content
      doc.fontSize(10).font('Helvetica').text(docData.content, {
        align: 'justify',
        lineGap: 2,
      });

      // Annotations
      if (docData.annotations) {
        doc.addPage();

        doc.fontSize(16).font('Helvetica-Bold').text('Annotations', { align: 'center' });
        doc.moveDown();

        // Highlights
        if (docData.annotations.highlights && docData.annotations.highlights.length > 0) {
          doc.fontSize(12).font('Helvetica-Bold').text('Highlights');
          doc.moveDown(0.5);

          docData.annotations.highlights.forEach((highlight: any, idx: number) => {
            doc.fontSize(9).font('Helvetica-Bold');
            doc.fillColor(getColorHex(highlight.color));
            doc.text(`${idx + 1}. Page ${highlight.page}`);
            doc.fillColor('black');

            doc.fontSize(9).font('Helvetica');
            doc.text(`"${highlight.text}"`, { indent: 15 });

            if (highlight.note) {
              doc.fontSize(8).font('Helvetica-Oblique');
              doc.text(`Note: ${highlight.note}`, { indent: 15 });
            }

            doc.moveDown(0.3);
          });

          doc.moveDown();
        }

        // Notes
        if (docData.annotations.notes && docData.annotations.notes.length > 0) {
          doc.fontSize(12).font('Helvetica-Bold').text('Notes');
          doc.moveDown(0.5);

          docData.annotations.notes.forEach((note: any, idx: number) => {
            doc.fontSize(9).font('Helvetica-Bold');
            doc.text(`${idx + 1}. Page ${note.page}`);

            doc.fontSize(9).font('Helvetica');
            doc.text(note.content, { indent: 15 });

            doc.moveDown(0.3);
          });
        }
      }
    });

    // Footer with page numbers
    const pageCount = doc.bufferedPageRange().count;
    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);
      doc.fontSize(8).font('Helvetica');
      doc.text(
        `Exported: ${new Date().toLocaleString()} | Page ${i + 1} of ${pageCount}`,
        50,
        doc.page.height - 30,
        { align: 'center' }
      );
    }

    doc.end();
  });
}

function addWatermark(doc: PDFKit.PDFDocument, text: string) {
  doc.save();
  doc.opacity(0.1);
  doc.fontSize(60).font('Helvetica-Bold');
  doc.rotate(-45, { origin: [doc.page.width / 2, doc.page.height / 2] });
  doc.text(text, 0, doc.page.height / 2, {
    align: 'center',
    width: doc.page.width,
  });
  doc.restore();
}

function getColorHex(color: string): string {
  const colors: Record<string, string> = {
    yellow: '#FFEB3B',
    green: '#4CAF50',
    blue: '#2196F3',
    pink: '#E91E63',
    purple: '#9C27B0',
  };
  return colors[color] || '#FFEB3B';
}
