# Changelog

All notable changes to VitaePro Cover Letter Creator will be documented in this file.

## [1.6.2] - 2026-02-08

### Added
- **AI Generate Modal**: Moved AI Generate functionality to header with modal popup
  - AI Generate button now appears in header next to New Cover Letter button
  - Purple gradient styling to differentiate from other actions
  - Job ad input opens in modal popup instead of inline section
  - Improved "above the fold" content visibility
  - Modal auto-closes 2 seconds after successful generation
- **Response Count Tallies**: Category headers now show count of responses
  - Format: "User Created (50)" "Crowd Sourced (17)" "AI Generated (0)"
  - Counts update dynamically based on search filter
  - Muted styling for subtle visual hierarchy

### Changed
- **Job Information Toggle Label**: Updated from "Collapse/Expand" to "Show/Hide" for clarity
- **Category Header Layout**: Fixed with flexbox for proper button alignment
  - Toggle buttons, sort dropdowns, and action buttons now properly aligned
  - Resolved CSS conflicts between float and flexbox
  - Consistent spacing with gap property

### Fixed
- **Toggle Button Reliability**: Resolved intermittent clicking issues
  - Implemented event delegation pattern to prevent race conditions
  - Buttons no longer recreated on each render, preventing stale event listeners
  - Changed from individual IDs to data-category attributes
  - Single parent listener catches all toggle button clicks
- **Missing handleSortChange Function**: Added missing sort dropdown handler
  - Function was referenced but not defined, causing JavaScript error
  - Prevented responses from rendering on page load
  - Sort dropdown now works correctly for user responses

### Technical
- **Cache Version**: Bumped to v=13 for browser cache invalidation
- **Event Delegation**: Migrated toggle buttons from direct listeners to delegated events
- **Modal Styling**: Added new CSS classes for AI generate modal and actions header

## [1.6.1] - 2026-01-31 (Unreleased)

### Added
- **Password Reset Flow**: Two-step password recovery system
  - Step 1: Request reset token via email
  - Step 2: Confirm with token and set new password
  - 30-minute token expiration for security
  - Email notifications for reset requests and confirmations
  - One-time use tokens (automatically marked as used)
  - Automatic cleanup of expired tokens
- **New Database Table**: `password_reset_tokens` with proper indexes
  - Tracks token, userId, creation time, expiration, and usage status
  - Cascade delete when user is removed
  - Indexed on userId and expiresAt for performance
- **Email Integration**: Nodemailer support for password reset emails
  - Professional HTML email templates
  - Configurable SMTP settings via environment variables
  - Separate emails for reset request and confirmation

### Changed
- **Password Reset UI**: Updated modal to two-step process
  - Clearer instructions and workflow
  - Better user experience with explicit steps
  - Improved error messaging per step
  - "Forgot Password?" link on main auth screen

### Security
- **Token Security**: Short-lived tokens (30 minutes) with one-time use
- **Session Invalidation**: All user sessions cleared on password reset
- **Email Verification**: Reset tokens sent only to registered email addresses

### Technical
- **Backend Endpoints**:
  - POST `/auth/request-password-reset` - Initiates reset flow
  - POST `/auth/confirm-password-reset` - Completes reset with token
- **Database Methods**:
  - `createPasswordResetToken()` - Store new reset token
  - `findResetToken()` - Validate and retrieve token
  - `markResetTokenAsUsed()` - Prevent token reuse
  - `deleteExpiredResetTokens()` - Cleanup stale tokens
- **Email Functions**:
  - `sendPasswordResetEmail()` - Send token to user
  - `sendPasswordChangedEmail()` - Confirmation notification

## [1.6.0] - 2026-01-27

### Added
- **Page Break Markers in Preview**: Visual indicators showing where page breaks occur
  - Dashed red lines appear at page boundaries in the preview area
  - "📄 Page Break" label centered on each marker
  - Automatically adjusts based on selected page size (A4 or Letter)
  - Helps users see if their cover letter fits on one page
  - Dark mode support with adjusted colors
- **Custom Tag Sorting for AI Responses**: AI Generated responses now sorted in logical order
  - Order: Introduction → Experience → Education/Qualifications → Skills → Motivation/Why this role → Why this company → Closing
  - Responses with tags not in the custom order appear after, sorted alphabetically
  - User Created and Crowd Sourced responses maintain their existing sort behavior

### Changed
- **AI Responses Now Temporary**: AI Generated responses are session-only and not saved to database
  - AI responses kept in memory and browser storage only during session
  - Never persisted to the database
  - Automatically cleared when starting a new letter or after PDF download
  - Ensures fresh AI generation for each cover letter
  - User Created and Crowd Sourced responses remain permanently saved
- **Auto-Clear After PDF Download**: Streamlined workflow for multiple applications
  - All AI Generated responses are automatically cleared after PDF download
  - Preview area is cleared
  - Letter area, job form, and saved state are cleared (existing behavior)
  - Ready for next cover letter with fresh AI generation
- **Auto-Clear When Starting New Letter**: "New Cover Letter" button now clears AI responses
  - Confirmation dialog updated to inform user AI responses will be cleared
  - Preview area cleared along with letter and job form

### Technical
- **Page Height Calculations**: Added precise page height calculations for accurate break markers
  - A4: ~1056px per page (accounting for margins)
  - Letter: ~1020px per page (accounting for margins)
- **Dynamic Tag Ordering**: Implemented custom sort order array for AI response tags

## [1.5.1] - 2026-01-27

### Fixed
- **Production Deployment**: Resolved module dependencies for CloudLinux/Passenger hosting environment
  - Removed `better-sqlite3` dependency (development-only, caused build issues on production)
  - Added `mysql2` as production dependency for MySQL database support
  - Configured proper `node_modules` symlink for CloudLinux Node Selector compatibility
  - Fixed MySQL connection in production environment

