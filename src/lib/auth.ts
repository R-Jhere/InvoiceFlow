import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { userRepository } from '@/repositories/user.repository';
import { authConfig } from './auth.config';
import { UnauthorizedError } from './errors';

export const { handlers, signIn, signOut, auth } = NextAuth({
    ...authConfig,
    providers: [
        Credentials({
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                const email = credentials?.email as string | undefined;
                const password = credentials?.password as string | undefined;

                if (!email || !password) return null;

                const user = await userRepository.findByEmail(email);
                if (!user) return null;

                const isValid = await bcrypt.compare(password, user.passwordHash);
                if (!isValid) return null;

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    plan: user.plan,
                };
            },
        }),
    ],
});

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
