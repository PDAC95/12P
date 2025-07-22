const express = require("express");
const {
  getProperties,
  getPropertyById,
  createProperty, // Agregar esta importación
} = require("../controllers/propertyController");
const { authenticate, authorize } = require("../middleware/auth"); // Agregar estas importaciones

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

/**
 * @route   POST /api/properties
 * @desc    Create a new property listing
 * @access  Private (agents and admins only)
 */
router.post(
  "/",
  authenticate,
  authorize(
    ["agent", "admin"],
    "Only agents can create property listings. Please update your account to 'Property Lister' to list properties."
  ),
  createProperty
);

module.exports = router;
