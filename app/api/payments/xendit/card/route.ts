import { NextRequest, NextResponse } from 'next/server';
import { getPurchaseById, updatePurchaseStatus } from '@/lib/purchase-utils';
import { sendPurchaseConfirmationEmail } from '@/lib/email';
import { createOneTimePayment, checkPaymentRequestStatus, chargeCard } from '@/lib/xendit-client';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  console.log('='.repeat(80));
  console.log('[Xendit Card Payment] Starting card payment process');
  console.log('='.repeat(80));
  try {
    const body = await request.json();
    console.log('[Xendit Card Payment] Request body:', JSON.stringify(body, null, 2));
    
    const { 
      purchaseId,
      tokenId,  // For tokenized payments
      amount,
      currency = 'PHP'
    } = body;
    
    console.log(`[Xendit Card Payment] Request received for purchase ${purchaseId}, amount: ${amount} ${currency}`);
    
    // Validate required fields
    if (!purchaseId || !amount) {
      console.log('[Xendit Card Payment] Missing required fields');
      return NextResponse.json({ 
        error: 'Missing required fields',
        details: 'Purchase ID and amount are required'
      }, { status: 400 });
    }
    
    // Ensure we have a token ID - we only accept tokenized payments
    if (!tokenId) {
      console.log('[Xendit Card Payment] Missing token ID');
      return NextResponse.json({ 
        error: 'Missing token ID',
        details: 'Token ID is required for card payments'
      }, { status: 400 });
    }
    
    console.log('[Xendit Card Payment] Token ID received:', tokenId.substring(0, 8) + '...');
    
    // Reject any request that includes raw card details for security
    if (body.cardNumber || body.cardExpMonth || body.cardExpYear || body.cardCvn) {
      console.log('[Xendit Card Payment] Security warning: Raw card details detected in request');
      return NextResponse.json({ 
        error: 'Security violation',
        details: 'Raw card details should not be sent to the server. Use client-side tokenization only.'
      }, { status: 400 });
    }
    
    // Find the purchase
    console.log(`[Xendit Card Payment] Fetching purchase with ID: ${purchaseId}`);
    const purchase = await getPurchaseById(purchaseId);
    
    console.log('[Xendit Card Payment] Purchase details:', {
      id: purchase?.id,
      productId: purchase?.productId,
      amount: purchase?.amount,
      status: purchase?.status,
      email: purchase?.email
    });
    
    if (!purchase) {
      console.log(`[Xendit Card Payment] Purchase not found with ID: ${purchaseId}`);
      return NextResponse.json({ 
        error: 'Purchase not found',
        details: 'The requested purchase does not exist'
      }, { status: 404 });
    }
    
    // Base URL for redirects
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? `https://${request.headers.get('host')}`
      : `http://${request.headers.get('host')}`;
    
    console.log(`[Xendit Card Payment] Using base URL: ${baseUrl}`);
    
    // Generate success and failure URLs
    const productSlug = purchase.product.slug || purchase.product.id;
    
    // Success URL includes access code to view the product content
    const successUrl = `${baseUrl}/p/${productSlug}/success?code=${purchase.accessCode}`;
    console.log(`[Xendit Card Payment] Success URL: ${successUrl}`);
    
    // Failure URL redirects back to checkout with error message
    const failureUrl = `${baseUrl}/p/${productSlug}/failure?error=payment_failed`;
    console.log(`[Xendit Card Payment] Failure URL: ${failureUrl}`);
    
    // Cancellation URL redirects to failure page with cancelled message
    const cancelUrl = `${baseUrl}/p/${productSlug}/failure?error=payment_cancelled`;
    console.log(`[Xendit Card Payment] Cancel URL: ${cancelUrl}`);
    
    // Generate webhook callback URL for payment notifications
    const callbackUrl = `${baseUrl}/api/webhooks/xendit`;
    
    try {
      // Create a transaction record
      console.log('[Xendit Card Payment] Creating transaction record');
      
      // Get user ID from purchase or find/create a system user
      let userId = purchase.userId;
      
      // If no userId in purchase, try to find a user with the same email
      if (!userId && purchase.email) {
        console.log(`[Xendit Card Payment] No userId in purchase, looking for user with email: ${purchase.email}`);
        const existingUser = await prisma.user.findFirst({
          where: { email: purchase.email }
        });
        
        if (existingUser) {
          userId = existingUser.id;
          console.log(`[Xendit Card Payment] Found user with matching email: ${userId}`);
        } else {
          // Try to find any user in the system as a fallback
          console.log('[Xendit Card Payment] No matching user found, looking for any user as fallback');
          const fallbackUser = await prisma.user.findFirst({
            orderBy: { createdAt: 'asc' } // Get the oldest user (likely an admin or system user)
          });
          
          if (fallbackUser) {
            userId = fallbackUser.id;
            console.log(`[Xendit Card Payment] Using fallback user: ${userId}`);
          } else {
            // If no user exists at all, we need to throw an error
            console.error('[Xendit Card Payment] No users found in the system');
            throw new Error('No user available for transaction. Please contact support.');
          }
        }
      }
      
      if (!userId) {
        console.error('[Xendit Card Payment] Failed to find or create a user for the transaction');
        throw new Error('User required for transaction');
      }
      
      console.log(`[Xendit Card Payment] Creating transaction with userId: ${userId}`);
      const transaction = await prisma.transaction.create({
        data: {
          userId: userId,  // Use userId directly since we're not using connect syntax for user
          amount: amount,
          currency: currency,
          status: 'PENDING',
          type: 'PAYMENT',
          description: `Card payment for purchase ${purchase.id}`,
          reference: purchase.id,  // Store purchase ID in the reference field
          referenceType: 'PURCHASE',  // Indicate the type of reference
          metadata: JSON.stringify({
            paymentMethod: 'card',
            tokenId: tokenId.substring(0, 8) + '...',  // Only store partial token ID for reference
            flowType: '3DS'
          })
        }
      });
      
      console.log('[Xendit Card Payment] Transaction created:', {
        id: transaction.id,
        status: transaction.status,
        amount: transaction.amount,
        currency: transaction.currency
      });
      
      console.log(`[Xendit Card Payment] Transaction record created with ID: ${transaction.id}`);
      
      // Generate a unique reference ID for this payment
      const referenceId = `card_purchase_${purchase.id}_${Date.now()}`;
      console.log('[Xendit Card Payment] Generated reference ID:', referenceId);
      
      // Process the payment using the token ID
      console.log(`[Xendit Card Payment] Processing tokenized payment with token: ${tokenId}`);
      console.log('[Xendit Card Payment] Payment details:', {
        amount,
        currency,
        externalId: referenceId
      });
      
      // Use the chargeCard function without providing CVN (now optional)
      const paymentResult = await chargeCard({
        tokenId: tokenId,
        externalId: referenceId,
        amount: amount,
        currency: currency,
        // No cardCvn parameter - it's now optional in the function
        descriptor: `alaCarte: ${purchase.product.name.substring(0, 20)}`,
        metadata: {
          purchaseId: purchase.id,
          productId: purchase.productId
        }
      });
      
      console.log('[Xendit Card Payment] Payment result received:', {
        id: paymentResult.id,
        status: paymentResult.status,
        authenticationId: paymentResult.authentication_id || null,
        chargeType: paymentResult.charge_type || null
      });
      
      // Update transaction with payment result
      console.log('[Xendit Card Payment] Updating transaction record');
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          status: paymentResult.status === 'AUTHORIZED' || paymentResult.status === 'CAPTURED' ? 'COMPLETED' : 'PENDING',
          reference: paymentResult.id,
          metadata: JSON.stringify({
            paymentMethod: 'card',
            tokenId: tokenId.substring(0, 8) + '...',
            chargeId: paymentResult.id,
            status: paymentResult.status
          })
        }
      });
      
      console.log(`[Xendit Card Payment] Payment request created with ID: ${paymentResult.id}`);
      
      // Check if 3DS authentication is required
      if (paymentResult.status === 'PENDING' && paymentResult.authentication_id) {
        console.log(`[Xendit Card Payment] 3DS authentication required: ${paymentResult.authentication_id}`);
        console.log('[Xendit Card Payment] 3DS authentication URL:', paymentResult.authentication_url);
        
        // Return the authentication URL for 3DS
        const response = {
          success: true,
          requiresAuth: true,
          authUrl: paymentResult.authentication_url,
          paymentId: paymentResult.id
        };
        
        console.log('[Xendit Card Payment] Returning 3DS response:', response);
        return NextResponse.json(response);
      }
      
      // Check if 3DS authentication is required
      if (paymentResult.actions && paymentResult.actions.length > 0) {
        const authAction = paymentResult.actions.find(
          (action: any) => action.action === 'AUTH' || action.action === 'AUTHENTICATE'
        );
        
        if (authAction) {
          console.log(`[Xendit Card Payment] 3DS authentication required`);
          
          // Return the authentication URL to the client
          return NextResponse.json({
            success: true,
            requiresAuth: true,
            paymentId: paymentResult.id,
            authUrl: authAction.url,
            status: 'pending'
          });
        }
      }
      
      // If payment is successful immediately
      if (paymentResult.status === 'AUTHORIZED' || paymentResult.status === 'CAPTURED') {
        console.log(`[Xendit Card Payment] Payment successful: ${paymentResult.id}`);
        console.log('[Xendit Card Payment] Payment status:', paymentResult.status);
        
        // Update purchase status
        console.log(`[Xendit Card Payment] Updating purchase status to completed for ID: ${purchase.id}`);
        await updatePurchaseStatus(purchase.id, 'completed', paymentResult.id);
        
        // Update transaction status
        await prisma.transaction.update({
          where: { id: transaction.id },
          data: {
            status: 'COMPLETED'
          }
        });
        
        // Send purchase confirmation email
        try {
          const productSlug = purchase.product.slug || purchase.product.id;
          console.log('[Xendit Card Payment] Sending purchase confirmation email');
          console.log('[Xendit Card Payment] Email details:', {
            email: purchase.email,
            productName: purchase.product.name,
            accessCode: purchase.accessCode,
            productSlug: productSlug
          });
          
          await sendPurchaseConfirmationEmail(
            purchase.email,
            purchase.product.name,
            purchase.accessCode,
            productSlug,
            purchase.amount,
            purchase.currency
          );
          
          console.log(`[Xendit Card Payment] Purchase confirmation email sent to ${purchase.email}`);
        } catch (emailError) {
          console.error('[Xendit Card Payment] Error sending purchase confirmation email:', emailError);
          // Continue processing even if email fails
        }
        
        // Return success response with access code
        const response = {
          success: true,
          accessCode: purchase.accessCode,
          paymentId: paymentResult.id,
          status: 'completed'
        };
        
        console.log('[Xendit Card Payment] Returning success response:', response);
        return NextResponse.json(response);
      }
      
      // For other statuses, return pending
      const pendingResponse = {
        success: true,
        paymentId: paymentResult.id,
        status: 'pending'
      };
      
      console.log('[Xendit Card Payment] Returning pending response:', pendingResponse);
      return NextResponse.json(pendingResponse);
    } catch (error) {
      console.error('='.repeat(80));
      console.error('[Xendit Card Payment] Payment processing error:', error);
      console.error('='.repeat(80));
      
      // Update purchase status to failed
      await prisma.purchase.update({
        where: { id: purchase.id },
        data: {
          status: 'failed'
        }
      });
      
      return NextResponse.json({ 
        error: 'Failed to process card payment', 
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('[Xendit Card Payment] Status check error:', error);
    return NextResponse.json({ 
      error: 'Failed to check payment status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
