import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { prisma } from "@/lib/prisma";
import { uploadToCloudinary } from '@/lib/cloudinary';

// Enable debugging
const DEBUG = true;
const debugLog = (message: string, ...args: any[]) => {
  if (DEBUG) {
    console.log(`[DEBUG] ${message}`, ...args);
    process.stderr.write(`[DEBUG] ${message} ${args.map(a => JSON.stringify(a)).join(' ')}\n`);
  }
};

// Get the current authenticated user's ID
async function getAuthUserId() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token');
    
    if (!token) {
      return null;
    }
    
    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      throw new Error('JWT_SECRET is not defined');
    }
    
    const decoded = jwt.verify(token.value, JWT_SECRET) as { userId: string };
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
    
    // Get user from database with brand fields
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        storeName: true,
        storeDescription: true,
        storeLogoPath: true,
        storeHeaderPath: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
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
    
    // Update user in database
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        storeName: true,
        storeDescription: true,
        storeLogoPath: true,
        storeHeaderPath: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
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
    return NextResponse.json(
      { message: 'An error occurred while updating user settings', error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
