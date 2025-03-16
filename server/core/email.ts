import logger from './logger';

// Only import SendGrid in production
let sgMail: any = null;
if (process.env.NODE_ENV === 'production') {
  // Dynamic import for SendGrid only in production
  import('@sendgrid/mail').then(module => {
    sgMail = module.default;
    if (process.env.SENDGRID_API_KEY) {
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      logger.info('SendGrid API initialized for production');
    } else {
      logger.error('SENDGRID_API_KEY is required in production');
    }
  });
} else {
  logger.info('Using mock email implementation for development');
}

// In development, just log the OTP
export async function sendOtpEmail(email: string, otp: string) {
  if (process.env.NODE_ENV === 'development') {
    logger.info('DEVELOPMENT MODE: Email not sent. OTP code:', { otp, recipient: email });
    return;
  }
  
  // In production, use SendGrid
  if (!sgMail) {
    logger.error('SendGrid not initialized');
    return;
  }
  
  const msg = {
    to: email,
    from: 'vince@vinceallen.com',
    subject: 'Your One-Time Password',
    html: `
      <h1>Your One-Time Password</h1>
      <p>Use this code to login: <strong>${otp}</strong></p>
      <p>This code will expire in 30 minutes.</p>
    `,
  };
  
  try {
    await sgMail.send(msg);
    logger.info('OTP email sent successfully', { recipient: email });
  } catch (error: any) {
    logger.error('Failed to send OTP email', { 
      error: error.message,
      response: error.response?.body || {},
      recipient: email 
    });
  }
}

// In development, just log the magic link
export async function sendMagicLinkEmail(email: string, token: string) {
  const baseUrl = process.env.APP_URL || 'http://localhost:3000';
  const magicLinkUrl = `${baseUrl}/auth/magic-link?token=${token}&email=${encodeURIComponent(email)}`;
  
  if (process.env.NODE_ENV === 'development') {
    logger.info('DEVELOPMENT MODE: Email not sent. Magic link:', { magicLinkUrl, recipient: email });
    return;
  }
  
  // In production, use SendGrid
  if (!sgMail) {
    logger.error('SendGrid not initialized');
    return;
  }
  
  const msg = {
    to: email,
    from: 'vince@vinceallen.com',
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
    await sgMail.send(msg);
    logger.info('Magic link email sent successfully', { recipient: email });
  } catch (error: any) {
    logger.error('Failed to send magic link email', { 
      error: error.message,
      response: error.response?.body || {},
      recipient: email 
    });
  }
} 