// backend/src/utils/updateRentalPrices.js
const mongoose = require("mongoose");
const Property = require("../models/Property");
require("dotenv").config();

const updateRentalPrices = async () => {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // First, let's update rental prices to be more realistic (monthly rent)
    console.log("💰 Updating rental prices...");

    const rentalProperties = await Property.find({ listingType: "rent" });
    console.log(`📊 Found ${rentalProperties.length} rental properties`);

    for (const property of rentalProperties) {
      // Convert sale price to monthly rent (roughly 0.4-0.6% of property value)
      const monthlyRent = Math.round((property.price * 0.005) / 100) * 100;

      // Update based on property type
      let adjustedRent = monthlyRent;
      switch (property.type) {
        case "Condo":
        case "Apartment":
          adjustedRent = Math.min(monthlyRent, 2500); // Cap at $2500
          adjustedRent = Math.max(adjustedRent, 1200); // Min $1200
          break;
        case "Townhouse":
          adjustedRent = Math.min(monthlyRent, 3500); // Cap at $3500
          adjustedRent = Math.max(adjustedRent, 1800); // Min $1800
          break;
        case "Detached House":
        case "Bungalow":
          adjustedRent = Math.min(monthlyRent, 4500); // Cap at $4500
          adjustedRent = Math.max(adjustedRent, 2200); // Min $2200
          break;
        case "Loft":
          adjustedRent = Math.min(monthlyRent, 2800); // Cap at $2800
          adjustedRent = Math.max(adjustedRent, 1500); // Min $1500
          break;
      }

      property.price = adjustedRent;
      await property.save();
      console.log(
        `✅ Updated ${property.title} - New rent: $${adjustedRent}/month`
      );
    }

    // Now, let's create some co-living specific properties
    console.log("\n🏠 Creating co-living properties...");

    const coLivingProperties = [];
    const coLivingCities = ["Waterloo", "Toronto", "Kitchener"];
    const roomTypes = ["Single Room", "Shared Room", "Master Bedroom"];

    for (let i = 0; i < 10; i++) {
      const city =
        coLivingCities[Math.floor(Math.random() * coLivingCities.length)];
      const roomType = roomTypes[Math.floor(Math.random() * roomTypes.length)];

      // Co-living prices (per room, monthly)
      let price = 600;
      switch (roomType) {
        case "Single Room":
          price = 600 + Math.floor(Math.random() * 400); // $600-$1000
          break;
        case "Shared Room":
          price = 400 + Math.floor(Math.random() * 300); // $400-$700
          break;
        case "Master Bedroom":
          price = 800 + Math.floor(Math.random() * 500); // $800-$1300
          break;
      }

      const property = {
        title: `Co-Living ${roomType} in ${city}`,
        description: `${roomType} available in a shared house with common areas. Perfect for students and young professionals. All utilities included, furnished, weekly cleaning of common areas.`,
        price: price,
        location: {
          address: `${Math.floor(Math.random() * 999) + 1} Student Street`,
          city: city,
          province: "Ontario",
          postalCode: `N2L ${Math.floor(Math.random() * 9)}A${Math.floor(
            Math.random() * 9
          )}`,
          coordinates: {
            latitude: 43.4643 + (Math.random() - 0.5) * 0.1,
            longitude: -80.5204 + (Math.random() - 0.5) * 0.1,
          },
        },
        type: "Apartment", // Using Apartment type for co-living
        bedrooms: roomType === "Shared Room" ? 0 : 1, // 0 for shared, 1 for private
        bathrooms: 1,
        area: roomType === "Master Bedroom" ? 200 : 150,
        features: [
          "Furnished",
          "Utilities Included",
          "Internet",
          "Laundry",
          "Kitchen Access",
          "Common Areas",
        ],
        images: [
          {
            url: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
            alt: "Co-living space",
            isPrimary: true,
          },
        ],
        status: "available",
        listingType: "rent",
        owner: "507f1f77bcf86cd799439011",
        // Add a custom field to identify co-living (we'll use this in frontend)
        isCoLiving: true,
      };

      coLivingProperties.push(property);
    }

    // Insert co-living properties
    const inserted = await Property.insertMany(coLivingProperties);
    console.log(`✅ Created ${inserted.length} co-living properties`);

    // Show summary
    const totalCount = await Property.countDocuments();
    const saleCount = await Property.countDocuments({ listingType: "sale" });
    const rentCount = await Property.countDocuments({ listingType: "rent" });

    console.log("\n📊 Final Summary:");
    console.log(`Total properties: ${totalCount}`);
    console.log(`For Sale: ${saleCount}`);
    console.log(`For Rent: ${rentCount} (including co-living)`);

    await mongoose.disconnect();
    console.log("\n🔌 Disconnected from MongoDB");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
};

updateRentalPrices();
