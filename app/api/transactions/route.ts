import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

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
    
    const jwtSecret = process.env.JWT_SECRET || 'your-jwt-secret-key';
    const decoded = jwt.verify(token, jwtSecret) as { userId: string, email: string, emailVerified?: boolean };

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get pagination parameters from query string
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Get transactions for the user
    const transactions = await prisma.$queryRaw`
      SELECT * FROM "Transaction"
      WHERE "userId" = ${user.id}
      ORDER BY "createdAt" DESC
      LIMIT ${limit} OFFSET ${skip}
    `;

    // Get total count for pagination
    const totalCountResult = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM "Transaction"
      WHERE "userId" = ${user.id}
    `;
    const totalCount = Number((totalCountResult as any)[0].count);

    // Calculate summary statistics
    const totalIncomeResult = await prisma.$queryRaw`
      SELECT COALESCE(SUM(amount), 0) as sum FROM "Transaction"
      WHERE "userId" = ${user.id}
      AND type = 'income'
      AND status = 'completed'
    `;
    const totalIncome = Number((totalIncomeResult as any)[0].sum);

    const totalPayoutsResult = await prisma.$queryRaw`
      SELECT COALESCE(SUM(amount), 0) as sum FROM "Transaction"
      WHERE "userId" = ${user.id}
      AND type = 'payout'
      AND status = 'completed'
    `;
    const totalPayouts = Number((totalPayoutsResult as any)[0].sum);

    const totalFeesResult = await prisma.$queryRaw`
      SELECT COALESCE(SUM(amount), 0) as sum FROM "Transaction"
      WHERE "userId" = ${user.id}
      AND type = 'fee'
      AND status = 'completed'
    `;
    const totalFees = Number((totalFeesResult as any)[0].sum);

    // Calculate current balance
    // Ensure we're properly deducting both payouts and fees from the total income
    // This fixes the balance computation that wasn't deducting correctly
    const currentBalance = totalIncome - totalPayouts - totalFees;

    const totalPendingIncomeResult = await prisma.$queryRaw`
      SELECT COALESCE(SUM(amount), 0) as sum FROM "Transaction"
      WHERE "userId" = ${user.id}
      AND type = 'income'
      AND status = 'pending'
    `;
    const totalPendingIncome = Number((totalPendingIncomeResult as any)[0].sum);

    const totalPendingPayoutsResult = await prisma.$queryRaw`
      SELECT COALESCE(SUM(amount), 0) as sum FROM "Transaction"
      WHERE "userId" = ${user.id}
      AND type = 'payout'
      AND status = 'pending'
    `;
    const totalPendingPayouts = Number((totalPendingPayoutsResult as any)[0].sum);

    const totalPendingFeesResult = await prisma.$queryRaw`
      SELECT COALESCE(SUM(amount), 0) as sum FROM "Transaction"
      WHERE "userId" = ${user.id}
      AND type = 'fee'
      AND status = 'pending'
    `;
    const totalPendingFees = Number((totalPendingFeesResult as any)[0].sum);

    const pendingBalance = totalPendingIncome - totalPendingPayouts - totalPendingFees;

    const availableBalance = currentBalance + pendingBalance;

    return NextResponse.json({
      transactions,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
      summary: {
        totalIncome,
        totalPayouts,
        totalFees,
        currentBalance,
        totalPendingIncome,
        totalPendingPayouts,
        totalPendingFees,
        availableBalance,
      },
    });
  } catch (error) {
    // More detailed error logging
    console.error('Error fetching ledger:', error);
    
    // Check for specific error types
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      // Handle specific database errors
      if (error.message.includes('relation') && error.message.includes('does not exist')) {
        return NextResponse.json(
          { error: 'Database table does not exist. Please run migrations.' },
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
