const express = require("express");
const User = require("../models/User");
const { getPublicUserProfile } = require("../controllers/userController");

const router = express.Router();

/**
 * @route   GET /api/users/debug/list
 * @desc    Get list of active users (temporary debug endpoint)
 * @access  Public
 */
router.get("/debug/list", async (req, res) => {
  try {
    const users = await User.find({ isActive: true })
      .select("_id firstName lastName email role")
      .limit(5);
    res.json({ users });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/users/:id
 * @desc    Get public user profile by ID
 * @access  Public (no authentication required)
 * @params  {id} - User ID (MongoDB ObjectId)
 */
router.get("/:id", getPublicUserProfile);

module.exports = router;
