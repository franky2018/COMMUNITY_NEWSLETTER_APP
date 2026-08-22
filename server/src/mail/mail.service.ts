import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { buildPasswordResetEmail } from './templates/password-reset.template';
import { buildEmailVerificationEmail } from './templates/email-verification.template';
import { buildNewsletterPublishedEmail } from './templates/newsletter-published.template';

export interface NewsletterEmailPayload {
  title: string;
  slug: string;
  excerpt: string | null;
  categoryName: string | null;
  publishedAt: Date | null;
}

export interface NewsletterRecipient {
  email: string;
  name: string | null;
}

export interface NewsletterEmailSummary {
  total: number;
  sent: number;
  failed: number;
  skipped: number;
}

const NEWSLETTER_BATCH_SIZE = 10;
const NEWSLETTER_BATCH_DELAY_MS = 1000;

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private resend?: Resend;

  constructor(private readonly config: ConfigService) {}

  async sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
    const { subject, html, text } = buildPasswordResetEmail(resetUrl);
    const from = this.config.getOrThrow<string>('EMAIL_FROM');

    const { error } = await this.getClient().emails.send({
      from,
      to,
      subject,
      html,
      text,
    });

    if (error) {
            this.logger.error(
        `Resend rejected password reset email: ${error.message}`,
      );
      throw new Error('Failed to send password reset email');
    }
  }

  async sendVerificationEmail(to: string, verifyUrl: string): Promise<void> {
    const { subject, html, text } = buildEmailVerificationEmail(verifyUrl);
    const from = this.config.getOrThrow<string>('EMAIL_FROM');

    const { error } = await this.getClient().emails.send({
      from,
      to,
      subject,
      html,
      text,
    });

    if (error) {
      this.logger.error(
        `Resend rejected verification email: ${error.message}`,
      );
      throw new Error('Failed to send verification email');
    }
  }

    async sendNewsletterPublishedEmails(
    newsletter: NewsletterEmailPayload,
    recipients: NewsletterRecipient[],
  ): Promise<NewsletterEmailSummary> {
    const from = this.config.getOrThrow<string>('EMAIL_FROM');
    const frontendUrl = this.config.getOrThrow<string>('FRONTEND_URL');
    const readUrl = `${frontendUrl}/newsletters/${newsletter.slug}`;

    const { subject, html, text } = buildNewsletterPublishedEmail({
      title: newsletter.title,
      excerpt: newsletter.excerpt,
      categoryName: newsletter.categoryName,
      publishedAt: newsletter.publishedAt,
      readUrl,
    });

    const deliverable = recipients.filter(
      (recipient) => !!recipient.email && recipient.email.includes('@'),
    );
    const skipped = recipients.length - deliverable.length;

    const client = this.getClient();
    let sent = 0;
    let failed = 0;

    for (let i = 0; i < deliverable.length; i += NEWSLETTER_BATCH_SIZE) {
      const batch = deliverable.slice(i, i + NEWSLETTER_BATCH_SIZE);
      const results = await Promise.allSettled(
        batch.map((recipient) =>
          client.emails
            .send({ from, to: recipient.email, subject, html, text })
            .then(({ error }) => {
                if (error) {
                throw new Error(error.message);
              }
            }),
        ),
      );

      for (const result of results) {
        if (result.status === 'fulfilled') {
          sent += 1;
        } else {
          failed += 1;
        }
      }

      if (i + NEWSLETTER_BATCH_SIZE < deliverable.length) {
        await this.delay(NEWSLETTER_BATCH_DELAY_MS);
      }
    }

    return { total: recipients.length, sent, failed, skipped };
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private getClient(): Resend {
    if (!this.resend) {
      this.resend = new Resend(
        this.config.getOrThrow<string>('RESEND_API_KEY'),
      );
    }
    return this.resend;
  }
}
