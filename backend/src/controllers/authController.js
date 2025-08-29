const User = require("../models/User");
const jwt = require("jsonwebtoken");
const {
  sendSuccess,
  sendError,
  sendValidationError,
} = require("../utils/apiResponse");
const { logInfo, logError, logDebug, logWarning } = require("../utils/logger");
const { createError } = require("../utils/errorMessages");
const {
  generateVerificationToken,
  generatePasswordResetToken,
} = require("../utils/tokenGenerator");
const emailService = require("../services/emailService");

/**
 * Register a new user
 * @route POST /api/auth/register
 * @access Public
 */
const register = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password, role = "client" } = req.body;

    logDebug("Registration attempt", { email, role });

    // Validation
    if (!firstName || !lastName || !email || !password) {
      return sendValidationError(res, "All fields are required");
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      const errorObj = createError("AUTH", "USER_EXISTS");
      return sendError(res, errorObj.message, 409);
    }

    // Create new user
    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      role,
      isEmailVerified: false, // Start with unverified email
    });

    // Generate verification token
    const verificationData = generateVerificationToken();
    await user.setEmailVerificationToken(
      verificationData.token,
      verificationData.expiresAt
    );

    // Send verification email
    const emailSent = await emailService.sendVerificationEmail(
      user.email,
      user.fullName,
      verificationData.token
    );

    if (!emailSent.success) {
      logError("Failed to send verification email", {
        userId: user._id,
        email: user.email,
        error: emailSent.error,
      });
    }

    // Generate JWT token (but user will need to verify email to use most features)
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );

    const responseData = {
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        createdAt: user.createdAt,
      },
      token,
      emailSent: emailSent.success,
      message: emailSent.success
        ? "Registration successful! Please check your email to verify your account."
        : "Registration successful! Please verify your email to access all features.",
    };

    logInfo("User registered successfully", {
      userId: user._id,
      email: user.email,
      role: user.role,
      emailSent: emailSent.success,
    });

    sendSuccess(res, responseData, responseData.message, 201);
  } catch (error) {
    logError("Registration failed", {
      error: error.message,
      stack: error.stack,
      body: req.body,
    });

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return sendValidationError(res, messages.join(", "));
    }

    if (error.code === 11000) {
      const errorObj = createError("AUTH", "USER_EXISTS");
      return sendError(res, errorObj.message, 409);
    }

    next(error);
  }
};

/**
 * Resend verification email
 * @route POST /api/auth/send-verification
 * @access Private
 */
const sendVerificationEmail = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const { email } = req.body;

    // Use email from body or from authenticated user
    const userEmail = email || req.user?.email;

    if (!userEmail) {
      return sendValidationError(res, "Email is required");
    }

    // Find user
    const user = await User.findOne({
      email: userEmail,
      ...(userId && { _id: userId }),
    });

    if (!user) {
      const errorObj = createError("AUTH", "USER_NOT_FOUND");
      return sendError(res, errorObj.message, 404);
    }

    // Check if already verified
    if (user.isEmailVerified) {
      return sendSuccess(
        res,
        { isEmailVerified: true },
        "Email is already verified",
        200
      );
    }

    // Check rate limiting (5 minutes between emails)
    if (!user.canSendVerificationEmail()) {
      const timeRemaining = Math.ceil(
        (5 * 60 * 1000 - (Date.now() - user.lastVerificationEmailSent)) /
          1000 /
          60
      );
      return sendError(
        res,
        `Please wait ${timeRemaining} minute(s) before requesting another verification email`,
        429
      );
    }

    // Generate new verification token
    const verificationData = generateVerificationToken();
    await user.setEmailVerificationToken(
      verificationData.token,
      verificationData.expiresAt
    );

    // Send verification email
    const emailSent = await emailService.sendVerificationEmail(
      user.email,
      user.fullName,
      verificationData.token
    );

    if (!emailSent.success) {
      logError("Failed to send verification email", {
        userId: user._id,
        email: user.email,
        error: emailSent.error,
      });
      return sendError(
        res,
        "Failed to send verification email. Please try again later.",
        500
      );
    }

    // Update rate limiting info
    await user.updateVerificationEmailSent();

    logInfo("Verification email sent", {
      userId: user._id,
      email: user.email,
      attempt: user.verificationEmailCount,
    });

    sendSuccess(
      res,
      {
        emailSent: true,
        email: user.email,
      },
      "Verification email sent successfully. Please check your inbox.",
      200
    );
  } catch (error) {
    logError("Send verification email failed", {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id,
    });

    next(error);
  }
};

/**
 * Verify email with token
 * @route GET /api/auth/verify-email/:token
 * @access Public
 */
