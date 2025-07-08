const User = require("../models/User");
const {
  sendSuccess,
  sendError,
  sendValidationError,
} = require("../utils/apiResponse");
const { logInfo, logError, logWarning } = require("../utils/logger");
const { createError } = require("../utils/errorMessages");

/**
 * Register a new user
 * @route POST /api/auth/register
 * @access Public
 */
const register = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password, phone, role, agentInfo } =
      req.body;

    logInfo("User registration attempt", {
      email,
      role,
      ip: req.ip,
      userAgent: req.get("User-Agent"),
    });

    // Validate required fields
    if (!firstName || !lastName || !email || !password) {
      const errorObj = createError("VALIDATION", "REQUIRED_FIELD");
      return sendValidationError(
        res,
        "First name, last name, email, and password are required"
      );
    }

    // Validate role
    if (role && !["client", "agent"].includes(role)) {
      const errorObj = createError("VALIDATION", "INVALID_FORMAT");
      return sendValidationError(res, "Role must be either client or agent");
    }

    // Validate password strength
    if (password.length < 8) {
      const errorObj = createError("USER", "PASSWORD_REQUIREMENTS");
      return sendValidationError(res, errorObj.message);
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      logWarning("Registration attempt with existing email", { email });
      const errorObj = createError("USER", "EMAIL_EXISTS");
      return sendError(res, errorObj.message, 400);
    }

    // Prepare user data
    const userData = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: role || "client",
    };

    // Add optional fields
    if (phone) userData.phone = phone.trim();

    // Add agent-specific information if role is agent
    if (userData.role === "agent" && agentInfo) {
      userData.agentInfo = {
        licenseNumber: agentInfo.licenseNumber?.trim(),
        agency: agentInfo.agency?.trim(),
        experience: agentInfo.experience,
        specializations: agentInfo.specializations || [],
      };
    }

    // Create new user
    const user = new User(userData);
    await user.save();

    // Generate JWT token
    const token = user.generateAuthToken();

    // Prepare response data (password is automatically excluded by schema transform)
    const responseData = {
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        createdAt: user.createdAt,
        ...(user.role === "agent" && { agentInfo: user.agentInfo }),
      },
      token,
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    };

    logInfo("User registered successfully", {
      userId: user._id,
      email: user.email,
      role: user.role,
    });

    sendSuccess(res, responseData, "User registered successfully", 201);
  } catch (error) {
    // Handle MongoDB duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      let message;

      if (field === "email") {
        const errorObj = createError("USER", "EMAIL_EXISTS");
        message = errorObj.message;
      } else if (field === "phone") {
        const errorObj = createError("USER", "PHONE_EXISTS");
        message = errorObj.message;
      } else {
        message = `${field} already exists`;
      }

      logWarning("Registration failed - duplicate key", {
        field,
        value: error.keyValue[field],
      });

      return sendError(res, message, 400);
    }

    // Handle validation errors
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => ({
        field: err.path,
        message: err.message,
      }));

      logWarning("Registration failed - validation error", { errors });
      return sendValidationError(res, errors);
    }

    logError("Registration failed - server error", {
      error: error.message,
      stack: error.stack,
      requestBody: { ...req.body, password: "[REDACTED]" },
    });

    next(error);
  }
};

/**
 * Get current user profile
 * @route GET /api/auth/me
 * @access Private
 */
const getCurrentUser = async (req, res, next) => {
  try {
    // req.user is set by auth middleware
    const user = await User.findById(req.user.id);

    if (!user) {
      const errorObj = createError("USER", "NOT_FOUND");
      return sendError(res, errorObj.message, 404);
    }

    logInfo("User profile accessed", { userId: user._id });

    const responseData = {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      ...(user.role === "agent" && { agentInfo: user.agentInfo }),
    };

    sendSuccess(res, responseData, "User profile retrieved successfully");
  } catch (error) {
    logError("Error getting current user", {
      error: error.message,
      userId: req.user?.id,
    });

    next(error);
  }
};

module.exports = {
  register,
  getCurrentUser,
};
