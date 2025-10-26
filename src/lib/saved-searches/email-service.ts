/**
 * Email Service for sending notifications
 * Uses Resend API for email delivery
 */

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

export class EmailService {
  private apiKey: string;
  private fromEmail: string;

  constructor() {
    this.apiKey = process.env.RESEND_API_KEY || '';
    this.fromEmail = process.env.EMAIL_FROM || 'alerts@kb.nabla.ai';
  }

  /**
   * Send an email using Resend API
   */
  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      if (!this.apiKey) {
        console.error('RESEND_API_KEY not configured');
        return false;
      }

      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          from: options.from || this.fromEmail,
          to: options.to,
          subject: options.subject,
          html: options.html,
          text: options.text,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('Failed to send email:', error);
        return false;
      }

      const data = await response.json();
      console.log('Email sent successfully:', data.id);
      return true;
    } catch (error) {
      console.error('Email service error:', error);
      return false;
    }
  }

  /**
   * Send batch emails
   */
  async sendBatchEmails(emails: EmailOptions[]): Promise<boolean[]> {
    const results = await Promise.all(
      emails.map((email) => this.sendEmail(email))
    );
    return results;
  }

  /**
   * Validate email address
   */
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

// Singleton instance
export const emailService = new EmailService();
