import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { testDatabaseConnection, getDatabaseConfig, getSupabaseConfig } from '@/lib/database';

export async function GET(req: NextRequest) {
  try {
    console.log('Testing database connection...');
    
    // Get database configuration info
    const dbConfig = getDatabaseConfig();
    const supabaseConfig = getSupabaseConfig();
    
    // Test basic connection
    await prisma.$connect();
    console.log('Database connection successful');
    
    // Test a simple query
    const userCount = await prisma.user.count();
    console.log('User count query successful:', userCount);
    
    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      userCount,
      databaseConfig: {
        isSupabase: dbConfig.isSupabase,
        hasUrl: !!dbConfig.url,
        hasDirectUrl: !!dbConfig.directUrl,
        supabaseConfigured: !!supabaseConfig,
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database test failed:', error);
    
    // Get config info even on failure
    const dbConfig = getDatabaseConfig();
    const supabaseConfig = getSupabaseConfig();
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      databaseConfig: {
        isSupabase: dbConfig.isSupabase,
        hasUrl: !!dbConfig.url,
        hasDirectUrl: !!dbConfig.directUrl,
        supabaseConfigured: !!supabaseConfig,
      },
      timestamp: new Date().toISOString()
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
} 