// Import the Xendit SDK
import Xendit from 'xendit-node';

// Initialize Xendit with API key from environment variables
const xenditClient = new Xendit({
  secretKey: process.env.XENDIT_SECRET_KEY || '',
});

// Helper function to create an invoice
export const createInvoice = async (params: {
  externalId: string;
  amount: number;
  payerEmail: string;
  description: string;
  successRedirectUrl: string;
  failureRedirectUrl: string;
  currency?: string;
  items?: Array<{
    name: string;
    quantity: number;
    price: number;
    category: string;
  }>;
}) => {
  try {
    const Invoice = xenditClient.Invoice;
    const invoice = await Invoice.createInvoice({
      externalID: params.externalId,
      amount: params.amount,
      payerEmail: params.payerEmail,
      description: params.description,
      successRedirectURL: params.successRedirectUrl,
      failureRedirectURL: params.failureRedirectUrl,
      currency: params.currency || 'PHP',
      items: params.items,
    });
    
    return invoice;
  } catch (error) {
    console.error('Error creating Xendit invoice:', error);
    throw error;
  }
};

// Helper function to create an e-wallet payment
export const createEWalletPayment = async (params: {
  externalId: string;
  amount: number;
  phone: string;
  ewalletType: 'GCASH' | 'GRABPAY' | 'SHOPEEPAY' | 'MAYA';
  successRedirectUrl: string;
  failureRedirectUrl: string;
  callbackUrl?: string;
}) => {
  try {
    // Get the EWallet module
    const EWallet = xenditClient.EWallet;
    
    // Create the eWallet charge using the correct API
    const payment = await EWallet.createEWalletCharge({
      referenceID: params.externalId,
      currency: 'PHP',
      amount: params.amount,
      checkoutMethod: 'ONE_TIME_PAYMENT',
      channelCode: params.ewalletType,
      channelProperties: {
        successRedirectURL: params.successRedirectUrl,
        failureRedirectURL: params.failureRedirectUrl,
        mobileNumber: params.phone,
      },
      metadata: {
        branch_code: 'ONLINE_PAYMENT'
      }
    });
    
    return payment;
  } catch (error) {
    console.error('Error creating Xendit e-wallet payment:', error);
    throw error;
  }
};

// Helper function to create a card payment
export const createCardPayment = async (params: {
  externalId: string;
  tokenId: string;
  amount: number;
  authId?: string;
  cardCvn?: string;
  descriptor?: string;
  currency?: string;
  midLabel?: string;
}) => {
  try {
    const Card = xenditClient.Card;
    const charge = await Card.createCharge({
      tokenID: params.tokenId,
      externalID: params.externalId,
      amount: params.amount,
      authID: params.authId,
      cardCVN: params.cardCvn,
      descriptor: params.descriptor,
      currency: params.currency || 'PHP',
      midLabel: params.midLabel,
    });
    
    return charge;
  } catch (error) {
    console.error('Error creating Xendit card payment:', error);
    throw error;
  }
};

// Helper function to create QR code payment
export const createQrCodePayment = async (params: {
  externalId: string;
  amount: number;
  callbackUrl: string;
  type: 'DYNAMIC' | 'STATIC';
}) => {
  try {
    const QRCode = xenditClient.QRCode;
    const qrCode = await QRCode.createCode({
      externalID: params.externalId,
      type: params.type,
      callbackURL: params.callbackUrl,
      amount: params.amount,
      currency: 'PHP',
    });
    
    return qrCode;
  } catch (error) {
    console.error('Error creating Xendit QR code payment:', error);
    throw error;
  }
};

// Helper function to get payment status
export const getPaymentStatus = async (id: string) => {
  try {
    const Invoice = xenditClient.Invoice;
    const invoice = await Invoice.getInvoice({ id });
    return invoice;
  } catch (error) {
    console.error('Error getting Xendit payment status:', error);
    throw error;
  }
};

export default xenditClient;
