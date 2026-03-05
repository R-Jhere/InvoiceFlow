import { prisma } from '@/lib/prisma';
import { ReminderStatus, type Prisma } from '@prisma/client';

/**
 * Reminder Repository
 */

export class ReminderRepository {
    async create(data: Prisma.ReminderUncheckedCreateInput) {
        return prisma.reminder.create({ data });
    }

    async findByInvoiceId(invoiceId: string) {
        return prisma.reminder.findMany({
            where: { invoiceId },
            orderBy: { createdAt: 'desc' },
        });
    }

    async update(id: string, data: Prisma.ReminderUpdateInput) {
        return prisma.reminder.update({ where: { id }, data });
    }

    /** Count total successful reminders sent for an invoice */
    async getSentCount(invoiceId: string): Promise<number> {
        return prisma.reminder.count({
            where: { invoiceId, status: ReminderStatus.SENT },
        });
    }
}

export const reminderRepository = new ReminderRepository();
