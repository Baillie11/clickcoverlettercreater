// VitaePro Backend Server - MySQL Compatible
// Supports both SQLite (development) and MySQL (production)
// Run with: node server.js

require('dotenv').config();

// Initialise production logger - must be early so hookConsole captures everything
const logger = require('./logger');
logger.hookConsole();

const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// Determine database type based on environment
const USE_MYSQL = process.env.NODE_ENV === 'production' || process.env.USE_MYSQL === 'true';

let db = null;
let dbType = 'none';

// Initialize database connection
async function initDatabase() {
  if (USE_MYSQL) {
    // MySQL for production (VentraIP)
    try {
      const mysql = require('mysql2/promise');
      const pool = mysql.createPool({
        host: process.env.MYSQL_HOST || 'localhost',
        port: parseInt(process.env.MYSQL_PORT || '3306'),
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DATABASE,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
      });

      // Test connection
      const connection = await pool.getConnection();
      console.log('✅ MySQL connected successfully');
      connection.release();

      // Monitor MySQL connection pool health
      try {
        const poolForEvents = pool.pool || pool;
        poolForEvents.on('connection', (conn) => {
          logger.db('info', 'New MySQL connection established', { threadId: conn.threadId });
        });
        poolForEvents.on('enqueue', () => {
          logger.db('warn', 'MySQL connection pool exhausted - query queued. Consider increasing connectionLimit.');
        });
        poolForEvents.on('release', (conn) => {
          logger.db('debug', 'MySQL connection released', { threadId: conn.threadId });
        });
      } catch (evtErr) {
        logger.db('warn', 'Could not attach pool event listeners', { error: evtErr.message });
      }

      // Create tables
      await createMySQLTables(pool);
      
      db = pool;
      dbType = 'mysql';
    } catch (e) {
      logger.db('error', 'MySQL connection failed', {
        error: e.message,
        code: e.code,
        errno: e.errno,
        host: process.env.MYSQL_HOST,
        database: process.env.MYSQL_DATABASE,
        stack: e.stack,
      });
      console.error('Falling back to JSON store');
      dbType = 'json';
    }
  } else {
    // SQLite for development
    try {
      const Database = require('better-sqlite3');
      const dataDir = path.join(__dirname, 'data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      const dbFile = path.join(dataDir, 'data.db');
      db = new Database(dbFile);
      console.log('✅ SQLite connected successfully');
      createSQLiteTables();
      dbType = 'sqlite';
    } catch (e) {
      console.warn('⚠️  SQLite not available, using JSON store');
      dbType = 'json';
    }
  }

  // JSON store fallback
  if (dbType === 'json') {
    initJSONStore();
  }

  console.log(`📊 Database type: ${dbType.toUpperCase()}`);
}

// SQLite table creation
function createSQLiteTables() {
  // Users
  db.prepare(`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    passwordHash TEXT NOT NULL,
    shareResponses INTEGER DEFAULT 1,
    createdAt TEXT NOT NULL
  )`).run();

  // Sessions
  db.prepare(`CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    expiresAt TEXT NOT NULL,
    FOREIGN KEY(userId) REFERENCES users(id)
  )`).run();

  // Responses
  db.prepare(`CREATE TABLE IF NOT EXISTS responses (
    id TEXT PRIMARY KEY,
    text TEXT NOT NULL,
    category TEXT NOT NULL,
    userCreated INTEGER NOT NULL,
    source TEXT,
    tags TEXT,
    userId TEXT,
    createdAt TEXT NOT NULL,
    FOREIGN KEY(userId) REFERENCES users(id)
  )`).run();

  // Applications
  db.prepare(`CREATE TABLE IF NOT EXISTS applications (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    company TEXT,
    role TEXT,
    status TEXT,
    notes TEXT,
    date TEXT,
    paragraphs TEXT,
    timeSpent INTEGER DEFAULT 0,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL,
    FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE
  )`).run();

  // Password Reset Tokens
  db.prepare(`CREATE TABLE IF NOT EXISTS password_reset_tokens (
    token TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    expiresAt TEXT NOT NULL,
    used INTEGER DEFAULT 0,
    FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE
  )`).run();

  // Agencies
  db.prepare(`CREATE TABLE IF NOT EXISTS agencies (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    createdAt TEXT NOT NULL
  )`).run();

  // Agency Members
  db.prepare(`CREATE TABLE IF NOT EXISTS agency_members (
    id TEXT PRIMARY KEY,
    agencyId TEXT NOT NULL,
    userId TEXT NOT NULL,
    role TEXT DEFAULT 'member',
    createdAt TEXT NOT NULL,
    FOREIGN KEY(agencyId) REFERENCES agencies(id),
    FOREIGN KEY(userId) REFERENCES users(id)
  )`).run();

  // Agency Responses (shared library)
  db.prepare(`CREATE TABLE IF NOT EXISTS agency_responses (
    id TEXT PRIMARY KEY,
    agencyId TEXT NOT NULL,
    text TEXT NOT NULL,
    category TEXT DEFAULT 'General',
    createdBy TEXT,
    createdAt TEXT NOT NULL,
    FOREIGN KEY(agencyId) REFERENCES agencies(id),
    FOREIGN KEY(createdBy) REFERENCES users(id)
  )`).run();

  // Letter Reviews
  db.prepare(`CREATE TABLE IF NOT EXISTS letter_reviews (
    id TEXT PRIMARY KEY,
    applicationId TEXT NOT NULL,
    reviewerId TEXT NOT NULL,
    status TEXT NOT NULL,
    comment TEXT,
    createdAt TEXT NOT NULL,
    FOREIGN KEY(applicationId) REFERENCES applications(id),
    FOREIGN KEY(reviewerId) REFERENCES users(id)
  )`).run();

  // Indexes
  try {
    db.prepare('CREATE INDEX IF NOT EXISTS idx_applications_userId ON applications(userId)').run();
    db.prepare('CREATE INDEX IF NOT EXISTS idx_applications_date ON applications(date)').run();
    db.prepare('CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status)').run();
    db.prepare('CREATE INDEX IF NOT EXISTS idx_reset_tokens_userId ON password_reset_tokens(userId)').run();
    db.prepare('CREATE INDEX IF NOT EXISTS idx_reset_tokens_expiresAt ON password_reset_tokens(expiresAt)').run();
    db.prepare('CREATE INDEX IF NOT EXISTS idx_agency_members_userId ON agency_members(userId)').run();
    db.prepare('CREATE INDEX IF NOT EXISTS idx_agency_members_agencyId ON agency_members(agencyId)').run();
    db.prepare('CREATE INDEX IF NOT EXISTS idx_agency_responses_agencyId ON agency_responses(agencyId)').run();
    db.prepare('CREATE INDEX IF NOT EXISTS idx_letter_reviews_applicationId ON letter_reviews(applicationId)').run();
  } catch (e) {
    console.warn('Index creation warning:', e.message);
  }
}

// MySQL table creation
async function createMySQLTables(pool) {
  const connection = await pool.getConnection();
  
  try {
    // Users
    await connection.query(`CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(50) PRIMARY KEY,
      username VARCHAR(100) UNIQUE NOT NULL,
      passwordHash VARCHAR(255) NOT NULL,
      shareResponses TINYINT DEFAULT 1,
      createdAt DATETIME NOT NULL,
      INDEX idx_username (username)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

    // Sessions
    await connection.query(`CREATE TABLE IF NOT EXISTS sessions (
      token VARCHAR(100) PRIMARY KEY,
      userId VARCHAR(50) NOT NULL,
      createdAt DATETIME NOT NULL,
      expiresAt DATETIME NOT NULL,
      INDEX idx_userId (userId),
      INDEX idx_expiresAt (expiresAt),
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

    // Responses
    await connection.query(`CREATE TABLE IF NOT EXISTS responses (
      id VARCHAR(50) PRIMARY KEY,
      text TEXT NOT NULL,
      category VARCHAR(50) NOT NULL,
      userCreated TINYINT NOT NULL,
      source VARCHAR(50),
      tags TEXT,
      userId VARCHAR(50),
      createdAt DATETIME NOT NULL,
      INDEX idx_userId (userId),
      INDEX idx_category (category),
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

    // Applications
    await connection.query(`CREATE TABLE IF NOT EXISTS applications (
      id VARCHAR(50) PRIMARY KEY,
      userId VARCHAR(50) NOT NULL,
      company VARCHAR(255),
      role VARCHAR(255),
      status VARCHAR(50),
      notes TEXT,
      date DATE,
      paragraphs TEXT,
      timeSpent INT DEFAULT 0,
      createdAt DATETIME NOT NULL,
      updatedAt DATETIME NOT NULL,
      INDEX idx_userId (userId),
      INDEX idx_date (date),
      INDEX idx_status (status),
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

    // Password Reset Tokens
    await connection.query(`CREATE TABLE IF NOT EXISTS password_reset_tokens (
      token VARCHAR(100) PRIMARY KEY,
      userId VARCHAR(50) NOT NULL,
      createdAt DATETIME NOT NULL,
      expiresAt DATETIME NOT NULL,
      used TINYINT DEFAULT 0,
      INDEX idx_userId (userId),
      INDEX idx_expiresAt (expiresAt),
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

    // Agencies
    await connection.query(`CREATE TABLE IF NOT EXISTS agencies (
      id VARCHAR(50) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      createdAt DATETIME NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

    // Agency Members
    await connection.query(`CREATE TABLE IF NOT EXISTS agency_members (
      id VARCHAR(50) PRIMARY KEY,
      agencyId VARCHAR(50) NOT NULL,
      userId VARCHAR(50) NOT NULL,
      role VARCHAR(50) DEFAULT 'member',
      createdAt DATETIME NOT NULL,
      INDEX idx_agencyId (agencyId),
      INDEX idx_userId (userId),
      FOREIGN KEY (agencyId) REFERENCES agencies(id) ON DELETE CASCADE,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

    // Agency Responses (shared library)
    await connection.query(`CREATE TABLE IF NOT EXISTS agency_responses (
      id VARCHAR(50) PRIMARY KEY,
      agencyId VARCHAR(50) NOT NULL,
      text TEXT NOT NULL,
      category VARCHAR(50) DEFAULT 'General',
      createdBy VARCHAR(50),
      createdAt DATETIME NOT NULL,
      INDEX idx_agencyId (agencyId),
      FOREIGN KEY (agencyId) REFERENCES agencies(id) ON DELETE CASCADE,
      FOREIGN KEY (createdBy) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

    // Letter Reviews
    await connection.query(`CREATE TABLE IF NOT EXISTS letter_reviews (
      id VARCHAR(50) PRIMARY KEY,
      applicationId VARCHAR(50) NOT NULL,
      reviewerId VARCHAR(50) NOT NULL,
      status VARCHAR(50) NOT NULL,
      comment TEXT,
      createdAt DATETIME NOT NULL,
      INDEX idx_applicationId (applicationId),
      INDEX idx_reviewerId (reviewerId),
      FOREIGN KEY (applicationId) REFERENCES applications(id) ON DELETE CASCADE,
      FOREIGN KEY (reviewerId) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

    console.log('✅ MySQL tables created/verified');
  } finally {
    connection.release();
  }
}

// JSON store initialization
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}
const storeFile = path.join(dataDir, 'data.json');
let store = { users: [], sessions: [], responses: [], applications: [], passwordResetTokens: [] };

function initJSONStore() {
  try {
    if (fs.existsSync(storeFile)) {
      store = JSON.parse(fs.readFileSync(storeFile, 'utf8')) || store;
    } else {
      fs.writeFileSync(storeFile, JSON.stringify(store, null, 2));
    }
  } catch (e) {
    console.error('Failed to init JSON store:', e);
  }
}

function saveStore() {
  if (dbType === 'json') {
    try {
      fs.writeFileSync(storeFile, JSON.stringify(store, null, 2));
    } catch (e) {
      console.error('Failed to save JSON store:', e);
    }
  }
}

// OpenAI setup
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

let aiQuotaExceeded = false;
let aiQuotaExceededAt = null;

// Email configuration
let emailTransporter = null;
if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
  emailTransporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
  console.log('📧 Email alerts configured');
} else {
  console.log('⚠️  Email alerts not configured (missing EMAIL_USER or EMAIL_PASSWORD)');
}

// Function to send login alert email
async function sendLoginAlert(username, userId) {
  if (!emailTransporter || !process.env.ALERT_EMAIL) {
    console.log('Email alert skipped - not configured');
    return;
  }
  
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.ALERT_EMAIL,
      subject: `VitaePro Login Alert - ${username}`,
      html: `
        <h2>VitaePro Login Alert</h2>
        <p><strong>User:</strong> ${username}</p>
        <p><strong>User ID:</strong> ${userId}</p>
        <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
        <p><strong>Action:</strong> User logged in successfully</p>
        <hr>
        <p style="color: #666; font-size: 12px;">This is an automated alert from VitaePro.</p>
      `
    };
    
    await emailTransporter.sendMail(mailOptions);
    console.log(`📧 Login alert sent to ${process.env.ALERT_EMAIL} for user ${username}`);
  } catch (error) {
    console.error('Failed to send login alert email:', error.message);
  }
}

// Function to send password reset email
async function sendPasswordResetEmail(username, token) {
  if (!emailTransporter) {
    console.log('Email not configured - cannot send password reset');
    return false;
  }
  
  try {
    const resetUrl = `${process.env.APP_URL || 'http://localhost:3050'}/reset-password.html?token=${token}`;
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: username, // username is the email address
      subject: 'VitaePro - Password Reset Request',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Password Reset Request</h2>
          <p>You have requested to reset your password for your VitaePro account.</p>
          <p>Your reset token is:</p>
          <div style="background-color: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 5px; font-family: monospace; font-size: 16px; text-align: center; letter-spacing: 2px;">
            <strong>${token}</strong>
          </div>
          <p>Or click the link below to reset your password:</p>
          <p style="margin: 25px 0;">
            <a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
          </p>
          <p><strong>This token will expire in 30 minutes.</strong></p>
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            If you did not request a password reset, please ignore this email. Your password will remain unchanged.
          </p>
          <hr style="margin-top: 30px; border: none; border-top: 1px solid #ddd;">
          <p style="color: #999; font-size: 12px;">This is an automated email from VitaePro. Please do not reply.</p>
        </div>
      `
    };
    
    await emailTransporter.sendMail(mailOptions);
    console.log(`📧 Password reset email sent to ${username}`);
    return true;
  } catch (error) {
    console.error('Failed to send password reset email:', error.message);
    return false;
  }
}

// Function to send password changed confirmation email
async function sendPasswordChangedEmail(username) {
  if (!emailTransporter) {
    console.log('Email not configured - cannot send password changed confirmation');
    return;
  }
  
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: username, // username is the email address
      subject: 'VitaePro - Password Changed Successfully',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #28a745;">✓ Password Changed Successfully</h2>
          <p>Your VitaePro account password has been changed successfully.</p>
          <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
          <p style="margin-top: 25px; padding: 15px; background-color: #fff3cd; border-left: 4px solid #ffc107; color: #856404;">
            <strong>⚠️ Security Notice:</strong> If you did not make this change, please contact support immediately as your account may be compromised.
          </p>
          <hr style="margin-top: 30px; border: none; border-top: 1px solid #ddd;">
          <p style="color: #999; font-size: 12px;">This is an automated email from VitaePro. Please do not reply.</p>
        </div>
      `
    };
    
    await emailTransporter.sendMail(mailOptions);
    console.log(`📧 Password changed confirmation sent to ${username}`);
  } catch (error) {
    console.error('Failed to send password changed email:', error.message);
  }
}

// Express app setup
const app = express();
const PORT = process.env.PORT || 3050;

// CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? ['https://vitaepro.com.au', 'https://www.vitaepro.com.au', 'https://clickcoverlettercreator.com.au', 'https://www.clickcoverlettercreator.com.au']
    : true,
  credentials: true
};
app.use(cors(corsOptions));
app.use(express.json({ limit: '1mb' }));

// Request logging (writes to log files via Winston)
app.use(logger.requestMiddleware);

// Disable caching
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

// Serve static files
app.use(express.static(__dirname));

// Helper functions
function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function genToken() {
  return crypto.randomBytes(24).toString('hex');
}

function nowIso() {
  return new Date().toISOString();
}

// MySQL-compatible datetime format (YYYY-MM-DD HH:MM:SS)
function toMySQLDatetime(date) {
  return date.toISOString().slice(0, 19).replace('T', ' ');
}

function plusDays(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

function rowToResponse(row) {
  let tags = [];
  if (row.tags) {
    try {
      tags = JSON.parse(row.tags);
    } catch {
      tags = [];
    }
  }
  return {
    id: row.id,
    text: row.text,
    category: row.category,
    userCreated: !!row.userCreated,
    source: row.source || null,
    createdAt: row.createdAt,
    tags: tags
  };
}

// Database abstraction layer
const DB = {
  // Users
  async createUser(id, username, passwordHash) {
    const createdAt = nowIso();
    
    if (dbType === 'mysql') {
      await db.execute(
        'INSERT INTO users (id, username, passwordHash, createdAt) VALUES (?, ?, ?, ?)',
        [id, username, passwordHash, createdAt]
      );
    } else if (dbType === 'sqlite') {
      db.prepare('INSERT INTO users (id, username, passwordHash, createdAt) VALUES (?, ?, ?, ?)')
        .run(id, username, passwordHash, createdAt);
    } else {
      store.users.push({ id, username, passwordHash, createdAt, shareResponses: 1 });
      saveStore();
    }
  },

  async findUserByUsername(username) {
    if (dbType === 'mysql') {
      const [rows] = await db.execute('SELECT * FROM users WHERE username = ?', [username]);
      return rows[0] || null;
    } else if (dbType === 'sqlite') {
      return db.prepare('SELECT * FROM users WHERE username = ?').get(username) || null;
    } else {
      return store.users.find(u => u.username === username) || null;
    }
  },

  async findUserById(userId) {
    if (dbType === 'mysql') {
      const [rows] = await db.execute('SELECT * FROM users WHERE id = ?', [userId]);
      return rows[0] || null;
    } else if (dbType === 'sqlite') {
      return db.prepare('SELECT * FROM users WHERE id = ?').get(userId) || null;
    } else {
      return store.users.find(u => u.id === userId) || null;
    }
  },

  async updateUserPassword(userId, passwordHash) {
    if (dbType === 'mysql') {
      await db.execute('UPDATE users SET passwordHash = ? WHERE id = ?', [passwordHash, userId]);
    } else if (dbType === 'sqlite') {
      db.prepare('UPDATE users SET passwordHash = ? WHERE id = ?').run(passwordHash, userId);
    } else {
      const user = store.users.find(u => u.id === userId);
      if (user) {
        user.passwordHash = passwordHash;
        saveStore();
      }
    }
  },

  async getUserPreferences(userId) {
    if (dbType === 'mysql') {
      const [rows] = await db.execute('SELECT shareResponses FROM users WHERE id = ?', [userId]);
      return rows[0] || null;
    } else if (dbType === 'sqlite') {
      return db.prepare('SELECT shareResponses FROM users WHERE id = ?').get(userId) || null;
    } else {
      return store.users.find(u => u.id === userId) || null;
    }
  },

  async updateUserPreferences(userId, shareResponses) {
    if (dbType === 'mysql') {
      await db.execute('UPDATE users SET shareResponses = ? WHERE id = ?', [shareResponses ? 1 : 0, userId]);
    } else if (dbType === 'sqlite') {
      db.prepare('UPDATE users SET shareResponses = ? WHERE id = ?').run(shareResponses ? 1 : 0, userId);
    } else {
      const user = store.users.find(u => u.id === userId);
      if (user) {
        user.shareResponses = shareResponses ? 1 : 0;
        saveStore();
      }
    }
  },

  // Sessions
  async createSession(token, userId) {
    const now = new Date();
    const expires = new Date();
    expires.setDate(expires.getDate() + 7);
    
    if (dbType === 'mysql') {
      // MySQL needs datetime format without T and Z
      const createdAt = toMySQLDatetime(now);
      const expiresAt = toMySQLDatetime(expires);
      await db.execute(
        'INSERT INTO sessions (token, userId, createdAt, expiresAt) VALUES (?, ?, ?, ?)',
        [token, userId, createdAt, expiresAt]
      );
    } else if (dbType === 'sqlite') {
      const createdAt = nowIso();
      const expiresAt = plusDays(7);
      db.prepare('INSERT INTO sessions (token, userId, createdAt, expiresAt) VALUES (?, ?, ?, ?)')
        .run(token, userId, createdAt, expiresAt);
    } else {
      const createdAt = nowIso();
      const expiresAt = plusDays(7);
      store.sessions.push({ token, userId, createdAt, expiresAt });
      saveStore();
    }
  },

  async findSessionByToken(token) {
    if (dbType === 'mysql') {
      const [rows] = await db.execute('SELECT * FROM sessions WHERE token = ?', [token]);
      return rows[0] || null;
    } else if (dbType === 'sqlite') {
      return db.prepare('SELECT * FROM sessions WHERE token = ?').get(token) || null;
    } else {
      return store.sessions.find(s => s.token === token) || null;
    }
  },

  async deleteSession(token) {
    if (dbType === 'mysql') {
      await db.execute('DELETE FROM sessions WHERE token = ?', [token]);
    } else if (dbType === 'sqlite') {
      db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
    } else {
      store.sessions = store.sessions.filter(s => s.token !== token);
      saveStore();
    }
  },

  async deleteUserSessions(userId) {
    if (dbType === 'mysql') {
      await db.execute('DELETE FROM sessions WHERE userId = ?', [userId]);
    } else if (dbType === 'sqlite') {
      db.prepare('DELETE FROM sessions WHERE userId = ?').run(userId);
    } else {
      store.sessions = store.sessions.filter(s => s.userId !== userId);
      saveStore();
    }
  },

  // Responses
  async getResponses(userId, category = null) {
    if (dbType === 'mysql') {
      if (category) {
        const [rows] = await db.execute(
          'SELECT * FROM responses WHERE userId = ? AND category = ? ORDER BY createdAt ASC',
          [userId, category]
        );
        return rows;
      } else {
        const [rows] = await db.execute(
          'SELECT * FROM responses WHERE userId = ? ORDER BY createdAt ASC',
          [userId]
        );
        return rows;
      }
    } else if (dbType === 'sqlite') {
      if (category) {
        return db.prepare('SELECT * FROM responses WHERE userId = ? AND category = ? ORDER BY createdAt ASC')
          .all(userId, category);
      } else {
        return db.prepare('SELECT * FROM responses WHERE userId = ? ORDER BY createdAt ASC').all(userId);
      }
    } else {
      return store.responses.filter(r => r.userId === userId && (!category || r.category === category));
    }
  },

  async getCrowdResponses(userId) {
    if (dbType === 'mysql') {
      const [rows] = await db.execute(`
        SELECT r.* FROM responses r
        INNER JOIN users u ON r.userId = u.id
        WHERE u.shareResponses = 1 AND r.userId != ? AND r.userCreated = 1
        ORDER BY r.createdAt DESC
        LIMIT 100
      `, [userId]);
      return rows;
    } else if (dbType === 'sqlite') {
      return db.prepare(`
        SELECT r.* FROM responses r
        INNER JOIN users u ON r.userId = u.id
        WHERE u.shareResponses = 1 AND r.userId != ? AND r.userCreated = 1
        ORDER BY r.createdAt DESC
        LIMIT 100
      `).all(userId);
    } else {
      const sharingUsers = store.users.filter(u => (u.shareResponses ?? 1) === 1 && u.id !== userId).map(u => u.id);
      return store.responses.filter(r => r.userCreated && sharingUsers.includes(r.userId)).slice(0, 100);
    }
  },

  async createResponse(id, text, category, userCreated, source, tags, userId) {
    const createdAt = nowIso();
    const tagsJson = tags ? JSON.stringify(tags) : null;
    
    if (dbType === 'mysql') {
      await db.execute(
        'INSERT INTO responses (id, text, category, userCreated, source, tags, userId, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [id, text, category, userCreated ? 1 : 0, source || null, tagsJson, userId, createdAt]
      );
      const [rows] = await db.execute('SELECT * FROM responses WHERE id = ?', [id]);
      return rows[0];
    } else if (dbType === 'sqlite') {
      db.prepare('INSERT INTO responses (id, text, category, userCreated, source, tags, userId, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
        .run(id, text, category, userCreated ? 1 : 0, source || null, tagsJson, userId, createdAt);
      return db.prepare('SELECT * FROM responses WHERE id = ?').get(id);
    } else {
      const row = { id, text, category, userCreated: !!userCreated, source: source || null, tags: tagsJson, userId, createdAt };
      store.responses.push(row);
      saveStore();
      return row;
    }
  },

  async updateResponse(id, userId, updates) {
    if (dbType === 'mysql') {
      const [existing] = await db.execute('SELECT * FROM responses WHERE id = ? AND userId = ?', [id, userId]);
      if (!existing[0]) return null;
      
      const tagsJson = updates.tags !== undefined ? JSON.stringify(updates.tags) : existing[0].tags;
      await db.execute(
        'UPDATE responses SET text = ?, category = ?, userCreated = ?, source = ?, tags = ? WHERE id = ?',
        [
          updates.text ?? existing[0].text,
          updates.category ?? existing[0].category,
          updates.userCreated ? 1 : 0,
          updates.source ?? existing[0].source,
          tagsJson,
          id
        ]
      );
      const [rows] = await db.execute('SELECT * FROM responses WHERE id = ?', [id]);
      return rows[0];
    } else if (dbType === 'sqlite') {
      const existing = db.prepare('SELECT * FROM responses WHERE id = ? AND userId = ?').get(id, userId);
      if (!existing) return null;
      
      const tagsJson = updates.tags !== undefined ? JSON.stringify(updates.tags) : existing.tags;
      db.prepare('UPDATE responses SET text = ?, category = ?, userCreated = ?, source = ?, tags = ? WHERE id = ?')
        .run(
          updates.text ?? existing.text,
          updates.category ?? existing.category,
          updates.userCreated ? 1 : 0,
          updates.source ?? existing.source,
          tagsJson,
          id
        );
      return db.prepare('SELECT * FROM responses WHERE id = ?').get(id);
    } else {
      const idx = store.responses.findIndex(r => r.id === id && r.userId === userId);
      if (idx === -1) return null;
      
      const existing = store.responses[idx];
      const tagsJson = updates.tags !== undefined ? JSON.stringify(updates.tags) : existing.tags;
      const updated = {
        ...existing,
        text: updates.text ?? existing.text,
        category: updates.category ?? existing.category,
        userCreated: updates.userCreated ?? existing.userCreated,
        source: updates.source ?? existing.source,
        tags: tagsJson
      };
      store.responses[idx] = updated;
      saveStore();
      return updated;
    }
  },

  async deleteResponse(id, userId) {
    if (dbType === 'mysql') {
      const [result] = await db.execute('DELETE FROM responses WHERE id = ? AND userId = ?', [id, userId]);
      return result.affectedRows > 0;
    } else if (dbType === 'sqlite') {
      const info = db.prepare('DELETE FROM responses WHERE id = ? AND userId = ?').run(id, userId);
      return info.changes > 0;
    } else {
      const before = store.responses.length;
      store.responses = store.responses.filter(r => !(r.id === id && r.userId === userId));
      const deleted = store.responses.length < before;
      if (deleted) saveStore();
      return deleted;
    }
  },

  // Applications
  async getApplications(userId) {
    if (dbType === 'mysql') {
      const [rows] = await db.execute('SELECT * FROM applications WHERE userId = ? ORDER BY date DESC', [userId]);
      return rows.map(app => ({
        ...app,
        paragraphs: app.paragraphs ? JSON.parse(app.paragraphs) : [],
        timeSpent: app.timeSpent || 0
      }));
    } else if (dbType === 'sqlite') {
      const rows = db.prepare('SELECT * FROM applications WHERE userId = ? ORDER BY date DESC').all(userId);
      return rows.map(app => ({
        ...app,
        paragraphs: app.paragraphs ? JSON.parse(app.paragraphs) : [],
        timeSpent: app.timeSpent || 0
      }));
    } else {
      return store.applications ? store.applications.filter(a => a.userId === userId) : [];
    }
  },

  async createApplication(data) {
    const now = nowIso();
    const paragraphsJson = JSON.stringify(data.paragraphs || []);
    
    if (dbType === 'mysql') {
      await db.execute(
        `INSERT INTO applications (id, userId, company, role, status, notes, date, paragraphs, timeSpent, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          data.id,
          data.userId,
          data.company,
          data.role,
          data.status || 'Draft',
          data.notes || '',
          data.date || now,
          paragraphsJson,
          data.timeSpent || 0,
          now,
          now
        ]
      );
    } else if (dbType === 'sqlite') {
      db.prepare(
        `INSERT INTO applications (id, userId, company, role, status, notes, date, paragraphs, timeSpent, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        data.id,
        data.userId,
        data.company,
        data.role,
        data.status || 'Draft',
        data.notes || '',
        data.date || now,
        paragraphsJson,
        data.timeSpent || 0,
        now,
        now
      );
    } else {
      if (!store.applications) store.applications = [];
      store.applications.push({
        id: data.id,
        userId: data.userId,
        company: data.company,
        role: data.role,
        status: data.status || 'Draft',
        notes: data.notes || '',
        date: data.date || now,
        paragraphs: data.paragraphs || [],
        timeSpent: data.timeSpent || 0,
        createdAt: now,
        updatedAt: now
      });
      saveStore();
    }
  },

  async updateApplication(id, userId, updates) {
    const now = nowIso();
    
    if (dbType === 'mysql') {
      const [existing] = await db.execute('SELECT * FROM applications WHERE id = ? AND userId = ?', [id, userId]);
      if (!existing[0]) return false;

      const fields = [];
      const values = [];

      if (updates.company !== undefined) { fields.push('company = ?'); values.push(updates.company); }
      if (updates.role !== undefined) { fields.push('role = ?'); values.push(updates.role); }
      if (updates.status !== undefined) { fields.push('status = ?'); values.push(updates.status); }
      if (updates.notes !== undefined) { fields.push('notes = ?'); values.push(updates.notes); }
      if (updates.date !== undefined) { fields.push('date = ?'); values.push(updates.date); }
      if (updates.paragraphs !== undefined) { fields.push('paragraphs = ?'); values.push(JSON.stringify(updates.paragraphs)); }
      if (updates.timeSpent !== undefined) { fields.push('timeSpent = ?'); values.push(updates.timeSpent); }
      
      fields.push('updatedAt = ?');
      values.push(now, id, userId);

      await db.execute(`UPDATE applications SET ${fields.join(', ')} WHERE id = ? AND userId = ?`, values);
      return true;
    } else if (dbType === 'sqlite') {
      const existing = db.prepare('SELECT * FROM applications WHERE id = ? AND userId = ?').get(id, userId);
      if (!existing) return false;

      const fields = [];
      const values = [];

      if (updates.company !== undefined) { fields.push('company = ?'); values.push(updates.company); }
      if (updates.role !== undefined) { fields.push('role = ?'); values.push(updates.role); }
      if (updates.status !== undefined) { fields.push('status = ?'); values.push(updates.status); }
      if (updates.notes !== undefined) { fields.push('notes = ?'); values.push(updates.notes); }
      if (updates.date !== undefined) { fields.push('date = ?'); values.push(updates.date); }
      if (updates.paragraphs !== undefined) { fields.push('paragraphs = ?'); values.push(JSON.stringify(updates.paragraphs)); }
      if (updates.timeSpent !== undefined) { fields.push('timeSpent = ?'); values.push(updates.timeSpent); }
      
      fields.push('updatedAt = ?');
      values.push(now, id, userId);

      db.prepare(`UPDATE applications SET ${fields.join(', ')} WHERE id = ? AND userId = ?`).run(...values);
      return true;
    } else {
      if (!store.applications) store.applications = [];
      const index = store.applications.findIndex(a => a.id === id && a.userId === userId);
      if (index === -1) return false;

      store.applications[index] = {
        ...store.applications[index],
        ...updates,
        updatedAt: now
      };
      saveStore();
      return true;
    }
  },

  async deleteApplication(id, userId) {
    if (dbType === 'mysql') {
      const [result] = await db.execute('DELETE FROM applications WHERE id = ? AND userId = ?', [id, userId]);
      return result.affectedRows > 0;
    } else if (dbType === 'sqlite') {
      const result = db.prepare('DELETE FROM applications WHERE id = ? AND userId = ?').run(id, userId);
      return result.changes > 0;
    } else {
      if (!store.applications) store.applications = [];
      const initialLength = store.applications.length;
      store.applications = store.applications.filter(a => !(a.id === id && a.userId === userId));
      const deleted = store.applications.length < initialLength;
      if (deleted) saveStore();
      return deleted;
    }
  },

  // Password Reset Tokens
  async createPasswordResetToken(userId, token, expiresAt) {
    const createdAt = nowIso();
    
    if (dbType === 'mysql') {
      await db.execute(
        'INSERT INTO password_reset_tokens (token, userId, createdAt, expiresAt, used) VALUES (?, ?, ?, ?, 0)',
        [token, userId, createdAt, expiresAt]
      );
    } else if (dbType === 'sqlite') {
      db.prepare('INSERT INTO password_reset_tokens (token, userId, createdAt, expiresAt, used) VALUES (?, ?, ?, ?, 0)')
        .run(token, userId, createdAt, expiresAt);
    } else {
      if (!store.passwordResetTokens) store.passwordResetTokens = [];
      store.passwordResetTokens.push({ token, userId, createdAt, expiresAt, used: 0 });
      saveStore();
    }
  },

  async findResetToken(token) {
    if (dbType === 'mysql') {
      const [rows] = await db.execute('SELECT * FROM password_reset_tokens WHERE token = ?', [token]);
      return rows[0] || null;
    } else if (dbType === 'sqlite') {
      return db.prepare('SELECT * FROM password_reset_tokens WHERE token = ?').get(token) || null;
    } else {
      if (!store.passwordResetTokens) store.passwordResetTokens = [];
      return store.passwordResetTokens.find(t => t.token === token) || null;
    }
  },

  async markResetTokenAsUsed(token) {
    if (dbType === 'mysql') {
      await db.execute('UPDATE password_reset_tokens SET used = 1 WHERE token = ?', [token]);
    } else if (dbType === 'sqlite') {
      db.prepare('UPDATE password_reset_tokens SET used = 1 WHERE token = ?').run(token);
    } else {
      if (!store.passwordResetTokens) store.passwordResetTokens = [];
      const resetToken = store.passwordResetTokens.find(t => t.token === token);
      if (resetToken) {
        resetToken.used = 1;
        saveStore();
      }
    }
  },

  async deleteExpiredResetTokens() {
    const now = nowIso();
    
    if (dbType === 'mysql') {
      await db.execute('DELETE FROM password_reset_tokens WHERE expiresAt < ?', [now]);
    } else if (dbType === 'sqlite') {
      db.prepare('DELETE FROM password_reset_tokens WHERE expiresAt < ?').run(now);
    } else {
      if (!store.passwordResetTokens) store.passwordResetTokens = [];
      const initialLength = store.passwordResetTokens.length;
      store.passwordResetTokens = store.passwordResetTokens.filter(t => t.expiresAt >= now);
      if (store.passwordResetTokens.length < initialLength) saveStore();
    }
  }
};

// Authentication middleware
async function getUserFromAuth(req) {
  try {
    const h = req.headers['authorization'] || '';
    const m = /^Bearer\s+(.+)$/i.exec(h);
    if (!m) {
      console.log('Auth: No valid Authorization header found');
      return null;
    }
    
    const token = m[1];
    const session = await DB.findSessionByToken(token);
    if (!session) {
      console.log('Auth: Session not found for token');
      return null;
    }
    
    // Handle both Date objects (MySQL) and ISO strings (SQLite/JSON)
    const expiresAt = session.expiresAt instanceof Date 
      ? session.expiresAt 
      : new Date(session.expiresAt);
    
    if (expiresAt < new Date()) {
      console.log('Auth: Session expired at', expiresAt.toISOString());
      await DB.deleteSession(token);
      return null;
    }
    
    const user = await DB.findUserById(session.userId);
    if (!user) {
      console.log('Auth: User not found for session userId:', session.userId);
      return null;
    }
    
    return { token, user: { id: user.id, username: user.username } };
  } catch (e) {
    console.error('Auth error:', e);
    return null;
  }
}

// Routes
app.get('/health', (req, res) => {
  res.json({ ok: true, database: dbType });
});

// Diagnostic endpoint to help troubleshoot auth issues
app.get('/api/debug-auth', async (req, res) => {
  const authHeader = req.headers['authorization'] || 'none';
  const hasBearer = authHeader.startsWith('Bearer ');
  const auth = await getUserFromAuth(req);
  res.json({
    database: dbType,
    authHeaderPresent: authHeader !== 'none',
    authHeaderHasBearer: hasBearer,
    authHeaderPreview: authHeader.substring(0, 20) + '...',
    authenticated: !!auth,
    userId: auth?.user?.id || null,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/ai-status', (req, res) => {
  res.json({
    available: !aiQuotaExceeded,
    quotaExceeded: aiQuotaExceeded,
    exceededAt: aiQuotaExceededAt
  });
});

// Auth routes
app.post('/auth/register', async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password || String(username).length < 3 || String(password).length < 6) {
    return res.status(400).json({ error: 'Username min 3 chars, Password min 6 chars' });
  }
  
  try {
    const uname = username.toLowerCase();
    const existing = await DB.findUserByUsername(uname);
    if (existing) return res.status(409).json({ error: 'Username already exists' });
    
    const id = genId();
    const hash = bcrypt.hashSync(password, 10);
    await DB.createUser(id, uname, hash);
    
    const token = genToken();
    await DB.createSession(token, id);
    
    res.json({ token, user: { id, username: uname } });
  } catch (e) {
    console.error('Register error:', e);
    res.status(500).json({ error: 'Failed to register' });
  }
});

app.post('/auth/login', async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'Missing credentials' });
  
  try {
    const uname = username.toLowerCase();
    const user = await DB.findUserByUsername(uname);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    if (!bcrypt.compareSync(password, user.passwordHash)) return res.status(401).json({ error: 'Invalid credentials' });
    
    const token = genToken();
    await DB.createSession(token, user.id);
    
    // Send login alert email (non-blocking)
    sendLoginAlert(user.username, user.id).catch(err => 
      console.error('Login alert email error:', err)
    );
    
    res.json({ token, user: { id: user.id, username: user.username } });
  } catch (e) {
    console.error('Login error:', e);
    res.status(500).json({ error: 'Failed to login' });
  }
});

app.get('/auth/me', async (req, res) => {
  const auth = await getUserFromAuth(req);
  if (!auth) return res.status(401).json({ error: 'Unauthorized' });
  res.json(auth.user);
});

app.post('/auth/logout', async (req, res) => {
  try {
    const h = req.headers['authorization'] || '';
    const m = /^Bearer\s+(.+)$/i.exec(h);
    if (m) {
      await DB.deleteSession(m[1]);
    }
  } catch (e) {
    console.error('Logout error:', e);
  }
  res.json({ ok: true });
});

// Password reset - Step 1: Request reset token
app.post('/auth/request-password-reset', async (req, res) => {
  const { username } = req.body || {};
  if (!username) return res.status(400).json({ error: 'Missing username' });
  
  try {
    // Clean up expired tokens first
    await DB.deleteExpiredResetTokens().catch(err => 
      console.error('Failed to delete expired tokens:', err)
    );
    
    const uname = username.toLowerCase();
    const user = await DB.findUserByUsername(uname);
    
    // SECURITY: Always return the same response to prevent user enumeration
    // Don't reveal whether the user exists or not
    if (!user) {
      console.log(`Password reset requested for non-existent user: ${uname}`);
      // Still return success to prevent user enumeration
      return res.json({ 
        success: true, 
        message: 'If an account with that email exists, a password reset email has been sent.' 
      });
    }
    
    // Generate secure reset token (64 character hex string)
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Token expires in 30 minutes
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    
    // Store token in database
    await DB.createPasswordResetToken(user.id, resetToken, expiresAt);
    
    // Send email with reset token (non-blocking)
    sendPasswordResetEmail(user.username, resetToken).catch(err => 
      console.error('Failed to send password reset email:', err)
    );
    
    res.json({ 
      success: true, 
      message: 'If an account with that email exists, a password reset email has been sent.' 
    });
  } catch (e) {
    console.error('Request password reset error:', e);
    res.status(500).json({ error: 'Failed to process password reset request' });
  }
});

// Password reset - Step 2: Confirm reset with token
app.post('/auth/confirm-password-reset', async (req, res) => {
  const { token, newPassword } = req.body || {};
  if (!token || !newPassword) {
    return res.status(400).json({ error: 'Missing token or password' });
  }
  
  if (String(newPassword).length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }
  
  try {
    // Find the reset token
    const resetToken = await DB.findResetToken(token);
    
    if (!resetToken) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }
    
    // Check if token has already been used
    if (resetToken.used) {
      return res.status(400).json({ error: 'This reset token has already been used' });
    }
    
    // Check if token has expired
    if (new Date(resetToken.expiresAt) < new Date()) {
      await DB.deleteExpiredResetTokens().catch(err => 
        console.error('Failed to delete expired tokens:', err)
      );
      return res.status(400).json({ error: 'Reset token has expired. Please request a new one.' });
    }
    
    // Get user
    const user = await DB.findUserById(resetToken.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Update password
    const hash = bcrypt.hashSync(newPassword, 10);
    await DB.updateUserPassword(user.id, hash);
    
    // Mark token as used
    await DB.markResetTokenAsUsed(token);
    
    // Delete all user sessions (force re-login)
    await DB.deleteUserSessions(user.id);
    
    // Send confirmation email (non-blocking)
    sendPasswordChangedEmail(user.username).catch(err => 
      console.error('Failed to send password changed email:', err)
    );
    
    console.log(`Password reset successful for user: ${user.username}`);
    
    res.json({ 
      success: true, 
      message: 'Password has been reset successfully. Please log in with your new password.' 
    });
  } catch (e) {
    console.error('Confirm password reset error:', e);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// User preferences
app.get('/user/preferences', async (req, res) => {
  const auth = await getUserFromAuth(req);
  if (!auth) return res.status(401).json({ error: 'Unauthorized' });
  
  try {
    const user = await DB.getUserPreferences(auth.user.id);
    res.json({ shareResponses: user?.shareResponses ?? 1 });
  } catch (e) {
    console.error('Get preferences error:', e);
    res.status(500).json({ error: 'Failed to fetch preferences' });
  }
});

app.put('/user/preferences', async (req, res) => {
  const auth = await getUserFromAuth(req);
  if (!auth) return res.status(401).json({ error: 'Unauthorized' });
  const { shareResponses } = req.body || {};
  
  try {
    await DB.updateUserPreferences(auth.user.id, shareResponses);
    res.json({ success: true });
  } catch (e) {
    console.error('Update preferences error:', e);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

// Responses endpoints
app.get('/responses', async (req, res) => {
  const auth = await getUserFromAuth(req);
  if (!auth) return res.status(401).json({ error: 'Unauthorized' });
  const { category } = req.query;
  
  try {
    const rows = await DB.getResponses(auth.user.id, category);
    res.json(rows.map(rowToResponse));
  } catch (e) {
    console.error('Get responses error:', e);
    res.status(500).json({ error: 'Failed to fetch responses' });
  }
});

app.get('/responses/crowd', async (req, res) => {
  const auth = await getUserFromAuth(req);
  if (!auth) return res.status(401).json({ error: 'Unauthorized' });
  
  try {
    const rows = await DB.getCrowdResponses(auth.user.id);
    res.json(rows.map(rowToResponse));
  } catch (e) {
    console.error('Get crowd responses error:', e);
    res.status(500).json({ error: 'Failed to fetch crowd-sourced responses' });
  }
});

app.post('/responses', async (req, res) => {
  const auth = await getUserFromAuth(req);
  if (!auth) return res.status(401).json({ error: 'Unauthorized' });
  const { id, text, category, userCreated, source, tags } = req.body || {};
  if (!id || !text || !category) return res.status(400).json({ error: 'Missing id, text, or category' });
  
  try {
    const row = await DB.createResponse(id, text, category, userCreated, source, tags, auth.user.id);
    res.status(201).json(rowToResponse(row));
  } catch (e) {
    if (e && String(e.message || '').includes('Duplicate') || String(e.message || '').includes('UNIQUE')) {
      return res.status(409).json({ error: 'ID already exists' });
    }
    console.error('Create response error:', e);
    res.status(500).json({ error: 'Failed to create response' });
  }
});

app.put('/responses/:id', async (req, res) => {
  const auth = await getUserFromAuth(req);
  if (!auth) return res.status(401).json({ error: 'Unauthorized' });
  const { id } = req.params;
  const { text, category, userCreated, source, tags } = req.body || {};
  
  try {
    const updated = await DB.updateResponse(id, auth.user.id, { text, category, userCreated, source, tags });
    if (!updated) return res.status(404).json({ error: 'Not found' });
    res.json(rowToResponse(updated));
  } catch (e) {
    console.error('Update response error:', e);
    res.status(500).json({ error: 'Failed to update response' });
  }
});

app.delete('/responses/:id', async (req, res) => {
  const auth = await getUserFromAuth(req);
  if (!auth) return res.status(401).json({ error: 'Unauthorized' });
  const { id } = req.params;
  
  try {
    const deleted = await DB.deleteResponse(id, auth.user.id);
    if (!deleted) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  } catch (e) {
    console.error('Delete response error:', e);
    res.status(500).json({ error: 'Failed to delete response' });
  }
});

// Applications endpoints
app.get('/applications', async (req, res) => {
  const auth = await getUserFromAuth(req);
  if (!auth) return res.status(401).json({ error: 'Unauthorized' });
  
  try {
    const apps = await DB.getApplications(auth.user.id);
    res.json(apps);
  } catch (e) {
    console.error('Get applications error:', e);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

app.post('/applications', async (req, res) => {
  const auth = await getUserFromAuth(req);
  if (!auth) return res.status(401).json({ error: 'Unauthorized' });
  
  const { id, company, role, status, notes, date, paragraphs, timeSpent } = req.body || {};
  if (!id || !company || !role) {
    return res.status(400).json({ error: 'Missing required fields: id, company, role' });
  }
  
  try {
    await DB.createApplication({ id, userId: auth.user.id, company, role, status, notes, date, paragraphs, timeSpent });
    res.status(201).json({ id, message: 'Application created successfully' });
  } catch (e) {
    console.error('Create application error:', e);
    if (String(e.message || '').includes('Duplicate') || String(e.message || '').includes('UNIQUE')) {
      res.status(409).json({ error: 'Application with this ID already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create application' });
    }
  }
});

app.put('/applications/:id', async (req, res) => {
  const auth = await getUserFromAuth(req);
  if (!auth) return res.status(401).json({ error: 'Unauthorized' });
  
  const { id } = req.params;
  const updates = req.body || {};
  
  try {
    const updated = await DB.updateApplication(id, auth.user.id, updates);
    if (!updated) return res.status(404).json({ error: 'Application not found' });
    res.json({ id, message: 'Application updated successfully' });
  } catch (e) {
    console.error('Update application error:', e);
    res.status(500).json({ error: 'Failed to update application' });
  }
});

app.delete('/applications/:id', async (req, res) => {
  const auth = await getUserFromAuth(req);
  if (!auth) return res.status(401).json({ error: 'Unauthorized' });
  
  const { id } = req.params;
  
  try {
    const deleted = await DB.deleteApplication(id, auth.user.id);
    if (!deleted) return res.status(404).json({ error: 'Application not found' });
    res.json({ id, message: 'Application deleted successfully' });
  } catch (e) {
    console.error('Delete application error:', e);
    res.status(500).json({ error: 'Failed to delete application' });
  }
});

// AI endpoints
app.post('/api/extract-job-ad', async (req, res) => {
  const auth = await getUserFromAuth(req);
  if (!auth) return res.status(401).json({ error: 'Unauthorized' });
  
  if (aiQuotaExceeded) {
    return res.status(503).json({
      error: 'AI features temporarily unavailable',
      quotaExceeded: true,
      message: 'OpenAI quota has been exceeded. AI features are currently disabled.'
    });
  }
  
  const { jobAdText } = req.body || {};
  if (!jobAdText) return res.status(400).json({ error: 'Missing jobAdText' });
  
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that extracts structured information from job advertisements. Return your response as valid JSON only, with no additional text or markdown formatting.'
        },
        {
          role: 'user',
          content: `Extract the following information from this job ad and return it as JSON with these exact keys: "roleTitle", "companyName", "contactPerson", "reference", "businessAddress". If any field is not found, use null.\n\nJob Ad:\n${jobAdText}`
        }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });
    
    const extracted = JSON.parse(completion.choices[0].message.content);
    incrementStat('aiExtractCalls');
    res.json(extracted);
  } catch (e) {
    console.error('OpenAI extraction error:', e);
    
    if (e.status === 429 && e.code === 'insufficient_quota') {
      aiQuotaExceeded = true;
      aiQuotaExceededAt = new Date().toISOString();
      return res.status(503).json({
        error: 'AI quota exceeded',
        quotaExceeded: true,
        message: 'OpenAI quota has been exceeded. AI features are now disabled for all users.'
      });
    }
    
    res.status(500).json({ error: 'Failed to extract job ad information' });
  }
});

app.post('/api/generate-paragraphs', async (req, res) => {
  const auth = await getUserFromAuth(req);
  if (!auth) return res.status(401).json({ error: 'Unauthorized' });
  
  if (aiQuotaExceeded) {
    return res.status(503).json({
      error: 'AI features temporarily unavailable',
      quotaExceeded: true,
      message: 'OpenAI quota has been exceeded. AI features are currently disabled.'
    });
  }
  
  const { jobAdText, profile, resumeText } = req.body || {};
  if (!jobAdText) return res.status(400).json({ error: 'Missing jobAdText' });
  
  try {
    // Step 1: Extract job information
    const extractCompletion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that extracts structured information from job advertisements. Return your response as valid JSON only.'
        },
        {
          role: 'user',
          content: `Extract the following information from this job ad and return it as JSON with these exact keys: "roleTitle", "companyName", "contactPerson", "reference", "businessAddress". If any field is not found, use null.\n\nJob Ad:\n${jobAdText}`
        }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });
    
    const extracted = JSON.parse(extractCompletion.choices[0].message.content);
    
    // Step 2: Generate targeted responses for job criteria
    const profileInfo = profile ? `\n\nCandidate Profile:\nName: ${profile.firstName} ${profile.lastName}\nIndustry: ${profile.industry || 'Not specified'}\nKey Skills: ${profile.keywords?.join(', ') || 'Not specified'}` : '';
    const resumeInfo = resumeText ? `\n\nCandidate Resume:\n${resumeText}` : '';
    
    const generateCompletion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert cover letter writer. Analyze job requirements and generate multiple tailored paragraphs addressing specific criteria. Each paragraph should be professional, specific, and compelling.'
        },
        {
          role: 'user',
          content: `Based on this job advertisement, the candidate's profile, and their resume, generate separate paragraphs for each key requirement or criterion mentioned in the job ad. Each paragraph should address a specific aspect (skills, experience, qualifications, motivation, etc.).${profileInfo}${resumeInfo}\n\nJob Ad:\n${jobAdText}\n\nReturn your response as JSON with this structure:\n{\n  "jobInfo": { "roleTitle": string, "companyName": string, "contactPerson": string, "reference": string, "businessAddress": string },\n  "responses": [\n    { "text": "paragraph text", "tag": "appropriate tag like Introduction, Skills, Experience, Motivation, etc." }\n  ]\n}\n\nGenerate 4-8 targeted paragraphs covering: Introduction, relevant Skills/Experience for each major requirement, Why this company/role, and Closing.`
        }
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' }
    });
    
    const result = JSON.parse(generateCompletion.choices[0].message.content);
    
    // Merge extracted job info with generated responses
    result.jobInfo = { ...extracted, ...result.jobInfo };
    incrementStat('aiGenerateCalls');
    
    res.json(result);
  } catch (e) {
    console.error('OpenAI generation error:', e);
    
    if (e.status === 429 && e.code === 'insufficient_quota') {
      aiQuotaExceeded = true;
      aiQuotaExceededAt = new Date().toISOString();
      return res.status(503).json({
        error: 'AI quota exceeded',
        quotaExceeded: true,
        message: 'OpenAI quota has been exceeded. AI features are now disabled for all users.'
      });
    }
    
    res.status(500).json({ error: 'Failed to generate paragraphs' });
  }
});

// ─── Generate cover letter from guided answers ───
app.post('/api/generate-from-answers', async (req, res) => {
  const auth = await getUserFromAuth(req);
  if (!auth) return res.status(401).json({ error: 'Unauthorized' });

  if (aiQuotaExceeded) {
    return res.status(503).json({ error: 'AI features temporarily unavailable', quotaExceeded: true });
  }

  const { jobAdText, answers, profile } = req.body || {};
  if (!jobAdText || !answers) return res.status(400).json({ error: 'Missing jobAdText or answers' });

  try {
    const profileInfo = profile ? `\nCandidate: ${profile.firstName || ''} ${profile.lastName || ''}, Industry: ${profile.industry || 'N/A'}` : '';
    const answersText = Object.entries(answers).map(([q, a]) => `Q: ${q}\nA: ${a}`).join('\n\n');

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert cover letter writer. Given a job ad and the candidate\'s answers to guided questions, produce a polished cover letter broken into tagged sections. Return JSON only.'
        },
        {
          role: 'user',
          content: `Job Ad:\n${jobAdText}\n${profileInfo}\n\nCandidate Answers:\n${answersText}\n\nReturn JSON: { "sections": [ { "tag": "Introduction|Experience|Skills|Motivation|Closing", "text": "paragraph" } ] }. Generate 4-6 sections.`
        }
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' }
    });

    const result = JSON.parse(completion.choices[0].message.content);
    incrementStat('aiGenerateFromAnswersCalls');
    res.json(result);
  } catch (e) {
    console.error('Generate from answers error:', e);
    if (e.status === 429 && e.code === 'insufficient_quota') {
      aiQuotaExceeded = true;
      aiQuotaExceededAt = new Date().toISOString();
      return res.status(503).json({ error: 'AI quota exceeded', quotaExceeded: true });
    }
    res.status(500).json({ error: 'Failed to generate letter from answers' });
  }
});

// ─── ATS Match Score ───
app.post('/api/ats-score', async (req, res) => {
  const auth = await getUserFromAuth(req);
  if (!auth) return res.status(401).json({ error: 'Unauthorized' });

  if (aiQuotaExceeded) {
    return res.status(503).json({ error: 'AI features temporarily unavailable', quotaExceeded: true });
  }

  const { jobAdText, coverLetterText } = req.body || {};
  if (!jobAdText || !coverLetterText) return res.status(400).json({ error: 'Missing jobAdText or coverLetterText' });

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an ATS (Applicant Tracking System) scoring expert. Score how well a cover letter matches a job ad. Return JSON only.'
        },
        {
          role: 'user',
          content: `Score this cover letter against the job ad.\n\nJob Ad:\n${jobAdText}\n\nCover Letter:\n${coverLetterText}\n\nReturn JSON: { "score": <0-100>, "matchedKeywords": ["keyword1","keyword2",...], "missingKeywords": ["keyword1",...], "suggestions": ["improvement tip 1",...] }`
        }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });

    const result = JSON.parse(completion.choices[0].message.content);
    incrementStat('aiAtsScoreCalls');
    res.json(result);
  } catch (e) {
    console.error('ATS score error:', e);
    if (e.status === 429 && e.code === 'insufficient_quota') {
      aiQuotaExceeded = true;
      aiQuotaExceededAt = new Date().toISOString();
      return res.status(503).json({ error: 'AI quota exceeded', quotaExceeded: true });
    }
    res.status(500).json({ error: 'Failed to compute ATS score' });
  }
});

