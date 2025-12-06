# Backend API Endpoints for Dashboard Applications

This document describes the new API endpoints needed to support permanent database storage for the dashboard application tracking feature.

## Database Schema

Add a new table `applications` with the following schema:

### PostgreSQL/MySQL:
```sql
CREATE TABLE applications (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  company VARCHAR(255),
  role VARCHAR(255),
  status VARCHAR(50),
  notes TEXT,
  date TIMESTAMP,
  paragraphs JSON,
  time_spent INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_applications_user_id ON applications(user_id);
CREATE INDEX idx_applications_date ON applications(date);
CREATE INDEX idx_applications_status ON applications(status);
```

### SQLite:
```sql
CREATE TABLE applications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  company TEXT,
  role TEXT,
  status TEXT,
  notes TEXT,
  date TEXT,
  paragraphs TEXT,
  time_spent INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_applications_user_id ON applications(user_id);
CREATE INDEX idx_applications_date ON applications(date);
CREATE INDEX idx_applications_status ON applications(status);
```

## API Endpoints

All endpoints require authentication via Bearer token in the `Authorization` header.

### 1. GET /applications
Get all applications for the authenticated user.

**Request:**
```http
GET /applications
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
[
  {
    "id": "abc123",
    "company": "Churches of Christ",
    "role": "Home Care Worker",
    "status": "Applied",
    "notes": "Imported from saved letter (28/10/2025, 19:01)",
    "date": "2025-10-28T09:01:53.000Z",
    "paragraphs": ["I am writing to...", "With my experience..."],
    "timeSpent": 0
  }
]
```

**Implementation Example (Node.js/Express):**
```javascript
app.get('/applications', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const applications = await db.query(
      'SELECT * FROM applications WHERE user_id = ? ORDER BY date DESC',
      [userId]
    );
    
    // Parse JSON fields if using MySQL/PostgreSQL
    const parsed = applications.map(app => ({
      ...app,
      paragraphs: JSON.parse(app.paragraphs || '[]')
    }));
    
    res.json(parsed);
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});
```

### 2. POST /applications
Create a new application.

**Request:**
```http
POST /applications
Authorization: Bearer <token>
Content-Type: application/json

{
  "id": "abc123",
  "company": "Churches of Christ",
  "role": "Home Care Worker",
  "status": "Applied",
  "notes": "Imported from saved letter",
  "date": "2025-10-28T09:01:53.000Z",
  "paragraphs": ["I am writing to...", "With my experience..."],
  "timeSpent": 0
}
```

**Response (201 Created):**
```json
{
  "id": "abc123",
  "message": "Application created successfully"
}
```

**Implementation Example:**
```javascript
app.post('/applications', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id, company, role, status, notes, date, paragraphs, timeSpent } = req.body;
    
    // Validate required fields
    if (!id || !company || !role) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    await db.query(
      `INSERT INTO applications 
       (id, user_id, company, role, status, notes, date, paragraphs, time_spent) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        userId,
        company,
        role,
        status || 'Draft',
        notes || '',
        date,
        JSON.stringify(paragraphs || []),
        timeSpent || 0
      ]
    );
    
    res.status(201).json({ id, message: 'Application created successfully' });
  } catch (error) {
    console.error('Error creating application:', error);
    res.status(500).json({ error: 'Failed to create application' });
  }
});
```

### 3. PUT /applications/:id
Update an existing application.

**Request:**
```http
PUT /applications/abc123
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "Interview Scheduled",
  "notes": "Interview on Friday at 2pm"
}
```

**Response (200 OK):**
```json
{
  "id": "abc123",
  "message": "Application updated successfully"
}
```

**Implementation Example:**
```javascript
app.put('/applications/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const updates = req.body;
    
    // Verify ownership
    const app = await db.query(
      'SELECT * FROM applications WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    
    if (app.length === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }
    
    // Build update query dynamically
    const fields = [];
    const values = [];
    
    if (updates.company !== undefined) {
      fields.push('company = ?');
      values.push(updates.company);
    }
    if (updates.role !== undefined) {
      fields.push('role = ?');
      values.push(updates.role);
    }
    if (updates.status !== undefined) {
      fields.push('status = ?');
      values.push(updates.status);
    }
    if (updates.notes !== undefined) {
      fields.push('notes = ?');
      values.push(updates.notes);
    }
    if (updates.paragraphs !== undefined) {
      fields.push('paragraphs = ?');
      values.push(JSON.stringify(updates.paragraphs));
    }
    if (updates.timeSpent !== undefined) {
      fields.push('time_spent = ?');
      values.push(updates.timeSpent);
    }
    
    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id, userId);
    
    await db.query(
      `UPDATE applications SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`,
      values
    );
    
    res.json({ id, message: 'Application updated successfully' });
  } catch (error) {
    console.error('Error updating application:', error);
    res.status(500).json({ error: 'Failed to update application' });
  }
});
```

### 4. DELETE /applications/:id
Delete an application.

**Request:**
```http
DELETE /applications/abc123
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "id": "abc123",
  "message": "Application deleted successfully"
}
```

**Implementation Example:**
```javascript
app.delete('/applications/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    
    const result = await db.query(
      'DELETE FROM applications WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }
    
    res.json({ id, message: 'Application deleted successfully' });
  } catch (error) {
    console.error('Error deleting application:', error);
    res.status(500).json({ error: 'Failed to delete application' });
  }
});
```

## Authentication Middleware

Reuse your existing `authenticateToken` middleware:

```javascript
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
}
```

## Testing the Endpoints

### Using curl:

```bash
# Get all applications
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5050/applications

# Create application
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"id":"test123","company":"Test Co","role":"Developer","status":"Draft"}' \
  http://localhost:5050/applications

# Update application
curl -X PUT \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"Applied","notes":"Submitted today"}' \
  http://localhost:5050/applications/test123

# Delete application
curl -X DELETE \
  -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5050/applications/test123
```

## Migration Strategy

1. **Add database table** using the schema above
2. **Implement the 4 endpoints** in your backend server
3. **Test endpoints** using curl or Postman
4. **Deploy backend** with new endpoints
5. **Update frontend** `ENV_API_BASE` if needed
6. **Sign in** on the dashboard page
7. **Data will automatically sync** to database on all operations

## Fallback Behavior

The dashboard frontend is designed with graceful degradation:

- ✅ **Database available**: All data synced to database + localStorage backup
- ⚠️ **Database unavailable**: Falls back to localStorage only
- 🔄 **Coming back online**: Next sync will push localStorage data to database

This ensures users never lose their data, even if the database is temporarily unavailable.

## Future Enhancements

Consider adding these optional endpoints:

1. **GET /applications/stats** - Pre-calculated statistics
2. **POST /applications/bulk** - Bulk import/sync
3. **GET /applications/export** - Server-side CSV export
4. **PATCH /applications/:id/status** - Quick status update

## Support

For questions about implementing these endpoints, refer to your existing backend code structure for `responses` endpoints - the applications endpoints follow the same pattern.
