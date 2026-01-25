// Comprehensive Logging System for VitaePro
// Logs all requests, errors, and important events to both console and file

const fs = require('fs');
const path = require('path');

// Create logs directory
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Log file paths
const getLogFilePath = (type = 'app') => {
  const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  return path.join(logsDir, `${type}-${date}.log`);
};

// Format timestamp
const timestamp = () => {
  return new Date().toISOString();
};

// Write to log file
const writeToFile = (logType, message) => {
  try {
    const logFile = getLogFilePath(logType);
    const logEntry = `[${timestamp()}] ${message}\n`;
    fs.appendFileSync(logFile, logEntry);
  } catch (e) {
    console.error('Failed to write to log file:', e);
  }
};

// Log levels
const logger = {
  info: (message, meta = {}) => {
    const logMessage = `[INFO] ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`;
    console.log(logMessage);
    writeToFile('app', logMessage);
  },

  error: (message, error = null, meta = {}) => {
    const errorDetails = error ? {
      message: error.message,
      stack: error.stack,
      code: error.code,
      status: error.status,
      ...meta
    } : meta;
    
    const logMessage = `[ERROR] ${message} ${JSON.stringify(errorDetails)}`;
    console.error(logMessage);
    writeToFile('error', logMessage);
  },

  warn: (message, meta = {}) => {
    const logMessage = `[WARN] ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`;
    console.warn(logMessage);
    writeToFile('app', logMessage);
  },

  request: (req, additionalInfo = {}) => {
    const logMessage = `[REQUEST] ${req.method} ${req.path} ${JSON.stringify({
      ip: req.ip || req.connection?.remoteAddress,
      userAgent: req.headers['user-agent'],
      userId: additionalInfo.userId || 'anonymous',
      ...additionalInfo
    })}`;
    console.log(logMessage);
    writeToFile('access', logMessage);
  },

  apiCall: (service, action, details = {}) => {
    const logMessage = `[API_CALL] ${service}.${action} ${JSON.stringify(details)}`;
    console.log(logMessage);
    writeToFile('api', logMessage);
  },

  userAction: (userId, action, details = {}) => {
    const logMessage = `[USER_ACTION] userId=${userId} action=${action} ${JSON.stringify(details)}`;
    console.log(logMessage);
    writeToFile('user-actions', logMessage);
  }
};

// Request logging middleware
const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  
  // Log request
  logger.request(req, {
    body: req.body ? Object.keys(req.body) : [],
    query: req.query
  });

  // Capture response
  const originalSend = res.send;
  res.send = function(data) {
    const duration = Date.now() - startTime;
    
    // Log response
    const logMessage = `[RESPONSE] ${req.method} ${req.path} status=${res.statusCode} duration=${duration}ms`;
    console.log(logMessage);
    writeToFile('access', logMessage);
    
    // Call original send
    originalSend.call(this, data);
  };

  next();
};

// Error logging middleware
const errorLogger = (err, req, res, next) => {
  logger.error(`Unhandled error in ${req.method} ${req.path}`, err, {
    body: req.body,
    query: req.query,
    params: req.params
  });
  
  next(err);
};

module.exports = {
  logger,
  requestLogger,
  errorLogger
};
