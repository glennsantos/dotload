import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { createTransaction } from '../route';

const prisma = new PrismaClient();

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
    const { amount, bankCode, accountNumber, accountHolderName, processingFee } = data;

    // Validate required fields
    if (!amount || !bankCode || !accountNumber || !accountHolderName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { products: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get transactions to calculate available balance
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

    // Calculate available balance
    const availableBalance = totalIncome - totalPayouts - totalFees;

    // Check if user has enough balance
    if (amount > availableBalance) {
      return NextResponse.json(
        { error: 'Insufficient balance', availableBalance },
        { status: 400 }
      );
    }

    // Create a payout request with Xendit
    const referenceId = `payout-${user.id}-${Date.now()}`;
    
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
      amount,
      currency: 'PHP',
      description: `Payout for ${user.name || user.email}`,
      receipt_notification: {
        email_to: [user.email],
        email_cc: ['admin@alacarte.com']
      }
    };
    
    console.log('Xendit payout request:', payoutRequest);
    
    // Call Xendit API directly to create the payout
    const idempotencyKey = `payout-idempotency-${user.id}-${Date.now()}`;
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

    // Create a payout transaction
    const payoutTransaction = await createTransaction({
      userId: user.id,
      amount,
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
        accountHolderName
      }
    });

    // Create a fee transaction for the processing fee
    const feeTransaction = await createTransaction({
      userId: user.id,
      amount: processingFee,
      currency: 'PHP',
      type: 'fee',
      status: 'pending',
      description: 'Payout processing fee (5%)',
      reference: disbursement.id,
      referenceType: 'fee',
      metadata: {
        payoutId: disbursement.id,
        referenceId,
        feeType: 'payout_processing'
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
