import { NextRequest, NextResponse } from 'next/server';
import { getPurchaseById, updatePurchaseStatus } from '@/lib/purchase-utils';
import { sendPurchaseConfirmationEmail } from '@/lib/email';
import { createOneTimePayment } from '@/lib/xendit-client';
import { prisma } from '@/lib/prisma';

// Xendit API base URL
const XENDIT_API_URL = 'https://api.xendit.co';

// Define the metadata type for transactions
type TransactionMetadata = {
  customerId?: string;
  channelCode?: string;
  flowType?: string;
  chargeId?: string;
}

export async function POST(request: NextRequest) {
  console.log('[Xendit Direct Debit] Starting payment process');
  try {
    const body = await request.json();
    const { 
      purchaseId, 
      amount,
      currency = 'PHP',
      channelCode,
      mobileNumber,
      cardLastFour,
      cardExpiry,
      email,
      identityDocumentNumber
    } = body;
    
    console.log(`[Xendit Direct Debit] Request received for purchase ${purchaseId}, channel: ${channelCode}, amount: ${amount} ${currency}`);
    
    if (!purchaseId || !channelCode || !amount) {
      console.log('[Xendit Direct Debit] Missing required fields', { purchaseId, channelCode, amount });
      return NextResponse.json({ 
        error: 'Missing required fields',
        details: 'Purchase ID, channel code, and amount are required'
      }, { status: 400 });
    }
    
    // Validate channel-specific required fields
    if (channelCode === 'BRI' && (!mobileNumber || !cardLastFour || !email)) {
      console.log('[Xendit Direct Debit] Missing required fields for BRI', { mobileNumber, cardLastFour, email });
      return NextResponse.json({ 
        error: 'Missing required fields',
        details: 'Mobile number, card last four digits, and email are required for BRI direct debit'
      }, { status: 400 });
    }
    
    if ((channelCode === 'SCB' || channelCode === 'BBL') && !mobileNumber) {
      console.log('[Xendit Direct Debit] Missing mobile number for SCB/BBL');
      return NextResponse.json({ 
        error: 'Missing mobile number',
        details: 'Mobile number is required for SCB and BBL direct debit'
      }, { status: 400 });
    }
    
    if ((channelCode === 'KTB' || channelCode === 'BAY') && (!mobileNumber || !identityDocumentNumber)) {
      console.log('[Xendit Direct Debit] Missing required fields for KTB/BAY', { mobileNumber, identityDocumentNumber });
      return NextResponse.json({ 
        error: 'Missing required fields',
        details: 'Mobile number and identity document number are required for KTB and BAY direct debit'
      }, { status: 400 });
    }
    
    // Find the purchase
    console.log(`[Xendit Direct Debit] Fetching purchase with ID: ${purchaseId}`);
    const purchase = await getPurchaseById(purchaseId);
    
    if (!purchase) {
      console.log(`[Xendit Direct Debit] Purchase not found with ID: ${purchaseId}`);
      return NextResponse.json({ 
        error: 'Purchase not found',
        details: 'The requested purchase does not exist'
      }, { status: 404 });
    }
    
    // Base URL for redirects
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? `https://${request.headers.get('host')}`
      : `http://${request.headers.get('host')}`;
    
    console.log(`[Xendit Direct Debit] Using base URL: ${baseUrl}`);
    
    // Generate success and failure URLs
    const productSlug = purchase.product.slug || purchase.product.id;
    
    // Success URL includes access code to view the product content
    const successUrl = `${baseUrl}/p/${productSlug}/success?code=${purchase.accessCode}`;
    console.log(`[Xendit Direct Debit] Success URL: ${successUrl}`);
    
    // Failure URL redirects back to checkout with error message
    const failureUrl = `${baseUrl}/p/${productSlug}/failure?error=payment_failed`;
    console.log(`[Xendit Direct Debit] Failure URL: ${failureUrl}`);
    
    // Cancellation URL redirects to failure page with cancelled message
    const cancelUrl = `${baseUrl}/p/${productSlug}/failure?error=payment_cancelled`;
    console.log(`[Xendit Direct Debit] Cancel URL: ${cancelUrl}`);
    
    // Generate webhook callback URL for payment notifications
    const callbackUrl = `${baseUrl}/api/webhooks/xendit`;
    
    // Process direct debit payment
    try {
      // Create a transaction record
      const transaction = await prisma.transaction.create({
        data: {
          amount,
          currency: currency,
          type: 'payment',
          status: 'pending',
          description: `${channelCode} direct debit payment for purchase ${purchase.id}`,
          reference: purchase.id,
          referenceType: 'Purchase',
          metadata: JSON.stringify({
            paymentMethod: 'direct_debit',
            channelCode: channelCode,
            flowType: 'one-time',
            mobileNumber: mobileNumber,
            purchaseId: purchase.id
          }),
          userId: purchase.product.userId // Use the product's userId since purchase.userId might be null for guest purchases
        }
      });
      
      console.log(`[Xendit Direct Debit] Transaction created with ID: ${transaction.id}`);
      
      try {
        // Generate a unique reference ID for this payment
        const referenceId = `purchase_${purchase.id}_${Date.now()}`;
        
        // Prepare direct debit info based on channel code
        const directDebitInfo: any = {
          mobileNumber,
          email
        };
        
        // Add channel-specific fields
        if (channelCode === 'BRI') {
          directDebitInfo.cardLastFour = cardLastFour;
          if (cardExpiry) {
            directDebitInfo.cardExpiry = cardExpiry;
          }
        } else if (channelCode === 'KTB' || channelCode === 'BAY') {
          directDebitInfo.identityDocumentNumber = identityDocumentNumber;
        }
        
        // Create the one-time payment request
        const paymentData = await createOneTimePayment({
          referenceId,
          amount,
          currency,
          country: 'PH',
          paymentMethodType: 'DIRECT_DEBIT',
          channelCode,
          successReturnUrl: successUrl,
          failureReturnUrl: failureUrl,
          cancelReturnUrl: cancelUrl,
          customerInfo: {
            email: purchase.email,
            name: purchase.name || purchase.email,
            mobileNumber: mobileNumber
          },
          directDebitInfo
        });
        
        console.log(`[Xendit Direct Debit] One-time payment request created:`, paymentData);
        
        // Extract the redirect URL from the actions array
        let redirectUrl = '';
        
        // The response will contain actions array with redirect URLs
        if (paymentData.actions && Array.isArray(paymentData.actions)) {
          const checkoutAction = paymentData.actions.find(
            (action: any) => action.action === 'AUTH'
          );
          
          if (checkoutAction && checkoutAction.url) {
            redirectUrl = checkoutAction.url;
          }
        }
        
        if (!redirectUrl) {
          throw new Error('No redirect URL found in payment response');
        }
        
        // Update the transaction with payment request details
        await prisma.transaction.update({
          where: { id: transaction.id },
          data: {
            reference: paymentData.id,
            metadata: JSON.stringify({
              paymentMethod: 'direct_debit',
              channelCode: channelCode,
              paymentId: paymentData.id,
              referenceId: referenceId,
              flowType: 'one-time',
              mobileNumber: mobileNumber,
            })
          }
        });
        
        // Update purchase status to pending
        await updatePurchaseStatus(purchase.id, 'pending', paymentData.id);
        
        // Send pending payment email notification
        try {
          const productSlug = purchase.product.slug || purchase.product.id;
          
          await sendPurchaseConfirmationEmail(
            purchase.email,
            purchase.product.name,
            purchase.accessCode,
            productSlug,
            purchase.amount,
            purchase.currency,
            'pending' // Indicate that this is a pending payment
          );
          
          console.log(`[Xendit Direct Debit] Pending payment notification email sent to ${purchase.email}`);
        } catch (emailError) {
          console.error('[Xendit Direct Debit] Error sending pending payment notification email:', emailError);
          // Continue processing even if email fails
        }
        
        // Return the redirect URL to the client
        return NextResponse.json({
          success: true,
          actionUrl: redirectUrl,
          paymentId: paymentData.id
        });
      } catch (paymentError) {
        console.error('[Xendit Direct Debit] One-time payment creation error:', paymentError);
        
        // Update transaction to failed status
        await prisma.transaction.update({
          where: { id: transaction.id },
          data: {
            status: 'FAILED',
            metadata: JSON.stringify({
              paymentMethod: 'direct_debit',
              channelCode: channelCode,
              flowType: 'one-time',
              error: paymentError instanceof Error ? paymentError.message : 'Unknown error'
            })
          }
        });
        
        // Update purchase status to failed
        await prisma.purchase.update({
          where: { id: purchase.id },
          data: {
            status: 'failed'
          }
        });
        
        return NextResponse.json({ 
          error: 'Direct debit payment creation failed', 
          details: paymentError instanceof Error ? paymentError.message : 'Unknown error'
        }, { status: 500 });
      }
    } catch (error) {
      console.error('[Xendit Direct Debit] Error creating transaction record for direct debit payment:', error);
      throw error;
    }
  } catch (error) {
    console.error('[Xendit Direct Debit] Payment creation error:', error);
    return NextResponse.json({ 
      error: 'Failed to create payment', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
