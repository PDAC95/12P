const mongoose = require("mongoose");
const { logInfo, logError, logWarning } = require("../utils/logger");

/**
 * Connect to MongoDB database
 */
const connectDB = async () => {
  try {
    // Check if MONGO_URI is provided
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI environment variable is not defined");
    }

    // MongoDB connection options (updated for newer versions)
    const options = {
      // Remove deprecated options and use only supported ones
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    logInfo("Attempting to connect to MongoDB", {
      uri: process.env.MONGO_URI ? "URI provided" : "No URI provided",
    });

    const conn = await mongoose.connect(process.env.MONGO_URI, options);

    logInfo("MongoDB Connected Successfully", {
      host: conn.connection.host,
      port: conn.connection.port,
      database: conn.connection.name,
    });

    // Connection event listeners
    mongoose.connection.on("disconnected", () => {
      logWarning("MongoDB disconnected");
    });

    mongoose.connection.on("reconnected", () => {
      logInfo("MongoDB reconnected");
    });

    mongoose.connection.on("error", (err) => {
      logError("MongoDB connection error", { error: err.message });
    });

    return conn;
  } catch (error) {
    logError("MongoDB connection failed", {
      error: error.message,
      stack: error.stack,
    });

    // Exit process with failure
    process.exit(1);
  }
};

module.exports = connectDB;
