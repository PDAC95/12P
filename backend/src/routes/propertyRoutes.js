const express = require("express");
const {
  getProperties,
  getPropertyById,
} = require("../controllers/propertyController");

const router = express.Router();

/**
 * @route   GET /api/properties
 * @desc    Get all properties with filtering and pagination
 * @access  Public
 * @query   ?page=1&limit=10&city=Toronto&type=Condo&minPrice=300000&maxPrice=800000&bedrooms=2&bathrooms=1&listingType=sale&search=downtown
 */
router.get("/", getProperties);

/**
 * @route   GET /api/properties/:id
 * @desc    Get single property by ID
 * @access  Public
 */
router.get("/:id", getPropertyById);

module.exports = router;
