// Direct Xendit SDK integration
import Xendit from 'xendit-node';

// Initialize the Xendit client
const xenditClient = new Xendit({
  secretKey: process.env.XENDIT_SECRET_KEY || '',
});

// Xendit API base URL
const XENDIT_API_URL = 'https://api.xendit.co';

// Create a customer in Xendit
export async function createCustomer({
  referenceId,
  email,
  givenNames,
  mobileNumber,
}: {
  referenceId: string;
  email: string;
  givenNames: string;
  mobileNumber: string;
}) {
  try {
    console.log(`[Xendit] Creating customer with reference ID: ${referenceId}`);
    
    // Direct API call to create customer
    const response = await fetch(XENDIT_API_URL + '/customers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(process.env.XENDIT_SECRET_KEY + ':').toString('base64')}`,
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        reference_id: referenceId,
        type: 'INDIVIDUAL',
        given_names: givenNames,
        email: email,
        mobile_number: mobileNumber,
        phone_number: mobileNumber,
        description: 'Customer for alaCarte',
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('[Xendit] Customer creation error:', errorData);
      throw new Error(`Failed to create customer: ${response.status} ${response.statusText}`);
    }
    
    const customer = await response.json();
    console.log(`[Xendit] Customer created with ID: ${customer.id}`);
    console.log('customer response', customer)
    
    return customer;
  } catch (error) {
    console.error('Error creating Xendit customer:', error);
    throw error;
  }
}

