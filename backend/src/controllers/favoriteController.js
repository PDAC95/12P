// backend/src/controllers/favoriteController.js

const Favorite = require("../models/Favorite");
const Property = require("../models/Property");
const { sendSuccess, sendError } = require("../utils/apiResponse");
const { logInfo, logError } = require("../utils/logger");

/**
 * Get all favorites for the authenticated user
 * @route GET /api/favorites
 * @access Private
 */
const getUserFavorites = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 12, sortBy = "addedAt" } = req.query;

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Build sort object
    let sortOptions = {};
    if (sortBy === "addedAt") {
      sortOptions = { addedAt: -1 }; // Newest first
    } else if (sortBy === "price") {
      sortOptions = { "property.price": 1 }; // Price low to high
    }

    // Get favorites with populated property data
    const favorites = await Favorite.find({ user: userId })
      .populate({
        path: "property",
        match: { status: "available" }, // Only show available properties
        select:
          "title description price location type bedrooms bathrooms area images status listingType createdAt",
      })
      .sort(sortOptions)
      .limit(limit * 1)
      .skip(skip)
      .exec();

    // Filter out null properties (in case some were deleted or unavailable)
    const validFavorites = favorites.filter((fav) => fav.property !== null);

    // Get total count for pagination
    const totalCount = await Favorite.countDocuments({ user: userId });

    // Format response
    const response = {
      favorites: validFavorites.map((fav) => ({
        id: fav._id,
        propertyId: fav.property._id,
        property: fav.property,
        notes: fav.notes,
        tags: fav.tags,
        addedAt: fav.addedAt,
      })),
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / limit),
        totalItems: totalCount,
        itemsPerPage: parseInt(limit),
        hasNextPage: page * limit < totalCount,
        hasPrevPage: page > 1,
      },
    };

    logInfo("User favorites retrieved", {
      userId,
      count: validFavorites.length,
      page,
    });

    sendSuccess(res, response, "Favorites retrieved successfully");
  } catch (error) {
    logError("Get user favorites error", {
      error: error.message,
      userId: req.user?.id,
    });
    next(error);
  }
};

/**
 * Add a property to favorites
 * @route POST /api/favorites
 * @access Private
 */
const addToFavorites = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { propertyId, notes = "", tags = [] } = req.body;

    // Validate property exists and is available
    const property = await Property.findById(propertyId);
    if (!property) {
      return sendError(res, "Property not found", 404);
    }

    if (property.status !== "available") {
      return sendError(res, "This property is no longer available", 400);
    }

    // Check if already favorited
    const existingFavorite = await Favorite.findOne({
      user: userId,
      property: propertyId,
    });

    if (existingFavorite) {
      return sendError(res, "Property already in favorites", 409);
    }

    // Create new favorite
    const favorite = await Favorite.create({
      user: userId,
      property: propertyId,
      notes,
      tags,
    });

    // Populate property data for response
    await favorite.populate({
      path: "property",
      select: "title price location images type",
    });

    logInfo("Property added to favorites", {
      userId,
      propertyId,
      favoriteId: favorite._id,
    });

    sendSuccess(
      res,
      {
        id: favorite._id,
        property: favorite.property,
        notes: favorite.notes,
        tags: favorite.tags,
        addedAt: favorite.addedAt,
      },
      "Property added to favorites",
      201
    );
  } catch (error) {
    logError("Add to favorites error", {
      error: error.message,
      userId: req.user?.id,
      propertyId: req.body?.propertyId,
    });
    next(error);
  }
};

/**
 * Remove a property from favorites
 * @route DELETE /api/favorites/:propertyId
 * @access Private
 */
const removeFromFavorites = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { propertyId } = req.params;

    // Find and delete the favorite
    const favorite = await Favorite.findOneAndDelete({
      user: userId,
      property: propertyId,
    });

    if (!favorite) {
      return sendError(res, "Property not found in favorites", 404);
    }

    logInfo("Property removed from favorites", {
      userId,
      propertyId,
      favoriteId: favorite._id,
    });

    sendSuccess(res, null, "Property removed from favorites");
  } catch (error) {
    logError("Remove from favorites error", {
      error: error.message,
      userId: req.user?.id,
      propertyId: req.params?.propertyId,
    });
    next(error);
  }
};

/**
 * Check if a property is favorited by the user
 * @route GET /api/favorites/check/:propertyId
 * @access Private
 */
const checkFavorite = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { propertyId } = req.params;

    const isFavorited = await Favorite.isFavorited(userId, propertyId);

    sendSuccess(res, { isFavorited, propertyId }, "Favorite status checked");
  } catch (error) {
    logError("Check favorite error", {
      error: error.message,
      userId: req.user?.id,
      propertyId: req.params?.propertyId,
    });
    next(error);
  }
};

/**
 * Update favorite notes or tags
 * @route PUT /api/favorites/:propertyId
 * @access Private
 */
const updateFavorite = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { propertyId } = req.params;
    const { notes, tags } = req.body;

    const favorite = await Favorite.findOneAndUpdate(
      { user: userId, property: propertyId },
      {
        ...(notes !== undefined && { notes }),
        ...(tags !== undefined && { tags }),
      },
      { new: true, runValidators: true }
    );

    if (!favorite) {
      return sendError(res, "Favorite not found", 404);
    }

    await favorite.populate({
      path: "property",
      select: "title price location images type",
    });

    logInfo("Favorite updated", {
      userId,
      propertyId,
      favoriteId: favorite._id,
    });

    sendSuccess(
      res,
      {
        id: favorite._id,
        property: favorite.property,
        notes: favorite.notes,
        tags: favorite.tags,
        addedAt: favorite.addedAt,
      },
      "Favorite updated successfully"
    );
  } catch (error) {
    logError("Update favorite error", {
      error: error.message,
      userId: req.user?.id,
      propertyId: req.params?.propertyId,
    });
    next(error);
  }
};

module.exports = {
  getUserFavorites,
  addToFavorites,
  removeFromFavorites,
  checkFavorite,
  updateFavorite,
};
