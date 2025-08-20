const express = require("express");
const {
  register,
  login,
  getCurrentUser,
  updateCurrentUser,
  changePassword,
  forgotPassword,
  resetPassword,
  sendVerificationEmail,
  verifyEmail,
  googleLogin,
  refreshToken,
  logout,
  logoutAllDevices,
} = require("../controllers/authController");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user (client or agent)
 * @access  Public
 * @body    {firstName, lastName, email, password, phone?, role?, agentInfo?}
 */
router.post("/register", register);

/**
 * @route   POST /api/auth/login
 * @desc    Login user and get JWT token
 * @access  Public
 * @body    {email, password}
 */
router.post("/login", login);

/**
 * @route   POST /api/auth/send-verification
 * @desc    Send or resend email verification
 * @access  Public (can work with or without authentication)
 * @body    {email}
 */
router.post("/send-verification", sendVerificationEmail);

/**
 * @route   POST /api/auth/resend-verification
 * @desc    Alias for send-verification
 * @access  Public
 * @body    {email}
 */
router.post("/resend-verification", sendVerificationEmail);

/**
 * @route   GET /api/auth/verify-email/:token
 * @desc    Verify email with token
 * @access  Public
 * @params  {token}
 */
router.get("/verify-email/:token", verifyEmail);

/**
 * @route POST /api/auth/google
 * @desc Google OAuth login
 * @access Public
 */
router.post("/google", googleLogin);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private (requires authentication)
 */
router.get("/me", authenticate, getCurrentUser);

/**
 * @route   PUT /api/auth/me
 * @desc    Update current user profile
 * @access  Private (requires authentication)
 * @body    {firstName?, lastName?, phone?, preferences?}
 */
router.put("/me", authenticate, updateCurrentUser);

/**
 * @route   PUT /api/auth/change-password
 * @desc    Change user password
 * @access  Private (requires authentication)
 * @body    {currentPassword, newPassword}
 */
router.put("/change-password", authenticate, changePassword);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Send password reset email
 * @access  Public
 * @body    {email}
 */
router.post("/forgot-password", forgotPassword);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password with token
 * @access  Public
 * @body    {token, password}
 */
router.post("/reset-password", resetPassword);

/**
 * @route POST /api/auth/refresh
 * @desc Refresh access token using refresh token
 * @access Public
 */
router.post("/refresh", refreshToken);

/**
 * @route POST /api/auth/logout
 * @desc Logout and invalidate refresh token
 * @access Private
 */
router.post("/logout", authenticate, logout);

/**
 * @route POST /api/auth/logout-all
 * @desc Logout from all devices (invalidate all refresh tokens)
 * @access Private
 */
router.post("/logout-all", authenticate, logoutAllDevices);

module.exports = router;