// Create a payment method for a customer
export async function createPaymentMethod({
  customerId,
  type,
  reusability,
  referenceId,
  ewalletType,
  mobileNumber,
  successRedirectUrl,
  failureRedirectUrl,
  cancelRedirectUrl,
  customerDetails,
}: {
  customerId?: string;
  type: 'EWALLET' | 'DIRECT_DEBIT' | 'CARD' | 'VIRTUAL_ACCOUNT' | 'OVER_THE_COUNTER' | 'QR_CODE';
  reusability: 'ONE_TIME_USE' | 'MULTIPLE_USE';
  referenceId: string;
  ewalletType?: 'GCASH' | 'GRABPAY' | 'SHOPEEPAY' | 'PAYMAYA';
  mobileNumber?: string;
  successRedirectUrl?: string;
  failureRedirectUrl?: string;
  cancelRedirectUrl?: string;
  customerDetails?: {
    reference_id: string;
    type: 'INDIVIDUAL' | 'BUSINESS';
    individual_detail?: {
      given_names: string;
      surname?: string;
      nationality?: string;
      place_of_birth?: string;
      date_of_birth?: string;
      gender?: 'MALE' | 'FEMALE' | 'OTHER';
      email?: string;
      mobile_number?: string;
    };
  };
}) {
  try {
    console.log(`[Xendit] Creating payment method for customer`);

    const paymentMethod: any = {
      type: type,
      customer_id: customerId,
      reference_id: referenceId,
      reusability: reusability,
      country: 'PH', // Default to Philippines
      status: 'ACTIVE',
      description: `Payment method for ${type}`,
      properties: {
        id: referenceId,
        description: `Payment method for ${type}`
      },
      created: new Date().toISOString(),
      updated: new Date().toISOString()
    };

    // Add customer details if not provided with customer_id
    if (!customerId && customerDetails) {
      paymentMethod.customer = customerDetails;
    }

    // Add type-specific details
    switch (type) {
      case 'EWALLET':
        paymentMethod.ewallet = {
          channel_code: ewalletType,
          channel_properties: {
            success_return_url: successRedirectUrl,
            failure_return_url: failureRedirectUrl,
            cancel_return_url: cancelRedirectUrl,
            mobile_number: mobileNumber
          }
        };
        break;
      // Add other payment method type cases as needed
    }

    console.log('[Xendit] Payment Method Request:', JSON.stringify(paymentMethod, null, 2));
    
    // Direct API call to create payment method
    const response = await fetch(XENDIT_API_URL + '/v2/payment_methods', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(process.env.XENDIT_SECRET_KEY + ':').toString('base64')}`,
        'Accept': 'application/json'
      },
      body: JSON.stringify(paymentMethod)
    });
    
    const responseBody = await response.text();
    
    if (!response.ok) {
      console.error('[Xendit] Payment method creation error:', {
        status: response.status,
        statusText: response.statusText,
        body: responseBody
      });
      throw new Error(`Failed to create payment method: ${response.status} ${response.statusText}`);
    }
    
    const paymentMethodResponse = JSON.parse(responseBody);
    console.log(`[Xendit] Payment method created with ID: ${paymentMethodResponse.id}`);

    console.log('payment method response', paymentMethodResponse)
    
    return paymentMethodResponse;
  } catch (error) {
    console.error('Error creating Xendit payment method:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
}

// Create a payment using a payment method ID or a new payment method
export async function createPayment({
  referenceId,
  amount,
  currency = 'PHP',
  country = 'PH',
  paymentMethodId,
  description,
  metadata,
  customerId,
  // For creating a new payment method on the fly
  paymentMethod,
}: {
  referenceId: string;
  amount: number;
  currency?: string;
  country?: string;
  paymentMethodId?: string;
  description?: string;
  metadata?: Record<string, any>;
  customerId?: string;
  paymentMethod?: {
    type: 'EWALLET' | 'CARD' | 'DIRECT_DEBIT' | 'VIRTUAL_ACCOUNT' | 'OVER_THE_COUNTER' | 'QR_CODE';
    reusability?: 'ONE_TIME_USE' | 'MULTIPLE_USE';
    ewallet?: {
      channelCode: 'GCASH' | 'GRABPAY' | 'SHOPEEPAY' | 'PAYMAYA';
      channelProperties?: {
        successReturnUrl?: string;
        failureReturnUrl?: string;
        cancelReturnUrl?: string;
        mobileNumber?: string;
      };
    };
    card?: {
      cardNumber?: string;
      expiryMonth?: string;
      expiryYear?: string;
      cvv?: string;
      cardholderName?: string;
    };
  };
}) {
  try {
    console.log(`[Xendit] Creating payment for reference: ${referenceId}`);
    
    const paymentRequest: any = {
      reference_id: `purchase_${referenceId}`,
      currency: currency,
      country: country,
      customer_id: customerId,
      reusability: 'MULTIPLE_USE',
      amount: amount,
      checkout_method: 'ONE_TIME_PAYMENT',
      created: new Date().toISOString(),
      updated: new Date().toISOString()
    };

    // Add payment method ID if provided
    if (paymentMethodId) {
      console.log(`[Xendit] Using existing payment method: ${paymentMethodId}`);
      paymentRequest.payment_method_id = paymentMethodId;
    } 
    // Otherwise, create a new payment method on the fly
    else if (paymentMethod) {
      console.log(`[Xendit] Creating new payment method of type: ${paymentMethod.type}`);
      paymentRequest.payment_method = {
        type: paymentMethod.type,
        reusability: paymentMethod.reusability || 'ONE_TIME_USE'
      };

      // Add type-specific properties
      if (paymentMethod.type === 'EWALLET' && paymentMethod.ewallet) {
        const { channelCode, channelProperties } = paymentMethod.ewallet;
        
        paymentRequest.payment_method.ewallet = {
          channel_code: channelCode,
          channel_properties: {
            ...(channelProperties?.successReturnUrl && { success_return_url: channelProperties.successReturnUrl }),
            ...(channelProperties?.failureReturnUrl && { failure_return_url: channelProperties.failureReturnUrl }),
            ...(channelProperties?.cancelReturnUrl && { cancel_return_url: channelProperties.cancelReturnUrl }),
            ...(channelProperties?.mobileNumber && { mobile_number: channelProperties.mobileNumber })
          }
        };
      } else if (paymentMethod.type === 'CARD' && paymentMethod.card) {
        paymentRequest.payment_method.card = {
          card_number: paymentMethod.card.cardNumber,
          expiry_month: paymentMethod.card.expiryMonth,
          expiry_year: paymentMethod.card.expiryYear,
          cvv: paymentMethod.card.cvv,
          cardholder_name: paymentMethod.card.cardholderName
        };
      }
    }

    // Add optional fields if provided
    if (description) {
      paymentRequest.description = description;
    }

    if (metadata) {
      paymentRequest.metadata = metadata;
    }

    if (customerId) {
      paymentRequest.customer_id = customerId;
    }
    
    console.log('[Xendit] Payment Request:', JSON.stringify(paymentRequest, null, 2));
    
    // Direct API call to create payment request
    const response = await fetch(`${XENDIT_API_URL}/payment_requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(process.env.XENDIT_SECRET_KEY + ':').toString('base64')}`,
        'Accept': 'application/json',
        'idempotency-key': referenceId
      },
      body: JSON.stringify(paymentRequest)
    });
    
    const responseBody = await response.text();

    console.log('payment request response', responseBody)
    
    if (!response.ok) {
      console.error('[Xendit] Payment creation error:', {
        status: response.status,
        statusText: response.statusText,
        body: responseBody
      });
      throw new Error(`Failed to create payment: ${response.status} ${response.statusText}`);
    }
    
    const payment = JSON.parse(responseBody);
    console.log(`[Xendit] Payment created with ID: ${payment.id}`);
    console.log(`[Xendit] Payment status: ${payment.status}`);
    
    // Check if payment requires action
    if (payment.status === 'REQUIRES_ACTION' && payment.actions && payment.actions.length > 0) {
      console.log('[Xendit] Payment requires action:', payment.actions);
      
      // Find the best action URL to use (prefer WEB type)
      const webAction = payment.actions.find((action: any) => action.url_type === 'WEB');
      const mobileAction = payment.actions.find((action: any) => action.url_type === 'MOBILE');
      const anyAction = payment.actions[0];
      
      const actionToUse = webAction || mobileAction || anyAction;
      
      if (actionToUse) {
        payment.actionUrl = actionToUse.url;
        payment.actionType = actionToUse.url_type;
        payment.actionMethod = actionToUse.method;
      }
    }
    
    return payment;
  } catch (error) {
    console.error('Error creating Xendit payment:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
}

// Create an invoice payment
export async function createInvoice({
  externalId,
  amount,
  payerEmail,
  description,
  successRedirectUrl,
  failureRedirectUrl,
  currency = 'PHP',
}: {
  externalId: string;
  amount: number;
  payerEmail: string;
  description: string;
  successRedirectUrl: string;
  failureRedirectUrl: string;
  currency?: string;
}) {
  try {
    console.log(`[Xendit] Creating invoice with external ID: ${externalId}`);
    
    // Direct API call to create invoice
    const response = await fetch(`${XENDIT_API_URL}/v2/invoices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(process.env.XENDIT_SECRET_KEY + ':').toString('base64')}`,
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        external_id: externalId,
        amount: amount,
        payer_email: payerEmail,
        description: description,
        success_redirect_url: successRedirectUrl,
        failure_redirect_url: failureRedirectUrl,
        currency: currency
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('[Xendit] Invoice creation error:', errorData);
      throw new Error(`Failed to create invoice: ${response.status} ${response.statusText}`);
    }
    
    const invoice = await response.json();
    console.log(`[Xendit] Invoice created with ID: ${invoice.id}`);
    
    return invoice;
  } catch (error) {
    console.error('Error creating Xendit invoice:', error);
    throw error;
  }
}

// Create QR code payment
export async function createQRCodePayment({
  externalId,
  amount,
  callbackUrl,
  type = 'DYNAMIC',
}: {
  externalId: string;
  amount: number;
  callbackUrl: string;
  type?: 'DYNAMIC' | 'STATIC';
}) {
  try {
    // @ts-ignore - Ignore TypeScript errors for Xendit SDK
    const qrCode = await xenditClient.QRCode.createCode({
      externalID: externalId,
      type: type,
      callbackURL: callbackUrl,
      amount: amount,
      currency: 'PHP',
    });
    
    return qrCode;
  } catch (error) {
    console.error('Error creating Xendit QR code payment:', error);
    throw error;
  }
}

// Create a tokenized e-wallet payment using existing payment method
export async function createTokenizedEWalletPayment({
  paymentMethodId,
  referenceId,
  amount,
  currency,
  description,
}: {
  paymentMethodId: string;
  referenceId: string;
  amount: number;
  currency: string;
  description: string;
}) {
  try {
    console.log(`[Xendit] Creating tokenized payment with payment method: ${paymentMethodId}`);
    
    // Direct API call to create payment using payment method
    const response = await fetch(`${XENDIT_API_URL}/ewallets/charges`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(process.env.XENDIT_SECRET_KEY + ':').toString('base64')}`,
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        reference_id: `purchase_${referenceId}`,
        payment_method_id: paymentMethodId,
        currency: currency,
        amount: amount,
        description: description,
        metadata: {
          purchase_id: referenceId
        }
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('[Xendit] Tokenized payment creation error:', errorData);
      throw new Error(`Failed to create tokenized payment: ${response.status} ${response.statusText}`);
    }
    
    const payment = await response.json();
    console.log(`[Xendit] Tokenized payment created with ID: ${payment.id}`);
    
    return payment;
  } catch (error) {
    console.error('Error creating Xendit tokenized payment:', error);
    throw error;
  }
}

