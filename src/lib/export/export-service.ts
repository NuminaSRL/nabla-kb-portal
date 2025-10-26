// Export service for documents and search results
import { createClient } from '@/lib/supabase/client';
import type {
  ExportJob,
  ExportOptions,
  ExportJobType,
  ExportStats,
  PDFExportData,
  CSVExportRow,
  BatchExportRequest,
  ExportProgress,
} from './types';
import { annotationService } from '../documents/annotation-service';

export class ExportService {
  private supabase = createClient();

  /**
   * Create an export job
   */
  async createExportJob(
    documentIds: string[],
    jobType: ExportJobType,
    options: ExportOptions = {}
  ): Promise<{ data: ExportJob | null; error: string | null }> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) {
        return { data: null, error: 'Not authenticated' };
      }

      // Check tier permissions
      const canExport = await this.checkExportPermissions(user.id, documentIds.length);
      if (!canExport.allowed) {
        return { data: null, error: canExport.reason || 'Export not allowed' };
      }

      const { data, error } = await this.supabase
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

      if (error) {
        return { data: null, error: error.message };
      }

      // Start processing asynchronously
      this.processExportJob(data.id).catch(console.error);

      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  }

  /**
   * Check if user has export permissions
   */
  private async checkExportPermissions(
    userId: string,
    documentCount: number
  ): Promise<{ allowed: boolean; reason?: string }> {
    try {
      const { data: profile } = await this.supabase
        .from('user_profiles')
        .select('tier')
        .eq('id', userId)
        .single();

      if (!profile) {
        return { allowed: false, reason: 'User profile not found' };
      }

      const { data: limits } = await this.supabase
        .from('tier_limits')
        .select('export_enabled')
        .eq('tier', profile.tier)
        .single();

      if (!limits?.export_enabled) {
        return { allowed: false, reason: 'Export is not available in your tier. Upgrade to Pro or Enterprise.' };
      }

      // Free tier: no export
      // Pro tier: single and batch (up to 10 docs)
      // Enterprise: unlimited
      if (profile.tier === 'pro' && documentCount > 10) {
        return { allowed: false, reason: 'Pro tier allows batch export of up to 10 documents. Upgrade to Enterprise for unlimited.' };
      }

      return { allowed: true };
    } catch (err) {
      return { allowed: false, reason: 'Failed to check permissions' };
    }
  }

  /**
   * Process export job
   */
  private async processExportJob(jobId: string): Promise<void> {
    const startTime = Date.now();

    try {
      // Update status to processing
      await this.supabase
        .from('export_jobs')
        .update({ status: 'processing' })
        .eq('id', jobId);

      // Get job details
      const { data: job } = await this.supabase
        .from('export_jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      if (!job) {
        throw new Error('Job not found');
      }

      let outputUrl: string;
      let fileSize: number;

      // Process based on job type
      switch (job.job_type) {
        case 'single_pdf':
          ({ outputUrl, fileSize } = await this.exportSinglePDF(job));
          break;
        case 'batch_pdf':
          ({ outputUrl, fileSize } = await this.exportBatchPDF(job));
          break;
        case 'csv':
          ({ outputUrl, fileSize } = await this.exportCSV(job));
          break;
        case 'json':
          ({ outputUrl, fileSize } = await this.exportJSON(job));
          break;
        case 'markdown':
          ({ outputUrl, fileSize } = await this.exportMarkdown(job));
          break;
        default:
          throw new Error(`Unsupported job type: ${job.job_type}`);
      }

      // Update job as completed
      await this.supabase
        .from('export_jobs')
        .update({
          status: 'completed',
          output_url: outputUrl,
          file_size: fileSize,
        })
        .eq('id', jobId);

      // Record stats
      const processingTime = Date.now() - startTime;
      await this.recordExportStats(job.user_id, job.job_type, job.document_ids.length, fileSize, processingTime);

    } catch (error: any) {
      console.error('Export job failed:', error);
      await this.supabase
        .from('export_jobs')
        .update({
          status: 'failed',
          error_message: error.message,
        })
        .eq('id', jobId);
    }
  }

  /**
   * Export single document as PDF
   */
  private async exportSinglePDF(job: ExportJob): Promise<{ outputUrl: string; fileSize: number }> {
    const documentId = job.document_ids[0];

    // Get document data
    const { data: document } = await this.supabase
        .from('documents')
        .select('*')
        .eq('id', documentId)
        .single();

    if (!document) {
      throw new Error('Document not found');
    }

    // Get annotations if requested
    let annotations;
    if (job.include_annotations) {
      const { data: annotationData } = await annotationService.exportAnnotations(
        documentId,
        document.title
      );
      annotations = annotationData;
    }

    // Prepare PDF data
    const pdfData: PDFExportData = {
      documentId: document.id,
      title: document.title,
      content: document.content || '',
      metadata: document.metadata,
      annotations: annotations || undefined,
    };

    // Call PDF generation API
    const response = await fetch('/api/export/pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data: pdfData,
        includeWatermark: job.include_watermark,
        watermarkText: job.watermark_text,
      }),
    });

    if (!response.ok) {
      throw new Error('PDF generation failed');
    }

    const result = await response.json();
    return {
      outputUrl: result.url,
      fileSize: result.size,
    };
  }

  /**
   * Export multiple documents as batch PDF
   */
  private async exportBatchPDF(job: ExportJob): Promise<{ outputUrl: string; fileSize: number }> {
    const documents: PDFExportData[] = [];

    // Get all documents
    for (const documentId of job.document_ids) {
      const { data: document } = await this.supabase
        .from('documents')
        .select('*')
        .eq('id', documentId)
        .single();

      if (document) {
        let annotations;
        if (job.include_annotations) {
          const { data: annotationData } = await annotationService.exportAnnotations(
            documentId,
            document.title
          );
          annotations = annotationData;
        }

        documents.push({
          documentId: document.id,
          title: document.title,
          content: document.content || '',
          metadata: document.metadata,
          annotations: annotations || undefined,
        });
      }
    }

    // Call batch PDF generation API
    const response = await fetch('/api/export/pdf/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        documents,
        includeWatermark: job.include_watermark,
        watermarkText: job.watermark_text,
      }),
    });

    if (!response.ok) {
      throw new Error('Batch PDF generation failed');
    }

    const result = await response.json();
    return {
      outputUrl: result.url,
      fileSize: result.size,
    };
  }

  /**
   * Export search results as CSV
   */
  private async exportCSV(job: ExportJob): Promise<{ outputUrl: string; fileSize: number }> {
    const rows: CSVExportRow[] = [];

    // Get all documents
    for (const documentId of job.document_ids) {
      const { data: document } = await this.supabase
        .from('documents')
        .select('*')
        .eq('id', documentId)
        .single();

      if (document) {
        rows.push({
          document_id: document.id,
          title: document.title,
          domain: document.domain || '',
          document_type: document.document_type || '',
          source: document.source || '',
          published_date: document.published_date || '',
          relevance_score: document.relevance_score || 0,
          url: document.source_url || '',
          summary: document.summary || '',
        });
      }
    }

    // Call CSV generation API
    const response = await fetch('/api/export/csv', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rows }),
    });

    if (!response.ok) {
      throw new Error('CSV generation failed');
    }

    const result = await response.json();
    return {
      outputUrl: result.url,
      fileSize: result.size,
    };
  }

  /**
   * Export as JSON
   */
  private async exportJSON(job: ExportJob): Promise<{ outputUrl: string; fileSize: number }> {
    const documents = [];

    for (const documentId of job.document_ids) {
      const { data: document } = await this.supabase
        .from('documents')
        .select('*')
        .eq('id', documentId)
        .single();

      if (document) {
        let annotations;
        if (job.include_annotations) {
          const { data: annotationData } = await annotationService.exportAnnotations(
            documentId,
            document.title
          );
          annotations = annotationData;
        }

        documents.push({
          ...document,
          annotations,
        });
      }
    }

    const jsonData = JSON.stringify(documents, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const fileSize = blob.size;

    // Upload to storage
    const fileName = `export-${job.id}.json`;
    const { data: uploadData, error: uploadError } = await this.supabase.storage
      .from('exports')
      .upload(fileName, blob);

    if (uploadError) {
      throw new Error('Failed to upload JSON file');
    }

    const { data: urlData } = this.supabase.storage
      .from('exports')
      .getPublicUrl(fileName);

    return {
      outputUrl: urlData.publicUrl,
      fileSize,
    };
  }

  /**
   * Export as Markdown
   */
  private async exportMarkdown(job: ExportJob): Promise<{ outputUrl: string; fileSize: number }> {
    let markdown = '# Document Export\n\n';
    markdown += `Exported: ${new Date().toLocaleString()}\n\n`;
    markdown += `Total Documents: ${job.document_ids.length}\n\n`;
    markdown += '---\n\n';

    for (const documentId of job.document_ids) {
      const { data: document } = await this.supabase
        .from('documents')
        .select('*')
        .eq('id', documentId)
        .single();

      if (document) {
        markdown += `## ${document.title}\n\n`;
        markdown += `**Domain:** ${document.domain || 'N/A'}\n\n`;
        markdown += `**Type:** ${document.document_type || 'N/A'}\n\n`;
        markdown += `**Source:** ${document.source_url || 'N/A'}\n\n`;
        markdown += `**Published:** ${document.published_date || 'N/A'}\n\n`;
        markdown += `### Content\n\n`;
        markdown += `${document.content || 'No content available'}\n\n`;

        if (job.include_annotations) {
          const { data: annotations } = await annotationService.exportAnnotations(
            documentId,
            document.title
          );

          if (annotations && (annotations.highlights.length > 0 || annotations.notes.length > 0)) {
            markdown += `### Annotations\n\n`;

            if (annotations.highlights.length > 0) {
              markdown += `#### Highlights\n\n`;
              annotations.highlights.forEach((h, i) => {
                markdown += `${i + 1}. **Page ${h.page}** (${h.color})\n`;
                markdown += `   > ${h.text}\n`;
                if (h.note) {
                  markdown += `   \n   *Note:* ${h.note}\n`;
                }
                markdown += '\n';
              });
            }

            if (annotations.notes.length > 0) {
              markdown += `#### Notes\n\n`;
              annotations.notes.forEach((n, i) => {
                markdown += `${i + 1}. **Page ${n.page}**\n`;
                markdown += `   ${n.content}\n\n`;
              });
            }
          }
        }

        markdown += '---\n\n';
      }
    }

    const blob = new Blob([markdown], { type: 'text/markdown' });
    const fileSize = blob.size;

    // Upload to storage
    const fileName = `export-${job.id}.md`;
    const { data: uploadData, error: uploadError } = await this.supabase.storage
      .from('exports')
      .upload(fileName, blob);

    if (uploadError) {
      throw new Error('Failed to upload Markdown file');
    }

    const { data: urlData } = this.supabase.storage
      .from('exports')
      .getPublicUrl(fileName);

    return {
      outputUrl: urlData.publicUrl,
      fileSize,
    };
  }

  /**
   * Record export statistics
   */
  private async recordExportStats(
    userId: string,
    exportType: string,
    documentCount: number,
    fileSize: number,
    processingTimeMs: number
  ): Promise<void> {
    try {
      await this.supabase.from('export_stats').insert({
        user_id: userId,
        export_type: exportType,
        document_count: documentCount,
        file_size: fileSize,
        processing_time_ms: processingTimeMs,
      });
    } catch (error) {
      console.error('Failed to record export stats:', error);
    }
  }

  /**
   * Get export job status
   */
  async getExportJob(jobId: string): Promise<{ data: ExportJob | null; error: string | null }> {
    try {
      const { data, error } = await this.supabase
        .from('export_jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  }

  /**
   * Get user's export jobs
   */
  async getUserExportJobs(limit: number = 20): Promise<{ data: ExportJob[]; error: string | null }> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) {
        return { data: [], error: 'Not authenticated' };
      }

      const { data, error } = await this.supabase
        .from('export_jobs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        return { data: [], error: error.message };
      }

      return { data: data || [], error: null };
    } catch (err: any) {
      return { data: [], error: err.message };
    }
  }

  /**
   * Download export file
   */
  async downloadExport(jobId: string): Promise<void> {
    const { data: job } = await this.getExportJob(jobId);

    if (!job || !job.output_url) {
      throw new Error('Export file not available');
    }

    // Trigger download
    const a = document.createElement('a');
    a.href = job.output_url;
    a.download = `export-${jobId}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  /**
   * Get export statistics for user
   */
  async getExportStats(userId: string): Promise<{ data: ExportStats[]; error: string | null }> {
    try {
      const { data, error } = await this.supabase
        .from('export_stats')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        return { data: [], error: error.message };
      }

      return { data: data || [], error: null };
    } catch (err: any) {
      return { data: [], error: err.message };
    }
  }
}

// Export singleton instance
export const exportService = new ExportService();