// ─── Quick Apply (single-call full letter generation) ───
app.post('/api/quick-apply', async (req, res) => {
  const auth = await getUserFromAuth(req);
  if (!auth) return res.status(401).json({ error: 'Unauthorized' });

  if (aiQuotaExceeded) {
    return res.status(503).json({ error: 'AI features temporarily unavailable', quotaExceeded: true });
  }

  const { jobAdText, profile, resumeText } = req.body || {};
  if (!jobAdText) return res.status(400).json({ error: 'Missing jobAdText' });

  try {
    const profileInfo = profile ? `\nCandidate: ${profile.firstName || ''} ${profile.lastName || ''}, Phone: ${profile.phoneNumber || ''}, Address: ${profile.addressLine1 || ''} ${profile.addressLine2 || ''}` : '';
    const resumeInfo = resumeText ? `\nResume:\n${resumeText}` : '';

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert cover letter writer. Generate a complete, professional cover letter from a job ad. Extract job details and produce polished sections. Return JSON only.'
        },
        {
          role: 'user',
          content: `Generate a full cover letter for this job ad.${profileInfo}${resumeInfo}\n\nJob Ad:\n${jobAdText}\n\nReturn JSON: { "jobInfo": { "roleTitle": string, "companyName": string, "contactPerson": string|null }, "sections": [ { "tag": "Introduction|Experience|Skills|Motivation|Closing", "text": "paragraph" } ], "atsScore": <estimated 0-100> }. Generate 4-6 sections.`
        }
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' }
    });

    const result = JSON.parse(completion.choices[0].message.content);
    incrementStat('aiQuickApplyCalls');
    res.json(result);
  } catch (e) {
    console.error('Quick apply error:', e);
    if (e.status === 429 && e.code === 'insufficient_quota') {
      aiQuotaExceeded = true;
      aiQuotaExceededAt = new Date().toISOString();
      return res.status(503).json({ error: 'AI quota exceeded', quotaExceeded: true });
    }
    res.status(500).json({ error: 'Failed to generate quick apply letter' });
  }
});

