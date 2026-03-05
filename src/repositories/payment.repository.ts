import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

/**
 * Payment Repository
 */

export class PaymentRepository {
    async create(data: Prisma.PaymentUncheckedCreateInput) {
        return prisma.payment.create({ data });
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
}

export const paymentRepository = new PaymentRepository();
