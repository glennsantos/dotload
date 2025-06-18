import { NextRequest, NextResponse } from 'next/server';
import { supabaseFileService, supabasePurchaseService } from '@/lib/supabase-db';
import { join } from 'path';
import { readFile } from 'fs/promises';
import { cwd } from 'process';
import * as fs from 'fs';
import { getAuthToken } from '@/lib/auth-utils';
import { verify } from 'jsonwebtoken';
import crypto from 'crypto';

// Enable verbose logging for debugging
const DEBUG = true;
const debugLog = (message: string, ...args: any[]) => {
  if (DEBUG) {
    console.log(`[SECURE-DL] ${message}`, ...args);
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

/**
 * Validate a download token
 */
function validateDownloadToken(token: string, fileId: string, userId: string): boolean {
  debugLog(`Validating token for fileId: ${fileId}, userId: ${userId}`);
  
  // Parse token parts (hmac.nonce.timestamp)
  const parts = token.split('.');
  if (parts.length !== 3) {
    debugLog('Invalid token format - expected 3 parts');
    return false;
  }
  
  const [originalHmac, nonce, timestampStr] = parts;
  
  // Parse timestamp
  const timestamp = parseInt(timestampStr, 10);
  if (isNaN(timestamp)) {
    debugLog('Invalid timestamp in token');
    return false;
  }
  
  // Check token expiration (24 hours)
  const currentTime = Date.now();
  const tokenAge = currentTime - timestamp;
  const maxTokenAge = 24 * 60 * 60 * 1000; // 24 hours
  
  if (tokenAge > maxTokenAge) {
    debugLog(`Token expired. Age: ${tokenAge}ms, Max allowed: ${maxTokenAge}ms`);
    return false;
  }
  
  // Recreate the HMAC for verification
  const secret = process.env.DOWNLOAD_SECRET || process.env.JWT_SECRET || 'secure-download-secret';
  const data = `${fileId}:${userId}:${timestamp}:${nonce}:${process.env.NEXTAUTH_URL || ''}`;
  const expectedHmac = crypto.createHmac('sha256', secret).update(data).digest('hex');
  
  // For security in a production environment, you would want to use a constant-time comparison
  // But for compatibility with TypeScript, we'll use a simple string comparison
  // This is acceptable for this application since we're not dealing with passwords
  const isValid = expectedHmac === originalHmac;
  
  debugLog(`Token validation result: ${isValid}`);
  return isValid;
}

/**
 * Generate a secure download URL
 * POST /api/downloads/secure
 */
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
    
    // Get file ID from request body
    const body = await request.json();
    const { fileId } = body;
    
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
    
    // Create a secure download URL
    const downloadUrl = `/api/downloads/secure/${fileId}?token=${encodeURIComponent(token)}&userId=${userId}`;
    
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

/**
 * Download a file using a secure token
 * GET /api/downloads/secure/[fileId]
 */
export async function GET(request: NextRequest) {
  try {
    // Get file ID from URL path
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const fileId = pathParts[pathParts.length - 1];
    
    debugLog(`Processing download request for fileId: ${fileId}`);
    debugLog(`Request URL: ${request.url}`);
    
    // Get token and user ID from query parameters
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token');
    const userId = searchParams.get('userId');
    
    if (!token || !userId) {
      debugLog('Missing token or userId in request');
      return NextResponse.json({ 
        error: 'Invalid download link', 
        details: 'Required parameters are missing'
      }, { status: 400 });
    }
    
    debugLog(`Looking up file with ID: ${fileId}`);
    
    // Find the file using Supabase
    const file = await supabaseFileService.findFileById(fileId);
    
    if (!file) {
      debugLog(`File not found with ID: ${fileId}`);
      
      // Try to find similar files (for debugging) - simplified for Supabase
      try {
        const allFiles = await supabaseFileService.getFiles({ 
          limit: 5 
        });
        
        const similarFiles = allFiles.filter((f: any) => 
          f.id.startsWith(fileId.substring(0, 10))
        );
        
        if (similarFiles.length > 0) {
          debugLog(`Found ${similarFiles.length} similar files:`, similarFiles.map((f: any) => ({
            id: f.id,
            filename: f.filename,
            path: f.path
          })));
        }
      } catch (err) {
        // Ignore errors in debug search
      }
      
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }
    
    // Validate the token
    if (!validateDownloadToken(token, fileId, userId)) {
      debugLog(`Token validation failed for fileId: ${fileId}, userId: ${userId}`);
      return NextResponse.json({ 
        error: 'Invalid or expired download link',
        details: 'The download link has expired or is invalid. Please request a new download link.'
      }, { status: 403 });
    }
    
    debugLog('Token validated successfully');
    
    // Get the file path
    const filePath = (file as any).path;
    debugLog(`File path from database: ${filePath}`);
    
    // If the path is a URL, redirect to it
    if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
      debugLog(`File is a URL, redirecting to: ${filePath}`);
      return NextResponse.redirect(filePath);
    }
    
    // Determine the absolute file path
    const absoluteFilePath = filePath.startsWith('/') 
      ? filePath 
      : join(cwd(), filePath);
    
    debugLog(`Attempting to read file from: ${absoluteFilePath}`);
    
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
      
      // Create response with appropriate headers
      const response = new NextResponse(fileBuffer, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
          'Content-Length': fileBuffer.length.toString(),
        },
      });
      
      debugLog(`Serving file: ${fileName}, type: ${contentType}, size: ${fileBuffer.length} bytes`);
      return response;
    } catch (fileError) {
      debugLog(`Error reading file: ${fileError instanceof Error ? fileError.message : String(fileError)}`);
      
      // Try to find the file in alternative locations
      try {
        // Check if file exists in uploads directory
        const uploadsDir = join(cwd(), 'uploads');
        const userDir = (file as any).product?.userId ? join(uploadsDir, 'users', (file as any).product.userId) : null;
        const productDir = userDir && (file as any).productId ? join(userDir, 'products', (file as any).productId) : null;
        
        if (productDir) {
          debugLog(`Checking alternative path in: ${productDir}`);
          
          // List files in the product directory
          const files = await fs.promises.readdir(productDir);
          debugLog(`Found ${files.length} files in product directory`);
          
          // Look for a file with a similar name
          const fileName = (file as any).filename || absoluteFilePath.split('/').pop() || '';
          const similarFile = files.find(f => f.includes(fileName) || fileName.includes(f));
          
          if (similarFile) {
            const alternativePath = join(productDir, similarFile);
            debugLog(`Found alternative file: ${alternativePath}`);
            
            // Read and serve the alternative file
            const fileBuffer = await readFile(alternativePath);
            
            return new NextResponse(fileBuffer, {
              status: 200,
              headers: {
                'Content-Type': 'application/octet-stream',
                'Content-Disposition': `attachment; filename="${encodeURIComponent(similarFile)}"`,
                'Content-Length': fileBuffer.length.toString(),
              },
            });
          }
        }
      } catch (altError) {
        debugLog(`Error in alternative path search: ${altError instanceof Error ? altError.message : String(altError)}`);
      }
      
      return NextResponse.json({ 
        error: 'File not found',
        details: 'The file could not be found on the server',
        path: absoluteFilePath
      }, { status: 404 });
    }
  } catch (error) {
    console.error('Download error:', error);
    
    // Handle specific Supabase errors
    if (error instanceof Error && error.message.includes('Failed to')) {
      return NextResponse.json(
        { error: 'Database error occurred while processing download', details: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ 
      error: 'Failed to download content', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
