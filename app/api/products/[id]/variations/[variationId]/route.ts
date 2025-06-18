import { NextRequest, NextResponse } from 'next/server';
import { supabaseProductService, supabaseVariationService } from '@/lib/supabase-db';
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
    
    // Find the variation using Supabase
    const variation = await supabaseVariationService.findVariationById(variationId);
    
    if (!variation || (variation as any).productId !== productId) {
      return NextResponse.json({ 
        error: 'Variation not found',
        details: 'The requested variation does not exist'
      }, { status: 404 });
    }
    
    return NextResponse.json(variation);
  } catch (error) {
    console.error('Fetch variation error:', error);
    
    // Handle specific Supabase errors
    if (error instanceof Error && error.message.includes('Failed to')) {
      return NextResponse.json(
        { error: 'Database error occurred while fetching variation', details: error.message },
        { status: 500 }
      );
    }
    
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
    
    // Find the variation using Supabase
    const variation = await supabaseVariationService.findVariationById(variationId);
    
    if (!variation || (variation as any).productId !== productId) {
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

    // Update the variation using Supabase
    const updatedVariation = await supabaseVariationService.updateVariation(variationId, {
      name,
      options
    });
    
    return NextResponse.json(updatedVariation);
  } catch (error) {
    console.error('Update variation error:', error);
    
    // Handle specific Supabase errors
    if (error instanceof Error && error.message.includes('Failed to')) {
      return NextResponse.json(
        { error: 'Database error occurred while updating variation', details: error.message },
        { status: 500 }
      );
    }
    
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
    
    // Find the variation using Supabase
    const variation = await supabaseVariationService.findVariationById(variationId);
    
    if (!variation || (variation as any).productId !== productId) {
      return NextResponse.json({ 
        error: 'Variation not found',
        details: 'The requested variation does not exist'
      }, { status: 404 });
    }

    // Delete the variation using Supabase
    await supabaseVariationService.deleteVariation(variationId);
    
    return NextResponse.json({
      message: 'Variation deleted successfully'
    });
  } catch (error) {
    console.error('Delete variation error:', error);
    
    // Handle specific Supabase errors
    if (error instanceof Error && error.message.includes('Failed to')) {
      return NextResponse.json(
        { error: 'Database error occurred while deleting variation', details: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ 
      error: 'Failed to delete variation', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
