// Standardized error messages for common scenarios

const ERROR_MESSAGES = {
  // Authentication & Authorization
  AUTH: {
    INVALID_CREDENTIALS:
      "Invalid email or password. Please check your credentials and try again.",
    TOKEN_MISSING: "Access token is required. Please log in to continue.",
    TOKEN_INVALID: "Invalid or malformed access token. Please log in again.",
    TOKEN_EXPIRED: "Your session has expired. Please log in again.",
    ACCESS_DENIED: "You do not have permission to access this resource.",
    ACCOUNT_LOCKED:
      "Your account has been temporarily locked. Please contact support.",
    EMAIL_NOT_VERIFIED: "Please verify your email address before continuing.",
    PASSWORD_REQUIREMENTS:
      "Password must be at least 8 characters long and contain uppercase, lowercase, number and special character.",
  },

  // User Management
  USER: {
    NOT_FOUND:
      "User account not found. Please check the user ID and try again.",
    EMAIL_EXISTS:
      "An account with this email address already exists. Please use a different email or try logging in.",
    PHONE_EXISTS:
      "An account with this phone number already exists. Please use a different number.",
    INVALID_EMAIL: "Please enter a valid email address.",
    INVALID_PHONE: "Please enter a valid phone number.",
    PROFILE_UPDATE_FAILED: "Failed to update user profile. Please try again.",
    PASSWORD_MISMATCH:
      "Current password is incorrect. Please verify and try again.",
    WEAK_PASSWORD: "Password is too weak. Please choose a stronger password.",
  },

  // Property Management
  PROPERTY: {
    NOT_FOUND:
      "Property not found. It may have been removed or the ID is incorrect.",
    ACCESS_DENIED: "You do not have permission to access this property.",
    INVALID_PRICE: "Please enter a valid price amount.",
    INVALID_ADDRESS: "Please enter a valid property address.",
    MISSING_IMAGES: "At least one property image is required.",
    IMAGE_UPLOAD_FAILED: "Failed to upload property images. Please try again.",
    ALREADY_SOLD: "This property has already been sold and cannot be modified.",
    INVALID_STATUS: "Invalid property status. Please select a valid status.",
    DUPLICATE_LISTING: "A property with similar details already exists.",
  },

  // File & Upload
  FILE: {
    TOO_LARGE:
      "File size is too large. Please upload a file smaller than 10MB.",
    INVALID_TYPE:
      "Invalid file type. Please upload JPG, PNG, or PDF files only.",
    UPLOAD_FAILED:
      "File upload failed. Please check your connection and try again.",
    NOT_FOUND: "Requested file not found or has been removed.",
    PROCESSING_ERROR:
      "Error processing uploaded file. Please try uploading again.",
  },

  // Database & Server
  SERVER: {
    INTERNAL_ERROR: "Something went wrong on our end. Please try again later.",
    DATABASE_ERROR: "Database connection error. Please try again in a moment.",
    SERVICE_UNAVAILABLE:
      "Service is temporarily unavailable. Please try again later.",
    MAINTENANCE_MODE: "System is under maintenance. Please check back soon.",
    RATE_LIMIT_EXCEEDED:
      "Too many requests. Please wait a moment before trying again.",
    TIMEOUT: "Request timed out. Please check your connection and try again.",
  },

  // Validation
  VALIDATION: {
    REQUIRED_FIELD: "This field is required and cannot be empty.",
    INVALID_FORMAT: "Please enter data in the correct format.",
    VALUE_TOO_SHORT:
      "Value is too short. Please enter at least {min} characters.",
    VALUE_TOO_LONG:
      "Value is too long. Please enter no more than {max} characters.",
    INVALID_DATE: "Please enter a valid date.",
    INVALID_NUMBER: "Please enter a valid number.",
    INVALID_URL: "Please enter a valid URL.",
    INVALID_COORDINATES:
      "Please enter valid latitude and longitude coordinates.",
  },

  // Search & Filters
  SEARCH: {
    NO_RESULTS:
      "No properties found matching your search criteria. Try adjusting your filters.",
    INVALID_SEARCH_TERM: "Please enter a valid search term.",
    SEARCH_ERROR:
      "Search service is temporarily unavailable. Please try again.",
    FILTER_ERROR: "Invalid filter parameters. Please check your selections.",
    LOCATION_NOT_FOUND:
      "Location not found. Please try a different address or city.",
  },

  // AI Chat
  AI: {
    SERVICE_UNAVAILABLE:
      "AI assistant is temporarily unavailable. Please try traditional search instead.",
    INVALID_QUERY:
      "I did not understand your request. Please try rephrasing your question.",
    PROCESSING_ERROR:
      "Error processing your request. Please try asking in a different way.",
    RATE_LIMIT:
      "You have reached the limit for AI queries. Please wait before asking another question.",
    NO_PROPERTIES_FOUND:
      "I could not find any properties matching your criteria. Would you like to try different search terms?",
  },

  // Email & Notifications
  EMAIL: {
    SEND_FAILED:
      "Failed to send email. Please check the email address and try again.",
    INVALID_EMAIL: "Please enter a valid email address.",
    DELIVERY_ERROR: "Email delivery failed. Please try again later.",
    TEMPLATE_ERROR: "Email template error. Please contact support.",
  },
};

/**
 * Get error message by category and type
 * @param {string} category - Error category (AUTH, USER, PROPERTY, etc.)
 * @param {string} type - Error type within category
 * @param {Object} params - Parameters to replace in message (e.g., {min}, {max})
 * @returns {string} Formatted error message
 */
const getErrorMessage = (category, type, params = {}) => {
  const categoryMessages = ERROR_MESSAGES[category.toUpperCase()];
  if (!categoryMessages) {
    return ERROR_MESSAGES.SERVER.INTERNAL_ERROR;
  }

  let message = categoryMessages[type.toUpperCase()];
  if (!message) {
    return ERROR_MESSAGES.SERVER.INTERNAL_ERROR;
  }

  // Replace parameters in message
  Object.keys(params).forEach((key) => {
    message = message.replace(`{${key}}`, params[key]);
  });

  return message;
};

/**
 * Create standardized error object
 * @param {string} category - Error category
 * @param {string} type - Error type
 * @param {Object} params - Parameters for message
 * @param {number} statusCode - HTTP status code
 * @returns {Object} Error object
 */
const createError = (category, type, params = {}, statusCode = 500) => {
  return {
    message: getErrorMessage(category, type, params),
    category: category.toUpperCase(),
    type: type.toUpperCase(),
    statusCode,
    timestamp: new Date().toISOString(),
  };
};

module.exports = {
  ERROR_MESSAGES,
  getErrorMessage,
  createError,
};
