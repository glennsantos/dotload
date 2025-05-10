import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
    
    // Find the product by ID or slug
    const product = await prisma.product.findFirst({
      where: {
        OR: [
          { id: slug },
          { slug: slug }
        ]
      },
      include: {
        variations: true,
        files: true
      }
    });
    
    // Check if product exists
    if (!product) {
      return NextResponse.json({ 
        error: 'Product not found',
        details: 'The requested product does not exist'
      }, { status: 404 });
    }
    
    // Return the product details (without sensitive information)
    return NextResponse.json({
      id: product.id,
      name: product.name,
      slug: product.slug,
      type: product.type,
      price: product.price,
      currency: product.currency,
      description: product.description,
      coverImagePath: product.coverImagePath,
      allowPayWhatYouWant: product.allowPayWhatYouWant,
      offerCoupons: product.offerCoupons,
      // Handle discountCodes safely with type checking
      discountCodes: 'discountCodes' in product ? product.discountCodes : null,
      variations: product.variations.map(variation => ({
        id: variation.id,
        name: variation.name,
        options: variation.options
      })),
      createdAt: product.createdAt,
      updatedAt: product.updatedAt
    });
  } catch (error) {
    console.error('Fetch public product error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch product', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
