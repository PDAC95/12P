const Property = require("../models/Property");
const {
  sendSuccess,
  sendError,
  sendNotFound,
} = require("../utils/apiResponse");
const { logInfo, logError, logDebug, logWarning } = require("../utils/logger");
const { createError } = require("../utils/errorMessages");
const { deleteUploadedFiles, getFileUrls, getVideoUrl } = require("../middleware/upload");

/**
 * Get all properties with optional filtering and pagination
 * @route GET /api/properties
 * @access Public
 */
const getProperties = async (req, res, next) => {
  try {
    logDebug("Getting properties list", { query: req.query, ip: req.ip });

    // Build query object - exclude soft deleted properties
    let query = { 
      status: "available", // Only show available properties by default
      isDeleted: false // Exclude soft deleted properties
    };

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

    const property = await Property.findOne({ 
      _id: id, 
      isDeleted: false 
    }).lean();

    if (!property) {
      logInfo("Property not found or has been deleted", { propertyId: id });
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

    // Handle uploaded files if present
    let processedImages = images || [];
    let videoUrl = null;
    
    // Check if files were uploaded (new format with separate fields)
    if (req.files) {
      // Handle images
      if (req.files.images && req.files.images.length > 0) {
        processedImages = getFileUrls(req.files.images, req);
        logDebug("Processing uploaded images", { 
          fileCount: req.files.images.length,
          files: req.files.images.map(f => f.filename)
        });
      }
      
      // Handle video
      if (req.files.video && req.files.video.length > 0) {
        videoUrl = getVideoUrl(req.files.video[0]);
        logDebug("Processing uploaded video", { 
          filename: req.files.video[0].filename,
          size: req.files.video[0].size
        });
      }
    } else if (req.files && req.files.length > 0) {
      // Fallback for old format (images only as array)
      processedImages = getFileUrls(req.files, req);
      logDebug("Processing uploaded images (legacy format)", { 
        fileCount: req.files.length,
        files: req.files.map(f => f.filename)
      });
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
      images: processedImages,
      walkthrough_video: videoUrl || req.body.walkthrough_video || null,
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
    // Clean up uploaded files on error
    if (req.files) {
      // Clean up images
      if (req.files.images && req.files.images.length > 0) {
        deleteUploadedFiles(req.files.images);
        logDebug("Cleaned up uploaded images after error", {
          fileCount: req.files.images.length
        });
      }
      // Clean up video
      if (req.files.video && req.files.video.length > 0) {
        deleteUploadedFiles(req.files.video);
        logDebug("Cleaned up uploaded video after error", {
          fileCount: req.files.video.length
        });
      }
    } else if (req.files && req.files.length > 0) {
      // Fallback for old format
      deleteUploadedFiles(req.files);
      logDebug("Cleaned up uploaded files after error (legacy format)", {
        fileCount: req.files.length
      });
    }

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

/**
 * Update property listing
 * @route PUT /api/properties/:id
 * @access Private (only owner agent or admin)
 */
const updateProperty = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if user is agent or admin
    if (req.user.role !== "agent" && req.user.role !== "admin") {
      logWarning("Non-agent user attempted to update property", {
        userId: req.user.id,
        userRole: req.user.role,
        email: req.user.email,
      });
      return sendError(
        res,
        "Only agents can update property listings. Please update your account to 'Property Lister' to edit properties.",
        403
      );
    }

    // Find the property first
    const existingProperty = await Property.findById(id);

    if (!existingProperty) {
      logInfo("Property not found for update", { propertyId: id });
      return sendNotFound(res, "Property");
    }

    // Debug: Log the IDs to compare
    console.log("🔍 DEBUG - req.user:", req.user);
    console.log("🔍 DEBUG - req.user.id:", req.user.id);
    console.log("🔍 DEBUG - existingProperty.owner:", existingProperty.owner);
    console.log(
      "🔍 DEBUG - existingProperty.owner.toString():",
      existingProperty.owner.toString()
    );
    console.log(
      "🔍 DEBUG - Comparison result:",
      existingProperty.owner.toString() !== req.user.id
    );

    // Check if user is the owner of the property (or admin)
    if (
      req.user.role !== "admin" &&
      existingProperty.owner.toString() !== req.user.id.toString()
    ) {
      logWarning("User attempted to update property they don't own", {
        userId: req.user.id,
        propertyId: id,
        propertyOwner: existingProperty.owner,
      });
      return sendError(
        res,
        "You can only update properties that you own.",
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
      status,
    } = req.body;

    // Validate required fields if they are provided
    if (title !== undefined && !title.trim()) {
      return sendError(res, "Title cannot be empty", 400);
    }
    if (description !== undefined && !description.trim()) {
      return sendError(res, "Description cannot be empty", 400);
    }
    if (price !== undefined && (isNaN(price) || price < 0)) {
      return sendError(res, "Price must be a valid positive number", 400);
    }
    if (area !== undefined && (isNaN(area) || area < 0)) {
      return sendError(res, "Area must be a valid positive number", 400);
    }

    // Validate location object if provided
    if (location) {
      if (location.address !== undefined && !location.address.trim()) {
        return sendError(res, "Location address cannot be empty", 400);
      }
      if (location.city !== undefined && !location.city.trim()) {
        return sendError(res, "Location city cannot be empty", 400);
      }
      if (location.province !== undefined && !location.province.trim()) {
        return sendError(res, "Location province cannot be empty", 400);
      }
    }

    // Handle media updates
    let processedImages = images;
    let videoUrl = req.body.walkthrough_video;
    
    // Get existing images to keep and images to delete from request
    const existingImagesToKeep = req.body['existingImages[]'] || req.body.existingImages || [];
    const imagesToDelete = req.body['imagesToDelete[]'] || req.body.imagesToDelete || [];
    const deleteVideo = req.body.deleteVideo === 'true';
    
    // Ensure arrays
    const keepImages = Array.isArray(existingImagesToKeep) ? existingImagesToKeep : [existingImagesToKeep].filter(Boolean);
    const deleteImages = Array.isArray(imagesToDelete) ? imagesToDelete : [imagesToDelete].filter(Boolean);
    
    // Start with existing images to keep
    processedImages = keepImages;
    
    // Check if files were uploaded (new format with separate fields)
    if (req.files) {
      // Handle new images
      if (req.files.images && req.files.images.length > 0) {
        const newImages = getFileUrls(req.files.images, req);
        logDebug("Processing uploaded images for update", { 
          fileCount: req.files.images.length,
          files: req.files.images.map(f => f.filename),
          existingToKeep: keepImages.length,
          toDelete: deleteImages.length
        });
        
        // Append new images to kept existing images
        processedImages = [...processedImages, ...newImages];
      }
      
      // Handle video
      if (req.files.video && req.files.video.length > 0) {
        videoUrl = getVideoUrl(req.files.video[0]);
        logDebug("Processing uploaded video for update", { 
          filename: req.files.video[0].filename,
          size: req.files.video[0].size
        });
        
        // Delete old video file if exists
        if (existingProperty.walkthrough_video) {
          // TODO: Delete old video file from storage
          logDebug("Old video marked for deletion", {
            oldVideo: existingProperty.walkthrough_video
          });
        }
      } else if (deleteVideo) {
        // Delete video if requested
        videoUrl = null;
        if (existingProperty.walkthrough_video) {
          // TODO: Delete video file from storage
          logDebug("Video marked for deletion", {
            video: existingProperty.walkthrough_video
          });
        }
      } else {
        // Keep existing video
        videoUrl = existingProperty.walkthrough_video;
      }
    } else if (req.files && req.files.length > 0) {
      // Fallback for old format (images only as array)
      const newImages = getFileUrls(req.files, req);
      logDebug("Processing uploaded images for update (legacy format)", { 
        fileCount: req.files.length,
        files: req.files.map(f => f.filename)
      });
      
      processedImages = [...processedImages, ...newImages];
    } else {
      // No new files, handle video deletion if requested
      if (deleteVideo) {
        videoUrl = null;
      } else {
        videoUrl = existingProperty.walkthrough_video;
      }
    }
    
    // TODO: Delete image files marked for deletion from storage
    if (deleteImages.length > 0) {
      logDebug("Images marked for deletion", {
        images: deleteImages
      });
    }

    // Build update data object with only provided fields
    const updateData = {};

    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (price !== undefined) updateData.price = Number(price);
    if (location !== undefined)
      updateData.location = { ...existingProperty.location, ...location };
    if (type !== undefined) updateData.type = type;
    if (bedrooms !== undefined) updateData.bedrooms = Number(bedrooms) || 0;
    if (bathrooms !== undefined) updateData.bathrooms = Number(bathrooms) || 0;
    if (area !== undefined) updateData.area = Number(area);
    if (features !== undefined) updateData.features = features || [];
    if (processedImages !== undefined) updateData.images = processedImages;
    if (videoUrl !== undefined) updateData.walkthrough_video = videoUrl;
    if (listingType !== undefined) updateData.listingType = listingType;
    if (status !== undefined) updateData.status = status;

    // Update the updatedAt timestamp
    updateData.updatedAt = new Date();

    // Update the property
    const updatedProperty = await Property.findByIdAndUpdate(id, updateData, {
      new: true, // Return the updated document
      runValidators: true, // Run mongoose validators
    });

    logInfo("Property updated successfully", {
      propertyId: updatedProperty._id,
      updatedBy: req.user.id,
      userRole: req.user.role,
      title: updatedProperty.title,
      fieldsUpdated: Object.keys(updateData),
    });

    sendSuccess(res, updatedProperty, "Property updated successfully", 200);
  } catch (error) {
    // Clean up uploaded files on error
    if (req.files) {
      // Clean up images
      if (req.files.images && req.files.images.length > 0) {
        deleteUploadedFiles(req.files.images);
        logDebug("Cleaned up uploaded images after update error", {
          fileCount: req.files.images.length
        });
      }
      // Clean up video
      if (req.files.video && req.files.video.length > 0) {
        deleteUploadedFiles(req.files.video);
        logDebug("Cleaned up uploaded video after update error", {
          fileCount: req.files.video.length
        });
      }
    } else if (req.files && req.files.length > 0) {
      // Fallback for old format
      deleteUploadedFiles(req.files);
      logDebug("Cleaned up uploaded files after update error (legacy format)", {
        fileCount: req.files.length
      });
    }

    if (error.name === "CastError") {
      logInfo("Invalid property ID format for update", {
        propertyId: req.params.id,
      });
      return sendNotFound(res, "Property");
    }

    if (error.name === "ValidationError") {
      const errorMessages = Object.values(error.errors).map(
        (err) => err.message
      );
      return sendError(res, errorMessages.join(", "), 400);
    }

    logError("Error updating property", {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id,
      propertyId: req.params.id,
      requestBody: req.body,
    });

    next(error);
  }
};

/**
 * Soft delete property listing
 * @route DELETE /api/properties/:id
 * @access Private (only owner agent or admin)
 */
const deleteProperty = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body; // Optional deletion reason

    // Check if user is agent or admin
    if (req.user.role !== "agent" && req.user.role !== "admin") {
      logWarning("Non-agent user attempted to delete property", {
        userId: req.user.id,
        userRole: req.user.role,
        email: req.user.email,
      });
      return sendError(
        res,
        "Only agents can delete property listings. Please update your account to 'Property Lister' to delete properties.",
        403
      );
    }

    // Find the property first (exclude already deleted properties)
    const existingProperty = await Property.findOne({ 
      _id: id, 
      isDeleted: false 
    });

    if (!existingProperty) {
      logInfo("Property not found or already deleted", { propertyId: id });
      return sendNotFound(res, "Property");
    }

    // Check if user is the owner of the property (or admin)
    if (
      req.user.role !== "admin" &&
      existingProperty.owner.toString() !== req.user.id.toString()
    ) {
      logWarning("User attempted to delete property they don't own", {
        userId: req.user.id,
        propertyId: id,
        propertyOwner: existingProperty.owner,
      });
      return sendError(
        res,
        "You can only delete properties that you own.",
        403
      );
    }

    // Store property info for logging and cleanup
    const propertyInfo = {
      id: existingProperty._id,
      title: existingProperty.title,
      price: existingProperty.price,
      owner: existingProperty.owner,
      images: existingProperty.images || [],
      video: existingProperty.walkthrough_video,
    };

    // Perform soft delete
    existingProperty.isDeleted = true;
    existingProperty.deletedAt = new Date();
    existingProperty.deletedBy = req.user.id;
    existingProperty.deletionReason = reason || "Deleted by owner";
    existingProperty.status = "deleted"; // Update status to reflect deletion
    
    await existingProperty.save();
    
    // Schedule cleanup of associated files (images and videos)
    // This can be done asynchronously or via a scheduled job
    if (propertyInfo.images.length > 0 || propertyInfo.video) {
      scheduleFileCleanup(propertyInfo);
    }

    logInfo("Property soft deleted successfully", {
      propertyId: propertyInfo.id,
      deletedBy: req.user.id,
      userRole: req.user.role,
      title: propertyInfo.title,
      price: propertyInfo.price,
      deletionReason: existingProperty.deletionReason,
    });

    // Return success response with deleted property info
    sendSuccess(
      res,
      {
        deletedProperty: {
          _id: existingProperty._id,
          title: existingProperty.title,
          message: "Property has been removed from listings",
        },
      },
      "Property deleted successfully",
      200
    );
  } catch (error) {
    if (error.name === "CastError") {
      logInfo("Invalid property ID format for deletion", {
        propertyId: req.params.id,
      });
      return sendNotFound(res, "Property");
    }

    logError("Error deleting property", {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id,
      propertyId: req.params.id,
    });

    next(error);
  }
};

/**
 * Schedule cleanup of files for deleted properties
 * This can be called asynchronously or via a scheduled job
 */
const scheduleFileCleanup = (propertyInfo) => {
  try {
    logDebug("Scheduling file cleanup for deleted property", {
      propertyId: propertyInfo.id,
      imageCount: propertyInfo.images.length,
      hasVideo: !!propertyInfo.video,
    });
    
    // In production, this would queue a job for file cleanup
    // For now, we'll just log the files that would be deleted
    const filesToDelete = [];
    
    // Collect image paths
    if (propertyInfo.images && propertyInfo.images.length > 0) {
      propertyInfo.images.forEach(image => {
        if (typeof image === 'string') {
          filesToDelete.push(image);
        } else if (image.url) {
          filesToDelete.push(image.url);
        }
      });
    }
    
    // Add video path
    if (propertyInfo.video) {
      filesToDelete.push(propertyInfo.video);
    }
    
    logInfo("Files marked for cleanup", {
      propertyId: propertyInfo.id,
      files: filesToDelete,
    });
    
    // TODO: Implement actual file deletion from filesystem
    // This would typically be done via a background job to avoid blocking
  } catch (error) {
    logError("Error scheduling file cleanup", {
      error: error.message,
      propertyId: propertyInfo.id,
    });
  }
};

/**
 * Get properties for the authenticated agent
 * @route GET /api/properties/my-properties
 * @access Private (agents only)
 */
const getMyProperties = async (req, res, next) => {
  try {
    logDebug("Getting agent's properties", { 
      agentId: req.user.id,
      query: req.query 
    });

    // Check if user is an agent
    if (req.user.role !== "agent" && req.user.role !== "admin") {
      logWarning("Non-agent user attempted to access my-properties", {
        userId: req.user.id,
        userRole: req.user.role,
      });
      return sendError(
        res,
        "Only agents can access this endpoint",
        403
      );
    }

    // Build query object - get all non-deleted properties for this agent
    let query = { 
      agent: req.user.id,
      isDeleted: false // Exclude soft deleted properties
    };

    // Apply filters from query parameters
    const {
      status,
      search,
      type,
      listingType,
      minPrice,
      maxPrice,
      sortBy,
      sortOrder,
    } = req.query;

    // Status filter (active, inactive, draft, all)
    if (status && status !== "all") {
      query.status = status;
    }

    // Search in title, description, and location
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { "location.address": { $regex: search, $options: "i" } },
        { "location.city": { $regex: search, $options: "i" } },
      ];
    }

    // Property type filter
    if (type && type !== "all") {
      query.type = type;
    }

    // Listing type filter (sale/rent/coliving)
    if (listingType && listingType !== "all") {
      query.listingType = listingType;
    }

    // Price range filter
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseInt(minPrice);
      if (maxPrice) query.price.$lte = parseInt(maxPrice);
    }

    // Pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    // Sorting (default: newest first)
    const sort = {};
    if (sortBy) {
      sort[sortBy] = sortOrder === "asc" ? 1 : -1;
    } else {
      sort.createdAt = -1; // Default: newest first
    }

    logDebug("Agent properties query built", { 
      query, 
      pagination: { page, limit, skip }, 
      sort 
    });

    // Execute query with pagination
    const [properties, total] = await Promise.all([
      Property.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Property.countDocuments(query),
    ]);

    // Get statistics for each property (views, favorites)
    const propertiesWithStats = properties.map(property => ({
      ...property,
      statistics: {
        views: property.views || 0,
        favorites: property.favoriteCount || 0,
        inquiries: 0, // TODO: Implement inquiries tracking
        daysOnMarket: Math.floor(
          (new Date() - new Date(property.createdAt)) / (1000 * 60 * 60 * 24)
        ),
      }
    }));

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    // Calculate summary statistics
    const stats = {
      total,
      active: properties.filter(p => p.status === "available").length,
      inactive: properties.filter(p => p.status === "inactive").length,
      draft: properties.filter(p => p.status === "draft").length,
      totalViews: properties.reduce((sum, p) => sum + (p.views || 0), 0),
      totalFavorites: properties.reduce((sum, p) => sum + (p.favoriteCount || 0), 0),
    };

    const responseData = {
      properties: propertiesWithStats,
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
      stats,
    };

    logInfo("Agent properties retrieved successfully", {
      agentId: req.user.id,
      total,
      page,
      limit,
      filtersApplied: Object.keys(req.query).length > 0,
    });

    sendSuccess(
      res, 
      responseData, 
      `Found ${total} properties for agent`, 
      200
    );
  } catch (error) {
    logError("Error getting agent properties", {
      error: error.message,
      stack: error.stack,
      agentId: req.user?.id,
      query: req.query,
    });

    next(error);
  }
};

