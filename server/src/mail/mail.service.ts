import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { buildPasswordResetEmail } from './templates/password-reset.template';

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
      // Never log the reset URL or token — only the provider's error.
      this.logger.error(
        `Resend rejected password reset email: ${error.message}`,
      );
      throw new Error('Failed to send password reset email');
    }
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
