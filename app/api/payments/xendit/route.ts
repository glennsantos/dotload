import { NextRequest, NextResponse } from 'next/server';
import { getPurchaseById, updatePurchaseStatus } from '@/lib/purchase-utils';
import { sendPurchaseConfirmationEmail } from '@/lib/email';
import { 
  createCustomer, 
  createPaymentMethod, 
  createEWalletCustomer, 
  createEWalletPaymentMethod, 
  createEWalletCharge, 
  createPayment,
  processCardPayment,
  createOneTimePayment
} from '@/lib/xendit-client';
import { prisma } from '@/lib/prisma';

// Xendit API base URL
const XENDIT_API_URL = 'https://api.xendit.co';

// Define the action type to fix TypeScript errors
interface PaymentAction {
  action: string;
  url_type: string;
  url: string;
  method: string;
  qr_code?: string | null;
}

// Define the metadata type for transactions
type TransactionMetadata = {
  customerId?: string;
  channelCode?: string;
  flowType?: string;
  chargeId?: string;
}

export async function POST(request: NextRequest) {
  console.log('[Xendit Payment] Starting payment process');
  try {
    const body = await request.json();
    const { 
      purchaseId, 
      paymentMethod, 
      mobileNumber,
      amount,
      currency = 'PHP',
      channelCode,
      cardNumber,
      cardExpiry,
      cardCvc,
      cardName
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
    
    if (paymentMethod === 'card' && (!cardNumber || !cardExpiry || !cardCvc || !cardName)) {
      console.log('[Xendit Payment] Missing card details for card payment');
      return NextResponse.json({ 
        error: 'Missing card details',
        details: 'Card number, expiry, CVC, and name are required for card payments'
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
    const failureUrl = `${baseUrl}/p/${productSlug}/failure?error=payment_failed`;
    console.log(`[Xendit Payment] Failure URL: ${failureUrl}`);
    
    // Cancellation URL redirects to failure page with cancelled message
    const cancelUrl = `${baseUrl}/p/${productSlug}/failure?error=payment_cancelled`;
    console.log(`[Xendit Payment] Cancel URL: ${cancelUrl}`);
    
    // Generate webhook callback URL for payment notifications
    const callbackUrl = `${baseUrl}/api/webhooks/xendit`;
    
    // Handle different payment methods
    if (paymentMethod === 'ewallet-onetime') {
      // One-time payment flow using Xendit's payment_requests endpoint
      console.log(`[Xendit Payment] Processing one-time e-wallet payment with channel code: ${channelCode}`);
      
      try {
        // Create a transaction record
        const transaction = await prisma.transaction.create({
          data: {
            amount,
            currency: currency,
            type: 'payment',
            status: 'pending',
            description: `${channelCode} payment for purchase ${purchase.id}`,
            reference: purchase.id,
            referenceType: 'Purchase',
            metadata: JSON.stringify({
              paymentMethod: 'ewallet',
              channelCode: channelCode,
              flowType: 'one-time',
              mobileNumber: mobileNumber,
              purchaseId: purchase.id
            }),
            userId: purchase.product.userId // Use the product's userId since purchase.userId might be null for guest purchases
          }
        });
        
        console.log(`[Xendit Payment] Transaction created with ID: ${transaction.id}`);
        
        try {
          // Generate a unique reference ID for this payment
          const referenceId = `purchase_${purchase.id}_${Date.now()}`;
          
          // Create the one-time payment request
          const paymentData = await createOneTimePayment({
            referenceId,
            amount,
            currency,
            country: channelCode === 'DANA' ? 'ID' : 'PH', // DANA is for Indonesia
            channelCode,
            successReturnUrl: successUrl,
            failureReturnUrl: failureUrl,
            cancelReturnUrl: cancelUrl, // Add cancel URL
            customerInfo: {
              email: purchase.email,
              name: purchase.name || purchase.email,
              mobileNumber: mobileNumber
            }
          });
          
          console.log(`[Xendit Payment] One-time payment request created:`, paymentData);
          
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
                paymentMethod: 'ewallet',
                channelCode: channelCode,
                paymentId: paymentData.id,
                referenceId: referenceId,
                flowType: 'one-time',
                mobileNumber: mobileNumber,
              })
            }
          });
          
          // Return the redirect URL to the client
          return NextResponse.json({
            success: true,
            actionUrl: redirectUrl,
            paymentId: paymentData.id
          });
        } catch (paymentError) {
          console.error('[Xendit Payment] One-time payment creation error:', paymentError);
          
          // Update transaction to failed status
          await prisma.transaction.update({
            where: { id: transaction.id },
            data: {
              status: 'FAILED',
              metadata: JSON.stringify({
                paymentMethod: 'ewallet',
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
            error: 'E-wallet payment creation failed', 
            details: paymentError instanceof Error ? paymentError.message : 'Unknown error'
          }, { status: 500 });
        }
      } catch (error) {
        console.error('[Xendit Payment] Error creating transaction record for e-wallet payment:', error);
        throw error;
      }
    } else if (paymentMethod === 'ewallet-flow') {
      console.log(`[Xendit Payment] Processing eWallet payment flow`);
      
      try {
        // Step 1: Create a Customer Object
        const customerReferenceId = `customer_${purchase.id}_${Date.now()}`;
        const customer = await createEWalletCustomer({
          referenceId: customerReferenceId,
          mobileNumber: mobileNumber,
          givenNames: purchase.email.split('@')[0] || 'Customer' // Use part of email as name if available
        });
        
        console.log(`[Xendit Payment] Created customer with ID: ${customer.id}`);
        
        // Step 2: Create an eWallet Payment Method
        // Determine the country based on channel code
        let country = 'PH'; // Default to Philippines
        
        // GRABPAY specifically requires country parameter
        if (channelCode === 'GRABPAY') {
          country = 'PH'; // Philippines for GRABPAY
        }
        
        console.log(`[Xendit Payment] Creating eWallet payment method with channel: ${channelCode}, country: ${country}`);
        
        const paymentMethodResponse = await createEWalletPaymentMethod({
          customerId: customer.id,
          channelCode: channelCode, // Use the channel code from the frontend
          mobileNumber: mobileNumber,
          successReturnUrl: successUrl,
          failureReturnUrl: failureUrl,
          country: country // Add country parameter
        });
        
        console.log(`[Xendit Payment] Created payment method with ID: ${paymentMethodResponse.id}`);
        
        // Check if payment method requires action (most likely it will)
        if (paymentMethodResponse.status === 'REQUIRES_ACTION' && paymentMethodResponse.actions && paymentMethodResponse.actions.length > 0) {
          // Find the action with the URL for redirection
          const authAction = paymentMethodResponse.actions.find((action: PaymentAction) => action.action === 'AUTH');
          
          if (authAction && authAction.url) {
            // Record the payment method ID in the purchase record for later use
            await prisma.purchase.update({
              where: { id: purchase.id },
              data: {
                paymentId: paymentMethodResponse.id, // Use paymentId field instead of paymentMethodId
                paymentMethod: 'ewallet',
                status: 'pending'
              }
            });
            
            // Add a transaction record for the pending purchase
            const userId = purchase.product.user.id;
            
            // Create metadata as JSON string
            const metadata: TransactionMetadata = {
              customerId: customer.id,
              channelCode: channelCode,
              flowType: 'ewallet-flow'
            };
            
            await prisma.transaction.create({
              data: {
                userId: userId,
                type: 'purchase',
                status: 'pending',
                amount: amount,
                currency: currency,
                description: `Purchase of ${purchase.product.name}`,
                reference: purchase.id,
                referenceType: 'Purchase',
                metadata: JSON.stringify(metadata)
              }
            });
            
            // Return the URL for the frontend to redirect the user
            return NextResponse.json({
              success: true,
              requiresAction: true,
              actionUrl: authAction.url,
              actionType: 'AUTH',
              customerId: customer.id,
              paymentMethodId: paymentMethodResponse.id
            });
          }
        }
        
        // If payment method is already active (unlikely for first-time setup)
        if (paymentMethodResponse.status === 'ACTIVE') {
          // Step 4: Create an eWallet Charge
          const chargeResponse = await createEWalletCharge({
            paymentMethodId: paymentMethodResponse.id,
            referenceId: `purchase_${purchase.id}_${Date.now()}`,
            amount: amount,
            currency: currency
          });
          
          console.log(`[Xendit Payment] Created charge with ID: ${chargeResponse.id}`);
          
          // Check if charge requires action
          if (chargeResponse.status === 'REQUIRES_ACTION' && chargeResponse.actions && chargeResponse.actions.length > 0) {
            // Find the action with the URL for redirection
            const authAction = chargeResponse.actions.find((action: PaymentAction) => action.action === 'AUTH');
            
            if (authAction && authAction.url) {
              // Update the purchase record with payment information
              await prisma.purchase.update({
                where: { id: purchase.id },
                data: {
                  paymentId: chargeResponse.id, // Use paymentId field instead of paymentMethodId
                  paymentMethod: 'ewallet',
                  status: 'pending'
                }
              });
              
              // Add a transaction record for the pending purchase
              const userId = purchase.product.user.id;
              
              // Create metadata as JSON string
              const metadata: TransactionMetadata = {
                customerId: customer.id,
                channelCode: channelCode,
                flowType: 'ewallet-flow',
                chargeId: chargeResponse.id
              };
              
              await prisma.transaction.create({
                data: {
                  userId: userId,
                  type: 'purchase',
                  status: 'pending',
                  amount: amount,
                  currency: currency,
                  description: `Purchase of ${purchase.product.name}`,
                  reference: purchase.id,
                  referenceType: 'Purchase',
                  metadata: JSON.stringify(metadata)
                }
              });
              
              // Return the URL for the frontend to redirect the user
              return NextResponse.json({
                success: true,
                requiresAction: true,
                actionUrl: authAction.url,
                actionType: 'AUTH',
                customerId: customer.id,
                paymentMethodId: paymentMethodResponse.id,
                chargeId: chargeResponse.id
              });
            }
          }
          
          // If charge is successful immediately (unlikely for first-time setup)
          if (chargeResponse.status === 'SUCCEEDED' || chargeResponse.status === 'COMPLETED') {
            // Update purchase status to completed
            await updatePurchaseStatus(purchase.id, 'completed');
            
            // Add a transaction record for the completed purchase
            const userId = purchase.product.user.id;
            
            // Create metadata as JSON string
            const metadata: TransactionMetadata = {
              customerId: customer.id,
              channelCode: channelCode,
              flowType: 'ewallet-flow',
              chargeId: chargeResponse.id
            };
            
            await prisma.transaction.create({
              data: {
                userId: userId,
                type: 'purchase',
                status: 'completed',
                amount: amount,
                currency: currency,
                description: `Purchase of ${purchase.product.name}`,
                reference: purchase.id,
                referenceType: 'Purchase',
                metadata: JSON.stringify(metadata)
              }
            });
            
            // Send purchase confirmation email
            try {
              await sendPurchaseConfirmationEmail(
                purchase.email,
                purchase.product.name,
                purchase.accessCode,
                purchase.product.slug || purchase.product.id,
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
              requiresAction: false,
              redirectUrl: successUrl,
              paymentId: chargeResponse.id,
              customerId: customer.id,
              paymentMethodId: paymentMethodResponse.id
            });
          }
        }
        
        // If we get here, something unexpected happened
        throw new Error('Unexpected payment flow state');
        
      } catch (error) {
        console.error('[Xendit Payment] Error in eWallet payment flow:', error);
        return NextResponse.json({ 
          error: 'Failed to process eWallet payment', 
          details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
      }
    } else if (paymentMethod.startsWith('ewallet')) {
      console.log(`[Xendit Payment] Processing e-wallet payment with ${paymentMethod}`);
      
      // Extract the specific wallet type (gcash, grabpay, etc.)
      const walletType = paymentMethod.split('-')[1]?.toUpperCase() || 'GCASH';
      console.log(`[Xendit Payment] E-wallet type: ${walletType}`);
      
      // Map to the correct Xendit channel code - ensure we only use supported types
      let channelCode: 'GCASH' | 'GRABPAY' | 'SHOPEEPAY' | 'PAYMAYA';
      if (walletType === 'GCASH') channelCode = 'GCASH';
      else if (walletType === 'GRABPAY') channelCode = 'GRABPAY';
      else if (walletType === 'SHOPEEPAY') channelCode = 'SHOPEEPAY';
      else if (walletType === 'PAYMAYA') channelCode = 'PAYMAYA';
      else channelCode = 'GCASH'; // Default to GCASH for unsupported types
      
      console.log(`[Xendit Payment] Using channel code: ${channelCode}`);
      
      try {
        // Create customer in Xendit
        console.log(`[Xendit Payment] Creating customer for purchase ${purchaseId}`);        
        const customer = await createCustomer({
          referenceId: `customer_${purchase.id}`,
          email: purchase.email,
          givenNames: purchase.email.split('@')[0], // Use part of email as name if actual name is not available
          mobileNumber: mobileNumber
        });
        
        console.log(`[Xendit Payment] Customer created with ID: ${customer.id}`);
        
        // Create payment method for the customer
        console.log(`[Xendit Payment] Creating payment method for customer ${customer.id}`);
        let paymentMethodResponse;
        
        // Extract the redirect URL and actions from the payment response
        let redirectUrl = '';
        let requiresAction = false;
        let actionUrl = '';
        let actionType = '';
        try {
          paymentMethodResponse = await createPaymentMethod({
            customerId: customer.id,
            type: 'EWALLET',
            reusability: 'MULTIPLE_USE',
            referenceId: `payment_${purchase.id}`,
            ewalletType: walletType as 'GCASH' | 'GRABPAY' | 'SHOPEEPAY' | 'PAYMAYA',
            mobileNumber: mobileNumber,
            successRedirectUrl: successUrl,
            failureRedirectUrl: failureUrl,
            cancelRedirectUrl: cancelUrl
          });
          
          console.log(`[Xendit Payment] Payment method status: ${paymentMethodResponse.status}`);
          
          // If payment method is active, proceed with creating the e-wallet payment
          if (paymentMethodResponse.status === 'ACTIVE') {
            console.log(`[Xendit Payment] Payment method is active, creating e-wallet payment`);
            
            // Create a transaction record for the payment attempt
            await prisma.transaction.create({
              data: {
                type: 'PURCHASE',
                status: 'PENDING',
                amount: amount,
                currency: currency,
                description: `Payment for ${purchase.product.name}`,
                reference: purchase.id,
                referenceType: 'Purchase',
                metadata: JSON.stringify({
                  customerId: customer.id,
                  channelCode: walletType,
                  flowType: 'TOKENIZED',
                  paymentMethodId: paymentMethodResponse.id
                }),
                userId: purchase.product.userId
              }
            });
            
            // Update purchase with payment method ID
            await prisma.purchase.update({
              where: { id: purchase.id },
              data: {
                paymentId: paymentMethodResponse.id
              }
            });
            
            // Create the actual payment using the payment method
            const ewalletPayment = await createPayment({
              referenceId: purchase.id,
              amount: amount,
              currency: currency,
              country: 'PH',
              paymentMethodId: paymentMethodResponse.id,
              customerId: customer.id,
              description: `Payment for ${purchase.product.name}`,
              metadata: {
                purchase_id: purchase.id,
                email: purchase.email
              }
            });
            
            console.log(`[Xendit Payment] E-wallet payment created:`, ewalletPayment);
            
            // Update payment method response with payment information
            paymentMethodResponse = {
              ...paymentMethodResponse,
              payment: ewalletPayment
            };
          } else if (paymentMethodResponse.status === 'REQUIRES_ACTION') {
            console.log(`[Xendit Payment] Payment method requires action, redirecting user to action URL`);
            
            // Reset the action URL before extracting from the payment method response
            actionUrl = '';
            
            if (paymentMethodResponse.actions && paymentMethodResponse.actions.length > 0) {
              // Find the appropriate action URL - prefer mobile if available
              const mobileAction = paymentMethodResponse.actions.find((action: PaymentAction) => 
                action.url_type === 'MOBILE'
              );
              
              const webAction = paymentMethodResponse.actions.find((action: PaymentAction) => 
                action.url_type === 'WEB'
              );
              
              const action = mobileAction || webAction;
              if (action) {
                actionUrl = action.url || '';
              }
            }
            
            // If there's a direct action URL in the response, use that
            if (paymentMethodResponse.redirect_url && !actionUrl) {
              actionUrl = paymentMethodResponse.redirect_url;
            }
            
            if (!actionUrl) {
              console.log(`[Xendit Payment] Error: No action URL found in payment method response`);
              throw new Error('No action URL found in payment method response requiring action');
            }
            
            // Create a transaction record for the payment attempt
            await prisma.transaction.create({
              data: {
                type: 'PURCHASE',
                status: 'PENDING',
                amount: amount,
                currency: currency,
                description: `Payment for ${purchase.product.name}`,
                reference: purchase.id,
                referenceType: 'Purchase',
                metadata: JSON.stringify({
                  customerId: customer.id,
                  channelCode: walletType,
                  flowType: 'TOKENIZED',
                  paymentMethodId: paymentMethodResponse.id,
                  requiresAction: true
                }),
                userId: purchase.product.userId
              }
            });
            
            // Update purchase with payment method ID and status
            await prisma.purchase.update({
              where: { id: purchase.id },
              data: {
                paymentId: paymentMethodResponse.id,
                status: 'pending'
              }
            });
            
            // Set the redirect URL to the action URL
            redirectUrl = actionUrl;
          }
        } catch (paymentMethodError: any) {
          console.log(`[Xendit] Payment method creation error:`, paymentMethodError);
          
          // If we get LINKED_ACCOUNT_NOT_FOUND_ERROR, proceed with direct e-wallet payment
          if (paymentMethodError?.error_code === 'LINKED_ACCOUNT_NOT_FOUND_ERROR') {
            console.log(`[Xendit Payment] Linked account not found, proceeding with direct e-wallet payment`);
            
            // Use direct e-wallet payment instead (without tokenization)
            const directPaymentResponse = await fetch(`${XENDIT_API_URL}/ewallets/charges`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${Buffer.from(process.env.XENDIT_SECRET_KEY + ':').toString('base64')}`,
                'Accept': 'application/json'
              },
              body: JSON.stringify({
                reference_id: `purchase_${purchase.id}`,
                currency: currency,
                amount: amount,
                checkout_method: 'ONE_TIME_PAYMENT',
                channel_code: walletType,
                channel_properties: {
                  success_redirect_url: successUrl,
                  failure_redirect_url: failureUrl,
                  cancel_redirect_url: cancelUrl,
                  mobile_number: mobileNumber
                },
                metadata: {
                  purchase_id: purchase.id
                }
              })
            });
            
            if (!directPaymentResponse.ok) {
              const errorData = await directPaymentResponse.json();
              console.error('[Xendit] Direct payment creation error:', errorData);
              throw new Error(`Failed to create direct payment: ${directPaymentResponse.status} ${directPaymentResponse.statusText}`);
            }
            
            paymentMethodResponse = await directPaymentResponse.json();
            console.log(`[Xendit] Direct payment created with ID: ${paymentMethodResponse.id}`);
          } else {
            // If it's a different error, rethrow it
            throw paymentMethodError;
          }
        }
        
        console.log(`[Xendit Payment] Payment method created with ID: ${paymentMethodResponse.id}`);
        
        // Update purchase status to pending
        await updatePurchaseStatus(purchase.id, 'pending', paymentMethodResponse.id);
        
        // Record transaction in the database
        await prisma.transaction.create({
          data: {
            userId: purchase.product.userId,
            amount: purchase.amount,
            currency: purchase.currency,
            type: 'income',
            status: 'pending',
            description: `Payment for ${purchase.product.name}`,
            reference: purchase.id,
            referenceType: 'Purchase',
            metadata: JSON.stringify({
              paymentMethod: paymentMethod,
              customerId: customer.id,
              paymentMethodId: paymentMethodResponse.id
            })
          }
        });
        
        // Reset variables before processing payment response
        
        console.log(`[Xendit Payment] Extracting redirect URL from payment response`);
        if (paymentMethodResponse.actions && paymentMethodResponse.actions.length > 0) {
          // Find the appropriate action URL - prefer mobile if available
          const mobileAction = paymentMethodResponse.actions.find((action: PaymentAction) => 
            action.url_type === 'MOBILE'
          );
          
          const webAction = paymentMethodResponse.actions.find((action: PaymentAction) => 
            action.url_type === 'WEB'
          );
          
          // Determine if this is a redirect or an action that requires user verification
          const action = mobileAction || webAction;
          if (action) {
            actionUrl = action.url || '';
            actionType = action.url_type || 'WEB';
            
            // Check if this is a verification action or a redirect
            if (action.method === 'GET' && (actionUrl.includes('authorize') || actionUrl.includes('verification'))) {
              requiresAction = true;
              console.log(`[Xendit Payment] Payment requires user verification action: ${actionType}`);
            } else {
              redirectUrl = actionUrl;
            }
          }
        }
        
        // If there's a direct redirect URL in the response, use that
        if (paymentMethodResponse.redirect_url && !redirectUrl) {
          redirectUrl = paymentMethodResponse.redirect_url;
        }
        
        // If we have neither a redirect URL nor an action URL, check if there's a status that indicates success
        if (!redirectUrl && !requiresAction) {
          if (paymentMethodResponse.status === 'SUCCEEDED' || paymentMethodResponse.status === 'COMPLETED') {
            console.log(`[Xendit Payment] Payment already succeeded, no redirect needed`);
            // If payment already succeeded, redirect to success URL
            redirectUrl = successUrl;
          } else if (!actionUrl) {
            console.log(`[Xendit Payment] Error: No redirect URL or action found in payment response`);
            throw new Error('No redirect URL or action found in payment response');
          }
        }
        
        console.log(`[Xendit Payment] Payment request successful, ${requiresAction ? 'action required' : 'redirecting to'}: ${requiresAction ? actionUrl : redirectUrl}`);
        
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
        
        // Determine the final URL to redirect to
        const finalRedirectUrl = requiresAction ? actionUrl : redirectUrl;
        
        if (!finalRedirectUrl) {
          console.error('[Xendit Payment] No redirect URL available');
          return NextResponse.json({
            success: false,
            error: 'No redirect URL available'
          }, { status: 400 });
        }
        
        console.log(`[Xendit Payment] Returning redirect URL: ${finalRedirectUrl}`);
        
        // Return a JSON response with the redirect URL and a flag to indicate redirection is needed
        // The client-side code will handle the actual redirection
        return NextResponse.json({
          success: true,
          redirect: true,
          redirectUrl: finalRedirectUrl,
          paymentId: paymentMethodResponse.id,
          paymentStatus: paymentMethodResponse.status || 'PENDING',
          requiresAction: requiresAction,
          tokenized: paymentMethodResponse.payment_method_id ? true : false,
          paymentMethodId: paymentMethodResponse.payment_method_id || paymentMethodResponse.id
        });
        
      } catch (error) {
        console.error('[Xendit Payment] Error in tokenized payment flow:', error);
        return NextResponse.json({ 
          error: 'Failed to create tokenized payment', 
          details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
      }

    } else if (paymentMethod === 'card') {
      console.log(`[Xendit Payment] Processing card payment for purchase ${purchaseId}`);
      console.log(`[Xendit Payment] Card details received: ${cardNumber ? 'Card number provided' : 'No card number'}, ${cardExpiry ? 'Expiry provided' : 'No expiry'}, ${cardCvc ? 'CVC provided' : 'No CVC'}, ${cardName ? 'Name provided' : 'No name'}`);
      
      // Create a transaction record for the payment attempt
      try {
        const transaction = await prisma.transaction.create({
          data: {
            userId: purchase.product.userId,
            amount: amount,
            currency: currency,
            type: 'income',
            status: 'pending',
            description: `Card payment for purchase ${purchase.id}`,
            reference: purchase.id,
            referenceType: 'Purchase',
            metadata: JSON.stringify({
              paymentMethod: 'card',
              cardLast4: cardNumber ? cardNumber.slice(-4) : 'N/A'
            })
          }
        });
        
        console.log(`[Xendit Payment] Transaction record created for card payment with ID: ${transaction.id}`);
        
        // Update purchase status to pending
        await prisma.purchase.update({
          where: { id: purchase.id },
          data: {
            paymentMethod: 'card',
            status: 'pending'
          }
        });
        
        console.log(`[Xendit Payment] Purchase updated with card payment method`);
        
        // Process the card payment using our new function
        try {
          console.log(`[Xendit Payment] Processing card payment with Xendit`);
          
          // Create metadata for the payment
          const metadata = {
            product_id: purchase.productId,
            purchase_id: purchase.id,
            transaction_id: transaction.id
          };
          
          // Generate a unique external ID for this payment
          const externalId = `purchase_${purchase.id}_${Date.now()}`;
          
          // Process the card payment (tokenize + charge)
          const paymentResult = await processCardPayment({
            cardNumber,
            cardExpiry,
            cardCvc,
            cardName,
            amount,
            currency,
            externalId,
            metadata
          });
          
          console.log(`[Xendit Payment] Card payment successful with ID: ${paymentResult.paymentId}`);
          
          // Update the transaction record with the payment ID
          await prisma.transaction.update({
            where: { id: transaction.id },
            data: {
              status: 'COMPLETED',
              reference: paymentResult.paymentId,
              metadata: JSON.stringify({
                paymentMethod: 'card',
                cardLast4: cardNumber ? cardNumber.slice(-4) : 'N/A',
                paymentId: paymentResult.paymentId,
                status: paymentResult.status
              })
            }
          });
          
          // Update purchase status to completed
          await updatePurchaseStatus(purchase.id, 'completed', paymentResult.paymentId);
          
          // Send purchase confirmation email
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
          
          // Return success response with access code
          return NextResponse.json({
            success: true,
            accessCode: purchase.accessCode,
            paymentId: paymentResult.paymentId,
            status: 'completed'
          });
          
        } catch (paymentError) {
          console.error('[Xendit Payment] Card payment processing error:', paymentError);
          
          // Update transaction to failed status
          await prisma.transaction.update({
            where: { id: transaction.id },
            data: {
              status: 'FAILED',
              metadata: JSON.stringify({
                paymentMethod: 'card',
                cardLast4: cardNumber ? cardNumber.slice(-4) : 'N/A',
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
            error: 'Card payment failed', 
            details: paymentError instanceof Error ? paymentError.message : 'Unknown error'
          }, { status: 500 });
        }
      } catch (error) {
        console.error('[Xendit Payment] Error creating transaction record for card payment:', error);
        throw error;
      }
    } else {
      // Handle other payment methods if needed
      console.log(`[Xendit Payment] Unsupported payment method: ${paymentMethod}`);
      return NextResponse.json({ 
        error: 'Unsupported payment method',
        details: 'Only e-wallet payments are supported at this time'
      }, { status: 400 });
    }

  } catch (error) {
    console.error('[Xendit Payment] Payment creation error:', error);
    return NextResponse.json({ 
      error: 'Failed to create payment', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
