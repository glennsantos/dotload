import { NextRequest, NextResponse } from 'next/server';
import { supabasePurchaseService, supabaseUserService } from '@/lib/supabase-db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';


// Enable debugging
const DEBUG = true;
const debugLog = (message: string, ...args: any[]) => {
  if (DEBUG) {
    console.log(`[DEBUG] ${message}`, ...args);
    process.stderr.write(`[DEBUG] ${message} ${args.map(a => JSON.stringify(a)).join(' ')}\n`);
  }
};

export async function POST(req: NextRequest) {
  try {
    const { name, email, accessCode } = await req.json();

    // Validate input
    if (!email) {
      return NextResponse.json(
        { message: 'Email is required' },
        { status: 400 }
      );
    }

    if (!accessCode) {
      return NextResponse.json(
        { message: 'Access code is required' },
        { status: 400 }
      );
    }

    debugLog('Processing create user from purchase', { email, accessCode });

    // Verify the purchase with the access code using Supabase
    const purchase = await supabasePurchaseService.findPurchaseByAccessCode(accessCode);

    if (!purchase || (purchase as any).email !== email) {
      debugLog('No purchase found with the provided access code and email');
      return NextResponse.json(
        { message: 'Invalid access code or email' },
        { status: 400 }
      );
    }

    // Check if user already exists using Supabase
    let user = await supabaseUserService.findUserByEmail(email);

    if (user) {
      debugLog('User already exists with email:', email);
      
      // If user exists but name is missing and provided, update it
      if (!(user as any).name && name) {
        user = await supabaseUserService.updateUser((user as any).id, { name });
        debugLog('Updated existing user with name:', name);
      }
    } else {
      // Generate a random password for the new user
      const randomPassword = Math.random().toString(36).slice(-8);
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(randomPassword, salt);

      // Create new user using Supabase
      user = await supabaseUserService.createUser({
        id: uuidv4(),
        email,
        name: name || null,
        password: hashedPassword,
        emailVerified: true, // Since they've made a purchase, we can consider their email verified
      });

      debugLog('Created new user from purchase', { userId: (user as any).id, email });
      
      // TODO: In a real application, send an email with the random password
      // and instructions to change it
      console.log(`[New User] Email: ${email}, Password: ${randomPassword}`);
    }

    // Generate JWT token
    const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_please_set_in_env';
    const token = jwt.sign(
      { userId: (user as any).id, email: (user as any).email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    debugLog('Generated JWT token for user');

    // Create a response with the user data and token
    const response = NextResponse.json({
      message: 'User account created/updated successfully',
      user: {
        id: (user as any).id,
        email: (user as any).email,
        name: (user as any).name,
      },
    }, { status: 200 });

    // Set the token as an HTTP-only cookie
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
      // Only set domain for production, leave undefined for localhost
      domain: process.env.NODE_ENV === 'production' ? process.env.COOKIE_DOMAIN : undefined
    });

    debugLog('Set authentication cookie');
    return response;
  } catch (error) {
    debugLog('Error creating user from purchase:', error);
    
    if (error instanceof Error) {
      // Handle specific Supabase errors
      if (error.message.includes('Failed to')) {
        return NextResponse.json(
          { message: 'Database error occurred. Please try again.' },
          { status: 500 }
        );
      }
    }
    
    return NextResponse.json(
      { message: 'An error occurred while processing your request' },
      { status: 500 }
    );
  }
}
