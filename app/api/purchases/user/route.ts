import { NextRequest, NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma"
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';


export async function GET(request: NextRequest) {
  try {
    // Get the authenticated user from JWT token in cookies
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const jwtSecret = process.env.JWT_SECRET || 'your-jwt-secret-key';
    const decoded = jwt.verify(token, jwtSecret) as { userId: string, email: string };

    // Get user's purchases
    const purchases = await prisma.purchase.findMany({
      where: {
        email: decoded.email,
        status: 'completed',
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      purchases,
    });
  } catch (error) {
    console.error('Error fetching user purchases:', error);
    return NextResponse.json(
      { error: 'Failed to fetch purchase information' },
      { status: 500 }
    );
  }
}
