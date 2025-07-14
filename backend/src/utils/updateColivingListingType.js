const mongoose = require("mongoose");
const Property = require("../models/Property");
const { logInfo, logError } = require("./logger");
require("dotenv").config();

/**
 * Script to update coliving properties from listingType 'rent' to 'coliving'
 */
const updateColivingListingType = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/plaice"
    );
    logInfo("Connected to MongoDB for coliving update");

    // Find all properties that are colivings but have listingType 'rent'
    // We'll identify them by keywords in the title or description
    const colivingKeywords = [
      "co-living",
      "coliving",
      "co living",
      "shared room",
      "shared house",
      "shared living",
    ];

    // Create regex pattern for case-insensitive search
    const regexPattern = new RegExp(colivingKeywords.join("|"), "i");

    // Find properties that match coliving patterns but have listingType 'rent'
    const colivingProperties = await Property.find({
      listingType: "rent",
      $or: [{ title: regexPattern }, { description: regexPattern }],
    });

    logInfo(`Found ${colivingProperties.length} coliving properties to update`);

    // Update each property
    let updatedCount = 0;
    for (const property of colivingProperties) {
      console.log(`Updating: ${property.title}`);
      property.listingType = "coliving";
      await property.save();
      updatedCount++;
    }

    logInfo(`Successfully updated ${updatedCount} coliving properties`);

    // Also check if there are any properties already marked as coliving
    const existingColivings = await Property.countDocuments({
      listingType: "coliving",
    });
    logInfo(
      `Total coliving properties in database: ${
        existingColivings + updatedCount
      }`
    );

    // Show summary of all listing types
    const summary = await Property.aggregate([
      {
        $group: {
          _id: "$listingType",
          count: { $sum: 1 },
        },
      },
    ]);

    console.log("\n📊 Listing Type Summary:");
    summary.forEach((item) => {
      console.log(`   ${item._id}: ${item.count} properties`);
    });

    process.exit(0);
  } catch (error) {
    logError("Error updating coliving properties", {
      error: error.message,
      stack: error.stack,
    });
    process.exit(1);
  }
};

// Run the update if this file is executed directly
if (require.main === module) {
  updateColivingListingType();
}

module.exports = updateColivingListingType;
