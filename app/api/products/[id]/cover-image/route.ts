import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserId } from '@/lib/auth-utils';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { mkdir } from 'fs/promises';
import { cwd } from 'process';
import { uploadToCloudinary } from '@/lib/cloudinary';

// Function removed - using Cloudinary exclusively

export async function POST(
  request: NextRequest
) {
  try {
    // Extract the product ID from the URL path
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const productId = pathParts[pathParts.indexOf('products') + 1];
    
    if (!productId) {
      return NextResponse.json({ 
        error: 'Missing product ID',
        details: 'Product ID is required'
      }, { status: 400 });
    }
    
    // Get the current authenticated user's ID
    const userId = await getAuthUserId();
    
    // If no authenticated user, return error
    if (!userId) {
      return NextResponse.json({ 
        error: 'Authentication required',
        details: 'You must be logged in to update a product'
      }, { status: 401 });
    }
    
    // Find the product by ID
    const existingProduct = await prisma.product.findUnique({
      where: {
        id: productId
      }
    });
    
    // Check if product exists and belongs to the user
    if (!existingProduct) {
      return NextResponse.json({ 
        error: 'Product not found',
        details: 'The requested product does not exist'
      }, { status: 404 });
    }
    
    if (existingProduct.userId !== userId) {
      return NextResponse.json({ 
        error: 'Unauthorized',
        details: 'You do not have permission to update this product'
      }, { status: 403 });
    }
    
    // Process the form data
    const formData = await request.formData();
    const coverImage = formData.get('coverImage') as File | null;
    
    if (!coverImage) {
      return NextResponse.json({ 
        error: 'Missing cover image',
        details: 'No cover image file was provided'
      }, { status: 400 });
    }
    
    // Process the cover image - using Cloudinary exclusively
    let coverImagePath = null;
    
    // Upload to Cloudinary
    const arrayBuffer = await coverImage.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const folder = `users/${userId}/products/${productId}/cover`;
    
    const result = await uploadToCloudinary(buffer, {
      folder,
      public_id: `cover-${Date.now()}`,
    }) as any;
    
    coverImagePath = result.secure_url;
    
    // Update the product with the new cover image path
    const updatedProduct = await prisma.product.update({
      where: {
        id: productId
      },
      data: {
        coverImagePath
      }
    });
    
    return NextResponse.json({
      message: 'Cover image updated successfully',
      coverImagePath
    });
  } catch (error) {
    console.error('Cover image update error:', error);
    return NextResponse.json({ 
      error: 'Failed to update cover image', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
