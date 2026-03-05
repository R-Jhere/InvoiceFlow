import { z } from 'zod';

/**
 * Payment Validation Schemas
 */

export const markAsPaidSchema = z.object({
    amount: z.number().positive('Amount must be positive').optional(),
    currency: z.string().length(3).optional(),
    paidAt: z.string().datetime().optional(),
});

export type MarkAsPaidInput = z.infer<typeof markAsPaidSchema>;
