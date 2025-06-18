import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    console.log('Testing database connection...');
    console.log('Available environment variables:');
      console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'NOT SET');
    console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET');
    console.log('NODE_ENV:', process.env.NODE_ENV);
    
    // If DATABASE_URL is not set, return early with detailed error
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({
        success: false,
        error: 'DATABASE_URL environment variable is not set',
        debug: {
          availableEnvVars: Object.keys(process.env).filter(key => 
            key.includes('DATABASE') || 
            key.includes('SUPABASE') || 
            key.includes('URL') ||
            key.includes('DIRECT')
          ),
          nodeEnv: process.env.NODE_ENV,
          timestamp: new Date().toISOString()
        }
      }, { status: 500 });
    }
    
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
      hasDirectUrl: !!process.env.DATABASE_URL,
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
        hasDirectUrl: !!process.env.DATABASE_URL,
        supabaseConfigured: !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      },
      debug: {
        availableEnvVars: Object.keys(process.env).filter(key => 
          key.includes('DATABASE') || 
          key.includes('SUPABASE') || 
          key.includes('URL') ||
          key.includes('DIRECT')
        ),
        nodeEnv: process.env.NODE_ENV,
        errorStack: error instanceof Error ? error.stack : undefined,
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