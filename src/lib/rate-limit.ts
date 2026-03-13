import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';

/**
 * Rate Limiting Utility
 *
 * Uses Upstash Redis for distributed rate limiting.
 * Provides pre-configured limiters for different route categories.
 *
 * Limiters use lazy initialization to avoid reading env vars at build time.
 */

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

let _strictLimiter: Ratelimit | null = null;
/** Strict limiter — for routes that trigger external API calls (Stripe, Resend, Twilio) */
export function getStrictLimiter(): Ratelimit {
    if (!_strictLimiter) {
        _strictLimiter = new Ratelimit({
            redis: getRedis(),
            limiter: Ratelimit.slidingWindow(5, '1 m'),
            prefix: 'ratelimit:strict',
        });
    }
    return _strictLimiter;
}

let _standardLimiter: Ratelimit | null = null;
/** Standard limiter — for general authenticated CRUD routes */
export function getStandardLimiter(): Ratelimit {
    if (!_standardLimiter) {
        _standardLimiter = new Ratelimit({
            redis: getRedis(),
            limiter: Ratelimit.slidingWindow(20, '1 m'),
            prefix: 'ratelimit:standard',
        });
    }
    return _standardLimiter;
}

let _readLimiter: Ratelimit | null = null;
/** Read limiter — for authenticated GET routes (60 req/min per user) */
export function getReadLimiter(): Ratelimit {
    if (!_readLimiter) {
        _readLimiter = new Ratelimit({
            redis: getRedis(),
            limiter: Ratelimit.slidingWindow(60, '1 m'),
            prefix: 'ratelimit:read',
        });
    }
    return _readLimiter;
}

let _webhookLimiter: Ratelimit | null = null;
/** Webhook limiter — IP-based, higher ceiling for legitimate webhook traffic */
export function getWebhookLimiter(): Ratelimit {
    if (!_webhookLimiter) {
        _webhookLimiter = new Ratelimit({
            redis: getRedis(),
            limiter: Ratelimit.slidingWindow(100, '1 m'),
            prefix: 'ratelimit:webhook',
        });
    }
    return _webhookLimiter;
}

/**
 * Apply rate limiting to a request.
 *
 * @param identifier - User ID for authenticated routes, IP for unauthenticated
 * @param limiter - Which limiter to use
 * @returns null if allowed, NextResponse 429 if rate limited
 */
export async function applyRateLimit(
    identifier: string,
    limiter: Ratelimit,
): Promise<NextResponse | null> {
    try {
        const { success, limit, remaining, reset } = await limiter.limit(identifier);

        if (!success) {
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        code: 'RATE_LIMITED',
                        message: 'Too many requests. Please try again later.',
                    },
                },
                {
                    status: 429,
                    headers: {
                        'X-RateLimit-Limit': limit.toString(),
                        'X-RateLimit-Remaining': remaining.toString(),
                        'X-RateLimit-Reset': reset.toString(),
                        'Retry-After': Math.ceil((reset - Date.now()) / 1000).toString(),
                    },
                },
            );
        }

        return null; // Allowed
    } catch (error) {
        // If Redis is down, fail open (don't block requests)
        console.error('Rate limit check failed:', error);
        return null;
    }
}
