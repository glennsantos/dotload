import { PrismaClient } from '@prisma/client';

// Ensure a single Prisma client instance across the application
const globalForPrisma = global as unknown as { prisma: PrismaClient };

if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    // Add any test-specific configuration
    ...(process.env.NODE_ENV === 'test' && {
      log: ['query', 'info', 'warn', 'error'],
    }),
  });
}

export const prisma = globalForPrisma.prisma;
