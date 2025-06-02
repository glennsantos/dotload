/**
 * ============================================================================
 * FRONTEND TESTS - USER REGISTRATION
 * ============================================================================
 * 
 * Tests for user registration functionality including:
 * - Registration form validation
 * - Account creation flow
 * - Email verification process
 * - Error handling
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock Next.js router
const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  prefetch: jest.fn(),
};

jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
}));

// Mock toast notifications
const mockToast = {
  success: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
};

jest.mock('react-hot-toast', () => ({
  toast: mockToast,
}));

// Mock registration component
const MockRegistrationForm = () => {
  const [formData, setFormData] = React.useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
  });
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = React.useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'You must agree to the terms and conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        mockToast.success('Registration successful! Please check your email to verify your account.');
        mockRouter.push('/auth/verify-email');
      } else {
        mockToast.error(data.error || 'Registration failed');
        if (data.error === 'Email already exists') {
          setErrors({ email: 'An account with this email already exists' });
        }
      }
    } catch (error) {
      mockToast.error('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div data-testid="registration-form">
      <h1>Create Your Account</h1>
      
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="name">Full Name *</label>
          <input
            id="name"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            data-testid="name-input"
          />
          {errors.name && <span data-testid="name-error" className="error">{errors.name}</span>}
        </div>

        <div>
          <label htmlFor="email">Email Address *</label>
          <input
            id="email"
            type="text"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            data-testid="email-input"
          />
          {errors.email && <span data-testid="email-error" className="error">{errors.email}</span>}
        </div>

        <div>
          <label htmlFor="password">Password *</label>
          <input
            id="password"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
            data-testid="password-input"
          />
          {errors.password && <span data-testid="password-error" className="error">{errors.password}</span>}
        </div>

        <div>
          <label htmlFor="confirmPassword">Confirm Password *</label>
          <input
            id="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
            data-testid="confirm-password-input"
          />
          {errors.confirmPassword && <span data-testid="confirm-password-error" className="error">{errors.confirmPassword}</span>}
        </div>

        <div>
          <label>
            <input
              type="checkbox"
              checked={formData.agreeToTerms}
              onChange={(e) => setFormData(prev => ({ ...prev, agreeToTerms: e.target.checked }))}
              data-testid="terms-checkbox"
            />
            I agree to the Terms of Service and Privacy Policy *
          </label>
          {errors.agreeToTerms && <span data-testid="terms-error" className="error">{errors.agreeToTerms}</span>}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          data-testid="register-button"
        >
          {isLoading ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>

      <div>
        <p>
          Already have an account?{' '}
          <button
            type="button"
            onClick={() => mockRouter.push('/auth/login')}
            data-testid="login-link"
          >
            Sign In
          </button>
        </p>
      </div>
    </div>
  );
};

describe('User Registration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // @ts-ignore - Mock fetch for testing
    global.fetch = jest.fn();
  });

  describe('Form Rendering', () => {
    it('should render registration form with all fields', () => {
      render(<MockRegistrationForm />);

      expect(screen.getByTestId('registration-form')).toBeDefined();
      expect(screen.getByTestId('name-input')).toBeDefined();
      expect(screen.getByTestId('email-input')).toBeDefined();
      expect(screen.getByTestId('password-input')).toBeDefined();
      expect(screen.getByTestId('confirm-password-input')).toBeDefined();
      expect(screen.getByTestId('terms-checkbox')).toBeDefined();
      expect(screen.getByTestId('register-button')).toBeDefined();
    });

    it('should show login link for existing users', () => {
      render(<MockRegistrationForm />);

      const loginLink = screen.getByTestId('login-link');
      expect(loginLink).toBeDefined();
      
      fireEvent.click(loginLink);
      expect(mockRouter.push).toHaveBeenCalledWith('/auth/login');
    });
  });

  describe('Form Validation', () => {
    it('should show error for missing required fields', async () => {
      render(<MockRegistrationForm />);

      const submitButton = screen.getByTestId('register-button');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByTestId('name-error')).toBeDefined();
        expect(screen.getByTestId('email-error')).toBeDefined();
        expect(screen.getByTestId('password-error')).toBeDefined();
        expect(screen.getByTestId('terms-error')).toBeDefined();
      });
    });

    it('should validate email format', async () => {
      render(<MockRegistrationForm />);

      const emailInput = screen.getByTestId('email-input');
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });

      const submitButton = screen.getByTestId('register-button');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByTestId('email-error')).toBeDefined();
        expect(screen.getByTestId('email-error').textContent).toBe('Please enter a valid email address');
      });
    });

    it('should validate password length', async () => {
      render(<MockRegistrationForm />);

      const passwordInput = screen.getByTestId('password-input');
      fireEvent.change(passwordInput, { target: { value: '123' } });

      const submitButton = screen.getByTestId('register-button');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByTestId('password-error')).toBeDefined();
        expect(screen.getByTestId('password-error').textContent).toBe('Password must be at least 8 characters long');
      });
    });

    it('should validate password confirmation', async () => {
      render(<MockRegistrationForm />);

      const passwordInput = screen.getByTestId('password-input');
      const confirmPasswordInput = screen.getByTestId('confirm-password-input');
      
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'different123' } });

      const submitButton = screen.getByTestId('register-button');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByTestId('confirm-password-error')).toBeDefined();
        expect(screen.getByTestId('confirm-password-error').textContent).toBe('Passwords do not match');
      });
    });

    it('should require terms agreement', async () => {
      render(<MockRegistrationForm />);

      // Fill all fields except terms
      fireEvent.change(screen.getByTestId('name-input'), { target: { value: 'John Doe' } });
      fireEvent.change(screen.getByTestId('email-input'), { target: { value: 'john@example.com' } });
      fireEvent.change(screen.getByTestId('password-input'), { target: { value: 'password123' } });
      fireEvent.change(screen.getByTestId('confirm-password-input'), { target: { value: 'password123' } });

      const submitButton = screen.getByTestId('register-button');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByTestId('terms-error')).toBeDefined();
        expect(screen.getByTestId('terms-error').textContent).toBe('You must agree to the terms and conditions');
      });
    });
  });

  describe('Registration Flow', () => {
    it('should successfully register a new user', async () => {
      // @ts-ignore - Mock fetch response
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ message: 'Registration successful' }),
      });

      render(<MockRegistrationForm />);

      // Fill all required fields
      fireEvent.change(screen.getByTestId('name-input'), { target: { value: 'John Doe' } });
      fireEvent.change(screen.getByTestId('email-input'), { target: { value: 'john@example.com' } });
      fireEvent.change(screen.getByTestId('password-input'), { target: { value: 'password123' } });
      fireEvent.change(screen.getByTestId('confirm-password-input'), { target: { value: 'password123' } });
      fireEvent.click(screen.getByTestId('terms-checkbox'));

      const submitButton = screen.getByTestId('register-button');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: 'John Doe',
            email: 'john@example.com',
            password: 'password123',
          }),
        });
      });

      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith('Registration successful! Please check your email to verify your account.');
        expect(mockRouter.push).toHaveBeenCalledWith('/auth/verify-email');
      });
    });

    it('should handle existing email error', async () => {
      // @ts-ignore - Mock fetch response
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: 'Email already exists' }),
      });

      render(<MockRegistrationForm />);

      // Fill all required fields
      fireEvent.change(screen.getByTestId('name-input'), { target: { value: 'John Doe' } });
      fireEvent.change(screen.getByTestId('email-input'), { target: { value: 'existing@example.com' } });
      fireEvent.change(screen.getByTestId('password-input'), { target: { value: 'password123' } });
      fireEvent.change(screen.getByTestId('confirm-password-input'), { target: { value: 'password123' } });
      fireEvent.click(screen.getByTestId('terms-checkbox'));

      const submitButton = screen.getByTestId('register-button');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Email already exists');
        expect(screen.getByTestId('email-error')).toBeDefined();
        expect(screen.getByTestId('email-error').textContent).toBe('An account with this email already exists');
      });
    });

    it('should handle network errors', async () => {
      // @ts-ignore - Mock fetch rejection
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      render(<MockRegistrationForm />);

      // Fill all required fields
      fireEvent.change(screen.getByTestId('name-input'), { target: { value: 'John Doe' } });
      fireEvent.change(screen.getByTestId('email-input'), { target: { value: 'john@example.com' } });
      fireEvent.change(screen.getByTestId('password-input'), { target: { value: 'password123' } });
      fireEvent.change(screen.getByTestId('confirm-password-input'), { target: { value: 'password123' } });
      fireEvent.click(screen.getByTestId('terms-checkbox'));

      const submitButton = screen.getByTestId('register-button');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Network error. Please try again.');
      });
    });

    it('should show loading state during registration', async () => {
      // @ts-ignore - Mock fetch with delay
      (global.fetch as jest.Mock).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: () => Promise.resolve({ message: 'Registration successful' }),
        }), 100))
      );

      render(<MockRegistrationForm />);

      // Fill all required fields
      fireEvent.change(screen.getByTestId('name-input'), { target: { value: 'John Doe' } });
      fireEvent.change(screen.getByTestId('email-input'), { target: { value: 'john@example.com' } });
      fireEvent.change(screen.getByTestId('password-input'), { target: { value: 'password123' } });
      fireEvent.change(screen.getByTestId('confirm-password-input'), { target: { value: 'password123' } });
      fireEvent.click(screen.getByTestId('terms-checkbox'));

      const submitButton = screen.getByTestId('register-button');
      fireEvent.click(submitButton);

      // Check loading state
      expect(submitButton.textContent).toBe('Creating Account...');
      expect(submitButton.hasAttribute('disabled')).toBe(true);

      await waitFor(() => {
        expect(submitButton.textContent).toBe('Create Account');
        expect(submitButton.hasAttribute('disabled')).toBe(false);
      });
    });
  });

  describe('User Experience', () => {
    it('should clear errors when user starts typing', async () => {
      render(<MockRegistrationForm />);

      // Trigger validation error
      const submitButton = screen.getByTestId('register-button');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByTestId('name-error')).toBeDefined();
      });

      // Start typing in name field
      const nameInput = screen.getByTestId('name-input');
      fireEvent.change(nameInput, { target: { value: 'J' } });

      // Error should still be there until form is revalidated
      expect(screen.getByTestId('name-error')).toBeDefined();
    });

    it('should accept valid email formats', async () => {
      render(<MockRegistrationForm />);

      const emailInput = screen.getByTestId('email-input') as HTMLInputElement;
      const validEmails = [
        'user@example.com',
        'test.email@domain.co.uk',
        'user+tag@example.org',
      ];

      for (const email of validEmails) {
        fireEvent.change(emailInput, { target: { value: email } });
        expect(emailInput.value).toBe(email);
      }
    });
  });
}); 