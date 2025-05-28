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

    // Get pagination parameters from query string
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;
    const status = searchParams.get('status') || undefined;

    // Build the where clause
    const where: any = {
      email: decoded.email
    };

    // Add status filter if provided
    if (status && status !== 'all') {
      where.status = status;
    }

    // Get total count for pagination
    const totalCount = await prisma.purchase.count({ where });

    // Get user's purchases with pagination
    const purchases = await prisma.purchase.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            description: true,
            price: true
          }
        }
      },
      skip,
      take: limit
    });

    return NextResponse.json({
      purchases,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      }
    });
  } catch (error) {
    console.error('Error fetching user purchases:', error);
    
    // More detailed error logging
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      // Handle specific JWT errors
      if (error.name === 'JsonWebTokenError') {
        return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 });
      }
      
      // Handle specific database errors
      if (error.message.includes('relation') && error.message.includes('does not exist')) {
        return NextResponse.json(
          { error: 'Database table does not exist. Please run migrations.' },
          { status: 500 }
        );
      }
    }
    
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
