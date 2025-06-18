import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabaseUserService } from '@/lib/supabase-db';

// Debug logging function
const debugLog = (message: string, data?: any) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Registration API] ${message}`, data || '');
  }
};

export async function POST(req: NextRequest) {
  try {
    debugLog('=== REGISTRATION REQUEST START ===');
    debugLog(`Timestamp: ${new Date().toISOString()}`);
    
    // Parse FormData instead of JSON to handle file uploads
    const formData = await req.formData();
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const storeName = formData.get('storeName') as string;
    const storeDescription = formData.get('storeDescription') as string;
    const logoFile = formData.get('logoFile') as File | null;
    const headerFile = formData.get('headerFile') as File | null;

    debugLog('Registration attempt', { email, storeName });

    // Validate required fields
    if (!email || !password) {
      debugLog('❌ Missing required fields');
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      debugLog('❌ Invalid email format');
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    // Validate password strength
    if (password.length < 6) {
      debugLog('❌ Password too short');
      return NextResponse.json({ error: 'Password must be at least 6 characters long' }, { status: 400 });
    }

    debugLog('✅ Input validation passed');

    // Check if user already exists using Supabase
    debugLog('🔍 Checking if user exists...');
    try {
      const existingUser = await supabaseUserService.findUserByEmail(email);
      if (existingUser) {
        debugLog('❌ User already exists');
        return NextResponse.json({ error: 'User already exists with this email' }, { status: 409 });
      }
      debugLog('✅ Email is available');
    } catch (error) {
      debugLog('❌ Error checking existing user', error);
      return NextResponse.json({ error: 'Error checking user existence' }, { status: 500 });
    }

    // Hash password
    debugLog('🔒 Hashing password...');
    let hashedPassword;
    try {
      hashedPassword = await bcrypt.hash(password, 12);
      debugLog('✅ Password hashed successfully');
    } catch (hashError) {
      debugLog('❌ Password hashing failed', hashError);
      return NextResponse.json({ error: 'Password processing failed' }, { status: 500 });
    }

    // TODO: Handle file uploads for logo and header images
    // For now, we'll create the user without file paths and add file upload functionality later
    let storeLogoPath: string | undefined;
    let storeHeaderPath: string | undefined;
    
    if (logoFile && logoFile.size > 0) {
      debugLog('📎 Logo file uploaded', { name: logoFile.name, size: logoFile.size });
      // TODO: Implement file upload to Cloudinary or storage service
      // storeLogoPath = await uploadFile(logoFile, 'logos');
    }
    
    if (headerFile && headerFile.size > 0) {
      debugLog('📎 Header file uploaded', { name: headerFile.name, size: headerFile.size });
      // TODO: Implement file upload to Cloudinary or storage service  
      // storeHeaderPath = await uploadFile(headerFile, 'headers');
    }

    // Create user using Supabase
    debugLog('👤 Creating user...');
    try {
      const newUser = await supabaseUserService.createUser({
        name,
        email,
        password: hashedPassword,
        storeName,
        storeDescription,
        storeLogoPath,
        storeHeaderPath
      });

      debugLog('✅ User created successfully', { id: newUser.id, email: newUser.email });

      // Return success response (excluding password)
      const { password: _, ...userResponse } = newUser;
      
      return NextResponse.json({
        success: true,
        message: 'Registration successful',
        user: userResponse,
        method: 'Supabase JavaScript Client'
      }, { status: 201 });

    } catch (userCreationError) {
      debugLog('❌ User creation failed', userCreationError);
      return NextResponse.json({ 
        error: 'User creation failed',
        details: userCreationError instanceof Error ? userCreationError.message : 'Unknown error'
      }, { status: 500 });
    }

  } catch (error) {
    debugLog('❌ Registration failed with unexpected error', error);
    
    return NextResponse.json({
      success: false,
      error: 'Registration failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      method: 'Supabase JavaScript Client',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
