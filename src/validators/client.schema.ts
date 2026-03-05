import { z } from 'zod';

/**
 * Client Validation Schemas
 */

export const createClientSchema = z.object({
    name: z.string().min(1, 'Client name is required').max(200),
    email: z.string().email('Invalid email address'),
    phone: z.string().max(20).optional(),
    whatsappNumber: z.string().max(20).optional(),
    companyName: z.string().max(200).optional(),
    notes: z.string().max(1000).optional(),
});

export const updateClientSchema = z.object({
    name: z.string().min(1).max(200).optional(),
    email: z.string().email().optional(),
    phone: z.string().max(20).optional(),
    whatsappNumber: z.string().max(20).optional(),
    companyName: z.string().max(200).optional(),
    notes: z.string().max(1000).optional(),
});

export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