// Get payment method status
export async function getPaymentMethodStatus(paymentMethodId: string) {
  try {
    console.log(`[Xendit] Getting payment method status: ${paymentMethodId}`);
    
    // Direct API call to get payment method
    const response = await fetch(`${XENDIT_API_URL}/payment_methods/${paymentMethodId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${Buffer.from(process.env.XENDIT_SECRET_KEY + ':').toString('base64')}`,
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('[Xendit] Payment method status error:', errorData);
      throw new Error(`Failed to get payment method status: ${response.status} ${response.statusText}`);
    }
    
    const paymentMethod = await response.json();
    console.log(`[Xendit] Payment method status: ${paymentMethod.status}`);
    
    return paymentMethod;
  } catch (error) {
    console.error('Error getting Xendit payment method status:', error);
    throw error;
  }
}

// Create a customer for eWallet payment flow
export async function createEWalletCustomer({
  referenceId,
  mobileNumber,
  givenNames,
}: {
  referenceId: string;
  mobileNumber: string;
  givenNames: string;
}) {
  try {
    console.log(`[Xendit] Creating eWallet customer with reference ID: ${referenceId}`);
    
    // Direct API call to create customer
    const response = await fetch(`${XENDIT_API_URL}/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(process.env.XENDIT_SECRET_KEY + ':').toString('base64')}`,
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        reference_id: referenceId,
        mobile_number: mobileNumber,
        given_names: givenNames
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('[Xendit] eWallet customer creation error:', errorData);
      throw new Error(`Failed to create eWallet customer: ${response.status} ${response.statusText}`);
    }
    
    const customer = await response.json();
    console.log(`[Xendit] eWallet customer created with ID: ${customer.id}`);
    
    return customer;
  } catch (error) {
    console.error('Error creating Xendit eWallet customer:', error);
    throw error;
  }
}

