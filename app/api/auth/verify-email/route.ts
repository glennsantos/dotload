import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic'; // Prevent static optimization

type ErrorResponse = {
  error: string;
  details?: string;
  code?: string;
};

export async function GET(req: NextRequest) {
  let token: string | null = null;
  
  try {
    // Get token from URL
    const url = new URL(req.url);
    token = url.searchParams.get('token');

    if (!token) {
      console.error('No token provided in URL');
      return NextResponse.json<ErrorResponse>(
        { 
          error: 'Verification token is required',
          code: 'MISSING_TOKEN'
        }, 
        { status: 400 }
      );
    }

    // Find user with the verification token
    const user = await prisma.user.findFirst({
      where: { 
        verificationToken: token
      },
      select: {
        id: true,
        email: true,
        emailVerified: true,
        verificationToken: true,
        verificationTokenExpiry: true
      }
    });

    if (!user) {
      console.error('No user found with provided token');
      return NextResponse.json<ErrorResponse>(
        { 
          error: 'Invalid verification token',
          code: 'INVALID_TOKEN'
        }, 
        { status: 400 }
      );
    }

    // Check if token is expired
    const now = new Date();
    if (user.verificationTokenExpiry && user.verificationTokenExpiry < now) {
      console.error('Token expired for user:', user.id);
      return NextResponse.json<ErrorResponse>(
        { 
          error: 'Verification token has expired',
          code: 'TOKEN_EXPIRED'
        }, 
        { status: 400 }
      );
    }

    try {
      // Update user to mark email as verified
      await prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerified: true,
          verificationToken: null,
          verificationTokenExpiry: null,
        },
      });
      
      console.log('Successfully verified email for user:', user.id);
      
      // Return success response
      return NextResponse.json({
        success: true, 
        message: 'Email verified successfully',
        userId: user.id
      }, { status: 200 });
    } catch (dbError) {
      console.error('Database update error:', {
        error: dbError,
        userId: user.id,
        token,
        timestamp: new Date().toISOString()
      });
      
      return NextResponse.json({ 
        error: 'Failed to update verification status',
        details: dbError instanceof Error ? dbError.message : 'Database error'
      }, { status: 500 });
    }
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
