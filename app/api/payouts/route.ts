import { NextRequest, NextResponse } from 'next/server';
import { supabaseTransactionService } from '@/lib/supabase-db';
import { getCurrentUser } from '@/lib/auth';
import { calculateProcessingFee } from '@/lib/fee-utils';

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
    
    // Get transaction summary from Supabase
    const transactionSummary = await supabaseTransactionService.getTransactionSummary(user.id);
    
    // Calculate balances from the summary
    const totalIncome = transactionSummary.totalIncome;
    const totalPayouts = transactionSummary.totalPayouts;
    const totalFees = transactionSummary.totalFees;
    const pendingPayouts = transactionSummary.pendingPayouts;
    
    // Calculate balances
    const totalBalance = totalIncome - totalPayouts - totalFees;
    const availableBalance = totalBalance - pendingPayouts;
    
    // Get payout history using Supabase
    const payouts = await supabaseTransactionService.getTransactionsByUserId(user.id, {
      type: 'payout',
      limit: 20,
      orderBy: 'createdAt',
      sortOrder: 'desc'
    });
    
    // Format the payouts for the frontend
    const formattedPayouts: FormattedPayout[] = payouts.map((payout: any) => {
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
      { error: 'Failed to process payout request' },
      { status: 500 }
    );
  }
}
