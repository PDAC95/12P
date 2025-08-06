// Token generator utility for email verification and password reset
const crypto = require("crypto");

/**
 * Generate a secure random token
 * @param {number} length - Length of the token (default: 32)
 * @returns {string} - Hex string token
 */
const generateToken = (length = 32) => {
  return crypto.randomBytes(length).toString("hex");
};

/**
 * Generate a verification token with timestamp
 * @returns {object} - Token object with value and expiry
 */
const generateVerificationToken = () => {
  const token = generateToken(32);
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours expiry

  return {
    token,
    expiresAt,
    createdAt: new Date(),
  };
};

/**
 * Generate a password reset token with shorter expiry
 * @returns {object} - Token object with value and expiry
 */
const generatePasswordResetToken = () => {
  const token = generateToken(32);
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour expiry

  return {
    token,
    expiresAt,
    createdAt: new Date(),
  };
};

/**
 * Check if a token has expired
 * @param {Date} expiryDate - Token expiry date
 * @returns {boolean} - True if expired, false otherwise
 */
const isTokenExpired = (expiryDate) => {
  return new Date() > new Date(expiryDate);
};

/**
 * Generate a short numeric OTP code
 * @param {number} length - Length of OTP (default: 6)
 * @returns {string} - Numeric OTP code
 */
const generateOTP = (length = 6) => {
  let otp = "";
  for (let i = 0; i < length; i++) {
    otp += Math.floor(Math.random() * 10);
  }
  return otp;
};

module.exports = {
  generateToken,
  generateVerificationToken,
  generatePasswordResetToken,
  isTokenExpired,
  generateOTP,
};