// Create an eWallet payment method
export async function createEWalletPaymentMethod({
  customerId,
  channelCode,
  mobileNumber,
  successReturnUrl,
  failureReturnUrl,
  country = 'PH', // Default to Philippines
}: {
  customerId: string;
  channelCode: string; // 'GCASH', 'GRABPAY', 'SHOPEEPAY', 'PAYMAYA', etc.
  mobileNumber: string;
  successReturnUrl: string;
  failureReturnUrl: string;
  country?: string; // Country code required for some e-wallets like GRABPAY
}) {
  try {
    console.log(`[Xendit] Creating eWallet payment method for customer: ${customerId}`);
    
    // Direct API call to create payment method
    const response = await fetch(`${XENDIT_API_URL}/v2/payment_methods`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(process.env.XENDIT_SECRET_KEY + ':').toString('base64')}`,
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        customer_id: customerId,
        type: 'EWALLET',
        reusability: 'ONE_TIME_USE',
        reference_id: `pm_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`,
        country: country, // Add country parameter required for some e-wallets like GRABPAY
        ewallet: {
          channel_code: channelCode,
          channel_properties: {
            success_return_url: successReturnUrl,
            failure_return_url: failureReturnUrl,
            mobile_number: mobileNumber
          }
        }
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('[Xendit] eWallet payment method creation error:', errorData);
      throw new Error(`Failed to create eWallet payment method: ${response.status} ${response.statusText}`);
    }
    
    const paymentMethod = await response.json();
    console.log(`[Xendit] eWallet payment method created with ID: ${paymentMethod.id}`);
    
    return paymentMethod;
  } catch (error) {
    console.error('Error creating Xendit eWallet payment method:', error);
    throw error;
  }
}

// Create an eWallet charge using payment method
export async function createEWalletCharge({
  paymentMethodId,
  referenceId,
  amount,
  currency,
}: {
  paymentMethodId: string;
  referenceId: string;
  amount: number;
  currency: string;
}) {
  try {
    console.log(`[Xendit] Creating eWallet charge with payment method: ${paymentMethodId}`);
    
    // Direct API call to create payment request
    const response = await fetch(`${XENDIT_API_URL}/ewallets/charges`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(process.env.XENDIT_SECRET_KEY + ':').toString('base64')}`,
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        reference_id: referenceId,
        amount: amount,
        payment_method_id: paymentMethodId,
        currency: currency,
        country: currency === 'IDR' ? 'ID' : currency === 'PHP' ? 'PH' : 'ID',
        reusability: 'MULTIPLE_USE'
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('[Xendit] eWallet charge creation error:', errorData);
      throw new Error(`Failed to create eWallet charge: ${response.status} ${response.statusText}`);
    }
    
    const charge = await response.json();
    console.log(`[Xendit] eWallet charge created with ID: ${charge.id}`);
    
    return charge;
  } catch (error) {
    console.error('Error creating Xendit eWallet charge:', error);
    throw error;
  }
}

