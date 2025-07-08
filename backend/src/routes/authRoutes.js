const express = require("express");
const {
  register,
  login,
  getCurrentUser,
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

module.exports = router;
