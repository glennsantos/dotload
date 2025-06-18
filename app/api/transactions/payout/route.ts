import { NextRequest, NextResponse } from 'next/server';
import { supabaseUserService, supabaseTransactionService } from '@/lib/supabase-db';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { createTransaction } from '@/lib/transaction-utils';
import { calculateProcessingFee, calculateNetAmount, DEFAULT_PAYOUT_FEE_CONFIG } from '@/lib/fee-utils';

// Xendit API configuration
const XENDIT_API_KEY = process.env.XENDIT_API_KEY || 'xnd_development_your_key_here';
const XENDIT_API_URL = 'https://api.xendit.co';

// Define Xendit Payout types based on the documentation
type PayoutChannelCode = 'PH_BDO' | 'PH_BPI' | 'PH_UBP' | 'PH_GCASH';

// Interface for Xendit Payout request
interface XenditPayoutRequest {
  reference_id: string;
  channel_code: PayoutChannelCode;
  channel_properties: {
    account_number: string;
    account_holder_name: string;
  };
  amount: number;
  currency: string;
  description: string;
  receipt_notification?: {
    email_to?: string[];
    email_cc?: string[];
  };
}

// Map our bank codes to Xendit channel codes
const bankCodeMapping: Record<string, PayoutChannelCode> = {
  'BDO': 'PH_BDO',
  'BPI': 'PH_BPI',
  'UBP': 'PH_UBP',
  'GCASH': 'PH_GCASH',
};

export async function POST(request: NextRequest) {
  try {
    // Get the authenticated user from JWT token in cookies
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const jwtSecret = process.env.JWT_SECRET || 'your-jwt-secret-key';
    const decoded = jwt.verify(token, jwtSecret) as { userId: string, email: string, emailVerified?: boolean };

    // Parse request body
    const data = await request.json();
    const { amount, bankCode, accountNumber, accountHolderName, referenceId: clientReferenceId } = data;

    // Validate required fields
    if (!amount || !bankCode || !accountNumber || !accountHolderName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Calculate processing fee dynamically
    const processingFee = calculateProcessingFee(amount);
    const receivedAmount = calculateNetAmount(amount);

    // Log the fee calculation for transparency
    console.log('Payout Fee Calculation:', {
      grossAmount: amount,
      processingFee,
      netAmount: receivedAmount,
      feeConfig: DEFAULT_PAYOUT_FEE_CONFIG
    });

    // Get user from database using Supabase
    const user = await supabaseUserService.findUserById(decoded.userId);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get transaction summary using Supabase for balance calculation
    const transactionSummary = await supabaseTransactionService.getTransactionSummary(decoded.userId);

    // Calculate available balance from transaction summary
    const availableBalance = transactionSummary.totalIncome - transactionSummary.totalPayouts 
      - transactionSummary.totalFees + transactionSummary.totalPurchases + transactionSummary.totalPayments;

    // Check if user has enough balance
    if (amount > availableBalance) {
      return NextResponse.json(
        { error: 'Insufficient balance', availableBalance, processingFee },
        { status: 400 }
      );
    }

    // Create a payout request with Xendit using direct API call
    // Use the client-provided referenceId if available, otherwise generate one
    const referenceId = clientReferenceId || `payout-${(user as any).id}-${Date.now()}`;
    
    // Map our bank code to Xendit channel code
    const channelCode = bankCodeMapping[bankCode];
    if (!channelCode) {
      return NextResponse.json(
        { error: 'Invalid bank code' },
        { status: 400 }
      );
    }
    
    // Create the payout with Xendit using direct API call
    const payoutRequest: XenditPayoutRequest = {
      reference_id: referenceId,
      channel_code: channelCode,
      channel_properties: {
        account_number: accountNumber,
        account_holder_name: accountHolderName,
      },
      amount: receivedAmount,
      currency: 'PHP',
      description: `Payout for ${(user as any).name || (user as any).email}`,
      receipt_notification: {
        email_to: [(user as any).email],
        email_cc: ['alacart@memokitchen.com']
      }
    };
    
    console.log('Xendit payout request:', payoutRequest);
    
    // Call Xendit API directly to create the payout
    const idempotencyKey = `payout-idempotency-${(user as any).id}-${Date.now()}`;
    let disbursement;
    
    try {
      const response = await fetch(`${XENDIT_API_URL}/v2/payouts`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(XENDIT_API_KEY + ':').toString('base64')}`,
          'Content-Type': 'application/json',
          'idempotency-key': idempotencyKey
        },
        body: JSON.stringify(payoutRequest)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Xendit API error:', errorData);
        throw new Error(`Xendit API error: ${response.status} ${response.statusText}`);
      }
      
      const payout = await response.json();
      
      // Extract the payout ID and status
      disbursement = {
        id: payout.id,
        status: payout.status,
      };
    } catch (error) {
      console.error('Error processing Xendit payout:', error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to process payout request' },
        { status: 500 }
      );
    }

    const payoutTransaction = await createTransaction({
      userId: (user as any).id,
      amount: receivedAmount,
      currency: 'PHP',
      type: 'payout',
      status: 'pending',
      description: 'Payout to bank account',
      reference: disbursement.id,
      referenceType: 'payout',
      metadata: {
        payoutId: disbursement.id,
        referenceId,
        channelCode,
        bankCode,
        accountNumber,
        accountHolderName,
        processingFee // Store the processing fee in metadata for reference
      }
    });

    // Create a fee transaction for the processing fee
    // This is a separate transaction to track the fee explicitly
    const feeTransaction = await createTransaction({
      userId: (user as any).id,
      amount: processingFee,
      currency: 'PHP',
      type: 'fee',
      status: 'completed', // Fee is immediately completed since it's deducted right away
      description: 'Payout processing fee',
      reference: disbursement.id,
      referenceType: 'fee',
      metadata: {
        payoutId: disbursement.id,
        referenceId,
        feeType: 'payout_processing',
        grossAmount: amount,
        netAmount: receivedAmount,
        feeConfig: DEFAULT_PAYOUT_FEE_CONFIG
      }
    });

    return NextResponse.json({
      success: true,
      payout: {
        id: payoutTransaction.id,
        amount,
        status: 'pending',
        createdAt: payoutTransaction.createdAt,
        processingFee
      },
    });
  } catch (error) {
    // More detailed error logging
    console.error('Error processing payout:', error);
    
    // Check for specific error types
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      // Handle specific Supabase errors
      if (error.message.includes('Failed to')) {
        return NextResponse.json(
          { error: 'Database error occurred. Please try again.' },
          { status: 500 }
        );
      }
      
      // Handle specific database errors
      if (error.message.includes('relation') && error.message.includes('does not exist')) {
        return NextResponse.json(
          { error: 'Database table does not exist. Please run migrations.' },
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
