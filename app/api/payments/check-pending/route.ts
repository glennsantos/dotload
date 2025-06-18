import { NextRequest, NextResponse } from 'next/server';
import { checkPaymentRequestStatus } from '@/lib/xendit-client';
import { updatePurchaseStatus, getPurchaseById } from '@/lib/purchase-utils';
import { sendPurchaseConfirmationEmail } from '@/lib/email';
import { supabaseTransactionService } from '@/lib/supabase-db';

export async function POST(request: NextRequest) {
  try {
    // Get the purchase IDs from the request body
    const { purchaseIds } = await request.json();
    
    if (!purchaseIds || !Array.isArray(purchaseIds) || purchaseIds.length === 0) {
      return NextResponse.json({ error: 'Purchase IDs are required' }, { status: 400 });
    }

    console.log(`[Check Pending] Checking status for ${purchaseIds.length} pending purchases`);
    
    const results = [];
    const updatedPurchases = [];
    
    // Process each purchase ID
    for (const purchaseId of purchaseIds) {
      try {
        // Find the purchase and get the payment ID
        const purchase = await getPurchaseById(purchaseId);
        
        if (!purchase) {
          results.push({ purchaseId, success: false, error: 'Purchase not found' });
          continue;
        }
        
        // Skip if already completed
        if (purchase.status === 'completed') {
          results.push({ purchaseId, success: true, status: 'completed', message: 'Already completed' });
          continue;
        }
        
        // Get the payment ID from the purchase or from the transaction
        let paymentId = purchase.paymentId;
        
        // If no payment ID on the purchase, check the transaction using Supabase
        if (!paymentId) {
          const transaction = await supabaseTransactionService.findTransactionByPurchaseId(purchaseId);
          
          if (transaction?.reference) {
            paymentId = transaction.reference;
          }
        }
        
        if (!paymentId) {
          results.push({ purchaseId, success: false, error: 'No payment ID found for this purchase' });
          continue;
        }
        
        console.log(`[Check Pending] Found payment ID: ${paymentId} for purchase ${purchaseId}`);
        
        // Check the payment status using Xendit API
        const paymentData = await checkPaymentRequestStatus(paymentId);
        
        if (!paymentData) {
          results.push({ purchaseId, success: false, error: 'Payment not found' });
          continue;
        }
        
        console.log(`[Check Pending] Payment status for ${purchaseId}: ${paymentData.status}`);
        
        // If the payment status is SUCCEEDED, update the purchase status
        if (paymentData.status === 'SUCCEEDED') {
          console.log(`[Check Pending] Updating purchase ${purchaseId} to completed`);
          
          // Update the purchase status to completed
          await updatePurchaseStatus(purchaseId, 'completed', paymentId);
          
          // Update the transaction status if it exists using Supabase
          const transaction = await supabaseTransactionService.findTransactionByReference(paymentId);
          
          if (transaction) {
            await supabaseTransactionService.updateTransaction((transaction as any).id, {
              status: 'completed'
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
            
            console.log(`[Check Pending] Confirmation email sent to ${purchase.email}`);
          } catch (emailError) {
            console.error('[Check Pending] Error sending confirmation email:', emailError);
            // Continue processing even if email fails
          }
          
          // Add to the list of updated purchases
          updatedPurchases.push(purchaseId);
          
          results.push({ 
            purchaseId, 
            success: true, 
            status: 'completed', 
            message: 'Purchase status updated to completed' 
          });
        } else {
          // For other statuses, just return the current status
          results.push({ 
            purchaseId, 
            success: true, 
            status: paymentData.status, 
            message: `Payment status is ${paymentData.status}` 
          });
        }
      } catch (error) {
        console.error(`[Check Pending] Error processing purchase ${purchaseId}:`, error);
        results.push({ 
          purchaseId, 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }
    
    // Return the results
    return NextResponse.json({
      success: true,
      results,
      updatedPurchases
    });
    
  } catch (error) {
    console.error('[Check Pending] Error checking pending purchases:', error);
    
    // Handle specific Supabase errors
    if (error instanceof Error && error.message.includes('Failed to')) {
      return NextResponse.json(
        { error: 'Database error occurred while checking pending purchases', details: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to check pending purchases', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
