import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { config } from '@/config/config';
import { handleStripeWebhook } from '@/services/payment.service';
import { applyRateLimit, getWebhookLimiter } from '@/lib/rate-limit';

/**
 * POST /api/webhooks/stripe — Handle Stripe webhook events
 *
 * This route is NOT authenticated via NextAuth.
 * Instead, it verifies the Stripe webhook signature.
 */

let _stripe: Stripe | null = null;
function getStripe(): Stripe {
    if (!_stripe) _stripe = new Stripe(config.stripe.secretKey, {
        apiVersion: '2025-02-24.acacia' as Stripe.LatestApiVersion,
    });
    return _stripe;
}

export async function POST(req: NextRequest) {
    try {
        // Rate limit: 100 req/min per IP
        const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
        const limited = await applyRateLimit(ip, getWebhookLimiter());
        if (limited) return limited;

        const body = await req.text();
        const signature = req.headers.get('stripe-signature');

        if (!signature) {
            return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
        }

        const event = getStripe().webhooks.constructEvent(
            body,
            signature,
            config.stripe.webhookSecret,
        );

        await handleStripeWebhook(event);

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error('Stripe webhook error:', error);
        return NextResponse.json(
            { error: 'Webhook processing failed' },
            { status: 400 },
        );
    }
}
