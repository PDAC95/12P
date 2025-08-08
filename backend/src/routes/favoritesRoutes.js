// backend/src/routes/favoriteRoutes.js

const express = require("express");
const {
  getUserFavorites,
  addToFavorites,
  removeFromFavorites,
  checkFavorite,
  updateFavorite,
} = require("../controllers/favoriteController");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

/**
 * All favorite routes require authentication
 * Only clients can manage favorites (not agents or admins in their professional capacity)
 */

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * @route   GET /api/favorites
 * @desc    Get all favorites for the authenticated user
 * @access  Private
 * @query   page, limit, sortBy (addedAt, price)
 */
router.get("/", getUserFavorites);

/**
 * @route   POST /api/favorites
 * @desc    Add a property to favorites
 * @access  Private
 * @body    { propertyId, notes?, tags? }
 */
router.post("/", addToFavorites);

/**
 * @route   GET /api/favorites/check/:propertyId
 * @desc    Check if a property is favorited by the user
 * @access  Private
 */
router.get("/check/:propertyId", checkFavorite);

/**
 * @route   PUT /api/favorites/:propertyId
 * @desc    Update favorite notes or tags
 * @access  Private
 * @body    { notes?, tags? }
 */
router.put("/:propertyId", updateFavorite);

/**
 * @route   DELETE /api/favorites/:propertyId
 * @desc    Remove a property from favorites
 * @access  Private
 */
router.delete("/:propertyId", removeFromFavorites);

module.exports = router;
