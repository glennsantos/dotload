import { NextRequest, NextResponse } from 'next/server';
import { supabaseProductService } from '@/lib/supabase-db';

type ProductWithDiscountCodes = {
  id: string;
  discountCodes?: string | null;
}

export async function DELETE(
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
    
    // Parse the request body
    const { code } = await request.json();

    // Validate inputs
    if (!code) {
      return NextResponse.json({ 
        error: 'Discount code is required' 
      }, { status: 400 });
    }

    // Fetch the current product using Supabase
    const product = await supabaseProductService.findProductById(productId) as ProductWithDiscountCodes;

    if (!product) {
      return NextResponse.json({ 
        error: 'Product not found' 
      }, { status: 404 });
    }

    // Parse existing discount codes
    let currentDiscountCodes = (product as any).discountCodes 
      ? typeof (product as any).discountCodes === 'string' 
        ? JSON.parse((product as any).discountCodes) 
        : (product as any).discountCodes 
      : [];

    // Remove the specific discount code
    const updatedDiscountCodes = currentDiscountCodes.filter(
      (dc: { code: string }) => dc.code !== code
    );

    // Update the product with the new discount codes using Supabase
    await supabaseProductService.updateProduct(productId, { 
      discountCodes: updatedDiscountCodes ? JSON.stringify(updatedDiscountCodes) : null
    });

    return NextResponse.json({ 
      message: 'Discount code deleted successfully',
      discountCodes: updatedDiscountCodes
    }, { status: 200 });

  } catch (error) {
    console.error('Error deleting discount code:', error);
    
    // Handle specific Supabase errors
    if (error instanceof Error && error.message.includes('Failed to')) {
      return NextResponse.json(
        { error: 'Database error occurred while deleting discount code', details: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ 
      error: 'Failed to delete discount code' 
    }, { status: 500 });
  }
}
