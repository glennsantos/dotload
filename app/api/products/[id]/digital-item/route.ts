import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserId } from '@/lib/auth-utils';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { isAllowedDigitalFile } from '@/lib/file-validation';

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
        details: 'You must be logged in to upload a digital item'
      }, { status: 401 });
    }
    
    // Check if product exists and belongs to the current user
    const product = await prisma.product.findUnique({
      where: { id: productId }
    });
    
    if (!product) {
      return NextResponse.json({ 
        error: 'Product not found' 
      }, { status: 404 });
    }
    
    // Verify that the product belongs to the current user
    if (product.userId !== userId) {
      return NextResponse.json({ 
        error: 'Unauthorized',
        details: 'You do not have permission to modify this product'
      }, { status: 403 });
    }
    
    const formData = await request.formData();
    const digitalItem = formData.get('digitalItem') as File | null;
    
    if (!digitalItem) {
      return NextResponse.json({ 
        error: 'No digital item provided' 
      }, { status: 400 });
    }
    
    // Validate file type
    if (!isAllowedDigitalFile(digitalItem.name, digitalItem.type)) {
      return NextResponse.json({
        error: 'Invalid file type',
        details: `File "${digitalItem.name}" is not an allowed file type. Please upload only supported file formats.`
      }, { status: 400 });
    }
    
    // Process digital item - using Cloudinary exclusively
    const arrayBuffer = await digitalItem.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const folder = `users/${userId}/products/${productId}/digital-items`;
    
    const result = await uploadToCloudinary(buffer, {
      folder,
      public_id: `${digitalItem.name.split('.')[0]}-${Date.now()}`,
      resource_type: 'raw'
    }) as any;
    
    const digitalItemPath = result.secure_url;
    
    // Update product with digital item path
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: {
        digitalItemPath
      },
      include: {
        files: true,
        variations: true
      }
    });
    
    return NextResponse.json({
      message: 'Digital item uploaded successfully',
      product: updatedProduct
    }, { status: 200 });
  } catch (error) {
    console.error('Digital item upload error:', error);
    return NextResponse.json({ 
      error: 'Failed to upload digital item', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
