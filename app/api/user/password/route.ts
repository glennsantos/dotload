import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { supabaseUserService } from '@/lib/supabase-db';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback_secret_key_please_set_in_env');

export async function PUT(request: NextRequest) {
  try {
    const { currentPassword, newPassword } = await request.json();
    
    // Validate input
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { message: 'Current password and new password are required' },
        { status: 400 }
      );
    }
    
    if (newPassword.length < 8) {
      return NextResponse.json(
        { message: 'New password must be at least 8 characters long' },
        { status: 400 }
      );
    }
    
    // Get user from token
    const cookieStore = await cookies();
    const token = cookieStore.get('token');
    
    if (!token) {
      return NextResponse.json(
        { message: 'Unauthorized: No token found' },
        { status: 401 }
      );
    }
    
    // Verify JWT token
    let decoded;
    try {
      const { payload } = await jwtVerify(token.value, JWT_SECRET);
      decoded = payload as { userId: string, email: string };
    } catch (jwtError) {
      console.error('JWT Verification Error:', jwtError);
      return NextResponse.json(
        { 
          message: 'Invalid or expired authentication token',
          error: jwtError instanceof Error ? jwtError.message : 'Unknown JWT error'
        },
        { status: 401 }
      );
    }
    
    // Get user from database using Supabase
    const user = await supabaseUserService.findUserById(decoded.userId);
    
    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }
    
    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    
    if (!isPasswordValid) {
      return NextResponse.json(
        { message: 'Current password is incorrect' },
        { status: 400 }
      );
    }
    
    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Update user password using Supabase
    await supabaseUserService.updateUser(user.id, {
      password: hashedPassword
    });
    
    return NextResponse.json(
      { message: 'Password updated successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in password change:', error);
    
    if (error instanceof Error) {
      // Handle specific JWT errors
      if (error.name === 'JWTInvalid' || error.name === 'JWTExpired') {
        return NextResponse.json(
          { message: 'Invalid authentication token' },
          { status: 401 }
        );
      }
      
      // Handle specific Supabase errors
      if (error.message.includes('Failed to')) {
        return NextResponse.json(
          { message: 'Database error occurred. Please try again.' },
          { status: 500 }
        );
      }
    }
    
    return NextResponse.json(
      { message: 'An error occurred while processing your request' },
      { status: 500 }
    );
  }
}
