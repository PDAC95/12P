// Import the Express application
const app = require("./app");
const connectDB = require("./config/database");
const { seedProperties } = require("./utils/seedData");
const { logInfo, logError } = require("./utils/logger");

// Get configuration from environment variables
const PORT = process.env.PORT || 5001;
const HOST = process.env.HOST || "localhost";
const NODE_ENV = process.env.NODE_ENV || "development";

// Connect to MongoDB before starting the server
const startServer = async () => {
  try {
    // Connect to database
    await connectDB();

    // Seed mock data in development
    if (NODE_ENV === "development") {
      await seedProperties();
    }

    // Start the server after successful database connection
    const server = app.listen(PORT, () => {
      logInfo("Server started successfully", {
        port: PORT,
        host: HOST,
        environment: NODE_ENV,
        healthCheck: `http://${HOST}:${PORT}/api/health`,
        propertiesEndpoint: `http://${HOST}:${PORT}/api/properties`,
      });

      console.log(`🚀 Server is running on http://${HOST}:${PORT}`);
      console.log(`📊 Environment: ${NODE_ENV}`);
      console.log(`🔗 Health check: http://${HOST}:${PORT}/api/health`);
      console.log(`🏠 Properties API: http://${HOST}:${PORT}/api/properties`);

      if (NODE_ENV === "development") {
        console.log(`🔧 Development mode - Auto-reload enabled`);
        console.log(`🧪 Test error: http://${HOST}:${PORT}/api/test-error`);
        console.log(`📋 Mock data loaded automatically`);
      }
    });

    // Graceful shutdown handlers
    const gracefulShutdown = (signal) => {
      logInfo(`${signal} received, shutting down gracefully`);

      server.close(async () => {
        logInfo("HTTP server closed");

        try {
          // Close database connection
          const mongoose = require("mongoose");
          await mongoose.connection.close();
          logInfo("Database connection closed");

          console.log("✅ Process terminated gracefully");
          process.exit(0);
        } catch (error) {
          logError("Error during graceful shutdown", { error: error.message });
          process.exit(1);
        }
      });

      // Force close server after 10 seconds
      setTimeout(() => {
        logError(
          "Could not close connections in time, forcefully shutting down"
        );
        process.exit(1);
      }, 10000);
    };

    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));

    // Handle unhandled promise rejections
    process.on("unhandledRejection", (err, promise) => {
      logError("Unhandled Promise Rejection", {
        error: err.message,
        stack: err.stack,
      });

      server.close(() => {
        process.exit(1);
      });
    });

    // Handle uncaught exceptions
    process.on("uncaughtException", (err) => {
      logError("Uncaught Exception", {
        error: err.message,
        stack: err.stack,
      });

      process.exit(1);
    });
  } catch (error) {
    logError("Failed to start server", {
      error: error.message,
      stack: error.stack,
    });

    console.error("💥 Failed to start server:", error.message);
    process.exit(1);
  }
};

// Start the application
startServer();