// ─── Recruiter Endpoints ───
// GET /api/recruiter/candidates — list candidates visible to the recruiter's agency
app.get('/api/recruiter/candidates', async (req, res) => {
  const auth = await getUserFromAuth(req);
  if (!auth) return res.status(401).json({ error: 'Unauthorized' });

  try {
    // Check if user is an agency member
    let agencyId = null;
    if (dbType === 'mysql') {
      const [rows] = await db.execute('SELECT agencyId FROM agency_members WHERE userId = ?', [auth.user.id]);
      if (rows.length === 0) return res.status(403).json({ error: 'Not a recruiter' });
      agencyId = rows[0].agencyId;
    } else if (dbType === 'sqlite') {
      const row = db.prepare('SELECT agencyId FROM agency_members WHERE userId = ?').get(auth.user.id);
      if (!row) return res.status(403).json({ error: 'Not a recruiter' });
      agencyId = row.agencyId;
    } else {
      // JSON fallback
      const member = (store.agencyMembers || []).find(m => m.userId === auth.user.id);
      if (!member) return res.status(403).json({ error: 'Not a recruiter' });
      agencyId = member.agencyId;
    }

    // Get all applications from agency members' candidates
    let candidates = [];
    if (dbType === 'mysql') {
      const [rows] = await db.execute(
        `SELECT a.id, a.company, a.role, a.status, a.date, u.username
         FROM applications a JOIN users u ON a.userId = u.id
         ORDER BY a.updatedAt DESC LIMIT 50`);
      candidates = rows;
    } else if (dbType === 'sqlite') {
      candidates = db.prepare(
        `SELECT a.id, a.company, a.role, a.status, a.date, u.username
         FROM applications a JOIN users u ON a.userId = u.id
         ORDER BY a.updatedAt DESC LIMIT 50`).all();
    } else {
      const userMap = {};
      (store.users || []).forEach(u => { userMap[u.id] = u.username; });
      candidates = (store.applications || []).slice(0, 50).map(a => ({
        ...a, username: userMap[a.userId] || 'Unknown'
      }));
    }
    res.json(candidates);
  } catch (e) {
    console.error('Recruiter candidates error:', e);
    res.status(500).json({ error: 'Failed to fetch candidates' });
  }
});