/**
 * Get agent dashboard statistics
 * @route GET /api/properties/agent-stats
 * @access Private (agents only)
 */
const getAgentStats = async (req, res, next) => {
  try {
    const agentId = req.user.id;
    
    logDebug("Getting agent dashboard statistics", { agentId });

    // Check if user is an agent
    if (req.user.role !== "agent" && req.user.role !== "admin") {
      logWarning("Non-agent user attempted to access agent stats", {
        userId: req.user.id,
        userRole: req.user.role,
      });
      return sendError(
        res,
        "Only agents can access dashboard statistics",
        403
      );
    }

    // Get current date ranges for trend calculations
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Aggregate agent's properties
    const [properties, monthlyStats, lastMonthStats] = await Promise.all([
      // Get all properties for basic stats
      Property.find({ 
        owner: agentId, 
        isDeleted: false 
      }).lean(),
      
      // Get this month's properties
      Property.find({
        owner: agentId,
        isDeleted: false,
        createdAt: { $gte: startOfMonth }
      }).lean(),
      
      // Get last month's properties
      Property.find({
        owner: agentId,
        isDeleted: false,
        createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth }
      }).lean()
    ]);

    // Calculate basic statistics
    const totalProperties = properties.length;
    const activeProperties = properties.filter(p => p.status === 'available').length;
    const inactiveProperties = properties.filter(p => p.status === 'inactive').length;
    const draftProperties = properties.filter(p => p.status === 'draft').length;

    // Calculate engagement statistics
    const totalViews = properties.reduce((sum, p) => sum + (p.views || 0), 0);
    const totalFavorites = properties.reduce((sum, p) => sum + (p.favoriteCount || 0), 0);
    const totalInquiries = properties.reduce((sum, p) => sum + (p.inquiryCount || 0), 0);

    // Calculate trends
    const thisMonthProperties = monthlyStats.length;
    const lastMonthProperties = lastMonthStats.length;
    const propertyTrend = lastMonthProperties > 0 
      ? ((thisMonthProperties - lastMonthProperties) / lastMonthProperties) * 100
      : thisMonthProperties > 0 ? 100 : 0;

    const thisMonthViews = monthlyStats.reduce((sum, p) => sum + (p.views || 0), 0);
    const lastMonthViews = lastMonthStats.reduce((sum, p) => sum + (p.views || 0), 0);
    const viewsTrend = lastMonthViews > 0 
      ? ((thisMonthViews - lastMonthViews) / lastMonthViews) * 100
      : thisMonthViews > 0 ? 100 : 0;

    // Find top performing property
    const topProperty = properties.length > 0 
      ? properties.reduce((top, current) => 
          (current.views || 0) > (top.views || 0) ? current : top
        )
      : null;

    // Find properties needing attention (low views, old properties)
    const lowViewThreshold = Math.max(1, Math.floor(totalViews / totalProperties * 0.5));
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 30);

    const propertiesNeedingAttention = properties.filter(p => {
      const hasLowViews = (p.views || 0) < lowViewThreshold;
      const isOld = new Date(p.createdAt) < oldDate && p.status === 'available';
      const hasNoImages = !p.images || p.images.length === 0;
      return hasLowViews || isOld || hasNoImages;
    }).length;

    // Calculate average metrics
    const avgViews = totalProperties > 0 ? Math.round(totalViews / totalProperties) : 0;
    const avgFavorites = totalProperties > 0 ? Math.round(totalFavorites / totalProperties) : 0;

    // Recent activity (properties created in last 7 days)
    const recentDate = new Date();
    recentDate.setDate(recentDate.getDate() - 7);
    const recentProperties = properties.filter(p => new Date(p.createdAt) >= recentDate).length;

    const statsData = {
      overview: {
        totalProperties,
        activeProperties,
        inactiveProperties,
        draftProperties,
        propertiesNeedingAttention,
        recentProperties
      },
      engagement: {
        totalViews,
        totalFavorites,
        totalInquiries,
        avgViews,
        avgFavorites
      },
      trends: {
        propertyTrend: Math.round(propertyTrend * 100) / 100,
        viewsTrend: Math.round(viewsTrend * 100) / 100,
        thisMonthProperties,
        lastMonthProperties,
        thisMonthViews,
        lastMonthViews
      },
      topProperty: topProperty ? {
        _id: topProperty._id,
        title: topProperty.title,
        views: topProperty.views || 0,
        favoriteCount: topProperty.favoriteCount || 0,
        price: topProperty.price,
        images: topProperty.images || []
      } : null,
      performance: {
        conversionRate: totalViews > 0 ? Math.round((totalFavorites / totalViews) * 10000) / 100 : 0,
        avgDaysOnMarket: totalProperties > 0 ? Math.round(
          properties.reduce((sum, p) => {
            const days = Math.floor((now - new Date(p.createdAt)) / (1000 * 60 * 60 * 24));
            return sum + days;
          }, 0) / totalProperties
        ) : 0
      },
      updatedAt: now
    };

    logInfo("Agent statistics calculated successfully", {
      agentId,
      totalProperties,
      totalViews,
      totalFavorites
    });

    sendSuccess(res, statsData, "Agent statistics retrieved successfully", 200);
  } catch (error) {
    logError("Error getting agent statistics", {
      error: error.message,
      stack: error.stack,
      agentId: req.user?.id,
    });

    next(error);
  }
};

