// Supabase Database Service - The Proper Way to Connect to Supabase
// This replaces direct PostgreSQL/Prisma connections with Supabase's JavaScript client

import { getSupabaseAdminClient, getSupabaseClient } from './supabase';

// User operations using Supabase
export class SupabaseUserService {
  private async getAdminClient() {
    const client = await getSupabaseAdminClient();
    if (!client) {
      throw new Error('Supabase admin client not available');
    }
    return client;
  }

  // Create a new user
  async createUser(userData: {
    email: string;
    password: string;
    name?: string;
    storeName?: string;
    storeDescription?: string;
    storeLogoPath?: string;
    storeHeaderPath?: string;
  }) {
    const supabase = await this.getAdminClient();
    
    // Generate verification token
    const cryptoModule = await import('crypto');
    const verificationToken = cryptoModule.randomBytes(32).toString('hex');
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    
    // Generate a UUID for the user
    const userId = cryptoModule.randomUUID();
    
    const { data, error } = await supabase
      .from('User')
      .insert({
        id: userId,
        email: userData.email,
        password: userData.password, // Note: In production, hash this first
        name: userData.name,
        storeName: userData.storeName,
        storeDescription: userData.storeDescription,
        storeLogoPath: userData.storeLogoPath,
        storeHeaderPath: userData.storeHeaderPath,
        emailVerified: false,
        verificationToken,
        verificationTokenExpiry: verificationTokenExpiry.toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create user: ${error.message}`);
    }

    return data;
  }

  // Find user by email
  async findUserByEmail(email: string) {
    const supabase = await this.getAdminClient();
    
    const { data, error } = await supabase
      .from('User')
      .select('*')
      .eq('email', email)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      throw new Error(`Failed to find user: ${error.message}`);
    }

    return data;
  }

  // Find user by ID
  async findUserById(id: string) {
    const supabase = await this.getAdminClient();
    
    const { data, error } = await supabase
      .from('User')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to find user: ${error.message}`);
    }

    return data;
  }

  // Find user by verification token
  async findUserByVerificationToken(token: string) {
    const supabase = await this.getAdminClient();
    
    const { data, error } = await supabase
      .from('User')
      .select('id, email, emailVerified, verificationToken, verificationTokenExpiry')
      .eq('verificationToken', token)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to find user: ${error.message}`);
    }

    return data;
  }

  // Find user by reset token
  async findUserByResetToken(token: string) {
    const supabase = await this.getAdminClient();
    
    const { data, error } = await supabase
      .from('User')
      .select('id, email, resetToken, resetTokenExpiry')
      .eq('resetToken', token)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to find user: ${error.message}`);
    }

    return data;
  }

  // Update user
  async updateUser(id: string, updates: any) {
    const supabase = await this.getAdminClient();
    
    const { data, error } = await supabase
      .from('User')
      .update({
        ...updates,
        updatedAt: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update user: ${error.message}`);
    }

    return data;
  }

  // Get user count
  async getUserCount() {
    const supabase = await this.getAdminClient();
    
    const { count, error } = await supabase
      .from('User')
      .select('*', { count: 'exact', head: true });

    if (error) {
      throw new Error(`Failed to get user count: ${error.message}`);
    }

    return count || 0;
  }
}

// Product operations using Supabase
export class SupabaseProductService {
  private async getAdminClient() {
    const client = await getSupabaseAdminClient();
    if (!client) {
      throw new Error('Supabase admin client not available');
    }
    return client;
  }

  // Get products by user ID
  async getProductsByUserId(userId: string) {
    const supabase = await this.getAdminClient();
    
    const { data, error } = await supabase
      .from('Product')
      .select('*')
      .eq('userId', userId)
      .order('createdAt', { ascending: false });

    if (error) {
      throw new Error(`Failed to get products: ${error.message}`);
    }

    return data || [];
  }

  // Create a new product
  async createProduct(productData: any) {
    const supabase = await this.getAdminClient();
    
    const { data, error } = await supabase
      .from('Product')
      .insert({
        ...productData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create product: ${error.message}`);
    }

    return data;
  }

  // Get product count by user ID
  async getProductCount(userId: string) {
    const supabase = await this.getAdminClient();
    
    const { count, error } = await supabase
      .from('Product')
      .select('*', { count: 'exact', head: true })
      .eq('userId', userId);

    if (error) {
      throw new Error(`Failed to get product count: ${error.message}`);
    }

    return count || 0;
  }
}

// Purchase operations using Supabase
export class SupabasePurchaseService {
  private async getAdminClient() {
    const client = await getSupabaseAdminClient();
    if (!client) {
      throw new Error('Supabase admin client not available');
    }
    return client;
  }

