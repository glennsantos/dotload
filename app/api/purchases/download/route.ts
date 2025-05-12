import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getPurchaseByAccessCode } from '@/lib/purchase-utils';
import { join } from 'path';
import { readFile } from 'fs/promises';
import { cwd } from 'process';

export async function GET(request: NextRequest) {
  try {
    // Get access code and file ID from query parameters
    const searchParams = request.nextUrl.searchParams;
    const accessCode = searchParams.get('accessCode');
    const fileId = searchParams.get('fileId');
    
    if (!accessCode) {
      return NextResponse.json({ 
        error: 'Missing access code',
        details: 'Access code is required'
      }, { status: 400 });
    }
    
    if (!fileId) {
      return NextResponse.json({ 
        error: 'Missing file ID',
        details: 'File ID is required'
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

    // Check purchase status and handle accordingly
    if (purchase.status === 'failed') {
      return NextResponse.json({ 
        error: 'Purchase failed',
        details: 'The payment for this purchase has failed'
      }, { status: 403 });
    }
    
    // For pending or awaiting_capture status, return a specific status code
    // The frontend will show a modal explaining that the payment is still processing
    if (purchase.status === 'pending' || purchase.status === 'awaiting_capture') {
      return NextResponse.json({ 
        error: 'Payment processing',
        details: 'Your payment is still being processed',
        status: purchase.status
      }, { status: 402 }); // Using 402 Payment Required status code
    }
    
    // Only allow downloads for completed payments
    if (purchase.status !== 'completed' && purchase.status !== 'succeeded') {
      return NextResponse.json({ 
        error: 'Purchase not completed',
        details: 'Payment status is invalid'
      }, { status: 403 });
    }
    
    // Find the specific file by ID
    const file = await prisma.file.findUnique({
      where: {
        id: fileId
      }
    });
    
    if (!file) {
      return NextResponse.json({ 
        error: 'File not found',
        details: 'The requested file does not exist'
      }, { status: 404 });
    }
    
    // Verify the file belongs to the purchased product
    if (file.productId !== purchase.productId) {
      return NextResponse.json({ 
        error: 'Unauthorized',
        details: 'You do not have access to this file'
      }, { status: 403 });
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
      const absoluteFilePath = filePath.startsWith('/') 
        ? filePath 
        : join(cwd(), filePath);
      
      console.log(`Attempting to read file from: ${absoluteFilePath}`);
      
      // Read the file
      const fileBuffer = await readFile(absoluteFilePath);
      
      // Get the filename from the path or use the one from the database
      const fileName = file.filename || absoluteFilePath.split('/').pop() || 'download';
      
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
