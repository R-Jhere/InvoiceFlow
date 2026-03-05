import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

/**
 * Prisma Client Singleton
 *
 * Prisma 7.x uses a driver-adapter pattern. The `@prisma/adapter-pg`
 * adapter wraps node-postgres (pg) and is passed to PrismaClient
 * via the `adapter` constructor option.
 *
 * In development, the singleton prevents multiple instances due
 * to Next.js hot-reloading. In production, a single instance
 * is used per serverless function invocation.
 */

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

const connectionString = process.env.DATABASE_URL ?? '';

const adapter = new PrismaPg({ connectionString });

export const prisma =
    globalForPrisma.prisma ??
    new PrismaClient({
        adapter,
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
}
