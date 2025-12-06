# Changelog

All notable changes to Click Cover Letter Creator will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2025-12-06

### Added
- **Draft Letter System**: Complete draft management functionality
  - Save cover letters as drafts to database with "Save Draft" button
  - Load previously saved drafts via "Load Draft" modal
  - Delete unwanted drafts directly from the load modal
  - Drafts include all job information and paragraph selections
  - Drafts are user-specific and require authentication

- **Dashboard Enhancements**
  - New "Saved Drafts" stat card showing draft count
  - Draft count integrated into dashboard statistics
  - Drafts appear in applications table with "Draft" status
  - Can manage drafts directly from dashboard

- **User Created Response Sorting**
  - Added sort dropdown for user-created responses
  - Sort options: By Tag (default), Newest First, Oldest First
  - Date-based sorting uses response creation timestamps
  - Sort preference maintained during session

- **Automatic Date Tags**
  - Creation date automatically added as tag to new responses
  - Date tags displayed in special amber/orange styling
  - Date format: "Mon DD, YYYY" (e.g., "Dec 6, 2024")
  - Helps organize and track when responses were created

### Changed
- Updated API endpoint port from 3050 to 5050 for consistency
- Renamed "Save Letter (locally)" button to "Save Draft"
- Draft saving now uses backend database instead of localStorage
- Improved response data structure to include `createdAt` timestamps

### Fixed
- Corrected syntax error in `matchesSearch` function
- Fixed API connection issues between frontend and backend
- Resolved "Failed to fetch" errors when saving/loading drafts

### Technical Details
- All draft operations require user authentication
- Drafts stored in `applications` table with status "Draft"
- Job information (contact, address, reference) stored in notes field as JSON
- Response tags now properly include creation date
- Date tags appear last in tag list with distinct styling

## [1.0.0] - 2024-XX-XX

### Initial Release
- Core cover letter builder functionality
- User profile management
- Response library with categories (User Created, Crowd Sourced, AI Generated)
- Multiple professional themes for letter generation
- PDF export with customizable themes
- Job ad parsing capabilities
- AI-powered features (job info extraction, paragraph generation)
- User authentication system
- Dashboard with application tracking
- SQLite database for data persistence

---

[1.1.0]: https://github.com/yourusername/click-cover-letter-creator/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/yourusername/click-cover-letter-creator/releases/tag/v1.0.0
