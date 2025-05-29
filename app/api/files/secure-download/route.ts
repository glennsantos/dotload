import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { join } from 'path';
import { readFile } from 'fs/promises';
import { cwd } from 'process';
import * as fs from 'fs';
import { getAuthToken } from '@/lib/auth-utils';
import { verify } from 'jsonwebtoken';
import crypto from 'crypto';

// Function to generate a secure token
function generateSecureToken(fileId: string, userId: string): string {
  const secret = process.env.JWT_SECRET || 'your-fallback-secret';
  const timestamp = Date.now();
  const data = `${fileId}-${userId}-${timestamp}`;
  return `${crypto.createHmac('sha256', secret).update(data).digest('hex')}-${timestamp}`;
}

// Function to validate a secure token
function validateSecureToken(token: string, fileId: string, userId: string): boolean {
  // Tokens are valid for 24 hours
  const parts = token.split('-');
  if (parts.length < 2) return false;
  
  const tokenTimestamp = parseInt(parts[parts.length - 1], 10);
  const currentTime = Date.now();
  const tokenAge = currentTime - tokenTimestamp;
  const maxTokenAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  
  if (tokenAge > maxTokenAge) {
    return false;
  }
  
  const expectedToken = generateSecureToken(fileId, userId);
  const expectedHash = expectedToken.split('-')[0];
  const actualHash = parts.slice(0, parts.length - 1).join('-');
  
  return actualHash === expectedHash;
}

// Generate a secure download URL for a file
export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated
    const authToken = await getAuthToken(request);
    
    if (!authToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Decode the JWT token
    const secret = process.env.JWT_SECRET || 'your-fallback-secret';
    let decoded: any;
    
    try {
      decoded = verify(authToken, secret) as { userId: string; role?: string };
    } catch (err) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: 'Invalid token data' }, { status: 401 });
    }
    
    // Get file ID from request body
    const body = await request.json();
    const { fileId } = body;
    
    if (!fileId) {
      return NextResponse.json({ error: 'File ID is required' }, { status: 400 });
    }
    
    // Find the file
    const file = await prisma.file.findUnique({
      where: { id: fileId },
      include: { product: true }
    });
    
    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }
    
    // Verify the user owns the product or is an admin
    const userId = decoded.userId;
    const isOwner = file.product.userId === userId;
    const isAdmin = decoded.role === 'ADMIN';
    
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    // Generate a secure token
    const token = generateSecureToken(fileId, userId);
    
    // Create a secure download URL
    const downloadUrl = `/api/files/secure-download/${fileId}?token=${token}&userId=${userId}`;
    
    return NextResponse.json({ url: downloadUrl });
  } catch (error) {
    console.error('Error generating secure download URL:', error);
    return NextResponse.json({ 
      error: 'Failed to generate download URL', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Download a file using a secure token
export async function GET(request: NextRequest) {
  try {
    // Get file ID from URL path
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const fileId = pathParts[pathParts.length - 1];
    
    // Get token and user ID from query parameters
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token');
    const userId = searchParams.get('userId');
    
    if (!token || !userId) {
      return NextResponse.json({ error: 'Invalid download link' }, { status: 400 });
    }
    
    // Find the file
    const file = await prisma.file.findUnique({
      where: { id: fileId }
    });
    
    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }
    
    // Validate the token
    if (!validateSecureToken(token, fileId, userId)) {
      return NextResponse.json({ error: 'Invalid or expired download link' }, { status: 403 });
    }
    
    // Get the file path
    const filePath = file.path;
    
    // If the path is a URL (starts with http or https), redirect to it
    if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
      return NextResponse.redirect(filePath);
    }
    
    // Otherwise, read the file from the local filesystem
    try {
      // Determine the file path
      let absoluteFilePath = filePath.startsWith('/') 
        ? filePath 
        : join(cwd(), filePath);
      
      // Read the file
      const fileBuffer = await readFile(absoluteFilePath);
      
      // Get the filename from the path or use the one from the database
      const fileName = file.filename || absoluteFilePath.split('/').pop() || 'download';
      
      // Determine the content type based on file extension
      const extension = fileName.split('.').pop()?.toLowerCase();
      let contentType = 'application/octet-stream'; // Default content type
      
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
          'Content-Disposition': `attachment; filename="${fileName}"`,
          'Content-Length': fileBuffer.length.toString(),
        },
      });
      
      return response;
    } catch (fileError) {
      console.error('File read error:', fileError);
      return NextResponse.json({ 
        error: 'File not found',
        details: 'The digital content file could not be found'
      }, { status: 404 });
    }
  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json({ 
      error: 'Failed to download content', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
