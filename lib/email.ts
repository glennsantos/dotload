import nodemailer from 'nodemailer';

// Create a transporter using Mailtrap credentials from env
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'sandbox.smtp.mailtrap.io',
  port: parseInt(process.env.SMTP_PORT || '2525'),
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
});

// Email sender address
const fromEmail = process.env.EMAIL_FROM || 'alaCarte <no-reply@alacarte.com>';

// Send verification email
export async function sendVerificationEmail(
  to: string,
  token: string,
  name?: string | null
) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const verificationUrl = `${baseUrl}/verify-email?token=${token}`;

  const mailOptions = {
    from: fromEmail,
    to,
    subject: 'Verify your alaCarte account',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Welcome to alaCarte${name ? `, ${name}` : ''}!</h2>
        <p>Thank you for registering. Please verify your email address to activate your account.</p>
        <div style="margin: 30px 0;">
          <a href="${verificationUrl}" style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Verify Email Address
          </a>
        </div>
        <p>Or copy and paste this link in your browser:</p>
        <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
        <p style="margin-top: 30px; color: #666; font-size: 14px;">If you did not create an account, no further action is required.</p>
      </div>
    `,
    text: `
      Welcome to alaCarte${name ? `, ${name}` : ''}!
      
      Thank you for registering. Please verify your email address to activate your account.
      
      Verify your email by clicking this link: ${verificationUrl}
      
      If you did not create an account, no further action is required.
    `,
  };

  return transporter.sendMail(mailOptions);
}

// Send password reset email
export async function sendPasswordResetEmail(
  to: string,
  token: string,
  name?: string | null
) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const resetUrl = `${baseUrl}/reset-password?token=${token}`;

  const mailOptions = {
    from: fromEmail,
    to,
    subject: 'Reset your alaCarte password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Reset Your Password</h2>
        <p>Hello${name ? ` ${name}` : ''},</p>
        <p>We received a request to reset your password. Click the button below to create a new password:</p>
        <div style="margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p>Or copy and paste this link in your browser:</p>
        <p style="word-break: break-all; color: #666;">${resetUrl}</p>
        <p style="margin-top: 30px; color: #666; font-size: 14px;">If you did not request a password reset, please ignore this email.</p>
      </div>
    `,
    text: `
      Reset Your Password
      
      Hello${name ? ` ${name}` : ''},
      
      We received a request to reset your password. Click the link below to create a new password:
      
      ${resetUrl}
      
      If you did not request a password reset, please ignore this email.
    `,
  };

  return transporter.sendMail(mailOptions);
}

// Send purchase confirmation email with link to buyer dashboard
export async function sendPurchaseConfirmationEmail(
  to: string,
  productName: string,
  accessCode: string,
  productSlug: string,
  amount: number,
  currency: string,
  name?: string | null
) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const buyerDashboardUrl = `${baseUrl}/buyer-dashboard?code=${accessCode}`;

  const mailOptions = {
    from: fromEmail,
    to,
    subject: `Your alaCarte Purchase: ${productName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Thank You for Your Purchase!</h2>
        <p>Hello${name ? ` ${name}` : ''},</p>
        <p>Thank you for purchasing <strong>${productName}</strong>. Your payment of <strong>${currency} ${amount.toFixed(2)}</strong> has been successfully processed.</p>
        
        <div style="margin: 30px 0;">
          <p><strong>Access Your Content</strong></p>
          <a href="${buyerDashboardUrl}" style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Access Your Purchase
          </a>
        </div>
        
        <p>Or copy and paste this link in your browser:</p>
        <p style="word-break: break-all; color: #666;">${buyerDashboardUrl}</p>
        
        <p style="margin-top: 30px; color: #666; font-size: 14px;">Keep this email for your records. The link above provides permanent access to your purchased content.</p>
      </div>
    `,
    text: `
      Thank You for Your Purchase!
      
      Hello${name ? ` ${name}` : ''},
      
      Thank you for purchasing ${productName}. Your payment of ${currency} ${amount.toFixed(2)} has been successfully processed.
      
      Access Your Content: ${buyerDashboardUrl}
      
      Keep this email for your records. The link above provides permanent access to your purchased content.
    `,
  };

  return transporter.sendMail(mailOptions);
}

// Test the email configuration
export async function testEmailConfig() {
  try {
    await transporter.verify();
    return { success: true };
  } catch (error) {
    console.error('Email configuration error:', error);
    return { success: false, error };
  }
}
