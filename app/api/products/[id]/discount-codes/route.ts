import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type ProductWithDiscountCodes = {
  id: string;
  discountCodes?: string | null;
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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
      where: { id: params.id }
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
      where: { id: params.id },
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
