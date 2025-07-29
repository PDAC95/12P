const User = require("../models/User");
const { sendSuccess, sendError } = require("../utils/apiResponse");
const { logInfo, logError, logWarning } = require("../utils/logger");

/**
 * Get public user profile by ID
 * @route GET /api/users/:id
 * @access Public
 */
const getPublicUserProfile = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate ID format
    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return sendError(res, "Invalid user ID format", 400);
    }

    // Find user by ID (only public fields)
    const user = await User.findById(id).select(
      "firstName lastName fullName role isEmailVerified createdAt agentInfo"
    );

    if (!user) {
      logWarning("Public profile requested for non-existent user", {
        userId: id,
      });
      return sendError(res, "User not found", 404);
    }

    // Prepare public profile data
    const publicProfile = {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      memberSince: user.createdAt,
    };

    // Add agent info if user is an agent
    if (user.role === "agent" && user.agentInfo) {
      publicProfile.agentInfo = {
        agency: user.agentInfo.agency,
        experience: user.agentInfo.experience,
        specializations: user.agentInfo.specializations,
      };
    }

    logInfo("Public user profile retrieved", {
      userId: user._id,
      requestedBy: req.ip,
    });

    sendSuccess(
      res,
      { user: publicProfile },
      "Public profile retrieved successfully",
      200
    );
  } catch (error) {
    logError("Get public user profile failed - server error", {
      error: error.message,
      stack: error.stack,
      userId: req.params.id,
    });

    next(error);
  }
};

module.exports = {
  getPublicUserProfile,
};
