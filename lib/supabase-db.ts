// Supabase Database Service - The Proper Way to Connect to Supabase
// This replaces direct PostgreSQL/Prisma connections with Supabase's JavaScript client

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

// Admin client for server-side operations
async function getSupabaseAdminClient() {
  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    return null;
  }
  
  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

// User operations using Supabase
export class SupabaseUserService {
  private async getAdminClient() {
    const client = await getSupabaseAdminClient();
    if (!client) {
      throw new Error('Supabase admin client not available');
    }
    return client;
  }

  async findUserByEmail(email: string) {
    const supabase = await this.getAdminClient();
    
    const { data, error } = await supabase
      .from('User')
      .select('*')
      .eq('email', email)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null;
      }
      throw new Error(`Failed to find user by email: ${error.message}`);
    }

    return data;
  }

  async findUserById(id: string) {
    const supabase = await this.getAdminClient();
    
    const { data, error } = await supabase
      .from('User')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to find user by ID: ${error.message}`);
    }

    return data;
  }

  async createUser(userData: any) {
    const supabase = await this.getAdminClient();
    
    const { data, error } = await supabase
      .from('User')
      .insert({
        ...userData,
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

  async updateUser(id: string, userData: any) {
    const supabase = await this.getAdminClient();
    
    const { data, error } = await supabase
      .from('User')
      .update({
        ...userData,
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

  async findUserByVerificationToken(token: string) {
    const supabase = await this.getAdminClient();
    
    const { data, error } = await supabase
      .from('User')
      .select('*')
      .eq('verificationToken', token)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to find user by verification token: ${error.message}`);
    }

    return data;
  }

  async findUserByResetToken(token: string) {
    const supabase = await this.getAdminClient();
    
    const { data, error } = await supabase
      .from('PasswordReset')
      .select(`
        *,
        user:User(*)
      `)
      .eq('token', token)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to find user by reset token: ${error.message}`);
    }

    return data;
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

  // Find product by ID
  async findProductById(id: string) {
    const supabase = await this.getAdminClient();
    
    const { data, error } = await supabase
      .from('Product')
      .select(`
        *,
        user:User(*),
        files:File(*),
        variations:Variation(*),
        purchases:Purchase(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to find product: ${error.message}`);
    }

    return data;
  }

  // Find product by slug
  async findProductBySlug(slug: string) {
    const supabase = await this.getAdminClient();
    
    const { data, error } = await supabase
      .from('Product')
      .select(`
        *,
        user:User(*),
        files:File(*),
        variations:Variation(*)
      `)
      .eq('slug', slug)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to find product by slug: ${error.message}`);
    }

    return data;
  }

  // Update product
  async updateProduct(id: string, productData: any) {
    const supabase = await this.getAdminClient();
    
    const { data, error } = await supabase
      .from('Product')
      .update({
        ...productData,
        updatedAt: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update product: ${error.message}`);
    }

    return data;
  }

  // Delete product
  async deleteProduct(id: string) {
    const supabase = await this.getAdminClient();
    
    const { error } = await supabase
      .from('Product')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete product: ${error.message}`);
    }

    return true;
  }

  // Get products by user ID
  async getProductsByUserId(userId: string, includeFiles = false) {
    const supabase = await this.getAdminClient();
    
    let selectFields = '*';
    if (includeFiles) {
      selectFields = `
        *,
        files:File(*),
        variations:Variation(*)
      `;
    }
    
    const { data, error } = await supabase
      .from('Product')
      .select(selectFields)
      .eq('userId', userId)
      .order('createdAt', { ascending: false });

    if (error) {
      throw new Error(`Failed to get products: ${error.message}`);
    }

    return data || [];
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

  // Check if slug exists
  async slugExists(slug: string, excludeId?: string) {
    const supabase = await this.getAdminClient();
    
    let query = supabase
      .from('Product')
      .select('id')
      .eq('slug', slug);

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to check slug: ${error.message}`);
    }

    return (data || []).length > 0;
  }

  // Get all products (public)
  async getAllProducts(filters?: any) {
    const supabase = await this.getAdminClient();
    
    let query = supabase
      .from('Product')
      .select(`
        *,
        user:User(id, name, storeName),
        files:File(*)
      `)
      .eq('isPublic', true)
      .eq('status', 'active');

    if (filters?.category) {
      query = query.eq('type', filters.category);
    }

    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    const { data, error } = await query
      .order('createdAt', { ascending: false });

    if (error) {
      throw new Error(`Failed to get products: ${error.message}`);
    }

    return data || [];
  }

  // Get products with discount codes
  async getProductsWithDiscountCodes(userId: string) {
    const supabase = await this.getAdminClient();
    
    const { data, error } = await supabase
      .from('Product')
      .select('id, name, discountCodes, createdAt')
      .eq('userId', userId)
      .not('discountCodes', 'is', null);
    
    if (error) {
      throw new Error(`Failed to get products with discount codes: ${error.message}`);
    }
    
    return data || [];
  }

  // Update product discount codes
  async updateProductDiscountCodes(productId: string, discountCodes: string) {
    const supabase = await this.getAdminClient();
    
    const { data, error } = await supabase
      .from('Product')
      .update({ 
        discountCodes,
        updatedAt: new Date().toISOString()
      })
      .eq('id', productId)
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to update product discount codes: ${error.message}`);
    }
    
    return data;
  }
}

