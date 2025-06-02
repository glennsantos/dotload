import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserId } from '@/lib/auth-utils';

export async function PUT(
  request: NextRequest
) {
  try {
    // Extract the product ID from the URL path
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const productsIndex = pathParts.indexOf('products');
    const productId = pathParts[productsIndex + 1];
    
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
        id: productId,
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
    
    // Parse the request body
    const formData = await request.formData();
    const isPublic = formData.get('isPublic') === 'true';
    
    // Update the product's publish status
    const updatedProduct = await prisma.product.update({
      where: {
        id: productId
      },
      data: {
        isPublic: isPublic,
        status: isPublic ? 'active' : 'draft'
      },
      include: {
        variations: true,
        files: true
      }
    });
    
    return NextResponse.json({ 
      message: 'Product publish status updated successfully',
      product: updatedProduct
    });
  } catch (error) {
    console.error('Product update error:', error);
    return NextResponse.json({ 
      error: 'Failed to update product', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