const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.params;

    if (!token) {
      return sendValidationError(res, "Verification token is required");
    }

    logDebug("Email verification attempt", { token });

    // Find user with this token
    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() },
    }).select("+emailVerificationToken +emailVerificationExpires");

    if (!user) {
      logError("Invalid or expired verification token", { token });
      return sendError(
        res,
        "Invalid or expired verification token. Please request a new verification email.",
        400
      );
    }

    // Check if already verified
    if (user.isEmailVerified) {
      return sendSuccess(
        res,
        {
          isEmailVerified: true,
          email: user.email,
        },
        "Email is already verified",
        200
      );
    }

    // Verify the email
    await user.verifyEmail();

    // Send welcome email
    const welcomeEmailSent = await emailService.sendWelcomeEmail(
      user.email,
      user.fullName
    );

    if (!welcomeEmailSent.success) {
      logError("Failed to send welcome email", {
        userId: user._id,
        email: user.email,
        error: welcomeEmailSent.error,
      });
    }

    // Generate new JWT token with verified status
    const jwtToken = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role,
        isEmailVerified: true,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );

    logInfo("Email verified successfully", {
      userId: user._id,
      email: user.email,
    });

    // Prepare response
    const responseData = {
      success: true,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        isEmailVerified: true,
        emailVerifiedAt: user.emailVerifiedAt,
      },
      token: jwtToken,
      redirectUrl: "/dashboard", // Frontend can use this to redirect
    };

    sendSuccess(
      res,
      responseData,
      "Email verified successfully! Welcome to Plaice Real Estate.",
      200
    );
  } catch (error) {
    logError("Email verification failed", {
      error: error.message,
      stack: error.stack,
      token: req.params.token,
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

    // Generate JWT tokens
    const accessToken = user.generateAuthToken();
    const refreshToken = user.generateRefreshToken();

    // Store refresh token
    const deviceInfo = {
      userAgent: req.get("User-Agent"),
      ip: req.ip,
    };
    user.addRefreshToken(refreshToken, deviceInfo);
    await user.save();

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
      token: accessToken,
      refreshToken: refreshToken,
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

/**
 * Update current user profile
 * @route PUT /api/auth/me
 * @access Private
 */
const updateCurrentUser = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const { firstName, lastName, phone, preferences } = req.body;

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

    // Validate and update allowed fields
    const updateData = {};

    if (firstName !== undefined) {
      if (!firstName.trim()) {
        return sendValidationError(res, "First name cannot be empty");
      }
      updateData.firstName = firstName.trim();
    }

    if (lastName !== undefined) {
      if (!lastName.trim()) {
        return sendValidationError(res, "Last name cannot be empty");
      }
      updateData.lastName = lastName.trim();
    }

    if (phone !== undefined) {
      // Allow empty phone (optional field)
      updateData.phone = phone ? phone.trim() : null;
    }

    if (preferences !== undefined && typeof preferences === "object") {
      // Merge with existing preferences
      updateData.preferences = {
        ...user.preferences,
        ...preferences,
      };
    }

    // Update user in database
    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true, // Return updated document
      runValidators: true, // Run mongoose validations
    });

    // Prepare response data
    const responseData = {
      user: {
        id: updatedUser._id,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        fullName: updatedUser.fullName,
        email: updatedUser.email,
        phone: updatedUser.phone,
        role: updatedUser.role,
        isEmailVerified: updatedUser.isEmailVerified,
        lastLogin: updatedUser.lastLogin,
        createdAt: updatedUser.createdAt,
        preferences: updatedUser.preferences,
        ...(updatedUser.role === "agent" && {
          agentInfo: updatedUser.agentInfo,
        }),
      },
    };

    logInfo("User profile updated", {
      userId: updatedUser._id,
      email: updatedUser.email,
      updatedFields: Object.keys(updateData),
    });

    sendSuccess(res, responseData, "Profile updated successfully", 200);
  } catch (error) {
    logError("Update current user failed - server error", {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id,
    });

    next(error);
  }
};

