import { NextRequest, NextResponse } from 'next/server';
import { supabaseFileService } from '@/lib/supabase-db';
import { getPurchaseByAccessCode } from '@/lib/purchase-utils';
import { join } from 'path';
import { readFile } from 'fs/promises';
import { cwd } from 'process';
import * as fs from 'fs';

export async function GET(request: NextRequest) {
  try {
    console.log('Download request received');
    
    // Get access code and file ID from query parameters
    const searchParams = request.nextUrl.searchParams;
    const accessCode = searchParams.get('accessCode');
    const fileId = searchParams.get('fileId');
    
    console.log(`Download request params - accessCode: ${accessCode}, fileId: ${fileId}`);
    
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
    
    // Find purchase by access code using utility function (now uses Supabase)
    const purchase = await getPurchaseByAccessCode(accessCode);
    
    console.log(`Purchase found: ${!!purchase}, status: ${purchase?.status}`);
    
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
    console.log(`Checking purchase status: ${purchase.status}`);
    console.log(`Is completed or succeeded: ${purchase.status === 'completed' || purchase.status === 'succeeded'}`);
    
    if (purchase.status !== 'completed' && purchase.status !== 'succeeded') {
      console.log('Purchase status check failed - not completed or succeeded');
      return NextResponse.json({ 
        error: 'Purchase not completed',
        details: 'Payment status is invalid'
      }, { status: 403 });
    }
    
    console.log('Purchase status check passed');
    
    // Find the specific file by ID using Supabase
    const file = await supabaseFileService.findFileById(fileId);
    
    console.log(`File found: ${!!file}, filename: ${file?.filename}, path: ${file?.path}`);
    
    if (!file) {
      return NextResponse.json({ 
        error: 'File not found',
        details: 'The requested file does not exist'
      }, { status: 404 });
    }
    
    // Verify the file belongs to the purchased product
    console.log(`File product ID: ${file.productId}, Purchase product ID: ${purchase.productId}`);
    console.log(`File belongs to purchase: ${file.productId === purchase.productId}`);
    
    if (file.productId !== purchase.productId) {
      return NextResponse.json({ 
        error: 'Unauthorized',
        details: 'You do not have access to this file'
      }, { status: 403 });
    }
    
    // Get the file path
    const filePath = file.path;
    console.log(`Original file path from database: ${filePath}`);
    
    // If the path is a URL (starts with http or https), redirect to it
    if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
      console.log(`Redirecting to external URL: ${filePath}`);
      return NextResponse.redirect(filePath);
    }
    
    // Otherwise, read the file from the local filesystem
    try {
      // Determine the file path
      // Make sure we're using the correct path format - we need to add 'uploads/' to the path
      // This is critical because the database stores paths relative to the uploads directory
      let absoluteFilePath = filePath.startsWith('/') 
        ? filePath 
        : join(cwd(), 'uploads', filePath);
      
      console.log(`Corrected absolute file path: ${absoluteFilePath}`);
      
      console.log(`Attempting to read file from: ${absoluteFilePath}`);
      
      // Log the directory contents to debug
      try {
        const dirPath = absoluteFilePath.substring(0, absoluteFilePath.lastIndexOf('/'));
        console.log(`Checking directory: ${dirPath}`);
        const dirContents = await fs.promises.readdir(dirPath);
        console.log(`Directory contents: ${dirContents.join(', ')}`);
      } catch (error: unknown) {
        const dirError = error instanceof Error ? error : new Error(String(error));
        console.error(`Cannot read directory: ${dirError.message}`);
      }
      
      // Check if the file exists
      try {
        const stats = await fs.promises.stat(absoluteFilePath);
        console.log(`File exists: ${stats.isFile()}, size: ${stats.size} bytes`);
      } catch (statError) {
        console.error(`File does not exist or cannot be accessed: ${absoluteFilePath}`, statError);
        
        // Try an alternative approach - sometimes the path might have encoding issues
        // Let's try to find the file by matching the filename part only
        try {
          const dirPath = absoluteFilePath.substring(0, absoluteFilePath.lastIndexOf('/'));
          const fileName = absoluteFilePath.substring(absoluteFilePath.lastIndexOf('/') + 1);
          console.log(`Looking for file with name similar to: ${fileName} in directory: ${dirPath}`);
          
          const dirContents = await fs.promises.readdir(dirPath);
          const matchingFile = dirContents.find(file => 
            file.includes(fileName.split('-')[0]) || // Match by first part of filename
            fileName.includes(file.split('-')[0])    // Or vice versa
          );
          
          if (matchingFile) {
            const newPath = join(dirPath, matchingFile);
            console.log(`Found matching file: ${matchingFile}, using path: ${newPath}`);
            absoluteFilePath = newPath;
          }
        } catch (error: unknown) {
          const findError = error instanceof Error ? error : new Error(String(error));
          console.error(`Error finding alternative file: ${findError.message}`);
        }
      }
      
      // Read the file
      console.log(`Reading file from final path: ${absoluteFilePath}`);
      const fileBuffer = await readFile(absoluteFilePath);
      console.log(`File read successfully, size: ${fileBuffer.length} bytes`);
      
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
    
    if (error instanceof Error) {
      // Handle specific Supabase errors
      if (error.message.includes('Failed to')) {
        return NextResponse.json(
          { error: 'Database error occurred. Please try again.' },
          { status: 500 }
        );
      }
    }
    
    return NextResponse.json({ 
      error: 'Failed to download content', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
