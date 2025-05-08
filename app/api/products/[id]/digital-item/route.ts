import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserId } from '@/lib/auth-utils';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { mkdir } from 'fs/promises';
import { cwd } from 'process';

// Ensure digital items directory exists
async function ensureDigitalItemsDir() {
  const digitalItemsDir = join(cwd(), 'digital-items');
  try {
    await mkdir(digitalItemsDir, { recursive: true });
    return digitalItemsDir;
  } catch (error) {
    console.error('Error creating digital items directory:', error);
    throw error;
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const productId = params.id;
    
    // Get the current authenticated user's ID
    const userId = getAuthUserId();
    
    // If no authenticated user, return error
    if (!userId) {
      return NextResponse.json({ 
        error: 'Authentication required',
        details: 'You must be logged in to upload a digital item'
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
    
    const formData = await request.formData();
    const digitalItem = formData.get('digitalItem') as File | null;
    
    if (!digitalItem) {
      return NextResponse.json({ 
        error: 'No digital item provided' 
      }, { status: 400 });
    }
    
    // Process digital item
    const digitalItemsDir = await ensureDigitalItemsDir();
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = `digital-item-${uniqueSuffix}-${digitalItem.name}`;
    const path = join(digitalItemsDir, filename);
    
    await writeFile(path, new Uint8Array(await digitalItem.arrayBuffer()));
    const digitalItemPath = `digital-items/${filename}`;
    
    // Update product with digital item path
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: {
        digitalItemPath
      },
      include: {
        files: true,
        variations: true
      }
    });
    
    return NextResponse.json({
      message: 'Digital item uploaded successfully',
      product: updatedProduct
    }, { status: 200 });
  } catch (error) {
    console.error('Digital item upload error:', error);
    return NextResponse.json({ 
      error: 'Failed to upload digital item', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
