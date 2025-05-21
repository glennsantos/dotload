import { CreditCard, Smartphone, QrCode, Wallet } from "lucide-react";

interface PaymentMethodSelectorProps {
  paymentMethod: string;
  setPaymentMethod: (method: string) => void;
}

export default function PaymentMethodSelector({ 
  paymentMethod, 
  setPaymentMethod 
}: PaymentMethodSelectorProps) {
  return (
    <div>
      <h2 className="text-lg font-medium text-gray-900 mb-4">Payment Method</h2>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div 
          className={`border rounded-md p-4 flex items-center cursor-pointer ${paymentMethod === 'card' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
          onClick={() => setPaymentMethod('card')}
        >
          <div className="flex-shrink-0 mr-3">
            <CreditCard className="h-6 w-6 text-gray-600" />
          </div>
          <div>
            <p className="font-medium">Credit Card</p>
            <p className="text-xs text-gray-500">Pay with Credit Card</p>
          </div>
        </div>

        <div 
          className={`border rounded-md p-4 flex items-center cursor-pointer ${paymentMethod === 'ewallet_gcash' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
          onClick={() => setPaymentMethod('ewallet_gcash')}
        >
          <div className="flex-shrink-0 mr-3">
            <Smartphone className="h-6 w-6 text-gray-600" />
          </div>
          <div>
            <p className="font-medium">GCash</p>
            <p className="text-xs text-gray-500">Pay with GCash</p>
          </div>
        </div>
        
        <div 
          className={`border rounded-md p-4 flex items-center cursor-pointer ${paymentMethod === 'ewallet_grabpay' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
          onClick={() => setPaymentMethod('ewallet_grabpay')}
        >
          <div className="flex-shrink-0 mr-3">
            <Wallet className="h-6 w-6 text-gray-600" />
          </div>
          <div>
            <p className="font-medium">GrabPay</p>
            <p className="text-xs text-gray-500">Pay with GrabPay</p>
          </div>
        </div>
        
        <div 
          className={`border rounded-md p-4 flex items-center cursor-pointer ${paymentMethod === 'ewallet_paymaya' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
          onClick={() => setPaymentMethod('ewallet_paymaya')}
        >
          <div className="flex-shrink-0 mr-3">
            <QrCode className="h-6 w-6 text-gray-600" />
          </div>
          <div>
            <p className="font-medium">Maya</p>
            <p className="text-xs text-gray-500">Pay with Maya</p>
          </div>
        </div>
      </div>
      
      {/* Payment method specific instructions */}
      {paymentMethod !== "card" && (
        <div className="mb-6 p-4 bg-gray-50 rounded-md">
          <p className="text-sm text-gray-600">
            You will be redirected to complete your payment with {paymentMethod.includes('gcash') ? "GCash" : 
              paymentMethod.includes('grabpay') ? "GrabPay" : 
              paymentMethod.includes('shopeepay') ? "ShopeePay" : 
              paymentMethod.includes('paymaya') ? "Maya" : 
              paymentMethod}.
          </p>
        </div>
      )}
    </div>
  );
}