// File operations using Supabase
export class SupabaseFileService {
  private async getAdminClient() {
    const client = await getSupabaseAdminClient();
    if (!client) {
      throw new Error('Supabase admin client not available');
    }
    return client;
  }

  // Create file record
  async createFile(fileData: any) {
    const supabase = await this.getAdminClient();
    
    const { data, error } = await supabase
      .from('File')
      .insert(fileData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create file: ${error.message}`);
    }

    return data;
  }

  // Get files by product ID
  async getFilesByProductId(productId: string) {
    const supabase = await this.getAdminClient();
    
    const { data, error } = await supabase
      .from('File')
      .select('*')
      .eq('productId', productId);

    if (error) {
      throw new Error(`Failed to get files: ${error.message}`);
    }

    return data || [];
  }

  // Find file by ID
  async findFileById(id: string) {
    const supabase = await this.getAdminClient();
    
    const { data, error } = await supabase
      .from('File')
      .select(`
        *,
        product:Product(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to find file: ${error.message}`);
    }

    return data;
  }

  // Delete file
  async deleteFile(fileId: string): Promise<any> {
    try {
      console.log('[SupabaseFileService] Deleting file:', fileId);
      
      const supabase = await this.getAdminClient();
      const { data, error } = await supabase
        .from('File')
        .delete()
        .eq('id', fileId)
        .select()
        .single();
      
      if (error) {
        console.error('[SupabaseFileService] Error deleting file:', error);
        throw new Error(`Failed to delete file: ${error.message}`);
      }
      
      console.log('[SupabaseFileService] File deleted successfully:', data);
      return data;
    } catch (error) {
      console.error('[SupabaseFileService] Exception deleting file:', error);
      throw error;
    }
  }

  // Create file download record
  async createFileDownload(downloadData: any) {
    const supabase = await this.getAdminClient();
    
    const { data, error } = await supabase
      .from('FileDownload')
      .insert({
        ...downloadData,
        downloadedAt: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create file download: ${error.message}`);
    }

    return data;
  }

  // Get download history
  async getDownloadHistory(fileId: string) {
    const supabase = await this.getAdminClient();
    
    const { data, error } = await supabase
      .from('FileDownload')
      .select(`
        *,
        file:File(*),
        purchase:Purchase(*)
      `)
      .eq('fileId', fileId)
      .order('downloadedAt', { ascending: false });

    if (error) {
      throw new Error(`Failed to get download history: ${error.message}`);
    }

    return data || [];
  }

