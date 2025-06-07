import { NextRequest, NextResponse } from 'next/server';
import * as bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import crypto from 'crypto';
import { sendVerificationEmail } from '@/lib/email';
import { uploadToCloudinary } from '@/lib/cloudinary';

// Email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Password Strength Validation
const validatePasswordStrength = (password: string) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  return {
    isValid: 
      password.length >= minLength && 
      hasUpperCase && 
      hasLowerCase && 
      hasNumbers && 
      hasSpecialChar,
    requirements: [
      password.length < minLength && 'At least 8 characters long',
      !hasUpperCase && 'Contains an uppercase letter',
      !hasLowerCase && 'Contains a lowercase letter',
      !hasNumbers && 'Contains a number',
      !hasSpecialChar && 'Contains a special character'
    ].filter(Boolean)
  };
};

export async function POST(req: NextRequest) {
  console.log('Registration API called');
  try {
    // Check if the request is multipart/form-data or application/json
    const contentType = req.headers.get('content-type') || '';
    console.log('Content-Type:', contentType);
    
    // Test database connection first
    try {
      await prisma.$connect();
      console.log('Database connection successful');
    } catch (dbError) {
      console.error('Database connection failed:', dbError);
      return NextResponse.json({ 
        error: 'Database connection failed',
        details: 'Unable to connect to the database' 
      }, { status: 500 });
    }
    
    let email, password, name, storeName, storeDescription;
    let logoFile = null;
    let headerFile = null;
    
    if (contentType.includes('multipart/form-data')) {
      // Handle form data submission with file uploads
      const formData = await req.formData();
      
      email = formData.get('email') as string;
      password = formData.get('password') as string;
      name = formData.get('name') as string;
      storeName = formData.get('storeName') as string;
      storeDescription = formData.get('storeDescription') as string;
      logoFile = formData.get('logoFile') as File | null;
      headerFile = formData.get('headerFile') as File | null;
    } else {
      // Handle JSON submission
      const data = await req.json();
      email = data.email;
      password = data.password;
      name = data.name;
      storeName = data.storeName;
      storeDescription = data.storeDescription;
    }

    // Validate required fields
    if (!email || !password) {
      console.log('Missing required fields - email:', !!email, 'password:', !!password);
      return NextResponse.json({ 
        error: 'Missing required fields',
        details: 'Email and password are required' 
      }, { status: 400 });
    }

    console.log('Validating email format for:', email);
    // Validate email
    if (!emailRegex.test(email)) {
      console.log('Invalid email format:', email);
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      return NextResponse.json({ 
        error: 'Password does not meet strength requirements',
        requirements: passwordValidation.requirements 
      }, { status: 400 });
    }

    // Check if user already exists
    console.log('Checking if user exists for email:', email);
    try {
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        console.log('User already exists for email:', email);
        return NextResponse.json({ error: 'Email already in use' }, { status: 400 });
      }
      console.log('No existing user found, proceeding with registration');
    } catch (dbError) {
      console.error('Error checking existing user:', dbError);
      return NextResponse.json({ 
        error: 'Database error',
        details: 'Error checking existing user' 
      }, { status: 500 });
    }

    // Hash password
    console.log('Hashing password...');
    let hashedPassword;
    try {
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(password, salt);
      console.log('Password hashed successfully');
    } catch (hashError) {
      console.error('Error hashing password:', hashError);
      return NextResponse.json({ 
        error: 'Password hashing failed',
        details: 'Unable to process password' 
      }, { status: 500 });
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    
    // Process image files if provided
    let storeLogoPath = null;
    let storeHeaderPath = null;
    
    if (logoFile) {
      try {
        const arrayBuffer = await logoFile.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const result = await uploadToCloudinary(buffer, {
          folder: `users/registration`,
          public_id: `logo-${Date.now()}`,
        }) as any;
        storeLogoPath = result.secure_url;
      } catch (error) {
        console.error('Error uploading logo:', error);
      }
    }
    
    if (headerFile) {
      try {
        const arrayBuffer = await headerFile.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const result = await uploadToCloudinary(buffer, {
          folder: `users/registration`,
          public_id: `header-${Date.now()}`,
        }) as any;
        storeHeaderPath = result.secure_url;
      } catch (error) {
        console.error('Error uploading header:', error);
      }
    }
    
    // Create user with verification token (without store branding fields first)
    console.log('Creating user in database...');
    let user;
    try {
      user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name: name || null,  // Allow optional name
          emailVerified: false,
          verificationToken,
          verificationTokenExpiry
        },
        select: {
          id: true,
          email: true,
          name: true
        }
      });
      console.log('User created successfully with ID:', user.id);
    } catch (createError) {
      console.error('Error creating user:', createError);
      return NextResponse.json({ 
        error: 'Failed to create user',
        details: createError instanceof Error ? createError.message : 'Unknown error' 
      }, { status: 500 });
    }
    
    // Then update the user with store branding fields in a separate operation
    if (storeName || storeDescription || storeLogoPath || storeHeaderPath) {
      try {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            storeName: storeName || null,
            storeDescription: storeDescription || null,
            storeLogoPath: storeLogoPath || null,
            storeHeaderPath: storeHeaderPath || null
          }
        });
      } catch (error) {
        console.error('Error updating store branding fields:', error);
        // Continue with registration even if store branding update fails
      }
    }
    
    // If we have uploaded files, update their folder path to include the user ID
    if (storeLogoPath || storeHeaderPath) {
      try {
        // This is a background task, we don't need to wait for it
        prisma.user.update({
          where: { id: user.id },
          data: {
            storeLogoPath: storeLogoPath ? storeLogoPath.replace('users/registration', `users/${user.id}/logo`) : null,
            storeHeaderPath: storeHeaderPath ? storeHeaderPath.replace('users/registration', `users/${user.id}/header`) : null
          }
        });
      } catch (error) {
        console.error('Error updating file paths:', error);
      }
    }
    
    // Send verification email (with error handling)
    try {
      await sendVerificationEmail(email, verificationToken, name);
    } catch (emailError) {
      console.error('Error sending verification email:', emailError);
      // Continue with registration even if email fails
      // User can still verify later or request a new verification email
    }

    // Create a response with verification message
    const response = NextResponse.json({
      message: 'User registered successfully. Please check your email to verify your account.',
      user,
      requiresVerification: true
    }, { status: 201 });
    
    // We don't set the authentication cookie until the email is verified
    // This ensures users verify their email before accessing protected routes

    return response;
  } catch (error) {
    console.error('Registration error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    // Handle Prisma-specific errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.error('Prisma error code:', error.code);
      // Unique constraint violation
      if (error.code === 'P2002') {
        return NextResponse.json({ 
          error: 'Email already in use', 
          details: 'A user with this email already exists' 
        }, { status: 400 });
      }
    }

    // Ensure we always return JSON, never HTML
    return NextResponse.json({ 
      error: 'Registration failed', 
      details: error instanceof Error ? error.message : 'An unexpected error occurred',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
