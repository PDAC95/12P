// Standardized API response utilities

/**
 * Send success response
 * @param {Object} res - Express response object
 * @param {*} data - Response data
 * @param {string} message - Success message
 * @param {number} statusCode - HTTP status code
 */
const sendSuccess = (
  res,
  data = null,
  message = "Success",
  statusCode = 200
) => {
  const response = {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  };

  // Add pagination info if data has pagination
  if (data && data.pagination) {
    response.pagination = data.pagination;
    response.data = data.results || data.data;
  }

  return res.status(statusCode).json(response);
};

/**
 * Send error response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @param {*} details - Additional error details
 */
const sendError = (
  res,
  message = "Internal Server Error",
  statusCode = 500,
  details = null
) => {
  const response = {
    success: false,
    error: {
      message,
      statusCode,
      ...(details && { details }),
      ...(process.env.NODE_ENV === "development" &&
        details &&
        details.stack && { stack: details.stack }),
    },
    timestamp: new Date().toISOString(),
  };

  return res.status(statusCode).json(response);
};

/**
 * Send validation error response
 * @param {Object} res - Express response object
 * @param {Array|string} errors - Validation errors
 */
const sendValidationError = (res, errors) => {
  return sendError(res, "Validation failed", 400, {
    type: "ValidationError",
    errors: Array.isArray(errors) ? errors : [errors],
  });
};

/**
 * Send not found error response
 * @param {Object} res - Express response object
 * @param {string} resource - Resource name that was not found
 */
const sendNotFound = (res, resource = "Resource") => {
  return sendError(res, `${resource} not found`, 404, {
    type: "NotFoundError",
  });
};

/**
 * Send unauthorized error response
 * @param {Object} res - Express response object
 * @param {string} message - Custom unauthorized message
 */
const sendUnauthorized = (res, message = "Access denied") => {
  return sendError(res, message, 401, {
    type: "UnauthorizedError",
  });
};

/**
 * Send forbidden error response
 * @param {Object} res - Express response object
 * @param {string} message - Custom forbidden message
 */
const sendForbidden = (res, message = "Insufficient permissions") => {
  return sendError(res, message, 403, {
    type: "ForbiddenError",
  });
};

module.exports = {
  sendSuccess,
  sendError,
  sendValidationError,
  sendNotFound,
  sendUnauthorized,
  sendForbidden,
};
