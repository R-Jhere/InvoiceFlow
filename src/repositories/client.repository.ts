import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

/**
 * Client Repository
 */

export class ClientRepository {
    async findById(id: string) {
        return prisma.client.findUnique({ where: { id } });
    }

    async findByUserId(userId: string) {
        return prisma.client.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
    }

    async create(data: Prisma.ClientUncheckedCreateInput) {
        return prisma.client.create({ data });
    }

    async update(id: string, data: Prisma.ClientUpdateInput) {
        return prisma.client.update({ where: { id }, data });
    }

    async delete(id: string) {
        return prisma.client.delete({ where: { id } });
    }
}

export const clientRepository = new ClientRepository();
