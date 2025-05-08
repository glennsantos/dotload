import { NextRequest, NextResponse } from 'next/server';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { getAuthUserId } from '@/lib/auth-utils';

export async function POST(request: NextRequest) {
  try {
    // Get the current authenticated user's ID
    const userId = getAuthUserId();
    
    // If no authenticated user, return error
    if (!userId) {
      return NextResponse.json({ 
        error: 'Authentication required',
        details: 'You must be logged in to upload files'
      }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const productId = formData.get('productId') as string;
    const type = formData.get('type') as string || 'content';
    
    if (!file) {
      return NextResponse.json({ 
        error: 'No file provided',
        details: 'Please provide a file to upload'
      }, { status: 400 });
    }

    if (!productId) {
      return NextResponse.json({ 
        error: 'No product ID provided',
        details: 'Please provide a product ID'
      }, { status: 400 });
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Cloudinary
    const folder = `users/${userId}/products/${productId}/${type}`;
    const result = await uploadToCloudinary(buffer, {
      folder,
      public_id: file.name.split('.')[0],
    });

    return NextResponse.json({
      success: true,
      result
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ 
      error: 'Upload failed', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
