const mongoose = require("mongoose");

// Property schema definition
const propertySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Property title is required"],
      trim: true,
      maxlength: [200, "Title cannot be more than 200 characters"],
    },
    description: {
      type: String,
      required: [true, "Property description is required"],
      trim: true,
      maxlength: [2000, "Description cannot be more than 2000 characters"],
    },
    price: {
      type: Number,
      required: [true, "Property price is required"],
      min: [0, "Price cannot be negative"],
    },
    location: {
      address: {
        type: String,
        required: [true, "Property address is required"],
        trim: true,
      },
      city: {
        type: String,
        required: [true, "City is required"],
        trim: true,
      },
      province: {
        type: String,
        required: [true, "Province is required"],
        trim: true,
      },
      postalCode: {
        type: String,
        trim: true,
      },
      coordinates: {
        latitude: Number,
        longitude: Number,
      },
    },
    type: {
      type: String,
      required: [true, "Property type is required"],
      enum: [
        "Condo",
        "Detached House",
        "Townhouse",
        "Bungalow",
        "Loft",
        "Apartment",
        "Commercial",
        "Land",
      ],
      trim: true,
    },
    bedrooms: {
      type: Number,
      min: [0, "Bedrooms cannot be negative"],
      default: 0,
    },
    bathrooms: {
      type: Number,
      min: [0, "Bathrooms cannot be negative"],
      default: 0,
    },
    area: {
      type: Number,
      min: [0, "Area cannot be negative"],
      required: [true, "Property area is required"],
    },
    features: [
      {
        type: String,
        trim: true,
      },
    ],
    images: [
      {
        url: {
          type: String,
          required: true,
        },
        alt: {
          type: String,
          default: "",
        },
        isPrimary: {
          type: Boolean,
          default: false,
        },
      },
    ],
    walkthrough_video: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ["available", "sold", "rented", "pending"],
      default: "available",
    },
    listingType: {
      type: String,
      enum: ["sale", "rent", "coliving"], // Add 'coliving' as a third option
      required: [true, "Listing type is required"],
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
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

// Indexes for better query performance
propertySchema.index({ "location.city": 1, type: 1, status: 1 });
propertySchema.index({ price: 1, bedrooms: 1, bathrooms: 1 });
propertySchema.index({ createdAt: -1 });

// Virtual for full address
propertySchema.virtual("fullAddress").get(function () {
  return `${this.location.address}, ${this.location.city}, ${this.location.province}`;
});

module.exports = mongoose.model("Property", propertySchema);