// Tokenize a credit card
export async function tokenizeCard({
  cardNumber,
  cardExpMonth,
  cardExpYear,
  cardCvn,
  isSingleUse = true,
}: {
  cardNumber: string;
  cardExpMonth: string;
  cardExpYear: string;
  cardCvn: string;
  isSingleUse?: boolean;
}) {
  try {
    console.log(`[Xendit] Tokenizing credit card`);
    
    // Clean card number (remove spaces)
    const cleanCardNumber = cardNumber.replace(/\s+/g, '');
    
    // Direct API call to tokenize card
    const response = await fetch(`${XENDIT_API_URL}/credit_card_tokens`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(process.env.XENDIT_SECRET_KEY + ':').toString('base64')}`,
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        card_number: cleanCardNumber,
        card_exp_month: cardExpMonth,
        card_exp_year: cardExpYear,
        card_cvn: cardCvn,
        is_single_use: isSingleUse
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('[Xendit] Card tokenization error:', errorData);
      throw new Error(`Failed to tokenize card: ${response.status} ${response.statusText}`);
    }
    
    const tokenData = await response.json();
    console.log(`[Xendit] Card successfully tokenized with ID: ${tokenData.id}`);
    
    return tokenData;
  } catch (error) {
    console.error('Error tokenizing Xendit card:', error);
    throw error;
  }
}

// Charge a credit card using a token
export async function chargeCard({
  tokenId,
  externalId,
  amount,
  currency = 'PHP',
  cardCvn,
  descriptor = 'alaCarte Purchase',
  metadata,
}: {
  tokenId: string;
  externalId: string;
  amount: number;
  currency?: string;
  cardCvn?: string; // Make cardCvn optional for already authenticated tokens
  descriptor?: string;
  metadata?: Record<string, any>;
}) {
  try {
    console.log(`[Xendit] Charging card with token: ${tokenId}`);
    
    // Direct API call to charge card
    const response = await fetch(`${XENDIT_API_URL}/credit_card_charges`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(process.env.XENDIT_SECRET_KEY + ':').toString('base64')}`,
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        token_id: tokenId,
        external_id: externalId,
        amount,
        currency,
        ...(cardCvn ? { card_cvn: cardCvn } : {}),  // Only include card_cvn if provided
        capture: true,
        descriptor,
        metadata
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('[Xendit] Card charge error:', errorData);
      throw new Error(`Failed to charge card: ${response.status} ${response.statusText}`);
    }
    
    const chargeData = await response.json();
    console.log(`[Xendit] Card successfully charged with ID: ${chargeData.id}`);
    
    return chargeData;
  } catch (error) {
    console.error('Error charging Xendit card:', error);
    throw error;
  }
}

