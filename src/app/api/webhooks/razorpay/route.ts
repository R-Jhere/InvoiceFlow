import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { config } from '@/config/config';
import { handleRazorpayWebhook } from '@/services/payment.service';
import { applyRateLimit, getWebhookLimiter } from '@/lib/rate-limit';

/**
 * POST /api/webhooks/razorpay — Handle Razorpay webhook events
 *
 * Verifies webhook signature before processing.
 */

function verifyRazorpaySignature(body: string, signature: string, secret: string): boolean {
    const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(body)
        .digest('hex');
    return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature),
    );
}

export async function POST(req: NextRequest) {
    try {
        // Rate limit: 100 req/min per IP
        const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
        const limited = await applyRateLimit(ip, getWebhookLimiter());
        if (limited) return limited;

        const body = await req.text();
        const signature = req.headers.get('x-razorpay-signature');

        if (!signature) {
            return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
        }

        const isValid = verifyRazorpaySignature(body, signature, config.razorpay.webhookSecret);
        if (!isValid) {
            return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
        }

        const payload = JSON.parse(body);
        await handleRazorpayWebhook(payload);

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error('Razorpay webhook error:', error);
        return NextResponse.json(
            { error: 'Webhook processing failed' },
            { status: 400 },
        );
    }
}
