import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserId } from '@/lib/auth-utils';

export async function DELETE(
  request: NextRequest
) {
  try {
    // Extract the product ID and file ID from the URL path
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const productsIndex = pathParts.indexOf('products');
    const productId = pathParts[productsIndex + 1];
    const fileId = pathParts[pathParts.indexOf('files') + 1];
    
    if (!productId || !fileId) {
      return NextResponse.json({ 
        error: 'Missing required IDs',
        details: 'Product ID and File ID are required'
      }, { status: 400 });
    }
    
    // Get the current authenticated user's ID
    const userId = await getAuthUserId();
    
    // If no authenticated user, return error
    if (!userId) {
      return NextResponse.json({ 
        error: 'Authentication required',
        details: 'You must be logged in to delete files'
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
    
    // Check if file exists and belongs to the product
    const file = await prisma.file.findUnique({
      where: { 
        id: fileId,
        productId
      }
    });
    
    if (!file) {
      return NextResponse.json({ 
        error: 'File not found or does not belong to this product' 
      }, { status: 404 });
    }
    
    // Delete the file record
    await prisma.file.delete({
      where: { id: fileId }
    });
    
    return NextResponse.json({
      message: 'File deleted successfully'
    }, { status: 200 });
  } catch (error) {
    console.error('File deletion error:', error);
    return NextResponse.json({ 
      error: 'Failed to delete file', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
