// Structured logging utility for the application

const fs = require("fs");
const path = require("path");

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, "../../logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Log levels
const LOG_LEVELS = {
  ERROR: "ERROR",
  WARN: "WARN",
  INFO: "INFO",
  DEBUG: "DEBUG",
};

/**
 * Format log message with timestamp and metadata
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @param {Object} meta - Additional metadata
 * @returns {string} Formatted log message
 */
const formatLogMessage = (level, message, meta = {}) => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message,
    ...meta,
  };

  return JSON.stringify(logEntry, null, 2);
};

/**
 * Write log to file
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @param {Object} meta - Additional metadata
 */
const writeToFile = (level, message, meta = {}) => {
  if (process.env.NODE_ENV === "test") return; // Don't write logs during testing

  const logMessage = formatLogMessage(level, message, meta);
  const fileName = `${new Date().toISOString().split("T")[0]}.log`;
  const filePath = path.join(logsDir, fileName);

  fs.appendFileSync(filePath, logMessage + "\n");
};

/**
 * Log error message
 * @param {string} message - Error message
 * @param {Object} meta - Additional metadata (error object, request info, etc.)
 */
const logError = (message, meta = {}) => {
  console.error(`\n🚨 [ERROR] ${message}`);
  if (meta.stack) {
    console.error("Stack:", meta.stack);
  }
  if (meta.request) {
    console.error("Request:", {
      method: meta.request.method,
      url: meta.request.url,
      ip: meta.request.ip,
      userAgent: meta.request.get ? meta.request.get("User-Agent") : "Unknown",
    });
  }
  console.error("Timestamp:", new Date().toISOString());
  console.error("----------------------------\n");

  writeToFile(LOG_LEVELS.ERROR, message, meta);
};

/**
 * Log warning message
 * @param {string} message - Warning message
 * @param {Object} meta - Additional metadata
 */
const logWarning = (message, meta = {}) => {
  console.warn(`⚠️  [WARN] ${message}`, meta);
  writeToFile(LOG_LEVELS.WARN, message, meta);
};

/**
 * Log info message
 * @param {string} message - Info message
 * @param {Object} meta - Additional metadata
 */
const logInfo = (message, meta = {}) => {
  console.log(`ℹ️  [INFO] ${message}`, meta);
  writeToFile(LOG_LEVELS.INFO, message, meta);
};

/**
 * Log debug message (only in development)
 * @param {string} message - Debug message
 * @param {Object} meta - Additional metadata
 */
const logDebug = (message, meta = {}) => {
  if (process.env.NODE_ENV === "development") {
    console.log(`🐛 [DEBUG] ${message}`, meta);
    writeToFile(LOG_LEVELS.DEBUG, message, meta);
  }
};

/**
 * Log API request
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const logApiRequest = (req, res) => {
  const message = `${req.method} ${req.path}`;
  const meta = {
    method: req.method,
    path: req.path,
    statusCode: res.statusCode,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
    responseTime: res.get("X-Response-Time"),
  };

  if (res.statusCode >= 400) {
    logWarning(`API Error: ${message}`, meta);
  } else {
    logInfo(`API Request: ${message}`, meta);
  }
};

/**
 * Log database operations
 * @param {string} operation - Database operation (find, create, update, delete)
 * @param {string} collection - Collection/model name
 * @param {Object} meta - Additional metadata
 */
const logDatabase = (operation, collection, meta = {}) => {
  const message = `Database ${operation} on ${collection}`;
  logDebug(message, meta);
};

module.exports = {
  logError,
  logWarning,
  logInfo,
  logDebug,
  logApiRequest,
  logDatabase,
  LOG_LEVELS,
};
