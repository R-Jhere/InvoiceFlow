import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { config } from '@/config/config';
import { reminderService } from '@/services/reminder.service';

/**
 * GET /api/cron/reminders — Daily cron job for auto-reminders
 *
 * Secured by CRON_SECRET header check (timing-safe).
 * Called by Vercel Cron or external cron service.
 */

function verifyBearerToken(authHeader: string | null, secret: string): boolean {
    if (!authHeader || !authHeader.startsWith('Bearer ')) return false;
    const token = authHeader.slice(7);
    if (token.length !== secret.length) return false;
    return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(secret));
}

export async function GET(req: NextRequest) {
    try {
        // Verify cron secret (timing-safe comparison)
        const authHeader = req.headers.get('authorization');
        if (!verifyBearerToken(authHeader, config.app.cronSecret)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const results = await reminderService.processAutoReminders();

        return NextResponse.json({
            success: true,
            ...results,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Cron reminder error:', error);
        return NextResponse.json(
            { error: 'Cron job failed' },
            { status: 500 },
        );
    }
}
