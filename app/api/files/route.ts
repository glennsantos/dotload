import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthToken } from '@/lib/auth-utils';
import { verify } from 'jsonwebtoken';

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
