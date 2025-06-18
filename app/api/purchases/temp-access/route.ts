import { NextRequest, NextResponse } from 'next/server';
import { supabasePurchaseService, supabaseFileService } from '@/lib/supabase-db';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { differenceInDays } from 'date-fns';

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
    
    // Find the purchase by access code using Supabase
    const purchase = await supabasePurchaseService.findPurchaseByAccessCode(accessCode);
    
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
    
    // Define download restriction interface
    interface DownloadRestriction {
      type: 'limit_exceeded' | 'link_expired' | 'unauthorized_access' | null;
      message: string;
    }
    
    // Check download restrictions for each file
    const filesWithRestrictions = await Promise.all((purchase.product?.files || []).map(async (file: FileData) => {
      // Get product download restrictions
      const downloadLimit = purchase.product?.downloadLimit || 10;
      const linkExpiration = purchase.product?.linkExpiration || 30;
      
      // Check download limit using Supabase
      const previousDownloads = await supabaseFileService.countFileDownloads(purchase.id, file.id);
      
      // Check link expiration
      const purchaseDate = purchase.createdAt;
      const currentDate = new Date();
      const daysSincePurchase = differenceInDays(currentDate, purchaseDate);
      
      // Determine if there are any restrictions
      let downloadRestriction: DownloadRestriction | undefined;
      
      if (previousDownloads >= downloadLimit) {
        downloadRestriction = {
          type: 'limit_exceeded',
          message: `Download limit reached (${previousDownloads}/${downloadLimit})`
        };
      } else if (daysSincePurchase > linkExpiration) {
        downloadRestriction = {
          type: 'link_expired',
          message: `Download link expired after ${linkExpiration} days`
        };
      }
      
      return {
        id: file.id,
        filename: file.filename,
        size: file.size,
        downloadRestriction
      };
    }));
    
    const response = NextResponse.json({
      success: true,
      purchaseId: purchase.id,
      productName: purchase.product?.name,
      files: filesWithRestrictions
    });
    
    // Add the token cookie to the response
    response.cookies.set('temp_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/'
    });
    
    // Log information about the response
    const restrictedFiles = filesWithRestrictions.filter(f => f.downloadRestriction).length;
    console.log(`[TEMP-ACCESS] Created temporary access for purchase ${purchase.id} with ${filesWithRestrictions.length} files (${restrictedFiles} restricted)`);
    
    return response;
  } catch (error) {
    console.error('Error creating temporary access:', error);
    return NextResponse.json({ 
      error: 'Failed to create temporary access', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
