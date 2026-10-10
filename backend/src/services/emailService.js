import nodemailer from 'nodemailer';
import ENV from '../config/env.js';
import logger from '../utils/logger.js';

let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;

  const { USER, PASS, HOST, PORT, SERVICE } = ENV.EMAIL;
  if (!USER || !PASS) {
    return null;
  }

  // Use Gmail service if configured as gmail, else fallback to standard SMTP host/port
  if (SERVICE === 'gmail' || USER.endsWith('@gmail.com')) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: USER,
        pass: PASS,
      },
    });
  } else {
    transporter = nodemailer.createTransport({
      host: HOST,
      port: PORT,
      secure: PORT === 465,
      auth: {
        user: USER,
        pass: PASS,
      },
    });
  }

  return transporter;
};

/**
 * Sends a password reset email to the specified recipient.
 * @param {Object} options
 * @param {string} options.to - Recipient email address
 * @param {string} options.username - Recipient username
 * @param {string} options.resetLink - Full URL to reset password
 */
export const sendPasswordResetEmail = async ({ to, username, resetLink }) => {
  try {
    const mailClient = getTransporter();

    if (!mailClient) {
      logger.warn('[EmailService] SMTP credentials (EMAIL_USER/EMAIL_PASS) are not configured. Email dispatch skipped.');
      return { delivered: false, reason: 'unconfigured' };
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
          .container { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
          .header { background: #4f46e5; padding: 24px 32px; text-align: center; color: #ffffff; }
          .header h1 { margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.5px; }
          .header p { margin: 4px 0 0; font-size: 12px; opacity: 0.9; }
          .content { padding: 32px; }
          .greeting { font-size: 16px; font-weight: 600; color: #0f172a; margin-bottom: 12px; }
          .text { font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 24px; }
          .button-wrap { text-align: center; margin: 32px 0; }
          .btn { background-color: #4f46e5; color: #ffffff !important; text-decoration: none; padding: 12px 28px; border-radius: 10px; font-weight: 600; font-size: 14px; display: inline-block; }
          .btn:hover { background-color: #4338ca; }
          .security-note { font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 16px; margin-top: 24px; line-height: 1.5; }
          .url-box { word-break: break-all; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; font-size: 11px; color: #64748b; font-family: monospace; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>NexSchool ERP</h1>
            <p>Academic & Administrative Operations</p>
          </div>
          <div class="content">
            <div class="greeting">Hello, ${username || 'User'}</div>
            <p class="text">
              We received a request to reset the password for your NexSchool ERP account. Click the secure button below to choose a new password:
            </p>
            <div class="button-wrap">
              <a href="${resetLink}" class="btn" target="_blank">Reset Password</a>
            </div>
            <p class="text" style="font-size: 12px;">
              If the button above does not work, copy and paste this link into your browser:
            </p>
            <div class="url-box">${resetLink}</div>
            <div class="security-note">
              This reset link is valid for <strong>30 minutes</strong>. If you did not make this request, you can safely ignore this email; your account remains secure.
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const info = await mailClient.sendMail({
      from: ENV.EMAIL.FROM,
      to,
      subject: 'NexSchool ERP - Password Reset Request',
      text: `Hello ${username},\n\nClick the link below to reset your NexSchool ERP password (valid for 30 minutes):\n${resetLink}\n\nIf you did not request this, please ignore this email.`,
      html: htmlContent,
    });

    logger.info(`[EmailService] Password reset email sent successfully to ${to} (MessageId: ${info.messageId})`);
    return { delivered: true, messageId: info.messageId };
  } catch (error) {
    logger.error('[EmailService] Failed to send password reset email:', error.message);
    return { delivered: false, error: error.message };
  }
};

export default {
  sendPasswordResetEmail,
};
