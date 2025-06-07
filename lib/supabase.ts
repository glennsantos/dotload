// Supabase client utility for direct Supabase operations
import { createClient } from '@supabase/supabase-js';
import { getSupabaseConfig } from './database';

// Create Supabase client (client-side)
export const createSupabaseClient = () => {
  const config = getSupabaseConfig();
  
  if (!config) {
    throw new Error('Supabase is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.');
  }
  
  return createClient(config.url, config.anonKey);
};

// Create Supabase admin client (server-side)
export const createSupabaseAdminClient = () => {
  const config = getSupabaseConfig();
  
  if (!config || !config.serviceRoleKey) {
    throw new Error('Supabase admin client requires SUPABASE_SERVICE_ROLE_KEY environment variable.');
  }
  
  return createClient(config.url, config.serviceRoleKey);
};

// Get Supabase client (with error handling)
export const getSupabaseClient = () => {
  try {
    return createSupabaseClient();
  } catch (error) {
    console.warn('Supabase client not available:', error);
    return null;
  }
};

// Get Supabase admin client (with error handling)
export const getSupabaseAdminClient = () => {
  try {
    return createSupabaseAdminClient();
  } catch (error) {
    console.warn('Supabase admin client not available:', error);
    return null;
  }
};

// Test Supabase connection
export const testSupabaseConnection = async () => {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return { success: false, error: 'Supabase client not available' };
    }
    
    // Test with a simple query
    const { data, error } = await supabase.from('User').select('count').limit(1);
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    return { success: true, data };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};