// Simple local backend to persist responses using SQLite
// Run with: node server.js
// Requires: npm i express cors better-sqlite3

const path = require('path');
const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');

const app = express();
const PORT = process.env.PORT || 5050;

app.use(cors({ origin: true }));
app.use(express.json({ limit: '1mb' }));

// Database setup
const dbFile = path.join(__dirname, 'data.db');
const db = new Database(dbFile);

// Users and sessions for simple auth
// Users
db.prepare(`CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  passwordHash TEXT NOT NULL,
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

// Responses (with userId)
db.prepare(`CREATE TABLE IF NOT EXISTS responses (
  id TEXT PRIMARY KEY,
  text TEXT NOT NULL,
  category TEXT NOT NULL,
  userCreated INTEGER NOT NULL,
  source TEXT,
  createdAt TEXT NOT NULL,
  userId TEXT
)`).run();

// Ensure userId column exists (migration for older DBs)
try {
  const cols = db.prepare("PRAGMA table_info('responses')").all();
  if (!cols.some(c => c.name === 'userId')) {
    db.prepare('ALTER TABLE responses ADD COLUMN userId TEXT').run();
  }
} catch {}

// Helpers
function rowToResponse(row) {
  return {
    id: row.id,
    text: row.text,
    category: row.category,
    userCreated: !!row.userCreated,
    source: row.source || null,
    createdAt: row.createdAt
  };
}

// Auth helpers
const bcrypt = require('bcryptjs');
function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}
function genToken() {
  return Buffer.from(require('crypto').randomBytes(24)).toString('hex');
}
function nowIso() { return new Date().toISOString(); }
function plusDays(days) {
  const d = new Date(); d.setDate(d.getDate()+days); return d.toISOString();
}
function getUserFromAuth(req) {
  try {
    const h = req.headers['authorization'] || '';
    const m = /^Bearer\s+(.+)$/i.exec(h);
    if (!m) return null;
    const token = m[1];
    const s = db.prepare('SELECT * FROM sessions WHERE token = ?').get(token);
    if (!s) return null;
    if (new Date(s.expiresAt) < new Date()) {
      db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
      return null;
    }
    const user = db.prepare('SELECT id, username FROM users WHERE id = ?').get(s.userId);
    if (!user) return null;
    return { token, user };
  } catch { return null; }
}

// Routes
app.get('/health', (req, res) => res.json({ ok: true }));

// Auth routes
app.post('/auth/register', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password || String(username).length < 3 || String(password).length < 6) {
    return res.status(400).json({ error: 'Username min 3 chars, Password min 6 chars' });
  }
  try {
    const existing = db.prepare('SELECT 1 FROM users WHERE username = ?').get(username.toLowerCase());
    if (existing) return res.status(409).json({ error: 'Username already exists' });
    const id = genId();
    const hash = bcrypt.hashSync(password, 10);
    db.prepare('INSERT INTO users (id, username, passwordHash, createdAt) VALUES (?, ?, ?, ?)')
      .run(id, username.toLowerCase(), hash, nowIso());
    // Create session
    const token = genToken();
    db.prepare('INSERT INTO sessions (token, userId, createdAt, expiresAt) VALUES (?, ?, ?, ?)')
      .run(token, id, nowIso(), plusDays(7));
    res.json({ token, user: { id, username: username.toLowerCase() } });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to register' });
  }
});

app.post('/auth/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'Missing credentials' });
  try {
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username.toLowerCase());
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    if (!bcrypt.compareSync(password, user.passwordHash)) return res.status(401).json({ error: 'Invalid credentials' });
    const token = genToken();
    db.prepare('INSERT INTO sessions (token, userId, createdAt, expiresAt) VALUES (?, ?, ?, ?)')
      .run(token, user.id, nowIso(), plusDays(7));
    res.json({ token, user: { id: user.id, username: user.username } });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to login' });
  }
});

app.get('/auth/me', (req, res) => {
  const auth = getUserFromAuth(req);
  if (!auth) return res.status(401).json({ error: 'Unauthorized' });
  res.json(auth.user);
});

app.post('/auth/logout', (req, res) => {
  try {
    const h = req.headers['authorization'] || '';
    const m = /^Bearer\s+(.+)$/i.exec(h);
    if (m) {
      db.prepare('DELETE FROM sessions WHERE token = ?').run(m[1]);
    }
  } catch {}
  res.json({ ok: true });
});

// List responses (optionally filter by category) — requires auth
app.get('/responses', (req, res) => {
  const auth = getUserFromAuth(req);
  if (!auth) return res.status(401).json({ error: 'Unauthorized' });
  const { category } = req.query;
  try {
    let rows;
    if (category) {
      rows = db.prepare('SELECT * FROM responses WHERE userId = ? AND category = ? ORDER BY createdAt ASC').all(auth.user.id, category);
    } else {
      rows = db.prepare('SELECT * FROM responses WHERE userId = ? ORDER BY createdAt ASC').all(auth.user.id);
    }
    res.json(rows.map(rowToResponse));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch responses' });
  }
});

// Create response — requires auth
app.post('/responses', (req, res) => {
  const auth = getUserFromAuth(req);
  if (!auth) return res.status(401).json({ error: 'Unauthorized' });
  const { id, text, category, userCreated, source } = req.body || {};
  if (!id || !text || !category) return res.status(400).json({ error: 'Missing id, text, or category' });
  try {
    const createdAt = new Date().toISOString();
    db.prepare('INSERT INTO responses (id, text, category, userCreated, source, createdAt, userId) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(id, text, category, userCreated ? 1 : 0, source || null, createdAt, auth.user.id);
    const row = db.prepare('SELECT * FROM responses WHERE id = ?').get(id);
    res.status(201).json(rowToResponse(row));
  } catch (e) {
    if (e && String(e.message || '').includes('UNIQUE')) {
      return res.status(409).json({ error: 'ID already exists' });
    }
    console.error(e);
    res.status(500).json({ error: 'Failed to create response' });
  }
});

// Update response — requires auth and ownership
app.put('/responses/:id', (req, res) => {
  const auth = getUserFromAuth(req);
  if (!auth) return res.status(401).json({ error: 'Unauthorized' });
  const { id } = req.params;
  const { text, category, userCreated, source } = req.body || {};
  try {
    const existing = db.prepare('SELECT * FROM responses WHERE id = ? AND userId = ?').get(id, auth.user.id);
    if (!existing) return res.status(404).json({ error: 'Not found' });

    db.prepare('UPDATE responses SET text = ?, category = ?, userCreated = ?, source = ? WHERE id = ?')
      .run(text ?? existing.text, category ?? existing.category, (userCreated ? 1 : 0), source ?? existing.source, id);

    const updated = db.prepare('SELECT * FROM responses WHERE id = ?').get(id);
    res.json(rowToResponse(updated));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to update response' });
  }
});

// Delete response — requires auth and ownership
app.delete('/responses/:id', (req, res) => {
  const auth = getUserFromAuth(req);
  if (!auth) return res.status(401).json({ error: 'Unauthorized' });
  const { id } = req.params;
  try {
    const info = db.prepare('DELETE FROM responses WHERE id = ? AND userId = ?').run(id, auth.user.id);
    if (info.changes === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to delete response' });
  }
});

app.listen(PORT, () => {
  console.log(`Responses DB server listening on http://localhost:${PORT}`);
});
