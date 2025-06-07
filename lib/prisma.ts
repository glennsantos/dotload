// For Prisma v6.7.0, we need to import the client differently
import pkg from '@prisma/client'
import { getDatabaseConfig } from './database'

// Prevent multiple instances of Prisma Client in development
declare global {
  var prisma: any | undefined
}

// Create a Prisma client instance
const createPrismaClient = () => {
  // Get database configuration
  const dbConfig = getDatabaseConfig();
  
  // Handle both ESM and CommonJS module systems
  const { PrismaClient } = pkg as any
  
  // Create Prisma client with appropriate configuration
  const prismaConfig: any = {
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  };
  
  // If we have a custom database URL, override the default
  if (dbConfig.url && dbConfig.url !== process.env.DATABASE_URL) {
    prismaConfig.datasources = {
      db: {
        url: dbConfig.url,
      },
    };
  }
  
  console.log('Creating Prisma client with config:', {
    isSupabase: dbConfig.isSupabase,
    hasCustomUrl: !!prismaConfig.datasources,
  });
  
  return new PrismaClient(prismaConfig);
}

// Export a single instance of Prisma Client
export const prisma = global.prisma || createPrismaClient()

// Set the prisma global in non-production environments
if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma
}
