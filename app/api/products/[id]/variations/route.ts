import { NextRequest, NextResponse } from 'next/server';
import { supabaseProductService, supabaseVariationService } from '@/lib/supabase-db';
import { getAuthUserId } from '@/lib/auth-utils';

export async function GET(
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
        details: 'You must be logged in to view product variations'
      }, { status: 401 });
    }

    // Find the product by ID using Supabase
    const product = await supabaseProductService.findProductById(productId);
    
    // Check if product exists and belongs to the user
    if (!product) {
      return NextResponse.json({ 
        error: 'Product not found',
        details: 'The requested product does not exist'
      }, { status: 404 });
    }
    
    if ((product as any).userId !== userId) {
      return NextResponse.json({ 
        error: 'Unauthorized',
        details: 'You do not have permission to view this product'
      }, { status: 403 });
    }
    
    // Get variations for this product using Supabase
    const variations = await supabaseVariationService.getVariationsByProductId(productId);
    
    return NextResponse.json(variations);
  } catch (error) {
    console.error('Fetch variations error:', error);
    
    if (error instanceof Error) {
      // Handle specific Supabase errors
      if (error.message.includes('Failed to')) {
        return NextResponse.json(
          { error: 'Database error occurred. Please try again.' },
          { status: 500 }
        );
      }
    }
    
    return NextResponse.json({ 
      error: 'Failed to fetch variations', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(
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
        details: 'You must be logged in to add variations'
      }, { status: 401 });
    }

    // Find the product by ID using Supabase
    const product = await supabaseProductService.findProductById(productId);
    
    // Check if product exists and belongs to the user
    if (!product) {
      return NextResponse.json({ 
        error: 'Product not found',
        details: 'The requested product does not exist'
      }, { status: 404 });
    }
    
    if ((product as any).userId !== userId) {
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

    // Create the new variation using Supabase
    const newVariation = await supabaseVariationService.createVariation({
      name,
      options,
      productId
    });
    
    return NextResponse.json(newVariation);
  } catch (error) {
    console.error('Create variation error:', error);
    
    if (error instanceof Error) {
      // Handle specific Supabase errors
      if (error.message.includes('Failed to')) {
        return NextResponse.json(
          { error: 'Database error occurred. Please try again.' },
          { status: 500 }
        );
      }
    }
    
    return NextResponse.json({ 
      error: 'Failed to create variation', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
