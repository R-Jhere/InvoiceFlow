import { z } from 'zod';

/**
 * Reminder Validation Schemas
 */

export const sendReminderSchema = z.object({
    channel: z.enum(['EMAIL', 'WHATSAPP', 'BOTH']),
});

export const reminderSettingsSchema = z.object({
    autoRemindersEnabled: z.boolean(),
    reminderDays: z.array(z.number().int().positive()).min(1),
    maxAttempts: z.number().int().min(1).max(10),
    channels: z.array(z.enum(['EMAIL', 'WHATSAPP'])).min(1),
});

export type SendReminderInput = z.infer<typeof sendReminderSchema>;
export type ReminderSettingsInput = z.infer<typeof reminderSettingsSchema>;
