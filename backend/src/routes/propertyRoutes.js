const express = require("express");
const {
  getProperties,
  getPropertyById,
  createProperty,
  updateProperty,
  deleteProperty,
  getMyProperties,
  togglePropertyStatus,
  getAgentStats,
} = require("../controllers/propertyController");
const { authenticate, authorize } = require("../middleware/auth");
const { handleUpload } = require("../middleware/upload");

const router = express.Router();

/**
 * @route   GET /api/properties
 * @desc    Get all properties with filtering and pagination
 * @access  Public
 * @query   ?page=1&limit=10&city=Toronto&type=Condo&minPrice=300000&maxPrice=800000&bedrooms=2&bathrooms=1&listingType=sale&search=downtown
 */
router.get("/", getProperties);

/**
 * @route   GET /api/properties/agent-stats
 * @desc    Get comprehensive statistics for authenticated agent
 * @access  Private (agents only)
 */
router.get(
  "/agent-stats",
  authenticate,
  authorize(["agent", "admin"]),
  getAgentStats
);

/**
 * @route   GET /api/properties/my-properties
 * @desc    Get properties for authenticated agent
 * @access  Private (agents only)
 * @query   ?page=1&limit=12&status=active&search=downtown&type=Condo&sortBy=createdAt&sortOrder=desc
 */
router.get(
  "/my-properties",
  authenticate,
  authorize(["agent", "admin"]),
  getMyProperties
);

/**
 * @route   GET /api/properties/:id
 * @desc    Get single property by ID
 * @access  Public
 */
router.get("/:id", getPropertyById);

/**
 * @route   POST /api/properties
 * @desc    Create a new property listing with optional image uploads
 * @access  Private (agents and admins only)
 * @body    Form data with images field for file uploads (max 10 files, 5MB each)
 */
router.post(
  "/",
  authenticate,
  authorize(
    ["agent", "admin"],
    "Only agents can create property listings. Please update your account to 'Property Lister' to list properties."
  ),
  handleUpload,
  createProperty
);

/**
 * @route   PUT /api/properties/:id
 * @desc    Update an existing property listing with optional image uploads
 * @access  Private (only owner agent or admin)
 * @body    Form data with images field for file uploads (max 10 files, 5MB each)
 */
router.put(
  "/:id",
  authenticate,
  authorize(
    ["agent", "admin"],
    "Only agents can update property listings. Please update your account to 'Property Lister' to edit properties."
  ),
  handleUpload,
  updateProperty
);

/**
 * @route   DELETE /api/properties/:id
 * @desc    Delete an existing property listing
 * @access  Private (only owner agent or admin)
 */
router.delete(
  "/:id",
  authenticate,
  authorize(
    ["agent", "admin"],
    "Only agents can delete property listings. Please update your account to 'Property Lister' to delete properties."
  ),
  deleteProperty
);

/**
 * @route   PATCH /api/properties/:id/toggle-status
 * @desc    Toggle property status between active and inactive
 * @access  Private (only owner agent or admin)
 */
router.patch(
  "/:id/toggle-status",
  authenticate,
  authorize(["agent", "admin"]),
  togglePropertyStatus
);

module.exports = router;
