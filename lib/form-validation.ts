// Form validation utility functions

/**
 * Validates price input specifically for integer values between 1-500000
 * @param price The price value to validate
 * @returns An object with validation results
 */
export const validatePrice = (price: any) => {
  if (price === undefined || price === null || price === '') {
    return { isValid: false, error: 'Price is required' };
  }

  const numValue = Number(price);
  
  if (isNaN(numValue)) {
    return { isValid: false, error: 'Price must be a valid number' };
  }

  // Check if it's an integer
  if (!Number.isInteger(numValue)) {
    return { isValid: false, error: 'Price must be a whole number (no decimals)' };
  }

  // Check range
  if (numValue < 1) {
    return { isValid: false, error: 'Price must be at least ₱1' };
  }

  if (numValue > 500000) {
    return { isValid: false, error: 'Price cannot exceed ₱500,000' };
  }

  return { isValid: true, error: null };
};

/**
 * Validates discount amount based on discount type
 * @param amount The discount amount to validate
 * @param type The discount type ('percentage' or 'fixed')
 * @returns An object with validation results
 */
export const validateDiscountAmount = (amount: any, type: 'percentage' | 'fixed') => {
  if (amount === undefined || amount === null || amount === '') {
    return { isValid: false, error: 'Discount amount is required' };
  }

  const numValue = Number(amount);
  
  if (isNaN(numValue)) {
    return { isValid: false, error: 'Discount amount must be a valid number' };
  }

  // Check if it's an integer
  if (!Number.isInteger(numValue)) {
    return { isValid: false, error: 'Discount amount must be a whole number (no decimals)' };
  }

  if (type === 'percentage') {
    // For percentage discounts, validate range 1-100
    if (numValue < 1) {
      return { isValid: false, error: 'Percentage discount must be at least 1%' };
    }
    if (numValue > 100) {
      return { isValid: false, error: 'Percentage discount cannot exceed 100%' };
    }
  } else if (type === 'fixed') {
    // For fixed discounts, use same validation as product prices
    if (numValue < 1) {
      return { isValid: false, error: 'Fixed discount must be at least ₱1' };
    }
    if (numValue > 500000) {
      return { isValid: false, error: 'Fixed discount cannot exceed ₱500,000' };
    }
  }

  return { isValid: true, error: null };
};

/**
 * Validates product form data
 * @param formData The product form data to validate
 * @returns An object with validation results
 */
export const validateProductForm = (formData: any) => {
  const errors: Record<string, string> = {};
  
  // Validate required fields
  if (!formData.name?.trim()) {
    errors.name = 'Product name is required';
  } else if (formData.name.length > 100) {
    errors.name = 'Product name must be less than 100 characters';
  }
  

  
  // Validate price using the new price validation function
  const priceValidation = validatePrice(formData.price);
  if (!priceValidation.isValid) {
    errors.price = priceValidation.error!;
  }
  
  // Validate description
  if (formData.description?.length > 5000) {
    errors.description = 'Description must be less than 5000 characters';
  }
  
  // Validate slug if provided
  if (formData.slug) {
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!slugRegex.test(formData.slug)) {
      errors.slug = 'Slug must contain only lowercase letters, numbers, and hyphens';
    }
  }
  
  // Validate download settings
  if (formData.downloadSettings?.downloadLimit !== undefined) {
    const downloadLimit = parseInt(formData.downloadSettings.downloadLimit);
    if (isNaN(downloadLimit) || downloadLimit < 1) {
      errors['downloadSettings.downloadLimit'] = 'Download limit must be a positive number';
    }
  }
  
  if (formData.downloadSettings?.linkExpiration !== undefined) {
    const linkExpiration = parseInt(formData.downloadSettings.linkExpiration);
    if (isNaN(linkExpiration) || linkExpiration < 1) {
      errors['downloadSettings.linkExpiration'] = 'Link expiration must be a positive number';
    }
  }
  
  // Validate content files or links
  if (
    (!formData.contentFiles || formData.contentFiles.length === 0) && 
    (!formData.contentLinks || formData.contentLinks.length === 0) &&
    (!formData.existingFiles || formData.existingFiles.length === 0)
  ) {
    errors.contentFiles = 'Digital products require at least one content file or link';
  }
  
  // Validate custom badges
  if (formData.badges?.custom && Array.isArray(formData.badges.custom)) {
    for (let i = 0; i < formData.badges.custom.length; i++) {
      if (!formData.badges.custom[i]?.trim()) {
        errors[`badges.custom[${i}]`] = 'Custom badge cannot be empty';
      } else if (formData.badges.custom[i].length > 50) {
        errors[`badges.custom[${i}]`] = 'Custom badge must be less than 50 characters';
      }
    }
  }
  
  // Validate custom trust indicators
  if (formData.trustIndicators?.custom && Array.isArray(formData.trustIndicators.custom)) {
    for (let i = 0; i < formData.trustIndicators.custom.length; i++) {
      if (!formData.trustIndicators.custom[i]?.trim()) {
        errors[`trustIndicators.custom[${i}]`] = 'Custom trust indicator cannot be empty';
      } else if (formData.trustIndicators.custom[i].length > 50) {
        errors[`trustIndicators.custom[${i}]`] = 'Custom trust indicator must be less than 50 characters';
      }
    }
  }
  
  // Validate what's included items
  if (formData.whatsIncluded && Array.isArray(formData.whatsIncluded)) {
    for (let i = 0; i < formData.whatsIncluded.length; i++) {
      if (!formData.whatsIncluded[i]?.trim()) {
        errors[`whatsIncluded[${i}]`] = 'What\'s included item cannot be empty';
      } else if (formData.whatsIncluded[i].length > 100) {
        errors[`whatsIncluded[${i}]`] = 'What\'s included item must be less than 100 characters';
      }
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Validates a URL string
 * @param url The URL to validate
 * @returns True if the URL is valid, false otherwise
 */
export const isValidUrl = (url: string) => {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
};

/**
 * Validates file size
 * @param file The file to validate
 * @param maxSizeMB Maximum file size in MB
 * @returns True if the file size is valid, false otherwise
 */
export const isValidFileSize = (file: File, maxSizeMB: number) => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
};

/**
 * Validates file type
 * @param file The file to validate
 * @param allowedTypes Array of allowed MIME types
 * @returns True if the file type is valid, false otherwise
 */
export const isValidFileType = (file: File, allowedTypes: string[]) => {
  return allowedTypes.includes(file.type);
};

/**
 * Formats validation errors for display
 * @param errors The validation errors object
 * @returns An object with field names as keys and error messages as values
 */
export const formatValidationErrors = (errors: Record<string, string>) => {
  const formattedErrors: Record<string, Record<string, string>> = {};
  
  for (const [key, value] of Object.entries(errors)) {
    // Handle nested fields (e.g., downloadSettings.downloadLimit)
    if (key.includes('.')) {
      const [parent, child] = key.split('.');
      if (!formattedErrors[parent]) {
        formattedErrors[parent] = {};
      }
      formattedErrors[parent][child] = value;
    } else {
      // For non-nested fields, create a special 'root' category
      if (!formattedErrors['root']) {
        formattedErrors['root'] = {};
      }
      formattedErrors['root'][key] = value;
    }
  }
  
  return formattedErrors;
};
