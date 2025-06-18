import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { supabaseUserService } from '@/lib/supabase-db';
import { uploadToCloudinary } from '@/lib/cloudinary';

// Enable debugging
const DEBUG = true;
const debugLog = (message: string, ...args: any[]) => {
  if (DEBUG) {
    console.log(`[DEBUG] ${message}`, ...args);
    process.stderr.write(`[DEBUG] ${message} ${args.map(a => JSON.stringify(a)).join(' ')}\n`);
  }
};

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback_secret_key_please_set_in_env');

// Get the current authenticated user's ID
async function getAuthUserId() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token');
    
    if (!token) {
      return null;
    }
    
    const { payload } = await jwtVerify(token.value, JWT_SECRET);
    const decoded = payload as { userId: string };
    return decoded.userId;
  } catch (error) {
    console.error('Auth error:', error);
    return null;
  }
}

// Process uploaded image files
async function processImageFile(file: File, userId: string, type: 'logo' | 'header') {
  if (!file) return null;
  
  try {
    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Upload to Cloudinary
    const folder = `users/${userId}/${type}`;
    const result = await uploadToCloudinary(buffer, {
      folder,
      public_id: `${type}-${Date.now()}`,
    }) as any;
    
    return result.secure_url;
  } catch (error) {
    console.error(`Error processing ${type} image:`, error);
    return null;
  }
}

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
    
    // Return formatted response with brand terminology
    return NextResponse.json({
      storeName: user.storeName,
      storeDescription: user.storeDescription,
      logoUrl: user.storeLogoPath,
      headerUrl: user.storeHeaderPath,
      name: user.name,
      email: user.email
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching user settings:', error);
    
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
      { message: 'An error occurred while fetching user settings', error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get the current authenticated user's ID
    const userId = await getAuthUserId();
    
    if (!userId) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Parse form data
    const formData = await request.formData();
    
    // Extract fields
    const storeName = formData.get('storeName') as string;
    const storeDescription = formData.get('storeDescription') as string;
    const logoFile = formData.get('logoFile') as File | null;
    const headerFile = formData.get('headerFile') as File | null;
    
    // Process image files if provided
    let storeLogoPath = null;
    let storeHeaderPath = null;
    
    if (logoFile) {
      storeLogoPath = await processImageFile(logoFile, userId, 'logo');
    }
    
    if (headerFile) {
      storeHeaderPath = await processImageFile(headerFile, userId, 'header');
    }
    
    // Prepare update data
    const updateData: any = {};
    
    // Only include fields that are provided (all fields are optional)
    if (storeName !== null) updateData.storeName = storeName;
    if (storeDescription !== null) updateData.storeDescription = storeDescription;
    if (storeLogoPath !== null) updateData.storeLogoPath = storeLogoPath;
    if (storeHeaderPath !== null) updateData.storeHeaderPath = storeHeaderPath;
    
    // Update user in database using Supabase
    const updatedUser = await supabaseUserService.updateUser(userId, updateData);
    
    return NextResponse.json({ 
      message: 'Brand settings updated successfully',
      storeName: updatedUser.storeName,
      storeDescription: updatedUser.storeDescription,
      logoUrl: updatedUser.storeLogoPath,
      headerUrl: updatedUser.storeHeaderPath,
      name: updatedUser.name,
      email: updatedUser.email
    }, { status: 200 });
  } catch (error) {
    console.error('Error updating user settings:', error);
    
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
      { message: 'An error occurred while updating user settings', error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
