import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

/**
 * User Repository
 *
 * Encapsulates all user-related database queries.
 * No Prisma client usage outside repositories.
 */

export class UserRepository {
    async findById(id: string) {
        return prisma.user.findUnique({ where: { id } });
    }

    async findByEmail(email: string) {
        return prisma.user.findUnique({ where: { email } });
    }

    async findMany(args?: Prisma.UserFindManyArgs) {
        return prisma.user.findMany(args);
    }

    async create(data: Prisma.UserCreateInput) {
        return prisma.user.create({ data });
    }

    async update(id: string, data: Prisma.UserUpdateInput) {
        return prisma.user.update({ where: { id }, data });
    }

    async delete(id: string) {
        return prisma.user.delete({ where: { id } });
    }

    /** Count invoices created by user in the current calendar month */
    async getMonthlyInvoiceCount(userId: string): Promise<number> {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

        return prisma.invoice.count({
            where: {
                userId,
                createdAt: { gte: startOfMonth, lte: endOfMonth },
            },
        });
    }
}

export const userRepository = new UserRepository();
