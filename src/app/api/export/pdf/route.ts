// API endpoint for single PDF export
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import PDFDocument from 'pdfkit';
import { Readable } from 'stream';

export const dynamic = 'force-dynamic';
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { data, includeWatermark, watermarkText } = body;

    if (!data || !data.documentId) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }

    // Generate PDF
    const pdfBuffer = await generatePDF(data, includeWatermark, watermarkText);

    // Upload to Supabase Storage
    const fileName = `${data.documentId}-${Date.now()}.pdf`;
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
    console.error('PDF generation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function generatePDF(
  data: any,
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

    // Add watermark if requested
    if (includeWatermark && watermarkText) {
      addWatermark(doc, watermarkText);
    }

    // Title
    doc.fontSize(24).font('Helvetica-Bold').text(data.title, { align: 'center' });
    doc.moveDown();

    // Metadata
    if (data.metadata) {
      doc.fontSize(10).font('Helvetica');
      if (data.metadata.domain) {
        doc.text(`Domain: ${data.metadata.domain}`);
      }
      if (data.metadata.document_type) {
        doc.text(`Type: ${data.metadata.document_type}`);
      }
      if (data.metadata.source_url) {
        doc.text(`Source: ${data.metadata.source_url}`, { link: data.metadata.source_url });
      }
      if (data.metadata.published_date) {
        doc.text(`Published: ${new Date(data.metadata.published_date).toLocaleDateString()}`);
      }
      doc.moveDown();
    }

    // Divider
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown();

    // Content
    doc.fontSize(11).font('Helvetica').text(data.content, {
      align: 'justify',
      lineGap: 2,
    });

    // Annotations
    if (data.annotations) {
      doc.addPage();
      doc.fontSize(18).font('Helvetica-Bold').text('Annotations', { align: 'center' });
      doc.moveDown();

      // Highlights
      if (data.annotations.highlights && data.annotations.highlights.length > 0) {
        doc.fontSize(14).font('Helvetica-Bold').text('Highlights');
        doc.moveDown(0.5);

        data.annotations.highlights.forEach((highlight: any, index: number) => {
          doc.fontSize(10).font('Helvetica-Bold');
          doc.fillColor(getColorHex(highlight.color));
          doc.text(`${index + 1}. Page ${highlight.page}`, { continued: false });
          doc.fillColor('black');

          doc.fontSize(10).font('Helvetica');
          doc.text(`"${highlight.text}"`, { indent: 20 });

          if (highlight.note) {
            doc.fontSize(9).font('Helvetica-Oblique');
            doc.text(`Note: ${highlight.note}`, { indent: 20 });
          }

          doc.moveDown(0.5);
        });

        doc.moveDown();
      }

      // Notes
      if (data.annotations.notes && data.annotations.notes.length > 0) {
        doc.fontSize(14).font('Helvetica-Bold').text('Notes');
        doc.moveDown(0.5);

        data.annotations.notes.forEach((note: any, index: number) => {
          doc.fontSize(10).font('Helvetica-Bold');
          doc.text(`${index + 1}. Page ${note.page}`);

          doc.fontSize(10).font('Helvetica');
          doc.text(note.content, { indent: 20 });

          doc.moveDown(0.5);
        });
      }
    }

    // Footer with export date
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
  const pageCount = doc.bufferedPageRange().count;

  for (let i = 0; i < pageCount; i++) {
    doc.switchToPage(i);
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
