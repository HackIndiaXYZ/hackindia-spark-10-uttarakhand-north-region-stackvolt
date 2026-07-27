import { Injectable, Logger } from '@nestjs/common';

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

/**
 * Outbound transactional email.
 *
 * In production, swap the `send()` body for a real provider (AWS SES,
 * SendGrid, Postmark, Resend, ...) — the call sites (auth.service.ts) never
 * need to change, they only depend on this interface. Kept provider-less
 * here since delivery requires the customer's own sending domain/API keys.
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  async send(payload: EmailPayload): Promise<void> {
    // TODO(deploy): wire to SES/SendGrid/Postmark using env credentials.
    this.logger.log(`[email] to=${payload.to} subject="${payload.subject}"`);
    this.logger.debug(payload.html);
  }

  async sendVerificationEmail(to: string, token: string, frontendUrl: string) {
    const link = `${frontendUrl}/verify-email?token=${token}`;
    await this.send({
      to,
      subject: 'Verify your AITELLION account',
      html: `<p>Welcome to AITELLION. Confirm your email to activate your account:</p>
             <p><a href="${link}">${link}</a></p>`,
    });
  }

  async sendPasswordResetEmail(to: string, token: string, frontendUrl: string) {
    const link = `${frontendUrl}/reset-password?token=${token}`;
    await this.send({
      to,
      subject: 'Reset your AITELLION password',
      html: `<p>Reset your password using the link below (expires in 1 hour):</p>
             <p><a href="${link}">${link}</a></p>`,
    });
  }

  async sendInviteEmail(to: string, orgName: string, token: string, frontendUrl: string) {
    const link = `${frontendUrl}/accept-invite?token=${token}`;
    await this.send({
      to,
      subject: `You've been invited to join ${orgName} on AITELLION`,
      html: `<p>You've been invited to join <b>${orgName}</b> on AITELLION.</p>
             <p><a href="${link}">${link}</a></p>`,
    });
  }
}