// GET /api/recruiter/applications/:id — get a single application for review
app.get('/api/recruiter/applications/:id', async (req, res) => {
  const auth = await getUserFromAuth(req);
  if (!auth) return res.status(401).json({ error: 'Unauthorized' });

  const { id } = req.params;
  try {
    let app = null;
    if (dbType === 'mysql') {
      const [rows] = await db.execute(
        `SELECT a.*, u.username FROM applications a JOIN users u ON a.userId = u.id WHERE a.id = ?`, [id]);
      app = rows[0] || null;
    } else if (dbType === 'sqlite') {
      app = db.prepare(
        `SELECT a.*, u.username FROM applications a JOIN users u ON a.userId = u.id WHERE a.id = ?`).get(id);
    } else {
      const a = (store.applications || []).find(a => a.id === id);
      if (a) {
        const u = (store.users || []).find(u => u.id === a.userId);
        app = { ...a, username: u ? u.username : 'Unknown' };
      }
    }
    if (!app) return res.status(404).json({ error: 'Application not found' });
    res.json(app);
  } catch (e) {
    console.error('Recruiter app detail error:', e);
    res.status(500).json({ error: 'Failed to fetch application' });
  }
});

// POST /api/recruiter/review — submit approval/rejection + comment
app.post('/api/recruiter/review', async (req, res) => {
  const auth = await getUserFromAuth(req);
  if (!auth) return res.status(401).json({ error: 'Unauthorized' });

  const { applicationId, status, comment } = req.body || {};
  if (!applicationId || !status) return res.status(400).json({ error: 'Missing applicationId or status' });

  const reviewId = crypto.randomUUID();
  const now = new Date().toISOString();

  try {
    if (dbType === 'mysql') {
      await db.execute(
        `INSERT INTO letter_reviews (id, applicationId, reviewerId, status, comment, createdAt) VALUES (?, ?, ?, ?, ?, ?)`,
        [reviewId, applicationId, auth.user.id, status, comment || null, now]);
      await db.execute('UPDATE applications SET status = ? WHERE id = ?', [status, applicationId]);
    } else if (dbType === 'sqlite') {
      db.prepare(
        `INSERT INTO letter_reviews (id, applicationId, reviewerId, status, comment, createdAt) VALUES (?, ?, ?, ?, ?, ?)`
      ).run(reviewId, applicationId, auth.user.id, status, comment || null, now);
      db.prepare('UPDATE applications SET status = ? WHERE id = ?').run(status, applicationId);
    } else {
      if (!store.letterReviews) store.letterReviews = [];
      store.letterReviews.push({ id: reviewId, applicationId, reviewerId: auth.user.id, status, comment: comment || null, createdAt: now });
      const app = (store.applications || []).find(a => a.id === applicationId);
      if (app) app.status = status;
      saveStore();
    }
    res.json({ id: reviewId, message: 'Review submitted' });
  } catch (e) {
    console.error('Recruiter review error:', e);
    res.status(500).json({ error: 'Failed to submit review' });
  }
});

