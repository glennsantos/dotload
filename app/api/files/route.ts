import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthToken } from '@/lib/auth-utils';
import { verify } from 'jsonwebtoken';
import { writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { v4 as uuidv4 } from 'uuid';

/**
 * GET /api/files
 * List files with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const productId = searchParams.get('productId');
    
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
    
    const userId = decoded.userId;
    const isAdmin = decoded.role === 'ADMIN';
    
    // Build query filters
    const filters: any = {};
    
    // If not admin, only show files from products owned by the user
    if (!isAdmin) {
      filters.product = {
        userId
      };
    }
    
    // Add product filter if specified
    if (productId) {
      filters.productId = productId;
    }
    
    // Query files with pagination
    const files = await prisma.file.findMany({
      where: filters,
      take: limit,
      skip: (page - 1) * limit,
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        filename: true,
        path: true,
        size: true,
        productId: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    // Get total count for pagination
    const totalFiles = await prisma.file.count({
      where: filters
    });
    
    return NextResponse.json({
      files,
      pagination: {
        total: totalFiles,
        page,
        limit,
        pages: Math.ceil(totalFiles / limit)
      }
    });
  } catch (error) {
    console.error('Error listing files:', error);
    return NextResponse.json({ 
      error: 'Failed to list files', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * POST /api/files
 * Upload files for a product
 */
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
    
    const userId = decoded.userId;
    
    // Parse the form data
    const formData = await request.formData();
    const productId = formData.get('productId');
    
    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }
    
    // Verify the product exists and belongs to the user
    const product = await prisma.product.findUnique({
      where: {
        id: productId as string,
        userId: userId
      }
    });
    
    if (!product) {
      return NextResponse.json({ error: 'Product not found or access denied' }, { status: 404 });
    }
    
    // Process each file in the form data
    const uploadedFiles = [];
    const uploadPromises = [];
    
    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'uploads');
    await mkdir(uploadsDir, { recursive: true });
    
    // Create product-specific directory
    const productDir = join(uploadsDir, productId as string);
    await mkdir(productDir, { recursive: true });
    
    // Find all file entries in the form data
    for (let i = 0; i < 100; i++) { // Limit to 100 files as a safety measure
      const fileKey = `file${i}`;
      const file = formData.get(fileKey) as File;
      
      if (!file) {
        // No more files to process
        break;
      }
      
      // Generate a unique filename
      const originalFilename = file.name;
      const fileExtension = originalFilename.split('.').pop() || '';
      const uniqueFilename = `${uuidv4()}.${fileExtension}`;
      const filePath = join(productDir, uniqueFilename);
      
      // Save file to disk
      const fileBuffer = new Uint8Array(await file.arrayBuffer());
      uploadPromises.push(writeFile(filePath, fileBuffer));
      
      // Create database record
      const fileRecord = prisma.file.create({
        data: {
          filename: originalFilename,
          path: `uploads/${productId}/${uniqueFilename}`,
          size: file.size,
          mimetype: file.type, // Required field in the schema
          productId: productId as string
        }
      });
      
      uploadPromises.push(fileRecord);
      uploadedFiles.push(originalFilename);
    }
    
    // Wait for all uploads and database operations to complete
    await Promise.all(uploadPromises);
    
    return NextResponse.json({
      success: true,
      message: `Successfully uploaded ${uploadedFiles.length} files`,
      files: uploadedFiles
    });
  } catch (error) {
    console.error('Error uploading files:', error);
    return NextResponse.json({ 
      error: 'Failed to upload files', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
