const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { sendError } = require("../utils/apiResponse");
const { logError, logWarning } = require("../utils/logger");
const { createError } = require("../utils/errorMessages");

/**
 * Authentication middleware to verify JWT tokens
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      const errorObj = createError("AUTH", "NO_TOKEN");
      return sendError(res, "Access denied. No token provided.", 401);
    }

    // Extract token from "Bearer TOKEN"
    const token = authHeader.substring(7);

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Find user and check if still exists and is active
      const user = await User.findById(decoded.id);

      if (!user) {
        logWarning("Token verification failed - user not found", {
          userId: decoded.id,
          token: token.substring(0, 20) + "...",
        });
        const errorObj = createError("AUTH", "USER_NOT_FOUND");
        return sendError(res, "User not found", 404);
      }

      if (!user.isActive) {
        logWarning("Token verification failed - user inactive", {
          userId: user._id,
          email: user.email,
        });
        const errorObj = createError("AUTH", "ACCOUNT_LOCKED");
        return sendError(res, "Account is deactivated", 401);
      }

      // Add user to request object
      req.user = {
        id: user._id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
      };

      next();
    } catch (jwtError) {
      logWarning("Invalid JWT token", {
        error: jwtError.message,
        token: token.substring(0, 20) + "...",
      });

      const errorObj = createError("AUTH", "INVALID_TOKEN");
      return sendError(res, "Invalid token", 401);
    }
  } catch (error) {
    logError("Authentication middleware error", {
      error: error.message,
      stack: error.stack,
    });

    return sendError(res, "Authentication failed", 500);
  }
};

/**
 * Authorization middleware to check user roles
 * @param {Array} roles - Array of allowed roles
 * @returns {Function} Middleware function
 */
const authorize = (roles = []) => {
  return (req, res, next) => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        const errorObj = createError("AUTH", "UNAUTHORIZED");
        return sendError(res, "Access denied. Authentication required.", 401);
      }

      // If no roles specified, just check if authenticated
      if (roles.length === 0) {
        return next();
      }

      // Check if user role is authorized
      if (!roles.includes(req.user.role)) {
        logWarning("Authorization failed - insufficient permissions", {
          userId: req.user.id,
          userRole: req.user.role,
          requiredRoles: roles,
        });

        const errorObj = createError("AUTH", "FORBIDDEN");
        return sendError(res, "Access denied. Insufficient permissions.", 403);
      }

      next();
    } catch (error) {
      logError("Authorization middleware error", {
        error: error.message,
        stack: error.stack,
        userId: req.user?.id,
      });

      return sendError(res, "Authorization failed", 500);
    }
  };
};

module.exports = {
  authenticate,
  authorize,
};