// GET /api/recruiter/library — shared agency response library
app.get('/api/recruiter/library', async (req, res) => {
  const auth = await getUserFromAuth(req);
  if (!auth) return res.status(401).json({ error: 'Unauthorized' });

  try {
    let agencyId = null;
    if (dbType === 'mysql') {
      const [rows] = await db.execute('SELECT agencyId FROM agency_members WHERE userId = ?', [auth.user.id]);
      if (rows.length === 0) return res.status(403).json({ error: 'Not a recruiter' });
      agencyId = rows[0].agencyId;
      const [libRows] = await db.execute('SELECT * FROM agency_responses WHERE agencyId = ? ORDER BY createdAt DESC', [agencyId]);
      res.json(libRows);
    } else if (dbType === 'sqlite') {
      const row = db.prepare('SELECT agencyId FROM agency_members WHERE userId = ?').get(auth.user.id);
      if (!row) return res.status(403).json({ error: 'Not a recruiter' });
      agencyId = row.agencyId;
      const items = db.prepare('SELECT * FROM agency_responses WHERE agencyId = ? ORDER BY createdAt DESC').all(agencyId);
      res.json(items);
    } else {
      const member = (store.agencyMembers || []).find(m => m.userId === auth.user.id);
      if (!member) return res.status(403).json({ error: 'Not a recruiter' });
      const items = (store.agencyResponses || []).filter(r => r.agencyId === member.agencyId);
      res.json(items);
    }
  } catch (e) {
    console.error('Agency library error:', e);
    res.status(500).json({ error: 'Failed to fetch agency library' });
  }
});

