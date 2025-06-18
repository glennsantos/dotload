import { NextRequest, NextResponse } from 'next/server';
import { testSupabaseConnection, supabaseUserService } from '@/lib/supabase-db';

export async function GET(req: NextRequest) {
  try {
    console.log('Testing Supabase database connection...');
    console.log('Available environment variables:');
    console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');
    console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'NOT SET');
    console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET');
    console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'NOT SET');
    console.log('NODE_ENV:', process.env.NODE_ENV);
    
    // Check if Supabase environment variables are set
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({
        success: false,
        error: 'Supabase environment variables are not properly configured',
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
    
    // Test Supabase connection
    const connectionTest = await testSupabaseConnection();
    
    if (!connectionTest) {
      throw new Error('Supabase connection test failed');
    }
    
    console.log('Supabase connection successful');
    
    // Test a simple query - get user count
    let userCount = 0;
    try {
      // This would use a count query in the user service
      const users = await supabaseUserService.getAllUsers();
      userCount = users ? users.length : 0;
      console.log('User count query successful:', userCount);
    } catch (countError) {
      console.warn('User count query failed:', countError);
      userCount = -1; // Indicate query failed
    }
    
    // Database configuration
    const databaseConfig = {
      isSupabase: true,
      hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      supabaseConfigured: !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY),
    };
    
    return NextResponse.json({
      success: true,
      message: 'Supabase database connection successful',
      userCount,
      databaseConfig,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Supabase database test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      databaseConfig: {
        isSupabase: true,
        hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        supabaseConfigured: !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY),
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
  }
} 