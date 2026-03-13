import { NextRequest } from 'next/server';
import { handlers } from '@/lib/auth';
import { applyRateLimit, getStrictLimiter } from '@/lib/rate-limit';

export const runtime = "nodejs";

export const { GET } = handlers;

/**
 * Wrap the NextAuth POST handler with rate limiting.
 *
 * The POST endpoint handles credential-based login (callback/credentials).
 * Without rate limiting, an attacker can make unlimited brute-force
 * password attempts. We apply the strict limiter (5 req/min per IP)
 * to match the signup route protection.
 */
export async function POST(req: NextRequest) {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const limited = await applyRateLimit(ip, getStrictLimiter());
    if (limited) return limited;

    return handlers.POST(req);
}
