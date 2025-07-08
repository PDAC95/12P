const { logError } = require("../utils/logger");
const { sendError } = require("../utils/apiResponse");
const { createError } = require("../utils/errorMessages");

// Global error handling middleware for Express application
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error with request context
  logError(err.message, {
    stack: err.stack,
    request: {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      body: req.body,
      params: req.params,
      query: req.query,
    },
    user: req.user ? req.user.id : "Anonymous",
  });

  // Handle specific error types with user-friendly messages
  if (err.name === "CastError") {
    const errorObj = createError("PROPERTY", "NOT_FOUND", {}, 404);
    return sendError(res, errorObj.message, 404, { type: "CastError" });
  }

  if (err.code === 11000) {
    // Extract field name from duplicate key error
    const field = Object.keys(err.keyValue)[0];
    let errorObj;

    if (field === "email") {
      errorObj = createError("USER", "EMAIL_EXISTS", {}, 400);
    } else if (field === "phone") {
      errorObj = createError("USER", "PHONE_EXISTS", {}, 400);
    } else {
      errorObj = createError("VALIDATION", "INVALID_FORMAT", {}, 400);
    }

    return sendError(res, errorObj.message, 400, {
      type: "DuplicateError",
      field,
    });
  }

  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map((val) => ({
      field: val.path,
      message: val.message,
      value: val.value,
    }));

    const errorObj = createError("VALIDATION", "REQUIRED_FIELD", {}, 400);
    return sendError(res, "Validation failed", 400, {
      type: "ValidationError",
      errors,
    });
  }

  if (err.name === "JsonWebTokenError") {
    const errorObj = createError("AUTH", "TOKEN_INVALID", {}, 401);
    return sendError(res, errorObj.message, 401, { type: "JsonWebTokenError" });
  }

  if (err.name === "TokenExpiredError") {
    const errorObj = createError("AUTH", "TOKEN_EXPIRED", {}, 401);
    return sendError(res, errorObj.message, 401, { type: "TokenExpiredError" });
  }

  // Rate limiting error
  if (err.status === 429) {
    const errorObj = createError("SERVER", "RATE_LIMIT_EXCEEDED", {}, 429);
    return sendError(res, errorObj.message, 429, { type: "RateLimitError" });
  }

  // File upload errors
  if (err.code === "LIMIT_FILE_SIZE") {
    const errorObj = createError("FILE", "TOO_LARGE", {}, 400);
    return sendError(res, errorObj.message, 400, { type: "FileSizeError" });
  }

  // Default server error
  const errorObj = createError("SERVER", "INTERNAL_ERROR", {}, 500);
  return sendError(res, errorObj.message, error.statusCode || 500, {
    type: error.name || "ServerError",
    ...(process.env.NODE_ENV === "development" && {
      stack: err.stack,
      originalMessage: err.message,
    }),
  });
};

module.exports = errorHandler;
