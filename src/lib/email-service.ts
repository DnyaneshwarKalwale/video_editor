import nodemailer from 'nodemailer';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // Create transporter using environment variables
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'email-smtp.us-east-1.amazonaws.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      // AWS SES specific settings
      tls: {
        rejectUnauthorized: false
      }
    });
  }

  /**
   * Send OTP verification email
   */
  async sendOTPEmail(email: string, otp: string, userName: string): Promise<boolean> {
    try {
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">Scalez Video Editor</h1>
          </div>
          
          <div style="padding: 30px; background: #f9f9f9;">
            <h2 style="color: #333; margin-bottom: 20px;">Email Verification Required</h2>
            
            <p style="color: #666; line-height: 1.6;">
              Hi ${userName},
            </p>
            
            <p style="color: #666; line-height: 1.6;">
              To complete your registration and access Scalez Video Editor, please verify your email address using the OTP below:
            </p>
            
            <div style="background: white; border: 2px solid #667eea; border-radius: 10px; padding: 20px; text-align: center; margin: 30px 0;">
              <h1 style="color: #667eea; font-size: 32px; letter-spacing: 5px; margin: 0; font-family: 'Courier New', monospace;">
                ${otp}
              </h1>
            </div>
            
            <p style="color: #666; line-height: 1.6;">
              This OTP will expire in 10 minutes. If you didn't request this verification, please ignore this email.
            </p>
            
            <div style="text-align: center; margin-top: 30px;">
              <p style="color: #999; font-size: 12px;">
                © 2024 Scalez Video Editor. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      `;

      await this.transporter.sendMail({
        from: process.env.SMTP_FROM || 'Karan@scalezmedia.com',
        to: email,
        subject: 'Verify Your Email - Scalez Video Editor',
        html: html,
      });

      return true;
    } catch (error) {
      console.error('Error sending OTP email:', error);
      return false;
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email: string, resetToken: string, userName: string): Promise<boolean> {
    try {
      const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${resetToken}`;
      
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">Scalez Video Editor</h1>
          </div>
          
          <div style="padding: 30px; background: #f9f9f9;">
            <h2 style="color: #333; margin-bottom: 20px;">Password Reset Request</h2>
            
            <p style="color: #666; line-height: 1.6;">
              Hi ${userName},
            </p>
            
            <p style="color: #666; line-height: 1.6;">
              You requested a password reset for your Scalez Video Editor account. Click the button below to reset your password:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Reset Password
              </a>
            </div>
            
            <p style="color: #666; line-height: 1.6;">
              If the button doesn't work, copy and paste this link into your browser:
            </p>
            
            <p style="color: #667eea; word-break: break-all; font-size: 12px;">
              ${resetUrl}
            </p>
            
            <p style="color: #666; line-height: 1.6;">
              This link will expire in 1 hour. If you didn't request a password reset, please ignore this email.
            </p>
            
            <div style="text-align: center; margin-top: 30px;">
              <p style="color: #999; font-size: 12px;">
                © 2024 Scalez Video Editor. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      `;

      await this.transporter.sendMail({
        from: process.env.SMTP_FROM || 'Karan@scalezmedia.com',
        to: email,
        subject: 'Password Reset - Scalez Video Editor',
        html: html,
      });

      return true;
    } catch (error) {
      console.error('Error sending password reset email:', error);
      return false;
    }
  }

  /**
   * Test email service connection
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('Email service connection failed:', error);
      return false;
    }
  }

  /**
   * Test AWS SES connection specifically
   */
  async testAWSSESConnection(): Promise<{ success: boolean; message: string }> {
    try {
      await this.transporter.verify();
      return {
        success: true,
        message: 'AWS SES connection successful'
      };
    } catch (error) {
      console.error('AWS SES connection failed:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// Export singleton instance
export const emailService = new EmailService();
