import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { successResponse, errorResponse } from '@/lib/api-response';
import { userRepository } from '@/repositories/user.repository';
import { signupSchema } from '@/validators/auth.schema';
import { ConflictError } from '@/lib/errors';
import { applyRateLimit, getStrictLimiter } from '@/lib/rate-limit';

/**
 * POST /api/auth/signup — Register a new freelancer account
 *
 * Public route — no auth required.
 * Rate limited: 5 req/min per IP to prevent abuse.
 */

const BCRYPT_SALT_ROUNDS = 12;

export async function POST(req: NextRequest) {
    try {
        // Rate limit by IP (unauthenticated route)
        const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
        const limited = await applyRateLimit(ip, getStrictLimiter());
        if (limited) return limited;

        const body = await req.json();
        const data = signupSchema.parse(body);

        // Check for existing user
        const existing = await userRepository.findByEmail(data.email);
        if (existing) {
            throw new ConflictError('An account with this email already exists');
        }

        // Hash password
        const passwordHash = await bcrypt.hash(data.password, BCRYPT_SALT_ROUNDS);

        // Create user
        const user = await userRepository.create({
            name: data.name,
            email: data.email,
            passwordHash,
            businessName: data.businessName,
        });

        return successResponse(
            {
                id: user.id,
                email: user.email,
                name: user.name,
                plan: user.plan,
            },
            201,
        );
    } catch (error) {
        return errorResponse(error);
    }
}
