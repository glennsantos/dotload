import { NextRequest, NextResponse } from 'next/server';
import { getPurchaseById, updatePurchaseStatus } from '@/lib/purchase-utils';
import { sendPurchaseConfirmationEmail } from '@/lib/email';

// Xendit API base URL
const XENDIT_API_URL = 'https://api.xendit.co';

export async function POST(request: NextRequest) {
  console.log('[Xendit Payment] Starting payment process');
  try {
    const body = await request.json();
    const { 
      purchaseId, 
      paymentMethod, 
      mobileNumber,
      amount,
      currency = 'PHP'
    } = body;
    
    console.log(`[Xendit Payment] Request received for purchase ${purchaseId}, method: ${paymentMethod}, amount: ${amount} ${currency}`);
    
    if (!purchaseId || !paymentMethod || !amount) {
      console.log('[Xendit Payment] Missing required fields', { purchaseId, paymentMethod, amount });
      return NextResponse.json({ 
        error: 'Missing required fields',
        details: 'Purchase ID, payment method, and amount are required'
      }, { status: 400 });
    }
    
    if (paymentMethod.startsWith('ewallet') && !mobileNumber) {
      console.log('[Xendit Payment] Missing mobile number for e-wallet payment');
      return NextResponse.json({ 
        error: 'Missing mobile number',
        details: 'Mobile number is required for e-wallet payments'
      }, { status: 400 });
    }
    
    // Find the purchase
    console.log(`[Xendit Payment] Fetching purchase with ID: ${purchaseId}`);
    const purchase = await getPurchaseById(purchaseId);
    
    if (!purchase) {
      console.log(`[Xendit Payment] Purchase not found with ID: ${purchaseId}`);
      return NextResponse.json({ 
        error: 'Purchase not found',
        details: 'The requested purchase does not exist'
      }, { status: 404 });
    }
    
    // Base URL for redirects
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? `https://${request.headers.get('host')}`
      : `http://${request.headers.get('host')}`;
    
    console.log(`[Xendit Payment] Using base URL: ${baseUrl}`);
    
    // Generate success and failure URLs
    const productSlug = purchase.product.slug || purchase.product.id;
    
    // Success URL includes access code to view the product content
    const successUrl = `${baseUrl}/p/${productSlug}/success?code=${purchase.accessCode}`;
    console.log(`[Xendit Payment] Success URL: ${successUrl}`);
    
    // Failure URL redirects back to checkout with error message
    const failureUrl = `${baseUrl}/p/${productSlug}/checkout?error=payment_failed`;
    console.log(`[Xendit Payment] Failure URL: ${failureUrl}`);
    
    // Generate webhook callback URL for payment notifications
    const callbackUrl = `${baseUrl}/api/webhooks/xendit`;
    
    try {
      if (paymentMethod.startsWith('ewallet')) {
        console.log(`[Xendit Payment] Processing e-wallet payment with ${paymentMethod}`);
        // Extract the specific wallet type (gcash, grabpay, etc.)
        const walletType = paymentMethod.split('-')[1]?.toUpperCase() || 'GCASH';
        console.log(`[Xendit Payment] E-wallet type: ${walletType}`);
        
        // Map to the correct Xendit channel code
        const channelCode = walletType === 'GCASH' ? 'GCASH' :
                           walletType === 'GRABPAY' ? 'GRABPAY' :
                           walletType === 'SHOPEEPAY' ? 'SHOPEEPAY' :
                           walletType === 'PAYMAYA' ? 'PAYMAYA' :
                           walletType === 'DANA' ? 'DANA' :
                           walletType === 'OVO' ? 'OVO' :
                           walletType === 'LINKAJA' ? 'LINKAJA' : 'GCASH';

        // Create a payment request using direct Xendit API call
        console.log(`[Xendit Payment] Creating payment request with Xendit API`);
        
        const paymentRequestBody = {
          reference_id: `purchase_${purchase.id}`,
          amount,
          currency,
          country: currency === 'PHP' ? 'PH' : 'ID',
          payment_method: {
            type: 'EWALLET',
            ewallet: {
              channel_code: channelCode,
              channel_properties: {
                success_return_url: successUrl,
                failure_return_url: failureUrl,
                mobile_number: mobileNumber
              }
            },
            reusability: 'ONE_TIME_USE'
          },
          metadata: {
            product_id: purchase.productId,
            purchase_id: purchase.id
          }
        };
        
        const response = await fetch(`${XENDIT_API_URL}/payment_requests`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${Buffer.from(process.env.XENDIT_SECRET_KEY + ':').toString('base64')}`,
            'Accept': 'application/json'
          },
          body: JSON.stringify(paymentRequestBody)
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error(`[Xendit Payment] API error:`, errorData);
          throw new Error(`Xendit API error: ${response.status} ${response.statusText}`);
        }
        
        const paymentRequest = await response.json();
        
        // Update purchase with payment ID
        console.log(`[Xendit Payment] Updating purchase status to pending with payment ID: ${paymentRequest.id}`);
        await updatePurchaseStatus(purchase.id, 'pending', paymentRequest.id);
        
        // Extract the redirect URL from the actions array
        let redirectUrl = '';
        console.log(`[Xendit Payment] Extracting redirect URL from payment response`);
        if (paymentRequest.actions && paymentRequest.actions.length > 0) {
          // Find the appropriate action URL - prefer mobile if available
          const mobileAction = paymentRequest.actions.find(action => 
            action.url_type === 'MOBILE'
          );
          
          const webAction = paymentRequest.actions.find(action => 
            action.url_type === 'WEB'
          );
          
          redirectUrl = (mobileAction || webAction)?.url || '';
        }
        
        if (!redirectUrl) {
          console.log(`[Xendit Payment] Error: No redirect URL found in payment response`);
          throw new Error('No redirect URL found in payment response');
        }
        
        console.log(`[Xendit Payment] Payment request successful, redirecting to: ${redirectUrl}`);
        
        // Send purchase confirmation email immediately
        try {
          const productSlug = purchase.product.slug || purchase.product.id;
          
          await sendPurchaseConfirmationEmail(
            purchase.email,
            purchase.product.name,
            purchase.accessCode,
            productSlug,
            purchase.amount,
            purchase.currency
          );
          
          console.log(`[Xendit Payment] Purchase confirmation email sent to ${purchase.email}`);
        } catch (emailError) {
          console.error('[Xendit Payment] Error sending purchase confirmation email:', emailError);
          // Continue processing even if email fails
        }
        
        return NextResponse.json({
          success: true,
          accessCode: purchase.accessCode,
          paymentId: paymentRequest.id,
          redirectUrl
        });
      } else {
        // Handle other payment methods if needed
        console.log(`[Xendit Payment] Unsupported payment method: ${paymentMethod}`);
        return NextResponse.json({ 
          error: 'Unsupported payment method',
          details: 'Only e-wallet payments are supported at this time'
        }, { status: 400 });
      }
    } catch (error) {
      console.error('[Xendit Payment] Error creating payment:', error);
      return NextResponse.json({ 
        error: 'Failed to create payment', 
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('[Xendit Payment] Payment creation error:', error);
    return NextResponse.json({ 
      error: 'Failed to create payment', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
