import { z } from 'zod';

/**
 * Client Validation Schemas
 */

/**
 * E.164-ish phone number: optional leading +, 7–15 digits.
 * Covers all international phone/WhatsApp numbers.
 */
const phonePattern = /^\+?\d{7,15}$/;

export const createClientSchema = z.object({
    name: z.string().min(1, 'Client name is required').max(200),
    email: z.string().email('Invalid email address'),
    phone: z.string().regex(phonePattern, 'Invalid phone number format').optional(),
    whatsappNumber: z.string().regex(phonePattern, 'Invalid WhatsApp number format').optional(),
    companyName: z.string().max(200).optional(),
    notes: z.string().max(1000).optional(),
});

export const updateClientSchema = z.object({
    name: z.string().min(1).max(200).optional(),
    email: z.string().email().optional(),
    phone: z.string().regex(phonePattern, 'Invalid phone number format').optional(),
    whatsappNumber: z.string().regex(phonePattern, 'Invalid WhatsApp number format').optional(),
    companyName: z.string().max(200).optional(),
    notes: z.string().max(1000).optional(),
});

export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
