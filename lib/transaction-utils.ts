import { supabaseTransactionService } from '@/lib/supabase-db';

export interface CreateTransactionParams {
  userId: string;
  type: 'income' | 'payout' | 'fee' | 'purchase' | 'payment';
  amount: number;
  description?: string;
  status?: 'pending' | 'completed' | 'failed';
  referenceId?: string;
  currency?: string;
}

// Create a new transaction using Supabase
export const createTransaction = async (params: CreateTransactionParams) => {
  try {
    console.log('[Transaction Utils] Creating transaction:', params);
    
    const transactionData = {
      userId: params.userId,
      type: params.type,
      amount: params.amount,
      description: params.description || `${params.type} transaction`,
      status: params.status || 'pending',
      referenceId: params.referenceId,
      currency: params.currency || 'PHP',
    };
    
    const transaction = await supabaseTransactionService.createTransaction(transactionData);
    
    console.log('[Transaction Utils] Transaction created successfully:', transaction.id);
    return transaction;
  } catch (error) {
    console.error('[Transaction Utils] Error creating transaction:', error);
    throw error;
  }
};

// Create a purchase transaction (wrapper for backwards compatibility)
export const createPurchaseTransaction = async (
  userId: string,
  recipientUserId: string,
  purchaseId: string,
  amount: number,
  currency: string,
  productName: string
) => {
  try {
    console.log('[Transaction Utils] Creating purchase transaction:', {
      userId,
      recipientUserId,
      purchaseId,
      amount,
      currency,
      productName
    });
    
    // Determine transaction type based on user context
    const isIncome = userId !== recipientUserId; // Income if receiving payment from different user
    
    const transactionData: CreateTransactionParams = {
      userId: isIncome ? recipientUserId : userId,
      type: isIncome ? 'income' : 'purchase',
      amount,
      description: `${isIncome ? 'Sale' : 'Purchase'} of ${productName}`,
      status: 'completed',
      referenceId: purchaseId,
      currency,
    };
    
    const transaction = await createTransaction(transactionData);
    
    console.log('[Transaction Utils] Purchase transaction created successfully:', transaction.id);
    return transaction;
  } catch (error) {
    console.error('[Transaction Utils] Error creating purchase transaction:', error);
    throw error;
  }
};

// Update transaction status using Supabase
export const updateTransactionStatus = async (
  transactionId: string,
  status: 'pending' | 'completed' | 'failed'
) => {
  try {
    console.log(`[Transaction Utils] Updating transaction ${transactionId} status to:`, status);
    
    const updatedTransaction = await supabaseTransactionService.updateTransaction(
      transactionId,
      { status }
    );
    
    console.log('[Transaction Utils] Transaction status updated successfully');
    return updatedTransaction;
  } catch (error) {
    console.error('[Transaction Utils] Error updating transaction status:', error);
    throw error;
  }
};

// Get transactions by user ID using Supabase
export const getTransactionsByUserId = async (
  userId: string,
  options?: {
    limit?: number;
    offset?: number;
    type?: string;
    status?: string;
  }
) => {
  try {
    console.log(`[Transaction Utils] Fetching transactions for user:`, userId);
    
    const transactions = await supabaseTransactionService.getTransactionsByUserId(userId, options);
    
    console.log(`[Transaction Utils] Found ${transactions.length} transactions`);
    return transactions;
  } catch (error) {
    console.error('[Transaction Utils] Error fetching transactions:', error);
    throw error;
  }
};

// Get transaction by ID using Supabase
export const getTransactionById = async (transactionId: string) => {
  try {
    console.log(`[Transaction Utils] Fetching transaction:`, transactionId);
    
    const transaction = await supabaseTransactionService.findTransactionById(transactionId);
    
    if (!transaction) {
      throw new Error('Transaction not found');
    }
    
    console.log('[Transaction Utils] Transaction found:', transaction.id);
    return transaction;
  } catch (error) {
    console.error('[Transaction Utils] Error fetching transaction:', error);
    throw error;
  }
};

// Calculate user balance using Supabase
export const calculateUserBalance = async (userId: string) => {
  try {
    console.log(`[Transaction Utils] Calculating balance for user:`, userId);
    
    const summary = await supabaseTransactionService.getTransactionSummary(userId);
    
    console.log('[Transaction Utils] Balance calculated:', summary.currentBalance);
    return summary;
  } catch (error) {
    console.error('[Transaction Utils] Error calculating balance:', error);
    throw error;
  }
};
