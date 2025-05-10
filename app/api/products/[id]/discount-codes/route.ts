import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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

    // Fetch the current product
    const product = await prisma.product.findUnique({
      where: { id: productId }
    }) as ProductWithDiscountCodes;

    if (!product) {
      return NextResponse.json({ 
        error: 'Product not found' 
      }, { status: 404 });
    }

    // Parse existing discount codes
    let currentDiscountCodes = product.discountCodes 
      ? typeof product.discountCodes === 'string' 
        ? JSON.parse(product.discountCodes) 
        : product.discountCodes 
      : [];

    // Remove the specific discount code
    const updatedDiscountCodes = currentDiscountCodes.filter(
      (dc: { code: string }) => dc.code !== code
    );

    // Update the product with the new discount codes
    await prisma.product.update({
      where: { id: productId },
      data: { 
        discountCodes: updatedDiscountCodes ? JSON.stringify(updatedDiscountCodes) : null
      } as any
    });

    return NextResponse.json({ 
      message: 'Discount code deleted successfully',
      discountCodes: updatedDiscountCodes
    }, { status: 200 });

  } catch (error) {
    console.error('Error deleting discount code:', error);
    return NextResponse.json({ 
      error: 'Failed to delete discount code' 
    }, { status: 500 });
  }
}
