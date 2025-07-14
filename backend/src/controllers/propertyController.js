const Property = require("../models/Property");
const {
  sendSuccess,
  sendError,
  sendNotFound,
} = require("../utils/apiResponse");
const { logInfo, logError, logDebug } = require("../utils/logger");
const { createError } = require("../utils/errorMessages");

/**
 * Get all properties with optional filtering and pagination
 * @route GET /api/properties
 * @access Public
 */
const getProperties = async (req, res, next) => {
  try {
    logDebug("Getting properties list", { query: req.query, ip: req.ip });

    // Build query object
    let query = { status: "available" }; // Only show available properties by default

    // Apply filters from query parameters
    const {
      city,
      type,
      minPrice,
      maxPrice,
      bedrooms,
      bathrooms,
      listingType,
      status,
      search,
    } = req.query;

    // City filter
    if (city) {
      query["location.city"] = { $regex: city, $options: "i" };
    }

    // Property type filter
    if (type) {
      query.type = type;
    }

    // Price range filter
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseInt(minPrice);
      if (maxPrice) query.price.$lte = parseInt(maxPrice);
    }

    // Bedrooms filter
    if (bedrooms) {
      query.bedrooms = { $gte: parseInt(bedrooms) };
    }

    // Bathrooms filter
    if (bathrooms) {
      query.bathrooms = { $gte: parseInt(bathrooms) };
    }

    // Listing type filter (sale/rent/coliving)
    if (listingType) {
      query.listingType = listingType;
    }

    // Status filter (admin only - for now allow all)
    if (status) {
      query.status = status;
    }

    // Search in title and description
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { "location.address": { $regex: search, $options: "i" } },
      ];
    }

    // Pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Sorting
    const sortBy = req.query.sortBy || "createdAt";
    const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;
    const sort = { [sortBy]: sortOrder };

    logDebug("Query built", { query, pagination: { page, limit, skip }, sort });

    // Execute query with pagination
    const [properties, total] = await Promise.all([
      Property.find(query).sort(sort).skip(skip).limit(limit).lean(),
      Property.countDocuments(query),
    ]);

    // TEMPORARY DEBUG LOG - Remove after fixing
    console.log("🔍 DEBUG - Query filters:", query);
    console.log(
      "🔍 DEBUG - Properties found:",
      properties.map((p) => ({
        title: p.title,
        listingType: p.listingType,
        type: p.type,
      }))
    );
    // END TEMPORARY DEBUG LOG

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    const paginationData = {
      results: properties,
      pagination: {
        currentPage: page,
        totalPages,
        totalResults: total,
        resultsPerPage: limit,
        hasNextPage,
        hasPrevPage,
        nextPage: hasNextPage ? page + 1 : null,
        prevPage: hasPrevPage ? page - 1 : null,
      },
    };

    logInfo("Properties retrieved successfully", {
      total,
      page,
      limit,
      filtersApplied: Object.keys(req.query).length > 0,
    });

    sendSuccess(res, paginationData, `Found ${total} properties`, 200);
  } catch (error) {
    logError("Error getting properties", {
      error: error.message,
      stack: error.stack,
      query: req.query,
    });

    next(error);
  }
};

/**
 * Get property by ID
 * @route GET /api/properties/:id
 * @access Public
 */
const getPropertyById = async (req, res, next) => {
  try {
    const { id } = req.params;

    logDebug("Getting property by ID", { propertyId: id, ip: req.ip });

    const property = await Property.findById(id).lean();

    if (!property) {
      logInfo("Property not found", { propertyId: id });
      return sendNotFound(res, "Property");
    }

    logInfo("Property retrieved successfully", { propertyId: id });
    sendSuccess(res, property, "Property retrieved successfully");
  } catch (error) {
    if (error.name === "CastError") {
      logInfo("Invalid property ID format", { propertyId: req.params.id });
      return sendNotFound(res, "Property");
    }

    logError("Error getting property by ID", {
      error: error.message,
      stack: error.stack,
      propertyId: req.params.id,
    });

    next(error);
  }
};

module.exports = {
  getProperties,
  getPropertyById,
};
