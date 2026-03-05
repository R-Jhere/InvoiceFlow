import Stripe from 'stripe';
import Razorpay from 'razorpay';
import { config } from '@/config/config';
import { paymentRepository, PaymentRepository } from '@/repositories/payment.repository';
import { invoiceRepository, InvoiceRepository } from '@/repositories/invoice.repository';
import { emailService, EmailService } from './email.service';
import { NotFoundError } from '@/lib/errors';

/**
 * Payment Service
 *
 * Handles payment link generation (Stripe/Razorpay),
 * webhook processing, and manual mark-as-paid.
 */

let _stripe: Stripe | null = null;
function getStripe(): Stripe {
    if (!_stripe) _stripe = new Stripe(config.stripe.secretKey, {
        apiVersion: '2025-02-24.acacia' as Stripe.LatestApiVersion,
    });
    return _stripe;
}

let _razorpay: InstanceType<typeof Razorpay> | null = null;
function getRazorpay(): InstanceType<typeof Razorpay> {
    if (!_razorpay) _razorpay = new Razorpay({
        key_id: config.razorpay.keyId,
        key_secret: config.razorpay.keySecret,
    });
    return _razorpay;
}

export class PaymentService {
    constructor(
        private readonly paymentRepo: PaymentRepository,
        private readonly invoiceRepo: InvoiceRepository,
        private readonly email: EmailService,
    ) { }

    /**
     * Generate a payment link for an invoice.
     */
    async createPaymentLink(
        invoiceId: string,
        provider: 'STRIPE' | 'RAZORPAY',
        params: { amount: number; currency: string; invoiceNumber: string; description: string },
    ): Promise<string> {
        if (provider === 'STRIPE') {
            return this.createStripePaymentLink(params);
        }
        return this.createRazorpayPaymentLink(params);
    }

    private async createStripePaymentLink(params: {
        amount: number;
        currency: string;
        invoiceNumber: string;
        description: string;
    }): Promise<string> {
        const session = await getStripe().checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: params.currency.toLowerCase(),
                        product_data: {
                            name: `Invoice ${params.invoiceNumber}`,
                            description: params.description,
                        },
                        unit_amount: Math.round(params.amount * 100), // Stripe uses cents
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${config.app.url}/invoices?payment=success`,
            cancel_url: `${config.app.url}/invoices?payment=cancelled`,
            metadata: { invoiceNumber: params.invoiceNumber },
        });

        return session.url || '';
    }

    private async createRazorpayPaymentLink(params: {
        amount: number;
        currency: string;
        invoiceNumber: string;
        description: string;
    }): Promise<string> {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const link = await (getRazorpay().paymentLink as any).create({
            amount: Math.round(params.amount * 100), // Razorpay uses paise
            currency: params.currency.toUpperCase(),
            description: `Invoice ${params.invoiceNumber} — ${params.description}`,
            reference_id: params.invoiceNumber,
            callback_url: `${config.app.url}/invoices?payment=success`,
            callback_method: 'get',
        });

        return link.short_url;
    }

    /**
     * Handle Stripe webhook (checkout.session.completed).
     */
    async handleStripeWebhook(event: Stripe.Event) {
        if (event.type !== 'checkout.session.completed') return;

        const session = event.data.object as Stripe.Checkout.Session;
        const invoiceNumber = session.metadata?.invoiceNumber;
        if (!invoiceNumber) return;

        // Idempotency: check if already processed
        const existing = await this.paymentRepo.findByProviderPaymentId(session.id);
        if (existing) return;

        // Find the invoice by number
        const invoices = await this.invoiceRepo.findByUserId('', undefined);
        const invoice = invoices.find((i: { invoiceNumber: string }) => i.invoiceNumber === invoiceNumber);
        if (!invoice) return;

        const now = new Date();

        await this.paymentRepo.create({
            invoiceId: invoice.id,
            provider: 'STRIPE',
            providerPaymentId: session.id,
            amount: Number(invoice.total),
            currency: invoice.currency,
            paidAt: now,
        });

        await this.invoiceRepo.update(invoice.id, {
            status: 'PAID',
            paidAt: now,
        });
    }

    /**
     * Handle Razorpay webhook (payment_link.paid).
     */
    async handleRazorpayWebhook(payload: Record<string, unknown>) {
        const event = payload as { event?: string; payload?: { payment_link?: { entity?: { id?: string; reference_id?: string; amount?: number } } } };
        if (event.event !== 'payment_link.paid') return;

        const entity = event.payload?.payment_link?.entity;
        if (!entity?.id || !entity?.reference_id) return;

        // Idempotency
        const existing = await this.paymentRepo.findByProviderPaymentId(entity.id);
        if (existing) return;

        const invoices = await this.invoiceRepo.findByUserId('', undefined);
        const invoice = invoices.find((i: { invoiceNumber: string }) => i.invoiceNumber === entity.reference_id);
        if (!invoice) return;

        const now = new Date();

        await this.paymentRepo.create({
            invoiceId: invoice.id,
            provider: 'RAZORPAY',
            providerPaymentId: entity.id,
            amount: Number(invoice.total),
            currency: invoice.currency,
            paidAt: now,
        });

        await this.invoiceRepo.update(invoice.id, {
            status: 'PAID',
            paidAt: now,
        });
    }

    /**
     * Manually mark an invoice as paid.
     */
    async markAsPaid(invoiceId: string, userId: string, data?: { amount?: number; currency?: string; paidAt?: string }) {
        const invoice = await this.invoiceRepo.findById(invoiceId);
        if (!invoice) throw new NotFoundError('Invoice');
        if (invoice.userId !== userId) throw new NotFoundError('Invoice');
        if (invoice.status === 'PAID') return invoice;

        const now = new Date();

        await this.paymentRepo.create({
            invoiceId: invoice.id,
            provider: 'MANUAL',
            amount: data?.amount ?? Number(invoice.total),
            currency: data?.currency ?? invoice.currency,
            paidAt: data?.paidAt ? new Date(data.paidAt) : now,
        });

        return this.invoiceRepo.update(invoice.id, {
            status: 'PAID',
            paidAt: data?.paidAt ? new Date(data.paidAt) : now,
        });
    }
}

export const paymentService = new PaymentService(paymentRepository, invoiceRepository, emailService);
