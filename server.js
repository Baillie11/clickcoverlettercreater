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

db.prepare(`CREATE TABLE IF NOT EXISTS responses (
  id TEXT PRIMARY KEY,
  text TEXT NOT NULL,
  category TEXT NOT NULL,
  userCreated INTEGER NOT NULL,
  source TEXT,
  createdAt TEXT NOT NULL
)`).run();

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

// Routes
app.get('/health', (req, res) => res.json({ ok: true }));

// List responses (optionally filter by category)
app.get('/responses', (req, res) => {
  const { category } = req.query;
  try {
    let rows;
    if (category) {
      rows = db.prepare('SELECT * FROM responses WHERE category = ? ORDER BY createdAt ASC').all(category);
    } else {
      rows = db.prepare('SELECT * FROM responses ORDER BY createdAt ASC').all();
    }
    res.json(rows.map(rowToResponse));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch responses' });
  }
});

// Create response
app.post('/responses', (req, res) => {
  const { id, text, category, userCreated, source } = req.body || {};
  if (!id || !text || !category) return res.status(400).json({ error: 'Missing id, text, or category' });
  try {
    const createdAt = new Date().toISOString();
    db.prepare('INSERT INTO responses (id, text, category, userCreated, source, createdAt) VALUES (?, ?, ?, ?, ?, ?)')
      .run(id, text, category, userCreated ? 1 : 0, source || null, createdAt);
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

// Update response
app.put('/responses/:id', (req, res) => {
  const { id } = req.params;
  const { text, category, userCreated, source } = req.body || {};
  try {
    const existing = db.prepare('SELECT * FROM responses WHERE id = ?').get(id);
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

// Delete response
app.delete('/responses/:id', (req, res) => {
  const { id } = req.params;
  try {
    const info = db.prepare('DELETE FROM responses WHERE id = ?').run(id);
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
