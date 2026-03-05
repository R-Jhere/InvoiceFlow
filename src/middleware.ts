export { auth as middleware } from '@/lib/auth.config';

/**
 * Next.js Middleware — Route Protection (next-auth v5)
 *
 * Uses next-auth v5's auth() export as middleware.
 * Protected routes: dashboard, invoices, clients, settings.
 */

export const config = {
    matcher: [
        '/dashboard/:path*',
        '/invoices/((?!.*\\/pay).*)/:path*',
        '/clients/:path*',
        '/settings/:path*',
    ],
};
