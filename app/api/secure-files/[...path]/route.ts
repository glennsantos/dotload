import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserId, getCurrentUser } from '@/lib/auth-utils';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

export async function GET(
  request: NextRequest
) {
  try {
    // Extract the path from the URL
    const url = new URL(request.url);
    const urlPathSegments = url.pathname.split('/').filter(Boolean);
    
    // Remove 'api' and 'secure-files' from the path segments
    const apiIndex = urlPathSegments.indexOf('api');
    const secureFilesIndex = urlPathSegments.indexOf('secure-files');
    
    // Extract the actual file path segments (everything after 'secure-files')
    const pathParams = urlPathSegments.slice(secureFilesIndex + 1);
    
    // Reconstruct the file path from the URL segments
    const filePath = pathParams.join('/');
    
    // Get the current authenticated user's ID
    const userId = await getAuthUserId();
    
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    
    // Extract product ID from the path (format: users/{userId}/products/{productId}/files/{filename})
    const pathSegments = filePath.split('/');
    if (pathSegments.length < 5) {
      return new NextResponse('Invalid file path', { status: 400 });
    }
    
    const fileUserId = pathSegments[1];
    const productId = pathSegments[3];
    
    // Find the file in the database
    const file = await prisma.file.findFirst({
      where: {
        path: filePath,
        productId: productId
      },
      include: {
        product: true
      }
    });
    
    // If file not found in database, try to find by partial path match
    if (!file) {
      // Extract filename from path
      const filename = filePath.split('/').pop() || '';
      
      // Try to find by filename and product ID
      const fileByName = await prisma.file.findFirst({
        where: {
          filename,
          productId: productId
        },
        include: {
          product: true
        }
      });
      
      if (fileByName) {
        return new NextResponse('File not found with exact path, but found by name. Please use the correct URL.', { status: 404 });
      }
    }
    
    if (!file) {
      return new NextResponse('File not found', { status: 404 });
    }
    
    // Check if user has access to the file
    // User can access if:
    // 1. They are the owner of the product
    // 2. They have purchased the product
    const isOwner = file.product.userId === userId;
    
    if (!isOwner) {
      // Get user email from current user
      const currentUser = await getCurrentUser();
      const userEmail = currentUser?.email;
      
      if (!userEmail) {
        return new NextResponse('Unauthorized', { status: 403 });
      }
      
      // Check if the user has purchased the product
      // Using the Purchase model from the Prisma schema
      const purchaseResults = await prisma.$queryRaw`
        SELECT * FROM "Purchase"
        WHERE "productId" = ${productId}
        AND ("status" = 'completed' OR "status" = 'succeeded')
        AND "email" = ${userEmail}
        LIMIT 1
      `;
      
      const purchase = Array.isArray(purchaseResults) && purchaseResults.length > 0 ? purchaseResults[0] : null;
      
      if (!purchase) {
        // If no purchase found by email, check if the user has an access code
        // This could be implemented if you have a way to associate access codes with users
        //TODO: the access code is part of the url, we need to check if the access code is valid
        return new NextResponse('Unauthorized - You must purchase this product to access its files', { status: 403 });
      }
    }
    
    // Base directory for uploads
    const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
    
    // Get the absolute file path
    const absoluteFilePath = path.join(UPLOADS_DIR, filePath);
    
    // Check if the file exists
    if (!fs.existsSync(absoluteFilePath)) {
      return new NextResponse('File not found on server', { status: 404 });
    }
    
    // Read the file
    const fileBuffer = fs.readFileSync(absoluteFilePath);
    
    // Determine content type based on file extension
    const extension = path.extname(file.filename).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.ppt': 'application/vnd.ms-powerpoint',
      '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.mp3': 'audio/mpeg',
      '.mp4': 'video/mp4',
      '.zip': 'application/zip',
      '.txt': 'text/plain',
      '.html': 'text/html',
      '.css': 'text/css',
      '.js': 'application/javascript',
      '.json': 'application/json',
    };
    const contentType = mimeTypes[extension] || 'application/octet-stream';
    
    // Return the file with appropriate headers
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${file.filename}"`,
        'Cache-Control': 'no-store, max-age=0'
      }
    });
  } catch (error) {
    console.error('Error accessing secure file:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
