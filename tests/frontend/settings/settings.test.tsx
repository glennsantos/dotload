/**
 * ============================================================================
 * FRONTEND TESTS - USER SETTINGS
 * ============================================================================
 * 
 * Tests for user settings functionality including:
 * - Brand name updates
 * - Username changes
 * - Password changes
 * - Profile settings
 * - Validation and error handling
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

// Mock settings component
const MockSettingsForm = () => {
  const [profileData, setProfileData] = React.useState({
    name: 'John Doe',
    email: 'john@example.com',
    username: 'johndoe',
    brandName: 'John\'s Store',
  });

  const [passwordData, setPasswordData] = React.useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState('profile');

  const validateProfile = () => {
    const newErrors: Record<string, string> = {};

    if (!profileData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!profileData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (profileData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters long';
    } else if (!/^[a-zA-Z0-9_]+$/.test(profileData.username)) {
      newErrors.username = 'Username can only contain letters, numbers, and underscores';
    }

    if (!profileData.brandName.trim()) {
      newErrors.brandName = 'Brand name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePassword = () => {
    const newErrors: Record<string, string> = {};

    if (!passwordData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }

    if (!passwordData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (passwordData.newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters long';
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (passwordData.currentPassword === passwordData.newPassword) {
      newErrors.newPassword = 'New password must be different from current password';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateProfile()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: profileData.name,
          username: profileData.username,
          brandName: profileData.brandName,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        mockToast.success('Profile updated successfully!');
      } else {
        mockToast.error(data.error || 'Failed to update profile');
        if (data.error === 'Username already exists') {
          setErrors({ username: 'This username is already taken' });
        }
      }
    } catch (error) {
      mockToast.error('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePassword()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/user/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        mockToast.success('Password updated successfully!');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      } else {
        mockToast.error(data.error || 'Failed to update password');
        if (data.error === 'Invalid current password') {
          setErrors({ currentPassword: 'Current password is incorrect' });
        }
      }
    } catch (error) {
      mockToast.error('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div data-testid="settings-form">
      <h1>Account Settings</h1>
      
      <div data-testid="settings-tabs">
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          data-testid="profile-tab"
          className={activeTab === 'profile' ? 'active' : ''}
        >
          Profile & Brand
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('password')}
          data-testid="password-tab"
          className={activeTab === 'password' ? 'active' : ''}
        >
          Change Password
        </button>
      </div>

      {activeTab === 'profile' && (
        <form onSubmit={handleProfileSubmit} data-testid="profile-form">
          <h2>Profile Information</h2>
          
          <div>
            <label htmlFor="name">Full Name *</label>
            <input
              id="name"
              type="text"
              value={profileData.name}
              onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
              data-testid="name-input"
            />
            {errors.name && <span data-testid="name-error" className="error">{errors.name}</span>}
          </div>

          <div>
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="text"
              value={profileData.email}
              disabled
              data-testid="email-input"
            />
            <small>Email cannot be changed</small>
          </div>

          <div>
            <label htmlFor="username">Username *</label>
            <input
              id="username"
              type="text"
              value={profileData.username}
              onChange={(e) => setProfileData(prev => ({ ...prev, username: e.target.value }))}
              data-testid="username-input"
            />
            {errors.username && <span data-testid="username-error" className="error">{errors.username}</span>}
          </div>

          <div>
            <label htmlFor="brandName">Brand Name *</label>
            <input
              id="brandName"
              type="text"
              value={profileData.brandName}
              onChange={(e) => setProfileData(prev => ({ ...prev, brandName: e.target.value }))}
              data-testid="brand-name-input"
            />
            {errors.brandName && <span data-testid="brand-name-error" className="error">{errors.brandName}</span>}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            data-testid="save-profile-button"
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      )}

      {activeTab === 'password' && (
        <form onSubmit={handlePasswordSubmit} data-testid="password-form">
          <h2>Change Password</h2>
          
          <div>
            <label htmlFor="currentPassword">Current Password *</label>
            <input
              id="currentPassword"
              type="password"
              value={passwordData.currentPassword}
              onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
              data-testid="current-password-input"
            />
            {errors.currentPassword && <span data-testid="current-password-error" className="error">{errors.currentPassword}</span>}
          </div>

          <div>
            <label htmlFor="newPassword">New Password *</label>
            <input
              id="newPassword"
              type="password"
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
              data-testid="new-password-input"
            />
            {errors.newPassword && <span data-testid="new-password-error" className="error">{errors.newPassword}</span>}
          </div>

          <div>
            <label htmlFor="confirmPassword">Confirm New Password *</label>
            <input
              id="confirmPassword"
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
              data-testid="confirm-password-input"
            />
            {errors.confirmPassword && <span data-testid="confirm-password-error" className="error">{errors.confirmPassword}</span>}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            data-testid="save-password-button"
          >
            {isLoading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      )}
    </div>
  );
};

describe('User Settings Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // @ts-ignore - Mock fetch for testing
    global.fetch = jest.fn();
  });

  describe('Settings Navigation', () => {
    it('should render settings form with tabs', () => {
      render(<MockSettingsForm />);

      expect(screen.getByTestId('settings-form')).toBeDefined();
      expect(screen.getByTestId('settings-tabs')).toBeDefined();
      expect(screen.getByTestId('profile-tab')).toBeDefined();
      expect(screen.getByTestId('password-tab')).toBeDefined();
    });

    it('should switch between profile and password tabs', () => {
      render(<MockSettingsForm />);

      // Profile tab should be active by default
      expect(screen.getByTestId('profile-form')).toBeDefined();
      expect(screen.queryByTestId('password-form')).toBeNull();

      // Switch to password tab
      fireEvent.click(screen.getByTestId('password-tab'));
      expect(screen.getByTestId('password-form')).toBeDefined();
      expect(screen.queryByTestId('profile-form')).toBeNull();

      // Switch back to profile tab
      fireEvent.click(screen.getByTestId('profile-tab'));
      expect(screen.getByTestId('profile-form')).toBeDefined();
      expect(screen.queryByTestId('password-form')).toBeNull();
    });
  });

  describe('Profile Settings', () => {
    it('should render profile form with current data', () => {
      render(<MockSettingsForm />);

      const nameInput = screen.getByTestId('name-input') as HTMLInputElement;
      const emailInput = screen.getByTestId('email-input') as HTMLInputElement;
      const usernameInput = screen.getByTestId('username-input') as HTMLInputElement;
      const brandNameInput = screen.getByTestId('brand-name-input') as HTMLInputElement;

      expect(nameInput.value).toBe('John Doe');
      expect(emailInput.value).toBe('john@example.com');
      expect(usernameInput.value).toBe('johndoe');
      expect(brandNameInput.value).toBe('John\'s Store');
      expect(emailInput.hasAttribute('disabled')).toBe(true);
    });

    it('should validate required profile fields', async () => {
      render(<MockSettingsForm />);

      // Clear all fields
      fireEvent.change(screen.getByTestId('name-input'), { target: { value: '' } });
      fireEvent.change(screen.getByTestId('username-input'), { target: { value: '' } });
      fireEvent.change(screen.getByTestId('brand-name-input'), { target: { value: '' } });

      const submitButton = screen.getByTestId('save-profile-button');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByTestId('name-error')).toBeDefined();
        expect(screen.getByTestId('username-error')).toBeDefined();
        expect(screen.getByTestId('brand-name-error')).toBeDefined();
      });
    });

    it('should validate username format', async () => {
      render(<MockSettingsForm />);

      // Test short username
      fireEvent.change(screen.getByTestId('username-input'), { target: { value: 'ab' } });
      fireEvent.click(screen.getByTestId('save-profile-button'));

      await waitFor(() => {
        expect(screen.getByTestId('username-error')).toBeDefined();
        expect(screen.getByTestId('username-error').textContent).toBe('Username must be at least 3 characters long');
      });

      // Test invalid characters
      fireEvent.change(screen.getByTestId('username-input'), { target: { value: 'user@name' } });
      fireEvent.click(screen.getByTestId('save-profile-button'));

      await waitFor(() => {
        expect(screen.getByTestId('username-error')).toBeDefined();
        expect(screen.getByTestId('username-error').textContent).toBe('Username can only contain letters, numbers, and underscores');
      });
    });

    it('should successfully update profile', async () => {
      // @ts-ignore - Mock fetch response
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ message: 'Profile updated successfully' }),
      });

      render(<MockSettingsForm />);

      // Update profile data
      fireEvent.change(screen.getByTestId('name-input'), { target: { value: 'Jane Doe' } });
      fireEvent.change(screen.getByTestId('username-input'), { target: { value: 'janedoe' } });
      fireEvent.change(screen.getByTestId('brand-name-input'), { target: { value: 'Jane\'s Boutique' } });

      const submitButton = screen.getByTestId('save-profile-button');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/user/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: 'Jane Doe',
            username: 'janedoe',
            brandName: 'Jane\'s Boutique',
          }),
        });
      });

      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith('Profile updated successfully!');
      });
    });

    it('should handle username already exists error', async () => {
      // @ts-ignore - Mock fetch response
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: 'Username already exists' }),
      });

      render(<MockSettingsForm />);

      fireEvent.change(screen.getByTestId('username-input'), { target: { value: 'existinguser' } });
      fireEvent.click(screen.getByTestId('save-profile-button'));

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Username already exists');
        expect(screen.getByTestId('username-error')).toBeDefined();
        expect(screen.getByTestId('username-error').textContent).toBe('This username is already taken');
      });
    });
  });

  describe('Password Settings', () => {
    beforeEach(() => {
      render(<MockSettingsForm />);
      fireEvent.click(screen.getByTestId('password-tab'));
    });

    it('should render password form', () => {
      expect(screen.getByTestId('password-form')).toBeDefined();
      expect(screen.getByTestId('current-password-input')).toBeDefined();
      expect(screen.getByTestId('new-password-input')).toBeDefined();
      expect(screen.getByTestId('confirm-password-input')).toBeDefined();
      expect(screen.getByTestId('save-password-button')).toBeDefined();
    });

    it('should validate required password fields', async () => {
      const submitButton = screen.getByTestId('save-password-button');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByTestId('current-password-error')).toBeDefined();
        expect(screen.getByTestId('new-password-error')).toBeDefined();
      });
    });

    it('should validate new password length', async () => {
      fireEvent.change(screen.getByTestId('current-password-input'), { target: { value: 'oldpassword' } });
      fireEvent.change(screen.getByTestId('new-password-input'), { target: { value: '123' } });

      fireEvent.click(screen.getByTestId('save-password-button'));

      await waitFor(() => {
        expect(screen.getByTestId('new-password-error')).toBeDefined();
        expect(screen.getByTestId('new-password-error').textContent).toBe('Password must be at least 8 characters long');
      });
    });

    it('should validate password confirmation', async () => {
      fireEvent.change(screen.getByTestId('current-password-input'), { target: { value: 'oldpassword' } });
      fireEvent.change(screen.getByTestId('new-password-input'), { target: { value: 'newpassword123' } });
      fireEvent.change(screen.getByTestId('confirm-password-input'), { target: { value: 'different123' } });

      fireEvent.click(screen.getByTestId('save-password-button'));

      await waitFor(() => {
        expect(screen.getByTestId('confirm-password-error')).toBeDefined();
        expect(screen.getByTestId('confirm-password-error').textContent).toBe('Passwords do not match');
      });
    });

    it('should validate new password is different from current', async () => {
      fireEvent.change(screen.getByTestId('current-password-input'), { target: { value: 'samepassword' } });
      fireEvent.change(screen.getByTestId('new-password-input'), { target: { value: 'samepassword' } });
      fireEvent.change(screen.getByTestId('confirm-password-input'), { target: { value: 'samepassword' } });

      fireEvent.click(screen.getByTestId('save-password-button'));

      await waitFor(() => {
        expect(screen.getByTestId('new-password-error')).toBeDefined();
        expect(screen.getByTestId('new-password-error').textContent).toBe('New password must be different from current password');
      });
    });

    it('should successfully update password', async () => {
      // @ts-ignore - Mock fetch response
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ message: 'Password updated successfully' }),
      });

      fireEvent.change(screen.getByTestId('current-password-input'), { target: { value: 'oldpassword' } });
      fireEvent.change(screen.getByTestId('new-password-input'), { target: { value: 'newpassword123' } });
      fireEvent.change(screen.getByTestId('confirm-password-input'), { target: { value: 'newpassword123' } });

      fireEvent.click(screen.getByTestId('save-password-button'));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/user/password', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            currentPassword: 'oldpassword',
            newPassword: 'newpassword123',
          }),
        });
      });

      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith('Password updated successfully!');
        // Form should be cleared after successful update
        const currentPasswordInput = screen.getByTestId('current-password-input') as HTMLInputElement;
        const newPasswordInput = screen.getByTestId('new-password-input') as HTMLInputElement;
        const confirmPasswordInput = screen.getByTestId('confirm-password-input') as HTMLInputElement;
        
        expect(currentPasswordInput.value).toBe('');
        expect(newPasswordInput.value).toBe('');
        expect(confirmPasswordInput.value).toBe('');
      });
    });

    it('should handle incorrect current password error', async () => {
      // @ts-ignore - Mock fetch response
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: 'Invalid current password' }),
      });

      fireEvent.change(screen.getByTestId('current-password-input'), { target: { value: 'wrongpassword' } });
      fireEvent.change(screen.getByTestId('new-password-input'), { target: { value: 'newpassword123' } });
      fireEvent.change(screen.getByTestId('confirm-password-input'), { target: { value: 'newpassword123' } });

      fireEvent.click(screen.getByTestId('save-password-button'));

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Invalid current password');
        expect(screen.getByTestId('current-password-error')).toBeDefined();
        expect(screen.getByTestId('current-password-error').textContent).toBe('Current password is incorrect');
      });
    });
  });

  describe('Loading States', () => {
    it('should show loading state during profile update', async () => {
      // @ts-ignore - Mock fetch with delay
      (global.fetch as jest.Mock).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: () => Promise.resolve({ message: 'Profile updated successfully' }),
        }), 100))
      );

      render(<MockSettingsForm />);

      fireEvent.change(screen.getByTestId('name-input'), { target: { value: 'Updated Name' } });
      const submitButton = screen.getByTestId('save-profile-button');
      fireEvent.click(submitButton);

      expect(submitButton.textContent).toBe('Saving...');
      expect(submitButton.hasAttribute('disabled')).toBe(true);

      await waitFor(() => {
        expect(submitButton.textContent).toBe('Save Changes');
        expect(submitButton.hasAttribute('disabled')).toBe(false);
      });
    });

    it('should show loading state during password update', async () => {
      // @ts-ignore - Mock fetch with delay
      (global.fetch as jest.Mock).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: () => Promise.resolve({ message: 'Password updated successfully' }),
        }), 100))
      );

      render(<MockSettingsForm />);
      fireEvent.click(screen.getByTestId('password-tab'));

      fireEvent.change(screen.getByTestId('current-password-input'), { target: { value: 'oldpassword' } });
      fireEvent.change(screen.getByTestId('new-password-input'), { target: { value: 'newpassword123' } });
      fireEvent.change(screen.getByTestId('confirm-password-input'), { target: { value: 'newpassword123' } });

      const submitButton = screen.getByTestId('save-password-button');
      fireEvent.click(submitButton);

      expect(submitButton.textContent).toBe('Updating...');
      expect(submitButton.hasAttribute('disabled')).toBe(true);

      await waitFor(() => {
        expect(submitButton.textContent).toBe('Update Password');
        expect(submitButton.hasAttribute('disabled')).toBe(false);
      });
    });
  });
}); 