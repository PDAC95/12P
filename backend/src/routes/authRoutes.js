const express = require("express");
const { register, getCurrentUser } = require("../controllers/authController");

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user (client or agent)
 * @access  Public
 * @body    {firstName, lastName, email, password, phone?, role?, agentInfo?}
 */
router.post("/register", register);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get("/me", getCurrentUser); // Will add auth middleware later

module.exports = router;
