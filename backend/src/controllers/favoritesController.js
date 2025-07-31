const User = require("../models/User");
const Property = require("../models/Property");
const {
  sendSuccess,
  sendError,
  sendNotFound,
} = require("../utils/apiResponse");
const { logInfo, logError, logWarning } = require("../utils/logger");

/**
 * Add property to user's favorites
 * @route POST /api/favorites/:propertyId
 * @access Private
 */
const addToFavorites = async (req, res, next) => {
  try {
    const { propertyId } = req.params;
    const userId = req.user.id;

    logInfo("Adding property to favorites", {
      userId,
      propertyId,
      userRole: req.user.role,
    });

    // Validate that property exists
    const property = await Property.findById(propertyId);
    if (!property) {
      logWarning("User attempted to favorite non-existent property", {
        userId,
        propertyId,
      });
      return sendNotFound(res, "Property");
    }

    // Check if property is available
    if (property.status !== "available") {
      return sendError(
        res,
        "Cannot add unavailable properties to favorites",
        400
      );
    }

    // Find user and check if property is already in favorites
    const user = await User.findById(userId);
    if (!user) {
      return sendNotFound(res, "User");
    }

    // Check if already in favorites
    const isAlreadyFavorite = user.favorites.some(
      (favId) => favId.toString() === propertyId
    );

    if (isAlreadyFavorite) {
      return sendError(res, "Property is already in your favorites", 400);
    }

    // Add to favorites
    user.favorites.push(propertyId);
    await user.save();

    logInfo("Property added to favorites successfully", {
      userId,
      propertyId,
      propertyTitle: property.title,
      totalFavorites: user.favorites.length,
    });

    sendSuccess(
      res,
      {
        message: "Property added to favorites",
        propertyId,
        propertyTitle: property.title,
        totalFavorites: user.favorites.length,
      },
      "Property added to favorites successfully",
      201
    );
  } catch (error) {
    if (error.name === "CastError") {
      return sendError(res, "Invalid property ID format", 400);
    }

    logError("Error adding property to favorites", {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id,
      propertyId: req.params.propertyId,
    });

    next(error);
  }
};

/**
 * Remove property from user's favorites
 * @route DELETE /api/favorites/:propertyId
 * @access Private
 */
const removeFromFavorites = async (req, res, next) => {
  try {
    const { propertyId } = req.params;
    const userId = req.user.id;

    logInfo("Removing property from favorites", {
      userId,
      propertyId,
      userRole: req.user.role,
    });

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return sendNotFound(res, "User");
    }

    // Check if property is in favorites
    const favoriteIndex = user.favorites.findIndex(
      (favId) => favId.toString() === propertyId
    );

    if (favoriteIndex === -1) {
      return sendError(res, "Property is not in your favorites", 400);
    }

    // Remove from favorites
    user.favorites.splice(favoriteIndex, 1);
    await user.save();

    logInfo("Property removed from favorites successfully", {
      userId,
      propertyId,
      totalFavorites: user.favorites.length,
    });

    sendSuccess(
      res,
      {
        message: "Property removed from favorites",
        propertyId,
        totalFavorites: user.favorites.length,
      },
      "Property removed from favorites successfully",
      200
    );
  } catch (error) {
    if (error.name === "CastError") {
      return sendError(res, "Invalid property ID format", 400);
    }

    logError("Error removing property from favorites", {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id,
      propertyId: req.params.propertyId,
    });

    next(error);
  }
};

/**
 * Get user's favorite properties
 * @route GET /api/favorites
 * @access Private
 */
const getUserFavorites = async (req, res, next) => {
  try {
    const userId = req.user.id;

    logInfo("Getting user favorites", {
      userId,
      userRole: req.user.role,
    });

    // Get user with populated favorites
    const user = await User.findById(userId).populate({
      path: "favorites",
      match: { status: "available" }, // Only show available properties
      select:
        "title description price location type bedrooms bathrooms area images status listingType createdAt",
    });

    if (!user) {
      return sendNotFound(res, "User");
    }

    // Filter out any null values (properties that might have been deleted)
    const validFavorites = user.favorites.filter(
      (property) => property !== null
    );

    logInfo("User favorites retrieved successfully", {
      userId,
      totalFavorites: validFavorites.length,
    });

    sendSuccess(
      res,
      {
        favorites: validFavorites,
        totalFavorites: validFavorites.length,
      },
      `Found ${validFavorites.length} favorite properties`,
      200
    );
  } catch (error) {
    logError("Error getting user favorites", {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id,
    });

    next(error);
  }
};

module.exports = {
  addToFavorites,
  removeFromFavorites,
  getUserFavorites,
};
