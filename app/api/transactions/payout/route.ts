import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { createTransaction } from '../route';

const prisma = new PrismaClient();

// We'll use a type-safe approach with Xendit
type XenditDisbursement = {
  create: (params: {
    externalID: string;
    amount: number;
    bankCode: string;
    accountHolderName: string;
    accountNumber: string;
    description: string;
  }) => Promise<{
    id: string;
    status: string;
  }>;
};

// Mock Xendit client for development
const xenditClient = {
  disbursement: {
    create: async (params: any) => {
      console.log('Xendit disbursement request:', params);
      // Simulate a successful disbursement
      return {
        id: `disbursement-${Date.now()}`,
        status: 'PENDING',
      };
    }
  } as XenditDisbursement
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

    // Create a disbursement request with Xendit
    const externalId = `payout-${user.id}-${Date.now()}`;
    
    // Create the disbursement with Xendit
    const disbursement = await xenditClient.disbursement.create({
      externalID: externalId,
      amount,
      bankCode,
      accountHolderName,
      accountNumber,
      description: `Payout for ${user.name || user.email}`,
    });

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
        disbursementId: disbursement.id,
        externalId,
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
        disbursementId: disbursement.id,
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
