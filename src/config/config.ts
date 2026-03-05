/**
 * Unified Configuration
 *
 * ALL environment variables are accessed through this module.
 * No direct process.env usage anywhere else in the codebase.
 *
 * Uses getter functions so env vars are read at runtime,
 * not at module-evaluation time. This prevents build failures
 * when environment variables aren't available during `next build`.
 */

function requireEnv(key: string): string {
    const value = process.env[key];
    if (!value) {
        throw new Error(`Missing required environment variable: ${key}`);
    }
    return value;
}

function optionalEnv(key: string, fallback: string = ''): string {
    return process.env[key] || fallback;
}

export const config = {
    get database() {
        return {
            url: requireEnv('DATABASE_URL'),
        };
    },

    get auth() {
        return {
            secret: requireEnv('NEXTAUTH_SECRET'),
            url: optionalEnv('NEXTAUTH_URL', 'http://localhost:3000'),
        };
    },

    get stripe() {
        return {
            secretKey: optionalEnv('STRIPE_SECRET_KEY'),
            webhookSecret: optionalEnv('STRIPE_WEBHOOK_SECRET'),
        };
    },

    get razorpay() {
        return {
            keyId: optionalEnv('RAZORPAY_KEY_ID'),
            keySecret: optionalEnv('RAZORPAY_KEY_SECRET'),
            webhookSecret: optionalEnv('RAZORPAY_WEBHOOK_SECRET'),
        };
    },

    get email() {
        return {
            resendApiKey: optionalEnv('RESEND_API_KEY'),
            from: optionalEnv('EMAIL_FROM', 'InvoiceFlow <noreply@invoiceflow.app>'),
        };
    },

    get whatsapp() {
        return {
            accountSid: optionalEnv('TWILIO_ACCOUNT_SID'),
            authToken: optionalEnv('TWILIO_AUTH_TOKEN'),
            from: optionalEnv('TWILIO_WHATSAPP_FROM', 'whatsapp:+14155238886'),
        };
    },

    get app() {
        return {
            url: optionalEnv('APP_URL', 'http://localhost:3000'),
            cronSecret: optionalEnv('CRON_SECRET'),
            isDev: process.env.NODE_ENV !== 'production',
        };
    },
};
