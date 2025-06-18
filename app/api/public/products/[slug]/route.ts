import { NextRequest, NextResponse } from 'next/server';
import { supabaseProductService } from '@/lib/supabase-db';

export async function GET(
  request: NextRequest
) {
  try {
    // Extract the slug from the URL path
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const slug = pathParts[pathParts.length - 1];
    
    if (!slug) {
      return NextResponse.json({ 
        error: 'Missing product slug',
        details: 'Product slug is required'
      }, { status: 400 });
    }
    
    // Find the product by slug using Supabase
    let product = await supabaseProductService.findProductBySlug(slug);
    
    // If not found by slug, try by ID
    if (!product) {
      product = await supabaseProductService.findProductById(slug);
    }
    
    // Check if product exists
    if (!product) {
      return NextResponse.json({ 
        error: 'Product not found',
        details: 'The requested product does not exist'
      }, { status: 404 });
    }
    
    // Return the product details (without sensitive information)
    return NextResponse.json({
      id: (product as any).id,
      name: (product as any).name,
      slug: (product as any).slug,
      type: (product as any).type,
      price: (product as any).price,
      currency: (product as any).currency,
      description: (product as any).description,
      coverImagePath: (product as any).coverImagePath,
      allowPayWhatYouWant: (product as any).allowPayWhatYouWant,
      offerCoupons: (product as any).offerCoupons,
      // Handle discountCodes safely with type checking
      discountCodes: (product as any).discountCodes || null,
      variations: (product as any).variations?.map((variation: any) => ({
        id: variation.id,
        name: variation.name,
        options: variation.options
      })) || [],
      createdAt: (product as any).createdAt,
      updatedAt: (product as any).updatedAt
    });
  } catch (error) {
    console.error('Fetch public product error:', error);
    
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
      error: 'Failed to fetch product', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