// POST /api/recruiter/library — add a response to agency library
app.post('/api/recruiter/library', async (req, res) => {
  const auth = await getUserFromAuth(req);
  if (!auth) return res.status(401).json({ error: 'Unauthorized' });

  const { text, category } = req.body || {};
  if (!text) return res.status(400).json({ error: 'Missing text' });

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  try {
    let agencyId = null;
    if (dbType === 'mysql') {
      const [rows] = await db.execute('SELECT agencyId FROM agency_members WHERE userId = ?', [auth.user.id]);
      if (rows.length === 0) return res.status(403).json({ error: 'Not a recruiter' });
      agencyId = rows[0].agencyId;
      await db.execute(
        'INSERT INTO agency_responses (id, agencyId, text, category, createdBy, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
        [id, agencyId, text, category || 'General', auth.user.id, now]);
    } else if (dbType === 'sqlite') {
      const row = db.prepare('SELECT agencyId FROM agency_members WHERE userId = ?').get(auth.user.id);
      if (!row) return res.status(403).json({ error: 'Not a recruiter' });
      agencyId = row.agencyId;
      db.prepare(
        'INSERT INTO agency_responses (id, agencyId, text, category, createdBy, createdAt) VALUES (?, ?, ?, ?, ?, ?)'
      ).run(id, agencyId, text, category || 'General', auth.user.id, now);
    } else {
      const member = (store.agencyMembers || []).find(m => m.userId === auth.user.id);
      if (!member) return res.status(403).json({ error: 'Not a recruiter' });
      if (!store.agencyResponses) store.agencyResponses = [];
      store.agencyResponses.push({ id, agencyId: member.agencyId, text, category: category || 'General', createdBy: auth.user.id, createdAt: now });
      saveStore();
    }
    res.json({ id, message: 'Response added to agency library' });
  } catch (e) {
    console.error('Agency library add error:', e);
    res.status(500).json({ error: 'Failed to add to agency library' });
  }
});

