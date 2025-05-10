import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserId } from '@/lib/auth-utils';

export async function GET(
  request: NextRequest
) {
  try {
    // Extract the product ID and variation ID from the URL path
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const productsIndex = pathParts.indexOf('products');
    const productId = pathParts[productsIndex + 1];
    const variationId = pathParts[pathParts.indexOf('variations') + 1];
    
    if (!productId || !variationId) {
      return NextResponse.json({ 
        error: 'Missing required IDs',
        details: 'Product ID and Variation ID are required'
      }, { status: 400 });
    }
    
    // Get the current authenticated user's ID
    const userId = await getAuthUserId();
    
    // If no authenticated user, return error
    if (!userId) {
      return NextResponse.json({ 
        error: 'Authentication required',
        details: 'You must be logged in to view variation details'
      }, { status: 401 });
    }

    // Find the product by ID
    const product = await prisma.product.findUnique({
      where: {
        id: productId,
      }
    });
    
    // Check if product exists and belongs to the user
    if (!product) {
      return NextResponse.json({ 
        error: 'Product not found',
        details: 'The requested product does not exist'
      }, { status: 404 });
    }
    
    if (product.userId !== userId) {
      return NextResponse.json({ 
        error: 'Unauthorized',
        details: 'You do not have permission to view this product'
      }, { status: 403 });
    }
    
    // Find the variation
    const variation = await prisma.variation.findUnique({
      where: {
        id: variationId
      }
    });
    
    if (!variation || variation.productId !== productId) {
      return NextResponse.json({ 
        error: 'Variation not found',
        details: 'The requested variation does not exist'
      }, { status: 404 });
    }
    
    return NextResponse.json(variation);
  } catch (error) {
    console.error('Fetch variation error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch variation', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest
) {
  try {
    // Extract the product ID and variation ID from the URL path
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const productsIndex = pathParts.indexOf('products');
    const productId = pathParts[productsIndex + 1];
    const variationId = pathParts[pathParts.indexOf('variations') + 1];
    
    if (!productId || !variationId) {
      return NextResponse.json({ 
        error: 'Missing required IDs',
        details: 'Product ID and Variation ID are required'
      }, { status: 400 });
    }
    
    // Get the current authenticated user's ID
    const userId = await getAuthUserId();
    
    // If no authenticated user, return error
    if (!userId) {
      return NextResponse.json({ 
        error: 'Authentication required',
        details: 'You must be logged in to update variations'
      }, { status: 401 });
    }

    // Find the product by ID
    const product = await prisma.product.findUnique({
      where: {
        id: productId,
      }
    });
    
    // Check if product exists and belongs to the user
    if (!product) {
      return NextResponse.json({ 
        error: 'Product not found',
        details: 'The requested product does not exist'
      }, { status: 404 });
    }
    
    if (product.userId !== userId) {
      return NextResponse.json({ 
        error: 'Unauthorized',
        details: 'You do not have permission to modify this product'
      }, { status: 403 });
    }
    
    // Find the variation
    const variation = await prisma.variation.findUnique({
      where: {
        id: variationId
      }
    });
    
    if (!variation || variation.productId !== productId) {
      return NextResponse.json({ 
        error: 'Variation not found',
        details: 'The requested variation does not exist'
      }, { status: 404 });
    }

    // Parse the request body
    const { name, options } = await request.json();
    
    // Validate required fields
    if (!name || !options) {
      return NextResponse.json({ 
        error: 'Missing required fields',
        details: 'Variation name and options are required'
      }, { status: 400 });
    }

    // Update the variation
    const updatedVariation = await prisma.variation.update({
      where: {
        id: variationId
      },
      data: {
        name,
        options
      }
    });
    
    return NextResponse.json(updatedVariation);
  } catch (error) {
    console.error('Update variation error:', error);
    return NextResponse.json({ 
      error: 'Failed to update variation', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest
) {
  try {
    // Extract the product ID and variation ID from the URL path
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const productsIndex = pathParts.indexOf('products');
    const productId = pathParts[productsIndex + 1];
    const variationId = pathParts[pathParts.indexOf('variations') + 1];
    
    if (!productId || !variationId) {
      return NextResponse.json({ 
        error: 'Missing required IDs',
        details: 'Product ID and Variation ID are required'
      }, { status: 400 });
    }
    
    // Get the current authenticated user's ID
    const userId = await getAuthUserId();
    
    // If no authenticated user, return error
    if (!userId) {
      return NextResponse.json({ 
        error: 'Authentication required',
        details: 'You must be logged in to delete variations'
      }, { status: 401 });
    }

    // Find the product by ID
    const product = await prisma.product.findUnique({
      where: {
        id: productId,
      }
    });
    
    // Check if product exists and belongs to the user
    if (!product) {
      return NextResponse.json({ 
        error: 'Product not found',
        details: 'The requested product does not exist'
      }, { status: 404 });
    }
    
    if (product.userId !== userId) {
      return NextResponse.json({ 
        error: 'Unauthorized',
        details: 'You do not have permission to modify this product'
      }, { status: 403 });
    }
    
    // Find the variation
    const variation = await prisma.variation.findUnique({
      where: {
        id: variationId
      }
    });
    
    if (!variation || variation.productId !== productId) {
      return NextResponse.json({ 
        error: 'Variation not found',
        details: 'The requested variation does not exist'
      }, { status: 404 });
    }

    // Delete the variation
    await prisma.variation.delete({
      where: {
        id: variationId
      }
    });
    
    return NextResponse.json({
      message: 'Variation deleted successfully'
    });
  } catch (error) {
    console.error('Delete variation error:', error);
    return NextResponse.json({ 
      error: 'Failed to delete variation', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
