import { PrismaClient } from '@prisma/client'

// Prevent multiple instances of Prisma Client in development
declare global {
  var prisma: PrismaClient | undefined
}

// Export a single instance of Prisma Client
export const prisma = global.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
})

// Log database connection details in non-production environments
if (process.env.NODE_ENV !== 'production') {
  console.log('DATABASE_URL:', process.env.DATABASE_URL)
  console.log('DB_PORT:', process.env.DB_PORT)
}

// Set the prisma global in non-production environments
if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma
}
