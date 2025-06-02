import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Purchase } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all unique customers from purchases
    const purchases = await prisma.purchase.findMany({
      where: {
        OR: [
          { userId: user.id },
          { product: { userId: user.id } }
        ]
      },
      select: {
        id: true,
        email: true,
        mobileNumber: true,
        amount: true,
        currency: true,
        status: true,
        createdAt: true,
        product: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Group purchases by email to get unique customers
    const customerMap = new Map<string, any>();
    
    purchases.forEach((purchase: any) => {
      if (!customerMap.has(purchase.email)) {
        customerMap.set(purchase.email, {
          id: purchase.id, // Using first purchase ID as customer ID
          name: purchase.email.split('@')[0], // Using email prefix as name if no name provided
          email: purchase.email,
          phone: purchase.mobileNumber,
          purchaseCount: 1,
          totalSpend: purchase.amount,
          lastPurchaseDate: purchase.createdAt.toISOString(),
          createdAt: purchase.createdAt.toISOString()
        });
      } else {
        const customer = customerMap.get(purchase.email);
        customer.purchaseCount += 1;
        customer.totalSpend += purchase.amount;
        
        // Update last purchase date if this purchase is more recent
        const purchaseDate = new Date(purchase.createdAt);
        const lastPurchaseDate = new Date(customer.lastPurchaseDate);
        
        if (purchaseDate > lastPurchaseDate) {
          customer.lastPurchaseDate = purchase.createdAt.toISOString();
        }
      }
    });

    const customers = Array.from(customerMap.values());

    return NextResponse.json(customers);
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    );
  }
}
