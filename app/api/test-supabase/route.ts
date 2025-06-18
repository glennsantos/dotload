import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient, testSupabaseConnection, isSupabaseConfigured } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    console.log('Testing Supabase connection...');
    console.log('Supabase configured:', isSupabaseConfigured());
    
    // Test Supabase client connection
    const connectionTest = await testSupabaseConnection();
    console.log('Connection test result:', connectionTest);
    
    if (!connectionTest.success) {
      return NextResponse.json({
        success: false,
        error: `Supabase client connection failed: ${connectionTest.error}`,
        method: 'Supabase JavaScript Client',
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }

    // Test admin client and get user count
    const supabaseAdmin = await getSupabaseAdminClient();
    if (!supabaseAdmin) {
      return NextResponse.json({
        success: false,
        error: 'Supabase admin client not available',
        method: 'Supabase JavaScript Client',
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }

    // Test querying users table
    const { data: users, error: usersError, count } = await supabaseAdmin
      .from('User')
      .select('*', { count: 'exact', head: true });

    if (usersError) {
      return NextResponse.json({
        success: false,
        error: `Supabase query failed: ${usersError.message}`,
        method: 'Supabase JavaScript Client',
        details: usersError,
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }

    // Test a simple insert/select operation
    const testEmail = `test-${Date.now()}@example.com`;
    const { data: insertData, error: insertError } = await supabaseAdmin
      .from('User')
      .insert({
        email: testEmail,
        password: 'test-password',
        name: 'Test User',
        emailVerified: true
      })
      .select()
      .single();

    if (insertError) {
      console.warn('Insert test failed (this is expected if user already exists):', insertError.message);
    }

    // Clean up test user if it was created
    if (insertData) {
      await supabaseAdmin
        .from('User')
        .delete()
        .eq('id', insertData.id);
    }

    return NextResponse.json({
      success: true,
      message: 'Supabase connection successful using JavaScript client',
      method: 'Supabase JavaScript Client (Recommended)',
      userCount: count || 0,
      testOperations: {
        connectionTest: connectionTest.success,
        userQuery: !usersError,
        insertTest: !insertError || insertError.code === '23505' // Unique constraint violation is OK
      },
      benefits: [
        'No direct database password needed',
        'Built-in Row Level Security (RLS)',
        'Real-time subscriptions available',
        'Automatic connection pooling',
        'Built-in auth integration',
        'Edge function compatibility'
      ],
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Supabase test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      method: 'Supabase JavaScript Client',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 