  // Get purchases including direct user purchases and product owner purchases
  async getAllUserRelatedPurchases(userId: string) {
    const supabase = await this.getAdminClient();
    
    // Get direct purchases by user
    const { data: userPurchases, error: userError } = await supabase
      .from('Purchase')
      .select(`
        *,
        product:Product(*)
      `)
      .eq('userId', userId);

    if (userError) {
      throw new Error(`Failed to get user purchases: ${userError.message}`);
    }

    // Get products owned by this user
    const { data: userProducts, error: productsError } = await supabase
      .from('Product')
      .select('id')
      .eq('userId', userId);

    if (productsError) {
      throw new Error(`Failed to get user products: ${productsError.message}`);
    }

    let productOwnerPurchases: any[] = [];
    if (userProducts && userProducts.length > 0) {
      const productIds = userProducts.map(p => p.id);
      
      // Get purchases for products owned by this user
      const { data: ownerPurchases, error: ownerError } = await supabase
        .from('Purchase')
        .select(`
          *,
          product:Product(*)
        `)
        .in('productId', productIds);

      if (ownerError) {
        throw new Error(`Failed to get product owner purchases: ${ownerError.message}`);
      }

      productOwnerPurchases = ownerPurchases || [];
    }

    // Combine and deduplicate
    const allPurchases = [...(userPurchases || []), ...productOwnerPurchases];
    const uniquePurchases = allPurchases.filter((purchase, index, self) => 
      index === self.findIndex(p => p.id === purchase.id)
    );

    return uniquePurchases;
  }

  // Get recent transactions for a user
  async getRecentTransactions(userId: string, limit: number = 5) {
    const supabase = await this.getAdminClient();
    
    // Get direct purchases by user
    const { data: userPurchases, error: userError } = await supabase
      .from('Purchase')
      .select(`
        *,
        product:Product(*)
      `)
      .eq('userId', userId)
      .order('createdAt', { ascending: false });

    if (userError) {
      throw new Error(`Failed to get user purchases: ${userError.message}`);
    }

    // Get products owned by this user
    const { data: userProducts, error: productsError } = await supabase
      .from('Product')
      .select('id')
      .eq('userId', userId);

    if (productsError) {
      throw new Error(`Failed to get user products: ${productsError.message}`);
    }

    let productOwnerPurchases: any[] = [];
    if (userProducts && userProducts.length > 0) {
      const productIds = userProducts.map(p => p.id);
      
      // Get purchases for products owned by this user
      const { data: ownerPurchases, error: ownerError } = await supabase
        .from('Purchase')
        .select(`
          *,
          product:Product(*)
        `)
        .in('productId', productIds)
        .order('createdAt', { ascending: false });

      if (ownerError) {
        throw new Error(`Failed to get product owner purchases: ${ownerError.message}`);
      }

      productOwnerPurchases = ownerPurchases || [];
    }

    // Combine and deduplicate
    const allPurchases = [...(userPurchases || []), ...productOwnerPurchases];
    const uniquePurchases = allPurchases.filter((purchase, index, self) => 
      index === self.findIndex(p => p.id === purchase.id)
    );

    // Sort by creation date and limit
    const sortedPurchases = uniquePurchases.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return sortedPurchases.slice(0, limit);
  }

  // Get unique customers who bought from this user's products
  async getUniqueCustomers(userId: string) {
    const supabase = await this.getAdminClient();
    
    // First get all products owned by this user
    const { data: userProducts, error: productsError } = await supabase
      .from('Product')
      .select('id')
      .eq('userId', userId);

    if (productsError) {
      throw new Error(`Failed to get user products: ${productsError.message}`);
    }

    if (!userProducts || userProducts.length === 0) {
      return 0;
    }

    const productIds = userProducts.map(p => p.id);

    // Then get purchases for those products
    const { data, error } = await supabase
      .from('Purchase')
      .select('email')
      .in('productId', productIds)
      .not('email', 'is', null);

    if (error) {
      throw new Error(`Failed to get customers: ${error.message}`);
    }

    // Get unique emails
    const uniqueEmails = [...new Set(data?.map(p => p.email).filter(Boolean))];
    return uniqueEmails.length;
  }
}

// Service instances
export const supabaseUserService = new SupabaseUserService();
export const supabaseProductService = new SupabaseProductService();
export const supabasePurchaseService = new SupabasePurchaseService();

// Test database connection using Supabase
export async function testSupabaseDatabase() {
  try {
    const userCount = await supabaseUserService.getUserCount();
    return {
      success: true,
      message: 'Supabase database connection successful',
      userCount,
      method: 'Supabase JavaScript Client'
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      method: 'Supabase JavaScript Client'
    };
  }
} 