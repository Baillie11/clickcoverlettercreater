# VitaePro v1.5.0 Release Notes

**Release Date:** January 16, 2026  
**Git Tag:** v1.5.0  
**Repository:** https://github.com/Baillie11/clickcoverlettercreater

---

## 🎉 What's New

### Major Features

#### 1. **Drag-to-Reorder Functionality**
Users can now rearrange paragraphs in their cover letter by simply dragging and dropping them into the desired order.

**Features:**
- Visual drag handles (⋮⋮) on the left side of each paragraph
- Smooth hover effects with purple highlight
- Visual feedback while dragging (ghost element)
- Full dark mode support

**How to use:** Click and hold the drag handle on the left side of any paragraph, then drag it to a new position.

---

#### 2. **Inline Editing**
Edit your letter paragraphs directly in the letter area without opening a modal.

**Features:**
- Click inside any paragraph to edit text in-place
- Changes are automatically saved
- Yellow highlight on focus for better visibility
- Spell-check enabled

**How to use:** Simply click inside any paragraph in your letter and start typing.

---

#### 3. **Copy & Edit for Crowd/AI Responses**
Turn crowd-sourced or AI-generated responses into your own personalized responses.

**Features:**
- New "📝 Copy & Edit" button on crowd and AI responses
- Pre-fills create modal with source text and tags
- Automatically removes date tags
- Saves as new user response with fresh ID

**How to use:** Click the "📝 Copy & Edit" button on any crowd-sourced or AI-generated response, edit as needed, and save.

---

#### 4. **Show/Hide Toggle for Response Categories**
Quickly navigate between response sections by collapsing categories you're not currently using.

**Features:**
- Toggle buttons (▼/▶) next to each category header
- Collapse/expand User Created, Crowd Sourced, and AI Generated sections
- State persists during your session

**How to use:** Click the ▼ or ▶ button next to any category name to collapse or expand it.

---

#### 5. **Empty State for User Responses**
Friendly message when you haven't created any responses yet, guiding you to create your first one.

**Features:**
- Gradient background with dashed border
- Helpful hint to create your first response
- Only shows when User Created section is visible and empty

---

### UI/UX Improvements

#### **Profile Address Field Reorganization**
The address fields in your profile have been reorganized for better logical flow:
- **New order:** Street Address → State & Postcode → Suburb
- **Updated label:** "Suburb, State and Postcode"
- All letter templates updated to display in the new order

**Benefits:** More intuitive address entry and better formatted letters.

---

#### **Enhanced Modal Dialogs**
Response creation and editing modals are now wider for better readability:
- Width increased from 520px to 900px
- Padding increased for better spacing
- Fixed border cutoff issues

---

#### **Reorganized Preset Tags**
Tags are now organized for easier access:
- Common tags (Closing, Education/Qualifications, Experience, Introduction, Skills) appear first
- All tags sorted alphabetically within their groups

---

#### **Enhanced Paragraph Styling**
Letter paragraphs now have improved visual appearance:
- White background with subtle border
- Box shadow for depth
- Smooth hover transitions
- Better visual hierarchy

---

### Fixes

- **Drag Handle Visibility:** Made drag handles clearly visible with proper styling (previously invisible)
- **Cache Busting:** Updated to v=5 to ensure browsers load the latest version
- **Dark Mode:** Added comprehensive dark mode support for all new drag interactions

---

### Technical Improvements

- **New Diagnostic Tool:** Added `diagnostic.html` for troubleshooting drag and edit features
- **Documentation:** Comprehensive CHANGELOG.md and VERSION file tracking
- **Browser Compatibility:** Tested in Chrome, Edge, Firefox, and Safari

---

## 📦 Files Updated

- `index.html` - Cache version update
- `profile.html` - Address field reordering
- `dashboard.html` - Cache version update
- `script.js` - Drag-to-reorder, inline editing, template updates
- `styles.css` - Visual drag handles, paragraph styling
- `diagnostic.html` - NEW troubleshooting tool
- `CHANGELOG.md` - NEW comprehensive changelog
- `VERSION` - NEW version tracking file

---

## 🚀 Deployment Instructions

1. **Upload Updated Files:**
   - index.html
   - profile.html
   - dashboard.html
   - script.js
   - styles.css
   - diagnostic.html (optional, for troubleshooting)

2. **Clear Browser Cache:**
   - Hard refresh: `Ctrl+F5` (Windows) or `Cmd+Shift+R` (Mac)
   - Or clear browser cache via settings

3. **Verify Features:**
   - Test drag-to-reorder by dragging paragraphs
   - Test inline editing by clicking inside a paragraph
   - Test copy & edit on crowd/AI responses
   - Verify profile address field order

4. **Troubleshooting:**
   - If features don't work, visit `/diagnostic.html` on your site
   - Run tests to identify any issues

---

## 🙏 Credits

Developed with assistance from Warp AI Agent Mode.

Co-Authored-By: Warp <agent@warp.dev>

---

## 📝 Full Changelog

For detailed technical changes, see [CHANGELOG.md](./CHANGELOG.md)

---

## 🔗 Links

- **Repository:** https://github.com/Baillie11/clickcoverlettercreater
- **Tag:** v1.5.0
- **Previous Version:** v1.1.0

---

## 📧 Support

For issues or questions, please open an issue on GitHub.
