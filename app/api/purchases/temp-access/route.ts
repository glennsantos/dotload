import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

/**
 * Generate a temporary access token for a purchase
 * This allows non-logged-in users to access their purchased content
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { accessCode } = body;
    
    if (!accessCode) {
      return NextResponse.json({ error: 'Access code is required' }, { status: 400 });
    }
    
    console.log(`[TEMP-ACCESS] Creating temporary access for code: ${accessCode}`);
    
    // Find the purchase by access code
    const purchase = await prisma.purchase.findUnique({
      where: { accessCode },
      include: {
        product: {
          include: {
            files: true
          }
        }
      }
    });
    
    if (!purchase) {
      console.log(`[TEMP-ACCESS] Purchase not found for code: ${accessCode}`);
      return NextResponse.json({ error: 'Purchase not found' }, { status: 404 });
    }
    
    // Verify purchase is completed
    if (purchase.status !== 'COMPLETED' && purchase.status !== 'completed') {
      console.log(`[TEMP-ACCESS] Purchase status is not completed: ${purchase.status}`);
      return NextResponse.json({ 
        error: 'Purchase not completed',
        status: purchase.status
      }, { status: 400 });
    }
    
    // Create a temporary JWT token with limited permissions
    // This token only grants access to files from this specific purchase
    const jwtSecret = process.env.JWT_SECRET || 'your-jwt-secret-key';
    const token = jwt.sign({
      tempAccess: true,
      purchaseId: purchase.id,
      productId: purchase.productId,
      email: purchase.email,
      // Limit token validity to 24 hours
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60)
    }, jwtSecret);
    
    // Set the token as a cookie
    // Define file interface to fix TypeScript error
    interface FileData {
      id: string;
      filename: string;
      path: string;
      size?: number;
      mimetype?: string;
    }
    
    const response = NextResponse.json({
      success: true,
      purchaseId: purchase.id,
      productName: purchase.product?.name,
      files: purchase.product?.files.map((file: FileData) => ({
        id: file.id,
        filename: file.filename,
        size: file.size
      })) || []
    });
    
    // Add the token cookie to the response
    response.cookies.set('temp_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/'
    });
    
    // Extract file information for the response
    const files = purchase.product?.files || [];
    
    console.log(`[TEMP-ACCESS] Created temporary access for purchase ${purchase.id} with ${files.length} files`);
    
    return response;
  } catch (error) {
    console.error('Error creating temporary access:', error);
    return NextResponse.json({ 
      error: 'Failed to create temporary access', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