### Changed
- **Database Strategy**: Clarified development vs production database usage
  - Development: Uses SQLite (better-sqlite3) - fast local database
  - Production: Uses MySQL (mysql2) - robust cloud database
  - Automatic detection via NODE_ENV environment variable

### Technical
- **Dependencies**: Updated for production compatibility
  - Removed: better-sqlite3 (development only)
  - Added: mysql2 ^3.11.5 (production database)
  - CloudLinux Node Selector configuration verified
  - Passenger/LiteSpeed module resolution optimized

## [1.5.0] - 2026-01-16

### Added
- **Drag-to-Reorder Functionality**: Paragraphs in the letter builder can now be reordered by dragging and dropping
  - Visual drag handles (⋮⋮) appear on the left side of each paragraph
  - Smooth hover effects with purple highlight
  - Visual feedback while dragging (ghost element)
  - Dark mode support for all drag interactions
- **Inline Editing**: Paragraphs can be edited directly in the letter area
  - Click inside any paragraph to edit text in-place
  - Changes are preserved automatically
  - Yellow highlight on focus for better visibility
- **Copy & Edit for Crowd/AI Responses**: Users can now copy crowd-sourced or AI-generated responses to their personal library
  - New "📝 Copy & Edit" button on crowd and AI responses
  - Pre-fills create modal with source text and tags
  - Automatically removes date tags when copying
  - Saved as new user response with fresh ID and current date
- **Show/Hide Toggle for Response Categories**: Quick navigation between response sections
  - Toggle buttons (▼/▶) next to each category header
  - Collapse/expand User Created, Crowd Sourced, and AI Generated sections
  - State persists during session
- **Empty State for User Responses**: Friendly message when no user responses exist yet
  - Gradient background with dashed border
  - Helpful hint to create first response
  - Only shows when User Created section is visible and empty
- **Diagnostic Tool**: New diagnostic.html page for troubleshooting
  - Tests SortableJS library loading
  - Tests inline editing functionality
  - Tests drag-to-reorder functionality
  - Browser console checks
  - Cache status verification

### Changed
- **Profile Address Field Order**: Reorganized address fields for better logical flow
  - Order now: Street Address → State & Postcode → Suburb
  - Updated label: "Suburb, State and Postcode"
  - All 4 letter templates updated to reflect new order (formal-classic, sidebar-profile, teal-sidebar, standard)
- **Modal Width**: Increased modal dialog width from 520px → 900px
  - Better readability for longer response text
  - Added padding increase (24px → 32px)
  - Added box-sizing fixes to prevent border cutoff
- **Preset Tags Organization**: Reorganized tag display for better usability
  - Common tags (Closing, Education/Qualifications, Experience, Introduction, Skills) appear first
  - Both groups sorted alphabetically
  - Easier to find frequently-used tags
- **Letter Paragraph Styling**: Enhanced visual appearance
  - Added white background with subtle border
  - Box shadow for depth
  - Smooth hover transitions
  - Left padding to accommodate drag handle
  - Better visual hierarchy

### Fixed
- **Drag Handle Visibility**: Made drag handles clearly visible
  - Previously invisible due to transparent background
  - Now shows clear visual indicators for draggable items
- **Cache Busting**: Updated version parameters to v=5
  - Forces browser to load latest JavaScript and CSS
  - Prevents stale cached files from causing issues
  - Applied to index.html, profile.html, and dashboard.html

### Technical
- **Dependencies**: All external libraries remain current
  - SortableJS 1.15.0 for drag-and-drop
  - html2pdf.js 0.11.2 for PDF generation
  - Mammoth 1.6.0 for DOCX parsing
  - JSZip 3.10.1 for file handling
- **Browser Compatibility**: Tested and working in modern browsers
  - Chrome/Edge (Chromium)
  - Firefox
  - Safari (WebKit)

## [1.4.0] - 2026-01-15

### Added
- **Auto-Tagging by Industry**: New responses automatically tagged with user's industry from profile
  - Industry tag added alongside date tag
  - Fully searchable via existing search functionality
  - Case-insensitive duplicate prevention
- **Profile Suburb Field**: Separated suburb from street address
  - New dedicated suburb input field
  - Updated all template rendering to display suburb on separate line
  - Better address formatting in generated letters

### Changed
- **Dashboard Statistics**: Confirmed operational status
  - Stats calculated dynamically via calculateStats() function
  - Updates on page load, add/update/delete operations, and filter/sort changes
  - Database API with localStorage fallback

## [1.3.0] - Earlier

### Features
- User authentication and authorization
- Database integration for response storage
- AI-powered job ad parsing and response generation
- Multiple letter themes (Standard, Modern, Formal Classic, Sidebar Profile, Letterhead Accent, Teal Sidebar)
- Resume upload and parsing
- Company name autocomplete
- Draft saving and loading
- PDF export functionality
- Dark mode support
- Application tracking dashboard

---

## Version Format

Versions follow Semantic Versioning (SemVer):
- **MAJOR** version for incompatible API changes
- **MINOR** version for new functionality in a backward-compatible manner
- **PATCH** version for backward-compatible bug fixes

## Release Process

1. Update version number in CHANGELOG.md
2. Document all changes under appropriate categories
3. Commit changes with descriptive message
4. Tag release with version number
5. Push to repository

## Categories

- **Added**: New features
- **Changed**: Changes to existing functionality
- **Deprecated**: Soon-to-be removed features
- **Removed**: Removed features
- **Fixed**: Bug fixes
- **Security**: Vulnerability fixes
- **Technical**: Under-the-hood improvements
