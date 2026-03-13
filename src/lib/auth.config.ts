import type { NextAuthConfig } from 'next-auth';

/**
 * NextAuth v5 Configuration (Edge-compatible)
 *
 * JWT session strategy with user id and plan in token.
 * Providers are dynamically added in auth.ts because of Node.js dependencies.
 */

export const authConfig = {
    providers: [],
    session: {
        strategy: 'jwt',
        maxAge: 24 * 60 * 60, // 24 hours — force re-auth daily
    },
    cookies: {
        sessionToken: {
            options: {
                httpOnly: true,
                sameSite: 'lax' as const,
                path: '/',
                secure: process.env.NODE_ENV === 'production',
            },
        },
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isProtectedRoute = [
                '/dashboard',
                '/invoices',
                '/clients',
                '/settings'
            ].some(path => nextUrl.pathname.startsWith(path));

            if (isProtectedRoute) {
                if (isLoggedIn) return true;
                return false; // Redirect unauthenticated users to login page
            } else if (isLoggedIn && (nextUrl.pathname === '/login' || nextUrl.pathname === '/signup' || nextUrl.pathname === '/')) {
                return Response.redirect(new URL('/dashboard', nextUrl));
            }
            return true;
        },
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
} satisfies NextAuthConfig;
