import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserId } from '@/lib/auth-utils';
import fs from 'fs';
import path from 'path';
import { mkdir, writeFile } from 'fs/promises';
import crypto from 'crypto';

export async function POST(
  request: NextRequest
) {
  try {
    // Extract the product ID from the URL path
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const productsIndex = pathParts.indexOf('products');
    const productId = pathParts[productsIndex + 1];
    
    if (!productId) {
      return NextResponse.json({ 
        error: 'Missing product ID',
        details: 'Product ID is required'
      }, { status: 400 });
    }
    
    // Get the current authenticated user's ID
    const userId = await getAuthUserId();
    
    // If no authenticated user, return error
    if (!userId) {
      return NextResponse.json({ 
        error: 'Authentication required',
        details: 'You must be logged in to upload files'
      }, { status: 401 });
    }
    
    // Check if product exists and belongs to the current user
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        files: true
      }
    });
    
    if (!product) {
      return NextResponse.json({ 
        error: 'Product not found' 
      }, { status: 404 });
    }
    
    // Verify that the product belongs to the current user
    if (product.userId !== userId) {
      return NextResponse.json({ 
        error: 'Unauthorized',
        details: 'You do not have permission to modify this product'
      }, { status: 403 });
    }
    
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    
    if (!files || files.length === 0) {
      return NextResponse.json({ 
        error: 'No files provided' 
      }, { status: 400 });
    }
    
    const uploadedFiles = [];
    
    // Base directory for uploads
    const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
    
    // Process each file
    for (const file of files) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      // Create a secure path structure: uploads/users/{userId}/products/{productId}/files
      const relativePath = path.join('users', userId, 'products', productId, 'files');
      const uploadDir = path.join(UPLOADS_DIR, relativePath);
      
      // Ensure directory exists
      await mkdir(uploadDir, { recursive: true });
      
      // Generate a secure filename to prevent path traversal attacks
      const timestamp = Date.now();
      const randomString = crypto.randomBytes(8).toString('hex');
      const extension = path.extname(file.name);
      const safeName = path.basename(file.name, extension)
        .replace(/[^a-zA-Z0-9]/g, '-')
        .toLowerCase();
      const secureFilename = `${safeName}-${timestamp}-${randomString}${extension}`;
      
      // Full path to save the file
      const filePath = path.join(uploadDir, secureFilename);
      
      // Save the file using fs.promises.writeFile with a proper type cast
      await writeFile(filePath, new Uint8Array(buffer));
      
      // Generate a URL for secure access
      const relativeFilePath = path.join(relativePath, secureFilename);
      const fileUrl = `/api/secure-files/${encodeURIComponent(relativeFilePath)}`;
      
      // Create a file record in the database
      const fileRecord = await prisma.file.create({
        data: {
          filename: file.name,
          path: relativeFilePath,
          mimetype: file.type || 'application/octet-stream',
          productId
        }
      });
      
      // Add URL to the response (but not stored in DB)
      uploadedFiles.push({
        ...fileRecord,
        url: fileUrl
      });
    }
    
    return NextResponse.json({
      message: 'Files uploaded successfully',
      files: uploadedFiles
    }, { status: 200 });
  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json({ 
      error: 'Failed to upload files', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest
) {
  try {
    // Extract the product ID from the URL path
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const productsIndex = pathParts.indexOf('products');
    const productId = pathParts[productsIndex + 1];
    const fileId = url.pathname.split('/').pop();
    
    if (!productId) {
      return NextResponse.json({ 
        error: 'Missing product ID',
        details: 'Product ID is required'
      }, { status: 400 });
    }
    
    if (!fileId) {
      return NextResponse.json({ 
        error: 'File ID is required' 
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
    
    // Check if product exists and belongs to the current user
    const product = await prisma.product.findUnique({
      where: { id: productId }
    });
    
    if (!product) {
      return NextResponse.json({ 
        error: 'Product not found' 
      }, { status: 404 });
    }
    
    // Verify that the product belongs to the current user
    if (product.userId !== userId) {
      return NextResponse.json({ 
        error: 'Unauthorized',
        details: 'You do not have permission to modify this product'
      }, { status: 403 });
    }
    
    // Delete the file record
    await prisma.file.delete({
      where: { id: fileId }
    });
    
    return NextResponse.json({
      message: 'File deleted successfully'
    }, { status: 200 });
  } catch (error) {
    console.error('File deletion error:', error);
    return NextResponse.json({ 
      error: 'Failed to delete file', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
