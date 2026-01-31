# VitaePro System Architecture

**Last Updated:** January 31, 2026  
**Version:** 1.6.0  
**Status:** Production (vitaepro.com.au)

---

## Executive Summary

VitaePro is a full-stack web application for creating professional cover letters with AI-powered job ad parsing, response library management, and application tracking. The system supports both authenticated and guest users with intelligent database synchronization.

---

## System Overview

### Technology Stack

**Frontend:**
- HTML5, CSS3, JavaScript (ES6+)
- External Libraries:
  - SortableJS 1.15.0 (drag-and-drop)
  - html2pdf.js 0.11.2 (PDF generation)
  - Mammoth 1.6.0 (DOCX parsing)
  - JSZip 3.10.1 (file handling)
- Storage: Browser localStorage with database sync

**Backend:**
- Node.js with Express 4.19.2
- Environment: CloudLinux with Passenger (production)
- CORS-enabled API endpoints

**Database:**
- **Development:** SQLite via better-sqlite3 (local file)
- **Production:** MySQL 5.7+ via mysql2 (VentraIP hosting)
- Auto-detection via NODE_ENV

**AI Integration:**
- OpenAI GPT-4 API for job ad parsing and response generation
- Features: job info extraction, tailored paragraph generation

**Email:**
- Nodemailer 7.0.12 for password reset and notifications
- SMTP configuration via environment variables

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                       FRONTEND LAYER                          │
├─────────────────────────────────────────────────────────────┤
│  app.html          │  profile.html    │  dashboard.html     │
│  (Letter Builder)  │  (User Profile)  │  (App Tracking)     │
└──────────┬─────────┴─────────┬────────┴────────┬────────────┘
           │                   │                  │
           │    script.js (shared logic, 18KB+)  │
           │    - Auth management                 │
           │    - Response library                │
           │    - Letter building                 │
           │    - Database sync                   │
           └─────────┬─────────┴──────────────────┘
                     │
                     │ AJAX/Fetch API
                     │ (JSON payloads)
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                       BACKEND LAYER                          │
├─────────────────────────────────────────────────────────────┤
│                     server.js (Express)                      │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Endpoints:                                           │  │
│  │  - POST /auth/signup                                  │  │
│  │  - POST /auth/signin                                  │  │
│  │  - POST /auth/signout                                 │  │
│  │  - POST /auth/request-password-reset (NEW)           │  │
│  │  - POST /auth/confirm-password-reset (NEW)           │  │
│  │  - GET  /auth/check                                   │  │
│  │  - GET  /responses                                    │  │
│  │  - POST /responses                                    │  │
│  │  - PUT  /responses/:id                                │  │
│  │  - DELETE /responses/:id                              │  │
│  │  - GET  /applications                                 │  │
│  │  - POST /applications                                 │  │
│  │  - PUT  /applications/:id                             │  │
│  │  - DELETE /applications/:id                           │  │
│  │  - POST /parse-job-ad (OpenAI)                        │  │
│  │  - POST /generate-responses (OpenAI)                  │  │
│  └───────────────────────────────────────────────────────┘  │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           │ Database Adapter Layer
                           │ (auto-selects SQLite/MySQL/JSON)
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                       DATABASE LAYER                         │
├─────────────────────────────────────────────────────────────┤
│  Development: SQLite (data/data.db)                          │
│  Production:  MySQL (VentraIP Cloud)                         │
│  Fallback:    JSON files (data/*.json)                       │
│                                                              │
│  Tables:                                                     │
│  - users                                                     │
│  - sessions                                                  │
│  - responses                                                 │
│  - applications                                              │
│  - password_reset_tokens (NEW)                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Database Schema

### users
```sql
id              VARCHAR(50) PRIMARY KEY
username        VARCHAR(100) UNIQUE NOT NULL (email format enforced)
passwordHash    VARCHAR(255) NOT NULL (bcrypt)
shareResponses  TINYINT DEFAULT 1
createdAt       DATETIME NOT NULL
```
**Indexes:** username

### sessions
```sql
token       VARCHAR(100) PRIMARY KEY
userId      VARCHAR(50) NOT NULL
createdAt   DATETIME NOT NULL
expiresAt   DATETIME NOT NULL
FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
```
**Indexes:** userId, expiresAt

### responses
```sql
id           VARCHAR(50) PRIMARY KEY
text         TEXT NOT NULL
category     VARCHAR(50) NOT NULL ('user'|'crowd'|'ai')
userCreated  TINYINT NOT NULL
source       VARCHAR(50) (user|crowd|ai)
tags         TEXT (comma-separated)
userId       VARCHAR(50) (NULL for crowd/ai)
createdAt    DATETIME NOT NULL
FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
```
**Indexes:** userId, category

**Response Categories:**
- **user:** User's personal responses (private)
- **crowd:** Community-shared responses (shareResponses=1)
- **ai:** AI-generated responses (session-only, not persisted since v1.6.0)

### applications
```sql
id          VARCHAR(50) PRIMARY KEY
userId      VARCHAR(50) NOT NULL
company     VARCHAR(255)
role        VARCHAR(255)
status      VARCHAR(50) ('Draft'|'Applied'|'Interview'|'Offer'|'Rejected'|'Withdrawn')
notes       TEXT
date        DATETIME
paragraphs  TEXT (JSON array of paragraph texts)
timeSpent   INTEGER DEFAULT 0
createdAt   DATETIME NOT NULL
updatedAt   DATETIME NOT NULL
FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
```
**Indexes:** userId, date, status

### password_reset_tokens (NEW)
```sql
token       VARCHAR(255) PRIMARY KEY
userId      VARCHAR(50) NOT NULL
createdAt   DATETIME NOT NULL
expiresAt   DATETIME NOT NULL (30 minutes from creation)
used        TINYINT DEFAULT 0
FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
```
**Indexes:** userId, expiresAt

---

## Core Features

### 1. Authentication System
- **Email-only usernames** (enforced since rebranding)
- bcrypt password hashing (10 rounds)
- Session-based authentication with tokens
- **NEW: Password reset flow (2-step)**
  - Step 1: Request reset token via email
  - Step 2: Confirm with token + new password
  - 30-minute token expiration
  - Email notifications for reset requests and confirmations

### 2. Response Library Management
- **User Created:** Private, editable responses
- **Crowd Sourced:** Community-shared (when shareResponses=1)
- **AI Generated:** Session-only, cleared after PDF download or new letter
- Tags: searchable, auto-tagged by industry
- Date tags: automatic on creation
- Search: keyword and tag filtering
- Copy & Edit: Clone crowd/AI responses to personal library

### 3. Letter Building Workflow
1. **Profile Setup** (profile.html)
   - Personal info, address, keywords
   - Industry selection (auto-tags responses)
   - Resume upload (PDF/DOC/DOCX/TXT parsing)
   - Sharing preferences

2. **Job Information** (app.html)
   - Manual entry or AI-powered parsing from job ad text/URL
   - Company name autocomplete
   - Contact person, address, reference number

3. **Letter Construction**
   - Drag & drop responses from library
   - Inline editing of paragraphs
   - Drag-to-reorder paragraphs (v1.5.0+)
   - Theme selection (6 templates)
   - Page size: A4 or Letter
   - Page break markers in preview (v1.6.0)

4. **PDF Export**
   - Professional formatting
   - Intelligent file naming
   - Auto-clear AI responses after download (v1.6.0)

### 4. Dashboard & Application Tracking
- Import previously saved letters (one-time migration)
- Track application status lifecycle
- Statistics: total apps, by status, success rate
- Most-used paragraphs analysis
- CSV export for external analysis
- Filter and search applications
- Edit notes and status updates

### 5. AI Features
- **Job Ad Parsing:** Extract company, role, requirements
- **Response Generation:** Context-aware paragraph creation
- **Custom Tag Sorting:** Logical order (Introduction → Experience → Skills → Closing)
- **Temporary Storage:** AI responses not saved to database (v1.6.0)

---

## Data Flow

### Authenticated User Flow
```
1. User signs in → Session token stored
2. Frontend calls GET /responses → Returns user + crowd responses
3. User creates response → POST /responses → Saved to DB
4. Response auto-synced to localStorage (backup)
5. If shareResponses=1 → Response appears in crowd library
6. User generates AI responses → Stored in memory only
7. User downloads PDF → AI responses cleared automatically
```

### Guest User Flow (localStorage Only)
```
1. No authentication → All operations use localStorage
2. Responses, profile, letters stored locally
3. No database sync or sharing
4. Full functionality available
```

### Database Sync Strategy
- **Primary:** Database (when authenticated)
- **Fallback:** localStorage (offline or guest)
- **Conflict Resolution:** Database wins on load, localStorage immediate on write
- **Migration:** First dashboard visit imports saved letters

---

## Deployment

### Production Environment
- **Host:** VentraIP (CloudLinux + Passenger)
- **Domain:** vitaepro.com.au
- **Node Version:** 18+ (via Node Selector)
- **Process Manager:** Passenger (LiteSpeed integration)
- **Database:** MySQL 5.7+ (remote)
- **SSL:** Enabled via hosting provider

### Environment Variables (.env.production)
```
NODE_ENV=production
PORT=3050

# MySQL Database
MYSQL_HOST=<db_host>
MYSQL_PORT=3306
MYSQL_USER=<db_user>
MYSQL_PASSWORD=<db_password>
MYSQL_DATABASE=<db_name>

# OpenAI
OPENAI_API_KEY=<api_key>

# Email (SMTP)
EMAIL_HOST=<smtp_host>
EMAIL_PORT=587
EMAIL_USER=<smtp_user>
EMAIL_PASSWORD=<smtp_password>
EMAIL_FROM=<from_address>

# Application
APP_URL=https://vitaepro.com.au
```

### Deployment Steps
1. Update code on server: `git pull origin main`
2. Install dependencies: `npm install --production`
3. Restart Passenger: `touch tmp/restart.txt`
4. Verify: Check `/auth/check` endpoint
5. Monitor logs: `tail -f log/production.log` (if configured)

---

## File Structure

```
VitaePro/
├── server.js                      # Express backend
├── package.json                   # Dependencies
├── .env.production                # Production config (gitignored)
├── .htaccess                      # Apache/Passenger rules
│
├── app.html                       # Letter builder interface
├── profile.html                   # User profile setup
├── dashboard.html                 # Application tracking
│
├── styles.css                     # Unified styles
├── script.js                      # Shared frontend logic
├── env.js                         # Environment config loader
│
├── favicon.svg                    # App icon
│
├── data/                          # SQLite DB (dev only)
│   └── data.db
│
├── website/                       # Landing page (untracked)
│   └── README.md
│
└── docs/                          # Documentation
    ├── README.md                  # Main documentation
    ├── CHANGELOG.md               # Version history
    ├── ARCHITECTURE.md            # This file
    ├── DATABASE_INTEGRATION_SUMMARY.md
    ├── MIGRATION_GUIDE.md         # Dashboard migration
    ├── SETUP_DATABASE.md          # DB setup instructions
    ├── EMAIL_SETUP.md             # Email configuration
    ├── PASSWORD_RESET_SETUP.md    # Password reset setup
    ├── BACKEND_APPLICATIONS_API.md
    ├── DASHBOARD_README.md
    ├── LOGGING_SETUP.md
    ├── ORANGE_HOSTING_DEPLOY.md
    └── RELEASE_NOTES_v1.5.0.md
```

---

## Security Considerations

### Authentication
- ✅ bcrypt password hashing (cost factor 10)
- ✅ Session tokens (auto-expiring)
- ✅ Password reset tokens (30-minute expiry, one-time use)
- ✅ HTTPS enforced in production
- ✅ Email-only username validation

### Data Protection
- ✅ User isolation (userId foreign keys)
- ✅ SQL injection prevention (parameterized queries)
- ✅ XSS prevention (input sanitization)
- ✅ CORS configured for API endpoints

### Privacy
- ✅ Sharing opt-in (shareResponses flag)
- ✅ Anonymous crowd-sourced responses
- ✅ No tracking or analytics
- ✅ Local-first data storage

---

## Known Limitations

1. **AI Response Persistence:** AI-generated responses are session-only (by design since v1.6.0)
2. **Single Session Limit:** Signing out invalidates all user sessions
3. **No Real-time Sync:** Multi-device changes require manual refresh
4. **PDF Generation:** Client-side rendering (browser-dependent)
5. **File Upload Size:** Resume parsing limited by browser memory

---

## Future Considerations

### Planned Features
- [ ] Multi-device real-time sync
- [ ] Advanced analytics (cover letter effectiveness tracking)
- [ ] Template marketplace (community themes)
- [ ] Integration with job boards (Indeed, LinkedIn)
- [ ] Mobile app (React Native)
- [ ] Collaboration features (team workspaces)

### Technical Debt
- [ ] Migrate to TypeScript for type safety
- [ ] Add comprehensive unit tests
- [ ] Implement WebSocket for real-time updates
- [ ] Add Redis caching layer
- [ ] Containerize with Docker
- [ ] Set up CI/CD pipeline

---

## Version History

- **v1.6.0** (2026-01-27): Page break markers, AI response improvements
- **v1.5.1** (2026-01-27): Production MySQL deployment fixes
- **v1.5.0** (2026-01-16): Drag-to-reorder, inline editing, copy & edit
- **v1.4.0** (2026-01-15): Auto-tagging, suburb field
- **v1.3.0** (Earlier): Initial authenticated features, AI integration

See [CHANGELOG.md](CHANGELOG.md) for complete version history.

---

## Support & Contact

- **Repository:** https://github.com/Baillie11/clickcoverlettercreater
- **Production:** https://vitaepro.com.au
- **Issues:** GitHub Issues

---

**Document Maintained By:** Development Team  
**Review Frequency:** Before major releases
