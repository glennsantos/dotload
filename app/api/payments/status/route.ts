import { NextRequest, NextResponse } from 'next/server';
import { checkPaymentRequestStatus } from '@/lib/xendit-client';
import { updatePurchaseStatus, getPurchaseById } from '@/lib/purchase-utils';
import { sendPurchaseConfirmationEmail } from '@/lib/email';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Get the purchase ID from the query parameters
    const searchParams = request.nextUrl.searchParams;
    const purchaseId = searchParams.get('purchaseId');
    
    if (!purchaseId) {
      return NextResponse.json({ error: 'Purchase ID is required' }, { status: 400 });
    }

    console.log(`[Payment Status] Checking status for purchase ID: ${purchaseId}`);
    
    // Find the purchase and get the payment ID
    const purchase = await getPurchaseById(purchaseId);
    
    if (!purchase) {
      return NextResponse.json({ error: 'Purchase not found' }, { status: 404 });
    }
    
    // Get the payment ID from the purchase or from the transaction
    let paymentId = purchase.paymentId;
    
    // If no payment ID on the purchase, check the transaction
    if (!paymentId) {
      const transaction = await prisma.transaction.findFirst({
        where: {
          reference: { not: null },
          purchase: {
            id: purchaseId
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
      
      if (transaction?.reference) {
        paymentId = transaction.reference;
      }
    }
    
    if (!paymentId) {
      return NextResponse.json({ error: 'No payment ID found for this purchase' }, { status: 404 });
    }
    
    console.log(`[Payment Status] Found payment ID: ${paymentId}`);
    
    // Check the payment status using Xendit API
    const paymentData = await checkPaymentRequestStatus(paymentId);
    
    if (!paymentData) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }
    
    console.log(`[Payment Status] Payment status: ${paymentData.status}`);
    
    // If we have a purchase ID and the payment status is SUCCEEDED, update the purchase status
    if (purchaseId && paymentData.status === 'SUCCEEDED') {
      console.log(`[Payment Status] Updating purchase ${purchaseId} to completed`);
      
      // Update the purchase status to completed
      await updatePurchaseStatus(purchaseId, 'completed', paymentId);
      
      // Get the purchase details to send an email
      const purchase = await getPurchaseById(purchaseId);
      
      if (purchase) {
        // Update the transaction status if it exists
        const transaction = await prisma.transaction.findFirst({
          where: {
            reference: paymentId
          }
        });
        
        if (transaction) {
          await prisma.transaction.update({
            where: { id: transaction.id },
            data: {
              status: 'completed'
            }
          });
        }
        
        // Send a confirmation email with the download link
        try {
          const productSlug = purchase.product.slug || purchase.product.id;
          
          await sendPurchaseConfirmationEmail(
            purchase.email,
            purchase.product.name,
            purchase.accessCode,
            productSlug,
            purchase.amount,
            purchase.currency,
            'completed' // Indicate that this is a completed payment
          );
          
          console.log(`[Payment Status] Confirmation email sent to ${purchase.email}`);
        } catch (emailError) {
          console.error('[Payment Status] Error sending confirmation email:', emailError);
          // Continue processing even if email fails
        }
      }
    }
    
    // Return the payment status and data
    return NextResponse.json({
      success: true,
      status: paymentData.status,
      paymentData: {
        id: paymentData.id,
        status: paymentData.status,
        amount: paymentData.amount,
        currency: paymentData.currency,
        reference_id: paymentData.reference_id,
        created: paymentData.created,
        updated: paymentData.updated
      }
    });
    
  } catch (error) {
    console.error('[Payment Status] Error checking payment status:', error);
    return NextResponse.json(
      { error: 'Failed to check payment status', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
