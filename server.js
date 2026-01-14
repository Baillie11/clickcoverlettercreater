// VitaePro Backend Server - MySQL Compatible
// Supports both SQLite (development) and MySQL (production)
// Run with: node server.js

require('dotenv').config();

const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

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

      // Create tables
      await createMySQLTables(pool);
      
      db = pool;
      dbType = 'mysql';
    } catch (e) {
      console.error('❌ MySQL connection failed:', e.message);
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

  // Indexes
  try {
    db.prepare('CREATE INDEX IF NOT EXISTS idx_applications_userId ON applications(userId)').run();
    db.prepare('CREATE INDEX IF NOT EXISTS idx_applications_date ON applications(date)').run();
    db.prepare('CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status)').run();
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
let store = { users: [], sessions: [], responses: [], applications: [] };

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

// Express app setup
const app = express();
const PORT = process.env.PORT || 3050;

// CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? ['https://clickcoverlettercreator.com.au', 'https://www.clickcoverlettercreator.com.au']
    : true,
  credentials: true
};
app.use(cors(corsOptions));
app.use(express.json({ limit: '1mb' }));

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
    const createdAt = nowIso();
    const expiresAt = plusDays(7);
    
    if (dbType === 'mysql') {
      await db.execute(
        'INSERT INTO sessions (token, userId, createdAt, expiresAt) VALUES (?, ?, ?, ?)',
        [token, userId, createdAt, expiresAt]
      );
    } else if (dbType === 'sqlite') {
      db.prepare('INSERT INTO sessions (token, userId, createdAt, expiresAt) VALUES (?, ?, ?, ?)')
        .run(token, userId, createdAt, expiresAt);
    } else {
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
  }
};

// Authentication middleware
async function getUserFromAuth(req) {
  try {
    const h = req.headers['authorization'] || '';
    const m = /^Bearer\s+(.+)$/i.exec(h);
    if (!m) return null;
    
    const token = m[1];
    const session = await DB.findSessionByToken(token);
    if (!session) return null;
    
    if (new Date(session.expiresAt) < new Date()) {
      await DB.deleteSession(token);
      return null;
    }
    
    const user = await DB.findUserById(session.userId);
    if (!user) return null;
    
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

app.post('/auth/reset-password', async (req, res) => {
  const { username, newPassword } = req.body || {};
  if (!username || !newPassword) return res.status(400).json({ error: 'Missing username or password' });
  if (String(newPassword).length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
  
  try {
    const uname = username.toLowerCase();
    const user = await DB.findUserByUsername(uname);
    if (!user) return res.status(404).json({ error: 'Username not found' });
    
    const hash = bcrypt.hashSync(newPassword, 10);
    await DB.updateUserPassword(user.id, hash);
    await DB.deleteUserSessions(user.id);
    
    res.json({ success: true, message: 'Password reset successfully' });
  } catch (e) {
    console.error('Reset password error:', e);
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
  
  const { jobAdText, roleTitle, companyName } = req.body || {};
  if (!jobAdText) return res.status(400).json({ error: 'Missing jobAdText' });
  
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert cover letter writer. Generate professional, tailored cover letter paragraphs based on job advertisements.'
        },
        {
          role: 'user',
          content: `Based on this job advertisement${roleTitle ? ` for the position of ${roleTitle}` : ''}${companyName ? ` at ${companyName}` : ''}, generate 3 professional cover letter paragraphs:\n\n1. An opening paragraph expressing interest\n2. A body paragraph highlighting relevant skills and experience\n3. A closing paragraph\n\nJob Ad:\n${jobAdText}\n\nReturn your response as JSON with keys "opening", "body", "closing".`
        }
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' }
    });
    
    const paragraphs = JSON.parse(completion.choices[0].message.content);
    res.json(paragraphs);
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

// Start server
initDatabase().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 VitaePro server running on http://localhost:${PORT}`);
    console.log(`📊 Database: ${dbType.toUpperCase()}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}\n`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});
