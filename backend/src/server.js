// Import the Express application
const app = require("./app");

// Get configuration from environment variables
const PORT = process.env.PORT || 5001;
const HOST = process.env.HOST || "localhost";
const NODE_ENV = process.env.NODE_ENV || "development";

// Start the server
const server = app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://${HOST}:${PORT}`);
  console.log(`📊 Environment: ${NODE_ENV}`);
  console.log(`🔗 Health check: http://${HOST}:${PORT}/api/health`);

  if (NODE_ENV === "development") {
    console.log(`🔧 Development mode - Auto-reload enabled`);
  }
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("👋 SIGTERM received, shutting down gracefully");
  server.close(() => {
    console.log("✅ Process terminated");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("👋 SIGINT received, shutting down gracefully");
  server.close(() => {
    console.log("✅ Process terminated");
    process.exit(0);
  });
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error("💥 Unhandled Promise Rejection:", err);
  server.close(() => {
    process.exit(1);
  });
});
