import { NextRequest, NextResponse } from 'next/server';
import { supabaseFileService, supabasePurchaseService } from '@/lib/supabase-db';
import { join } from 'path';
import { readFile } from 'fs/promises';
import { cwd } from 'process';
import * as fs from 'fs';
import { getAuthToken } from '@/lib/auth-utils';
import { verify } from 'jsonwebtoken';
import { resolveDownloadPath } from '@/lib/download-utils';
import { differenceInDays } from 'date-fns';

// Enable verbose logging for debugging
const DEBUG = true;
const debugLog = (message: string, ...args: any[]) => {
  if (DEBUG) {
    console.log(`[FILE-DL] ${message}`, ...args);
  }
};

/**
 * Download a file based on authentication and authorization
 * GET /api/downloads/file/[id]
 */
export async function GET(request: NextRequest) {
  try {
    // Extract the file ID from the URL path
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const fileId = pathParts[pathParts.indexOf('file') + 1];
    
    if (!fileId) {
      debugLog('Missing file ID in the request');
      return NextResponse.json({ error: 'Missing file ID' }, { status: 400 });
    }
    
    debugLog(`Processing download request for fileId: ${fileId}`);
    
    // Check for both regular auth token and temporary token
    const authToken = await getAuthToken(request);
    const tempToken = request.cookies.get('temp_token')?.value;
    
    // Track if this is a temporary access request
    let isTempAccess = false;
    let tempData: any = null;
    let purchaseId: string | null = null;
    
    // If no regular auth token, check for temp token
    if (!authToken && !tempToken) {
      debugLog('Authentication failed - no token');
      return NextResponse.json({ 
        error: 'Unauthorized - Please log in to download files',
        type: 'unauthorized'
      }, { status: 401 });
    }
    
    // Decode the JWT token (either regular or temporary)
    const secret = process.env.JWT_SECRET || 'your-fallback-secret';
    let decoded: any;
    
    try {
      // Try to decode the token (either regular or temp)
      const tokenToVerify = authToken || tempToken;
      decoded = verify(tokenToVerify as string, secret);
    } catch (err) {
      debugLog('JWT verification failed', err);
      return NextResponse.json({ 
        error: 'Invalid authentication token',
        type: 'invalid_token' 
      }, { status: 401 });
    }
    
    // Check if this is a temporary access token
    if (decoded.tempAccess) {
      debugLog('Using temporary access token');
      isTempAccess = true;
      tempData = decoded;
      purchaseId = decoded.purchaseId;
      
      // For temp access, we'll use a special userId format
      if (!decoded.purchaseId || !decoded.productId) {
        debugLog('Invalid temp token data - missing required fields');
        return NextResponse.json({ error: 'Invalid token data' }, { status: 401 });
      }
    } else if (!decoded.userId) {
      // Regular token must have userId
      debugLog('Invalid token data - missing userId');
      return NextResponse.json({ error: 'Invalid token data' }, { status: 401 });
    }
    
    // Set user info based on token type
    const userId = decoded.userId || `temp_${decoded.purchaseId}`;
    const isAdmin = decoded.role === 'ADMIN';
    
    debugLog(`Authenticated user: ${userId}, isAdmin: ${isAdmin}`);
    debugLog(`Looking up file with ID: ${fileId}`);
    
    // Find the file with product details using Supabase
    const file = await supabaseFileService.findFileById(fileId);
    
    if (!file || !(file as any).product) {
      debugLog(`File not found with ID: ${fileId}`);
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }
    
    // Get product download restrictions
    const downloadLimit = (file as any).product.downloadLimit;
    const linkExpiration = (file as any).product.linkExpiration;
    
    debugLog(`Product download restrictions: limit=${downloadLimit}, expiration=${linkExpiration} days`);
    
    // Verify the user has access to the file
    const isCreator = (file as any).product?.userId === userId;
    
    // If user is not the creator or admin, check if they've purchased the product
    let hasPurchased = false;
    let authorized = false;
    let purchase = null;
    
    // Case 1: User is the owner of the product
    if ((file as any).product.userId === userId) {
      debugLog('User is the product owner - access granted');
      authorized = true;
    }
    // Case 2: User is an admin
    else if (isAdmin) {
      debugLog('User is an admin - access granted');
      authorized = true;
    }
    // Case 3: User has purchased the product
    else {
      // For temporary access tokens, we already have the purchase ID
      if (isTempAccess && purchaseId) {
        purchase = await supabasePurchaseService.findPurchaseById(purchaseId);
        
        if (purchase && (purchase as any).productId === (file as any).product.id && (purchase as any).status === 'completed') {
          debugLog(`Found valid purchase with temp access token: ${(purchase as any).id}`);
          authorized = true;
        }
      } else {
        // For regular users, check if they have a purchase for this product
        const purchases = await supabasePurchaseService.getPurchasesByEmail((userId as any).email || '', {
          status: 'completed'
        });
        
        purchase = purchases.find((p: any) => p.productId === (file as any).product.id && p.userId === userId);
        
        if (purchase) {
          debugLog(`User has purchased this product: ${(purchase as any).id}`);
          authorized = true;
          purchaseId = (purchase as any).id;
        }
      }
    }
    
    if (!authorized) {
      debugLog('User is not authorized to access this file');
      return NextResponse.json({ 
        error: 'You do not have permission to access this file',
        type: 'unauthorized_access' 
      }, { status: 403 });
    }
    
    // If this is a purchase-based download (not owner or admin), check restrictions
    if (authorized && purchase && !isAdmin && (file as any).product.userId !== userId) {
      // 1. Check download limit
      const downloadHistory = await supabaseFileService.getDownloadHistory(fileId);
      const previousDownloads = downloadHistory.filter((dl: any) => dl.purchaseId === (purchase as any).id).length;
      
      debugLog(`Previous downloads for this purchase: ${previousDownloads}/${downloadLimit}`);
      
      if (previousDownloads >= downloadLimit) {
        debugLog('Download limit exceeded');
        return NextResponse.json({
          error: 'Download limit exceeded',
          type: 'limit_exceeded',
          limit: downloadLimit,
          downloads: previousDownloads
        }, { status: 403 });
      }
      
      // 2. Check link expiration
      const purchaseDate = new Date((purchase as any).createdAt);
      const currentDate = new Date();
      const daysSincePurchase = differenceInDays(currentDate, purchaseDate);
      
      debugLog(`Days since purchase: ${daysSincePurchase}/${linkExpiration}`);
      
      if (daysSincePurchase > linkExpiration) {
        debugLog('Download link expired');
        return NextResponse.json({
          error: 'Download link expired',
          type: 'link_expired',
          expirationDays: linkExpiration,
          daysSincePurchase: daysSincePurchase
        }, { status: 403 });
      }
    }
    
    debugLog(`Access granted - user ${userId} has permission to download file ${fileId}`);
    debugLog(`User access type: ${isCreator ? 'Creator' : isAdmin ? 'Admin' : 'Purchaser'}`);
    
    // Get the file path
    const filePath = (file as any).path;
    debugLog(`File path from database: ${filePath}`);
    
    // If the path is a URL, redirect to it
    if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
      debugLog(`File is a URL, redirecting to: ${filePath}`);
      return NextResponse.redirect(filePath);
    }
    
    // Try to resolve the file path
    const resolvedFile = await resolveDownloadPath(filePath);
    
    if (!resolvedFile.exists) {
      debugLog(`File not found at path: ${filePath}`);
      if (resolvedFile.alternativePaths) {
        debugLog(`Tried alternative paths: ${resolvedFile.alternativePaths.join(', ')}`);
      }
      return NextResponse.json({ 
        error: 'File not found',
        details: 'The file could not be found on the server'
      }, { status: 404 });
    }
    
    const absoluteFilePath = resolvedFile.path;
    debugLog(`Resolved file path: ${absoluteFilePath}`);
    
    try {
      // Read the file
      const fileBuffer = await readFile(absoluteFilePath);
      debugLog(`Successfully read file, size: ${fileBuffer.length} bytes`);
      
      // Get the filename
      const fileName = (file as any).filename || absoluteFilePath.split('/').pop() || 'download';
      
      // Determine content type
      const extension = fileName.split('.').pop()?.toLowerCase();
      let contentType = 'application/octet-stream'; // Default
      
      // Set content type based on file extension
      switch (extension) {
        case 'pdf': contentType = 'application/pdf'; break;
        case 'jpg': case 'jpeg': contentType = 'image/jpeg'; break;
        case 'png': contentType = 'image/png'; break;
        case 'gif': contentType = 'image/gif'; break;
        case 'mp3': contentType = 'audio/mpeg'; break;
        case 'mp4': contentType = 'video/mp4'; break;
        case 'zip': contentType = 'application/zip'; break;
        case 'txt': contentType = 'text/plain'; break;
        case 'doc': case 'docx': contentType = 'application/msword'; break;
        case 'xls': case 'xlsx': contentType = 'application/vnd.ms-excel'; break;
        case 'ppt': case 'pptx': contentType = 'application/vnd.ms-powerpoint'; break;
      }
      
      // Determine if this should be inline or attachment
      // For PDFs and images, we can display them inline in the browser
      const disposition = ['pdf', 'jpg', 'jpeg', 'png', 'gif'].includes(extension || '')
        ? 'inline'
        : 'attachment';
      
      // Create response with appropriate headers
      const response = new NextResponse(fileBuffer, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `${disposition}; filename="${encodeURIComponent(fileName)}"`,
          'Content-Length': fileBuffer.length.toString(),
        },
      });
      
      debugLog(`Serving file: ${fileName}, type: ${contentType}, disposition: ${disposition}, size: ${fileBuffer.length} bytes`);
      
      // Log the download for analytics using Supabase
      try {
        const downloadLog = await supabaseFileService.createFileDownload({
          fileId: fileId,
          userId: isTempAccess ? null : userId,
          purchaseId: purchaseId,
          downloadedAt: new Date().toISOString(),
          userAgent: request.headers.get('user-agent') || 'unknown',
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
          metadata: isTempAccess ? JSON.stringify({
            tempAccess: true,
            email: tempData.email,
            productId: tempData.productId
          }) : null
        });
        
        debugLog(`Logged download for analytics, id: ${(downloadLog as any).id}`);
      } catch (logError) {
        // Don't fail the download if logging fails
        debugLog(`Failed to log download: ${logError instanceof Error ? logError.message : String(logError)}`);
      }
      
      return response;
    } catch (fileError) {
      debugLog(`Error reading file: ${fileError instanceof Error ? fileError.message : String(fileError)}`);
      return NextResponse.json({ 
        error: 'File not found',
        details: 'The file could not be read from the server'
      }, { status: 404 });
    }
  } catch (error) {
    debugLog(`Unexpected error: ${error instanceof Error ? error.message : String(error)}`);
    
    if (error instanceof Error) {
      // Handle specific Supabase errors
      if (error.message.includes('Failed to')) {
        return NextResponse.json(
          { error: 'Database error occurred. Please try again.' },
          { status: 500 }
        );
      }
    }
    
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
