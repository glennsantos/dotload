import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { supabaseUserService, supabaseTransactionService } from '@/lib/supabase-db';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback_secret_key_please_set_in_env');

  /**
   * Handles GET requests to `/api/transactions`.
   *
   * Returns a JSON response containing the user's transactions, pagination information, and summary statistics.
   *
   * @param request - The NextRequest object.
   * @returns A JSON response containing the user's transactions, pagination information, and summary statistics.
   */
export async function GET(request: NextRequest) {
  try {
    // Get the authenticated user from JWT token in cookies
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const decoded = payload as { userId: string, email: string, emailVerified?: boolean };

    // Get user from database using Supabase
    const user = await supabaseUserService.findUserById(decoded.userId);
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get pagination parameters from query string
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Get transactions for the user using Supabase
    const transactions = await supabaseTransactionService.getTransactionsByUserId(user.id, {
      limit,
      offset
    });

    // Get total count for pagination
    const totalCount = await supabaseTransactionService.countTransactionsByUserId(user.id);

    // Get transaction summary using Supabase
    const summary = await supabaseTransactionService.getTransactionSummary(user.id);

    return NextResponse.json({
      transactions,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
      summary
    });
  } catch (error) {
    // More detailed error logging
    console.error('Error fetching ledger:', error);
    
    // Check for specific error types
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      // Handle specific JWT errors
      if (error.name === 'JWTInvalid' || error.name === 'JWTExpired') {
        return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 });
      }
      
      // Handle specific Supabase errors
      if (error.message.includes('Failed to')) {
        return NextResponse.json(
          { error: 'Database error occurred. Please try again.' },
          { status: 500 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch transactions information' },
      { status: 500 }
    );
  }
}

// Note: The createTransaction function has been moved to /lib/transaction-utils.ts
