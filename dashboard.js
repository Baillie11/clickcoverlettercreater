// Dashboard Logic for Click Cover Letter Creator
(function() {
  'use strict';

  // Check if we're on the dashboard page
  if (!document.body.classList.contains('dashboard-page')) {
    return;
  }

  // Application tracking data structure stored in localStorage
  // Each application entry: { id, company, role, status, notes, date, paragraphs, timeSpent }
  const STORAGE_KEY = 'coverLetterApplications';

  // API Configuration (from main app)
  const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3050'
    : (window.ENV_API_BASE !== undefined ? window.ENV_API_BASE : '');
  const API_TIMEOUT_MS = 3000;
  let authToken = null;
  let apiHealthy = null;

  // Load auth token from main app
  try {
    authToken = localStorage.getItem('authToken') || null;
  } catch (e) {
    console.warn('Could not load auth token');
  }

  // API Helper Functions
  function apiHeaders(extra = {}) {
    const base = { 'Content-Type': 'application/json' };
    if (authToken) base['Authorization'] = `Bearer ${authToken}`;
    return { ...base, ...(extra || {}) };
  }

  function fetchWithTimeout(url, opts = {}, timeoutMs = API_TIMEOUT_MS) {
    return new Promise((resolve, reject) => {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeoutMs);
      fetch(url, { ...opts, signal: controller.signal }).then(r => {
        clearTimeout(id);
        resolve(r);
      }).catch(err => {
        clearTimeout(id);
        reject(err);
      });
    });
  }

  async function apiHealthCheck() {
    if (apiHealthy === false) return false;
    try {
      const r = await fetchWithTimeout(`${API_BASE}/health`);
      apiHealthy = r.ok;
      return apiHealthy;
    } catch {
      apiHealthy = false;
      return false;
    }
  }

  // Dashboard-specific API calls
  async function apiGetApplications() {
    const healthy = await apiHealthCheck();
    if (!healthy) throw new Error('API offline');
    const r = await fetchWithTimeout(`${API_BASE}/applications`, { headers: apiHeaders() });
    if (!r.ok) throw new Error(`GET applications failed ${r.status}`);
    const list = await r.json();
    return Array.isArray(list) ? list : [];
  }

  async function apiSaveApplication(app) {
    const healthy = await apiHealthCheck();
    if (!healthy) throw new Error('API offline');
    const r = await fetchWithTimeout(`${API_BASE}/applications`, {
      method: 'POST',
      headers: apiHeaders(),
      body: JSON.stringify(app)
    });
    if (!r.ok) throw new Error(`POST application failed ${r.status}`);
    return await r.json();
  }

  async function apiUpdateApplication(app) {
    const healthy = await apiHealthCheck();
    if (!healthy) throw new Error('API offline');
    const r = await fetchWithTimeout(`${API_BASE}/applications/${encodeURIComponent(app.id)}`, {
      method: 'PUT',
      headers: apiHeaders(),
      body: JSON.stringify(app)
    });
    if (!r.ok) throw new Error(`PUT application failed ${r.status}`);
    return await r.json();
  }

  async function apiDeleteApplication(id) {
    const healthy = await apiHealthCheck();
    if (!healthy) throw new Error('API offline');
    const r = await fetchWithTimeout(`${API_BASE}/applications/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: apiHeaders()
    });
    if (!r.ok) throw new Error(`DELETE application failed ${r.status}`);
    return true;
  }

  // Status options
  const STATUS_OPTIONS = [
    'Draft',
    'Applied',
    'Interview Scheduled',
    'Interview Complete',
    'Assessment Pending',
    'Offer Made',
    'Offer Accepted',
    'Rejected'
  ];

  let applications = [];
  let currentEditingAppId = null;

  // Utility Functions
  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  function formatDate(dateStr) {
    // Create date object from ISO string (which is in UTC)
    const date = new Date(dateStr);
    // Format using local timezone
    return date.toLocaleDateString('en-AU', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    });
  }

  function getStartOfWeek(date = new Date()) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    return new Date(d.setDate(diff)).setHours(0, 0, 0, 0);
  }

  function getStartOfMonth(date = new Date()) {
    const d = new Date(date);
    return new Date(d.getFullYear(), d.getMonth(), 1).setHours(0, 0, 0, 0);
  }

  // Data Management with DB sync
  async function loadApplications() {
    try {
      // Try loading from database first
      if (authToken) {
        try {
          const dbApps = await apiGetApplications();
          // Parse paragraphs if they're stored as JSON strings
          applications = dbApps.map(app => {
            if (app.paragraphs && typeof app.paragraphs === 'string') {
              try {
                app.paragraphs = JSON.parse(app.paragraphs);
              } catch (e) {
                console.warn('Could not parse paragraphs for app:', app.id);
                app.paragraphs = [];
              }
            }
            if (!Array.isArray(app.paragraphs)) {
              app.paragraphs = [];
            }
            return app;
          });
          // Sync to localStorage as backup
          localStorage.setItem(STORAGE_KEY, JSON.stringify(applications));
          console.log('✅ Loaded applications from database:', applications.length);
          return;
        } catch (e) {
          console.warn('⚠️ Could not load from database, using localStorage:', e.message);
        }
      }
      
      // Fallback to localStorage
      const data = localStorage.getItem(STORAGE_KEY);
      applications = data ? JSON.parse(data) : [];
      // Ensure paragraphs is always an array
      applications = applications.map(app => {
        if (!Array.isArray(app.paragraphs)) {
          app.paragraphs = [];
        }
        app.notes = '';
        return app;
      });
      console.log('Loaded applications from localStorage:', applications.length);
    } catch (e) {
      console.error('Error loading applications:', e);
      applications = [];
    }
  }

  // Migration: Import previously saved letters into dashboard
  function migrateSavedLetters() {
    try {
      // Check if we've already migrated
      const migrated = localStorage.getItem('dashboardMigrated');
      if (migrated === 'true') {
        console.log('Previous letters already migrated');
        return 0;
      }

      const savedLetters = localStorage.getItem('savedLetters');
      if (!savedLetters) {
        console.log('No saved letters to migrate');
        localStorage.setItem('dashboardMigrated', 'true');
        return 0;
      }

      const letters = JSON.parse(savedLetters);
      let migratedCount = 0;

      letters.forEach(letter => {
        // Extract paragraph texts
        const paragraphTexts = [];
        if (letter.paragraphs && Array.isArray(letter.paragraphs)) {
          // Get the actual paragraph texts from responses
          const responsesData = localStorage.getItem('responses');
          if (responsesData) {
            try {
              const responses = JSON.parse(responsesData);
              letter.paragraphs.forEach(paraId => {
                const response = responses.find(r => r.id === paraId);
                if (response && response.text) {
                  paragraphTexts.push(response.text);
                }
              });
            } catch (e) {
              console.warn('Could not parse responses for paragraph text');
            }
          }
        }

        // Create application entry from saved letter
        // Format the saved date nicely
        const savedDate = letter.savedAt ? new Date(letter.savedAt).toLocaleDateString('en-AU', { 
          day: '2-digit', 
          month: '2-digit', 
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }) : 'Unknown date';
        
        const app = {
          id: generateId(),
          company: letter.jobInfo?.companyName || 'Unknown Company',
          role: letter.jobInfo?.roleTitle || 'Unknown Role',
          status: 'Applied', // Default status for migrated letters (assumed already applied)
          notes: `Imported from saved letter (${savedDate})`,
          date: letter.savedAt ? new Date(letter.savedAt).toISOString() : new Date().toISOString(),
          paragraphs: paragraphTexts,
          timeSpent: 0
        };

        applications.push(app);
        migratedCount++;
      });

      if (migratedCount > 0) {
        saveApplications();
        console.log(`✅ Successfully migrated ${migratedCount} saved letters to dashboard`);
      }

      // Mark migration as complete
      localStorage.setItem('dashboardMigrated', 'true');
      return migratedCount;
    } catch (e) {
      console.error('Error migrating saved letters:', e);
      return 0;
    }
  }

  async function saveApplications() {
    try {
      // Always save to localStorage as backup
      localStorage.setItem(STORAGE_KEY, JSON.stringify(applications));
      
      // Try syncing to database if authenticated
      if (authToken) {
        try {
          // Note: You'll need to implement a bulk sync endpoint
          // For now, we'll save individual apps on add/update
          console.log('✅ Applications synced to localStorage');
        } catch (e) {
          console.warn('⚠️ Could not sync to database:', e.message);
        }
      }
    } catch (e) {
      console.error('Error saving applications:', e);
    }
  }

  async function addOrUpdateApplication(app) {
    const index = applications.findIndex(a => a.id === app.id);
    const isUpdate = index >= 0;
    
    if (isUpdate) {
      applications[index] = app;
    } else {
      // Ensure new applications have blank notes
      app.notes = '';
      applications.push(app);
    }
    
    // Save to localStorage immediately
    localStorage.setItem(STORAGE_KEY, JSON.stringify(applications));
    
    // Try syncing to database
    if (authToken) {
      try {
        if (isUpdate) {
          await apiUpdateApplication(app);
          console.log('✅ Application updated in database');
        } else {
          await apiSaveApplication(app);
          console.log('✅ Application saved to database');
        }
      } catch (e) {
        console.warn('⚠️ Could not sync to database:', e.message);
        showNotification('Saved locally only (database unavailable)', 'warning');
      }
    }
    
    refreshDashboard();
  }

  async function deleteApplication(id) {
    applications = applications.filter(a => a.id !== id);
    
    // Delete from localStorage immediately
    localStorage.setItem(STORAGE_KEY, JSON.stringify(applications));
    
    // Try deleting from database
    if (authToken) {
      try {
        await apiDeleteApplication(id);
        console.log('✅ Application deleted from database');
      } catch (e) {
        console.warn('⚠️ Could not delete from database:', e.message);
      }
    }
    
    refreshDashboard();
  }

  // Statistics Calculations
  function calculateStats() {
    const now = Date.now();
    const startOfWeek = getStartOfWeek();
    const startOfMonth = getStartOfMonth();

    const stats = {
      total: applications.length,
      thisWeek: 0,
      thisMonth: 0,
      interviews: 0,
      drafts: 0,
      statusBreakdown: {},
      topParagraphs: {}
    };

    STATUS_OPTIONS.forEach(status => {
      const normalized = status.replace(/\s+/g, '');
      stats.statusBreakdown[normalized] = 0;
    });

    applications.forEach(app => {
      const appDate = new Date(app.date).getTime();

      // Count by time period
      if (appDate >= startOfWeek) stats.thisWeek++;
      if (appDate >= startOfMonth) stats.thisMonth++;

      // Count interviews
      if (app.status && (
        app.status.includes('Interview') ||
        app.status === 'Offer Made' ||
        app.status === 'Offer Accepted'
      )) {
        stats.interviews++;
      }
      
      // Count drafts
      if (app.status === 'Draft') {
        stats.drafts++;
      }

      // Status breakdown
      if (app.status) {
        const normalized = app.status.replace(/\s+/g, '');
        if (stats.statusBreakdown.hasOwnProperty(normalized)) {
          stats.statusBreakdown[normalized]++;
        }
      }

      // Track paragraph usage
      if (app.paragraphs && Array.isArray(app.paragraphs)) {
        app.paragraphs.forEach(para => {
          if (typeof para === 'string') {
            const key = para.substring(0, 100); // Use first 100 chars as key
            stats.topParagraphs[key] = (stats.topParagraphs[key] || 0) + 1;
          } else if (para && typeof para.text === 'string') {
            // If para is an object with a text property
            const key = para.text.substring(0, 100);
            stats.topParagraphs[key] = (stats.topParagraphs[key] || 0) + 1;
          }
        });
      }
    });

    return stats;
  }

  // UI Rendering
  function renderStats() {
    // Always use local stats for status breakdown
    const localStats = calculateStats();

    // Update stat cards
    document.getElementById('totalApplications').textContent = localStats.total;
    document.getElementById('applicationsThisWeek').textContent = localStats.thisWeek;
    document.getElementById('applicationsThisMonth').textContent = localStats.thisMonth;
    document.getElementById('interviewCount').textContent = localStats.interviews;
    const draftCountEl = document.getElementById('draftCount');
    if (draftCountEl) draftCountEl.textContent = localStats.drafts;

    // Update status breakdown panel
    const breakdown = localStats.statusBreakdown;
    if (breakdown) {
      if (document.getElementById('statusDraft')) document.getElementById('statusDraft').textContent = breakdown.Draft || 0;
      if (document.getElementById('statusApplied')) document.getElementById('statusApplied').textContent = breakdown.Applied || 0;
      if (document.getElementById('statusInterviewScheduled')) document.getElementById('statusInterviewScheduled').textContent = breakdown.InterviewScheduled || 0;
      if (document.getElementById('statusInterviewComplete')) document.getElementById('statusInterviewComplete').textContent = breakdown.InterviewComplete || 0;
      if (document.getElementById('statusAssessmentPending')) document.getElementById('statusAssessmentPending').textContent = breakdown.AssessmentPending || 0;
      if (document.getElementById('statusOfferMade')) document.getElementById('statusOfferMade').textContent = breakdown.OfferMade || 0;
      if (document.getElementById('statusOfferAccepted')) document.getElementById('statusOfferAccepted').textContent = breakdown.OfferAccepted || 0;
      if (document.getElementById('statusRejected')) document.getElementById('statusRejected').textContent = breakdown.Rejected || 0;
    }

    // Render top paragraphs (local only)
    renderTopParagraphs(localStats.topParagraphs);
    }

  function renderTopParagraphs(paragraphsData) {
    const container = document.getElementById('topParagraphs');
    
    const sorted = Object.entries(paragraphsData)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    if (sorted.length === 0) {
      container.innerHTML = '<p class="no-data">No paragraph usage data yet. Start creating cover letters to see statistics.</p>';
      return;
    }

    container.innerHTML = sorted.map(([text, count]) => `
      <div class="paragraph-item">
        <div class="paragraph-text" title="${text}">${text}...</div>
        <div class="paragraph-count">${count}</div>
      </div>
    `).join('');
  }

  function getStatusClass(status) {
    if (!status) return '';
    return 'app-status ' + status.toLowerCase().replace(/\s+/g, '-');
  }

  function renderApplicationsTable(filteredApps = applications) {
    const tbody = document.getElementById('applicationsTableBody');

    if (filteredApps.length === 0) {
      tbody.innerHTML = '<tr class="no-data-row"><td colspan="6">No applications found.</td></tr>';
      return;
    }


    tbody.innerHTML = filteredApps.map(app => `
      <tr data-id="${app.id}">
        <td>${formatDate(app.date)}</td>
        <td>${app.company || 'N/A'}</td>
        <td>${app.role || 'N/A'}</td>
        <td>
          <select class="status-dropdown" data-app-id="${app.id}">
            ${STATUS_OPTIONS.map(opt => `<option value="${opt}"${app.status === opt ? ' selected' : ''}>${opt}</option>`).join('')}
          </select>
        </td>
        <td>${(app.notes || '').substring(0, 50)}${app.notes && app.notes.length > 50 ? '...' : ''}</td>
        <td>
          <div class="app-actions">
            <button type="button" class="app-action-btn edit-app" data-id="${app.id}">✏️ Edit</button>
            <button type="button" class="app-action-btn delete delete-app" data-id="${app.id}">🗑️ Delete</button>
          </div>
        </td>
      </tr>
    `).join('');

    // Attach event listeners
    tbody.querySelectorAll('.edit-app').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.dataset.id;
        openEditModal(id);
      });
    });

    tbody.querySelectorAll('.delete-app').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.dataset.id;
        if (confirm('Are you sure you want to delete this application?')) {
          deleteApplication(id);
        }
      });
    });

    // Attach event listeners for status dropdowns
    tbody.querySelectorAll('.status-dropdown').forEach(dropdown => {
      dropdown.addEventListener('change', async function() {
        const appId = this.getAttribute('data-app-id');
        const newStatus = this.value;
        const app = applications.find(a => a.id === appId);
        if (app) {
          app.status = newStatus;
          await addOrUpdateApplication(app);
          // Ensure dashboard stats and breakdown are refreshed
          refreshDashboard();
        }
      });
    });
  }

  // Filtering & Sorting
  function filterAndSortApplications() {
    const searchTerm = document.getElementById('searchApplications').value.toLowerCase();
    const statusFilter = document.getElementById('filterStatus').value;
    const sortBy = document.getElementById('sortApplications').value;

    let filtered = [...applications];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(app =>
        (app.company || '').toLowerCase().includes(searchTerm) ||
        (app.role || '').toLowerCase().includes(searchTerm)
      );
    }

    // Apply status filter
    if (statusFilter) {
      filtered = filtered.filter(app => app.status === statusFilter);
    }

    // Apply sorting
    switch (sortBy) {
      case 'date-desc':
        filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
        break;
      case 'date-asc':
        filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
        break;
      case 'company':
        filtered.sort((a, b) => (a.company || '').localeCompare(b.company || ''));
        break;
      case 'status':
        filtered.sort((a, b) => (a.status || '').localeCompare(b.status || ''));
        break;
    }

    renderApplicationsTable(filtered);
  }

  // Edit Modal Functions
  function openEditModal(id) {
    const app = applications.find(a => a.id === id);
    if (!app) return;

    currentEditingAppId = id;

    document.getElementById('editAppCompany').textContent = app.company || 'N/A';
    document.getElementById('editAppRole').textContent = app.role || 'N/A';
    document.getElementById('editAppStatus').value = app.status || 'Draft';
    document.getElementById('editAppNotes').value = app.notes || '';

    const modal = document.getElementById('editApplicationModal');
    modal.classList.remove('hidden');
  }

  function closeEditModal() {
    const modal = document.getElementById('editApplicationModal');
    modal.classList.add('hidden');
    currentEditingAppId = null;
  }

  function saveEditedApplication() {
    if (!currentEditingAppId) return;

    const app = applications.find(a => a.id === currentEditingAppId);
    if (!app) return;

    app.status = document.getElementById('editAppStatus').value;
    app.notes = document.getElementById('editAppNotes').value;

    addOrUpdateApplication(app);
    closeEditModal();
  }

  // Export to CSV
  function exportToCSV() {
    if (applications.length === 0) {
      alert('No applications to export.');
      return;
    }

    const headers = ['Date', 'Company', 'Role', 'Status', 'Notes'];
    const rows = applications.map(app => [
      formatDate(app.date),
      app.company || '',
      app.role || '',
      app.status || 'Draft',
      (app.notes || '').replace(/"/g, '""') // Escape quotes
    ]);

    let csv = headers.join(',') + '\n';
    rows.forEach(row => {
      csv += row.map(field => `"${field}"`).join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `cover-letter-applications-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Refresh entire dashboard
  function refreshDashboard() {
    renderStats();
    filterAndSortApplications();
  }

  // Manual re-import function
  function forceReimport() {
    const savedLetters = localStorage.getItem('savedLetters');
    if (!savedLetters) {
      alert('No saved letters found to import.');
      return;
    }

    const letters = JSON.parse(savedLetters);
    if (letters.length === 0) {
      alert('No saved letters found to import.');
      return;
    }

    const confirmMsg = `This will re-import ${letters.length} saved letter${letters.length > 1 ? 's' : ''}. Any duplicate entries will be created. Continue?`;
    if (!confirm(confirmMsg)) {
      return;
    }

    // Temporarily reset migration flag
    localStorage.removeItem('dashboardMigrated');
    
    // Run migration
    const count = migrateSavedLetters();
    
    if (count > 0) {
      alert(`✅ Successfully imported ${count} saved letter${count > 1 ? 's' : ''}!`);
      refreshDashboard();
    } else {
      alert('No new letters were imported.');
    }
  }

  // Event Listeners
  function setupEventListeners() {
    // Filter controls
    document.getElementById('searchApplications').addEventListener('input', filterAndSortApplications);
    document.getElementById('filterStatus').addEventListener('change', filterAndSortApplications);
    document.getElementById('sortApplications').addEventListener('change', filterAndSortApplications);

    // Export button
    document.getElementById('exportApplicationsBtn').addEventListener('click', exportToCSV);
    
    // Re-import button
    document.getElementById('reimportLettersBtn').addEventListener('click', forceReimport);

    // Edit modal buttons
    document.getElementById('editAppCancelBtn').addEventListener('click', closeEditModal);
    document.getElementById('editAppSaveBtn').addEventListener('click', saveEditedApplication);

    // Close modal on background click
    document.getElementById('editApplicationModal').addEventListener('click', (e) => {
      if (e.target.id === 'editApplicationModal') {
        closeEditModal();
      }
    });
  }

  // General notification helper
  function showNotification(message, type = 'info') {
    const colors = {
      success: '#00b894',
      error: '#ff7675',
      warning: '#fdcb6e',
      info: '#6c63ff'
    };
    
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 100px;
      right: 20px;
      background: ${colors[type] || colors.info};
      color: white;
      padding: 14px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      z-index: 10000;
      font-family: 'Poppins', sans-serif;
      font-size: 0.9rem;
      max-width: 300px;
      animation: slideIn 0.3s ease;
    `;
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    }, 4000);
  }

  // Initialization
  async function initDashboard() {
    console.log('📈 Initializing dashboard...');
    await loadApplications();
    console.log('📉 Applications loaded:', applications.length);
    
    // Migrate previously saved letters
    const migratedCount = migrateSavedLetters();
    if (migratedCount > 0) {
      // Show notification to user
      showMigrationNotification(migratedCount);
    }
    
    refreshDashboard();
    console.log('✅ Dashboard statistics updated');
    setupEventListeners();
    
    // Show connection status
    if (authToken) {
      const healthy = await apiHealthCheck();
      if (healthy) {
        console.log('✅ Dashboard initialized with database connection');
      } else {
        console.log('💾 Dashboard initialized (local storage only)');
        showNotification('Working offline - changes saved locally', 'warning');
      }
    } else {
      console.log('💾 Dashboard initialized (local storage only - not signed in)');
    }
  }

  // Show migration notification
  function showMigrationNotification(count) {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 100px;
      right: 20px;
      background: linear-gradient(135deg, #6c63ff 0%, #5a54d6 100%);
      color: white;
      padding: 16px 24px;
      border-radius: 10px;
      box-shadow: 0 8px 20px rgba(108, 99, 255, 0.4);
      z-index: 10000;
      font-family: 'Poppins', sans-serif;
      font-size: 0.95rem;
      max-width: 350px;
      animation: slideIn 0.3s ease;
    `;
    
    notification.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px;">
        <div style="font-size: 1.5rem;">🎉</div>
        <div>
          <div style="font-weight: 600; margin-bottom: 4px;">Welcome to Your Dashboard!</div>
          <div style="font-size: 0.85rem; opacity: 0.9;">
            We've imported ${count} previously saved letter${count > 1 ? 's' : ''} into your application tracker.
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 6 seconds
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    }, 6000);
    
    // Add animations
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from {
          transform: translateX(400px);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      @keyframes slideOut {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(400px);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }

  // Start the dashboard when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDashboard);
  } else {
    initDashboard();
  }

  // Expose functions for integration with main app
  window.DashboardAPI = {
    addApplication: function(company, role, status = 'Applied', paragraphs = [], notes = '') {
      const app = {
        id: generateId(),
        company: company,
        role: role,
        status: status,
        notes: '', // Always blank for new applications
        date: new Date().toISOString(),
        paragraphs: paragraphs,
        timeSpent: 0
      };
      addOrUpdateApplication(app);
      return app.id;
    },
    
    updateApplicationStatus: function(id, status) {
      const app = applications.find(a => a.id === id);
      if (app) {
        app.status = status;
        saveApplications();
      }
    },
    
    refresh: async function() {
      console.log('🔄 Dashboard refresh requested');
      await loadApplications();
      refreshDashboard();
      console.log('✅ Dashboard refreshed with', applications.length, 'applications');
    }
  };
  
  console.log('🎯 Dashboard API exposed and ready');

})();
