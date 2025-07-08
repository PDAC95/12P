/**
 * Error message definitions for consistent API responses
 */

const ERROR_MESSAGES = {
  // Authentication errors
  AUTH: {
    INVALID_CREDENTIALS: {
      code: "AUTH_001",
      message:
        "Invalid email or password. Please check your credentials and try again.",
      statusCode: 401,
    },
    USER_EXISTS: {
      code: "AUTH_002",
      message:
        "An account with this email address already exists. Please use a different email or try logging in.",
      statusCode: 409,
    },
    USER_NOT_FOUND: {
      code: "AUTH_003",
      message:
        "No account found with this email address. Please check your email or create a new account.",
      statusCode: 404,
    },
    ACCOUNT_LOCKED: {
      code: "AUTH_004",
      message:
        "Your account has been deactivated. Please contact support for assistance.",
      statusCode: 401,
    },
    NO_TOKEN: {
      code: "AUTH_005",
      message: "Access denied. Authentication token is required.",
      statusCode: 401,
    },
    INVALID_TOKEN: {
      code: "AUTH_006",
      message: "Invalid or expired authentication token. Please log in again.",
      statusCode: 401,
    },
    UNAUTHORIZED: {
      code: "AUTH_007",
      message: "You are not authorized to access this resource.",
      statusCode: 401,
    },
    FORBIDDEN: {
      code: "AUTH_008",
      message: "You do not have permission to perform this action.",
      statusCode: 403,
    },
    PASSWORD_TOO_WEAK: {
      code: "AUTH_009",
      message:
        "Password must be at least 8 characters long and contain a mix of letters and numbers.",
      statusCode: 400,
    },
    EMAIL_NOT_VERIFIED: {
      code: "AUTH_010",
      message: "Please verify your email address before logging in.",
      statusCode: 401,
    },
  },

  // Validation errors
  VALIDATION: {
    REQUIRED_FIELD: {
      code: "VAL_001",
      message: "Required field is missing.",
      statusCode: 400,
    },
    INVALID_EMAIL: {
      code: "VAL_002",
      message: "Please provide a valid email address.",
      statusCode: 400,
    },
    INVALID_PHONE: {
      code: "VAL_003",
      message: "Please provide a valid phone number.",
      statusCode: 400,
    },
    INVALID_ROLE: {
      code: "VAL_004",
      message: "Invalid user role specified.",
      statusCode: 400,
    },
  },

  // Server errors
  SERVER: {
    INTERNAL_ERROR: {
      code: "SRV_001",
      message: "An unexpected error occurred. Please try again later.",
      statusCode: 500,
    },
    DATABASE_ERROR: {
      code: "SRV_002",
      message: "Database connection error. Please try again later.",
      statusCode: 500,
    },
    SERVICE_UNAVAILABLE: {
      code: "SRV_003",
      message: "Service is temporarily unavailable. Please try again later.",
      statusCode: 503,
    },
  },
};

/**
 * Create standardized error object
 * @param {string} category - Error category (AUTH, VALIDATION, SERVER)
 * @param {string} type - Specific error type
 * @param {string} customMessage - Optional custom message to override default
 * @returns {Object} Standardized error object
 */
const createError = (category, type, customMessage = null) => {
  const errorDef = ERROR_MESSAGES[category]?.[type];

  if (!errorDef) {
    return ERROR_MESSAGES.SERVER.INTERNAL_ERROR;
  }

  return {
    ...errorDef,
    message: customMessage || errorDef.message,
  };
};

/**
 * Get user-friendly validation error message
 * @param {Array} validationErrors - Array of validation error messages
 * @returns {string} Formatted error message
 */
const formatValidationErrors = (validationErrors) => {
  if (validationErrors.length === 1) {
    return validationErrors[0];
  }

  return `Please fix the following issues: ${validationErrors.join(", ")}`;
};

module.exports = {
  ERROR_MESSAGES,
  createError,
  formatValidationErrors,
};
