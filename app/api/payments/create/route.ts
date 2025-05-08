import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createPurchase } from '@/lib/purchase-utils';
import { createInvoice, createEWalletPayment, createCardPayment, createQrCodePayment } from '@/lib/xendit';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, email, mobileNumber, paymentMethod, amount, currency = 'PHP' } = body;
    
    // Validate required fields
    if (!productId || !email || !mobileNumber || !paymentMethod) {
      return NextResponse.json({ 
        error: 'Missing required fields',
        details: 'Product ID, email, mobile number, and payment method are required'
      }, { status: 400 });
    }
    
    // Find the product
    const product = await prisma.product.findUnique({
      where: { id: productId }
    });
    
    if (!product) {
      return NextResponse.json({ 
        error: 'Product not found',
        details: 'The requested product does not exist'
      }, { status: 404 });
    }
    
    // Create a purchase record with pending status
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
    
    // Create Xendit payment based on payment method
    let paymentResponse;
    let redirectUrl;
    
    // Generate success and failure URLs
    const successUrl = `${baseUrl}/p/${product.slug || product.id}/success?code=${purchase.accessCode}`;
    const failureUrl = `${baseUrl}/p/${product.slug || product.id}/checkout?error=payment_failed`;
    
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
        await prisma.purchase.update({
          where: { id: purchase.id },
          data: { 
            status: 'completed',
            paymentId: `sim_card_${Date.now()}`
          }
        });
        
        return NextResponse.json({
          success: true,
          accessCode: purchase.accessCode
        });
        
      case 'gcash':
      case 'grabpay':
      case 'shopeepay':
      case 'maya':
        // Map payment method to Xendit e-wallet type
        const ewalletType = paymentMethod === 'gcash' ? 'GCASH' : 
                           paymentMethod === 'grabpay' ? 'GRABPAY' : 
                           paymentMethod === 'shopeepay' ? 'SHOPEEPAY' : 'PAYMAYA';
        
        paymentResponse = await createEWalletPayment({
          externalId: `purchase_${purchase.id}`,
          amount: purchase.amount,
          phone: mobileNumber,
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
        redirectUrl = paymentResponse.actions?.mobileWebCheckout?.url || 
                     paymentResponse.actions?.desktopWebCheckout?.url;
        
        return NextResponse.json({
          success: true,
          accessCode: purchase.accessCode,
          redirectUrl
        });
        
      case 'qrph':
        // Create QR code payment
        paymentResponse = await createQrCodePayment({
          externalId: `purchase_${purchase.id}`,
          amount: purchase.amount,
          callbackUrl: `${baseUrl}/api/payments/webhook`,
          type: 'DYNAMIC'
        });
        
        // Update purchase with payment ID
        await prisma.purchase.update({
          where: { id: purchase.id },
          data: { paymentId: paymentResponse.id }
        });
        
        // Return QR code URL
        return NextResponse.json({
          success: true,
          accessCode: purchase.accessCode,
          qrCode: paymentResponse.qr_string
        });
        
      default:
        // Create invoice for other payment methods
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
        redirectUrl = paymentResponse.invoice_url;
        
        return NextResponse.json({
          success: true,
          accessCode: purchase.accessCode,
          redirectUrl
        });
    }
  } catch (error) {
    console.error('Payment creation error:', error);
    return NextResponse.json({ 
      error: 'Failed to create payment', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
