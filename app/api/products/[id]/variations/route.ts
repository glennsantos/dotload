import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserId } from '@/lib/auth-utils';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const productId = id;
    
    // Get the current authenticated user's ID
    const userId = await getAuthUserId();
    
    // If no authenticated user, return error
    if (!userId) {
      return NextResponse.json({ 
        error: 'Authentication required',
        details: 'You must be logged in to view product variations'
      }, { status: 401 });
    }

    // Find the product by ID
    const product = await prisma.product.findUnique({
      where: {
        id: productId,
      },
      include: {
        variations: true
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
    
    return NextResponse.json(product.variations);
  } catch (error) {
    console.error('Fetch variations error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch variations', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const productId = id;
    
    // Get the current authenticated user's ID
    const userId = await getAuthUserId();
    
    // If no authenticated user, return error
    if (!userId) {
      return NextResponse.json({ 
        error: 'Authentication required',
        details: 'You must be logged in to add variations'
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

    // Parse the request body
    const { name, options } = await request.json();
    
    // Validate required fields
    if (!name || !options) {
      return NextResponse.json({ 
        error: 'Missing required fields',
        details: 'Variation name and options are required'
      }, { status: 400 });
    }

    // Create the new variation
    const newVariation = await prisma.variation.create({
      data: {
        name,
        options,
        productId
      }
    });
    
    return NextResponse.json(newVariation);
  } catch (error) {
    console.error('Create variation error:', error);
    return NextResponse.json({ 
      error: 'Failed to create variation', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
