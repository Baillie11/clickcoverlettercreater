// Simple local backend to persist responses using SQLite
// Run with: node server.js
// Requires: npm i express cors better-sqlite3

require('dotenv').config();

const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
let Database = null;
try { Database = require('better-sqlite3'); } catch (e) { console.warn('better-sqlite3 not available; using JSON file store.'); }

// OpenAI setup
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Track OpenAI quota status
let aiQuotaExceeded = false;
let aiQuotaExceededAt = null;

const app = express();
const PORT = process.env.PORT || 5050;

app.use(cors({ origin: true }));
app.use(express.json({ limit: '1mb' }));

// Serve static files
app.use(express.static(__dirname));

// Database setup
const dbFile = path.join(__dirname, 'data.db');
const db = Database ? new Database(dbFile) : null;

// JSON store fallback
const storeFile = path.join(__dirname, 'data.json');
let store = { users: [], sessions: [], responses: [] };
if (!db) {
  try {
    if (fs.existsSync(storeFile)) {
      store = JSON.parse(fs.readFileSync(storeFile, 'utf8')) || store;
    } else {
      fs.writeFileSync(storeFile, JSON.stringify(store, null, 2));
    }
  } catch (e) { console.error('Failed to init JSON store', e); }
}
function saveStore() {
  if (!db) {
    try { fs.writeFileSync(storeFile, JSON.stringify(store, null, 2)); } catch {}
  }
}

// Users and sessions for simple auth (SQLite setup)
if (db) {
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
}

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
    let s;
    if (db) s = db.prepare('SELECT * FROM sessions WHERE token = ?').get(token);
    else s = store.sessions.find(x => x.token === token);
    if (!s) return null;
    if (new Date(s.expiresAt) < new Date()) {
      if (db) db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
      else { store.sessions = store.sessions.filter(x => x.token !== token); saveStore(); }
      return null;
    }
    let user;
    if (db) user = db.prepare('SELECT id, username FROM users WHERE id = ?').get(s.userId);
    else user = store.users.find(u => u.id === s.userId);
    if (!user) return null;
    return { token, user: { id: user.id, username: user.username } };
  } catch { return null; }
}

// Routes
app.get('/health', (req, res) => res.json({ ok: true }));

// AI Status endpoint
app.get('/api/ai-status', (req, res) => {
  res.json({
    available: !aiQuotaExceeded,
    quotaExceeded: aiQuotaExceeded,
    exceededAt: aiQuotaExceededAt
  });
});

// Auth routes
app.post('/auth/register', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password || String(username).length < 3 || String(password).length < 6) {
    return res.status(400).json({ error: 'Username min 3 chars, Password min 6 chars' });
  }
  try {
    const uname = username.toLowerCase();
    let existing;
    if (db) existing = db.prepare('SELECT 1 FROM users WHERE username = ?').get(uname);
    else existing = store.users.find(u => u.username === uname);
    if (existing) return res.status(409).json({ error: 'Username already exists' });
    const id = genId();
    const hash = bcrypt.hashSync(password, 10);
    if (db) {
      db.prepare('INSERT INTO users (id, username, passwordHash, createdAt) VALUES (?, ?, ?, ?)')
        .run(id, uname, hash, nowIso());
    } else {
      store.users.push({ id, username: uname, passwordHash: hash, createdAt: nowIso() });
      saveStore();
    }
    // Create session
    const token = genToken();
    if (db) db.prepare('INSERT INTO sessions (token, userId, createdAt, expiresAt) VALUES (?, ?, ?, ?)')
      .run(token, id, nowIso(), plusDays(7));
    else { store.sessions.push({ token, userId: id, createdAt: nowIso(), expiresAt: plusDays(7) }); saveStore(); }
    res.json({ token, user: { id, username: uname } });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to register' });
  }
});

app.post('/auth/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'Missing credentials' });
  try {
    const uname = username.toLowerCase();
    let user;
    if (db) user = db.prepare('SELECT * FROM users WHERE username = ?').get(uname);
    else user = store.users.find(u => u.username === uname);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    if (!bcrypt.compareSync(password, user.passwordHash)) return res.status(401).json({ error: 'Invalid credentials' });
    const token = genToken();
    if (db) db.prepare('INSERT INTO sessions (token, userId, createdAt, expiresAt) VALUES (?, ?, ?, ?)')
      .run(token, user.id, nowIso(), plusDays(7));
    else { store.sessions.push({ token, userId: user.id, createdAt: nowIso(), expiresAt: plusDays(7) }); saveStore(); }
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
      if (db) db.prepare('DELETE FROM sessions WHERE token = ?').run(m[1]);
      else { store.sessions = store.sessions.filter(s => s.token !== m[1]); saveStore(); }
    }
  } catch {}
  res.json({ ok: true });
});

