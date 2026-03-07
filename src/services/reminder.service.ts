import { invoiceRepository, InvoiceRepository } from '@/repositories/invoice.repository';
import { reminderRepository, ReminderRepository } from '@/repositories/reminder.repository';
import { emailService, EmailService } from './email.service';
import { whatsappService, WhatsAppService } from './whatsapp.service';
import { NotFoundError, ForbiddenError } from '@/lib/errors';
import { checkWhatsAppAccess, checkEmailReminderLimit } from '@/lib/plan-limits';
import { ReminderStatus, InvoiceStatus, type Plan } from '@prisma/client';

/**
 * Reminder Service
 *
 * Handles both manual "Send Reminder Now" and
 * the automated daily cron job for overdue invoices.
 */

const DEFAULT_REMINDER_DAYS = [3, 7, 14];
const DEFAULT_MAX_ATTEMPTS = 5;

export class ReminderService {
    constructor(
        private readonly invoiceRepo: InvoiceRepository,
        private readonly reminderRepo: ReminderRepository,
        private readonly emailSvc: EmailService,
        private readonly whatsappSvc: WhatsAppService,
    ) { }

    /**
     * List all reminders for a given invoice (with ownership check).
     */
    async getRemindersForInvoice(userId: string, invoiceId: string) {
        const invoice = await this.invoiceRepo.findById(invoiceId);
        if (!invoice) throw new NotFoundError('Invoice');
        if (invoice.userId !== userId) throw new ForbiddenError();
        return this.reminderRepo.findByInvoiceId(invoiceId);
    }

    /**
     * Schedule a reminder for future delivery.
     * Creates a PENDING record that the cron job or a queue worker can pick up.
     */
    async scheduleReminder(
        userId: string,
        invoiceId: string,
        channel: 'EMAIL' | 'WHATSAPP',
        scheduledAt: Date,
    ) {
        const invoice = await this.invoiceRepo.findById(invoiceId);
        if (!invoice) throw new NotFoundError('Invoice');
        if (invoice.userId !== userId) throw new ForbiddenError();
        if (invoice.status === InvoiceStatus.PAID) {
            throw new ForbiddenError('Cannot schedule reminders for paid invoices');
        }

        return this.reminderRepo.create({
            invoiceId,
            channel,
            scheduledAt,
            status: ReminderStatus.PENDING,
        });
    }

    /**
     * Manual "Send Reminder Now" from invoice detail page.
     */
    async sendReminderNow(
        userId: string,
        invoiceId: string,
        channel: 'EMAIL' | 'WHATSAPP' | 'BOTH',
        userPlan: Plan,
    ) {
        const invoice = await this.invoiceRepo.findById(invoiceId);
        if (!invoice) throw new NotFoundError('Invoice');
        if (invoice.userId !== userId) throw new ForbiddenError();
        if (invoice.status === InvoiceStatus.PAID) {
            throw new ForbiddenError('Cannot send reminders for paid invoices');
        }
        if (!invoice.paymentLink) {
            throw new ForbiddenError('Invoice must be sent before sending reminders');
        }

        const channels = channel === 'BOTH' ? ['EMAIL', 'WHATSAPP'] as const : [channel] as const;

        for (const ch of channels) {
            if (ch === 'WHATSAPP') {
                checkWhatsAppAccess(userPlan);
            }
            if (ch === 'EMAIL') {
                const sentCount = await this.reminderRepo.getSentCount(invoiceId);
                checkEmailReminderLimit(userPlan, sentCount);
            }

            await this.sendReminder(invoice, ch);
        }

        // Update invoice lastReminderSentAt
        await this.invoiceRepo.update(invoiceId, {
            lastReminderSentAt: new Date(),
        });
    }

    /**
     * Process auto-reminders (called by daily cron job).
     */
    async processAutoReminders() {
        const overdueInvoices = await this.invoiceRepo.findOverdueForReminders(
            DEFAULT_REMINDER_DAYS,
            DEFAULT_MAX_ATTEMPTS,
        );

        const results = { processed: 0, sent: 0, failed: 0 };

        for (const invoice of overdueInvoices) {
            results.processed++;

            // Check how many days overdue
            const daysOverdue = Math.floor(
                (Date.now() - invoice.dueDate.getTime()) / (1000 * 60 * 60 * 24),
            );

            // Only send at configured intervals
            if (!DEFAULT_REMINDER_DAYS.some((d) => daysOverdue >= d)) continue;

            // Check attempt count
            const sentCount = await this.reminderRepo.getSentCount(invoice.id);
            if (sentCount >= DEFAULT_MAX_ATTEMPTS) continue;

            try {
                // Always send email for auto-reminders
                await this.sendReminder(invoice, 'EMAIL');

                // Also send WhatsApp if user is Pro and client has WhatsApp
                if (invoice.user.plan === 'PRO' && invoice.client.whatsappNumber) {
                    try {
                        await this.sendReminder(invoice, 'WHATSAPP');
                    } catch {
                        // WhatsApp failure shouldn't block email reminder
                        console.error(`WhatsApp reminder failed for invoice ${invoice.id}`);
                    }
                }

                await this.invoiceRepo.update(invoice.id, {
                    lastReminderSentAt: new Date(),
                    status: InvoiceStatus.OVERDUE,
                });

                results.sent++;
            } catch {
                results.failed++;
            }
        }

        return results;
    }

    /**
     * Send a single reminder via the specified channel.
     */
    private async sendReminder(
        invoice: {
            id: string;
            invoiceNumber: string;
            total: unknown;
            currency: string;
            paymentLink: string | null;
            client: { name: string; email: string; whatsappNumber: string | null };
            user: { name: string; businessName: string | null };
        },
        channel: 'EMAIL' | 'WHATSAPP',
    ) {
        const reminder = await this.reminderRepo.create({
            invoiceId: invoice.id,
            channel: channel as 'EMAIL' | 'WHATSAPP',
            scheduledAt: new Date(),
            status: ReminderStatus.PENDING,
        });

        try {
            const businessName = invoice.user.businessName || invoice.user.name;
            const paymentLink = invoice.paymentLink || '';

            if (channel === 'EMAIL') {
                await this.emailSvc.sendReminderEmail({
                    to: invoice.client.email,
                    clientName: invoice.client.name,
                    invoiceNumber: invoice.invoiceNumber,
                    amount: Number(invoice.total).toFixed(2),
                    currency: invoice.currency,
                    paymentLink,
                    businessName,
                });
            } else if (channel === 'WHATSAPP' && invoice.client.whatsappNumber) {
                await this.whatsappSvc.sendReminderWhatsApp({
                    to: invoice.client.whatsappNumber,
                    clientName: invoice.client.name,
                    invoiceNumber: invoice.invoiceNumber,
                    amount: Number(invoice.total).toFixed(2),
                    currency: invoice.currency,
                    paymentLink,
                    businessName,
                });
            }

            await this.reminderRepo.update(reminder.id, {
                status: ReminderStatus.SENT,
                sentAt: new Date(),
                attemptCount: { increment: 1 },
            });
        } catch (error) {
            await this.reminderRepo.update(reminder.id, {
                status: ReminderStatus.FAILED,
                attemptCount: { increment: 1 },
            });
            throw error;
        }
    }
}

export const reminderService = new ReminderService(
    invoiceRepository,
    reminderRepository,
    emailService,
    whatsappService,
);
