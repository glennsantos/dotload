import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createPurchase, updatePurchaseStatus } from '@/lib/purchase-utils';
import { createInvoice, createQRCodePayment, createEWalletPayment } from '@/lib/xendit-client';
import xenditClient from '@/lib/xendit';

export async function POST(request: NextRequest) {
  console.log('[Payment Creation] Starting payment creation process');
  try {
    const body = await request.json();
    const { email, mobileNumber, paymentMethod, amount, currency = 'PHP' } = body;
    const productId = body.productId;
    
    console.log(`[Payment Creation] Request received for product ${productId}, method: ${paymentMethod}, amount: ${amount || 'not specified'} ${currency}`);
    
    // Validate required fields
    if (!productId || !email || !mobileNumber || !paymentMethod) {
      console.log('[Payment Creation] Missing required fields', { productId, email, mobileNumber, paymentMethod });
      return NextResponse.json({ 
        error: 'Missing required fields',
        details: 'Product ID, email, mobile number, and payment method are required'
      }, { status: 400 });
    }
    
    // Find the product
    console.log(`[Payment Creation] Fetching product with ID: ${productId}`);
    const product = await prisma.product.findUnique({
      where: { id: productId }
    });
    
    if (!product) {
      console.log(`[Payment Creation] Product not found with ID: ${productId}`);
      return NextResponse.json({ 
        error: 'Product not found',
        details: 'The requested product does not exist'
      }, { status: 404 });
    }
    
    // Create a purchase record with pending status
    console.log(`[Payment Creation] Creating purchase record for product: ${productId}`);
    const purchase = await createPurchase({
      productId,
      email,
      mobileNumber,
      amount: amount || product.price,
      currency,
      paymentMethod
    });
    
    // Base URL for redirects
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? `https://${request.headers.get('host')}`
      : `http://${request.headers.get('host')}`;
    
    console.log(`[Payment Creation] Using base URL: ${baseUrl}`);
    
    // Create Xendit payment based on payment method
    let paymentResponse;
    let redirectUrl;
    
    // Generate success and failure URLs
    const productPath = product.id;
    const successUrl = `${baseUrl}/p/${productPath}/success?code=${purchase.accessCode}`;
    const failureUrl = `${baseUrl}/p/${productPath}/checkout?error=payment_failed`;
    
    console.log(`[Payment Creation] Success URL: ${successUrl}`);
    console.log(`[Payment Creation] Failure URL: ${failureUrl}`);
    
    console.log(`[Payment Creation] Processing payment with method: ${paymentMethod}`);
    switch (paymentMethod) {
      case 'card':
        // For card payments, we would normally use tokenization in the frontend
        // This is a simplified version for demonstration
        const { cardDetails } = body;
        
        if (!cardDetails) {
          return NextResponse.json({ 
            error: 'Missing card details',
            details: 'Card details are required for card payments'
          }, { status: 400 });
        }
        
        // In a real implementation, you would use a token from the frontend
        // For this example, we'll simulate a successful card payment
        await updatePurchaseStatus(purchase.id, 'completed', `sim_card_${Date.now()}`);
        
        return NextResponse.json({
          success: true,
          accessCode: purchase.accessCode
        });
        
      case 'gcash':
      case 'grabpay':
      case 'shopeepay':
      case 'maya':
        console.log(`[Payment Creation] Processing e-wallet payment with ${paymentMethod}`);
        // Map payment method to Xendit e-wallet type
        const ewalletType = paymentMethod === 'gcash' ? 'GCASH' : 
                           paymentMethod === 'grabpay' ? 'GRABPAY' : 
                           paymentMethod === 'shopeepay' ? 'SHOPEEPAY' : 'PAYMAYA';
        
        try {
          console.log(`[Payment Creation] Creating e-wallet payment with Xendit`);
          // Use our new helper function for e-wallet payments with complete flow
          paymentResponse = await createEWalletPayment({
            referenceId: `purchase_${purchase.id}`,
            amount: purchase.amount,
            phone: mobileNumber,
            email: email,
            name: email.split('@')[0], // Use part of email as name if actual name not provided
            ewalletType,
            successRedirectUrl: successUrl,
            failureRedirectUrl: failureUrl
          });
          
          // Update purchase with payment ID
          await prisma.purchase.update({
            where: { id: purchase.id },
            data: { paymentId: paymentResponse.id }
          });
          
          // Get redirect URL from response
          // Handle different action structures from Xendit
          let actionUrl = '';
          
          console.log(`[Payment Creation] Extracting redirect URL from payment response`, paymentResponse);
          
          if (Array.isArray(paymentResponse.actions)) {
            // Find the redirect action in the array
            const redirectAction = paymentResponse.actions.find(
              (action: any) => action.type === 'REDIRECT' || action.method === 'GET'
            );
            actionUrl = redirectAction?.url || '';
            console.log(`[Payment Creation] Found redirect URL in actions array: ${actionUrl}`);
          } else if (typeof paymentResponse.actions === 'object') {
            // Handle object structure with mobileWebCheckout/desktopWebCheckout
            actionUrl = paymentResponse.actions?.mobileWebCheckout?.url || 
                      paymentResponse.actions?.desktopWebCheckout?.url || '';
            console.log(`[Payment Creation] Found redirect URL in actions object: ${actionUrl}`);
          }
          
          redirectUrl = actionUrl;
          
          return NextResponse.json({
            success: true,
            accessCode: purchase.accessCode,
            redirectUrl
          });
        } catch (error) {
          console.error('[Payment Creation] Error creating e-wallet payment:', error);
          return NextResponse.json({ 
            error: 'Failed to create e-wallet payment', 
            details: error instanceof Error ? error.message : 'Unknown error'
          }, { status: 500 });
        }
        

        
      default:
        console.log(`[Payment Creation] Processing default payment method: ${paymentMethod}`);
        try {
          console.log(`[Payment Creation] Creating invoice payment with Xendit`);
          // Use our new helper function for invoice payments
          paymentResponse = await createInvoice({
            externalId: `purchase_${purchase.id}`,
            amount: purchase.amount,
            payerEmail: email,
            description: `Payment for ${product.name}`,
            successRedirectUrl: successUrl,
            failureRedirectUrl: failureUrl,
            currency
          });
          
          // Update purchase with payment ID
          await prisma.purchase.update({
            where: { id: purchase.id },
            data: { paymentId: paymentResponse.id }
          });
          
          // Get invoice URL
          // Handle different property names in the response
          console.log(`[Payment Creation] Extracting invoice URL from payment response`, paymentResponse);
          redirectUrl = paymentResponse.invoiceUrl;
          console.log(`[Payment Creation] Found invoice URL: ${redirectUrl}`);
          
          return NextResponse.json({
            success: true,
            accessCode: purchase.accessCode,
            redirectUrl
          });
        } catch (error) {
          console.error('[Payment Creation] Error creating invoice payment:', error);
          return NextResponse.json({ 
            error: 'Failed to create invoice payment', 
            details: error instanceof Error ? error.message : 'Unknown error'
          }, { status: 500 });
        }
    }
  } catch (error) {
    console.error('[Payment Creation] Payment creation error:', error);
    return NextResponse.json({ 
      error: 'Failed to create payment', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