// Process a complete credit card payment flow (tokenize + charge)
export async function processCardPayment({
  cardNumber,
  cardExpiry,
  cardCvc,
  cardName,
  amount,
  currency = 'PHP',
  externalId,
  metadata,
}: {
  cardNumber: string;
  cardExpiry: string; // Format: MM/YY
  cardCvc: string;
  cardName: string;
  amount: number;
  currency?: string;
  externalId: string;
  metadata?: Record<string, any>;
}) {
  try {
    console.log(`[Xendit] Processing complete card payment flow for: ${externalId}`);
    
    // Parse expiry month and year from cardExpiry (format: MM/YY)
    const [expiryMonth, expiryYear] = cardExpiry.split('/').map((part: string) => part.trim());
    
    // Step 1: Tokenize the card
    const tokenData = await tokenizeCard({
      cardNumber,
      cardExpMonth: expiryMonth,
      cardExpYear: `20${expiryYear}`, // Add '20' prefix to convert YY to YYYY
      cardCvn: cardCvc,
      isSingleUse: true
    });
    
    // Step 2: Charge the card using the token
    const chargeData = await chargeCard({
      tokenId: tokenData.id,
      externalId,
      amount,
      currency,
      cardCvn: cardCvc,
      descriptor: 'alaCarte Purchase',
      metadata
    });
    
    return {
      success: true,
      paymentId: chargeData.id,
      status: chargeData.status,
      chargeData
    };
  } catch (error) {
    console.error('Error processing card payment:', error);
    throw error;
  }
}

