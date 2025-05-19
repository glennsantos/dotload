import { NextRequest, NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma"
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

    // Verify the purchase with the access code
    const purchase = await prisma.purchase.findFirst({
      where: {
        accessCode,
        email,
      },
    });

    if (!purchase) {
      debugLog('No purchase found with the provided access code and email');
      return NextResponse.json(
        { message: 'Invalid access code or email' },
        { status: 400 }
      );
    }

    // Check if user already exists
    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (user) {
      debugLog('User already exists with email:', email);
      
      // If user exists but name is missing and provided, update it
      if (!user.name && name) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { name },
        });
        debugLog('Updated existing user with name:', name);
      }
    } else {
      // Generate a random password for the new user
      const randomPassword = Math.random().toString(36).slice(-8);
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(randomPassword, salt);

      // Create new user
      user = await prisma.user.create({
        data: {
          id: uuidv4(),
          email,
          name: name || null,
          password: hashedPassword,
          emailVerified: true, // Since they've made a purchase, we can consider their email verified
        },
      });

      debugLog('Created new user from purchase', { userId: user.id, email });
      
      // TODO: In a real application, send an email with the random password
      // and instructions to change it
      console.log(`[New User] Email: ${email}, Password: ${randomPassword}`);
    }

    // Generate JWT token
    const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_please_set_in_env';
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    debugLog('Generated JWT token for user');

    // Create a response with the user data and token
    const response = NextResponse.json({
      message: 'User account created/updated successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    }, { status: 200 });

    // Set the token as an HTTP-only cookie
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/',
    });

    debugLog('Set authentication cookie');
    return response;
  } catch (error) {
    debugLog('Error creating user from purchase:', error);
    return NextResponse.json(
      { message: 'An error occurred while processing your request' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
