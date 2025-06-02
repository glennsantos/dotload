/**
 * ============================================================================
 * FRONTEND TESTS - LOGIN COMPONENT
 * ============================================================================
 * 
 * Tests for the login/sign-in component including:
 * - Successful login flow
 * - Form validation
 * - Error handling
 * - User interactions
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import Login from '@/components/auth/Login';

// Mock Next.js router
const mockPush = jest.fn();
const mockRouter = {
  push: mockPush,
  pathname: '/login',
  query: {},
  asPath: '/login',
};

jest.mock('next/router', () => ({
  useRouter: () => mockRouter,
}));

// Mock fetch for API calls
const mockFetch = jest.fn();
global.fetch = mockFetch as any;

// Mock toast notifications
const mockToast = {
  success: jest.fn(),
  error: jest.fn(),
};

jest.mock('react-hot-toast', () => ({
  toast: mockToast,
}));

describe('Login Component', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
    mockPush.mockClear();
    mockToast.success.mockClear();
    mockToast.error.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Successful Sign In Flow', () => {
    it('should render login form with all required fields', () => {
      render(<Login />);

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
      expect(screen.getByText(/don't have an account/i)).toBeInTheDocument();
    });

    it('should successfully submit login form with valid credentials', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          message: 'Login successful',
          user: {
            id: 'user123',
            email: 'test@example.com',
            name: 'Test User',
          },
          token: 'jwt-token-123',
        }),
      };

      mockFetch.mockResolvedValue(mockResponse);

      render(<Login />);

      // Fill in the form
      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');

      // Submit the form
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'password123',
          }),
        });
      });

      // Verify success toast and redirect
      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith('Login successful');
        expect(mockPush).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('should redirect to seller dashboard for seller users', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          message: 'Login successful',
          user: {
            id: 'seller123',
            email: 'seller@example.com',
            name: 'Test Seller',
            role: 'seller',
          },
          token: 'jwt-token-123',
        }),
      };

      mockFetch.mockResolvedValue(mockResponse);

      render(<Login />);

      await user.type(screen.getByLabelText(/email/i), 'seller@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard/seller');
      });
    });

    it('should handle remember me functionality', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          message: 'Login successful',
          user: { id: 'user123', email: 'test@example.com' },
        }),
      };

      mockFetch.mockResolvedValue(mockResponse);

      render(<Login />);

      // Check remember me checkbox
      const rememberMeCheckbox = screen.getByLabelText(/remember me/i);
      await user.click(rememberMeCheckbox);

      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'password123',
            rememberMe: true,
          }),
        });
      });
    });
  });

  describe('Form Validation', () => {
    it('should show validation errors for empty fields', async () => {
      render(<Login />);

      // Try to submit without filling fields
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByText(/email is required/i)).toBeInTheDocument();
        expect(screen.getByText(/password is required/i)).toBeInTheDocument();
      });

      // Should not make API call
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should validate email format', async () => {
      render(<Login />);

      await user.type(screen.getByLabelText(/email/i), 'invalid-email');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email/i)).toBeInTheDocument();
      });

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should validate minimum password length', async () => {
      render(<Login />);

      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), '123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByText(/password must be at least 6 characters/i)).toBeInTheDocument();
      });

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should clear validation errors when user starts typing', async () => {
      render(<Login />);

      // Trigger validation errors
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      });

      // Start typing in email field
      await user.type(screen.getByLabelText(/email/i), 't');

      await waitFor(() => {
        expect(screen.queryByText(/email is required/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid credentials error', async () => {
      const mockResponse = {
        ok: false,
        status: 401,
        json: () => Promise.resolve({
          error: 'Invalid email or password',
        }),
      };

      mockFetch.mockResolvedValue(mockResponse);

      render(<Login />);

      await user.type(screen.getByLabelText(/email/i), 'wrong@example.com');
      await user.type(screen.getByLabelText(/password/i), 'wrongpassword');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Invalid email or password');
      });

      // Should not redirect on error
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('should handle unverified email error', async () => {
      const mockResponse = {
        ok: false,
        status: 403,
        json: () => Promise.resolve({
          error: 'Email not verified',
          requiresVerification: true,
          email: 'unverified@example.com',
        }),
      };

      mockFetch.mockResolvedValue(mockResponse);

      render(<Login />);

      await user.type(screen.getByLabelText(/email/i), 'unverified@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByText(/email not verified/i)).toBeInTheDocument();
        expect(screen.getByText(/resend verification/i)).toBeInTheDocument();
      });
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      render(<Login />);

      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Network error. Please try again.');
      });
    });

    it('should handle server errors', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        json: () => Promise.resolve({
          error: 'Internal server error',
        }),
      };

      mockFetch.mockResolvedValue(mockResponse);

      render(<Login />);

      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Server error. Please try again later.');
      });
    });
  });

  describe('User Interactions', () => {
    it('should show loading state during form submission', async () => {
      // Mock a delayed response
      mockFetch.mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({
            ok: true,
            json: () => Promise.resolve({ message: 'Success' }),
          }), 100)
        )
      );

      render(<Login />);

      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      // Check loading state
      expect(screen.getByRole('button', { name: /signing in/i })).toBeInTheDocument();
      expect(submitButton).toBeDisabled();

      // Wait for completion
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
      });
    });

    it('should toggle password visibility', async () => {
      render(<Login />);

      const passwordInput = screen.getByLabelText(/password/i);
      const toggleButton = screen.getByRole('button', { name: /toggle password visibility/i });

      // Initially password should be hidden
      expect(passwordInput).toHaveAttribute('type', 'password');

      // Click to show password
      await user.click(toggleButton);
      expect(passwordInput).toHaveAttribute('type', 'text');

      // Click to hide password again
      await user.click(toggleButton);
      expect(passwordInput).toHaveAttribute('type', 'password');
    });

    it('should navigate to registration page', async () => {
      render(<Login />);

      const signUpLink = screen.getByText(/sign up/i);
      await user.click(signUpLink);

      expect(mockPush).toHaveBeenCalledWith('/register');
    });

    it('should navigate to forgot password page', async () => {
      render(<Login />);

      const forgotPasswordLink = screen.getByText(/forgot password/i);
      await user.click(forgotPasswordLink);

      expect(mockPush).toHaveBeenCalledWith('/forgot-password');
    });

    it('should handle keyboard navigation', async () => {
      render(<Login />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      // Tab through form elements
      emailInput.focus();
      expect(emailInput).toHaveFocus();

      await user.tab();
      expect(passwordInput).toHaveFocus();

      await user.tab();
      expect(submitButton).toHaveFocus();

      // Submit with Enter key
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ message: 'Success' }),
      });

      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', () => {
      render(<Login />);

      expect(screen.getByRole('form')).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toHaveAttribute('aria-required', 'true');
      expect(screen.getByLabelText(/password/i)).toHaveAttribute('aria-required', 'true');
    });

    it('should announce errors to screen readers', async () => {
      render(<Login />);

      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        const errorMessage = screen.getByText(/email is required/i);
        expect(errorMessage).toHaveAttribute('role', 'alert');
        expect(errorMessage).toHaveAttribute('aria-live', 'polite');
      });
    });

    it('should have proper focus management', async () => {
      render(<Login />);

      // Focus should be on first input when component mounts
      expect(screen.getByLabelText(/email/i)).toHaveFocus();
    });
  });
}); 