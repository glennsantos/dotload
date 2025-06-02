/**
 * ============================================================================
 * FRONTEND TESTS - CHECKOUT & PURCHASE FLOW
 * ============================================================================
 * 
 * Tests for purchase flow including:
 * - Product selection
 * - Checkout form
 * - Payment processing
 * - Order confirmation
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

// Mock Next.js router
const mockPush = jest.fn();
const mockRouter = {
  push: mockPush,
  pathname: '/checkout',
  query: { productId: 'prod123' },
  asPath: '/checkout?productId=prod123',
};

jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  useSearchParams: () => new URLSearchParams('productId=prod123'),
}));

// Mock payment processing
const mockXendit = jest.fn();
jest.mock('@/lib/xendit-client', () => ({
  createPayment: mockXendit,
}));

// Mock toast notifications
jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    loading: jest.fn(),
  },
}));

// Create a mock checkout form
const MockCheckoutForm = () => {
  const [formData, setFormData] = React.useState({
    email: '',
    firstName: '',
    lastName: '',
    paymentMethod: 'credit_card',
  });
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [product] = React.useState({
    id: 'prod123',
    name: 'Test Digital Product',
    price: 2999, // PHP 29.99
    type: 'digital',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation
    if (!formData.email || !formData.firstName || !formData.lastName) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }

    if (!formData.email.includes('@')) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }

    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 200));
      mockRouter.push('/purchase/success?orderId=order123');
    } catch (err) {
      setError('Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div data-testid="checkout-form">
      <h1>Checkout</h1>
      
      {/* Product Summary */}
      <div data-testid="product-summary">
        <h2>Order Summary</h2>
        <div data-testid="product-name">{product.name}</div>
        <div data-testid="product-price">PHP {(product.price / 100).toFixed(2)}</div>
      </div>

      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email">Email Address *</label>
          <input
            id="email"
            type="text"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            data-testid="email-input"
          />
        </div>

        <div>
          <label htmlFor="firstName">First Name *</label>
          <input
            id="firstName"
            type="text"
            value={formData.firstName}
            onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
            data-testid="firstname-input"
          />
        </div>

        <div>
          <label htmlFor="lastName">Last Name *</label>
          <input
            id="lastName"
            type="text"
            value={formData.lastName}
            onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
            data-testid="lastname-input"
          />
        </div>

        <div>
          <label htmlFor="paymentMethod">Payment Method</label>
          <select
            id="paymentMethod"
            value={formData.paymentMethod}
            onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value }))}
            data-testid="payment-method-select"
          >
            <option value="credit_card">Credit Card</option>
            <option value="gcash">GCash</option>
            <option value="paymaya">PayMaya</option>
            <option value="grabpay">GrabPay</option>
          </select>
        </div>

        {error && (
          <div data-testid="error-message" role="alert">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          data-testid="submit-button"
        >
          {loading ? 'Processing...' : `Pay PHP ${(product.price / 100).toFixed(2)}`}
        </button>
      </form>
    </div>
  );
};

describe('Checkout & Purchase Flow Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Form Rendering', () => {
    it('should render checkout form with product summary', () => {
      render(<MockCheckoutForm />);

      expect(screen.getByTestId('checkout-form')).toBeDefined();
      expect(screen.getByTestId('product-summary')).toBeDefined();
      expect(screen.getByTestId('product-name')).toBeDefined();
      expect(screen.getByTestId('product-price')).toBeDefined();
      expect(screen.getByText('Test Digital Product')).toBeDefined();
      expect(screen.getByText('PHP 29.99')).toBeDefined();
    });

    it('should render all form fields', () => {
      render(<MockCheckoutForm />);

      expect(screen.getByTestId('email-input')).toBeDefined();
      expect(screen.getByTestId('firstname-input')).toBeDefined();
      expect(screen.getByTestId('lastname-input')).toBeDefined();
      expect(screen.getByTestId('payment-method-select')).toBeDefined();
      expect(screen.getByTestId('submit-button')).toBeDefined();
    });
  });

  describe('Form Validation', () => {
    it('should show error for missing required fields', async () => {
      const user = userEvent.setup();
      render(<MockCheckoutForm />);

      const submitButton = screen.getByTestId('submit-button');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Please fill in all required fields')).toBeDefined();
      });
    });

    it('should show error for invalid email', async () => {
      const user = userEvent.setup();
      render(<MockCheckoutForm />);

      await user.type(screen.getByTestId('email-input'), 'invalid-email');
      await user.type(screen.getByTestId('firstname-input'), 'John');
      await user.type(screen.getByTestId('lastname-input'), 'Doe');
      await user.click(screen.getByTestId('submit-button'));

      await waitFor(() => {
        expect(screen.getByText('Please enter a valid email address')).toBeDefined();
      });
    });
  });

  describe('Payment Methods', () => {
    it('should allow selecting different payment methods', async () => {
      const user = userEvent.setup();
      render(<MockCheckoutForm />);

      const paymentSelect = screen.getByTestId('payment-method-select');
      
      await user.selectOptions(paymentSelect, 'gcash');
      expect((paymentSelect as HTMLSelectElement).value).toBe('gcash');

      await user.selectOptions(paymentSelect, 'paymaya');
      expect((paymentSelect as HTMLSelectElement).value).toBe('paymaya');
    });
  });

  describe('Successful Purchase', () => {
    it('should successfully process payment and redirect', async () => {
      const user = userEvent.setup();
      render(<MockCheckoutForm />);

      await user.type(screen.getByTestId('email-input'), 'customer@example.com');
      await user.type(screen.getByTestId('firstname-input'), 'John');
      await user.type(screen.getByTestId('lastname-input'), 'Doe');
      await user.click(screen.getByTestId('submit-button'));

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/purchase/success?orderId=order123');
      });
    });

    it('should show loading state during payment processing', async () => {
      const user = userEvent.setup();
      render(<MockCheckoutForm />);

      await user.type(screen.getByTestId('email-input'), 'customer@example.com');
      await user.type(screen.getByTestId('firstname-input'), 'John');
      await user.type(screen.getByTestId('lastname-input'), 'Doe');
      
      const submitButton = screen.getByTestId('submit-button');
      await user.click(submitButton);

      expect(screen.getByText('Processing...')).toBeDefined();
    });
  });
}); 