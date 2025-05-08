import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createPurchase } from '@/lib/purchase-utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      productId, 
      email, 
      mobileNumber,
      amount,
      currency = 'PHP'
    } = body;
    
    if (!productId || !email || !amount) {
      return NextResponse.json({ 
        error: 'Missing required fields',
        details: 'Product ID, email, and amount are required'
      }, { status: 400 });
    }
    
    // Find the product
    const product = await prisma.product.findUnique({
      where: { id: productId }
    });
    
    if (!product) {
      return NextResponse.json({ 
        error: 'Product not found',
        details: 'The requested product does not exist'
      }, { status: 404 });
    }
    
    // Create a purchase record using the utility function
    const purchase = await createPurchase({
      productId,
      email,
      mobileNumber,
      amount,
      currency,
      paymentMethod: 'pending', // Will be updated when payment method is selected
    });
    
    return NextResponse.json({
      id: purchase.id,
      accessCode: purchase.accessCode,
      status: purchase.paymentStatus
    });
  } catch (error) {
    console.error('Purchase creation error:', error);
    return NextResponse.json({ 
      error: 'Failed to create purchase', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
