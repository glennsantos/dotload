import { NextRequest, NextResponse } from 'next/server';
import { supabaseUserService } from '@/lib/supabase-db';

export async function GET(req: NextRequest) {
  try {
    console.log('Testing Supabase user service...');
    
    // Test getting user count
    const userCount = await supabaseUserService.getUserCount();
    console.log('User count:', userCount);
    
    // Test finding a user by email (should return null for non-existent)
    const testUser = await supabaseUserService.findUserByEmail('nonexistent@example.com');
    console.log('Test user lookup result:', testUser);
    
    return NextResponse.json({
      success: true,
      message: 'Supabase user service test successful',
      userCount,
      testUserLookup: testUser === null ? 'User not found (expected)' : 'User found unexpectedly',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Supabase user service test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 