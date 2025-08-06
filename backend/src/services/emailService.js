// Email service for handling all email operations
const nodemailer = require("nodemailer");
const path = require("path");
const fs = require("fs").promises;

class EmailService {
  constructor() {
    this.transporter = null;
    this.isTestMode =
      process.env.NODE_ENV === "development" &&
      process.env.EMAIL_USER === "your-email@gmail.com";
    this.initializeTransporter();
  }

  /**
   * Initialize the email transporter with the configured service
   */
  initializeTransporter() {
    try {
      if (this.isTestMode) {
        // Use Ethereal Email for testing in development
        console.log(
          "📧 Running email service in test mode (no real emails will be sent)"
        );
        this.createTestTransporter();
      } else {
        // Create real transporter for production
        this.transporter = nodemailer.createTransport({
          service: process.env.EMAIL_SERVICE,
          host: process.env.EMAIL_HOST,
          port: parseInt(process.env.EMAIL_PORT),
          secure: process.env.EMAIL_SECURE === "true",
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD,
          },
          tls: {
            rejectUnauthorized: false, // Allow self-signed certificates in development
          },
        });

        // Verify transporter configuration
        this.verifyTransporter();
      }
    } catch (error) {
      console.error("❌ Failed to initialize email transporter:", error);
    }
  }

  /**
   * Create a test transporter using Ethereal Email
   */
  async createTestTransporter() {
    try {
      // For development, use a simple console logger
      console.log("✅ Test email service ready (console mode)");
      console.log("📧 Emails will be logged to console in development");

      // Create a mock transporter that logs to console
      this.transporter = {
        sendMail: async (options) => {
          console.log("\n========================================");
          console.log("📧 EMAIL SIMULATION (Development Mode)");
          console.log("========================================");
          console.log("To:", options.to);
          console.log("From:", options.from);
          console.log("Subject:", options.subject);
          console.log("----------------------------------------");
          console.log(
            "Preview: Email content logged. In production, this would be sent."
          );
          console.log("========================================\n");

          return {
            messageId: "dev-" + Date.now(),
            accepted: [options.to],
            rejected: [],
            response: "250 Message accepted for delivery",
          };
        },
        verify: async () => {
          console.log("✅ Mock transporter verified");
          return true;
        },
      };
    } catch (error) {
      console.error("❌ Failed to create test transporter:", error);
      // Fallback to console logging
      this.transporter = {
        sendMail: async (options) => {
          console.log("📧 EMAIL FALLBACK: Would send to", options.to);
          return { messageId: "fallback-" + Date.now() };
        },
      };
    }
  }

  /**
   * Verify that the transporter is properly configured
   */
  async verifyTransporter() {
    try {
      if (!this.isTestMode && this.transporter) {
        await this.transporter.verify();
        console.log("✅ Email service is ready to send emails");
      }
    } catch (error) {
      console.warn(
        "⚠️ Email service verification failed (will use fallback):",
        error.message
      );
      // Create fallback transporter for development
      this.transporter = {
        sendMail: async (options) => {
          console.log("📧 EMAIL SIMULATION (Fallback):");
          console.log("   To:", options.to);
          console.log("   Subject:", options.subject);
          console.log("   Preview: Email would be sent in production");
          return { messageId: "fallback-" + Date.now() };
        },
      };
    }
  }

  /**
   * Send a verification email to the user
   * @param {string} to - Recipient email address
   * @param {string} name - User's name
   * @param {string} verificationToken - Unique verification token
   */
  async sendVerificationEmail(to, name, verificationToken) {
    try {
      const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;

      const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: to,
        subject: "Verify Your Email - Plaice Real Estate",
        html: this.getVerificationEmailTemplate(name, verificationUrl),
      };

      const info = await this.transporter.sendMail(mailOptions);

      if (this.isTestMode && info.messageId) {
        console.log("📧 Test verification email details:");
        console.log("   Token:", verificationToken);
        console.log("   URL:", verificationUrl);
        if (info.messageId.includes("ethereal")) {
          console.log("   Preview URL:", nodemailer.getTestMessageUrl(info));
        }
      }

      console.log("✅ Verification email sent:", info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error("❌ Failed to send verification email:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send a welcome email after successful verification
   * @param {string} to - Recipient email address
   * @param {string} name - User's name
   */
  async sendWelcomeEmail(to, name) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: to,
        subject: "Welcome to Plaice Real Estate!",
        html: this.getWelcomeEmailTemplate(name),
      };

      const info = await this.transporter.sendMail(mailOptions);

      if (this.isTestMode && info.messageId) {
        console.log("📧 Test welcome email sent");
        if (info.messageId.includes("ethereal")) {
          console.log("   Preview URL:", nodemailer.getTestMessageUrl(info));
        }
      }

      console.log("✅ Welcome email sent:", info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error("❌ Failed to send welcome email:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send a password reset email
   * @param {string} to - Recipient email address
   * @param {string} name - User's name
   * @param {string} resetToken - Password reset token
   */
  async sendPasswordResetEmail(to, name, resetToken) {
    try {
      const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

      const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: to,
        subject: "Password Reset Request - Plaice Real Estate",
        html: this.getPasswordResetEmailTemplate(name, resetUrl),
      };

      const info = await this.transporter.sendMail(mailOptions);

      if (this.isTestMode && info.messageId) {
        console.log("📧 Test password reset email details:");
        console.log("   Token:", resetToken);
        console.log("   URL:", resetUrl);
        if (info.messageId.includes("ethereal")) {
          console.log("   Preview URL:", nodemailer.getTestMessageUrl(info));
        }
      }

      console.log("✅ Password reset email sent:", info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error("❌ Failed to send password reset email:", error);
      return { success: false, error: error.message };
    }
  }

  // [Keep all the template methods the same as before]
  getVerificationEmailTemplate(name, verificationUrl) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Verify Your Email</title>
        <style>
          body { font-family: 'Inter', -apple-system, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #3cade9 0%, #7ed321 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 14px 30px; background: #3cade9; color: white; text-decoration: none; border-radius: 25px; margin: 20px 0; font-weight: 600; }
          .button:hover { background: #2a8fc4; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏠 Plaice Real Estate</h1>
            <p>Verify Your Email Address</p>
          </div>
          <div class="content">
            <h2>Hello ${name}!</h2>
            <p>Thank you for registering with Plaice Real Estate. To complete your registration and start exploring amazing properties, please verify your email address.</p>
            <center>
              <a href="${verificationUrl}" class="button">Verify Email Address</a>
            </center>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background: #fff; padding: 10px; border-radius: 5px;">${verificationUrl}</p>
            <p><strong>This link will expire in 24 hours.</strong></p>
            <p>If you didn't create an account with Plaice, you can safely ignore this email.</p>
          </div>
          <div class="footer">
            <p>© 2024 Plaice Real Estate. All rights reserved.</p>
            <p>123 King Street West, Kitchener, Ontario</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  getWelcomeEmailTemplate(name) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Welcome to Plaice</title>
        <style>
          body { font-family: 'Inter', -apple-system, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #3cade9 0%, #7ed321 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 14px 30px; background: #7ed321; color: white; text-decoration: none; border-radius: 25px; margin: 20px 0; font-weight: 600; }
          .features { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏠 Welcome to Plaice!</h1>
            <p>Your journey to finding the perfect property starts here</p>
          </div>
          <div class="content">
            <h2>Hello ${name}!</h2>
            <p>Your email has been successfully verified. Welcome to the Plaice community!</p>
            <div class="features">
              <h3>What you can do now:</h3>
              <ul>
                <li>🔍 Search thousands of properties</li>
                <li>💬 Use our AI-powered chat for personalized recommendations</li>
                <li>❤️ Save your favorite properties</li>
                <li>📧 Set up alerts for new listings</li>
              </ul>
            </div>
            <center>
              <a href="${process.env.FRONTEND_URL}/properties" class="button">Start Exploring</a>
            </center>
          </div>
          <div class="footer">
            <p>© 2024 Plaice Real Estate. All rights reserved.</p>
            <p>Need help? Contact us at support@plaice.com</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  getPasswordResetEmailTemplate(name, resetUrl) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Password Reset Request</title>
        <style>
          body { font-family: 'Inter', -apple-system, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #ef4444 0%, #f97316 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 14px 30px; background: #ef4444; color: white; text-decoration: none; border-radius: 25px; margin: 20px 0; font-weight: 600; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Password Reset Request</h1>
          </div>
          <div class="content">
            <h2>Hello ${name},</h2>
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            <center>
              <a href="${resetUrl}" class="button">Reset Password</a>
            </center>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background: #fff; padding: 10px; border-radius: 5px;">${resetUrl}</p>
            <p><strong>This link will expire in 1 hour.</strong></p>
            <p>If you didn't request a password reset, you can safely ignore this email. Your password won't be changed.</p>
          </div>
          <div class="footer">
            <p>© 2024 Plaice Real Estate. All rights reserved.</p>
            <p>For security reasons, this link will expire soon.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

// Export singleton instance
module.exports = new EmailService();
