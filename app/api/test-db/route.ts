import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    console.log('Testing database connection...');
    
    // Test basic connection
    await prisma.$connect();
    console.log('Database connection successful');
    
    // Test a simple query
    const userCount = await prisma.user.count();
    console.log('User count query successful:', userCount);
    
    // Try to get database configuration (optional)
    let databaseConfig = {
      isSupabase: false,
      hasUrl: !!process.env.DATABASE_URL,
      hasDirectUrl: !!process.env.DIRECT_URL,
      supabaseConfigured: !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    };
    
    try {
      const { getDatabaseConfig, getSupabaseConfig } = await import('@/lib/database');
      const dbConfig = getDatabaseConfig();
      const supabaseConfig = getSupabaseConfig();
      
      databaseConfig = {
        isSupabase: dbConfig.isSupabase,
        hasUrl: !!dbConfig.url,
        hasDirectUrl: !!dbConfig.directUrl,
        supabaseConfigured: !!supabaseConfig,
      };
    } catch (configError) {
      console.warn('Database configuration not available:', configError);
    }
    
    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      userCount,
      databaseConfig,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      databaseConfig: {
        isSupabase: false,
        hasUrl: !!process.env.DATABASE_URL,
        hasDirectUrl: !!process.env.DIRECT_URL,
        supabaseConfigured: !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      },
      timestamp: new Date().toISOString()
    }, { status: 500 });
  } finally {
    try {
      await prisma.$disconnect();
    } catch (disconnectError) {
      console.warn('Error disconnecting from database:', disconnectError);
    }
  }
} 