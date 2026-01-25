// Admin Dashboard Logic for VitaePro
(function() {
  'use strict';

  // Check if we're on the admin dashboard page
  if (!document.body.classList.contains('admin-dashboard-page')) {
    return;
  }

  // API Configuration
  const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3050'
    : (window.ENV_API_BASE !== undefined ? window.ENV_API_BASE : '');
  const API_TIMEOUT_MS = 10000;

  // Helper Functions
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

  async function fetchAdminStats() {
    try {
      const response = await fetchWithTimeout(`${API_BASE}/api/admin/stats`);
      if (!response.ok) {
        throw new Error(`Failed to fetch stats: ${response.status}`);
      }
      return await response.json();
    } catch (e) {
      console.error('Error fetching admin stats:', e);
      throw e;
    }
  }

  function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-AU', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function formatDateShort(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-AU', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric'
    });
  }

  // Display Functions
  function displayMainStats(stats) {
    // Main stats
    document.getElementById('totalUsers').textContent = stats.totalUsers || 0;
    document.getElementById('totalApplications').textContent = stats.totalApplications || 0;
    document.getElementById('totalResponses').textContent = stats.totalResponses || 0;
    
    const totalAICalls = (stats.aiCallsExtract || 0) + (stats.aiCallsGenerate || 0);
    document.getElementById('totalAICalls').textContent = totalAICalls;
    document.getElementById('aiExtractCount').textContent = stats.aiCallsExtract || 0;
    document.getElementById('aiGenerateCount').textContent = stats.aiCallsGenerate || 0;

    // Secondary stats
    const avgApps = stats.totalUsers > 0 
      ? (stats.totalApplications / stats.totalUsers).toFixed(1) 
      : 0;
    document.getElementById('avgApplicationsPerUser').textContent = avgApps;

    const avgResp = stats.totalUsers > 0 
      ? (stats.totalResponses / stats.totalUsers).toFixed(1) 
      : 0;
    document.getElementById('avgResponsesPerUser').textContent = avgResp;

    // AI usage rate (% of applications that used AI)
    const aiUsageRate = stats.totalApplications > 0 
      ? ((totalAICalls / stats.totalApplications) * 100).toFixed(1) 
      : 0;
    document.getElementById('aiUsageRate').textContent = aiUsageRate + '%';
  }

  function displayStatusBreakdown(statusData) {
    const container = document.getElementById('statusBreakdownAdmin');
    if (!statusData || Object.keys(statusData).length === 0) {
      container.innerHTML = '<p class="no-data">No application status data available.</p>';
      return;
    }

    const statusEmojis = {
      'Draft': '📄',
      'Applied': '✉️',
      'Interview Scheduled': '📞',
      'Interview Complete': '✅',
      'Assessment Pending': '📋',
      'Offer Made': '🎉',
      'Offer Accepted': '🏆',
      'Rejected': '❌',
      'Unknown': '❓'
    };

    let html = '';
    for (const [status, count] of Object.entries(statusData)) {
      const emoji = statusEmojis[status] || '📌';
      html += `
        <div class="status-item-admin">
          <span class="status-label">${emoji} ${status}</span>
          <span class="status-count">${count}</span>
        </div>
      `;
    }

    container.innerHTML = html;
  }

  function displayTopUsers(topUsers) {
    const tbody = document.getElementById('topUsersTableBody');
    
    if (!topUsers || topUsers.length === 0) {
      tbody.innerHTML = '<tr class="no-data-row"><td colspan="4">No user data available.</td></tr>';
      return;
    }

    let html = '';
    topUsers.forEach((user, index) => {
      html += `
        <tr>
          <td><strong>${index + 1}</strong></td>
          <td>${escapeHtml(user.username)}</td>
          <td><strong>${user.applicationCount}</strong></td>
          <td>${formatDateShort(user.memberSince)}</td>
        </tr>
      `;
    });

    tbody.innerHTML = html;
  }

  function displayRecentActivity(recentActivity) {
    const tbody = document.getElementById('recentActivityTableBody');
    
    if (!recentActivity || recentActivity.length === 0) {
      tbody.innerHTML = '<tr class="no-data-row"><td colspan="4">No recent activity.</td></tr>';
      return;
    }

    let html = '';
    recentActivity.forEach(activity => {
      html += `
        <tr>
          <td>${formatDate(activity.createdAt)}</td>
          <td>${escapeHtml(activity.username)}</td>
          <td>${escapeHtml(activity.company || 'N/A')}</td>
          <td>${escapeHtml(activity.role || 'N/A')}</td>
        </tr>
      `;
    });

    tbody.innerHTML = html;
  }

  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function showError(message) {
    alert('Error: ' + message);
  }

  // Load and display all stats
  async function loadDashboard() {
    try {
      const stats = await fetchAdminStats();
      displayMainStats(stats);
      displayStatusBreakdown(stats.applicationsByStatus);
      displayTopUsers(stats.topUsers);
      displayRecentActivity(stats.recentActivity);
    } catch (e) {
      showError('Failed to load admin statistics. Please try again.');
      console.error('Dashboard load error:', e);
    }
  }

  // Event Listeners
  document.getElementById('refreshStatsBtn').addEventListener('click', async () => {
    const btn = document.getElementById('refreshStatsBtn');
    btn.disabled = true;
    btn.textContent = '⏳ Refreshing...';
    
    try {
      await loadDashboard();
      btn.textContent = '✅ Refreshed!';
      setTimeout(() => {
        btn.textContent = '🔄 Refresh Statistics';
        btn.disabled = false;
      }, 2000);
    } catch (e) {
      btn.textContent = '❌ Error';
      setTimeout(() => {
        btn.textContent = '🔄 Refresh Statistics';
        btn.disabled = false;
      }, 2000);
    }
  });

  // Initial load
  loadDashboard();

  // Auto-refresh every 30 seconds
  setInterval(loadDashboard, 30000);

})();
