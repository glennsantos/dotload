// For Prisma v6.7.0, we need to import the client differently
import pkg from '@prisma/client'

// Prevent multiple instances of Prisma Client in development
declare global {
  var prisma: any | undefined
}

// Create a Prisma client instance
const createPrismaClient = () => {
  // Handle both ESM and CommonJS module systems
  const { PrismaClient } = pkg as any
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })
}

// Export a single instance of Prisma Client
export const prisma = global.prisma || createPrismaClient()

// Set the prisma global in non-production environments
if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma
}
