import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

/**
 * Payment Repository
 */

export class PaymentRepository {
    async create(data: Prisma.PaymentUncheckedCreateInput) {
        return prisma.payment.create({ data });
    }

    async findById(id: string) {
        return prisma.payment.findUnique({ where: { id } });
    }

    async findMany(args?: Prisma.PaymentFindManyArgs) {
        return prisma.payment.findMany(args);
    }

    async findByInvoiceId(invoiceId: string) {
        return prisma.payment.findMany({
            where: { invoiceId },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findByProviderPaymentId(providerPaymentId: string) {
        return prisma.payment.findFirst({
            where: { providerPaymentId },
        });
    }

    async update(id: string, data: Prisma.PaymentUpdateInput) {
        return prisma.payment.update({ where: { id }, data });
    }

    async delete(id: string) {
        return prisma.payment.delete({ where: { id } });
    }
}

export const paymentRepository = new PaymentRepository();
