import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

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
    const decoded = jwt.verify(token, jwtSecret) as { id: string, email: string };

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

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: { products: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Calculate available balance (this is a simplified example)
    // In a real app, you would calculate this based on sales minus previous payouts
    const purchases = await prisma.purchase.findMany({
      where: {
        product: {
          userId: user.id,
        },
        status: 'completed',
      },
    });

    const totalEarnings = purchases.reduce((sum: number, purchase: any) => sum + purchase.amount, 0);
    
    // Get previous payouts
    const previousPayouts = await prisma.payout.findMany({
      where: {
        userId: user.id,
      },
    });
    
    const totalPaidOut = previousPayouts.reduce((sum: number, payout: any) => sum + payout.amount, 0);
    
    // Calculate available balance
    const availableBalance = totalEarnings - totalPaidOut;

    // Check if user has enough balance
    if (amount > availableBalance) {
      return NextResponse.json(
        { error: 'Insufficient balance', availableBalance },
        { status: 400 }
      );
    }

    // Create a disbursement request with Xendit
    const externalId = `payout-${user.id}-${Date.now()}`;
    
    // Create a payout record in the database
    const payout = await prisma.payout.create({
      data: {
        userId: user.id,
        amount,
        status: 'pending',
        externalId,
        bankCode,
        accountNumber,
        accountHolderName,
      },
    });

    // Create the disbursement with Xendit
    const disbursement = await xenditClient.disbursement.create({
      externalID: externalId,
      amount,
      bankCode,
      accountHolderName,
      accountNumber,
      description: `Payout for ${user.name || user.email}`,
    });

    // Update the payout record with the disbursement ID
    await prisma.payout.update({
      where: { id: payout.id },
      data: {
        disbursementId: disbursement.id,
        status: disbursement.status.toLowerCase(),
      },
    });

    return NextResponse.json({
      success: true,
      payout: {
        id: payout.id,
        amount,
        status: disbursement.status.toLowerCase(),
        createdAt: payout.createdAt,
      },
    });
  } catch (error) {
    console.error('Error processing payout:', error);
    return NextResponse.json(
      { error: 'Failed to process payout request' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get the authenticated user from JWT token in cookies
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const jwtSecret = process.env.JWT_SECRET || 'your-jwt-secret-key';
    const decoded = jwt.verify(token, jwtSecret) as { id: string, email: string };

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get user's payouts
    const payouts = await prisma.payout.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calculate available balance
    const purchases = await prisma.purchase.findMany({
      where: {
        product: {
          userId: user.id,
        },
        status: 'completed',
      },
    });

    const totalEarnings = purchases.reduce((sum: number, purchase: any) => sum + purchase.amount, 0);
    const totalPaidOut = payouts
      .filter((p: any) => p.status === 'completed')
      .reduce((sum: number, payout: any) => sum + payout.amount, 0);
    
    const availableBalance = totalEarnings - totalPaidOut;

    return NextResponse.json({
      payouts,
      balance: {
        total: totalEarnings,
        available: availableBalance,
        pending: payouts
          .filter((p: any) => p.status === 'pending')
          .reduce((sum: number, payout: any) => sum + payout.amount, 0),
      },
    });
  } catch (error) {
    console.error('Error fetching payouts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payout information' },
      { status: 500 }
    );
  }
}
