import { NextRequest, NextResponse } from 'next/server';
import { supabasePurchaseService } from '@/lib/supabase-db';
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

    // Get user's purchases using Supabase
    const purchases = await supabasePurchaseService.getPurchasesByEmail(decoded.email, {
      status: 'completed'
    });

    return NextResponse.json({
      purchases,
    });
  } catch (error) {
    console.error('Error fetching user purchases:', error);
    
    if (error instanceof Error) {
      // Handle specific Supabase errors
      if (error.message.includes('Failed to')) {
        return NextResponse.json(
          { error: 'Database error occurred. Please try again.' },
          { status: 500 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch purchase information' },
      { status: 500 }
    );
  }
}
