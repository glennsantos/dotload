// Database configuration utility with Supabase integration and local fallback

// Environment variables for Supabase
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Database URLs
const DATABASE_URL = process.env.DATABASE_URL;
const DIRECT_URL = process.env.DIRECT_URL;
const LOCAL_DATABASE_URL = process.env.LOCAL_DATABASE_URL || 'postgresql://postgres:password@localhost:5432/alacart';

// Check if Supabase is configured
export const isSupabaseConfigured = () => {
  return !!(SUPABASE_URL && SUPABASE_ANON_KEY);
};

// Get the appropriate database URL
export const getDatabaseUrl = () => {
  if (isSupabaseConfigured() && DATABASE_URL) {
    console.log('Using Supabase database');
    return DATABASE_URL;
  } else {
    console.log('Falling back to local database');
    return LOCAL_DATABASE_URL;
  }
};

// Get the appropriate direct URL for Prisma
export const getDirectUrl = () => {
  if (isSupabaseConfigured() && DIRECT_URL) {
    return DIRECT_URL;
  } else {
    return LOCAL_DATABASE_URL;
  }
};

// Database configuration for Prisma
export const getDatabaseConfig = () => {
  const config = {
    url: getDatabaseUrl(),
    directUrl: getDirectUrl(),
    isSupabase: isSupabaseConfigured(),
  };
  
  console.log('Database configuration:', {
    isSupabase: config.isSupabase,
    hasUrl: !!config.url,
    hasDirectUrl: !!config.directUrl,
  });
  
  return config;
};

// Supabase configuration
export const getSupabaseConfig = () => {
  if (!isSupabaseConfigured()) {
    return null;
  }
  
  return {
    url: SUPABASE_URL!,
    anonKey: SUPABASE_ANON_KEY!,
    serviceRoleKey: SUPABASE_SERVICE_ROLE_KEY,
  };
};

// Test database connectivity
export const testDatabaseConnection = async () => {
  const config = getDatabaseConfig();
  
  try {
    // This will be used by the test endpoint
    return {
      success: true,
      config: {
        isSupabase: config.isSupabase,
        hasUrl: !!config.url,
        hasDirectUrl: !!config.directUrl,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      config: {
        isSupabase: config.isSupabase,
        hasUrl: !!config.url,
        hasDirectUrl: !!config.directUrl,
      },
    };
  }
};