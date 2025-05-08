// Direct Xendit SDK integration
import Xendit from 'xendit-node';

// Initialize the Xendit client
const xenditClient = new Xendit({
  secretKey: process.env.XENDIT_SECRET_KEY || '',
});

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
    // @ts-ignore - Ignore TypeScript errors for Xendit SDK
    const customer = await xenditClient.Customer.createCustomer({
      referenceID: referenceId,
      email: email,
      givenNames: givenNames,
      mobileNumber: mobileNumber,
      phoneNumber: mobileNumber,
      description: 'Customer for alaCarte',
      type: 'INDIVIDUAL',
    });
    
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
  successRedirectUrl,
  failureRedirectUrl,
}: {
  customerId: string;
  type: 'EWALLET';
  reusability: 'ONE_TIME_USE' | 'MULTIPLE_USE';
  referenceId: string;
  successRedirectUrl: string;
  failureRedirectUrl: string;
}) {
  try {
    // @ts-ignore - Ignore TypeScript errors for Xendit SDK
    const paymentMethod = await xenditClient.PaymentMethod.createPaymentMethod({
      customerId: customerId,
      type: type,
      reusability: reusability,
      referenceID: referenceId,
      ewallet: {
        channelCode: 'GCASH',
        channelProperties: {
          successRedirectURL: successRedirectUrl,
          failureRedirectURL: failureRedirectUrl,
        },
      },
    });
    
    return paymentMethod;
  } catch (error) {
    console.error('Error creating Xendit payment method:', error);
    throw error;
  }
}

// Create a direct e-wallet payment without customer creation
export async function createEWalletPayment({
  referenceId,
  amount,
  phone,
  email,
  name,
  ewalletType,
  successRedirectUrl,
  failureRedirectUrl,
}: {
  referenceId: string;
  amount: number;
  phone: string;
  email: string;
  name: string;
  ewalletType: 'GCASH' | 'GRABPAY' | 'SHOPEEPAY' | 'PAYMAYA';
  successRedirectUrl: string;
  failureRedirectUrl: string;
}) {
  try {
    // Direct implementation using EWallet API
    // @ts-ignore - Ignore TypeScript errors for Xendit SDK
    const payment = await xenditClient.EWallet.createEWalletCharge({
      referenceID: `purchase_${referenceId}`,
      currency: 'PHP',
      amount: amount,
      checkoutMethod: 'ONE_TIME_PAYMENT',
      channelCode: ewalletType,
      channelProperties: {
        successRedirectURL: successRedirectUrl,
        failureRedirectURL: failureRedirectUrl,
        mobileNumber: phone,
      },
      metadata: {
        branch_code: 'ONLINE_PAYMENT'
      }
    });
    
    return {
      id: payment.id,
      actions: paymentMethod.actions,
      status: payment.status
    };
  } catch (error) {
    console.error('Error creating Xendit e-wallet payment:', error);
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
    // @ts-ignore - Ignore TypeScript errors for Xendit SDK
    const invoice = await xenditClient.Invoice.createInvoice({
      externalID: externalId,
      amount: amount,
      payerEmail: payerEmail,
      description: description,
      successRedirectURL: successRedirectUrl,
      failureRedirectURL: failureRedirectUrl,
      currency: currency,
    });
    
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

export default xenditClient;
