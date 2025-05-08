import { NextRequest, NextResponse } from 'next/server';
import { updatePurchaseStatus, getPurchaseById } from '@/lib/purchase-utils';

export async function POST(request: NextRequest) {
  try {
    // Get the raw body as a string
    const body = await request.json();
    
    // Log the webhook payload for debugging
    console.log('Received Xendit webhook:', JSON.stringify(body, null, 2));
    
    // Verify the webhook signature if needed
    // const signature = request.headers.get('x-callback-token');
    // if (signature !== process.env.XENDIT_WEBHOOK_TOKEN) {
    //   return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
    // }
    
    // Extract event data
    const { event, data } = body;
    
    if (!event || !data) {
      return NextResponse.json({ error: 'Invalid webhook payload' }, { status: 400 });
    }
    
    // Handle different event types
    if (event === 'payment.succeeded') {
      // Extract payment ID and reference ID from the webhook data
      const paymentId = data.id;
      const referenceId = data.reference_id;
      
      if (!paymentId || !referenceId) {
        return NextResponse.json({ error: 'Missing payment information' }, { status: 400 });
      }
      
      // Extract purchase ID from reference ID (format: purchase_[purchaseId])
      const purchaseIdMatch = referenceId.match(/purchase_(.+)/);
      if (!purchaseIdMatch || !purchaseIdMatch[1]) {
        return NextResponse.json({ error: 'Invalid reference ID format' }, { status: 400 });
      }
      
      const purchaseId = purchaseIdMatch[1];
      
      // Update the purchase status in the database
      const updatedPurchase = await updatePurchaseStatus(purchaseId, 'completed', paymentId);
      
      // Get the full purchase details including the product
      const purchaseWithProduct = await getPurchaseById(purchaseId);
      
      // Email is now sent when payment is created, not in webhook
      console.log(`Payment for purchase ${purchaseId} completed successfully`);
      
      // If needed, additional post-payment processing can be done here
      
      return NextResponse.json({ success: true });
    } else if (event === 'payment.failed') {
      // Handle failed payment
      const paymentId = data.id;
      const referenceId = data.reference_id;
      const failureCode = data.failure_code;
      
      if (!paymentId || !referenceId) {
        return NextResponse.json({ error: 'Missing payment information' }, { status: 400 });
      }
      
      // Extract purchase ID from reference ID
      const purchaseIdMatch = referenceId.match(/purchase_(.+)/);
      if (!purchaseIdMatch || !purchaseIdMatch[1]) {
        return NextResponse.json({ error: 'Invalid reference ID format' }, { status: 400 });
      }
      
      const purchaseId = purchaseIdMatch[1];
      
      // Update the purchase status in the database
      await updatePurchaseStatus(purchaseId, 'failed', paymentId);
      
      return NextResponse.json({ success: true });
    } else {
      // Handle other event types if needed
      console.log(`Unhandled Xendit webhook event: ${event}`);
      return NextResponse.json({ success: true });
    }
  } catch (error) {
    console.error('Error processing Xendit webhook:', error);
    return NextResponse.json(
      { error: 'Failed to process webhook', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
