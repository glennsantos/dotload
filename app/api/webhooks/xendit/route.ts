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
    
    // Extract common fields from the webhook data
    const paymentId = data.id;
    const referenceId = data.reference_id;
    const paymentStatus = data.status?.toLowerCase() || '';
    
    if (!paymentId || !referenceId) {
      return NextResponse.json({ error: 'Missing payment information' }, { status: 400 });
    }
    
    // Extract purchase ID from reference ID (format: purchase_[purchaseId])
    const purchaseIdMatch = referenceId.match(/purchase_(.+)/);
    if (!purchaseIdMatch || !purchaseIdMatch[1]) {
      return NextResponse.json({ error: 'Invalid reference ID format' }, { status: 400 });
    }
    
    const purchaseId = purchaseIdMatch[1];
    console.log(`Processing payment webhook for purchase ${purchaseId}, status: ${paymentStatus}`);
    
    // Handle different event types
    if (event === 'payment.succeeded' || paymentStatus === 'succeeded') {
      // Update the purchase status in the database to completed
      // This will allow users to download files
      const updatedPurchase = await updatePurchaseStatus(purchaseId, 'completed', paymentId);
      
      // Get the full purchase details including the product
      const purchaseWithProduct = await getPurchaseById(purchaseId);
      
      console.log(`Payment for purchase ${purchaseId} completed successfully`);
      
      return NextResponse.json({ success: true, status: 'completed' });
      
    } else if (event === 'payment.failed' || paymentStatus === 'failed') {
      // Handle failed payment - user should not see the purchase at all
      const failureCode = data.failure_code;
      
      console.log(`Payment for purchase ${purchaseId} failed with code: ${failureCode}`);
      
      // Update the purchase status in the database to failed
      await updatePurchaseStatus(purchaseId, 'failed', paymentId);
      
      return NextResponse.json({ success: true, status: 'failed' });
      
    } else if (event === 'payment.pending' || paymentStatus === 'pending') {
      // Handle pending payment - user can see the file link but clicking shows a modal
      console.log(`Payment for purchase ${purchaseId} is pending processing`);
      
      // Update the purchase status in the database to pending
      await updatePurchaseStatus(purchaseId, 'pending', paymentId);
      
      return NextResponse.json({ success: true, status: 'pending' });
      
    } else if (event === 'payment.awaiting_capture' || paymentStatus === 'awaiting_capture') {
      // Handle awaiting capture - same handling as pending
      console.log(`Payment for purchase ${purchaseId} is awaiting capture`);
      
      // Update the purchase status in the database to awaiting_capture
      await updatePurchaseStatus(purchaseId, 'awaiting_capture', paymentId);
      
      return NextResponse.json({ success: true, status: 'awaiting_capture' });
      
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
