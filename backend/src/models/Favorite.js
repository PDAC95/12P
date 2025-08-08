// backend/src/models/Favorite.js

const mongoose = require("mongoose");

/**
 * Favorite model to track user's favorite properties
 * This creates a many-to-many relationship between users and properties
 */
const favoriteSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
      index: true,
    },
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: [true, "Property reference is required"],
      index: true,
    },
    notes: {
      type: String,
      maxlength: [500, "Notes cannot be more than 500 characters"],
      trim: true,
      default: "",
    },
    tags: [
      {
        type: String,
        trim: true,
        maxlength: [50, "Tag cannot be more than 50 characters"],
      },
    ],
    addedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound index to ensure a user can't favorite the same property twice
favoriteSchema.index({ user: 1, property: 1 }, { unique: true });

// Index for efficient queries
favoriteSchema.index({ user: 1, addedAt: -1 }); // Get user's favorites sorted by date
favoriteSchema.index({ property: 1 }); // Count how many users favorited a property

// Static method to get user's favorites count
favoriteSchema.statics.getUserFavoritesCount = async function (userId) {
  return await this.countDocuments({ user: userId });
};

// Static method to check if user has favorited a property
favoriteSchema.statics.isFavorited = async function (userId, propertyId) {
  const favorite = await this.findOne({
    user: userId,
    property: propertyId,
  });
  return !!favorite;
};

// Static method to get property's favorite count
favoriteSchema.statics.getPropertyFavoriteCount = async function (propertyId) {
  return await this.countDocuments({ property: propertyId });
};

// Instance method to populate property details
favoriteSchema.methods.populateProperty = async function () {
  return await this.populate({
    path: "property",
    select:
      "title price location images type bedrooms bathrooms area status listingType",
  });
};

module.exports = mongoose.model("Favorite", favoriteSchema);
