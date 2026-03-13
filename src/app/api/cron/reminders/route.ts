import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { Redis } from '@upstash/redis';
import { config } from '@/config/config';
import { reminderService } from '@/services/reminder.service';

/**
 * GET /api/cron/reminders — Daily cron job for auto-reminders
 *
 * Secured by CRON_SECRET header check (timing-safe).
 * Called by Vercel Cron or external cron service.
 *
 * A Redis distributed lock prevents duplicate processing when multiple
 * serverless instances receive the same cron trigger simultaneously.
 */

const LOCK_KEY = 'cron:reminders:lock';
const LOCK_TTL_SECONDS = 300; // 5 minutes — max expected run time

let _redis: Redis | null = null;
function getRedis(): Redis {
    if (!_redis) {
        _redis = new Redis({
            url: process.env.UPSTASH_REDIS_REST_URL!,
            token: process.env.UPSTASH_REDIS_REST_TOKEN!,
        });
    }
    return _redis;
}

/** Acquire a distributed lock. Returns true if lock was acquired. */
async function acquireLock(): Promise<boolean> {
    try {
        // SET key value NX EX ttl — atomic acquire-or-fail
        const result = await getRedis().set(LOCK_KEY, '1', {
            nx: true,
            ex: LOCK_TTL_SECONDS,
        });
        return result === 'OK';
    } catch {
        // If Redis is unavailable, allow the job to proceed (fail open)
        console.error('Cron lock acquire failed — proceeding without lock');
        return true;
    }
}

/** Release the distributed lock. */
async function releaseLock(): Promise<void> {
    try {
        await getRedis().del(LOCK_KEY);
    } catch {
        // Non-critical — lock will expire automatically via TTL
        console.error('Cron lock release failed');
    }
}

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

        // Acquire distributed lock to prevent duplicate runs
        const locked = await acquireLock();
        if (!locked) {
            return NextResponse.json(
                { success: false, message: 'Cron job already running' },
                { status: 409 },
            );
        }

        try {
            const results = await reminderService.processAutoReminders();

            return NextResponse.json({
                success: true,
                ...results,
                timestamp: new Date().toISOString(),
            });
        } finally {
            await releaseLock();
        }
    } catch (error) {
        console.error('Cron reminder error:', error);
        return NextResponse.json(
            { error: 'Cron job failed' },
            { status: 500 },
        );
    }
}
