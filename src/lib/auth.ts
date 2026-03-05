import { auth } from './auth.config';
import { UnauthorizedError } from './errors';

/**
 * Auth Helpers (next-auth v5)
 *
 * Used in API route handlers to get the authenticated user.
 */

export interface AuthSession {
    user: {
        id: string;
        email: string;
        name: string;
        plan: 'FREE' | 'PRO';
    };
}

/** Get the current session (returns null if not authenticated) */
export async function getSession(): Promise<AuthSession | null> {
    const session = await auth();
    return session as AuthSession | null;
}

/** Require authentication — throws UnauthorizedError if not logged in */
export async function requireAuth(): Promise<AuthSession> {
    const session = await getSession();
    if (!session?.user?.id) {
        throw new UnauthorizedError();
    }
    return session;
}