// Admin Stats API
app.get('/api/admin/stats', async (req, res) => {
  try {
    const stats = {
      totalUsers: 0,
      totalApplications: 0,
      totalResponses: 0,
      aiCallsExtract: 0,
      aiCallsGenerate: 0,
      applicationsByStatus: {},
      recentActivity: [],
      topUsers: []
    };

    // Get total users
    if (dbType === 'mysql') {
      const [userRows] = await db.execute('SELECT COUNT(*) as count FROM users');
      stats.totalUsers = userRows[0].count;
      
      const [appRows] = await db.execute('SELECT COUNT(*) as count FROM applications');
      stats.totalApplications = appRows[0].count;
      
      const [respRows] = await db.execute('SELECT COUNT(*) as count FROM responses');
      stats.totalResponses = respRows[0].count;
      
      // Applications by status
      const [statusRows] = await db.execute(
        'SELECT status, COUNT(*) as count FROM applications GROUP BY status ORDER BY count DESC'
      );
      statusRows.forEach(row => {
        stats.applicationsByStatus[row.status || 'Unknown'] = row.count;
      });
      
      // Top users by applications
      const [topUserRows] = await db.execute(`
        SELECT u.username, COUNT(a.id) as applicationCount, u.createdAt
        FROM users u
        LEFT JOIN applications a ON u.id = a.userId
        GROUP BY u.id, u.username, u.createdAt
        ORDER BY applicationCount DESC
        LIMIT 10
      `);
      stats.topUsers = topUserRows.map(row => ({
        username: row.username,
        applicationCount: row.applicationCount,
        memberSince: row.createdAt
      }));
      
      // Recent activity (last 20 applications)
      const [recentRows] = await db.execute(`
        SELECT a.company, a.role, a.createdAt, u.username
        FROM applications a
        JOIN users u ON a.userId = u.id
        ORDER BY a.createdAt DESC
        LIMIT 20
      `);
      stats.recentActivity = recentRows.map(row => ({
        username: row.username,
        company: row.company,
        role: row.role,
        createdAt: row.createdAt
      }));
      
    } else if (dbType === 'sqlite') {
      stats.totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
      stats.totalApplications = db.prepare('SELECT COUNT(*) as count FROM applications').get().count;
      stats.totalResponses = db.prepare('SELECT COUNT(*) as count FROM responses').get().count;
      
      // Applications by status
      const statusRows = db.prepare(
        'SELECT status, COUNT(*) as count FROM applications GROUP BY status ORDER BY count DESC'
      ).all();
      statusRows.forEach(row => {
        stats.applicationsByStatus[row.status || 'Unknown'] = row.count;
      });
      
      // Top users by applications
      const topUserRows = db.prepare(`
        SELECT u.username, COUNT(a.id) as applicationCount, u.createdAt
        FROM users u
        LEFT JOIN applications a ON u.id = a.userId
        GROUP BY u.id, u.username, u.createdAt
        ORDER BY applicationCount DESC
        LIMIT 10
      `).all();
      stats.topUsers = topUserRows.map(row => ({
        username: row.username,
        applicationCount: row.applicationCount,
        memberSince: row.createdAt
      }));
      
      // Recent activity
      const recentRows = db.prepare(`
        SELECT a.company, a.role, a.createdAt, u.username
        FROM applications a
        JOIN users u ON a.userId = u.id
        ORDER BY a.createdAt DESC
        LIMIT 20
      `).all();
      stats.recentActivity = recentRows.map(row => ({
        username: row.username,
        company: row.company,
        role: row.role,
        createdAt: row.createdAt
      }));
      
    } else {
      // JSON store
      stats.totalUsers = store.users?.length || 0;
      stats.totalApplications = store.applications?.length || 0;
      stats.totalResponses = store.responses?.length || 0;
      
      // Applications by status
      if (store.applications) {
        const statusCounts = {};
        store.applications.forEach(app => {
          const status = app.status || 'Unknown';
          statusCounts[status] = (statusCounts[status] || 0) + 1;
        });
        stats.applicationsByStatus = statusCounts;
      }
      
      // Top users
      if (store.users && store.applications) {
        const userAppCounts = {};
        store.applications.forEach(app => {
          userAppCounts[app.userId] = (userAppCounts[app.userId] || 0) + 1;
        });
        stats.topUsers = store.users.map(user => ({
          username: user.username,
          applicationCount: userAppCounts[user.id] || 0,
          memberSince: user.createdAt
        })).sort((a, b) => b.applicationCount - a.applicationCount).slice(0, 10);
      }
      
      // Recent activity
      if (store.applications && store.users) {
        const userMap = {};
        store.users.forEach(u => { userMap[u.id] = u.username; });
        stats.recentActivity = store.applications
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 20)
          .map(app => ({
            username: userMap[app.userId] || 'Unknown',
            company: app.company,
            role: app.role,
            createdAt: app.createdAt
          }));
      }
    }
    
    // Add AI usage stats from tracking
    const aiStats = readStats();
    stats.aiCallsExtract = aiStats.aiExtractCalls || 0;
    stats.aiCallsGenerate = aiStats.aiGenerateCalls || 0;
    
    res.json(stats);
  } catch (e) {
    console.error('Admin stats error:', e);
    res.status(500).json({ error: 'Failed to fetch admin stats' });
  }
});

