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
    <div className="mb-6">
      <h2 className="text-lg font-medium text-foreground mb-4">Payment Method</h2>
      
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div 
          className={`border rounded-lg p-4 flex items-center cursor-pointer transition-all ${
            paymentMethod === 'card' 
              ? 'border-primary bg-primary/5 ring-1 ring-primary' 
              : 'border-border hover:border-primary/50 hover:bg-muted/50'
          }`}
          onClick={() => setPaymentMethod('card')}
        >
          <div className="flex-shrink-0 mr-3">
            <CreditCard className={`h-5 w-5 ${
              paymentMethod === 'card' ? 'text-primary' : 'text-muted-foreground'
            }`} />
          </div>
          <div>
            <p className={`text-sm font-medium ${
              paymentMethod === 'card' ? 'text-primary' : 'text-foreground'
            }`}>Credit Card</p>
            <p className={`text-xs ${
              paymentMethod === 'card' ? 'text-primary/70' : 'text-muted-foreground'
            }`}>Pay with Credit Card</p>
          </div>
        </div>

        <div 
          className={`border rounded-lg p-4 flex items-center cursor-pointer transition-all ${
            paymentMethod === 'ewallet_gcash' 
              ? 'border-primary bg-primary/5 ring-1 ring-primary' 
              : 'border-border hover:border-primary/50 hover:bg-muted/50'
          }`}
          onClick={() => setPaymentMethod('ewallet_gcash')}
        >
          <div className="flex-shrink-0 mr-3">
            <Smartphone className={`h-5 w-5 ${
              paymentMethod === 'ewallet_gcash' ? 'text-primary' : 'text-muted-foreground'
            }`} />
          </div>
          <div>
            <p className={`text-sm font-medium ${
              paymentMethod === 'ewallet_gcash' ? 'text-primary' : 'text-foreground'
            }`}>GCash</p>
            <p className={`text-xs ${
              paymentMethod === 'ewallet_gcash' ? 'text-primary/70' : 'text-muted-foreground'
            }`}>Pay with GCash</p>
          </div>
        </div>
        
        <div 
          className={`border rounded-lg p-4 flex items-center cursor-pointer transition-all ${
            paymentMethod === 'ewallet_grabpay' 
              ? 'border-primary bg-primary/5 ring-1 ring-primary' 
              : 'border-border hover:border-primary/50 hover:bg-muted/50'
          }`}
          onClick={() => setPaymentMethod('ewallet_grabpay')}
        >
          <div className="flex-shrink-0 mr-3">
            <Wallet className={`h-5 w-5 ${
              paymentMethod === 'ewallet_grabpay' ? 'text-primary' : 'text-muted-foreground'
            }`} />
          </div>
          <div>
            <p className={`text-sm font-medium ${
              paymentMethod === 'ewallet_grabpay' ? 'text-primary' : 'text-foreground'
            }`}>GrabPay</p>
            <p className={`text-xs ${
              paymentMethod === 'ewallet_grabpay' ? 'text-primary/70' : 'text-muted-foreground'
            }`}>Pay with GrabPay</p>
          </div>
        </div>
        
        <div 
          className={`border rounded-lg p-4 flex items-center cursor-pointer transition-all ${
            paymentMethod === 'ewallet_paymaya' 
              ? 'border-primary bg-primary/5 ring-1 ring-primary' 
              : 'border-border hover:border-primary/50 hover:bg-muted/50'
          }`}
          onClick={() => setPaymentMethod('ewallet_paymaya')}
        >
          <div className="flex-shrink-0 mr-3">
            <QrCode className={`h-5 w-5 ${
              paymentMethod === 'ewallet_paymaya' ? 'text-primary' : 'text-muted-foreground'
            }`} />
          </div>
          <div>
            <p className={`text-sm font-medium ${
              paymentMethod === 'ewallet_paymaya' ? 'text-primary' : 'text-foreground'
            }`}>Maya</p>
            <p className={`text-xs ${
              paymentMethod === 'ewallet_paymaya' ? 'text-primary/70' : 'text-muted-foreground'
            }`}>Pay with Maya</p>
          </div>
        </div>
        
        {/* Direct Debit Payment Options */}
        <div 
          className={`border rounded-lg p-4 flex items-center cursor-pointer transition-all ${
            paymentMethod === 'direct_debit_bpi' 
              ? 'border-primary bg-primary/5 ring-1 ring-primary' 
              : 'border-border hover:border-primary/50 hover:bg-muted/50'
          }`}
          onClick={() => setPaymentMethod('direct_debit_bpi')}
        >
          <div className="flex-shrink-0 mr-3">
            <DebitCard className={`h-5 w-5 ${
              paymentMethod === 'direct_debit_bpi' ? 'text-primary' : 'text-muted-foreground'
            }`} />
          </div>
          <div>
            <p className={`text-sm font-medium ${
              paymentMethod === 'direct_debit_bpi' ? 'text-primary' : 'text-foreground'
            }`}>BPI Direct Debit</p>
            <p className={`text-xs ${
              paymentMethod === 'direct_debit_bpi' ? 'text-primary/70' : 'text-muted-foreground'
            }`}>Pay with BPI Debit</p>
          </div>
        </div>
        
        <div 
          className={`border rounded-lg p-4 flex items-center cursor-pointer transition-all ${
            paymentMethod === 'direct_debit_ubp' 
              ? 'border-primary bg-primary/5 ring-1 ring-primary' 
              : 'border-border hover:border-primary/50 hover:bg-muted/50'
          }`}
          onClick={() => setPaymentMethod('direct_debit_ubp')}
        >
          <div className="flex-shrink-0 mr-3">
            <DebitCard className={`h-5 w-5 ${
              paymentMethod === 'direct_debit_ubp' ? 'text-primary' : 'text-muted-foreground'
            }`} />
          </div>
          <div>
            <p className={`text-sm font-medium ${
              paymentMethod === 'direct_debit_ubp' ? 'text-primary' : 'text-foreground'
            }`}>UnionBank Direct Debit</p>
            <p className={`text-xs ${
              paymentMethod === 'direct_debit_ubp' ? 'text-primary/70' : 'text-muted-foreground'
            }`}>Pay with UnionBank Debit</p>
          </div>
        </div>
      </div>
      
      {/* Payment method specific instructions */}
      {paymentMethod !== "card" && (
        <div className="mb-6 p-4 bg-muted/50 border border-border rounded-lg">
          <p className="text-sm text-muted-foreground">
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
