import { NextRequest, NextResponse } from 'next/server';
import { supabaseProductService, supabaseFileService } from '@/lib/supabase-db';
import { getAuthUserId } from '@/lib/auth-utils';

export async function DELETE(
  request: NextRequest
) {
  try {
    // Extract the product ID and file ID from the URL path
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const productsIndex = pathParts.indexOf('products');
    const productId = pathParts[productsIndex + 1];
    const fileId = pathParts[pathParts.indexOf('files') + 1];
    
    if (!productId || !fileId) {
      return NextResponse.json({ 
        error: 'Missing required IDs',
        details: 'Product ID and File ID are required'
      }, { status: 400 });
    }
    
    // Get the current authenticated user's ID
    const userId = await getAuthUserId();
    
    // If no authenticated user, return error
    if (!userId) {
      return NextResponse.json({ 
        error: 'Authentication required',
        details: 'You must be logged in to delete files'
      }, { status: 401 });
    }
    
    // Check if product exists and belongs to the current user using Supabase
    const product = await supabaseProductService.findProductById(productId);
    
    if (!product) {
      return NextResponse.json({ 
        error: 'Product not found' 
      }, { status: 404 });
    }
    
    // Verify that the product belongs to the current user
    if ((product as any).userId !== userId) {
      return NextResponse.json({ 
        error: 'Unauthorized',
        details: 'You do not have permission to modify this product'
      }, { status: 403 });
    }
    
    // Check if file exists and belongs to the product using Supabase
    const file = await supabaseFileService.findFileById(fileId);
    
    if (!file || (file as any).productId !== productId) {
      return NextResponse.json({ 
        error: 'File not found or does not belong to this product' 
      }, { status: 404 });
    }
    
    // Delete the file record using Supabase
    await supabaseFileService.deleteFile(fileId);
    
    return NextResponse.json({
      message: 'File deleted successfully'
    }, { status: 200 });
  } catch (error) {
    console.error('File deletion error:', error);
    
    // Handle specific Supabase errors
    if (error instanceof Error && error.message.includes('Failed to')) {
      return NextResponse.json(
        { error: 'Database error occurred while deleting file', details: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ 
      error: 'Failed to delete file', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