// ─── Admin log viewer endpoint ───
// Protected by LOG_VIEWER_KEY env var. Access via:
//   GET /api/admin/logs?key=YOUR_KEY&type=error&lines=100
//   type: error | combined | exceptions | rejections
app.get('/api/admin/logs', (req, res) => {
  const key = req.query.key || req.headers['x-log-key'];
  if (!process.env.LOG_VIEWER_KEY || key !== process.env.LOG_VIEWER_KEY) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const type = req.query.type || 'error';
  const lines = parseInt(req.query.lines) || 100;

  if (req.query.list === 'true') {
    return res.json({ files: logger.listLogFiles() });
  }

  const result = logger.readLogFile(type, lines);
  res.json(result);
});

// ─── Admin health-check endpoint ───
// Detailed server + DB health for remote diagnostics
app.get('/api/admin/health', async (req, res) => {
  const key = req.query.key || req.headers['x-log-key'];
  if (!process.env.LOG_VIEWER_KEY || key !== process.env.LOG_VIEWER_KEY) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const health = {
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(process.uptime())}s`,
    memory: process.memoryUsage(),
    nodeVersion: process.version,
    env: process.env.NODE_ENV || 'development',
    database: { type: dbType, status: 'unknown' },
  };

  if (dbType === 'mysql' && db) {
    try {
      const start = Date.now();
      await db.execute('SELECT 1 AS ok');
      health.database.status = 'connected';
      health.database.pingMs = Date.now() - start;
    } catch (e) {
      health.database.status = 'error';
      health.database.error = e.message;
      health.database.code = e.code;
      logger.db('error', 'Health check DB ping failed', { error: e.message, code: e.code });
    }
  } else if (dbType === 'sqlite' && db) {
    try {
      db.prepare('SELECT 1 AS ok').get();
      health.database.status = 'connected';
    } catch (e) {
      health.database.status = 'error';
      health.database.error = e.message;
    }
  } else {
    health.database.status = dbType === 'json' ? 'json-store' : 'not-initialised';
  }

  res.json(health);
});

// ─── Global Express error handler (must be last middleware) ───
app.use(logger.errorMiddleware);

// Start server
initDatabase().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 VitaePro server running on http://localhost:${PORT}`);
    console.log(`📊 Database: ${dbType.toUpperCase()}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📝 Logs directory: ${logger.logsDir}\n`);
  });
}).catch(err => {
  logger.error('Failed to initialise database - server cannot start', {
    component: 'database',
    error: err.message,
    stack: err.stack,
    code: err.code,
  });
  console.error('Failed to initialize database:', err);
  process.exit(1);
});


// --- Stats Tracking ---
const statsFile = path.join(dataDir, 'stats.json');
function readStats() {
  try {
    if (fs.existsSync(statsFile)) {
      return JSON.parse(fs.readFileSync(statsFile, 'utf8'));
    }
  } catch (e) {
    console.error('Failed to read stats:', e);
  }
  return { users: 0, actions: 0, lastUpdated: null };
}

function writeStats(stats) {
  try {
    fs.writeFileSync(statsFile, JSON.stringify(stats, null, 2));
  } catch (e) {
    console.error('Failed to write stats:', e);
  }
}

function incrementStat(key) {
  const stats = readStats();
  stats[key] = (stats[key] || 0) + 1;
  stats.lastUpdated = new Date().toISOString();
  writeStats(stats);
}

// Stats API endpoint
app.get('/api/stats', (req, res) => {
  const stats = readStats();
  res.json(stats);
});

// Increment stats on user registration
const origCreateUser = DB.createUser;
DB.createUser = async function(...args) {
  await origCreateUser.apply(DB, args);
  incrementStat('users');
};

// Increment stats on application creation
const origCreateApplication = DB.createApplication;
DB.createApplication = async function(data) {
  await origCreateApplication.call(DB, data);
  if ((data.status || '').toLowerCase() === 'draft') {
    incrementStat('drafts');
  } else {
    incrementStat('actions');
  }
};
