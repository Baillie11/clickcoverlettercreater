# Walkthrough Quick Start Guide

## For Users

### First-Time Experience
When you log in to VitaePro for the first time, an interactive tutorial will automatically start. This guided tour shows you:
- **App Page**: How to use the response library, build letters, and generate AI content
- **Profile Page**: How to set up your profile and upload your resume
- **Dashboard Page**: How to track your job applications

Simply follow the highlighted elements and click **Next** to proceed through each step.

### Replaying the Tutorial
Click the purple **?** button in the top-right navigation bar anytime to replay the tutorial for your current page.

### Skipping the Tutorial
Click **Skip Tour** at any time if you prefer to explore on your own. The tutorial won't appear again unless you manually start it.

## For Developers

### Files Added
- `walkthrough.js` - Main walkthrough system (548 lines)
- `WALKTHROUGH_README.md` - Comprehensive technical documentation
- `WALKTHROUGH_QUICKSTART.md` - This file

### HTML Changes
Added to all three pages (app.html, profile.html, dashboard.html):
```html
<script src="walkthrough.js?v=1"></script>
```

### How It Works
1. **Auto-start**: On page load, checks localStorage to see if user has completed that page's walkthrough
2. **If not completed**: Waits 1 second, then starts walkthrough automatically
3. **Help button**: Adds a purple ? button to navigation that can restart walkthrough
4. **Completion tracking**: Marks page as completed when user reaches the final step

### Testing
To test as a new user:
```javascript
// In browser console
VitaeProWalkthrough.reset();
location.reload();
```

### Customization
Edit `walkthrough.js` and modify the `walkthroughs` object to:
- Add new steps
- Update existing content
- Change target selectors
- Adjust positioning

Example:
```javascript
{
  title: 'New Feature',
  content: 'Description with <strong>HTML</strong> support',
  target: '#elementId',
  position: 'bottom' // or 'top', 'left', 'right', 'center'
}
```

## Step-by-Step Breakdown

### App Page (12 Steps)
1. Welcome & intro
2. Response Library panel
3. Search box
4. Toggle buttons
5. Add response (+) button
6. Job Information section
7. AI Generate button
8. Letter drop area (drag & drop)
9. Reorder & edit features
10. Preview & download buttons
11. Theme selection
12. Completion

### Profile Page (8 Steps)
1. Profile intro
2. Personal information
3. Address fields
4. Industry & keywords
5. Resume upload
6. Sharing preferences
7. Save profile
8. Completion

### Dashboard Page (8 Steps)
1. Dashboard intro
2. Statistics grid
3. Add application button
4. Filter controls
5. Sort dropdown
6. Application cards
7. Status badges
8. Completion

## Deployment

### To Live Server
1. Upload `walkthrough.js` to root directory
2. Upload updated `app.html`, `profile.html`, `dashboard.html`
3. No CSS changes needed (all styles inline)
4. No database changes needed (uses localStorage)

### Testing Checklist
- [ ] Clear localStorage and test auto-start
- [ ] Click through all steps (Next/Previous)
- [ ] Test Skip button
- [ ] Test Finish button on last step
- [ ] Click ? button to replay
- [ ] Test on different pages
- [ ] Verify completion tracking works
- [ ] Test window resize (tooltip repositions)

## Support

For issues or questions:
1. Check browser console for errors
2. Verify walkthrough.js loaded (Network tab)
3. Check localStorage: `localStorage.getItem('walkthroughCompleted')`
4. See full documentation in WALKTHROUGH_README.md
