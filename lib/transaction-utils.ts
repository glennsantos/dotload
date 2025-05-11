import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type TransactionType = 'income' | 'payout' | 'fee';
type TransactionStatus = 'completed' | 'pending' | 'failed';

interface CreateTransactionParams {
  userId: string;
  amount: number;
  currency?: string;
  type: TransactionType;
  status: TransactionStatus;
  description: string;
  reference?: string;
  referenceType?: string;
  metadata?: any;
}

/**
 * Create a new transaction in the ledger
 */
export async function createTransaction(data: CreateTransactionParams) {
  try {
    const { metadata, ...rest } = data;
    
    const transaction = await prisma.transaction.create({
      data: {
        ...rest,
        currency: data.currency || 'PHP',
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });
    
    return transaction;
  } catch (error) {
    console.error('Error creating transaction:', error);
    throw error;
  }
}

/**
 * Create income transaction when a purchase is completed
 * @param buyerId - ID of the user making the purchase
 * @param sellerId - ID of the user who owns the product
 * @param purchaseId - ID of the purchase
 * @param amount - Amount of the purchase
 * @param currency - Currency of the purchase (default: PHP)
 * @param productName - Name of the product purchased
 */
export async function createPurchaseTransaction(
  buyerId: string,
  sellerId: string,
  purchaseId: string,
  amount: number,
  currency: string = 'PHP',
  productName: string
) {
  // Create purchase transaction for the buyer
  await createTransaction({
    userId: buyerId,
    amount: -amount, // Negative amount for purchase
    currency,
    type: 'income',
    status: 'completed',
    description: `Purchase of ${productName}`,
    reference: purchaseId,
    referenceType: 'purchase',
    metadata: { purchaseId, type: 'purchase' },
  });

  // Create income transaction for the seller
  return createTransaction({
    userId: sellerId,
    amount,
    currency,
    type: 'income',
    status: 'completed',
    description: `Sale of ${productName}`,
    reference: purchaseId,
    referenceType: 'purchase',
    metadata: { purchaseId, type: 'sale' },
  });
}

/**
 * Create payout transaction when a payout is requested
 */
export async function createPayoutTransaction(
  userId: string,
  payoutId: string,
  amount: number,
  currency: string = 'PHP',
  status: TransactionStatus = 'pending'
) {
  return createTransaction({
    userId,
    amount,
    currency,
    type: 'payout',
    status,
    description: 'Payout request',
    reference: payoutId,
    referenceType: 'payout',
    metadata: { payoutId },
  });
}

/**
 * Create fee transaction for payout processing fee
 */
export async function createFeeTransaction(
  userId: string,
  payoutId: string,
  amount: number,
  currency: string = 'PHP'
) {
  return createTransaction({
    userId,
    amount,
    currency,
    type: 'fee',
    status: 'completed',
    description: 'Payout processing fee (5%)',
    reference: payoutId,
    referenceType: 'fee',
    metadata: { payoutId, feeType: 'payout_processing' },
  });
}

/**
 * Update transaction status
 */
export async function updateTransactionStatus(
  id: string,
  status: TransactionStatus
) {
  return prisma.transaction.update({
    where: { id },
    data: { status },
  });
}

/**
 * Get user's current balance
 */
export async function getUserBalance(userId: string) {
  // Calculate summary statistics using raw SQL queries
  const totalIncomeResult = await prisma.$queryRaw`
    SELECT COALESCE(SUM(amount), 0) as sum FROM "Transaction"
    WHERE "userId" = ${userId}
    AND type = 'income'
    AND status = 'completed'
  `;
  const totalIncome = Number((totalIncomeResult as any)[0].sum);

  const totalPayoutsResult = await prisma.$queryRaw`
    SELECT COALESCE(SUM(amount), 0) as sum FROM "Transaction"
    WHERE "userId" = ${userId}
    AND type = 'payout'
    AND status = 'completed'
  `;
  const totalPayouts = Number((totalPayoutsResult as any)[0].sum);

  const totalFeesResult = await prisma.$queryRaw`
    SELECT COALESCE(SUM(amount), 0) as sum FROM "Transaction"
    WHERE "userId" = ${userId}
    AND type = 'fee'
    AND status = 'completed'
  `;
  const totalFees = Number((totalFeesResult as any)[0].sum);

  // Calculate current balance
  const currentBalance = totalIncome - totalPayouts - totalFees;

  return {
    totalIncome,
    totalPayouts,
    totalFees,
    currentBalance,
  };
}