// Create an e-wallet payment (direct method without tokenization)
export async function createEWalletPayment({
  amount,
  referenceId,
  email,
  phone,
  name,
  ewalletType,
  successRedirectUrl,
  failureRedirectUrl,
}: {
  amount: number;
  referenceId: string;
  email: string;
  phone: string;
  name: string;
  ewalletType: 'GCASH' | 'GRABPAY' | 'SHOPEEPAY' | 'PAYMAYA';
  successRedirectUrl: string;
  failureRedirectUrl: string;
}) {
  try {
    console.log(`[Xendit] Creating e-wallet payment for ${ewalletType}`);
    
    // Direct API call to create e-wallet payment
    const response = await fetch(`${XENDIT_API_URL}/ewallets/charges`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(process.env.XENDIT_SECRET_KEY + ':').toString('base64')}`,
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        reference_id: referenceId,
        currency: 'PHP',
        amount: amount,
        checkout_method: 'ONE_TIME_PAYMENT',
        channel_code: ewalletType,
        channel_properties: {
          success_redirect_url: successRedirectUrl,
          failure_redirect_url: failureRedirectUrl,
          mobile_number: phone
        },
        customer: {
          given_names: name,
          email: email,
          mobile_number: phone
        },
        metadata: {
          branch_code: 'ALaCarte_001'
        }
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('[Xendit] E-wallet payment creation error:', errorData);
      throw new Error(`Failed to create e-wallet payment: ${response.status} ${response.statusText}`);
    }
    
    const paymentData = await response.json();
    console.log(`[Xendit] E-wallet payment created with ID: ${paymentData.id}`);
    
    return paymentData;
  } catch (error) {
    console.error('Error creating Xendit e-wallet payment:', error);
    throw error;
  }
}

// Create a one-time payment request (modern Xendit API approach)
export async function createOneTimePayment({
  referenceId,
  amount,
  currency = 'PHP',
  country = 'PH',
  paymentMethodType = 'EWALLET',
  channelCode,
  successReturnUrl,
  failureReturnUrl,
  cancelReturnUrl,
  customerInfo,
  cardInfo,
  skipThreeDSecure = false,
  cardOnFileType,
}: {
  referenceId: string;
  amount: number;
  currency?: string;
  country?: string;
  paymentMethodType?: 'EWALLET' | 'CARD' | 'DIRECT_DEBIT' | 'OVER_THE_COUNTER' | 'VIRTUAL_ACCOUNT' | 'QR_CODE';
  channelCode?: string; // 'GCASH', 'GRABPAY', 'SHOPEEPAY', 'DANA', etc.
  successReturnUrl: string;
  failureReturnUrl: string;
  cancelReturnUrl: string;
  customerInfo?: {
    email?: string;
    name?: string;
    mobileNumber?: string;
  };
  cardInfo?: {
    cardNumber: string;
    expiryMonth: string;
    expiryYear: string;
    cardholderName: string;
    cardholderEmail: string;
    cardholderPhoneNumber: string;
  };
  skipThreeDSecure?: boolean;
  cardOnFileType?: 'CUSTOMER_UNSCHEDULED' | 'MERCHANT_UNSCHEDULED' | 'RECURRING';
}) {
  try {
    console.log(`[Xendit] Creating one-time payment request for ${paymentMethodType} ${channelCode || ''}`);
    
    // Build request body
    const requestBody: any = {
      reference_id: referenceId,
      amount,
      currency,
      country,
      payment_method: {
        type: paymentMethodType,
        reusability: 'ONE_TIME_USE',
        country
      }
    };
    
    // Configure payment method based on type
    if (paymentMethodType === 'EWALLET' && channelCode) {
      requestBody.payment_method.ewallet = {
        channel_code: channelCode,
        channel_properties: {
          success_return_url: successReturnUrl,
          failure_return_url: failureReturnUrl,
          cancel_return_url: cancelReturnUrl
        }
      };
    } else if (paymentMethodType === 'CARD' && cardInfo) {
      // Configure card payment method
      requestBody.payment_method.card = {
        channel_properties: {
          success_return_url: successReturnUrl,
          failure_return_url: failureReturnUrl
        },
        card_information: {
          card_number: cardInfo.cardNumber,
          expiry_month: cardInfo.expiryMonth,
          expiry_year: cardInfo.expiryYear,
          cardholder_name: cardInfo.cardholderName,
          cardholder_email: cardInfo.cardholderEmail,
          cardholder_phone_number: cardInfo.cardholderPhoneNumber
        }
      };
      
      // Add 3DS configuration if specified
      if (skipThreeDSecure) {
        requestBody.payment_method.card.channel_properties.skip_three_d_secure = true;
      }
      
      // Add card-on-file type if specified
      if (cardOnFileType) {
        requestBody.payment_method.card.channel_properties.cardonfile_type = cardOnFileType;
      }
    }
    
    // Add customer info if provided
    if (customerInfo) {
      requestBody.customer = {
        reference_id: customerInfo.email + '_' + referenceId,
        type: 'INDIVIDUAL',
        individual_detail: {
          given_names: customerInfo.name,
        },
        email: customerInfo.email,
        mobile_number: customerInfo.mobileNumber
      };
    }
    
    console.log('[Xendit] Payment request payload:', JSON.stringify(requestBody, null, 2));
    
    // Direct API call to create payment request
    const response = await fetch(`${XENDIT_API_URL}/payment_requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(process.env.XENDIT_SECRET_KEY + ':').toString('base64')}`,
        'Accept': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('[Xendit] Payment request creation error:', errorData);
      throw new Error(`Failed to create payment request: ${response.status} ${response.statusText}`);
    }
    
    const paymentData = await response.json();
    console.log(`[Xendit] Payment request created with ID: ${paymentData.id}`);
    console.log('[Xendit] Payment response:', JSON.stringify(paymentData, null, 2));
    
    return paymentData;
  } catch (error) {
    console.error('Error creating Xendit payment request:', error);
    throw error;
  }
}

// Check the status of a payment request
export async function checkPaymentRequestStatus(paymentRequestId: string) {
  try {
    console.log(`[Xendit] Checking payment request status for ID: ${paymentRequestId}`);
    
    // Direct API call to check payment request status
    const response = await fetch(`${XENDIT_API_URL}/payment_requests/${paymentRequestId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${Buffer.from(process.env.XENDIT_SECRET_KEY + ':').toString('base64')}`,
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('[Xendit] Payment request status check error:', errorData);
      throw new Error(`Failed to check payment request status: ${response.status} ${response.statusText}`);
    }
    
    const paymentData = await response.json();
    console.log(`[Xendit] Payment request status for ID ${paymentRequestId}: ${paymentData.status}`);
    
    return paymentData;
  } catch (error) {
    console.error('Error checking Xendit payment request status:', error);
    throw error;
  }
}

export default xenditClient;
