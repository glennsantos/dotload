import { NextRequest, NextResponse } from 'next/server';
import { supabaseFileService } from '@/lib/supabase-db';
import { getPurchaseByAccessCode } from '@/lib/purchase-utils';
import { join } from 'path';
import { readFile } from 'fs/promises';
import { cwd } from 'process';

export async function GET(
  request: NextRequest
) {
  try {
    // Extract the file ID from the URL path
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const fileId = pathParts[pathParts.length - 1];
    
    // Get access code from query parameters
    const searchParams = request.nextUrl.searchParams;
    const accessCode = searchParams.get('code');
    
    if (!accessCode) {
      return NextResponse.json({ 
        error: 'Missing access code',
        details: 'Access code is required'
      }, { status: 400 });
    }
    
    // Find purchase by access code using utility function (already migrated to Supabase)
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
    
    // Find the file by ID using Supabase
    const file = await supabaseFileService.findFileById(fileId);
    
    if (!file || (file as any).productId !== purchase.productId) {
      return NextResponse.json({ 
        error: 'File not found',
        details: 'The requested file does not exist or is not part of this purchase'
      }, { status: 404 });
    }
    
    // Get the file path
    const filePath = (file as any).path;
    
    // If the path is a URL (starts with http or https), redirect to it
    if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
      return NextResponse.redirect(filePath);
    }
    
    // Otherwise, read the file from the local filesystem
    try {
      // Determine the file path
      const fullFilePath = filePath.startsWith('/') 
        ? filePath 
        : join(cwd(), filePath);
      
      // Read the file
      const fileBuffer = await readFile(fullFilePath);
      
      // Create file download record using Supabase
      try {
        await supabaseFileService.createFileDownload({
          fileId: fileId,
          purchaseId: purchase.id,
          downloadedAt: new Date().toISOString(),
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
        });
      } catch (downloadError) {
        console.warn('Failed to record file download:', downloadError);
        // Don't fail the download if we can't record it
      }
      
      // Create response with appropriate headers
      const response = new NextResponse(fileBuffer, {
        status: 200,
        headers: {
          'Content-Type': (file as any).mimetype || 'application/octet-stream',
          'Content-Disposition': `attachment; filename="${(file as any).filename}"`,
          'Content-Length': fileBuffer.length.toString(),
        },
      });
      
      return response;
    } catch (fileError) {
      console.error('File read error:', fileError);
      return NextResponse.json({ 
        error: 'File not found',
        details: 'The file could not be found on the server'
      }, { status: 404 });
    }
  } catch (error) {
    console.error('Download file error:', error);
    
    // Handle specific Supabase errors
    if (error instanceof Error && error.message.includes('Failed to')) {
      return NextResponse.json(
        { error: 'Database error occurred while processing download', details: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ 
      error: 'Failed to download file', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
