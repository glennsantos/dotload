import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createPurchase } from '@/lib/purchase-utils';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

export async function GET(request: NextRequest) {
  try {
    // Get the authenticated user from JWT token in cookies
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const jwtSecret = process.env.JWT_SECRET || 'your-jwt-secret-key';
    const decoded = jwt.verify(token, jwtSecret) as { userId: string, email: string };

    // Get user's purchases
    const purchases = await prisma.purchase.findMany({
      where: {
        email: decoded.email
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        product: {
          include: {
            files: true
          }
        }
      }
    });

    return NextResponse.json(purchases);
  } catch (error) {
    console.error('Error fetching user purchases:', error);
    return NextResponse.json(
      { error: 'Failed to fetch purchase information' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      productId, 
      email, 
      mobileNumber,
      amount,
      currency = 'PHP',
      paymentMethod = 'pending',
      discountCode,
      discountAmount,
      selectedVariation
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
      mobileNumber: mobileNumber || '', // Make mobileNumber optional
      amount,
      currency,
      paymentMethod, // Use the payment method from the request
    });
    
    return NextResponse.json({
      id: purchase.id,
      accessCode: purchase.accessCode,
      status: purchase.status,
      purchaseId: purchase.id // Add purchaseId for redirect
    });
  } catch (error) {
    console.error('Purchase creation error:', error);
    return NextResponse.json({ 
      error: 'Failed to create purchase', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
