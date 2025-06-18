import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/auth-utils';
import { supabaseFileService } from '@/lib/supabase-db';

/**
 * GET /api/files
 * List files with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    // Get the authenticated user's ID
    const userId = await getAuthUserId();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const productId = searchParams.get('productId');
    
    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    // Get files for the product using Supabase
    const files = await supabaseFileService.getFilesByProductId(productId);
    
    return NextResponse.json({
      files: files.map(file => ({
        id: file.id,
        filename: file.filename,
        path: file.path,
        mimetype: file.mimetype,
        size: file.size,
        createdAt: file.createdAt,
        updatedAt: file.updatedAt
      }))
    });

  } catch (error) {
    console.error('Error fetching files:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch files',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/files
 * Upload files for a product
 */
export async function POST(request: NextRequest) {
  try {
    // Get the authenticated user's ID
    const userId = await getAuthUserId();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse the request body
    const { filename, path, mimetype, size, productId } = await request.json();
    
    // Validate required fields
    if (!filename || !path || !productId) {
      return NextResponse.json(
        { error: 'Missing required fields: filename, path, and productId are required' },
        { status: 400 }
      );
    }

    // Create the file record using Supabase
    const file = await supabaseFileService.createFile({
      filename,
      path,
      mimetype: mimetype || 'application/octet-stream',
      size: size || 0,
      productId
    });
    
    return NextResponse.json({
      success: true,
      file: {
        id: file.id,
        filename: file.filename,
        path: file.path,
        mimetype: file.mimetype,
        size: file.size,
        productId: file.productId,
        createdAt: file.createdAt,
        updatedAt: file.updatedAt
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating file record:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create file record',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Get the authenticated user's ID
    const userId = await getAuthUserId();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get file ID from query parameters
    const searchParams = request.nextUrl.searchParams;
    const fileId = searchParams.get('fileId');
    
    if (!fileId) {
      return NextResponse.json(
        { error: 'File ID is required' },
        { status: 400 }
      );
    }

    // Get file details first to verify ownership
    const file = await supabaseFileService.findFileById(fileId);
    
    if (!file) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    // TODO: Add ownership verification by checking if the user owns the product
    // For now, we'll proceed with deletion

    // Delete the file record using Supabase
    await supabaseFileService.deleteFile(fileId);
    
    return NextResponse.json({
      success: true,
      message: 'File deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting file:', error);
    return NextResponse.json(
      { 
        error: 'Failed to delete file',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
