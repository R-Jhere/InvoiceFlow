import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { userRepository } from '@/repositories/user.repository';

/**
 * NextAuth v5 Configuration
 *
 * Credentials provider with email/password.
 * JWT session strategy with user id and plan in token.
 */

export const { handlers, signIn, signOut, auth } = NextAuth({
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
    session: {
        strategy: 'jwt',
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.plan = (user as Record<string, unknown>).plan as string;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                (session.user as unknown as Record<string, unknown>).id = token.id as string;
                (session.user as unknown as Record<string, unknown>).plan = token.plan as string;
            }
            return session;
        },
    },
    pages: {
        signIn: '/login',
        newUser: '/signup',
    },
});
