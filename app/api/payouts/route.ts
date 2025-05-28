import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { calculateProcessingFee } from '@/lib/fee-utils';
import { Transaction } from '@prisma/client';

// Define types for metadata
type PayoutMetadata = {
  bankCode?: string;
  accountNumber?: string;
  accountHolderName?: string;
  [key: string]: any;
};

// Define formatted payout type
type FormattedPayout = {
  id: string;
  amount: number;
  status: string;
  createdAt: Date;
  bankCode: string;
  accountNumber: string;
  accountHolderName: string;
};

export async function GET(request: NextRequest) {
  try {
    // Get the authenticated user
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get transactions to calculate balances
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
      AND (status = 'completed' OR status = 'pending')
    `;
    const totalPayouts = Number((totalPayoutsResult as any)[0].sum);

    const totalFeesResult = await prisma.$queryRaw`
      SELECT COALESCE(SUM(amount), 0) as sum FROM "Transaction"
      WHERE "userId" = ${user.id}
      AND type = 'fee'
      AND status = 'completed'
    `;
    const totalFees = Number((totalFeesResult as any)[0].sum);
    
    // Calculate balances
    const totalBalance = totalIncome - totalPayouts - totalFees;
    
    // For available balance, we need to consider pending transactions
    // and any minimum balance requirements
    const pendingPayoutsResult = await prisma.$queryRaw`
      SELECT COALESCE(SUM(amount), 0) as sum FROM "Transaction"
      WHERE "userId" = ${user.id}
      AND type = 'payout'
      AND status = 'pending'
    `;
    const pendingPayouts = Number((pendingPayoutsResult as any)[0].sum);
    
    // Available balance is total balance minus pending payouts
    const availableBalance = totalBalance - pendingPayouts;
    
    // Get payout history
    const payouts = await prisma.transaction.findMany({
      where: {
        userId: user.id,
        type: 'payout',
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 20,
    });
    
    // Format the payouts for the frontend
    const formattedPayouts: FormattedPayout[] = payouts.map((payout: Transaction) => {
      // Extract metadata if available
      const metadata = payout.metadata ? 
        (typeof payout.metadata === 'string' ? JSON.parse(payout.metadata) : payout.metadata) : 
        {};
      
      return {
        id: payout.id,
        amount: payout.amount,
        status: payout.status,
        createdAt: payout.createdAt,
        bankCode: metadata.bankCode || 'N/A',
        accountNumber: metadata.accountNumber || 'N/A',
        accountHolderName: metadata.accountHolderName || 'N/A',
      };
    });
    
    return NextResponse.json({
      balance: {
        total: totalBalance,
        available: availableBalance,
        pending: pendingPayouts,
      },
      payouts: formattedPayouts,
    });
  } catch (error) {
    console.error('Error fetching payout data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payout data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get the authenticated user
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse request body
    const data = await request.json();
    const { amount, bankCode, accountNumber, accountHolderName } = data;
    
    // Validate required fields
    if (!amount || !bankCode || !accountNumber || !accountHolderName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Forward to the transactions/payout endpoint
    const payoutResponse = await fetch(`${request.nextUrl.origin}/api/transactions/payout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('cookie') || '',
      },
      body: JSON.stringify({
        amount,
        bankCode,
        accountNumber,
        accountHolderName,
      }),
    });
    
    if (!payoutResponse.ok) {
      const errorData = await payoutResponse.json();
      return NextResponse.json(
        { error: errorData.error || 'Failed to process payout' },
        { status: payoutResponse.status }
      );
    }
    
    const payoutResult = await payoutResponse.json();
    
    return NextResponse.json(payoutResult);
  } catch (error) {
    console.error('Error processing payout:', error);
    return NextResponse.json(
      { error: 'Failed to process payout request' },
      { status: 500 }
    );
  }
}
