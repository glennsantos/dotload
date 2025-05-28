import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

// Create an SES client
const sesClient = new SESClient({
  region: process.env.AWS_REGION || 'ap-southeast-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
  }
});

// Email sender address
const fromEmail = process.env.EMAIL_FROM || 'alaCart <noreply@alacart.store>';

// Send verification email
export async function sendVerificationEmail(
  to: string,
  token: string,
  name?: string | null
) {
  const baseUrl = `http://${process.env.DOMAIN}`;
  const verificationUrl = `${baseUrl}/verify-email?token=${token}`;

  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Welcome to alaCart${name ? `, ${name}` : ''}!</h2>
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
  `;

  const textBody = `
    Welcome to alaCart${name ? `, ${name}` : ''}!
    
    Thank you for registering. Please verify your email address to activate your account.
    
    Verify your email by clicking this link: ${verificationUrl}
    
    If you did not create an account, no further action is required.
  `;

  const params = {
    Source: fromEmail,
    Destination: { ToAddresses: [to] },
    Message: {
      Subject: { Data: 'Verify your alaCart account' },
      Body: {
        Html: { Data: htmlBody },
        Text: { Data: textBody }
      }
    }
  };

  try {

    
    // Attempt to send the actual email
    return await sesClient.send(new SendEmailCommand(params));
  } catch (error) {
    console.error('Error sending verification email:', error);
    
    throw error;
  }
}

// Send password reset email
export async function sendPasswordResetEmail(
  to: string,
  token: string,
  name?: string | null
) {
  const baseUrl = `http://${process.env.DOMAIN}`;
  const resetUrl = `${baseUrl}/reset-password?token=${token}`;

  const htmlBody = `
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
  `;

  const textBody = `
    Reset Your Password
    
    Hello${name ? ` ${name}` : ''},
    
    We received a request to reset your password. Click the link below to create a new password:
    
    ${resetUrl}
    
    If you did not request a password reset, please ignore this email.
  `;

  const params = {
    Source: fromEmail,
    Destination: { ToAddresses: [to] },
    Message: {
      Subject: { Data: 'Reset your alaCart password' },
      Body: {
        Html: { Data: htmlBody },
        Text: { Data: textBody }
      }
    }
  };

  try {
    
    // Attempt to send the actual email
    return await sesClient.send(new SendEmailCommand(params));
  } catch (error) {
    console.error('Error sending password reset email:', error);
    
    throw error;
  }
}

// Send purchase confirmation email with link to buyer dashboard
export async function sendPurchaseConfirmationEmail(
  to: string,
  productName: string,
  accessCode: string,
  productSlug: string,
  amount: number,
  currency: string,
  status: string = 'completed',
  name?: string | null
) {
  const baseUrl = `http://${process.env.DOMAIN}`;
  const buyerDashboardUrl = `${baseUrl}/buyer-dashboard?code=${accessCode}`;
  const productUrl = `${baseUrl}/p/${productSlug}`;

  let subject = '';
  let htmlBody = '';
  let textBody = '';

  // Different email content based on purchase status
  if (status === 'pending') {
    subject = `Your alaCart Purchase: ${productName} (Payment Pending)`;
    
    htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Thank You for Your Purchase!</h2>
        <p>Hello${name ? ` ${name}` : ''},</p>
        <p>Thank you for purchasing <strong>${productName}</strong>. Your payment of <strong>${currency} ${amount.toFixed(2)}</strong> is currently being processed.</p>
        
        <div style="margin: 30px 0; padding: 15px; background-color: #fff7e6; border-left: 4px solid #ffc107; border-radius: 4px;">
          <p style="margin: 0;"><strong>Payment Status: Pending</strong></p>
          <p style="margin-top: 10px;">We'll send you another email with access to your purchase once the payment is confirmed.</p>
        </div>
        
        <p style="margin-top: 30px; color: #666; font-size: 14px;">If you have any questions, please contact our support team.</p>
      </div>
    `;

    textBody = `
      Thank You for Your Purchase!
      
      Hello${name ? ` ${name}` : ''},
      
      Thank you for purchasing ${productName}. Your payment of ${currency} ${amount.toFixed(2)} is currently being processed.
      
      Payment Status: Pending
      
      We'll send you another email with access to your purchase once the payment is confirmed.
      
      If you have any questions, please contact our support team.
    `;
  } else {
    // Default completed status
    subject = `Your alaCart Purchase: ${productName}`;
    
    htmlBody = `
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
    `;

    textBody = `
      Thank You for Your Purchase!
      
      Hello${name ? ` ${name}` : ''},
      
      Thank you for purchasing ${productName}. Your payment of ${currency} ${amount.toFixed(2)} has been successfully processed.
      
      Access Your Content: ${buyerDashboardUrl}
      
      Keep this email for your records. The link above provides permanent access to your purchased content.
    `;
  }

  const params = {
    Source: fromEmail,
    Destination: { ToAddresses: [to] },
    Message: {
      Subject: { Data: subject },
      Body: {
        Html: { Data: htmlBody },
        Text: { Data: textBody }
      }
    }
  };

  try {
    
    // Attempt to send the actual email
    return await sesClient.send(new SendEmailCommand(params));
  } catch (error) {
    console.error('Error sending purchase confirmation email:', error);
    
    throw error;
  }
}

// Test the email configuration
export async function testEmailConfig() {
  try {
    // SES doesn't have a direct verify method like nodemailer,
    // so we'll check if we can instantiate the client
    if (!sesClient) {
      throw new Error('SES client not initialized');
    }
    return { success: true };
  } catch (error) {
    console.error('Email configuration error:', error);
    return { success: false, error };
  }
}
