import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getPurchaseByAccessCode } from '@/lib/purchase-utils';

export async function GET(request: NextRequest) {
  try {
    // Get access code from query parameters
    const searchParams = request.nextUrl.searchParams;
    const accessCode = searchParams.get('code');
    
    if (!accessCode) {
      return NextResponse.json({ 
        error: 'Missing access code',
        details: 'Access code is required'
      }, { status: 400 });
    }
    
    // Find purchase by access code using utility function
    const purchase = await getPurchaseByAccessCode(accessCode);
    
    if (!purchase) {
      return NextResponse.json({ 
        error: 'Purchase not found',
        details: 'Invalid access code'
      }, { status: 404 });
    }
    
    // Return purchase details
    return NextResponse.json(purchase);
  } catch (error) {
    console.error('Fetch purchase error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch purchase', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