/**
 * Forgot password - Generate reset token and send email
 * @route POST /api/auth/forgot-password
 * @access Public
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    logInfo("Password reset request", {
      email,
      ip: req.ip,
      userAgent: req.get("User-Agent"),
    });

    // Validate email field
    if (!email) {
      return sendValidationError(res, "Email is required");
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // For security, don't reveal if email exists or not
      logWarning("Password reset attempt for non-existent email", { email });
      return sendSuccess(
        res,
        null,
        "If an account with that email exists, a password reset link has been sent.",
        200
      );
    }

    // Check if user is active
    if (!user.isActive) {
      logWarning("Password reset attempt for inactive user", {
        userId: user._id,
        email,
      });
      return sendSuccess(
        res,
        null,
        "If an account with that email exists, a password reset link has been sent.",
        200
      );
    }

    // Generate reset token
    const resetToken = user.generatePasswordResetToken();
    await user.save({ validateBeforeSave: false });

    // Simulate email sending (replace with real email service later)
    const resetURL = `${req.protocol}://${req.get(
      "host"
    )}/auth/reset-password?token=${resetToken}`;

    // TODO: Replace this with actual email service
    console.log("📧 PASSWORD RESET EMAIL (SIMULATED):");
    console.log("To:", user.email);
    console.log("Subject: Password Reset Request");
    console.log("Reset Link:", resetURL);
    console.log("Token expires in 10 minutes");
    console.log("=".repeat(50));

    logInfo("Password reset token generated", {
      userId: user._id,
      email: user.email,
      tokenExpiry: user.resetPasswordExpires,
    });

    sendSuccess(
      res,
      {
        resetURL: resetURL, // Only for development - remove in production
        expiresIn: "10 minutes",
      },
      "Password reset link has been sent to your email",
      200
    );
  } catch (error) {
    // Clear reset token if something goes wrong
    if (req.body.email) {
      const user = await User.findOne({ email: req.body.email.toLowerCase() });
      if (user) {
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save({ validateBeforeSave: false });
      }
    }

    logError("Forgot password failed - server error", {
      error: error.message,
      stack: error.stack,
      email: req.body.email,
    });

    next(error);
  }
};

/**
 * Reset password - Validate token and update password
 * @route POST /api/auth/reset-password
 * @access Public
 */
const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    logInfo("Password reset attempt", {
      hasToken: !!token,
      ip: req.ip,
      userAgent: req.get("User-Agent"),
    });

    // Validate required fields
    if (!token || !password) {
      return sendValidationError(res, "Token and new password are required");
    }

    // Validate password strength
    if (password.length < 8) {
      return sendValidationError(res, "Password must be at least 8 characters");
    }

    // Hash the token and find user
    const crypto = require("crypto");
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findByResetToken(hashedToken);

    if (!user) {
      logWarning("Invalid or expired reset token used", { hashedToken });
      return sendError(res, "Invalid or expired password reset token", 400);
    }

    // Check if user is active
    if (!user.isActive) {
      logWarning("Password reset attempt for inactive user", {
        userId: user._id,
      });
      return sendError(res, "Account is deactivated", 401);
    }

    // Update password and clear reset fields
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    // Generate new JWT token
    const authToken = user.generateAuthToken();

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
      },
      token: authToken,
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    };

    logInfo("Password reset successful", {
      userId: user._id,
      email: user.email,
    });

    sendSuccess(res, responseData, "Password reset successful", 200);
  } catch (error) {
    logError("Reset password failed - server error", {
      error: error.message,
      stack: error.stack,
    });

    next(error);
  }
};

/**
 * Change user password
 * @route PUT /api/auth/change-password
 * @access Private
 */
const changePassword = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const { currentPassword, newPassword } = req.body;

    if (!userId) {
      const errorObj = createError("AUTH", "UNAUTHORIZED");
      return sendError(res, errorObj.message, 401);
    }

    // Validate required fields
    if (!currentPassword || !newPassword) {
      return sendValidationError(
        res,
        "Current password and new password are required"
      );
    }

    // Validate new password strength
    if (newPassword.length < 8) {
      return sendValidationError(
        res,
        "New password must be at least 8 characters long"
      );
    }

    // Find user with password included
    const user = await User.findByEmailWithPassword(req.user.email);

    if (!user) {
      const errorObj = createError("AUTH", "USER_NOT_FOUND");
      return sendError(res, errorObj.message, 404);
    }

    // Check if user is active
    if (!user.isActive) {
      const errorObj = createError("AUTH", "ACCOUNT_LOCKED");
      return sendError(res, errorObj.message, 401);
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);

    if (!isCurrentPasswordValid) {
      logWarning("Password change attempt with invalid current password", {
        userId: user._id,
        email: user.email,
      });
      return sendValidationError(res, "Current password is incorrect");
    }

    // Check if new password is different from current
    const isSamePassword = await user.comparePassword(newPassword);
    if (isSamePassword) {
      return sendValidationError(
        res,
        "New password must be different from current password"
      );
    }

    // Update password (the User model will automatically hash it)
    user.password = newPassword;
    await user.save();

    logInfo("Password changed successfully", {
      userId: user._id,
      email: user.email,
    });

    sendSuccess(res, null, "Password changed successfully", 200);
  } catch (error) {
    logError("Change password failed - server error", {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id,
    });

    next(error);
  }
};

