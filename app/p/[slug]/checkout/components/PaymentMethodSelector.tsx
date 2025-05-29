import { CreditCard, Smartphone, QrCode, Wallet, CreditCard as DebitCard } from "lucide-react";

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
      <h2 className="text-lg font-light text-gray-900 mb-4">Payment Method</h2>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div 
          className={`border rounded-2xl font-light p-4 flex items-center cursor-pointer ${paymentMethod === 'card' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-300'}`}
          onClick={() => setPaymentMethod('card')}
        >
          <div className="flex-shrink-0 mr-3">
            <CreditCard className={`h-6 w-6 ${paymentMethod === 'card' ? 'font-medium text-emerald-700' : 'font-normal text-stone-600'}`} />
          </div>
          <div>
            <p className={`${paymentMethod === 'card' ? 'font-normal text-emerald-700' : 'font-light text-stone-600'} `}>Credit Card</p>
            <p className={`${paymentMethod === 'card' ? 'font-normal text-xs text-emerald-700' : 'font-normal text-xs text-stone-500'} `}>Pay with Credit Card</p>
          </div>
        </div>

        <div 
          className={`border rounded-2xl p-4 flex items-center cursor-pointer ${paymentMethod === 'ewallet_gcash' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-300'}`}
          onClick={() => setPaymentMethod('ewallet_gcash')}
        >
          <div className="flex-shrink-0 mr-3">
            <Smartphone className={`h-6 w-6 ${paymentMethod === 'ewallet_gcash' ? 'font-medium text-emerald-700' : 'font-light text-stone-600'}`} />
          </div>
          <div>
            <p className={`${paymentMethod === 'ewallet_gcash' ? 'font-nrmal text-emerald-700' : 'font-light text-stone-600'} `}>GCash</p>
            <p className={`${paymentMethod === 'ewallet_gcash' ? 'font-normal text-xs text-emerald-700' : 'font-normal text-xs text-stone-500'} `}>Pay with GCash</p>
          </div>
        </div>
        
        <div 
          className={`border rounded-2xl p-4 flex items-center cursor-pointer ${paymentMethod === 'ewallet_grabpay' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-300'}`}
          onClick={() => setPaymentMethod('ewallet_grabpay')}
        >
          <div className="flex-shrink-0 mr-3">
            <Wallet className={`h-6 w-6 ${paymentMethod === 'ewallet_grabpay' ? 'font-medium text-emerald-700' : 'font-light text-stone-600'}`} />
          </div>
          <div>
            <p className={`${paymentMethod === 'ewallet_grabpay' ? 'font-normal text-emerald-700' : 'font-light text-stone-600'} `}>GrabPay</p>
            <p className={`${paymentMethod === 'ewallet_grabpay' ? 'font-normal text-xs text-emerald-700' : 'font-normal text-xs text-stone-500'} `}>Pay with GrabPay</p>
          </div>
        </div>
        
        <div 
          className={`border rounded-2xl p-4 flex items-center cursor-pointer ${paymentMethod === 'ewallet_paymaya' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-300'}`}
          onClick={() => setPaymentMethod('ewallet_paymaya')}
        >
          <div className="flex-shrink-0 mr-3">
            <QrCode className={`h-6 w-6 ${paymentMethod === 'ewallet_paymaya' ? 'font-medium text-emerald-700' : 'font-light text-stone-600'}`} />
          </div>
          <div>
            <p className={`${paymentMethod === 'ewallet_paymaya' ? 'font-normal text-emerald-700' : 'font-light text-stone-600'} `}>Maya</p>
            <p className={`${paymentMethod === 'ewallet_paymaya' ? 'font-normal text-xs text-emerald-700' : 'font-normal text-xs text-stone-500'} `}>Pay with Maya</p>
          </div>
        </div>
        
        {/* Direct Debit Payment Options */}
        <div 
          className={`border rounded-2xl p-4 flex items-center cursor-pointer ${paymentMethod === 'direct_debit_bpi' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-300'}`}
          onClick={() => setPaymentMethod('direct_debit_bpi')}
        >
          <div className="flex-shrink-0 mr-3">
            <DebitCard className={`h-6 w-6 ${paymentMethod === 'direct_debit_bpi' ? 'font-medium text-emerald-700' : 'font-light text-stone-600'}`} />
          </div>
          <div>
            <p className={`${paymentMethod === 'direct_debit_bpi' ? 'font-normal text-emerald-700' : 'font-light text-stone-600'} `}>BPI Direct Debit</p>
            <p className={`${paymentMethod === 'direct_debit_bpi' ? 'font-normal text-xs text-emerald-700' : 'font-normal text-xs text-stone-500'} `}>Pay with BPI Debit</p>
          </div>
        </div>
        
        <div 
          className={`border rounded-2xl p-4 flex items-center cursor-pointer ${paymentMethod === 'direct_debit_ubp' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-300'}`}
          onClick={() => setPaymentMethod('direct_debit_ubp')}
        >
          <div className="flex-shrink-0 mr-3">
            <DebitCard className={`h-6 w-6 ${paymentMethod === 'direct_debit_ubp' ? 'font-medium text-emerald-700' : 'font-light text-stone-600'}`} />
          </div>
          <div>
            <p className={`${paymentMethod === 'direct_debit_ubp' ? 'font-normal text-emerald-700' : 'font-light text-stone-600'} `}>UnionBank Direct Debit</p>
            <p className={`${paymentMethod === 'direct_debit_ubp' ? 'font-normal text-xs text-emerald-700' : 'font-normal text-xs text-stone-500'} `}>Pay with UnionBank Debit</p>
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
              paymentMethod.includes('bpi') ? "BPI Direct Debit" :
              paymentMethod.includes('ubp') ? "UnionBank Direct Debit" :
              paymentMethod}.
          </p>
        </div>
      )}
    </div>
  );
}
