import { prisma } from './prisma';
import crypto from 'crypto';

// Generate a unique access code for product purchases
export const generateAccessCode = (): string => {
  return crypto.randomBytes(16).toString('hex');
};

// Create a new purchase record
export const createPurchase = async ({
  productId,
  email,
  mobileNumber = '',
  amount,
  currency = 'PHP',
  paymentMethod,
  userId,
}: {
  productId: string;
  email: string;
  mobileNumber?: string;
  amount: number;
  currency?: string;
  paymentMethod: string;
  userId?: string;
}) => {
  // Enhanced logging utility for debugging
  const logPurchaseUtilStep = (step: string, data?: any, error?: any) => {
    const timestamp = new Date().toISOString();
    const logPrefix = `[PurchaseUtils][${timestamp}]`;
    
    if (error) {
      console.error(`${logPrefix} ERROR in ${step}:`, error);
      if (data) console.error(`${logPrefix} Context data:`, data);
    } else {
      console.log(`${logPrefix} ${step}`, data ? data : '');
    }
  };

  try {
    logPurchaseUtilStep('CREATE_PURCHASE_START', {
      productId,
      email,
      mobileNumber,
      amount,
      currency,
      paymentMethod,
      userId
    });

    const accessCode = generateAccessCode();
    logPurchaseUtilStep('ACCESS_CODE_GENERATED', { accessCode });
    
    const purchaseData = {
      email,
      mobileNumber,
      amount,
      currency,
      paymentMethod,
      status: 'pending',
      accessCode,
      productId,
      userId,
    };
    
    logPurchaseUtilStep('PURCHASE_DATA_PREPARED', purchaseData);
    
    const purchase = await prisma.purchase.create({
      data: purchaseData,
    });
    
    logPurchaseUtilStep('PURCHASE_CREATE_SUCCESS', {
      purchaseId: purchase.id,
      accessCode: purchase.accessCode,
      status: purchase.status,
      amount: purchase.amount
    });
    
    return purchase;
  } catch (error) {
    const logPurchaseUtilStep = (step: string, data?: any, error?: any) => {
      const timestamp = new Date().toISOString();
      const logPrefix = `[PurchaseUtils][${timestamp}]`;
      
      if (error) {
        console.error(`${logPrefix} ERROR in ${step}:`, error);
        if (data) console.error(`${logPrefix} Context data:`, data);
      } else {
        console.log(`${logPrefix} ${step}`, data ? data : '');
      }
    };

    logPurchaseUtilStep('CREATE_PURCHASE_ERROR', {
      productId,
      email,
      amount,
      currency,
      paymentMethod,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      errorStack: error instanceof Error ? error.stack : undefined
    }, error);
    
    throw error;
  }
};

// Update purchase status after payment
export const updatePurchaseStatus = async (
  purchaseId: string,
  status: 'pending' | 'completed' | 'failed' | 'awaiting_capture' | 'succeeded',
  paymentId?: string
) => {
  try {
    const purchase = await prisma.purchase.update({
      where: {
        id: purchaseId,
      },
      data: {
        status,
        ...(paymentId && { paymentId }),
      },
    });
    
    return purchase;
  } catch (error) {
    console.error('Error updating purchase status:', error);
    throw error;
  }
};

// Get purchase by access code
export const getPurchaseByAccessCode = async (accessCode: string) => {
  try {
    const purchase = await prisma.purchase.findUnique({
      where: {
        accessCode,
      },
      include: {
        product: {
          include: {
            user: true,
            files: true // Include files in the product query
          }
        },
        user: true,
      },
    });
    
    return purchase;
  } catch (error) {
    console.error('Error getting purchase by access code:', error);
    throw error;
  }
};

// Get purchases by product ID
export const getPurchasesByProductId = async (productId: string) => {
  try {
    const purchases = await prisma.purchase.findMany({
      where: {
        productId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    return purchases;
  } catch (error) {
    console.error('Error getting purchases by product ID:', error);
    throw error;
  }
};

// Get purchase by ID
export const getPurchaseById = async (id: string) => {
  try {
    const purchase = await prisma.purchase.findUnique({
      where: {
        id,
      },
      include: {
        product: {
          include: {
            user: true,
            files: true // Include files in the product query
          }
        },
        user: true,
      },
    });
    
    return purchase;
  } catch (error) {
    console.error('Error getting purchase by ID:', error);
    throw error;
  }
};
