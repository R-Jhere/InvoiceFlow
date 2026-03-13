import { invoiceRepository, InvoiceRepository } from '@/repositories/invoice.repository';
import { userRepository, UserRepository } from '@/repositories/user.repository';
import { NotFoundError, ForbiddenError, ConflictError } from '@/lib/errors';
import { checkInvoiceLimit } from '@/lib/plan-limits';
import { paymentService, PaymentService } from './payment.service';
import { emailService, EmailService } from './email.service';
import { InvoiceStatus } from '@prisma/client';
import type { CreateInvoiceInput, UpdateInvoiceInput, SendInvoiceInput } from '@/validators/invoice.schema';
import type { DashboardStats } from '@/types';

/**
 * Invoice Service
 *
 * Core business logic for invoice lifecycle:
 * create (DRAFT) → send (SENT) → paid/overdue
 */

export class InvoiceService {
    constructor(
        private readonly invoiceRepo: InvoiceRepository,
        private readonly userRepo: UserRepository,
        private readonly paymentSvc: PaymentService,
        private readonly emailSvc: EmailService,
    ) { }

    async getInvoices(userId: string, status?: InvoiceStatus) {
        return this.invoiceRepo.findByUserId(userId, status);
    }

    async getInvoiceById(userId: string, invoiceId: string) {
        const invoice = await this.invoiceRepo.findById(invoiceId);
        if (!invoice) throw new NotFoundError('Invoice');
        if (invoice.userId !== userId) throw new ForbiddenError();
        return invoice;
    }

    /** Get invoice by ID without auth check (for public pay page) */
    async getPublicInvoice(invoiceId: string) {
        const invoice = await this.invoiceRepo.findById(invoiceId);
        if (!invoice) throw new NotFoundError('Invoice');
        return invoice;
    }

    async createInvoice(userId: string, data: CreateInvoiceInput) {
        // Enforce plan limits
        const user = await this.userRepo.findById(userId);
        if (!user) throw new NotFoundError('User');

        const monthlyCount = await this.userRepo.getMonthlyInvoiceCount(userId);
        checkInvoiceLimit(user.plan, monthlyCount);

        // Auto-generate invoice number
        const invoiceNumber = await this.invoiceRepo.getNextInvoiceNumber(userId);

        try {
            return await this.invoiceRepo.create({
                userId,
                clientId: data.clientId,
                invoiceNumber,
                items: data.items,
                subtotal: data.subtotal,
                tax: data.tax,
                total: data.total,
                currency: data.currency,
                dueDate: new Date(data.dueDate),
                reminderEnabled: data.reminderEnabled,
                status: InvoiceStatus.DRAFT,
            });
        } catch (error) {
            // Handle race condition: two concurrent requests may generate the
            // same invoice number before either has been persisted.
            // Prisma unique constraint violation code = P2002.
            if (
                error instanceof Error &&
                'code' in error &&
                (error as { code: string }).code === 'P2002'
            ) {
                throw new ConflictError('Invoice number conflict — please retry');
            }
            throw error;
        }    }

    async updateInvoice(userId: string, invoiceId: string, data: UpdateInvoiceInput) {
        const invoice = await this.getInvoiceById(userId, invoiceId);

        // Only drafts can be edited
        if (invoice.status !== InvoiceStatus.DRAFT) {
            throw new ForbiddenError('Only draft invoices can be edited');
        }

        return this.invoiceRepo.update(invoiceId, {
            ...(data.clientId && { clientId: data.clientId }),
            ...(data.items && { items: data.items }),
            ...(data.subtotal !== undefined && { subtotal: data.subtotal }),
            ...(data.tax !== undefined && { tax: data.tax }),
            ...(data.total !== undefined && { total: data.total }),
            ...(data.currency && { currency: data.currency }),
            ...(data.dueDate && { dueDate: new Date(data.dueDate) }),
            ...(data.reminderEnabled !== undefined && { reminderEnabled: data.reminderEnabled }),
        });
    }

    async deleteInvoice(userId: string, invoiceId: string) {
        const invoice = await this.getInvoiceById(userId, invoiceId);
        if (invoice.status !== InvoiceStatus.DRAFT) {
            throw new ForbiddenError('Only draft invoices can be deleted');
        }
        return this.invoiceRepo.delete(invoiceId);
    }

    /**
     * Send an invoice: generate payment link + send email to client.
     */
    async sendInvoice(userId: string, invoiceId: string, data: SendInvoiceInput) {
        const invoice = await this.getInvoiceById(userId, invoiceId);
        if (invoice.status !== InvoiceStatus.DRAFT) {
            throw new ForbiddenError('Invoice has already been sent');
        }

        const user = await this.userRepo.findById(userId);
        if (!user) throw new NotFoundError('User');

        // Generate payment link
        const paymentLink = await this.paymentSvc.createPaymentLink(
            invoiceId,
            data.paymentProvider,
            {
                amount: Number(invoice.total),
                currency: invoice.currency,
                invoiceNumber: invoice.invoiceNumber,
                description: `Invoice from ${user.businessName || user.name}`,
            },
        );

        // Send email FIRST — only update status if email succeeds
        await this.emailSvc.sendInvoiceEmail({
            to: invoice.client.email,
            clientName: invoice.client.name,
            invoiceNumber: invoice.invoiceNumber,
            amount: Number(invoice.total).toFixed(2),
            currency: invoice.currency,
            dueDate: invoice.dueDate.toLocaleDateString(),
            paymentLink,
            businessName: user.businessName || user.name,
        });

        // Email sent successfully — now update invoice status
        const updatedInvoice = await this.invoiceRepo.update(invoiceId, {
            status: InvoiceStatus.SENT,
            paymentLink,
            paymentProvider: data.paymentProvider,
            issueDate: new Date(),
        });

        return updatedInvoice;
    }

    async getDashboardStats(userId: string): Promise<DashboardStats> {
        return this.invoiceRepo.getDashboardStats(userId);
    }
}

export const invoiceService = new InvoiceService(
    invoiceRepository,
    userRepository,
    paymentService,
    emailService,
);