  async getFileCount(): Promise<number> {
    try {
      console.log('[SupabaseFileService] Getting file count');
      
      const supabase = await this.getAdminClient();
      const { count, error } = await supabase
        .from('File')
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.error('[SupabaseFileService] Error getting file count:', error);
        throw new Error(`Failed to get file count: ${error.message}`);
      }
      
      return count || 0;
    } catch (error) {
      console.error('[SupabaseFileService] Exception getting file count:', error);
      throw error;
    }
  }

  async getFiles(options?: { limit?: number; offset?: number }): Promise<any[]> {
    try {
      console.log('[SupabaseFileService] Getting files with options:', options);
      
      const supabase = await this.getAdminClient();
      let query = supabase
        .from('File')
        .select('id, filename, path, productId, createdAt');
      
      if (options?.limit) {
        query = query.limit(options.limit);
      }
      
      if (options?.offset) {
        query = query.range(options.offset, (options.offset + (options.limit || 10)) - 1);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('[SupabaseFileService] Error getting files:', error);
        throw new Error(`Failed to get files: ${error.message}`);
      }
      
      return data || [];
    } catch (error) {
      console.error('[SupabaseFileService] Exception getting files:', error);
      throw error;
    }
  }

  async findFileByProductIds(productIds: string[], fileExtension?: string): Promise<any | null> {
    try {
      console.log('[SupabaseFileService] Finding file by product IDs:', productIds, 'extension:', fileExtension);
      
      const supabase = await this.getAdminClient();
      let query = supabase
        .from('File')
        .select('*')
        .in('productId', productIds);
      
      if (fileExtension) {
        query = query.like('filename', `%${fileExtension}`);
      }
      
      const { data, error } = await query.limit(1);
      
      if (error) {
        console.error('[SupabaseFileService] Error finding file by product IDs:', error);
        throw new Error(`Failed to find file by product IDs: ${error.message}`);
      }
      
      return data && data.length > 0 ? data[0] : null;
    } catch (error) {
      console.error('[SupabaseFileService] Exception finding file by product IDs:', error);
      throw error;
    }
  }
}

// Variation operations using Supabase
export class SupabaseVariationService {
  private async getAdminClient() {
    const client = await getSupabaseAdminClient();
    if (!client) {
      throw new Error('Supabase admin client not available');
    }
    return client;
  }

  // Create variation
  async createVariation(variationData: any) {
    const supabase = await this.getAdminClient();
    
    const { data, error } = await supabase
      .from('Variation')
      .insert(variationData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create variation: ${error.message}`);
    }

    return data;
  }

  // Get variations by product ID
  async getVariationsByProductId(productId: string) {
    const supabase = await this.getAdminClient();
    
    const { data, error } = await supabase
      .from('Variation')
      .select('*')
      .eq('productId', productId);

    if (error) {
      throw new Error(`Failed to get variations: ${error.message}`);
    }

    return data || [];
  }

  // Update variation
  async updateVariation(id: string, variationData: any) {
    const supabase = await this.getAdminClient();
    
    const { data, error } = await supabase
      .from('Variation')
      .update(variationData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update variation: ${error.message}`);
    }

