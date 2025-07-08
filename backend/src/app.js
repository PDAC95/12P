// Load environment variables first
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

// Import utilities and middleware
const errorHandler = require("./middleware/errorHandler");
const { sendSuccess, sendNotFound } = require("./utils/apiResponse");
const { logInfo, logError } = require("./utils/logger");

// Import route handlers
const propertyRoutes = require("./routes/propertyRoutes");

// Create Express application
const app = express();

// Security middleware
app.use(helmet());

// CORS configuration - Using environment variable
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:4200",
    credentials: true,
  })
);

// Logging middleware - Different levels based on environment
const logLevel = process.env.NODE_ENV === "production" ? "combined" : "dev";
app.use(morgan(logLevel));

// Body parsing middleware - Using environment variable for limit
const maxFileSize = process.env.MAX_FILE_SIZE || "10mb";
app.use(express.json({ limit: maxFileSize }));
app.use(express.urlencoded({ extended: true }));

// Log application startup
logInfo("12P Backend API Starting", {
  environment: process.env.NODE_ENV || "development",
  port: process.env.PORT || 5001,
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:4200",
});

// API Routes
app.use("/api/properties", propertyRoutes);

// Health check route with enhanced response
app.get("/api/health", (req, res) => {
  try {
    const healthData = {
      status: "OK",
      environment: process.env.NODE_ENV || "development",
      version: "1.0.0",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + " MB",
        total:
          Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + " MB",
      },
    };

    logInfo("Health check accessed", { ip: req.ip });
    sendSuccess(res, healthData, "12P Backend API is running healthy");
  } catch (error) {
    logError("Health check failed", {
      error: error.message,
      stack: error.stack,
    });
    next(error);
  }
});

// Test error endpoint (only in development)
if (process.env.NODE_ENV === "development") {
  app.get("/api/test-error", (req, res, next) => {
    const error = new Error("This is a test error for development");
    error.statusCode = 500;
    next(error);
  });
}

// 404 handler for unmatched routes
app.all("*", (req, res) => {
  logInfo("Route not found", {
    path: req.originalUrl,
    method: req.method,
    ip: req.ip,
  });

  sendNotFound(res, "API endpoint");
});

// Global error handling middleware (must be last)
app.use(errorHandler);

module.exports = app;
