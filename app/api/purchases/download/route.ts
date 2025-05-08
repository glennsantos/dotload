import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getPurchaseByAccessCode } from '@/lib/purchase-utils';
import { join } from 'path';
import { readFile } from 'fs/promises';
import { cwd } from 'process';

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
    
    // Check if purchase is completed
    if (purchase.status !== 'completed') {
      return NextResponse.json({ 
        error: 'Purchase not completed',
        details: 'Payment is still pending'
      }, { status: 403 });
    }
    
    // Check if product has a digital item
    if (!purchase.product.digitalItemPath) {
      return NextResponse.json({ 
        error: 'No digital content',
        details: 'This product does not have digital content'
      }, { status: 404 });
    }
    
    // Get the digital item path
    const digitalItemPath = purchase.product.digitalItemPath;
    
    // If the path is a URL (starts with http or https), redirect to it
    if (digitalItemPath.startsWith('http://') || digitalItemPath.startsWith('https://')) {
      return NextResponse.redirect(digitalItemPath);
    }
    
    // Otherwise, read the file from the local filesystem
    try {
      // Determine the file path
      const filePath = digitalItemPath.startsWith('/') 
        ? digitalItemPath 
        : join(cwd(), digitalItemPath);
      
      // Read the file
      const fileBuffer = await readFile(filePath);
      
      // Get the filename from the path
      const fileName = filePath.split('/').pop() || 'download';
      
      // Determine the content type based on file extension
      const extension = fileName.split('.').pop()?.toLowerCase();
      let contentType = 'application/octet-stream'; // Default content type
      
      // Set content type based on file extension
      switch (extension) {
        case 'pdf':
          contentType = 'application/pdf';
          break;
        case 'jpg':
        case 'jpeg':
          contentType = 'image/jpeg';
          break;
        case 'png':
          contentType = 'image/png';
          break;
        case 'gif':
          contentType = 'image/gif';
          break;
        case 'mp3':
          contentType = 'audio/mpeg';
          break;
        case 'mp4':
          contentType = 'video/mp4';
          break;
        case 'zip':
          contentType = 'application/zip';
          break;
        case 'txt':
          contentType = 'text/plain';
          break;
        case 'doc':
        case 'docx':
          contentType = 'application/msword';
          break;
        case 'xls':
        case 'xlsx':
          contentType = 'application/vnd.ms-excel';
          break;
        case 'ppt':
        case 'pptx':
          contentType = 'application/vnd.ms-powerpoint';
          break;
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
