import React, { useState } from "react";
import { Tag } from "lucide-react";
import { Discount, Product } from "./types";
import PaymentMethodSelector from "./PaymentMethodSelector";
import CardDetailsForm from "./CardDetailsForm";
import CreditCardForm from "@/components/payment/CreditCardForm";
import { calculateFinalPrice, validateDiscountCode, hasDiscountCodes } from "./utils";

interface CheckoutFormProps {
  product: Product;
  email: string;
  setEmail: (value: string) => void;
  mobileNumber: string;
  setMobileNumber: (value: string) => void;
  selectedVariation: string;
  setSelectedVariation: (value: string) => void;
  paymentMethod: string;
  setPaymentMethod: (value: string) => void;
  cardNumber: string;
  setCardNumber: (value: string) => void;
  cardExpiry: string;
  setCardExpiry: (value: string) => void;
  cardCvc: string;
  setCardCvc: (value: string) => void;
  cardName: string;
  setCardName: (value: string) => void;
  discountCode: string;
  setDiscountCode: (value: string) => void;
  appliedDiscount: Discount | null;
  setAppliedDiscount: (discount: Discount | null) => void;
  paymentError: string | null;
  setPaymentError: (error: string | null) => void;
  processingPayment: boolean;
  onSubmit: (e: React.FormEvent) => Promise<void>;
}

export default function CheckoutForm({
  product,
  email,
  setEmail,
  mobileNumber,
  setMobileNumber,
  selectedVariation,
  setSelectedVariation,
  paymentMethod,
  setPaymentMethod,
  cardNumber,
  setCardNumber,
  cardExpiry,
  setCardExpiry,
  cardCvc,
  setCardCvc,
  cardName,
  setCardName,
  discountCode,
  setDiscountCode,
  appliedDiscount,
  setAppliedDiscount,
  paymentError,
  setPaymentError,
  processingPayment,
  onSubmit
}: CheckoutFormProps) {
  // Function to handle discount code validation
  const handleValidateDiscountCode = () => {
    if (!discountCode || !product) return;
    
    // Reset any previously applied discount
    setAppliedDiscount(null);
    setPaymentError(null);
    
    const result = validateDiscountCode(discountCode, product);
    setAppliedDiscount(result.appliedDiscount);
    setPaymentError(result.error);
  };

  // Determine if we should use a form element based on payment method
  // For card payments, we don't need the outer form since CreditCardForm has its own form
  const FormWrapper = paymentMethod === "card" ? React.Fragment : "form";
  
  // Prepare props for the form element if needed
  const formProps = paymentMethod === "card" ? {} : {
    onSubmit,
  };
  
  return (
    <FormWrapper {...formProps}>
      {/* Email field */}
      <div className="mb-6">
        <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">Email</label>
        <input
          type="email"
          id="email"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground placeholder:text-muted-foreground transition-colors"
          placeholder="your@email.com"
          required
        />
      </div>
      
      {/* Mobile number field */}
      <div className="mb-6">
        <label htmlFor="mobileNumber" className="block text-sm font-medium text-foreground mb-2">Mobile Number</label>
        <input
          type="tel"
          id="mobileNumber"
          name="mobileNumber"
          value={mobileNumber}
          onChange={(e) => setMobileNumber(e.target.value)}
          className="w-full p-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground placeholder:text-muted-foreground transition-colors"
          placeholder="e.g. 09123456789"
          required
        />
      </div>
      
      {/* Product Variations */}
      {product?.variations && product.variations.length > 0 && (
        <div className="mb-6">
          <label htmlFor="variation" className="block text-sm font-medium text-foreground mb-2">Select Variation</label>
          <select
            id="variation"
            name="variation"
            value={selectedVariation}
            onChange={(e) => setSelectedVariation(e.target.value)}
            className="w-full p-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground transition-colors"
            required
          >
            <option value="">Select a variation</option>
            {product.variations.map((variation: any) => {
              const options = typeof variation.options === 'string' ? 
                JSON.parse(variation.options) : variation.options;
              
              return options.map((option: string, optionIndex: number) => (
                <option key={`${variation.id}-${optionIndex}`} value={`${variation.id}:${option}`}>
                  {variation.name}: {option}
                </option>
              ));
            })}
          </select>
        </div>
      )}
      
      {/* Discount Code field */}
      {hasDiscountCodes(product) && (
        <div className="mb-6">
          <label htmlFor="discountCode" className="block text-sm font-medium text-foreground mb-2">Discount Code</label>
          <div className="flex">
            <input
              type="text"
              id="discountCode"
              name="discountCode"
              value={discountCode}
              onChange={(e) => setDiscountCode(e.target.value)}
              className="flex-1 p-3 border border-border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground placeholder:text-muted-foreground transition-colors"
              placeholder="Enter discount code"
            />
            <button
              type="button"
              onClick={() => handleValidateDiscountCode()}
              className="bg-muted hover:bg-muted/80 text-muted-foreground px-4 rounded-r-lg flex items-center border border-l-0 border-border transition-colors"
            >
              <Tag className="h-4 w-4 mr-1" />
              Apply
            </button>
          </div>
          {appliedDiscount && (
            <div className="mt-2 text-sm text-primary">
              Discount applied: {appliedDiscount.type === 'percentage' ? 
                `${appliedDiscount.value || appliedDiscount.amount}%` : 
                `${product.currency} ${appliedDiscount.value || appliedDiscount.amount}`} off
            </div>
          )}
        </div>
      )}
      
      {/* Payment Method Selector */}
      <PaymentMethodSelector
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
      />
      
      {/* Use the new CreditCardForm when card payment is selected */}
      {paymentMethod === "card" && (
        <div className="mb-6 p-6 bg-card rounded-lg border border-border">
          <CreditCardForm
            purchaseId={product.id}
            amount={calculateFinalPrice(product, appliedDiscount)}
            currency={product.currency || 'PHP'}
            email={email}
            phoneNumber={mobileNumber}
            onSuccess={(accessCode) => {
              // Redirect to success page
              // Use the current URL path to extract the slug
              const pathParts = window.location.pathname.split('/');
              const slug = pathParts[2]; // The slug is the third part of the path /p/[slug]/checkout
              window.location.href = `/p/${slug}/success?code=${accessCode}`;
            }}
            onError={(message) => {
              setPaymentError(message);
            }}
          />
        </div>
      )}
      
      {/* Keep the old CardDetailsForm as a fallback, but hidden */}
      {paymentMethod === "card" && false && (
        <CardDetailsForm
          cardName={cardName}
          setCardName={setCardName}
          cardNumber={cardNumber}
          setCardNumber={setCardNumber}
          cardExpiry={cardExpiry}
          setCardExpiry={setCardExpiry}
          cardCvc={cardCvc}
          setCardCvc={setCardCvc}
        />
      )}
      
      {/* Payment error message */}
      {paymentError && (
        <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive">
          {paymentError}
        </div>
      )}
      
      {/* Submit button - only show for non-card payment methods */}
      {paymentMethod !== "card" && (
        <button
          type="submit"
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={processingPayment}
        >
          {processingPayment ? (
            <div className="flex items-center justify-center">
              <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
              <span className="ml-2">Processing...</span>
            </div>
          ) : (
            `Pay ${new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: product.currency,
                }).format(calculateFinalPrice(product, appliedDiscount))}`
          )}
        </button>
      )}
    </FormWrapper>
  );
}
