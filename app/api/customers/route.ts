import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/auth-utils';
import { supabaseUserService } from '@/lib/supabase-db';

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

    // Get pagination parameters from query string
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Get unique customers (those who have purchased this user's products) using Supabase
    const customers = await supabaseUserService.getUniqueCustomers(userId);

    // Apply pagination to the results
    const paginatedCustomers = customers.slice(offset, offset + limit);

    // Format the response to match expected structure
    const formattedCustomers = paginatedCustomers.map(customer => ({
      email: customer.email,
      purchaseCount: customer.purchaseCount,
      totalSpent: customer.totalSpent,
      firstPurchase: customer.firstPurchase,
      lastPurchase: customer.lastPurchase,
      status: customer.status
    }));

    return NextResponse.json({
      customers: formattedCustomers,
      pagination: {
        total: customers.length,
        page,
        limit,
        totalPages: Math.ceil(customers.length / limit),
      }
    });

  } catch (error) {
    console.error('Error fetching customers:', error);
    
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
      { 
        error: 'Failed to fetch customers',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
