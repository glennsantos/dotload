import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient, getSupabaseClient } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    console.log('Testing Supabase User table permissions...');
    
    const results: any = {
      anonClient: null,
      adminClient: null,
      errors: []
    };
    
    // Test with anon client
    try {
      const anonClient = await getSupabaseClient();
      if (anonClient) {
        const { data, error, count } = await anonClient
          .from('User')
          .select('*', { count: 'exact', head: true });
        
        results.anonClient = {
          success: !error,
          count,
          error: error?.message,
          data: data
        };
      }
    } catch (anonError) {
      results.errors.push(`Anon client error: ${anonError}`);
    }
    
    // Test with admin client
    try {
      const adminClient = await getSupabaseAdminClient();
      if (adminClient) {
        const { data, error, count } = await adminClient
          .from('User')
          .select('*', { count: 'exact', head: true });
        
        results.adminClient = {
          success: !error,
          count,
          error: error?.message,
          data: data
        };
        
        // Also test inserting a dummy record
        const testEmail = `test-${Date.now()}@example.com`;
        const { data: insertData, error: insertError } = await adminClient
          .from('User')
          .insert({
            email: testEmail,
            password: 'test-password',
            name: 'Test User',
            emailVerified: true
          })
          .select()
          .single();
        
        results.adminClient.insertTest = {
          success: !insertError,
          error: insertError?.message,
          insertedId: insertData?.id
        };
        
        // Clean up - delete the test user
        if (insertData) {
          await adminClient
            .from('User')
            .delete()
            .eq('id', insertData.id);
        }
      }
    } catch (adminError) {
      results.errors.push(`Admin client error: ${adminError}`);
    }
    
    return NextResponse.json({
      success: true,
      message: 'User table permission test completed',
      results,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Permission test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 