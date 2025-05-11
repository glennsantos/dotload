import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { updatePurchaseStatus, getPurchaseById } from '@/lib/purchase-utils';
import { sendPurchaseConfirmationEmail } from '@/lib/email';
import { createPurchaseTransaction } from '@/lib/transaction-utils';
import crypto from 'crypto';

// Verify Xendit webhook signature
function verifyWebhookSignature(
  requestBody: string,
  signature: string,
  webhookSecret: string
): boolean {
  try {
    const hmac = crypto.createHmac('sha256', webhookSecret);
    const digest = hmac.update(requestBody).digest('hex');
    return signature === digest;
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get the raw request body as a string
    const rawBody = await request.text();
    const body = JSON.parse(rawBody);
    
    // Get the Xendit signature from headers
    const xenditSignature = request.headers.get('x-callback-token');
    
    // Verify the webhook signature if a signature is provided
    if (xenditSignature) {
      const webhookSecret = process.env.XENDIT_WEBHOOK_SECRET || '';
      const isValid = verifyWebhookSignature(rawBody, xenditSignature, webhookSecret);
      
      if (!isValid) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }
    
    // Process the webhook based on event type
    const { event, data } = body;
    
    // Handle different event types
    switch (event) {
      case 'invoice.paid':
        // Handle invoice payment
        await handleInvoicePaid(data);
        break;
        
      case 'ewallet.payment_status_updated':
        // Handle e-wallet payment status update
        await handleEWalletPayment(data);
        break;
        
      case 'qr_code.payment_status_updated':
        // Handle QR code payment status update
        await handleQrCodePayment(data);
        break;
        
      case 'credit_card.charge_created':
      case 'credit_card.charge_updated':
        // Handle credit card payment
        await handleCardPayment(data);
        break;
        
      default:
        console.log(`Unhandled webhook event: ${event}`);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ 
      error: 'Failed to process webhook', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Handle invoice payment webhook
async function handleInvoicePaid(data: any) {
  try {
    // Extract the external ID from the invoice
    const externalId = data.external_id;
    
    if (!externalId.startsWith('purchase_')) {
      console.log('Not a purchase invoice:', externalId);
      return;
    }
    
    // Extract purchase ID from external ID
    const purchaseId = externalId.replace('purchase_', '');
    
    // Update purchase status to completed
    await updatePurchaseStatus(purchaseId, 'completed', data.id);
    
    // Get purchase details to create transaction
    const purchase = await getPurchaseById(purchaseId);
    if (purchase && purchase.product && purchase.product.user) {
      // Create transaction entries for both buyer and seller
      await createPurchaseTransaction(
        purchase.userId || 'guest',      // Use 'guest' if no user ID (guest purchase)
        purchase.product.user.id,
        purchaseId,
        purchase.amount,
        purchase.currency,
        purchase.product.name
      );
      await createPurchaseTransaction(
        purchase.product.user.id,
        purchase.userId || 'guest', // Use 'guest' if no user ID (guest purchase)
        purchaseId,
        purchase.amount,
        purchase.currency,
        purchase.product.name
      );
      console.log(`Transaction created for purchase ${purchaseId}`);
    }
    
    console.log(`Purchase ${purchaseId} marked as completed`);
  } catch (error) {
    console.error('Error handling invoice paid webhook:', error);
    throw error;
  }
}

// Handle e-wallet payment webhook
async function handleEWalletPayment(data: any) {
  try {
    // Extract the external ID from the e-wallet payment
    const externalId = data.reference_id;
    
    if (!externalId.startsWith('purchase_')) {
      console.log('Not a purchase e-wallet payment:', externalId);
      return;
    }
    
    // Extract purchase ID from external ID
    const purchaseId = externalId.replace('purchase_', '');
    
    // Update purchase status based on payment status
    if (data.status === 'SUCCEEDED') {
      await updatePurchaseStatus(purchaseId, 'completed', data.id);
      console.log(`Purchase ${purchaseId} marked as completed`);
      
      // Get purchase details to create transaction
      const purchase = await getPurchaseById(purchaseId);
      if (purchase && purchase.product && purchase.product.user) {
        // Create transaction entry for the seller
        await createPurchaseTransaction(
          purchase.product.user.id,
          purchase.userId || 'guest', // Use 'guest' if no user ID (guest purchase)
          purchaseId,
          purchase.amount,
          purchase.currency,
          purchase.product.name
        );
        console.log(`Transaction created for purchase ${purchaseId}`);
      }
      
      // Send purchase confirmation email with content link
      try {
        const purchase = await getPurchaseById(purchaseId);
        if (purchase) {
          const productSlug = purchase.product.slug || purchase.product.id;
          
          await sendPurchaseConfirmationEmail(
            purchase.email,
            purchase.product.name,
            purchase.accessCode,
            productSlug,
            purchase.amount,
            purchase.currency
          );
          
          console.log(`Purchase confirmation email sent to ${purchase.email} for e-wallet payment`);
        }
      } catch (emailError) {
        console.error('Error sending purchase confirmation email:', emailError);
        // Continue processing even if email fails
      }
    } else if (data.status === 'FAILED') {
      await updatePurchaseStatus(purchaseId, 'failed', data.id);
      console.log(`Purchase ${purchaseId} marked as failed`);
    } else {
      console.log(`Purchase ${purchaseId} payment status: ${data.status}`);
    }
  } catch (error) {
    console.error('Error handling e-wallet payment webhook:', error);
    throw error;
  }
}

// Handle QR code payment webhook
async function handleQrCodePayment(data: any) {
  try {
    // Extract the external ID from the QR code payment
    const externalId = data.external_id;
    
    if (!externalId.startsWith('purchase_')) {
      console.log('Not a purchase QR code payment:', externalId);
      return;
    }
    
    // Extract purchase ID from external ID
    const purchaseId = externalId.replace('purchase_', '');
    
    // Update purchase status based on payment status
    if (data.status === 'COMPLETED') {
      await updatePurchaseStatus(purchaseId, 'completed', data.id);
      console.log(`Purchase ${purchaseId} marked as completed`);
      
      // Get purchase details to create transaction
      const purchase = await getPurchaseById(purchaseId);
      if (purchase && purchase.product && purchase.product.user) {
        // Create transaction entry for the seller
        await createPurchaseTransaction(
          purchase.product.user.id,
          purchase.userId || 'guest', // Use 'guest' if no user ID (guest purchase)
          purchaseId,
          purchase.amount,
          purchase.currency,
          purchase.product.name
        );
        console.log(`Transaction created for purchase ${purchaseId}`);
      }
      
      // Send purchase confirmation email with content link
      try {
        const purchase = await getPurchaseById(purchaseId);
        if (purchase) {
          const productSlug = purchase.product.slug || purchase.product.id;
          
          await sendPurchaseConfirmationEmail(
            purchase.email,
            purchase.product.name,
            purchase.accessCode,
            productSlug,
            purchase.amount,
            purchase.currency
          );
          
          console.log(`Purchase confirmation email sent to ${purchase.email} for QR code payment`);
        }
      } catch (emailError) {
        console.error('Error sending purchase confirmation email:', emailError);
        // Continue processing even if email fails
      }
    } else if (data.status === 'FAILED') {
      await updatePurchaseStatus(purchaseId, 'failed', data.id);
      console.log(`Purchase ${purchaseId} marked as failed`);
    } else {
      console.log(`Purchase ${purchaseId} payment status: ${data.status}`);
    }
  } catch (error) {
    console.error('Error handling QR code payment webhook:', error);
    throw error;
  }
}

// Handle card payment webhook
async function handleCardPayment(data: any) {
  try {
    // Extract the external ID from the card payment
    const externalId = data.external_id;
    
    if (!externalId.startsWith('purchase_')) {
      console.log('Not a purchase card payment:', externalId);
      return;
    }
    
    // Extract purchase ID from external ID
    const purchaseId = externalId.replace('purchase_', '');
    
    // Update purchase status based on payment status
    if (data.status === 'CAPTURED') {
      await updatePurchaseStatus(purchaseId, 'completed', data.id);
      console.log(`Purchase ${purchaseId} marked as completed`);
      
      // Get purchase details to create transaction
      const purchase = await getPurchaseById(purchaseId);
      if (purchase && purchase.product && purchase.product.user) {
        // Create transaction entry for the seller
        await createPurchaseTransaction(
          purchase.product.user.id,
          purchase.userId || 'guest', // Use 'guest' if no user ID (guest purchase)
          purchaseId,
          purchase.amount,
          purchase.currency,
          purchase.product.name
        );
        console.log(`Transaction created for purchase ${purchaseId}`);
      }
      
      // Send purchase confirmation email with content link
      try {
        const purchase = await getPurchaseById(purchaseId);
        if (purchase) {
          const productSlug = purchase.product.slug || purchase.product.id;
          
          await sendPurchaseConfirmationEmail(
            purchase.email,
            purchase.product.name,
            purchase.accessCode,
            productSlug,
            purchase.amount,
            purchase.currency
          );
          
          console.log(`Purchase confirmation email sent to ${purchase.email} for card payment`);
        }
      } catch (emailError) {
        console.error('Error sending purchase confirmation email:', emailError);
        // Continue processing even if email fails
      }
    } else if (data.status === 'FAILED') {
      await updatePurchaseStatus(purchaseId, 'failed', data.id);
      console.log(`Purchase ${purchaseId} marked as failed`);
    } else {
      console.log(`Purchase ${purchaseId} payment status: ${data.status}`);
    }
  } catch (error) {
    console.error('Error handling card payment webhook:', error);
    throw error;
  }
}
