import { z } from 'zod';

/**
 * Invoice Validation Schemas
 */

const invoiceItemSchema = z.object({
    description: z.string().min(1, 'Description is required'),
    qty: z.number().positive('Quantity must be positive'),
    rate: z.number().min(0, 'Rate must be non-negative'),
    amount: z.number().min(0, 'Amount must be non-negative'),
});

export const createInvoiceSchema = z.object({
    clientId: z.string().uuid('Invalid client ID'),
    items: z.array(invoiceItemSchema).min(1, 'At least one line item is required'),
    subtotal: z.number().min(0),
    tax: z.number().min(0).max(100).default(0),
    total: z.number().min(0),
    currency: z.string().length(3, 'Currency must be a 3-letter code').default('USD'),
    dueDate: z.string().datetime({ message: 'Invalid due date' }),
    reminderEnabled: z.boolean().default(true),
});

export const updateInvoiceSchema = z.object({
    clientId: z.string().uuid().optional(),
    items: z.array(invoiceItemSchema).min(1).optional(),
    subtotal: z.number().min(0).optional(),
    tax: z.number().min(0).max(100).optional(),
    total: z.number().min(0).optional(),
    currency: z.string().length(3).optional(),
    dueDate: z.string().datetime().optional(),
    reminderEnabled: z.boolean().optional(),
});

export const sendInvoiceSchema = z.object({
    paymentProvider: z.enum(['STRIPE', 'RAZORPAY']),
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
export type UpdateInvoiceInput = z.infer<typeof updateInvoiceSchema>;
export type SendInvoiceInput = z.infer<typeof sendInvoiceSchema>;
