import { paymentRepository, PaymentRepository } from '@/repositories/payment.repository';
import { invoiceRepository, InvoiceRepository } from '@/repositories/invoice.repository';
import { emailService, EmailService } from './email.service';
import { NotFoundError, AppError } from '@/lib/errors';
import { config } from '@/config/config';
import { PaymentProvider, InvoiceStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import type { MarkAsPaidInput } from '@/validators/payment.schema';
import Stripe from 'stripe';
import Razorpay from 'razorpay';

let stripe: Stripe;
export const getStripeClient = () => {
    if (!stripe) {
        stripe = new Stripe(config.stripe.secretKey, {
            apiVersion: '2025-02-24.acacia' as any,
        });
    }
    return stripe;
};

let razorpay: Razorpay;
export const getRazorpayClient = () => {
    if (!razorpay) {
        razorpay = new Razorpay({
            key_id: config.razorpay.keyId,
            key_secret: config.razorpay.keySecret,
        });
    }
    return razorpay;
};

/**
 * Payment Service
 */

interface CreatePaymentLinkParams {
    amount: number;
    currency: string;
    invoiceNumber: string;
    description: string;
}

export class PaymentService {
    constructor(
        private readonly paymentRepo: PaymentRepository,
        private readonly invoiceRepo: InvoiceRepository,
        private readonly emailSvc: EmailService,
    ) { }

    /**
     * Retrieve all payments for a given invoice.
     */
    async getPaymentsByInvoice(invoiceId: string) {
        return this.paymentRepo.findByInvoiceId(invoiceId);
    }

    /**
     * Retrieve a single payment record by ID.
     */
    async getPaymentById(id: string) {
        const payment = await this.paymentRepo.findById(id);
        if (!payment) throw new NotFoundError('Payment');
        return payment;
    }

    /**
     * Generate a payment link from Stripe or Razorpay.
     */
    async createPaymentLink(
        invoiceId: string,
        provider: PaymentProvider,
        params: CreatePaymentLinkParams,
    ): Promise<string> {
        if (provider === PaymentProvider.STRIPE) {
            const stripe = getStripeClient();
            try {
                const session = await stripe.checkout.sessions.create({
                    payment_method_types: ['card'],
                    line_items: [
                        {
                            price_data: {
                                currency: params.currency.toLowerCase(),
                                product_data: {
                                    name: `Invoice ${params.invoiceNumber}`,
                                    description: params.description,
                                },
                                unit_amount: Math.round(params.amount * 100), // Stripe expects cents
                            },
                            quantity: 1,
                        },
                    ],
                    mode: 'payment',
                    success_url: `${config.auth.url}/invoices/${invoiceId}/success`,
                    cancel_url: `${config.auth.url}/invoices/${invoiceId}/pay`,
                    client_reference_id: invoiceId, // Used in webhook
                });

                if (!session.url) throw new AppError('Failed to generate Stripe payment link', 500, 'STRIPE_ERROR');
                return session.url;
            } catch (error) {
                console.error('Stripe error:', error);
                throw new AppError('Failed to generate Stripe payment link', 500, 'STRIPE_ERROR');
            }
        }

        if (provider === PaymentProvider.RAZORPAY) {
            const razorpay = getRazorpayClient();
            try {
                const pLink: any = await razorpay.paymentLink.create({
                    amount: Math.round(params.amount * 100), // Razorpay expects paise
                    currency: params.currency.toUpperCase(),
                    accept_partial: false,
                    description: `Invoice ${params.invoiceNumber}`,
                    reference_id: invoiceId, // Used in webhook
                    callback_url: `${config.auth.url}/invoices/${invoiceId}/success`,
                    callback_method: 'get',
                } as any); // Cast as any because razorpay types are sometimes conflicting

                if (!pLink.short_url) throw new AppError('Failed to generate Razorpay payment link', 500, 'RAZORPAY_ERROR');
                return pLink.short_url;
            } catch (error) {
                console.error('Razorpay error:', error);
                throw new AppError('Failed to generate Razorpay payment link', 500, 'RAZORPAY_ERROR');
            }
        }

        throw new AppError('Invalid payment provider', 400, 'INVALID_INPUT');
    }

    /**
     * Handle incoming webhooks from Stripe or Razorpay.
     */
    async handleWebhook(provider: PaymentProvider, payload: any) {
        if (provider === PaymentProvider.STRIPE) {
            // Ensure this is a successful checkout session
            if (payload.type !== 'checkout.session.completed') return;

            const session = payload.data.object;
            const invoiceId = session.client_reference_id;
            const providerPaymentId = session.payment_intent as string;

            if (!invoiceId) return; // Ignore if missing our reference

            await this.processPaymentSuccess(
                invoiceId,
                PaymentProvider.STRIPE,
                providerPaymentId as string,
                Number(session.amount_total!) / 100, // Convert back from cents
                session.currency!.toUpperCase(),
            );
        }

        if (provider === PaymentProvider.RAZORPAY) {
            // Ensure this is a successful payment
            if (payload.event !== 'payment_link.paid') return;

            const link = payload.payload.payment_link.entity;
            const invoiceId = link.reference_id;
            const providerPaymentId = payload.payload.payment.entity.id;

            if (!invoiceId) return;

            await this.processPaymentSuccess(
                invoiceId,
                PaymentProvider.RAZORPAY,
                providerPaymentId,
                Number(link.amount_paid) / 100, // Convert back from paise
                link.currency.toUpperCase(),
            );
        }
    }

    /**
     * Mark an invoice as paid manually (off-platform payment).
     */
    async markAsPaid(userId: string, invoiceId: string, data: MarkAsPaidInput) {
        const invoice = await this.invoiceRepo.findById(invoiceId);
        if (!invoice) throw new NotFoundError('Invoice');
        if (invoice.userId !== userId) throw new AppError('Forbidden', 403, 'FORBIDDEN');
        if (invoice.status === InvoiceStatus.PAID) throw new AppError('Invoice is already paid', 400, 'INVALID_STATE');

        // Use a deterministic providerPaymentId so the existing idempotency
        // check in processPaymentSuccess catches concurrent mark-paid requests.
        const manualPaymentId = `manual-${invoiceId}`;

        await this.processPaymentSuccess(
            invoiceId,
            PaymentProvider.MANUAL,
            manualPaymentId,
            data.amount ? Number(data.amount) : Number(invoice.total),
            data.currency || invoice.currency!,
            data.paidAt ? new Date(data.paidAt) : new Date(),
        );

        return this.invoiceRepo.findById(invoiceId);
    }

    /**
     * Internal: Update invoice status and create payment record (atomic).
     */
    private async processPaymentSuccess(
        invoiceId: string,
        provider: PaymentProvider,
        providerPaymentId: string | null,
        amount: number,
        currency: string,
        paidAt: Date = new Date(),
    ) {
        // Check if payment already recorded (idempotency)
        if (providerPaymentId) {
            const existing = await this.paymentRepo.findByProviderPaymentId(providerPaymentId);
            if (existing) return; // Already processed
        }

        const invoice = await this.invoiceRepo.findById(invoiceId);
        if (!invoice) return;

        // Atomically create payment record and update invoice status.
        // If either operation fails the entire transaction is rolled back,
        // keeping the database consistent and allowing webhook retries to
        // re-process the event correctly.
        await prisma.$transaction([
            prisma.payment.create({
                data: {
                    invoiceId,
                    provider,
                    providerPaymentId,
                    amount: amount as any,
                    currency,
                    paidAt,
                },
            }),
            prisma.invoice.update({
                where: { id: invoiceId },
                data: {
                    status: InvoiceStatus.PAID,
                    paidAt,
                    // If they pay, no more reminders should go out
                    reminderEnabled: false,
                },
            }),
        ]);

        // Send payment confirmation email to the freelancer.
        // Email failure must not revert a successfully recorded payment.
        try {
            if (invoice.user && invoice.client) {
                await this.emailSvc.sendPaymentConfirmation({
                    to: invoice.user.email!,
                    freelancerName: invoice.user.businessName || invoice.user.name,
                    invoiceNumber: invoice.invoiceNumber,
                    amount: Number(amount).toFixed(2),
                    currency,
                    clientName: invoice.client.name,
                });
            }
        } catch {
            // Email failure should not revert a successful payment
            console.error(`Payment confirmation email failed for invoice ${invoiceId}`);
        }
    }
}

export const paymentService = new PaymentService(
    paymentRepository,
    invoiceRepository,
    emailService,
);

// Re-export webhooks handlers for clean API paths
export const handleStripeWebhook = (event: any) => paymentService.handleWebhook(PaymentProvider.STRIPE, event);
export const handleRazorpayWebhook = (payload: any) => paymentService.handleWebhook(PaymentProvider.RAZORPAY, payload);