const { OAuth2Client } = require("google-auth-library");
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * Google OAuth login
 * @route POST /api/auth/google
 * @access Public
 */
const googleLogin = async (req, res, next) => {
  try {
    const { token } = req.body;

    logInfo("Google login attempt", {
      hasToken: !!token,
      ip: req.ip,
    });

    if (!token) {
      return sendError(res, "Google token is required", 400);
    }

    // Verify Google token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    logInfo("Google token verified", { email, name });

    // Check if user exists
    let user = await User.findOne({
      $or: [{ email: email }, { googleId: googleId }],
    });

    if (user) {
      // Update existing user
      user.googleId = googleId;
      user.authProvider = "google";
      user.isEmailVerified = true; // Google emails are pre-verified
      user.lastLogin = new Date();
      if (picture) user.profilePicture = picture;
      await user.save();
    } else {
      // Create new user
      user = new User({
        firstName: name.split(" ")[0] || name,
        lastName: name.split(" ").slice(1).join(" ") || "",
        email: email,
        googleId: googleId,
        authProvider: "google",
        role: "client",
        isEmailVerified: true,
        profilePicture: picture,
        lastLogin: new Date(),
      });
      await user.save();
    }

    // Generate JWT token
    const jwtToken = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || "7d" }
    );

    const userData = {
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: `${user.firstName} ${user.lastName}`.trim(),
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        profilePicture: user.profilePicture,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
      },
      token: jwtToken,
      expiresIn: process.env.JWT_EXPIRE || "7d",
    };

    logInfo("Google login successful", {
      userId: user._id,
      email: user.email,
      role: user.role,
      isNewUser: !user.lastLogin,
    });

    sendSuccess(res, userData, "Google login successful", 200);
  } catch (error) {
    if (error.message.includes("Token used too late")) {
      logError("Google token expired", { error: error.message });
      return sendError(res, "Google token has expired", 401);
    }

    logError("Google login error", {
      error: error.message,
      stack: error.stack,
    });

    next(error);
  }
};

/**
 * Refresh access token
 * @route POST /api/auth/refresh
 * @access Public
 */
const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return sendError(res, "Refresh token is required", 400);
    }

    // Verify refresh token
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
    );

    // Find user and check if refresh token exists
    const user = await User.findById(decoded.id);
    if (!user) {
      return sendError(res, "User not found", 404);
    }

    // Check if refresh token exists in user's tokens
    const tokenExists = user.refreshTokens.some(
      (rt) => rt.token === refreshToken && rt.expiresAt > new Date()
    );
    if (!tokenExists) {
      return sendError(res, "Invalid refresh token", 401);
    }

    // Generate new access token
    const newAccessToken = user.generateAuthToken();

    logInfo("Token refreshed successfully", {
      userId: user._id,
      email: user.email,
    });

    sendSuccess(
      res,
      {
        token: newAccessToken,
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          isEmailVerified: user.isEmailVerified,
        },
      },
      "Token refreshed successfully",
      200
    );
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return sendError(res, "Invalid refresh token", 401);
    }
    if (error.name === "TokenExpiredError") {
      return sendError(res, "Refresh token expired", 401);
    }

    logError("Token refresh failed", {
      error: error.message,
      stack: error.stack,
    });
    next(error);
  }
};

/**
 * Logout user (invalidate refresh token)
 * @route POST /api/auth/logout
 * @access Private
 */
const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const user = req.user;

    if (refreshToken) {
      user.removeRefreshToken(refreshToken);
      await user.save();
    }

    logInfo("User logged out", {
      userId: user._id,
      email: user.email,
    });

    sendSuccess(res, null, "Logged out successfully", 200);
  } catch (error) {
    logError("Logout failed", {
      error: error.message,
      userId: req.user?._id,
    });
    next(error);
  }
};

/**
 * Logout from all devices
 * @route POST /api/auth/logout-all
 * @access Private
 */
const logoutAllDevices = async (req, res, next) => {
  try {
    const user = req.user;

    user.removeAllRefreshTokens();
    await user.save();

    logInfo("User logged out from all devices", {
      userId: user._id,
      email: user.email,
    });

    sendSuccess(res, null, "Logged out from all devices successfully", 200);
  } catch (error) {
    logError("Logout all devices failed", {
      error: error.message,
      userId: req.user?._id,
    });
    next(error);
  }
};

module.exports = {
  register,
  login,
  getCurrentUser,
  updateCurrentUser,
  sendVerificationEmail,
  changePassword,
  forgotPassword,
  resetPassword,
  verifyEmail,
  googleLogin,
  refreshToken,
  logout,
  logoutAllDevices,
};
