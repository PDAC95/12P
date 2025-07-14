const Property = require("../models/Property");
const { logInfo, logError } = require("./logger");

// Mock properties data for Kitchener-Waterloo region
const mockProperties = [
  {
    title: "Modern Downtown Kitchener Condo",
    description:
      "Stunning modern condo in the heart of downtown Kitchener with city views. Features include updated kitchen, hardwood floors, and in-suite laundry.",
    price: 485000,
    location: {
      address: "123 King Street West",
      city: "Kitchener",
      province: "Ontario",
      postalCode: "N2G 1A1",
      coordinates: {
        latitude: 43.4516,
        longitude: -80.4925,
      },
    },
    type: "Condo",
    bedrooms: 2,
    bathrooms: 2,
    area: 950,
    features: [
      "Air Conditioning",
      "Heating",
      "Parking",
      "Balcony",
      "Dishwasher",
      "Laundry",
    ],
    images: [
      {
        url: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
        alt: "Modern condo living room",
        isPrimary: true,
      },
    ],
    status: "available",
    listingType: "sale",
    owner: "507f1f77bcf86cd799439011", // Temporary ObjectId
  },
  {
    title: "Family Home in Waterloo",
    description:
      "Beautiful family home near University of Waterloo with large backyard. Perfect for families with children.",
    price: 725000,
    location: {
      address: "456 University Avenue",
      city: "Waterloo",
      province: "Ontario",
      postalCode: "N2L 3G1",
      coordinates: {
        latitude: 43.4643,
        longitude: -80.5204,
      },
    },
    type: "Detached House",
    bedrooms: 4,
    bathrooms: 3,
    area: 2100,
    features: [
      "Air Conditioning",
      "Heating",
      "Garage",
      "Garden",
      "Fireplace",
      "Pet Friendly",
    ],
    images: [
      {
        url: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
        alt: "Family house exterior",
        isPrimary: true,
      },
    ],
    status: "available",
    listingType: "sale",
    owner: "507f1f77bcf86cd799439011",
  },
  {
    title: "Luxury Townhouse in Cambridge",
    description:
      "Executive townhouse in prestigious Cambridge neighborhood with modern amenities and beautiful finishes.",
    price: 650000,
    location: {
      address: "789 Preston Parkway",
      city: "Cambridge",
      province: "Ontario",
      postalCode: "N3H 4R6",
      coordinates: {
        latitude: 43.3601,
        longitude: -80.3144,
      },
    },
    type: "Townhouse",
    bedrooms: 3,
    bathrooms: 2,
    area: 1650,
    features: [
      "Air Conditioning",
      "Heating",
      "Parking",
      "Balcony",
      "Security System",
    ],
    images: [
      {
        url: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
        alt: "Luxury townhouse",
        isPrimary: true,
      },
    ],
    status: "available",
    listingType: "sale",
    owner: "507f1f77bcf86cd799439011",
  },
  {
    title: "Cozy Bungalow in Baden",
    description:
      "Charming bungalow in quiet Baden community with modern updates and peaceful surroundings.",
    price: 525000,
    location: {
      address: "321 Baden Hills Drive",
      city: "Baden",
      province: "Ontario",
      postalCode: "N3A 3K2",
      coordinates: {
        latitude: 43.3267,
        longitude: -80.6444,
      },
    },
    type: "Bungalow",
    bedrooms: 3,
    bathrooms: 2,
    area: 1400,
    features: ["Heating", "Garage", "Garden", "Pet Friendly"],
    images: [
      {
        url: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
        alt: "Cozy bungalow",
        isPrimary: true,
      },
    ],
    status: "available",
    listingType: "sale",
    owner: "507f1f77bcf86cd799439011",
  },
  {
    title: "Executive Loft in Uptown Waterloo",
    description:
      "Industrial chic loft in trendy Uptown Waterloo with exposed brick and modern amenities.",
    price: 395000,
    location: {
      address: "555 King Street North",
      city: "Waterloo",
      province: "Ontario",
      postalCode: "N2J 2Z5",
      coordinates: {
        latitude: 43.4653,
        longitude: -80.5204,
      },
    },
    type: "Loft",
    bedrooms: 1,
    bathrooms: 1,
    area: 750,
    features: [
      "Air Conditioning",
      "Heating",
      "Parking",
      "Dishwasher",
      "Laundry",
    ],
    images: [
      {
        url: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
        alt: "Executive loft",
        isPrimary: true,
      },
    ],
    status: "available",
    listingType: "sale",
    owner: "507f1f77bcf86cd799439011",
  },
  // Add these coliving properties to the mockProperties array
  {
    title: "Modern Co-Living Space Downtown",
    description:
      "Shared living space in downtown Kitchener with private bedrooms and shared common areas. Perfect for young professionals.",
    price: 800, // Monthly rent per room
    location: {
      address: "789 King Street East",
      city: "Kitchener",
      province: "Ontario",
      postalCode: "N2G 2N1",
      coordinates: {
        latitude: 43.4516,
        longitude: -80.4825,
      },
    },
    type: "Condo",
    bedrooms: 1, // Private bedroom
    bathrooms: 1, // Shared bathrooms
    area: 250, // Private room area
    features: [
      "Furnished",
      "WiFi Included",
      "Utilities Included",
      "Shared Kitchen",
      "Laundry",
      "Gym Access",
    ],
    images: [
      {
        url: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
        alt: "Co-living common area",
        isPrimary: true,
      },
    ],
    status: "available",
    listingType: "coliving", // Set as coliving
    owner: "507f1f77bcf86cd799439011",
  },
  {
    title: "Student Co-Living Near University",
    description:
      "Affordable co-living space near University of Waterloo. All-inclusive pricing with furnished rooms.",
    price: 650,
    location: {
      address: "234 Lester Street",
      city: "Waterloo",
      province: "Ontario",
      postalCode: "N2L 3W2",
      coordinates: {
        latitude: 43.4723,
        longitude: -80.5449,
      },
    },
    type: "Townhouse",
    bedrooms: 1,
    bathrooms: 1,
    area: 200,
    features: [
      "Furnished",
      "All Inclusive",
      "Study Room",
      "Shared Kitchen",
      "Parking",
      "Near Campus",
    ],
    images: [
      {
        url: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
        alt: "Student co-living space",
        isPrimary: true,
      },
    ],
    status: "available",
    listingType: "coliving",
    owner: "507f1f77bcf86cd799439011",
  },
];

/**
 * Seed the database with mock property data
 */
const seedProperties = async () => {
  try {
    // Check if properties already exist
    const existingCount = await Property.countDocuments();

    if (existingCount > 0) {
      logInfo("Properties already exist in database", { count: existingCount });
      return;
    }

    // Insert mock properties
    const properties = await Property.insertMany(mockProperties);

    logInfo("Mock properties seeded successfully", {
      count: properties.length,
      properties: properties.map((p) => ({ id: p._id, title: p.title })),
    });

    console.log(`✅ Seeded ${properties.length} mock properties`);
  } catch (error) {
    logError("Error seeding mock properties", {
      error: error.message,
      stack: error.stack,
    });

    console.error("💥 Error seeding properties:", error.message);
  }
};

module.exports = { seedProperties };
