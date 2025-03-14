import sgMail from '@sendgrid/mail';
import logger from './logger';

if (!process.env.SENDGRID_API_KEY) {
  throw new Error('SENDGRID_API_KEY environment variable must be set');
}

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Define interface for SendGrid error
interface SendGridError extends Error {
  response?: {
    body?: any;
  };
}

export async function sendOtpEmail(email: string, otp: string) {
  const msg = {
    to: email,
    from: 'vince@vinceallen.com', // Verified Single Sender address
    subject: 'Your One-Time Password',
    html: `
      <h1>Your One-Time Password</h1>
      <p>Use this code to login: <strong>${otp}</strong></p>
      <p>This code will expire in 30 minutes.</p>
    `,
  };

  try {
    logger.info('Sending one-time password email', { recipient: email });
    await sgMail.send(msg);
    logger.info('One-time password email sent successfully', { recipient: email });
  } catch (error) {
    const sgError = error as SendGridError;
    logger.error('Error sending one-time password email', {
      recipient: email,
      error: sgError.message,
      response: sgError.response?.body || {}
    });
    throw new Error('Failed to send OTP email');
  }
}

export async function sendMagicLinkEmail(email: string, token: string) {
  // Base URL (use environment variable in production)
  const baseUrl = process.env.APP_URL || 'http://localhost:3000';
  const magicLinkUrl = `${baseUrl}/auth/magic-link?token=${token}&email=${encodeURIComponent(email)}`;
  
  const msg = {
    to: email,
    from: 'vince@vinceallen.com', // Verified Single Sender address
    subject: 'Your Magic Link for Sign In',
    html: `
      <h1>Magic Link Sign In</h1>
      <p>Click the link below to sign in:</p>
      <a href="${magicLinkUrl}" style="display: inline-block; padding: 10px 20px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px;">Sign In</a>
      <p>Or copy and paste this URL into your browser:</p>
      <p>${magicLinkUrl}</p>
      <p>This link will expire in 15 minutes and can only be used once.</p>
    `,
  };

  try {
    logger.info('Sending magic link email', { recipient: email });
    await sgMail.send(msg);
    logger.info('Magic link email sent successfully', { recipient: email });
  } catch (error) {
    const sgError = error as SendGridError;
    logger.error('Error sending magic link email', {
      recipient: email,
      error: sgError.message,
      response: sgError.response?.body || {}
    });
    throw new Error('Failed to send magic link email');
  }
} 