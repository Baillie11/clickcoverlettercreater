// VitaePro - Production Error Logger
// Writes all logs to rotating files in ./logs/ for production diagnostics.
// Uses Winston for structured logging with automatic file rotation.
//
// Log files:
//   logs/error.log     - errors only (5 MB x 10 files)
//   logs/combined.log  - all levels  (10 MB x 5 files)
//   logs/exceptions.log - uncaught exceptions
//   logs/rejections.log - unhandled promise rejections
//
// Env vars:
//   LOG_LEVEL        - minimum level (default: 'info')
//   LOG_VIEWER_KEY   - secret key to access /api/admin/logs endpoint

const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Ensure logs directory exists
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Custom format: 2024-01-15 09:30:00.123 [ERROR][database] Message | {meta}
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack, component, ...meta }) => {
    const comp = component ? `[${component}]` : '';
    let log = `${timestamp} [${level.toUpperCase()}]${comp} ${message}`;
    if (stack) log += `\n${stack}`;
    const filtered = { ...meta };
    delete filtered.service;
    if (Object.keys(filtered).length > 0) {
      log += ` | ${JSON.stringify(filtered)}`;
    }
    return log;
  })
);

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'vitaepro' },
  transports: [
    // Error-only log
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5 * 1024 * 1024,   // 5 MB
      maxFiles: 10,
      tailable: true,
    }),
    // Combined log (all levels)
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 10 * 1024 * 1024,  // 10 MB
      maxFiles: 5,
      tailable: true,
    }),
  ],
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'exceptions.log'),
      maxsize: 5 * 1024 * 1024,
      maxFiles: 3,
    }),
  ],
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'rejections.log'),
      maxsize: 5 * 1024 * 1024,
      maxFiles: 3,
    }),
  ],
  exitOnError: false,
});

// ─── Component-specific logging helpers ───

logger.db = function (level, message, meta = {}) {
  logger.log(level, message, { component: 'database', ...meta });
};

logger.auth = function (level, message, meta = {}) {
  logger.log(level, message, { component: 'auth', ...meta });
};

// ─── Express request logging middleware ───

logger.requestMiddleware = function (req, res, next) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const meta = {
      component: 'http',
      method: req.method,
      url: req.originalUrl || req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip || req.connection?.remoteAddress,
    };

    const line = `${req.method} ${req.originalUrl} ${res.statusCode} (${duration}ms)`;

    if (res.statusCode >= 500) {
      logger.error(line, meta);
    } else if (res.statusCode >= 400) {
      logger.warn(line, meta);
    } else {
      // Only log API/auth routes at info level to avoid static-asset noise
      const url = req.originalUrl || '';
      if (url.startsWith('/api/') || url.startsWith('/auth/') ||
          url.startsWith('/responses') || url.startsWith('/applications') ||
          url.startsWith('/user/') || url.startsWith('/health')) {
        logger.info(line, meta);
      }
    }
  });

  next();
};

// ─── Express error-handling middleware ───

logger.errorMiddleware = function (err, req, res, next) {
  logger.error(`Unhandled error: ${req.method} ${req.originalUrl}`, {
    component: 'http',
    error: err.message,
    stack: err.stack,
    status: err.status || 500,
    method: req.method,
    url: req.originalUrl,
  });

  if (!res.headersSent) {
    res.status(err.status || 500).json({ error: 'Internal server error' });
  }
};

// ─── Console hook ───
// Pipes all existing console.log/error/warn output into the log files
// so every message is captured without changing every call in server.js.
// Only file transports are used in winston, so there is no duplication.

logger.hookConsole = function () {
  const originalLog = console.log;
  const originalError = console.error;
  const originalWarn = console.warn;

  console.log = function (...args) {
    originalLog.apply(console, args);
    logger.info(fmtArgs(args), { component: 'console' });
  };

  console.error = function (...args) {
    originalError.apply(console, args);
    logger.error(fmtArgs(args), { component: 'console' });
  };

  console.warn = function (...args) {
    originalWarn.apply(console, args);
    logger.warn(fmtArgs(args), { component: 'console' });
  };
};

function fmtArgs(args) {
  return args.map(a => {
    if (a instanceof Error) return `${a.message}\n${a.stack || ''}`;
    if (typeof a === 'object' && a !== null) {
      try { return JSON.stringify(a); } catch { return String(a); }
    }
    return String(a);
  }).join(' ');
}

// ─── Log reader utilities (used by admin endpoints) ───

logger.readLogFile = function (type = 'error', lines = 100) {
  const files = fs.readdirSync(logsDir)
    .filter(f => f.startsWith(type) && f.endsWith('.log'))
    .sort()
    .reverse();

  if (files.length === 0) {
    return { file: null, totalEntries: 0, showing: 0, entries: [] };
  }

  const logFile = path.join(logsDir, files[0]);
  const content = fs.readFileSync(logFile, 'utf8');
  const allLines = content.split('\n').filter(l => l.trim());
  const maxLines = Math.min(Math.max(1, lines), 500);
  const entries = allLines.slice(-maxLines);

  return {
    file: files[0],
    totalEntries: allLines.length,
    showing: entries.length,
    entries,
  };
};

logger.listLogFiles = function () {
  try {
    return fs.readdirSync(logsDir)
      .filter(f => f.endsWith('.log'))
      .map(f => {
        const stats = fs.statSync(path.join(logsDir, f));
        return { name: f, size: stats.size, modified: stats.mtime.toISOString() };
      })
      .sort((a, b) => b.modified.localeCompare(a.modified));
  } catch {
    return [];
  }
};

logger.logsDir = logsDir;

module.exports = logger;
