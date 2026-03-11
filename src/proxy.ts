import NextAuth from 'next-auth';
import { authConfig } from '@/lib/auth.config';

/**
 * Next.js Middleware/Proxy — Route Protection (next-auth v5)
 *
 * Uses next-auth v5's auth() export as middleware.
 * Protected routes: dashboard, invoices, clients, settings.
 */

const { auth } = NextAuth(authConfig);

// The `proxy.ts` (formerly middleware.ts) requires a default export or a named export "middleware" / "proxy"
export default auth;

export const config = {
    matcher: [
        '/dashboard/:path*',
        '/invoices/((?!.*\\/pay).*)/:path*',
        '/clients/:path*',
        '/settings/:path*',
    ],
};
