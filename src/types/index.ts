/**
 * Shared TypeScript Types
 *
 * Types that are used across multiple layers (services, routes, etc.).
 * Prisma-generated types are used for database models.
 * These types supplement Prisma for API-specific shapes.
 */

/** A single line item on an invoice */
export interface InvoiceItem {
    description: string;
    qty: number;
    rate: number;
    amount: number;
}

/** Dashboard statistics returned to the frontend */
export interface DashboardStats {
    totalEarned: number;
    totalPending: number;
    totalOverdue: number;
    invoiceCount: {
        draft: number;
        sent: number;
        paid: number;
        overdue: number;
    };
    recentInvoices: {
        id: string;
        invoiceNumber: string;
        clientName: string;
        total: number;
        currency: string;
        status: string;
        dueDate: Date;
    }[];
}

/** Reminder settings configured by the user */
export interface ReminderSettings {
    autoRemindersEnabled: boolean;
    reminderDays: number[];       // e.g., [3, 7, 14]
    maxAttempts: number;
    channels: ('EMAIL' | 'WHATSAPP')[];
}

/** Standardized API response wrapper */
export interface ApiResponseType<T = unknown> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
        details?: Record<string, string[]>;
    };
    meta?: {
        page?: number;
        limit?: number;
        total?: number;
    };
}

/** Auth session user shape */
export interface SessionUser {
    id: string;
    email: string;
    name: string;
    plan: 'FREE' | 'PRO';
}