app.post('/auth/reset-password', (req, res) => {
  const { username, newPassword } = req.body || {};
  if (!username || !newPassword) return res.status(400).json({ error: 'Missing username or password' });
  if (String(newPassword).length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
  
  try {
    const uname = username.toLowerCase();
    let user;
    if (db) user = db.prepare('SELECT * FROM users WHERE username = ?').get(uname);
    else user = store.users.find(u => u.username === uname);
    
    if (!user) return res.status(404).json({ error: 'Username not found' });
    
    const hash = bcrypt.hashSync(newPassword, 10);
    
    if (db) {
      db.prepare('UPDATE users SET passwordHash = ? WHERE id = ?').run(hash, user.id);
      // Invalidate all existing sessions
      db.prepare('DELETE FROM sessions WHERE userId = ?').run(user.id);
    } else {
      const idx = store.users.findIndex(u => u.id === user.id);
      if (idx !== -1) {
        store.users[idx].passwordHash = hash;
        // Invalidate all existing sessions
        store.sessions = store.sessions.filter(s => s.userId !== user.id);
        saveStore();
      }
    }
    
    res.json({ success: true, message: 'Password reset successfully' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// List responses (optionally filter by category) — requires auth
app.get('/responses', (req, res) => {
  const auth = getUserFromAuth(req);
  if (!auth) return res.status(401).json({ error: 'Unauthorized' });
  const { category } = req.query;
  try {
    let rows;
    if (db) {
      if (category) rows = db.prepare('SELECT * FROM responses WHERE userId = ? AND category = ? ORDER BY createdAt ASC').all(auth.user.id, category);
      else rows = db.prepare('SELECT * FROM responses WHERE userId = ? ORDER BY createdAt ASC').all(auth.user.id);
    } else {
      rows = store.responses.filter(r => r.userId === auth.user.id && (!category || r.category === category));
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
    if (db) {
      db.prepare('INSERT INTO responses (id, text, category, userCreated, source, createdAt, userId) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .run(id, text, category, userCreated ? 1 : 0, source || null, createdAt, auth.user.id);
      const row = db.prepare('SELECT * FROM responses WHERE id = ?').get(id);
      res.status(201).json(rowToResponse(row));
    } else {
      const row = { id, text, category, userCreated: !!userCreated, source: source || null, createdAt, userId: auth.user.id };
      store.responses.push(row); saveStore();
      res.status(201).json(rowToResponse(row));
    }
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
    if (db) {
      const existing = db.prepare('SELECT * FROM responses WHERE id = ? AND userId = ?').get(id, auth.user.id);
      if (!existing) return res.status(404).json({ error: 'Not found' });
      db.prepare('UPDATE responses SET text = ?, category = ?, userCreated = ?, source = ? WHERE id = ?')
        .run(text ?? existing.text, category ?? existing.category, (userCreated ? 1 : 0), source ?? existing.source, id);
      const updated = db.prepare('SELECT * FROM responses WHERE id = ?').get(id);
      res.json(rowToResponse(updated));
    } else {
      const idx = store.responses.findIndex(r => r.id === id && r.userId === auth.user.id);
      if (idx === -1) return res.status(404).json({ error: 'Not found' });
      const existing = store.responses[idx];
      const updated = { ...existing, text: text ?? existing.text, category: category ?? existing.category, userCreated: userCreated ?? existing.userCreated, source: source ?? existing.source };
      store.responses[idx] = updated; saveStore();
      res.json(rowToResponse(updated));
    }
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
    if (db) {
      const info = db.prepare('DELETE FROM responses WHERE id = ? AND userId = ?').run(id, auth.user.id);
      if (info.changes === 0) return res.status(404).json({ error: 'Not found' });
    } else {
      const before = store.responses.length;
      store.responses = store.responses.filter(r => !(r.id === id && r.userId === auth.user.id));
      if (store.responses.length === before) return res.status(404).json({ error: 'Not found' });
      saveStore();
    }
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to delete response' });
  }
});

// AI endpoints
app.post('/api/extract-job-ad', async (req, res) => {
  const auth = getUserFromAuth(req);
  if (!auth) return res.status(401).json({ error: 'Unauthorized' });
  
  // Check if quota exceeded
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
    
    // Check if quota exceeded
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
  const auth = getUserFromAuth(req);
  if (!auth) return res.status(401).json({ error: 'Unauthorized' });
  
  // Check if quota exceeded
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
    
    // Check if quota exceeded
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

app.listen(PORT, () => {
  console.log(`Responses DB server listening on http://localhost:${PORT}`);
});