/**
 * Toggle property status (active/inactive)
 * @route PATCH /api/properties/:id/toggle-status
 * @access Private (only owner agent or admin)
 */
const togglePropertyStatus = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Find the property
    const property = await Property.findById(id);
    if (!property) {
      logInfo("Property not found for status toggle", { propertyId: id });
      return sendNotFound(res, "Property");
    }

    // Check ownership or admin privileges
    if (
      property.agent.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      logWarning("Unauthorized attempt to toggle property status", {
        propertyId: id,
        ownerId: property.agent.toString(),
        attemptedBy: req.user.id,
      });
      return sendError(
        res,
        "You are not authorized to modify this property",
        403
      );
    }

    // Toggle status between available and inactive
    const newStatus = property.status === "available" ? "inactive" : "available";
    property.status = newStatus;
    await property.save();

    logInfo("Property status toggled successfully", {
      propertyId: id,
      oldStatus: property.status === "available" ? "inactive" : "available",
      newStatus,
      toggledBy: req.user.id,
    });

    sendSuccess(
      res,
      { 
        property: {
          _id: property._id,
          title: property.title,
          status: property.status,
        }
      },
      `Property status changed to ${newStatus}`,
      200
    );
  } catch (error) {
    if (error.name === "CastError") {
      logInfo("Invalid property ID format for status toggle", {
        propertyId: req.params.id,
      });
      return sendNotFound(res, "Property");
    }

    logError("Error toggling property status", {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id,
      propertyId: req.params.id,
    });

    next(error);
  }
};

module.exports = {
  getProperties,
  getPropertyById,
  createProperty,
  updateProperty,
  deleteProperty,
  getMyProperties,
  getAgentStats,
  togglePropertyStatus,
};
