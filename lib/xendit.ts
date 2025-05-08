import Xendit from 'xendit-node';

// Initialize Xendit with API key from environment variables
const xenditClient = new Xendit({
  secretKey: process.env.XENDIT_SECRET_KEY || '',
});

// Export Xendit modules
export const { Invoice, EWallet, Card, DirectDebit, QrCode } = xenditClient;

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
    const invoice = await Invoice.createInvoice({
      externalId: params.externalId,
      amount: params.amount,
      payerEmail: params.payerEmail,
      description: params.description,
      successRedirectUrl: params.successRedirectUrl,
      failureRedirectUrl: params.failureRedirectUrl,
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
    const payment = await EWallet.createEWalletCharge({
      referenceId: params.externalId,
      currency: 'PHP',
      amount: params.amount,
      checkoutMethod: 'ONE_TIME_PAYMENT',
      channelCode: params.ewalletType,
      channelProperties: {
        successRedirectUrl: params.successRedirectUrl,
        failureRedirectUrl: params.failureRedirectUrl,
        mobileNumber: params.phone,
      },
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
    const charge = await Card.createCharge({
      tokenId: params.tokenId,
      externalId: params.externalId,
      amount: params.amount,
      authId: params.authId,
      cardCvn: params.cardCvn,
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
    const qrCode = await QrCode.createCode({
      externalId: params.externalId,
      type: params.type,
      callbackUrl: params.callbackUrl,
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
    const invoice = await Invoice.getInvoice({ id });
    return invoice;
  } catch (error) {
    console.error('Error getting Xendit payment status:', error);
    throw error;
  }
};

export default xenditClient;
