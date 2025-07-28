const express = require("express");
const {
  register,
  login,
  getCurrentUser,
  updateCurrentUser, // Add this import
  forgotPassword,
  resetPassword,
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

module.exports = router;
