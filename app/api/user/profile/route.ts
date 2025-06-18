import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { supabaseUserService } from '@/lib/supabase-db';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback_secret_key_please_set_in_env');

// Enable debugging
const DEBUG = true;
const debugLog = (message: string, ...args: any[]) => {
  if (DEBUG) {
    console.log(`[DEBUG] ${message}`, ...args);
    process.stderr.write(`[DEBUG] ${message} ${args.map(a => JSON.stringify(a)).join(' ')}\n`);
  }
};

// Get the current authenticated user's ID using modern JWT verification
async function getAuthUserId() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token');
    
    if (!token) {
      return null;
    }
    
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not defined');
    }
    
    const { payload } = await jwtVerify(token.value, JWT_SECRET);
    const decoded = payload as { userId: string };
    return decoded.userId;
  } catch (error) {
    console.error('Auth error:', error);
    return null;
  }
}

// GET: Fetch user profile information using Supabase
export async function GET(request: NextRequest) {
  try {
    // Get the current authenticated user's ID
    const userId = await getAuthUserId();
    
    if (!userId) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get user from database using Supabase
    const user = await supabaseUserService.findUserById(userId);
    
    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }
    
    // Return user profile data
    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { message: 'An error occurred while fetching user profile', error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// PUT: Update user profile information using Supabase
export async function PUT(request: NextRequest) {
  try {
    // Get the current authenticated user's ID
    const userId = await getAuthUserId();
    
    if (!userId) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Parse request body
    const { name, email } = await request.json();
    
    // Validate input
    if (!name && !email) {
      return NextResponse.json(
        { message: 'At least one field (name or email) must be provided' },
        { status: 400 }
      );
    }
    
    // Check if email is already in use (if email is being updated)
    if (email) {
      const existingUser = await supabaseUserService.findUserByEmail(email);
      
      if (existingUser && existingUser.id !== userId) {
        return NextResponse.json(
          { message: 'Email is already in use by another account' },
          { status: 400 }
        );
      }
    }
    
    // Prepare update data
    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    
    // Update user in database using Supabase
    const updatedUser = await supabaseUserService.updateUser(userId, updateData);
    
    return NextResponse.json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        updatedAt: updatedUser.updatedAt
      }
    }, { status: 200 });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json(
      { message: 'An error occurred while updating user profile', error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
