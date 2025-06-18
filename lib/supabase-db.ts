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
    
    // Generate a UUID for the user
    const userId = crypto.randomUUID();
    
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
}

// Service instances
export const supabaseUserService = new SupabaseUserService();
export const supabaseProductService = new SupabaseProductService();

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