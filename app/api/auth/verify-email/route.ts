import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  let token: string | null = null;
  try {
    // Get token from URL
    const { searchParams } = new URL(req.url);
    token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Verification token is required' }, { status: 400 });
    }

    // Find user with the verification token
    const user = await prisma.user.findUnique({
      where: { verificationToken: token },
    });

    if (!user) {
      return NextResponse.json({ error: 'Invalid verification token' }, { status: 400 });
    }

    // Check if token is expired
    if (user.verificationTokenExpiry && new Date(user.verificationTokenExpiry) < new Date()) {
      return NextResponse.json({ error: 'Verification token has expired' }, { status: 400 });
    }

    // Update user to mark email as verified
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verificationToken: null,
        verificationTokenExpiry: null,
      },
    });

    // Redirect to login page with success message
    return NextResponse.redirect(new URL('/login?verified=true', req.url));
  } catch (error) {
    const errorContext = {
      error,
      token,
      timestamp: new Date().toISOString(),
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      requestUrl: req.url,
      requestMethod: req.method,
      requestHeaders: Object.fromEntries(req.headers.entries()),
      stage: 'verification_process',
      prismaError: error instanceof Error && error.message.includes('Prisma') ? {
        code: (error as any).code,
        meta: (error as any).meta
      } : null
    };
    console.error('Email verification API error:', errorContext);
    return NextResponse.json({ 
      error: 'Email verification failed', 
      details: error instanceof Error ? error.message : 'An unexpected error occurred' 
    }, { status: 500 });
  }
}

// Allow users to request a new verification email
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal that the user doesn't exist for security
      return NextResponse.json({ message: 'If your email exists, a verification link has been sent' }, { status: 200 });
    }

    // If already verified, no need to send another email
    if (user.emailVerified) {
      return NextResponse.json({ message: 'Email is already verified' }, { status: 200 });
    }

    // Generate a new verification token and update the user
    const crypto = await import('crypto');
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationToken,
        verificationTokenExpiry,
      },
    });

    // Send verification email
    const { sendVerificationEmail } = await import('@/lib/email');
    await sendVerificationEmail(user.email, verificationToken, user.name);

    return NextResponse.json({ 
      message: 'Verification email sent successfully' 
    }, { status: 200 });
  } catch (error) {
    const errorContext = {
      error,
      timestamp: new Date().toISOString(),
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      requestUrl: req.url,
      requestMethod: req.method,
      requestHeaders: Object.fromEntries(req.headers.entries()),
      stage: error instanceof Error && error.message.includes('sendVerificationEmail') ? 'sending_email' : 'token_generation',
      prismaError: error instanceof Error && error.message.includes('Prisma') ? {
        code: (error as any).code,
        meta: (error as any).meta
      } : null
    };
    console.error('Resend verification email error:', errorContext);
    return NextResponse.json({ 
      error: 'Failed to resend verification email', 
      details: error instanceof Error ? error.message : 'An unexpected error occurred' 
    }, { status: 500 });
  }
}
