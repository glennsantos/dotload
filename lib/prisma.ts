// Import the Prisma namespace
import * as Prisma from '@prisma/client'

// Prevent multiple instances of Prisma Client in development
declare global {
  var prisma: any | undefined
}

// Export a single instance of Prisma Client
export const prisma = global.prisma || new Prisma.PrismaClient()

// Set the prisma global in non-production environments
if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma
}
