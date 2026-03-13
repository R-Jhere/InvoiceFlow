import { z } from 'zod';

/**
 * Auth Validation Schemas
 */

/**
 * Password must be 8–72 characters and contain at least one uppercase letter,
 * one lowercase letter, one digit, and one special character.
 *
 * The 72-char upper bound matches bcrypt's internal byte limit — anything
 * beyond that is silently truncated by the algorithm, so allowing more
 * would give users a false sense of security.
 */
const passwordSchema = z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password must be at most 72 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one digit')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

export const signupSchema = z.object({
    name: z.string().min(1, 'Name is required').max(200),
    email: z.string().email('Invalid email address').transform(v => v.toLowerCase()),
    password: passwordSchema,
    businessName: z.string().max(200).optional(),
});

export const loginSchema = z.object({
    email: z.string().email('Invalid email address').transform(v => v.toLowerCase()),
    password: z.string().min(1, 'Password is required'),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
