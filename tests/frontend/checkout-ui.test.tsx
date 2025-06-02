import React from 'react';
import { render, screen } from '@testing-library/react';
import CheckoutForm from '../../app/p/[slug]/checkout/components/CheckoutForm';
import { Product, Discount } from '../../app/p/[slug]/checkout/components/types';

// Mock the CreditCardForm component
jest.mock('@/components/payment/CreditCardForm', () => {
  return function MockCreditCardForm() {
    return <div data-testid="credit-card-form">Credit Card Form</div>;
  };
});

describe('CheckoutForm UI Behavior', () => {
  const mockOnSubmit = jest.fn();
  const mockSetEmail = jest.fn();
  const mockSetMobileNumber = jest.fn();
  const mockSetSelectedVariation = jest.fn();
  const mockSetPaymentMethod = jest.fn();
  const mockSetCardNumber = jest.fn();
  const mockSetCardExpiry = jest.fn();
  const mockSetCardCvc = jest.fn();
  const mockSetCardName = jest.fn();
  const mockSetDiscountCode = jest.fn();
  const mockSetAppliedDiscount = jest.fn();
  const mockSetPaymentError = jest.fn();

  const baseProps = {
    email: 'test@example.com',
    setEmail: mockSetEmail,
    mobileNumber: '09123456789',
    setMobileNumber: mockSetMobileNumber,
    selectedVariation: '',
    setSelectedVariation: mockSetSelectedVariation,
    paymentMethod: 'card',
    setPaymentMethod: mockSetPaymentMethod,
    cardNumber: '',
    setCardNumber: mockSetCardNumber,
    cardExpiry: '',
    setCardExpiry: mockSetCardExpiry,
    cardCvc: '',
    setCardCvc: mockSetCardCvc,
    cardName: '',
    setCardName: mockSetCardName,
    discountCode: '',
    setDiscountCode: mockSetDiscountCode,
    appliedDiscount: null as Discount | null,
    setAppliedDiscount: mockSetAppliedDiscount,
    paymentError: null,
    setPaymentError: mockSetPaymentError,
    processingPayment: false,
    onSubmit: mockOnSubmit
  };

  const productWithDiscountCodes: Product = {
    id: 'product-1',
    name: 'Product with Discounts',
    price: 100,
    currency: 'PHP',
    discountCodes: [
      {
        id: '1',
        code: 'TEST20',
        type: 'percentage',
        value: 20,
        isActive: true,
        expiresAt: '2025-12-31'
      }
    ]
  };

  const productWithoutDiscountCodes: Product = {
    id: 'product-2',
    name: 'Product without Discounts',
    price: 100,
    currency: 'PHP',
    discountCodes: []
  };

  const productWithNullDiscountCodes: Product = {
    id: 'product-3',
    name: 'Product with null Discounts',
    price: 100,
    currency: 'PHP',
    discountCodes: undefined
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should show discount code field when product has discount codes', () => {
    render(
      <CheckoutForm
        {...baseProps}
        product={productWithDiscountCodes}
      />
    );

    expect(screen.getByLabelText('Discount Code')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter discount code')).toBeInTheDocument();
    expect(screen.getByText('Apply')).toBeInTheDocument();
  });

  it('should hide discount code field when product has empty discount codes array', () => {
    render(
      <CheckoutForm
        {...baseProps}
        product={productWithoutDiscountCodes}
      />
    );

    expect(screen.queryByLabelText('Discount Code')).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Enter discount code')).not.toBeInTheDocument();
    expect(screen.queryByText('Apply')).not.toBeInTheDocument();
  });

  it('should hide discount code field when product has no discount codes property', () => {
    render(
      <CheckoutForm
        {...baseProps}
        product={productWithNullDiscountCodes}
      />
    );

    expect(screen.queryByLabelText('Discount Code')).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Enter discount code')).not.toBeInTheDocument();
    expect(screen.queryByText('Apply')).not.toBeInTheDocument();
  });

  it('should show other form fields regardless of discount code availability', () => {
    render(
      <CheckoutForm
        {...baseProps}
        product={productWithoutDiscountCodes}
      />
    );

    // Verify other form fields are still present
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Mobile Number')).toBeInTheDocument();
    expect(screen.getByTestId('credit-card-form')).toBeInTheDocument();
  });

  it('should handle discount codes as JSON string format', () => {
    const productWithStringDiscountCodes: Product = {
      ...productWithDiscountCodes,
      discountCodes: JSON.stringify(productWithDiscountCodes.discountCodes)
    };

    render(
      <CheckoutForm
        {...baseProps}
        product={productWithStringDiscountCodes}
      />
    );

    expect(screen.getByLabelText('Discount Code')).toBeInTheDocument();
  });
}); 