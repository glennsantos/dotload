import { NextRequest, NextResponse } from 'next/server';
import { supabaseFileService, supabasePurchaseService } from '@/lib/supabase-db';
import { getAuthToken } from '@/lib/auth-utils';
import { verify } from 'jsonwebtoken';
import crypto from 'crypto';

// Enable verbose logging for debugging
const DEBUG = true;
const debugLog = (message: string, ...args: any[]) => {
  if (DEBUG) {
    console.log(`[SECURE-DL-GEN] ${message}`, ...args);
  }
};

/**
 * Generate a secure download token
 * This uses a dedicated secret and includes multiple security factors
 */
function generateDownloadToken(fileId: string, userId: string): string {
  // Use a dedicated download secret if available, otherwise fall back to JWT_SECRET
  const secret = process.env.DOWNLOAD_SECRET || process.env.JWT_SECRET || 'secure-download-secret';
  
  // Generate a random nonce for additional security
  const nonce = crypto.randomBytes(16).toString('hex');
  
  // Current timestamp for token expiration
  const timestamp = Date.now();
  
  // Combine all data for token generation
  const data = `${fileId}:${userId}:${timestamp}:${nonce}:${process.env.NEXTAUTH_URL || ''}`;
  
  // Generate HMAC for the data
  const hmac = crypto.createHmac('sha256', secret).update(data).digest('hex');
  
  // Combine all parts into a token
  return `${hmac}.${nonce}.${timestamp}`;
}

export async function POST(request: NextRequest) {
  try {
    debugLog('Processing secure download URL generation request');
    
    // Verify user is authenticated
    const authToken = await getAuthToken(request);
    
    if (!authToken) {
      debugLog('Authentication failed - no token');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Decode the JWT token
    const secret = process.env.JWT_SECRET || 'your-fallback-secret';
    let decoded: any;
    
    try {
      decoded = verify(authToken, secret) as { userId: string; role?: string };
    } catch (err) {
      debugLog('JWT verification failed', err);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    if (!decoded || !decoded.userId) {
      debugLog('Invalid token data - missing userId');
      return NextResponse.json({ error: 'Invalid token data' }, { status: 401 });
    }
    
    // Get file ID and name from request body
    const body = await request.json();
    const { fileId, fileName } = body;
    
    if (!fileId) {
      debugLog('Missing fileId in request');
      return NextResponse.json({ error: 'File ID is required' }, { status: 400 });
    }
    
    debugLog(`Looking up file with ID: ${fileId}`);
    
    // Find the file using Supabase
    const file = await supabaseFileService.findFileById(fileId);
    
    if (!file) {
      debugLog(`File not found with ID: ${fileId}`);
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }
    
    // Get product information for file access verification
    const productId = (file as any).productId;
    if (!productId) {
      debugLog(`File ${fileId} has no associated product`);
      return NextResponse.json({ error: 'File access error' }, { status: 403 });
    }
    
    // Verify the user has access to the file
    const userId = decoded.userId;
    const isCreator = (file as any).product?.userId === userId;
    const isAdmin = decoded.role === 'ADMIN';
    
    // If user is not the creator or admin, check if they've purchased the product
    let hasPurchased = false;
    
    if (!isCreator && !isAdmin && productId) {
      const purchases = await supabasePurchaseService.findPurchasesByUserId(userId);
      hasPurchased = purchases.some((purchase: any) => 
        purchase.productId === productId && purchase.status === 'COMPLETED'
      );
    }
    
    if (!isCreator && !isAdmin && !hasPurchased) {
      debugLog(`Access denied - user ${userId} does not have access to file ${fileId}`);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    // Generate a secure token
    const token = generateDownloadToken(fileId, userId);
    
    // Create a secure download URL with the original filename in the URL
    const downloadUrl = `/api/downloads/secure/${fileId}?token=${encodeURIComponent(token)}&userId=${userId}&filename=${encodeURIComponent(fileName || (file as any).filename)}`;
    
    debugLog(`Generated download URL: ${downloadUrl}`);
    return NextResponse.json({ url: downloadUrl });
  } catch (error) {
    console.error('Error generating secure download URL:', error);
    
    // Handle specific Supabase errors
    if (error instanceof Error && error.message.includes('Failed to')) {
      return NextResponse.json(
        { error: 'Database error occurred while generating download URL', details: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ 
      error: 'Failed to generate download URL', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
