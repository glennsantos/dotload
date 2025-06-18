import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { supabasePurchaseService } from '@/lib/supabase-db';

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

    // Get the payment ID from query parameters
    const searchParams = request.nextUrl.searchParams;
    const paymentId = searchParams.get('paymentId');
    const purchaseId = searchParams.get('purchaseId');
    
    if (!paymentId && !purchaseId) {
      return NextResponse.json({ 
        error: 'Missing required parameter', 
        details: 'Either paymentId or purchaseId is required' 
      }, { status: 400 });
    }
    
    let purchase;
    
    // Find purchase by payment ID or purchase ID using Supabase
    if (paymentId) {
      purchase = await supabasePurchaseService.findPurchaseByPaymentId(paymentId);
    } else if (purchaseId) {
      purchase = await supabasePurchaseService.findPurchaseById(purchaseId);
    }
    
    if (!purchase) {
      return NextResponse.json({ 
        error: 'Payment not found',
        details: 'No payment found with the provided ID'
      }, { status: 404 });
    }
    
    // Check if the purchase belongs to the authenticated user (by email)
    if (purchase.email !== decoded.email) {
      return NextResponse.json({ 
        error: 'Access denied',
        details: 'You do not have permission to view this payment'
      }, { status: 403 });
    }
    
    // Return payment status
    return NextResponse.json({
      id: purchase.id,
      paymentId: purchase.paymentId,
      status: purchase.status,
      amount: purchase.amount,
      currency: purchase.currency,
      email: purchase.email,
      createdAt: purchase.createdAt,
      updatedAt: purchase.updatedAt,
      accessCode: purchase.accessCode,
      product: purchase.product ? {
        id: purchase.product.id,
        name: purchase.product.name,
        type: purchase.product.type
      } : null
    });
    
  } catch (error) {
    console.error('Error fetching payment status:', error);
    
    if (error instanceof Error) {
      // Handle JWT errors
      if (error.name === 'JsonWebTokenError') {
        return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 });
      }
      
      // Handle Supabase errors
      if (error.message.includes('Failed to')) {
        return NextResponse.json(
          { error: 'Database error occurred. Please try again.' },
          { status: 500 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch payment status' },
      { status: 500 }
    );
  }
}