    return data;
  }

  // Delete variation
  async deleteVariation(id: string) {
    const supabase = await this.getAdminClient();
    
    const { error } = await supabase
      .from('Variation')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete variation: ${error.message}`);
    }

    return true;
  }

  // Find variation by ID
  async findVariationById(id: string) {
    const supabase = await this.getAdminClient();
    
    const { data, error } = await supabase
      .from('Variation')
      .select(`
        *,
        product:Product(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to find variation: ${error.message}`);
    }

    return data;
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

  // Create purchase
  async createPurchase(purchaseData: any) {
    const supabase = await this.getAdminClient();
    
    const { data, error } = await supabase
      .from('Purchase')
      .insert({
        ...purchaseData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create purchase: ${error.message}`);
    }

    return data;
  }

  // Find purchase by ID
  async findPurchaseById(id: string) {
    const supabase = await this.getAdminClient();
    
    const { data, error } = await supabase
      .from('Purchase')
      .select(`
        *,
        product:Product(*),
        user:User(*),
        downloads:FileDownload(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to find purchase: ${error.message}`);
    }

    return data;
  }

  // Find purchase by access code
  async findPurchaseByAccessCode(accessCode: string) {
    const supabase = await this.getAdminClient();
    
    const { data, error } = await supabase
      .from('Purchase')
      .select(`
        *,
        product:Product(*),
        user:User(*)
      `)
      .eq('accessCode', accessCode)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to find purchase by access code: ${error.message}`);
    }

    return data;
  }

  // Find purchase by payment ID
  async findPurchaseByPaymentId(paymentId: string) {
    const supabase = await this.getAdminClient();
    
    const { data, error } = await supabase
      .from('Purchase')
      .select(`
        *,
        product:Product(*),
        user:User(*)
      `)
      .eq('paymentId', paymentId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to find purchase by payment ID: ${error.message}`);
    }

    return data;
  }

  // Update purchase
  async updatePurchase(id: string, purchaseData: any) {
    const supabase = await this.getAdminClient();
    
    const { data, error } = await supabase
      .from('Purchase')
      .update({
        ...purchaseData,
        updatedAt: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update purchase: ${error.message}`);
    }

    return data;
  }

  // Get purchases by email
  async getPurchasesByEmail(email: string, options?: any) {
    const supabase = await this.getAdminClient();
    
    let query = supabase
      .from('Purchase')
      .select(`
        *,
        product:Product(${options?.includeFiles ? 'id, name, description, price, files:File(*)' : 'id, name, description, price'})
      `)
      .eq('email', email);

    if (options?.status && options.status !== 'all') {
      query = query.eq('status', options.status);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
    }

    const { data, error } = await query
      .order('createdAt', { ascending: false });

    if (error) {
      throw new Error(`Failed to get purchases: ${error.message}`);
    }

    return data || [];
  }

  // Count purchases by email
  async countPurchasesByEmail(email: string, status?: string) {
    const supabase = await this.getAdminClient();
    
    let query = supabase
      .from('Purchase')
      .select('*', { count: 'exact', head: true })
      .eq('email', email);

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { count, error } = await query;

    if (error) {
      throw new Error(`Failed to count purchases: ${error.message}`);
    }

    return count || 0;
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

  // Get unique customers count who bought from this user's products
  async getUniqueCustomersCount(userId: string) {
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

  // Get unique customers data who bought from this user's products
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
      return [];
    }

    const productIds = userProducts.map(p => p.id);

    // Get all purchases for those products with aggregation
    const { data, error } = await supabase
      .from('Purchase')
      .select('email, amount, status, createdAt')
      .in('productId', productIds)
      .not('email', 'is', null);

    if (error) {
      throw new Error(`Failed to get customers: ${error.message}`);
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Group by email to create customer records
    const customerMap = new Map();
    
    data.forEach(purchase => {
      if (!customerMap.has(purchase.email)) {
        customerMap.set(purchase.email, {
          email: purchase.email,
          purchaseCount: 1,
          totalSpent: purchase.amount || 0,
          firstPurchase: purchase.createdAt,
          lastPurchase: purchase.createdAt,
          status: purchase.status === 'completed' ? 'active' : 'pending'
        });
      } else {
        const customer = customerMap.get(purchase.email);
        customer.purchaseCount += 1;
        customer.totalSpent += purchase.amount || 0;
        
        // Update first/last purchase dates
        if (new Date(purchase.createdAt) < new Date(customer.firstPurchase)) {
          customer.firstPurchase = purchase.createdAt;
        }
        if (new Date(purchase.createdAt) > new Date(customer.lastPurchase)) {
          customer.lastPurchase = purchase.createdAt;
        }
        
        // Update status - if any purchase is completed, mark as active
        if (purchase.status === 'completed') {
          customer.status = 'active';
        }
      }
    });

    return Array.from(customerMap.values());
  }

  // Get purchases by user ID (where user owns the product)
  async getPurchasesByProductOwner(userId: string) {
    const supabase = await this.getAdminClient();
    
    // First get products owned by this user
    const { data: userProducts, error: productsError } = await supabase
      .from('Product')
      .select('id')
      .eq('userId', userId);

    if (productsError) {
      throw new Error(`Failed to get user products: ${productsError.message}`);
    }

    if (!userProducts || userProducts.length === 0) {
      return [];
    }

    const productIds = userProducts.map(p => p.id);

    // Get purchases for those products
    const { data, error } = await supabase
      .from('Purchase')
      .select(`
        *,
        product:Product(*)
      `)
      .in('productId', productIds);

    if (error) {
      throw new Error(`Failed to get purchases: ${error.message}`);
    }

    return data || [];
  }
}

// Transaction operations using Supabase
export class SupabaseTransactionService {
  private async getAdminClient() {
    const client = await getSupabaseAdminClient();
    if (!client) {
      throw new Error('Supabase admin client not available');
    }
    return client;
  }

  // Create transaction
  async createTransaction(transactionData: any) {
    const supabase = await this.getAdminClient();
    
    const { data, error } = await supabase
      .from('Transaction')
      .insert({
        ...transactionData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create transaction: ${error.message}`);
    }

    return data;
  }

  // Get transactions by user ID
  async getTransactionsByUserId(userId: string, options?: any) {
    const supabase = await this.getAdminClient();
    
    let query = supabase
      .from('Transaction')
      .select('*')
      .eq('userId', userId);

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
    }

    if (options?.type) {
      query = query.eq('type', options.type);
    }

    if (options?.status) {
      query = query.eq('status', options.status);
    }

    const { data, error } = await query
      .order('createdAt', { ascending: false });

    if (error) {
      throw new Error(`Failed to get transactions: ${error.message}`);
    }

    return data || [];
  }

  // Count transactions by user ID
  async countTransactionsByUserId(userId: string) {
    const supabase = await this.getAdminClient();
    
    const { count, error } = await supabase
      .from('Transaction')
      .select('*', { count: 'exact', head: true })
      .eq('userId', userId);

    if (error) {
      throw new Error(`Failed to count transactions: ${error.message}`);
    }

    return count || 0;
  }

  // Get transaction summary by user ID
  async getTransactionSummary(userId: string) {
    const supabase = await this.getAdminClient();
    
    // Get all transactions for the user
    const { data, error } = await supabase
      .from('Transaction')
      .select('*')
      .eq('userId', userId);

    if (error) {
      throw new Error(`Failed to get transaction summary: ${error.message}`);
    }

    const transactions = data || [];

    // Calculate totals
    const totalIncome = transactions
      .filter(t => t.type === 'income' && t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalPayouts = transactions
      .filter(t => t.type === 'payout' && t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalFees = transactions
      .filter(t => t.type === 'fee' && t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalPurchases = transactions
      .filter(t => t.type === 'purchase' && t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalPayments = transactions
      .filter(t => t.type === 'payment' && t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalPendingIncome = transactions
      .filter(t => t.type === 'income' && t.status === 'pending')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalPendingPayouts = transactions
      .filter(t => t.type === 'payout' && t.status === 'pending')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalPendingFees = transactions
      .filter(t => t.type === 'fee' && t.status === 'pending')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalPendingPurchases = transactions
      .filter(t => t.type === 'purchase' && t.status === 'pending')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalPendingPayments = transactions
      .filter(t => t.type === 'payment' && t.status === 'pending')
      .reduce((sum, t) => sum + t.amount, 0);

    const currentBalance = totalIncome - totalPayouts - totalFees + totalPurchases + totalPayments;
    const pendingBalance = totalPendingIncome - totalPendingPayouts - totalPendingFees + totalPendingPurchases + totalPendingPayments;
    const availableBalance = currentBalance + pendingBalance;

    return {
      totalIncome,
      totalPayouts,
      totalFees,
      totalPurchases,
      totalPayments,
      currentBalance,
      totalPendingIncome,
      totalPendingPayouts,
      totalPendingFees,
      totalPendingPurchases,
      totalPendingPayments,
      pendingBalance,
      availableBalance
    };
  }

  // Find transaction by ID
  async findTransactionById(id: string) {
    const supabase = await this.getAdminClient();
    
    const { data, error } = await supabase
      .from('Transaction')
      .select(`
        *,
        user:User(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to find transaction: ${error.message}`);
    }

    return data;
  }

  // Update transaction
  async updateTransaction(id: string, transactionData: any) {
    const supabase = await this.getAdminClient();
    
    const { data, error } = await supabase
      .from('Transaction')
      .update({
        ...transactionData,
        updatedAt: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update transaction: ${error.message}`);
    }

    return data;
  }
}

// Payout operations using Supabase
export class SupabasePayoutService {
  private async getAdminClient() {
    const client = await getSupabaseAdminClient();
    if (!client) {
      throw new Error('Supabase admin client not available');
    }
    return client;
  }

  // Create payout
  async createPayout(payoutData: any) {
    const supabase = await this.getAdminClient();
    
    const { data, error } = await supabase
      .from('Payout')
      .insert({
        ...payoutData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create payout: ${error.message}`);
    }

    return data;
  }

  // Get payouts by user ID
  async getPayoutsByUserId(userId: string) {
    const supabase = await this.getAdminClient();
    
    const { data, error } = await supabase
      .from('Payout')
      .select(`
        *,
        user:User(*)
      `)
      .eq('userId', userId)
      .order('createdAt', { ascending: false });

    if (error) {
      throw new Error(`Failed to get payouts: ${error.message}`);
    }

    return data || [];
  }

  // Find payout by ID
  async findPayoutById(id: string) {
    const supabase = await this.getAdminClient();
    
    const { data, error } = await supabase
      .from('Payout')
      .select(`
        *,
        user:User(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to find payout: ${error.message}`);
    }

    return data;
  }

  // Find payout by external ID
  async findPayoutByExternalId(externalId: string) {
    const supabase = await this.getAdminClient();
    
    const { data, error } = await supabase
      .from('Payout')
      .select('*')
      .eq('externalId', externalId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to find payout by external ID: ${error.message}`);
    }

    return data;
  }

  // Update payout
  async updatePayout(id: string, payoutData: any) {
    const supabase = await this.getAdminClient();
    
    const { data, error } = await supabase
      .from('Payout')
      .update({
        ...payoutData,
        updatedAt: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update payout: ${error.message}`);
    }

    return data;
  }
}

// Password Reset operations using Supabase
export class SupabasePasswordResetService {
  private async getAdminClient() {
    const client = await getSupabaseAdminClient();
    if (!client) {
      throw new Error('Supabase admin client not available');
    }
    return client;
  }

  // Create password reset token
  async createPasswordReset(userId: string, token: string, expiresAt: Date) {
    const supabase = await this.getAdminClient();
    
    // First, delete any existing reset tokens for this user
    await supabase
      .from('PasswordReset')
      .delete()
      .eq('userId', userId);

    // Create new reset token
    const { data, error } = await supabase
      .from('PasswordReset')
      .insert({
        userId,
        token,
        expiresAt: expiresAt.toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create password reset: ${error.message}`);
    }

    return data;
  }

  // Find password reset by token
  async findPasswordResetByToken(token: string) {
    const supabase = await this.getAdminClient();
    
    const { data, error } = await supabase
      .from('PasswordReset')
      .select(`
        *,
        user:User(*)
      `)
      .eq('token', token)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to find password reset: ${error.message}`);
    }

    return data;
  }

  // Delete password reset token
  async deletePasswordReset(token: string) {
    const supabase = await this.getAdminClient();
    
    const { error } = await supabase
      .from('PasswordReset')
      .delete()
      .eq('token', token);

    if (error) {
      throw new Error(`Failed to delete password reset: ${error.message}`);
    }

    return true;
  }

  // Delete password reset by user ID
  async deletePasswordResetByUserId(userId: string) {
    const supabase = await this.getAdminClient();
    
    const { error } = await supabase
      .from('PasswordReset')
      .delete()
      .eq('userId', userId);

    if (error) {
      throw new Error(`Failed to delete password reset: ${error.message}`);
    }

    return true;
  }
}

// Service instances
export const supabaseUserService = new SupabaseUserService();
export const supabaseProductService = new SupabaseProductService();
export const supabaseFileService = new SupabaseFileService();
export const supabaseVariationService = new SupabaseVariationService();
export const supabasePurchaseService = new SupabasePurchaseService();
export const supabaseTransactionService = new SupabaseTransactionService();
export const supabasePayoutService = new SupabasePayoutService();
export const supabasePasswordResetService = new SupabasePasswordResetService();

// Test database connection using Supabase
export async function testSupabaseConnection() {
  try {
    const client = await getSupabaseAdminClient();
    if (!client) {
      throw new Error('Failed to create Supabase client');
    }

    const { data, error } = await client
      .from('User')
      .select('count')
      .limit(1);

    if (error) {
      throw new Error(`Supabase connection failed: ${error.message}`);
    }

    console.log('✅ Supabase connection successful');
    return true;
  } catch (error) {
    console.error('❌ Supabase connection failed:', error);
    return false;
  }
} 