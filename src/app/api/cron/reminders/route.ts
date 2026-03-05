import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/config/config';
import { reminderService } from '@/services/reminder.service';

/**
 * GET /api/cron/reminders — Daily cron job for auto-reminders
 *
 * Secured by CRON_SECRET header check.
 * Called by Vercel Cron or external cron service.
 */

export async function GET(req: NextRequest) {
    try {
        // Verify cron secret
        const authHeader = req.headers.get('authorization');
        if (authHeader !== `Bearer ${config.app.cronSecret}`) {
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
