import React, { useState } from "react";
import { Tag } from "lucide-react";
import { Discount, Product } from "./types";
import PaymentMethodSelector from "./PaymentMethodSelector";
import CardDetailsForm from "./CardDetailsForm";
import CreditCardForm from "@/components/payment/CreditCardForm";
import { calculateFinalPrice, validateDiscountCode } from "./utils";

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
    className: "bg-white shadow-sm rounded-lg p-6"
  };
  
  return (
    <FormWrapper {...formProps}>
      {/* Email field */}
      <div className="mb-6">
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
        <input
          type="email"
          id="email"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="your@email.com"
          required
        />
      </div>
      
      {/* Mobile number field */}
      <div className="mb-6">
        <label htmlFor="mobileNumber" className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
        <input
          type="tel"
          id="mobileNumber"
          name="mobileNumber"
          value={mobileNumber}
          onChange={(e) => setMobileNumber(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g. 09123456789"
          required
        />
      </div>
      
      {/* Product Variations */}
      {product?.variations && product.variations.length > 0 && (
        <div className="mb-6">
          <label htmlFor="variation" className="block text-sm font-medium text-gray-700 mb-1">Select Variation</label>
          <select
            id="variation"
            name="variation"
            value={selectedVariation}
            onChange={(e) => setSelectedVariation(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
      <div className="mb-6">
        <label htmlFor="discountCode" className="block text-sm font-medium text-gray-700 mb-1">Discount Code</label>
        <div className="flex">
          <input
            type="text"
            id="discountCode"
            name="discountCode"
            value={discountCode}
            onChange={(e) => setDiscountCode(e.target.value)}
            className="flex-1 p-3 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter discount code"
          />
          <button
            type="button"
            onClick={() => handleValidateDiscountCode()}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 rounded-r-md flex items-center"
          >
            <Tag className="h-4 w-4 mr-1" />
            Apply
          </button>
        </div>
        {appliedDiscount && (
          <div className="mt-2 text-sm text-green-600">
            Discount applied: {appliedDiscount.type === 'percentage' ? `${appliedDiscount.amount}%` : `${product.currency} ${appliedDiscount.amount}`} off
          </div>
        )}
      </div>
      
      {/* Payment Method Selector */}
      <PaymentMethodSelector
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
      />
      
      {/* Use the new CreditCardForm when card payment is selected */}
      {paymentMethod === "card" && (
        <>
          {console.log('[CheckoutForm] Passing to CreditCardForm - Email:', email, 'Mobile:', mobileNumber)}
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
        </>
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
        <div className="mb-6 p-4 bg-red-50 rounded-md text-red-600">
          {paymentError}
        </div>
      )}
      
      {/* Submit button - only show for non-card payment methods */}
      {paymentMethod !== "card" && (
        <button
          type="submit"
          className="w-full bg-black text-white px-6 py-3 rounded-md font-medium hover:bg-gray-800 transition-colors"
          disabled={processingPayment}
        >
          {processingPayment ? (
            <div className="flex items-center justify-center">
              <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
              <span className="ml-2">Processing...</span>
            </div>
          ) : (
            `Pay ${product.currency} ${calculateFinalPrice(product, appliedDiscount).toFixed(2)}`
          )}
        </button>
      )}
    </FormWrapper>
  );
}
