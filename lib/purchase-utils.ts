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
  mobileNumber,
  amount,
  currency = 'PHP',
  paymentMethod,
}: {
  productId: string;
  email: string;
  mobileNumber: string;
  amount: number;
  currency?: string;
  paymentMethod: string;
}) => {
  try {
    const accessCode = generateAccessCode();
    
    const purchase = await prisma.purchase.create({
      data: {
        email,
        mobileNumber,
        amount,
        currency,
        paymentMethod,
        status: 'pending',
        accessCode,
        productId,
      },
    });
    
    return purchase;
  } catch (error) {
    console.error('Error creating purchase:', error);
    throw error;
  }
};

// Update purchase status after payment
export const updatePurchaseStatus = async (
  purchaseId: string,
  status: 'pending' | 'completed' | 'failed',
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
            user: true
          }
        },
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
            user: true
          }
        },
      },
    });
    
    return purchase;
  } catch (error) {
    console.error('Error getting purchase by ID:', error);
    throw error;
  }
};
