import { Resend } from 'resend';
import { config } from '@/config/config';

/**
 * Email Service
 *
 * Handles all transactional email sending via Resend.
 * Used by invoice and reminder services.
 */

let _resend: Resend | null = null;
function getResend(): Resend {
  if (!_resend) _resend = new Resend(config.email.resendApiKey);
  return _resend;
}

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

export class EmailService {
  async sendEmail({ to, subject, html }: SendEmailParams) {
    const { data, error } = await getResend().emails.send({
      from: config.email.from,
      to,
      subject,
      html,
    });

    if (error) {
      throw new Error(`Failed to send email: ${error.message}`);
    }

    return data;
  }

  async sendInvoiceEmail(params: {
    to: string;
    clientName: string;
    invoiceNumber: string;
    amount: string;
    currency: string;
    dueDate: string;
    paymentLink: string;
    businessName: string;
  }) {
    const { to, clientName, invoiceNumber, amount, currency, dueDate, paymentLink, businessName } = params;

    return this.sendEmail({
      to,
      subject: `Invoice ${invoiceNumber} from ${businessName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1a1a1a;">New Invoice from ${businessName}</h2>
          <p>Hi ${clientName},</p>
          <p>You have a new invoice:</p>
          <table style="border-collapse: collapse; width: 100%; margin: 20px 0;">
            <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Invoice #</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${invoiceNumber}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Amount</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${currency} ${amount}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Due Date</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${dueDate}</td></tr>
          </table>
          <a href="${paymentLink}" style="display: inline-block; background: #0066ff; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Pay Now</a>
          <p style="margin-top: 24px; color: #666; font-size: 14px;">If you have any questions, please contact ${businessName}.</p>
        </div>
      `,
    });
  }

  async sendReminderEmail(params: {
    to: string;
    clientName: string;
    invoiceNumber: string;
    amount: string;
    currency: string;
    paymentLink: string;
    businessName: string;
  }) {
    const { to, clientName, invoiceNumber, amount, currency, paymentLink, businessName } = params;

    return this.sendEmail({
      to,
      subject: `Reminder: Invoice ${invoiceNumber} is overdue`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1a1a1a;">Payment Reminder</h2>
          <p>Hi ${clientName},</p>
          <p>This is a friendly reminder that invoice <strong>${invoiceNumber}</strong> for <strong>${currency} ${amount}</strong> is overdue.</p>
          <a href="${paymentLink}" style="display: inline-block; background: #0066ff; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Pay Now</a>
          <p style="margin-top: 24px; color: #666; font-size: 14px;">— ${businessName}</p>
        </div>
      `,
    });
  }

  async sendPaymentConfirmation(params: {
    to: string;
    freelancerName: string;
    invoiceNumber: string;
    amount: string;
    currency: string;
    clientName: string;
  }) {
    const { to, freelancerName, invoiceNumber, amount, currency, clientName } = params;

    return this.sendEmail({
      to,
      subject: `Payment received for Invoice ${invoiceNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #22c55e;">✅ Payment Received!</h2>
          <p>Hi ${freelancerName},</p>
          <p><strong>${clientName}</strong> has paid invoice <strong>${invoiceNumber}</strong> — <strong>${currency} ${amount}</strong>.</p>
          <p style="margin-top: 24px; color: #666; font-size: 14px;">This payment has been recorded in your InvoiceFlow dashboard.</p>
        </div>
      `,
    });
  }
}

export const emailService = new EmailService();
