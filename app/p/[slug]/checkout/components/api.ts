import { Product } from "./types";

/**
 * Fetches user data from the API
 * @returns User data object or null if not logged in
 */
export async function fetchUserData() {
  try {
    const response = await fetch('/api/auth/me', { credentials: 'include' });
    
    if (response.ok) {
      const userData = await response.json();
      return userData;
    } else {
      console.log('User not logged in or session not available');
      return null;
    }
  } catch (error) {
    console.error('Error fetching user data:', error);
    return null;
  }
}

/**
 * Fetches product data by slug
 * @param slug Product slug
 * @returns Product data or throws an error
 */
export async function fetchProduct(slug: string): Promise<Product> {
  const response = await fetch(`/api/public/products/${slug}`);
  
  if (!response.ok) {
    throw new Error(`Error: ${response.status}`);
  }
  
  return await response.json();
}

/**
 * Creates a purchase in the database
 * @param purchaseData Purchase data to create
 * @returns Created purchase data
 */
export async function createPurchase(purchaseData: any) {
  const response = await fetch("/api/purchases", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(purchaseData),
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || "Failed to create purchase");
  }
  
  return data;
}

/**
 * Processes a payment with Xendit
 * @param paymentData Payment data to process
 * @returns Payment processing result
 */
export async function processPayment(paymentData: any) {
  // Determine the appropriate endpoint based on payment method
  let endpoint = "/api/payments/xendit";
  
  // If it's a direct debit payment, use the direct-debit endpoint
  if (paymentData.paymentMethod && paymentData.paymentMethod.startsWith('direct_debit')) {
    endpoint = "/api/payments/xendit/direct-debit";
  }
  
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(paymentData),
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || data.details || "Failed to process payment");
  }
  
  return data;
}
