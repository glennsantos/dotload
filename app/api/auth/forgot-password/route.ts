import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { sendPasswordResetEmail } from '@/lib/email';

const prisma = new PrismaClient();

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
    const { email } = await req.json();

    // Validate input
    if (!email) {
      return NextResponse.json(
        { message: 'Email is required' },
        { status: 400 }
      );
    }

    debugLog('Processing forgot password request for email:', email);

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // For security reasons, don't reveal if the user exists or not
    if (!user) {
      debugLog('User not found with email:', email);
      // Return success even if user doesn't exist to prevent email enumeration
      return NextResponse.json(
        { message: 'If your email exists in our system, you will receive password reset instructions.' },
        { status: 200 }
      );
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    // Store reset token in database
    await prisma.passwordReset.upsert({
      where: { userId: user.id },
      update: {
        token: resetToken,
        expiresAt: resetTokenExpiry,
      },
      create: {
        id: uuidv4(),
        userId: user.id,
        token: resetToken,
        expiresAt: resetTokenExpiry,
      },
    });

    debugLog('Reset token generated for user:', user.id);

    // In a real application, you would send an email with the reset link
    // For this demo, we'll just log it
    const resetUrl = `http://${process.env.DOMAIN}/reset-password?token=${resetToken}`;
    
    debugLog('Password reset URL (would be sent via email):', resetUrl);
    
    // Send password reset email
    try {
      await sendPasswordResetEmail(email, resetToken, user.name);
      debugLog('Password reset email sent successfully');
    } catch (emailError) {
      debugLog('Failed to send password reset email:', emailError);
      // Log the error but still return success to prevent email enumeration
      console.error('Password reset email sending failed:', emailError);
    }

    return NextResponse.json(
      { message: 'If your email exists in our system, you will receive password reset instructions.' },
      { status: 200 }
    );
  } catch (error) {
    debugLog('Error processing forgot password request:', error);
    return NextResponse.json(
      { message: 'An error occurred while processing your request' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
