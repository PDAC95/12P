// backend/src/utils/generateMoreProperties.js
const mongoose = require("mongoose");
const Property = require("../models/Property");
const { logInfo, logError } = require("./logger");

console.log("🚀 Starting property generation script...");

// Arrays of data for generating diverse properties
const propertyData = {
  cities: [
    "Kitchener",
    "Waterloo",
    "Cambridge",
    "Guelph",
    "Baden",
    "Toronto",
    "London",
    "Hamilton",
  ],
  types: [
    "Condo",
    "Detached House",
    "Townhouse",
    "Bungalow",
    "Loft",
    "Apartment",
  ],
  streets: [
    "King Street",
    "Queen Street",
    "Main Street",
    "Victoria Street",
    "University Avenue",
    "Weber Street",
    "Columbia Street",
    "Erb Street",
  ],
  features: [
    ["Air Conditioning", "Heating", "Parking", "Balcony"],
    ["Garage", "Garden", "Fireplace", "Pet Friendly"],
    ["Swimming Pool", "Gym", "Security System", "Elevator"],
    ["Dishwasher", "Laundry", "Storage", "Furnished"],
  ],
  images: [
    "https://images.unsplash.com/photo-1554995207-c18c203602cb?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
    "https://images.unsplash.com/photo-1560184897-ae75f418493e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
    "https://images.unsplash.com/photo-1494526585095-c41746248156?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
    "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
    "https://images.unsplash.com/photo-1523217582562-09d0def993a6?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
    "https://images.unsplash.com/photo-1570129477492-45c003edd2be?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
  ],
};

// Function to generate random properties
const generateProperties = (count = 50) => {
  console.log(`📝 Generating ${count} properties...`);
  const properties = [];

  for (let i = 0; i < count; i++) {
    const city =
      propertyData.cities[
        Math.floor(Math.random() * propertyData.cities.length)
      ];
    const type =
      propertyData.types[Math.floor(Math.random() * propertyData.types.length)];
    const street =
      propertyData.streets[
        Math.floor(Math.random() * propertyData.streets.length)
      ];
    const streetNumber = Math.floor(Math.random() * 999) + 1;
    const postalCode = `N${Math.floor(Math.random() * 9)}${String.fromCharCode(
      65 + Math.floor(Math.random() * 26)
    )} ${Math.floor(Math.random() * 9)}${String.fromCharCode(
      65 + Math.floor(Math.random() * 26)
    )}${Math.floor(Math.random() * 9)}`;

    // Generate price based on type
    let basePrice = 300000;
    switch (type) {
      case "Detached House":
        basePrice = 500000 + Math.random() * 500000;
        break;
      case "Townhouse":
        basePrice = 400000 + Math.random() * 300000;
        break;
      case "Condo":
      case "Apartment":
        basePrice = 250000 + Math.random() * 350000;
        break;
      case "Bungalow":
        basePrice = 450000 + Math.random() * 350000;
        break;
      case "Loft":
        basePrice = 350000 + Math.random() * 250000;
        break;
    }

    // Generate bedrooms and bathrooms based on type
    let bedrooms = 1;
    let bathrooms = 1;
    let area = 600;

    switch (type) {
      case "Detached House":
      case "Bungalow":
        bedrooms = Math.floor(Math.random() * 3) + 3; // 3-5
        bathrooms = Math.floor(Math.random() * 2) + 2; // 2-3
        area = 1500 + Math.floor(Math.random() * 1500); // 1500-3000
        break;
      case "Townhouse":
        bedrooms = Math.floor(Math.random() * 2) + 2; // 2-3
        bathrooms = Math.floor(Math.random() * 2) + 1.5; // 1.5-2.5
        area = 1200 + Math.floor(Math.random() * 800); // 1200-2000
        break;
      case "Condo":
      case "Apartment":
        bedrooms = Math.floor(Math.random() * 3) + 1; // 1-3
        bathrooms = Math.floor(Math.random() * 2) + 1; // 1-2
        area = 600 + Math.floor(Math.random() * 900); // 600-1500
        break;
      case "Loft":
        bedrooms = Math.floor(Math.random() * 2) + 1; // 1-2
        bathrooms = 1;
        area = 700 + Math.floor(Math.random() * 500); // 700-1200
        break;
    }

    const property = {
      title: `${
        [
          "Modern",
          "Beautiful",
          "Spacious",
          "Cozy",
          "Luxury",
          "Updated",
          "Charming",
        ][Math.floor(Math.random() * 7)]
      } ${type} in ${city}`,
      description: `This ${type.toLowerCase()} features ${bedrooms} bedrooms and ${bathrooms} bathrooms with ${area} sqft of living space. Located in a prime area of ${city} with easy access to amenities.`,
      price: Math.round(basePrice / 1000) * 1000, // Round to nearest thousand
      location: {
        address: `${streetNumber} ${street}`,
        city: city,
        province: "Ontario",
        postalCode: postalCode,
        coordinates: {
          latitude: 43.4516 + (Math.random() - 0.5) * 0.5,
          longitude: -80.4925 + (Math.random() - 0.5) * 0.5,
        },
      },
      type: type,
      bedrooms: bedrooms,
      bathrooms: bathrooms,
      area: area,
      features:
        propertyData.features[
          Math.floor(Math.random() * propertyData.features.length)
        ],
      images: [
        {
          url: propertyData.images[
            Math.floor(Math.random() * propertyData.images.length)
          ],
          alt: `${type} exterior`,
          isPrimary: true,
        },
      ],
      status: "available",
      listingType: Math.random() > 0.8 ? "rent" : "sale", // 80% for sale, 20% for rent
      owner: "507f1f77bcf86cd799439011", // Temporary ObjectId
    };

    properties.push(property);
  }

  console.log(`✅ Generated ${properties.length} properties`);
  return properties;
};

// Function to seed the database
const seedMoreProperties = async () => {
  try {
    console.log("🔌 Connecting to MongoDB...");
    console.log(
      "📍 MongoDB URI:",
      process.env.MONGO_URI ? "Found" : "NOT FOUND!"
    );

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Check current count
    const currentCount = await Property.countDocuments();
    console.log(`📊 Current property count: ${currentCount}`);

    // Generate and insert new properties
    const newProperties = generateProperties(50); // Generate 50 more properties
    console.log("💾 Inserting properties into database...");

    const insertedProperties = await Property.insertMany(newProperties);

    console.log(
      `✅ Successfully added ${insertedProperties.length} new properties`
    );
    console.log(
      `📊 Total properties now: ${currentCount + insertedProperties.length}`
    );

    // Disconnect
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding properties:", error.message);
    console.error("Stack:", error.stack);
    process.exit(1);
  }
};

// Run if called directly
if (require.main === module) {
  console.log("📂 Loading environment variables...");
  require("dotenv").config();
  seedMoreProperties();
}

module.exports = { generateProperties, seedMoreProperties };
