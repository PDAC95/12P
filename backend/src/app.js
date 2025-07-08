// Load environment variables first
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

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

// Basic route for testing
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "12P Backend API is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    version: "1.0.0",
  });
});

module.exports = app;
