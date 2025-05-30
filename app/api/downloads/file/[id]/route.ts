import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { join } from 'path';
import { readFile } from 'fs/promises';
import { cwd } from 'process';
import * as fs from 'fs';
import { getAuthToken } from '@/lib/auth-utils';
import { verify } from 'jsonwebtoken';
import { resolveDownloadPath } from '@/lib/download-utils';

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
      return NextResponse.json({ error: 'Unauthorized - Please log in to download files' }, { status: 401 });
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
      return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 });
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
      
      // If this is a temporary access, check if this purchase already has a download
      // Only one download is allowed per purchase with temporary access
      if (purchaseId) {
        const previousDownloads = await prisma.fileDownload.findFirst({
          where: {
            purchaseId: purchaseId,
            fileId: fileId
          }
        });
        
        // If there's already a download for this purchase, redirect to register
        if (previousDownloads) {
          debugLog(`Previous download found for purchase ${purchaseId}, redirecting to register`);
          // Redirect to register page with email pre-filled
          const registerUrl = `/register?email=${encodeURIComponent(decoded.email || '')}&redirectAfter=true`;
          return NextResponse.redirect(new URL(registerUrl, request.url));
        }
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
    
    // Find the file
    const file = await prisma.file.findUnique({
      where: { id: fileId },
      include: { 
        product: {
          include: {
            user: true
          }
        }
      }
    });
    
    if (!file) {
      debugLog(`File not found with ID: ${fileId}`);
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }
    
    // Verify the user has access to the file
    const isCreator = file.product?.userId === userId;
    
    // If user is not the creator or admin, check if they've purchased the product
    let hasPurchased = false;
    
    if (isTempAccess) {
      // For temporary access, verify the file belongs to the purchase/product in the token
      hasPurchased = tempData.productId === file.productId;
      debugLog(`Temp access check: token productId=${tempData.productId}, file productId=${file.productId}, match=${hasPurchased}`);
    } else if (!isCreator && !isAdmin && file.productId) {
      // For regular users, check the database
      const purchase = await prisma.purchase.findFirst({
        where: {
          userId: userId,
          productId: file.productId,
          status: 'COMPLETED'
        }
      });
      
      hasPurchased = !!purchase;
    }
    
    if (!isCreator && !isAdmin && !hasPurchased) {
      debugLog(`Access denied - user ${userId} does not have access to file ${fileId}`);
      return NextResponse.json({ 
        error: 'Unauthorized', 
        details: 'You do not have permission to download this file'
      }, { status: 403 });
    }
    
    debugLog(`Access granted - user ${userId} has permission to download file ${fileId}`);
    debugLog(`User access type: ${isCreator ? 'Creator' : isAdmin ? 'Admin' : 'Purchaser'}`);
    
    // Get the file path
    const filePath = file.path;
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
      const fileName = file.filename || absoluteFilePath.split('/').pop() || 'download';
      
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
      
      // Log the download for analytics
      try {
        const downloadLog = await prisma.fileDownload.create({
          data: {
            fileId: fileId,
            userId: isTempAccess ? null : userId, // Don't store temp user IDs
            purchaseId: purchaseId, // Store the purchase ID for tracking
            downloadedAt: new Date(),
            userAgent: request.headers.get('user-agent') || 'unknown',
            ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
            // Track if this was a temporary access download
            metadata: isTempAccess ? JSON.stringify({
              tempAccess: true,
              email: tempData.email,
              productId: tempData.productId
            }) : null
          }
        });
        
        debugLog(`Logged download for analytics, id: ${downloadLog.id}`);
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
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
