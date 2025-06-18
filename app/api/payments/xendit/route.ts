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
import { supabaseTransactionService, supabasePurchaseService } from '@/lib/supabase-db';

// Enhanced logging utility for debugging
const logApiStep = (step: string, data?: any, error?: any) => {
  const timestamp = new Date().toISOString();
  const logPrefix = `[XenditAPI][${timestamp}]`;
  
  if (error) {
    console.error(`${logPrefix} ERROR in ${step}:`, error);
    if (data) console.error(`${logPrefix} Context data:`, data);
  } else {
    console.log(`${logPrefix} ${step}`, data ? data : '');
  }
};

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
  logApiStep('API_REQUEST_START', {
    url: request.url,
    method: request.method,
    headers: Object.fromEntries(request.headers.entries())
  });
  
  try {
    // Parse request body with error handling
    let body;
    try {
      const rawBody = await request.text();
      logApiStep('RAW_REQUEST_BODY', { 
        length: rawBody.length,
        preview: rawBody.substring(0, 200) + (rawBody.length > 200 ? '...' : '')
      });
      
      body = JSON.parse(rawBody);
      logApiStep('REQUEST_BODY_PARSED', {
        keys: Object.keys(body),
        purchaseId: body.purchaseId,
        paymentMethod: body.paymentMethod,
        amount: body.amount,
        currency: body.currency
      });
    } catch (parseError) {
      logApiStep('REQUEST_BODY_PARSE_ERROR', {}, parseError);
      return NextResponse.json({ 
        error: 'Invalid JSON in request body',
        details: parseError instanceof Error ? parseError.message : 'Unknown parsing error'
      }, { status: 400 });
    }
    
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
    
    logApiStep('REQUEST_VALIDATION_START', {
      purchaseId,
      paymentMethod,
      hasMobileNumber: !!mobileNumber,
      amount,
      currency,
      channelCode,
      hasCardDetails: !!(cardNumber && cardExpiry && cardCvc && cardName)
    });
    
    if (!purchaseId || !paymentMethod || !amount) {
      logApiStep('VALIDATION_FAILED_MISSING_FIELDS', { purchaseId, paymentMethod, amount });
      return NextResponse.json({ 
        error: 'Missing required fields',
        details: 'Purchase ID, payment method, and amount are required'
      }, { status: 400 });
    }
    
    if (paymentMethod.startsWith('ewallet') && !mobileNumber) {
      logApiStep('VALIDATION_FAILED_MISSING_MOBILE', { paymentMethod });
      return NextResponse.json({ 
        error: 'Missing mobile number',
        details: 'Mobile number is required for e-wallet payments'
      }, { status: 400 });
    }
    
    if (paymentMethod === 'card' && (!cardNumber || !cardExpiry || !cardCvc || !cardName)) {
      logApiStep('VALIDATION_FAILED_MISSING_CARD_DETAILS', { 
        hasCardNumber: !!cardNumber,
        hasCardExpiry: !!cardExpiry,
        hasCardCvc: !!cardCvc,
        hasCardName: !!cardName
      });
      return NextResponse.json({ 
        error: 'Missing card details',
        details: 'Card number, expiry, CVC, and name are required for card payments'
      }, { status: 400 });
    }
    
    // Find the purchase
    logApiStep('PURCHASE_LOOKUP_START', { purchaseId });
    let purchase;
    try {
      purchase = await getPurchaseById(purchaseId);
      logApiStep('PURCHASE_LOOKUP_SUCCESS', {
        purchaseId: purchase?.id,
        productId: purchase?.productId,
        amount: purchase?.amount,
        status: purchase?.status,
        email: purchase?.email
      });
    } catch (dbError) {
      logApiStep('PURCHASE_LOOKUP_ERROR', { purchaseId }, dbError);
      return NextResponse.json({ 
        error: 'Database error while fetching purchase',
        details: dbError instanceof Error ? dbError.message : 'Unknown database error'
      }, { status: 500 });
    }
    
    if (!purchase) {
      logApiStep('PURCHASE_NOT_FOUND', { purchaseId });
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
      logApiStep('EWALLET_ONETIME_PAYMENT_START', {
        channelCode,
        mobileNumber,
        amount,
        currency
      });
      
      try {
        // Create a transaction record
        logApiStep('TRANSACTION_CREATE_START', {
          amount,
          currency,
          purchaseId: purchase.id,
          userId: purchase.product.userId
        });
        
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
        
        logApiStep('TRANSACTION_CREATE_SUCCESS', {
          transactionId: transaction.id,
          status: transaction.status
        });
        
        try {
          // Generate a unique reference ID for this payment
          const referenceId = `purchase_${purchase.id}_${Date.now()}`;
          logApiStep('REFERENCE_ID_GENERATED', { referenceId });
          
          // Create the one-time payment request
          logApiStep('ONE_TIME_PAYMENT_CREATE_START', {
            referenceId,
            amount,
            currency,
            channelCode,
            customerEmail: purchase.email,
            customerName: purchase.name || purchase.email
          });
          
          const paymentData = await createOneTimePayment({
            referenceId,
            amount,
            currency,
            country: 'PH',
            channelCode,
            successReturnUrl: successUrl,
            failureReturnUrl: failureUrl,
            cancelReturnUrl: cancelUrl,
            customerInfo: {
              email: purchase.email,
              name: purchase.name || purchase.email,
              mobileNumber: mobileNumber
            }
          });
          
          logApiStep('ONE_TIME_PAYMENT_CREATE_SUCCESS', {
            paymentId: paymentData.id,
            status: paymentData.status,
            hasActions: !!(paymentData.actions && paymentData.actions.length > 0),
            actionsCount: paymentData.actions?.length || 0
          });
          
          // Extract the redirect URL from the actions array
          let redirectUrl = '';
          
          // The response will contain actions array with redirect URLs
          if (paymentData.actions && Array.isArray(paymentData.actions)) {
            logApiStep('PAYMENT_ACTIONS_PROCESSING', {
              actionsCount: paymentData.actions.length,
              actions: paymentData.actions.map((action: any) => ({
                action: action.action,
                url_type: action.url_type,
                hasUrl: !!action.url
              }))
            });
            
            const checkoutAction = paymentData.actions.find(
              (action: any) => action.action === 'AUTH'
            );
            
            if (checkoutAction && checkoutAction.url) {
              redirectUrl = checkoutAction.url;
              logApiStep('REDIRECT_URL_FOUND', { 
                redirectUrl,
                actionType: checkoutAction.action,
                urlType: checkoutAction.url_type
              });
            } else {
              logApiStep('NO_AUTH_ACTION_FOUND', {
                availableActions: paymentData.actions.map((a: any) => a.action)
              });
            }
          } else {
            logApiStep('NO_ACTIONS_ARRAY', {
              hasActions: !!paymentData.actions,
              actionsType: typeof paymentData.actions
            });
          }
          
          if (!redirectUrl) {
            logApiStep('NO_REDIRECT_URL_ERROR', { paymentData });
            throw new Error('No redirect URL found in payment response');
          }
          
          // Update the transaction with payment request details
          logApiStep('TRANSACTION_UPDATE_START', {
            transactionId: transaction.id,
            paymentId: paymentData.id
          });
          
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
          
          logApiStep('TRANSACTION_UPDATE_SUCCESS');
          
          // Update purchase status to pending
          logApiStep('PURCHASE_STATUS_UPDATE_START', {
            purchaseId: purchase.id,
            paymentId: paymentData.id
          });
          
          await updatePurchaseStatus(purchase.id, 'pending', paymentData.id);
          
          logApiStep('PURCHASE_STATUS_UPDATE_SUCCESS');
          
          // Send pending payment email notification
          try {
            logApiStep('EMAIL_NOTIFICATION_START', {
              email: purchase.email,
              productName: purchase.product.name
            });
            
            await sendPurchaseConfirmationEmail(
              purchase.email,
              purchase.product.name,
              purchase.accessCode,
              productSlug,
              purchase.amount,
              purchase.currency,
              'pending' // Indicate that this is a pending payment
            );
            
            logApiStep('EMAIL_NOTIFICATION_SUCCESS');
          } catch (emailError) {
            logApiStep('EMAIL_NOTIFICATION_ERROR', {}, emailError);
            // Continue processing even if email fails
          }
          
          // Return the redirect URL to the client
          logApiStep('API_RESPONSE_SUCCESS', {
            actionUrl: redirectUrl,
            paymentId: paymentData.id
          });
          
          return NextResponse.json({
            success: true,
            actionUrl: redirectUrl,
            paymentId: paymentData.id
          });
          
        } catch (paymentError) {
          logApiStep('ONE_TIME_PAYMENT_CREATE_ERROR', {
            transactionId: transaction.id
          }, paymentError);
          
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
        logApiStep('TRANSACTION_CREATE_ERROR', { purchaseId: purchase.id }, error);
        return NextResponse.json({ 
          error: 'Failed to create transaction record', 
          details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
      }
    } else if (paymentMethod === 'ewallet-flow') {
      logApiStep('EWALLET_FLOW_PAYMENT_START', {
        channelCode,
        mobileNumber
      });
      
      try {
        // Step 1: Create a Customer Object
        const customerReferenceId = `customer_${purchase.id}_${Date.now()}`;
        const customer = await createEWalletCustomer({
          referenceId: customerReferenceId,
          mobileNumber: mobileNumber,
          givenNames: purchase.email.split('@')[0] || 'Customer' // Use part of email as name if available
        });
        
        logApiStep('EWALLET_CUSTOMER_CREATED', { customerId: customer.id });
        
        // Step 2: Create an eWallet Payment Method
        // Determine the country based on channel code
        let country = 'PH'; // Default to Philippines
        
        // GRABPAY specifically requires country parameter
        if (channelCode === 'GRABPAY') {
          country = 'PH'; // Philippines for GRABPAY
        }
        
        logApiStep('EWALLET_PAYMENT_METHOD_CREATE_START', {
          customerId: customer.id,
          channelCode,
          country
        });
        
        const paymentMethodResponse = await createEWalletPaymentMethod({
          customerId: customer.id,
          channelCode: channelCode, // Use the channel code from the frontend
          mobileNumber: mobileNumber,
          successReturnUrl: successUrl,
          failureReturnUrl: failureUrl,
          country: country // Add country parameter
        });
        
        logApiStep('EWALLET_PAYMENT_METHOD_CREATED', {
          paymentMethodId: paymentMethodResponse.id,
          status: paymentMethodResponse.status
        });
        
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
        logApiStep('EWALLET_FLOW_ERROR', {}, error);
        return NextResponse.json({ 
          error: 'Failed to process eWallet payment', 
          details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
      }
    } else if (paymentMethod.startsWith('ewallet')) {
      logApiStep('EWALLET_TOKENIZED_PAYMENT_START', {
        paymentMethod,
        mobileNumber
      });
      
      // Extract the specific wallet type (gcash, grabpay, etc.)
      const walletType = paymentMethod.split('-')[1]?.toUpperCase() || 'GCASH';
      logApiStep('EWALLET_TYPE_EXTRACTED', { walletType });
      
      // Map to the correct Xendit channel code - ensure we only use supported types
      let channelCode: 'GCASH' | 'GRABPAY' | 'SHOPEEPAY' | 'PAYMAYA';
      if (walletType === 'GCASH') channelCode = 'GCASH';
      else if (walletType === 'GRABPAY') channelCode = 'GRABPAY';
      else if (walletType === 'SHOPEEPAY') channelCode = 'SHOPEEPAY';
      else if (walletType === 'PAYMAYA') channelCode = 'PAYMAYA';
      else channelCode = 'GCASH'; // Default to GCASH for unsupported types
      
      logApiStep('CHANNEL_CODE_MAPPED', { channelCode });
      
      try {
        // Create customer in Xendit
        logApiStep('CUSTOMER_CREATE_START', {
          purchaseId: purchase.id,
          email: purchase.email
        });
        
        const customer = await createCustomer({
          referenceId: `customer_${purchase.id}`,
          email: purchase.email,
          givenNames: purchase.email.split('@')[0], // Use part of email as name if actual name is not available
          mobileNumber: mobileNumber
        });
        
        logApiStep('CUSTOMER_CREATE_SUCCESS', { customerId: customer.id });
        
        // Create payment method for the customer
        logApiStep('PAYMENT_METHOD_CREATE_START', {
          customerId: customer.id,
          ewalletType: walletType
        });
        
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
          
          logApiStep('PAYMENT_METHOD_CREATE_SUCCESS', {
            paymentMethodId: paymentMethodResponse.id,
            status: paymentMethodResponse.status
          });
          
          // If payment method is active, proceed with creating the e-wallet payment
          if (paymentMethodResponse.status === 'ACTIVE') {
            logApiStep('PAYMENT_METHOD_ACTIVE_CREATING_PAYMENT');
            
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
            logApiStep('EWALLET_PAYMENT_CREATE_START', {
              paymentMethodId: paymentMethodResponse.id,
              amount,
              currency
            });
            
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
            
            logApiStep('EWALLET_PAYMENT_CREATE_SUCCESS', {
              paymentId: ewalletPayment.id,
              status: ewalletPayment.status
            });
            
            // Update payment method response with payment information
            paymentMethodResponse = {
              ...paymentMethodResponse,
              payment: ewalletPayment
            };
          } else if (paymentMethodResponse.status === 'REQUIRES_ACTION') {
            logApiStep('PAYMENT_METHOD_REQUIRES_ACTION', {
              hasActions: !!(paymentMethodResponse.actions && paymentMethodResponse.actions.length > 0),
              actionsCount: paymentMethodResponse.actions?.length || 0
            });
            
            // Reset the action URL before extracting from the payment method response
            actionUrl = '';
            
            if (paymentMethodResponse.actions && paymentMethodResponse.actions.length > 0) {
              logApiStep('PROCESSING_PAYMENT_ACTIONS', {
                actions: paymentMethodResponse.actions.map((action: PaymentAction) => ({
                  action: action.action,
                  url_type: action.url_type,
                  hasUrl: !!action.url
                }))
              });
              
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
                logApiStep('ACTION_URL_FOUND', {
                  actionUrl,
                  actionType: action.url_type
                });
              } else {
                logApiStep('NO_SUITABLE_ACTION_FOUND');
              }
            }
            
            // If there's a direct action URL in the response, use that
            if (paymentMethodResponse.redirect_url && !actionUrl) {
              actionUrl = paymentMethodResponse.redirect_url;
              logApiStep('USING_REDIRECT_URL_AS_ACTION', { actionUrl });
            }
            
            if (!actionUrl) {
              logApiStep('NO_ACTION_URL_ERROR', { paymentMethodResponse });
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
          logApiStep('PAYMENT_METHOD_CREATE_ERROR', {
            errorCode: paymentMethodError?.error_code,
            errorMessage: paymentMethodError?.message
          }, paymentMethodError);
          
          // If we get LINKED_ACCOUNT_NOT_FOUND_ERROR, proceed with direct e-wallet payment
          if (paymentMethodError?.error_code === 'LINKED_ACCOUNT_NOT_FOUND_ERROR') {
            logApiStep('LINKED_ACCOUNT_NOT_FOUND_USING_DIRECT_PAYMENT');
            
            // Use direct e-wallet payment instead (without tokenization)
            logApiStep('DIRECT_PAYMENT_API_CALL_START', {
              walletType,
              amount,
              currency
            });
            
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
            
            logApiStep('DIRECT_PAYMENT_API_RESPONSE', {
              status: directPaymentResponse.status,
              statusText: directPaymentResponse.statusText,
              ok: directPaymentResponse.ok
            });
            
            if (!directPaymentResponse.ok) {
              const errorText = await directPaymentResponse.text();
              logApiStep('DIRECT_PAYMENT_API_ERROR', {
                status: directPaymentResponse.status,
                statusText: directPaymentResponse.statusText,
                errorText
              });
              
              let errorData;
              try {
                errorData = JSON.parse(errorText);
              } catch (parseError) {
                logApiStep('DIRECT_PAYMENT_ERROR_PARSE_FAILED', { errorText }, parseError);
                errorData = { message: 'Failed to parse error response', raw: errorText };
              }
              
              throw new Error(`Failed to create direct payment: ${directPaymentResponse.status} ${directPaymentResponse.statusText}`);
            }
            
            const responseText = await directPaymentResponse.text();
            logApiStep('DIRECT_PAYMENT_RESPONSE_TEXT', {
              length: responseText.length,
              preview: responseText.substring(0, 200) + (responseText.length > 200 ? '...' : '')
            });
            
            try {
              paymentMethodResponse = JSON.parse(responseText);
              logApiStep('DIRECT_PAYMENT_PARSE_SUCCESS', {
                paymentId: paymentMethodResponse.id,
                status: paymentMethodResponse.status
              });
            } catch (parseError) {
              logApiStep('DIRECT_PAYMENT_PARSE_ERROR', { responseText }, parseError);
              throw new Error('Failed to parse direct payment response');
            }
          } else {
            // If it's a different error, rethrow it
            throw paymentMethodError;
          }
        }
        
        logApiStep('PAYMENT_METHOD_FINAL_RESULT', {
          paymentMethodId: paymentMethodResponse.id,
          status: paymentMethodResponse.status
        });
        
        // Update purchase status to pending
        await updatePurchaseStatus(purchase.id, 'pending', paymentMethodResponse.id);
        
        // Record transaction in the database
        await prisma.transaction.create({
          data: {
            userId: purchase.product.userId,
            amount: purchase.amount,
            currency: purchase.currency,
            type: 'payment',
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
        logApiStep('EXTRACTING_REDIRECT_URL_FROM_RESPONSE');
        
        if (paymentMethodResponse.actions && paymentMethodResponse.actions.length > 0) {
          logApiStep('PROCESSING_RESPONSE_ACTIONS', {
            actionsCount: paymentMethodResponse.actions.length,
            actions: paymentMethodResponse.actions.map((action: PaymentAction) => ({
              action: action.action,
              url_type: action.url_type,
              method: action.method,
              hasUrl: !!action.url
            }))
          });
          
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
            
            logApiStep('ACTION_DETAILS', {
              actionUrl,
              actionType,
              method: action.method
            });
            
            // Check if this is a verification action or a redirect
            if (action.method === 'GET' && (actionUrl.includes('authorize') || actionUrl.includes('verification'))) {
              requiresAction = true;
              logApiStep('PAYMENT_REQUIRES_USER_VERIFICATION', { actionType });
            } else {
              redirectUrl = actionUrl;
              logApiStep('PAYMENT_REDIRECT_URL_SET', { redirectUrl });
            }
          }
        }
        
        // If there's a direct redirect URL in the response, use that
        if (paymentMethodResponse.redirect_url && !redirectUrl) {
          redirectUrl = paymentMethodResponse.redirect_url;
          logApiStep('USING_DIRECT_REDIRECT_URL', { redirectUrl });
        }
        
        // If we have neither a redirect URL nor an action URL, check if there's a status that indicates success
        if (!redirectUrl && !requiresAction) {
          if (paymentMethodResponse.status === 'SUCCEEDED' || paymentMethodResponse.status === 'COMPLETED') {
            logApiStep('PAYMENT_ALREADY_SUCCEEDED');
            // If payment already succeeded, redirect to success URL
            redirectUrl = successUrl;
          } else if (!actionUrl) {
            logApiStep('NO_REDIRECT_OR_ACTION_URL_ERROR', { paymentMethodResponse });
            throw new Error('No redirect URL or action found in payment response');
          }
        }
        
        logApiStep('PAYMENT_REQUEST_SUCCESSFUL', {
          requiresAction,
          finalUrl: requiresAction ? actionUrl : redirectUrl
        });
        
        // Send purchase confirmation email immediately
        try {
          logApiStep('SENDING_CONFIRMATION_EMAIL', {
            email: purchase.email,
            productName: purchase.product.name
          });
          
          const productSlug = purchase.product.slug || purchase.product.id;
          
          await sendPurchaseConfirmationEmail(
            purchase.email,
            purchase.product.name,
            purchase.accessCode,
            productSlug,
            purchase.amount,
            purchase.currency
          );
          
          logApiStep('CONFIRMATION_EMAIL_SENT');
        } catch (emailError) {
          logApiStep('CONFIRMATION_EMAIL_ERROR', {}, emailError);
          // Continue processing even if email fails
        }
        
        // Determine the final URL to redirect to
        const finalRedirectUrl = requiresAction ? actionUrl : redirectUrl;
        
        if (!finalRedirectUrl) {
          logApiStep('NO_FINAL_REDIRECT_URL_ERROR');
          return NextResponse.json({
            success: false,
            error: 'No redirect URL available'
          }, { status: 400 });
        }
        
        logApiStep('RETURNING_FINAL_RESPONSE', {
          finalRedirectUrl,
          paymentId: paymentMethodResponse.id,
          paymentStatus: paymentMethodResponse.status || 'PENDING',
          requiresAction,
          tokenized: paymentMethodResponse.payment_method_id ? true : false
        });
        
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
        logApiStep('EWALLET_TOKENIZED_PAYMENT_ERROR', {}, error);
        return NextResponse.json({ 
          error: 'Failed to create tokenized payment', 
          details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
      }

    } else if (paymentMethod === 'card') {
      logApiStep('CARD_PAYMENT_START', {
        purchaseId,
        hasCardNumber: !!cardNumber,
        hasCardExpiry: !!cardExpiry,
        hasCardCvc: !!cardCvc,
        hasCardName: !!cardName
      });
      
      // Create a transaction record for the payment attempt
      try {
        logApiStep('CARD_TRANSACTION_CREATE_START');
        
        const transaction = await prisma.transaction.create({
          data: {
            userId: purchase.product.userId,
            amount: amount,
            currency: currency,
            type: 'payment',
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
        
        logApiStep('CARD_TRANSACTION_CREATE_SUCCESS', { transactionId: transaction.id });
        
        // Update purchase status to pending
        await prisma.purchase.update({
          where: { id: purchase.id },
          data: {
            paymentMethod: 'card',
            status: 'pending'
          }
        });
        
        logApiStep('CARD_PURCHASE_STATUS_UPDATED');
        
        // Process the card payment using our new function
        try {
          logApiStep('CARD_PAYMENT_PROCESSING_START');
          
          // Create metadata for the payment
          const metadata = {
            product_id: purchase.productId,
            purchase_id: purchase.id,
            transaction_id: transaction.id
          };
          
          // Generate a unique external ID for this payment
          const externalId = `purchase_${purchase.id}_${Date.now()}`;
          
          logApiStep('CARD_PAYMENT_XENDIT_CALL_START', {
            externalId,
            amount,
            currency
          });
          
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
          
          logApiStep('CARD_PAYMENT_XENDIT_CALL_SUCCESS', {
            paymentId: paymentResult.paymentId,
            status: paymentResult.status
          });
          
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
            logApiStep('CARD_CONFIRMATION_EMAIL_START');
            
            const productSlug = purchase.product.slug || purchase.product.id;
            
            await sendPurchaseConfirmationEmail(
              purchase.email,
              purchase.product.name,
              purchase.accessCode,
              productSlug,
              purchase.amount,
              purchase.currency
            );
            
            logApiStep('CARD_CONFIRMATION_EMAIL_SUCCESS');
          } catch (emailError) {
            logApiStep('CARD_CONFIRMATION_EMAIL_ERROR', {}, emailError);
            // Continue processing even if email fails
          }
          
          // Return success response with access code
          logApiStep('CARD_PAYMENT_SUCCESS_RESPONSE', {
            accessCode: purchase.accessCode,
            paymentId: paymentResult.paymentId
          });
          
          return NextResponse.json({
            success: true,
            accessCode: purchase.accessCode,
            paymentId: paymentResult.paymentId,
            status: 'completed'
          });
          
        } catch (paymentError) {
          logApiStep('CARD_PAYMENT_PROCESSING_ERROR', {
            transactionId: transaction.id
          }, paymentError);
          
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
        logApiStep('CARD_TRANSACTION_CREATE_ERROR', { purchaseId: purchase.id }, error);
        return NextResponse.json({ 
          error: 'Failed to create transaction record for card payment', 
          details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
      }
    } else {
      // Handle other payment methods if needed
      logApiStep('UNSUPPORTED_PAYMENT_METHOD', { paymentMethod });
      return NextResponse.json({ 
        error: 'Unsupported payment method',
        details: 'Only e-wallet payments are supported at this time'
      }, { status: 400 });
    }

  } catch (error) {
    logApiStep('API_REQUEST_ERROR', {
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      errorStack: error instanceof Error ? error.stack : undefined
    }, error);
    
    return NextResponse.json({ 
      error: 'Payment processing failed', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
