import { NextRequest, NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";
import jwt from 'jsonwebtoken';

// Enable more verbose logging
const DEBUG = true;
const debugLog = (message: string, ...args: any[]) => {
  if (DEBUG) {
    console.log(`[DEBUG] ${message}`, ...args);
    // Also log to stderr for better visibility in Next.js logs
    process.stderr.write(`[DEBUG] ${message} ${args.map(a => JSON.stringify(a)).join(' ')}\n`);
  }
};

export async function GET(req: NextRequest) {
  try {
    debugLog('User status check starting');
    
    // Get token from cookie
    const token = req.cookies.get('token')?.value;
    
    if (!token) {
      debugLog('No authentication token found');
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    // Verify token
    const JWT_SECRET = process.env.JWT_SECRET!.trim();
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string, email: string };
    debugLog('Token verified for user', { userId: decoded.userId, email: decoded.email });
    
    // Get user's product count
    const productCount = await prisma.product.count({
      where: { userId: decoded.userId }
    });
    debugLog('User product count', { userId: decoded.userId, productCount });
    
    // Get user's purchase count
    const purchaseCount = await prisma.purchase.count({
      where: { userId: decoded.userId }
    });
    debugLog('User purchase count', { userId: decoded.userId, purchaseCount });
    
    // Determine recommended redirect
    let recommendedRedirect = '/dashboard';
    
    // If user has purchases but no products, they're primarily a buyer
    if (purchaseCount > 0 && productCount === 0) {
      debugLog('User identified as primarily a buyer, recommending purchases page');
      recommendedRedirect = '/dashboard/purchases';
    }
    
    return NextResponse.json({
      userId: decoded.userId,
      email: decoded.email,
      productCount,
      purchaseCount,
      recommendedRedirect
    });
    
  } catch (error) {
    debugLog('Error checking user status', error);
    console.error('Error checking user status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
