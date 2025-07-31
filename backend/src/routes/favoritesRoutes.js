const express = require("express");
const {
  addToFavorites,
  removeFromFavorites,
  getUserFavorites,
} = require("../controllers/favoritesController");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

/**
 * @route   POST /api/favorites/:propertyId
 * @desc    Add property to user's favorites
 * @access  Private (requires authentication)
 * @params  {propertyId} - Property ID to add to favorites
 */
router.post("/:propertyId", authenticate, addToFavorites);

/**
 * @route   DELETE /api/favorites/:propertyId
 * @desc    Remove property from user's favorites
 * @access  Private (requires authentication)
 * @params  {propertyId} - Property ID to remove from favorites
 */
router.delete("/:propertyId", authenticate, removeFromFavorites);

/**
 * @route   GET /api/favorites
 * @desc    Get user's favorite properties
 * @access  Private (requires authentication)
 */
router.get("/", authenticate, getUserFavorites);

module.exports = router;
