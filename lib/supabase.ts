// Supabase client utility for direct Supabase operations

// Check if Supabase is configured
export const isSupabaseConfigured = () => {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
};

// Create Supabase client (client-side)
export const createSupabaseClient = async () => {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.');
  }
  
  const { createClient } = await import('@supabase/supabase-js');
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
};

// Create Supabase admin client (server-side)
export const createSupabaseAdminClient = async () => {
  if (!isSupabaseConfigured() || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Supabase admin client requires SUPABASE_SERVICE_ROLE_KEY environment variable.');
  }
  
  const { createClient } = await import('@supabase/supabase-js');
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
};

// Get Supabase client (with error handling)
export const getSupabaseClient = async () => {
  try {
    return await createSupabaseClient();
  } catch (error) {
    console.warn('Supabase client not available:', error);
    return null;
  }
};

// Get Supabase admin client (with error handling)
export const getSupabaseAdminClient = async () => {
  try {
    return await createSupabaseAdminClient();
  } catch (error) {
    console.warn('Supabase admin client not available:', error);
    return null;
  }
};

// Test Supabase connection
export const testSupabaseConnection = async () => {
  try {
    const supabase = await getSupabaseClient();
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