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

/**
 * Create new property listing
 * @route POST /api/properties
 * @access Private (agents and admins only)
 */
const createProperty = async (req, res, next) => {
  try {
    // Check if user is agent or admin
    if (req.user.role !== "agent" && req.user.role !== "admin") {
      logWarning("Non-agent user attempted to create property", {
        userId: req.user.id,
        userRole: req.user.role,
        email: req.user.email,
      });
      return sendError(
        res,
        "Only agents can create property listings. Please update your account to 'Property Lister' to list properties.",
        403
      );
    }

    const {
      title,
      description,
      price,
      location,
      type,
      bedrooms,
      bathrooms,
      area,
      features,
      images,
      listingType,
    } = req.body;

    // Validate required fields
    if (!title || !description || !price || !location || !type || !area) {
      return sendError(
        res,
        "Title, description, price, location, type and area are required",
        400
      );
    }

    // Validate location object
    if (!location.address || !location.city || !location.province) {
      return sendError(
        res,
        "Location must include address, city and province",
        400
      );
    }

    // Create property data
    const propertyData = {
      title: title.trim(),
      description: description.trim(),
      price: Number(price),
      location,
      type,
      bedrooms: Number(bedrooms) || 0,
      bathrooms: Number(bathrooms) || 0,
      area: Number(area),
      features: features || [],
      images: images || [],
      listingType: listingType || "sale",
      owner: req.user.id, // Automatically assign to authenticated user
      status: "available",
    };

    const newProperty = new Property(propertyData);
    await newProperty.save();

    logInfo("New property created successfully", {
      propertyId: newProperty._id,
      createdBy: req.user.id,
      userRole: req.user.role,
      title: newProperty.title,
      price: newProperty.price,
    });

    sendSuccess(res, newProperty, "Property created successfully", 201);
  } catch (error) {
    if (error.name === "ValidationError") {
      const errorMessages = Object.values(error.errors).map(
        (err) => err.message
      );
      return sendError(res, errorMessages.join(", "), 400);
    }

    logError("Error creating property", {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id,
      requestBody: req.body,
    });

    next(error);
  }
};

module.exports = {
  getProperties,
  getPropertyById,
  createProperty,
};
