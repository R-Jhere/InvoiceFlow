import { prisma } from '@/lib/prisma';
import { InvoiceStatus, type Prisma } from '@prisma/client';

/**
 * Invoice Repository
 *
 * Includes the overdue invoice query used by the cron reminder job,
 * dashboard stats aggregation, and auto-increment invoice number generation.
 */

export class InvoiceRepository {
    async findById(id: string) {
        return prisma.invoice.findUnique({
            where: { id },
            include: { client: true, user: true, reminders: true, payments: true },
        });
    }

    async findMany(args?: Prisma.InvoiceFindManyArgs) {
        return prisma.invoice.findMany(args);
    }

    async findByUserId(userId: string, status?: InvoiceStatus) {
        return prisma.invoice.findMany({
            where: { userId, ...(status ? { status } : {}) },
            include: { client: true },
            orderBy: { createdAt: 'desc' },
        });
    }

    async create(data: Prisma.InvoiceUncheckedCreateInput) {
        return prisma.invoice.create({
            data,
            include: { client: true },
        });
    }

    async update(id: string, data: Prisma.InvoiceUncheckedUpdateInput) {
        return prisma.invoice.update({
            where: { id },
            data,
            include: { client: true },
        });
    }

    async delete(id: string) {
        return prisma.invoice.delete({ where: { id } });
    }

    /**
     * Generate the next invoice number for a user.
     * Format: INV-0001, INV-0002, etc.
     */
    async getNextInvoiceNumber(userId: string): Promise<string> {
        const lastInvoice = await prisma.invoice.findFirst({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            select: { invoiceNumber: true },
        });

        if (!lastInvoice) {
            return 'INV-0001';
        }

        const lastNumber = parseInt(lastInvoice.invoiceNumber.replace('INV-', ''), 10);
        const nextNumber = (lastNumber + 1).toString().padStart(4, '0');
        return `INV-${nextNumber}`;
    }

    /**
     * Find invoices eligible for automatic reminders.
     * Used by the daily cron job.
     */
    async findOverdueForReminders(reminderDays: number[], maxAttempts: number) {
        const now = new Date();

        return prisma.invoice.findMany({
            where: {
                status: { in: [InvoiceStatus.SENT, InvoiceStatus.OVERDUE] },
                reminderEnabled: true,
                dueDate: { lt: now },
                OR: [
                    { lastReminderSentAt: null },
                    { lastReminderSentAt: { lt: new Date(now.getTime() - 24 * 60 * 60 * 1000) } },
                ],
            },
            include: {
                client: true,
                user: true,
                reminders: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                },
            },
        });
    }

    /**
     * Aggregate dashboard stats for a user.
     */
    async getDashboardStats(userId: string) {
        const [counts, totalEarned, totalPending, totalOverdue, recentInvoices] = await Promise.all([
            // Invoice counts by status
            prisma.invoice.groupBy({
                by: ['status'],
                where: { userId },
                _count: true,
            }),
            // Total earned (paid invoices)
            prisma.invoice.aggregate({
                where: { userId, status: InvoiceStatus.PAID },
                _sum: { total: true },
            }),
            // Total pending (sent invoices)
            prisma.invoice.aggregate({
                where: { userId, status: InvoiceStatus.SENT },
                _sum: { total: true },
            }),
            // Total overdue
            prisma.invoice.aggregate({
                where: { userId, status: InvoiceStatus.OVERDUE },
                _sum: { total: true },
            }),
            // Recent invoices
            prisma.invoice.findMany({
                where: { userId },
                include: { client: true },
                orderBy: { createdAt: 'desc' },
                take: 5,
            }),
        ]);

        const statusCounts = {
            draft: 0, sent: 0, paid: 0, overdue: 0,
        };
        for (const c of counts) {
            statusCounts[c.status.toLowerCase() as keyof typeof statusCounts] = c._count;
        }

        return {
            totalEarned: Number(totalEarned._sum.total ?? 0),
            totalPending: Number(totalPending._sum.total ?? 0),
            totalOverdue: Number(totalOverdue._sum.total ?? 0),
            invoiceCount: statusCounts,
            recentInvoices: recentInvoices.map((inv) => ({
                id: inv.id,
                invoiceNumber: inv.invoiceNumber,
                clientName: inv.client.name,
                total: Number(inv.total),
                currency: inv.currency,
                status: inv.status,
                dueDate: inv.dueDate,
            })),
        };
    }
}

export const invoiceRepository = new InvoiceRepository();
