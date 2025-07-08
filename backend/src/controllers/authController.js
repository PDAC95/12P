const User = require("../models/User");
const {
  sendSuccess,
  sendError,
  sendValidationError,
} = require("../utils/apiResponse");
const { logInfo, logError, logWarning } = require("../utils/logger");
const { createError } = require("../utils/errorMessages");

/**
 * Register new user
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
        "First name, last name, email and password are required"
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      logWarning("Registration attempt with existing email", { email });
      const errorObj = createError("AUTH", "USER_EXISTS");
      return sendError(res, errorObj.message, errorObj.statusCode);
    }

    // Validate password strength
    if (password.length < 8) {
      const errorObj = createError("AUTH", "PASSWORD_TOO_WEAK");
      return sendValidationError(res, errorObj.message);
    }

    // Create user data
    const userData = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: role || "client",
    };

    // Add optional fields
    if (phone) userData.phone = phone.trim();
    if (role === "agent" && agentInfo) userData.agentInfo = agentInfo;

    // Create new user
    const newUser = new User(userData);
    await newUser.save();

    // Generate JWT token
    const token = newUser.generateAuthToken();

    // Prepare response data
    const responseData = {
      user: {
        id: newUser._id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        fullName: newUser.fullName,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
        isEmailVerified: newUser.isEmailVerified,
        createdAt: newUser.createdAt,
        ...(newUser.role === "agent" && { agentInfo: newUser.agentInfo }),
      },
      token,
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    };

    logInfo("User registration successful", {
      userId: newUser._id,
      email: newUser.email,
      role: newUser.role,
    });

    sendSuccess(res, responseData, "User registered successfully", 201);
  } catch (error) {
    // Handle duplicate key error (email already exists)
    if (error.code === 11000) {
      const errorObj = createError("AUTH", "USER_EXISTS");
      return sendError(res, errorObj.message, errorObj.statusCode);
    }

    // Handle validation errors
    if (error.name === "ValidationError") {
      const errorMessages = Object.values(error.errors).map(
        (err) => err.message
      );
      return sendValidationError(res, errorMessages.join(", "));
    }

    logError("Registration failed - server error", {
      error: error.message,
      stack: error.stack,
      email: req.body.email,
    });

    next(error);
  }
};

/**
 * Login user
 * @route POST /api/auth/login
 * @access Public
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    logInfo("User login attempt", {
      email,
      ip: req.ip,
      userAgent: req.get("User-Agent"),
    });

    // Validate required fields - ONLY email and password for login
    if (!email || !password) {
      const errorObj = createError("VALIDATION", "REQUIRED_FIELD");
      return sendValidationError(res, "Email and password are required");
    }

    // Find user by email and include password
    const user = await User.findByEmailWithPassword(email.toLowerCase());

    if (!user) {
      logWarning("Login attempt with non-existent email", { email });
      const errorObj = createError("AUTH", "INVALID_CREDENTIALS");
      return sendError(res, errorObj.message, errorObj.statusCode);
    }

    // Check if user is active
    if (!user.isActive) {
      logWarning("Login attempt for inactive user", {
        userId: user._id,
        email,
      });
      const errorObj = createError("AUTH", "ACCOUNT_LOCKED");
      return sendError(res, errorObj.message, errorObj.statusCode);
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      logWarning("Login attempt with invalid password", {
        userId: user._id,
        email,
      });
      const errorObj = createError("AUTH", "INVALID_CREDENTIALS");
      return sendError(res, errorObj.message, errorObj.statusCode);
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const token = user.generateAuthToken();

    // Prepare response data (password is automatically excluded)
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
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        ...(user.role === "agent" && { agentInfo: user.agentInfo }),
      },
      token,
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    };

    logInfo("User login successful", {
      userId: user._id,
      email: user.email,
      role: user.role,
      lastLogin: user.lastLogin,
    });

    sendSuccess(res, responseData, "Login successful", 200);
  } catch (error) {
    logError("Login failed - server error", {
      error: error.message,
      stack: error.stack,
      email: req.body.email,
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
    // Note: req.user will be set by auth middleware (to be implemented)
    const userId = req.user?.id;

    if (!userId) {
      const errorObj = createError("AUTH", "UNAUTHORIZED");
      return sendError(res, errorObj.message, 401);
    }

    // Find user by ID
    const user = await User.findById(userId);

    if (!user) {
      const errorObj = createError("AUTH", "USER_NOT_FOUND");
      return sendError(res, errorObj.message, 404);
    }

    // Check if user is active
    if (!user.isActive) {
      const errorObj = createError("AUTH", "ACCOUNT_LOCKED");
      return sendError(res, errorObj.message, 401);
    }

    // Prepare response data
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
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        preferences: user.preferences,
        ...(user.role === "agent" && { agentInfo: user.agentInfo }),
      },
    };

    logInfo("User profile retrieved", {
      userId: user._id,
      email: user.email,
    });

    sendSuccess(res, responseData, "User profile retrieved successfully", 200);
  } catch (error) {
    logError("Get current user failed - server error", {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id,
    });

    next(error);
  }
};

module.exports = {
  register,
  login,
  getCurrentUser,
};
