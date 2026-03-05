import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { config } from '@/config/config';
import { paymentService } from '@/services/payment.service';

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
        await paymentService.handleRazorpayWebhook(payload);

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error('Razorpay webhook error:', error);
        return NextResponse.json(
            { error: 'Webhook processing failed' },
            { status: 400 },
        );
    }
}
