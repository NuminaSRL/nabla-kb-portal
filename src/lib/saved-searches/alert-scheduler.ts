import { createClient } from '@supabase/supabase-js';
import { searchService } from '../search/search-service';
import { emailService } from './email-service';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export interface AlertJob {
  queue_id: string;
  saved_search_id: string;
  user_id: string;
  query: string;
  filters: Record<string, any>;
}

export class AlertScheduler {
  private supabase;
  private isProcessing = false;

  constructor() {
    this.supabase = createClient(supabaseUrl, supabaseServiceKey);
  }

  /**
   * Process pending alerts from the queue
   */
  async processAlerts(): Promise<void> {
    if (this.isProcessing) {
      console.log('Alert processing already in progress, skipping...');
      return;
    }

    this.isProcessing = true;
    console.log('Starting alert processing...');

    try {
      // Get pending alerts from queue
      const { data: jobs, error } = await this.supabase.rpc('process_alert_queue');

      if (error) {
        console.error('Failed to get alert queue:', error);
        return;
      }

      if (!jobs || jobs.length === 0) {
        console.log('No pending alerts to process');
        return;
      }

      console.log(`Processing ${jobs.length} alerts...`);

      // Process each alert
      for (const job of jobs) {
        await this.processAlert(job);
      }

      console.log('Alert processing completed');
    } catch (error) {
      console.error('Alert processing error:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Process a single alert
   */
  private async processAlert(job: AlertJob): Promise<void> {
    try {
      console.log(`Processing alert for saved search: ${job.saved_search_id}`);

      // Get the saved search details
      const { data: savedSearch, error: searchError } = await this.supabase
        .from('saved_searches')
        .select('*, user_profiles(email, full_name)')
        .eq('id', job.saved_search_id)
        .single();

      if (searchError || !savedSearch) {
        console.error('Failed to get saved search:', searchError);
        await this.failAlert(job.queue_id, 'Saved search not found');
        return;
      }

      // Execute the search
      const searchResults = await searchService.semanticSearch(
        job.query,
        job.filters
      );

      // Check if there are new documents since last alert
      const lastAlertDate = savedSearch.last_alert_sent_at
        ? new Date(savedSearch.last_alert_sent_at)
        : new Date(savedSearch.created_at);

      const newDocuments = searchResults.results.filter((doc: any) => {
        const docDate = new Date(doc.published_date || doc.created_at);
        return docDate > lastAlertDate;
      });

      console.log(`Found ${newDocuments.length} new documents for alert`);

      // If no new documents, mark as completed with 0 count
      if (newDocuments.length === 0) {
        await this.completeAlert(job.queue_id, 0, []);
        console.log('No new documents, alert completed');
        return;
      }

      // Send email notification
      const emailSent = await this.sendAlertEmail(
        savedSearch,
        newDocuments,
        job.user_id
      );

      // Mark alert as completed
      const documentIds = newDocuments.map((doc: any) => doc.id);
      await this.completeAlert(job.queue_id, newDocuments.length, documentIds);

      // Update email sent status
      if (emailSent) {
        await this.supabase
          .from('search_alerts')
          .update({ email_sent: true })
          .eq('saved_search_id', job.saved_search_id)
          .order('alert_sent_at', { ascending: false })
          .limit(1);
      }

      console.log(`Alert processed successfully for saved search: ${job.saved_search_id}`);
    } catch (error) {
      console.error('Failed to process alert:', error);
      await this.failAlert(
        job.queue_id,
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  /**
   * Send alert email to user
   */
  private async sendAlertEmail(
    savedSearch: any,
    newDocuments: any[],
    userId: string
  ): Promise<boolean> {
    try {
      const userEmail = savedSearch.user_profiles?.email;
      const userName = savedSearch.user_profiles?.full_name || 'User';

      if (!userEmail) {
        console.error('User email not found');
        return false;
      }

      // Generate email content
      const subject = `New documents for "${savedSearch.name}"`;
      const htmlBody = this.generateEmailHTML(savedSearch, newDocuments, userName);
      const textBody = this.generateEmailText(savedSearch, newDocuments, userName);

      // Queue email notification
      const { data: notification, error } = await this.supabase.rpc(
        'queue_email_notification',
        {
          p_user_id: userId,
          p_email_type: 'search_alert',
          p_recipient_email: userEmail,
          p_subject: subject,
          p_body_html: htmlBody,
          p_body_text: textBody,
          p_metadata: {
            saved_search_id: savedSearch.id,
            document_count: newDocuments.length,
          },
        }
      );

      if (error) {
        console.error('Failed to queue email:', error);
        return false;
      }

      // Send email using email service
      const sent = await emailService.sendEmail({
        to: userEmail,
        subject,
        html: htmlBody,
        text: textBody,
      });

      // Mark email as sent or failed
      await this.supabase.rpc('mark_email_sent', {
        p_notification_id: notification,
        p_success: sent,
        p_error_message: sent ? null : 'Failed to send email',
      });

      return sent;
    } catch (error) {
      console.error('Failed to send alert email:', error);
      return false;
    }
  }

  /**
   * Generate HTML email content
   */
  private generateEmailHTML(
    savedSearch: any,
    newDocuments: any[],
    userName: string
  ): string {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://kb.nabla.ai';
    const documentsHTML = newDocuments
      .slice(0, 10) // Limit to 10 documents in email
      .map(
        (doc) => `
        <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #e5e7eb; border-radius: 8px;">
          <h3 style="margin: 0 0 10px 0; font-size: 16px; color: #111827;">
            <a href="${baseUrl}/documents/${doc.id}" style="color: #2563eb; text-decoration: none;">
              ${doc.title}
            </a>
          </h3>
          <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">
            ${doc.content.substring(0, 200)}...
          </p>
          <div style="font-size: 12px; color: #9ca3af;">
            <span>${doc.domain}</span> • 
            <span>${doc.document_type}</span> • 
            <span>${new Date(doc.published_date).toLocaleDateString()}</span>
          </div>
        </div>
      `
      )
      .join('');

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #374151; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f9fafb; padding: 30px; border-radius: 12px; margin-bottom: 30px;">
            <h1 style="margin: 0 0 10px 0; font-size: 24px; color: #111827;">
              New Documents Alert
            </h1>
            <p style="margin: 0; color: #6b7280; font-size: 16px;">
              Hello ${userName},
            </p>
          </div>

          <div style="margin-bottom: 30px;">
            <p style="font-size: 16px; color: #374151;">
              We found <strong>${newDocuments.length} new document${newDocuments.length > 1 ? 's' : ''}</strong> 
              matching your saved search "<strong>${savedSearch.name}</strong>".
            </p>
            <p style="font-size: 14px; color: #6b7280;">
              Search query: <em>${savedSearch.query}</em>
            </p>
          </div>

          <div style="margin-bottom: 30px;">
            <h2 style="font-size: 18px; color: #111827; margin-bottom: 20px;">
              New Documents
            </h2>
            ${documentsHTML}
            ${
              newDocuments.length > 10
                ? `<p style="text-align: center; color: #6b7280; font-size: 14px;">
                     And ${newDocuments.length - 10} more documents...
                   </p>`
                : ''
            }
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${baseUrl}/dashboard/saved-searches/${savedSearch.id}" 
               style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">
              View All Results
            </a>
          </div>

          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #9ca3af; font-size: 12px;">
            <p>
              You're receiving this email because you have alerts enabled for this saved search.
            </p>
            <p>
              <a href="${baseUrl}/dashboard/saved-searches" style="color: #2563eb; text-decoration: none;">
                Manage your saved searches
              </a>
            </p>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Generate plain text email content
   */
  private generateEmailText(
    savedSearch: any,
    newDocuments: any[],
    userName: string
  ): string {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://kb.nabla.ai';
    const documentsText = newDocuments
      .slice(0, 10)
      .map(
        (doc, index) => `
${index + 1}. ${doc.title}
   ${doc.content.substring(0, 150)}...
   ${doc.domain} • ${doc.document_type} • ${new Date(doc.published_date).toLocaleDateString()}
   View: ${baseUrl}/documents/${doc.id}
`
      )
      .join('\n');

    return `
New Documents Alert

Hello ${userName},

We found ${newDocuments.length} new document${newDocuments.length > 1 ? 's' : ''} matching your saved search "${savedSearch.name}".

Search query: ${savedSearch.query}

NEW DOCUMENTS:
${documentsText}
${newDocuments.length > 10 ? `\nAnd ${newDocuments.length - 10} more documents...\n` : ''}

View all results: ${baseUrl}/dashboard/saved-searches/${savedSearch.id}

---
You're receiving this email because you have alerts enabled for this saved search.
Manage your saved searches: ${baseUrl}/dashboard/saved-searches
    `.trim();
  }

  /**
   * Mark alert as completed
   */
  private async completeAlert(
    queueId: string,
    documentCount: number,
    documentIds: string[]
  ): Promise<void> {
    try {
      await this.supabase.rpc('complete_alert', {
        p_queue_id: queueId,
        p_new_documents_count: documentCount,
        p_document_ids: documentIds,
      });
    } catch (error) {
      console.error('Failed to complete alert:', error);
    }
  }

  /**
   * Mark alert as failed
   */
  private async failAlert(queueId: string, errorMessage: string): Promise<void> {
    try {
      await this.supabase.rpc('fail_alert', {
        p_queue_id: queueId,
        p_error_message: errorMessage,
      });
    } catch (error) {
      console.error('Failed to mark alert as failed:', error);
    }
  }

  /**
   * Start the scheduler (runs every hour)
   */
  startScheduler(): void {
    console.log('Starting alert scheduler...');

    // Run immediately
    this.processAlerts();

    // Run every hour
    setInterval(() => {
      this.processAlerts();
    }, 60 * 60 * 1000); // 1 hour
  }
}

// Singleton instance
export const alertScheduler = new AlertScheduler();
