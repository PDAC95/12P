// src/models/Property.ts
import mongoose, { Schema, Model } from "mongoose";
import { IProperty, ILocation, PropertyType, PropertyStatus } from "../types";

// Location sub-schema
const locationSchema = new Schema<ILocation>(
  {
    address: {
      type: String,
      required: [true, "Address is required"],
      trim: true,
      minlength: [5, "Address must be at least 5 characters"],
      maxlength: [200, "Address cannot exceed 200 characters"],
    },
    city: {
      type: String,
      required: [true, "City is required"],
      trim: true,
      minlength: [2, "City must be at least 2 characters"],
      maxlength: [50, "City cannot exceed 50 characters"],
    },
    province: {
      type: String,
      required: [true, "Province is required"],
      trim: true,
      minlength: [2, "Province must be at least 2 characters"],
      maxlength: [50, "Province cannot exceed 50 characters"],
    },
    postalCode: {
      type: String,
      required: [true, "Postal code is required"],
      trim: true,
      match: [
        /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/,
        "Please provide a valid Canadian postal code",
      ],
    },
    coordinates: {
      type: [Number],
      required: [true, "Coordinates are required"],
      validate: {
        validator: function (coords: number[]) {
          return (
            coords.length === 2 &&
            coords[0] >= -180 &&
            coords[0] <= 180 && // longitude
            coords[1] >= -90 &&
            coords[1] <= 90
          ); // latitude
        },
        message: "Coordinates must be [longitude, latitude] with valid values",
      },
      index: "2dsphere", // Enable geospatial queries
    },
  },
  { _id: false }
);

// Property schema definition
const propertySchema = new Schema<IProperty>(
  {
    title: {
      type: String,
      required: [true, "Property title is required"],
      trim: true,
      minlength: [10, "Title must be at least 10 characters"],
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    description: {
      type: String,
      required: [true, "Property description is required"],
      trim: true,
      minlength: [20, "Description must be at least 20 characters"],
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },
    price: {
      type: Number,
      required: [true, "Property price is required"],
      min: [0, "Price cannot be negative"],
      max: [100000000, "Price cannot exceed $100,000,000"],
    },
    location: {
      type: locationSchema,
      required: [true, "Property location is required"],
    },
    type: {
      type: String,
      required: [true, "Property type is required"],
      enum: {
        values: [
          "Condo",
          "Detached House",
          "Townhouse",
          "Bungalow",
          "Loft",
          "Apartment",
          "Commercial",
          "Land",
        ] as PropertyType[],
        message:
          "Property type must be one of: Condo, Detached House, Townhouse, Bungalow, Loft, Apartment, Commercial, Land",
      },
    },
    bedrooms: {
      type: Number,
      required: [true, "Number of bedrooms is required"],
      min: [0, "Bedrooms cannot be negative"],
      max: [20, "Bedrooms cannot exceed 20"],
    },
    bathrooms: {
      type: Number,
      required: [true, "Number of bathrooms is required"],
      min: [0, "Bathrooms cannot be negative"],
      max: [20, "Bathrooms cannot exceed 20"],
    },
    area: {
      type: Number,
      required: [true, "Property area is required"],
      min: [1, "Area must be at least 1 square foot"],
      max: [1000000, "Area cannot exceed 1,000,000 square feet"],
    },
    features: {
      type: [String],
      default: [],
      validate: {
        validator: function (features: string[]) {
          return features.length <= 50;
        },
        message: "Cannot have more than 50 features",
      },
    },
    images: {
      type: [String],
      default: [],
      validate: {
        validator: function (images: string[]) {
          return images.length <= 20;
        },
        message: "Cannot have more than 20 images",
      },
    },
    status: {
      type: String,
      required: [true, "Property status is required"],
      enum: {
        values: [
          "active",
          "sold",
          "pending",
          "draft",
          "inactive",
        ] as PropertyStatus[],
        message:
          "Status must be one of: active, sold, pending, draft, inactive",
      },
      default: "draft",
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Property owner is required"],
    },
    views: {
      type: Number,
      default: 0,
      min: [0, "Views cannot be negative"],
    },
    featured: {
      type: Boolean,
      default: false,
    },
    listingDate: {
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
propertySchema.index({ status: 1 });
propertySchema.index({ type: 1 });
propertySchema.index({ price: 1 });
propertySchema.index({ bedrooms: 1 });
propertySchema.index({ bathrooms: 1 });
propertySchema.index({ area: 1 });
propertySchema.index({ owner: 1 });
propertySchema.index({ featured: 1 });
propertySchema.index({ listingDate: -1 });
propertySchema.index({ "location.city": 1 });
propertySchema.index({ "location.province": 1 });
propertySchema.index({ "location.coordinates": "2dsphere" });

// Compound indexes for common queries
propertySchema.index({ status: 1, type: 1 });
propertySchema.index({ status: 1, price: 1 });
propertySchema.index({ status: 1, "location.city": 1 });

// Text index for search functionality
propertySchema.index({
  title: "text",
  description: "text",
  "location.address": "text",
  "location.city": "text",
  features: "text",
});

// Pre-save middleware to set listing date when status changes to active
propertySchema.pre("save", function (next) {
  if (
    this.isModified("status") &&
    this.status === "active" &&
    !this.listingDate
  ) {
    this.listingDate = new Date();
  }
  next();
});

// Instance method to increment views
propertySchema.methods.incrementViews = function () {
  this.views += 1;
  return this.save();
};

// Instance method to get formatted price
propertySchema.methods.getFormattedPrice = function (): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(this.price);
};

// Instance method to get full address
propertySchema.methods.getFullAddress = function (): string {
  return `${this.location.address}, ${this.location.city}, ${this.location.province} ${this.location.postalCode}`;
};

// Instance method to check if property is available
propertySchema.methods.isAvailable = function (): boolean {
  return this.status === "active";
};

// Static method to find properties by location
propertySchema.statics.findByLocation = function (
  city: string,
  province?: string
) {
  const query: any = { "location.city": new RegExp(city, "i") };
  if (province) {
    query["location.province"] = new RegExp(province, "i");
  }
  return this.find(query);
};

// Static method to find properties within price range
propertySchema.statics.findByPriceRange = function (
  minPrice: number,
  maxPrice: number
) {
  return this.find({
    price: { $gte: minPrice, $lte: maxPrice },
  });
};

// Static method to find properties near coordinates
propertySchema.statics.findNearLocation = function (
  coordinates: [number, number],
  maxDistance: number = 10000
) {
  return this.find({
    "location.coordinates": {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: coordinates,
        },
        $maxDistance: maxDistance, // in meters
      },
    },
  });
};

// Static method to get featured properties
propertySchema.statics.getFeatured = function (limit: number = 6) {
  return this.find({ featured: true, status: "active" })
    .limit(limit)
    .sort({ listingDate: -1 });
};

// Virtual for price per square foot
propertySchema.virtual("pricePerSqFt").get(function () {
  return Math.round(this.price / this.area);
});

// Virtual for property age in days
propertySchema.virtual("daysOnMarket").get(function () {
  if (this.listingDate) {
    return Math.floor(
      (Date.now() - this.listingDate.getTime()) / (1000 * 60 * 60 * 24)
    );
  }
  return 0;
});

// Create and export the model
const Property: Model<IProperty> = mongoose.model<IProperty>(
  "Property",
  propertySchema
);

export default Property;
