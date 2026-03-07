/**
 * VitaePro Mobile — Auth Module
 * Handles login, registration, logout, session management.
 */
(function () {
  'use strict';

  const STORAGE_TOKEN = 'vp_token';
  const STORAGE_USER  = 'vp_user';

  /* ── API base detection ─────────────────────────────────────── */
  function apiBase() {
    if (window.__VP_API_BASE) return window.__VP_API_BASE;
    // Production domains serve API from same origin
    const host = location.hostname;
    if (host.includes('vitaepro.com.au') || host.includes('clickcoverlettercreator.com.au')) {
      return location.origin;
    }
    // Local dev
    return 'http://localhost:3050';
  }

  /* ── Token helpers ──────────────────────────────────────────── */
  function getToken() {
    return localStorage.getItem(STORAGE_TOKEN);
  }

  function setSession(token, user) {
    localStorage.setItem(STORAGE_TOKEN, token);
    localStorage.setItem(STORAGE_USER, JSON.stringify(user));
  }

  function clearSession() {
    localStorage.removeItem(STORAGE_TOKEN);
    localStorage.removeItem(STORAGE_USER);
  }

  function getUser() {
    try {
      const raw = localStorage.getItem(STORAGE_USER);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }

  function isLoggedIn() {
    return !!getToken();
  }

  /* ── Auth API calls ─────────────────────────────────────────── */
  async function register(username, password) {
    const res = await fetch(apiBase() + '/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');
    setSession(data.token, data.user);
    return data.user;
  }

  async function login(username, password) {
    const res = await fetch(apiBase() + '/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    setSession(data.token, data.user);
    return data.user;
  }

  async function logout() {
    try {
      const token = getToken();
      if (token) {
        await fetch(apiBase() + '/auth/logout', {
          method: 'POST',
          headers: { 'Authorization': 'Bearer ' + token }
        });
      }
    } catch (e) { console.warn('Logout request failed:', e); }
    clearSession();
  }

  async function checkSession() {
    const token = getToken();
    if (!token) return null;
    try {
      const res = await fetch(apiBase() + '/auth/me', {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if (!res.ok) { clearSession(); return null; }
      const user = await res.json();
      localStorage.setItem(STORAGE_USER, JSON.stringify(user));
      return user;
    } catch { clearSession(); return null; }
  }

  async function requestPasswordReset(username) {
    const res = await fetch(apiBase() + '/auth/request-password-reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
  }

  async function confirmPasswordReset(token, newPassword) {
    const res = await fetch(apiBase() + '/auth/confirm-password-reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, newPassword })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Reset failed');
    return data;
  }

  /**
   * Require login — redirect to auth page if not authenticated.
   * Call at the top of page-init functions.
   */
  function requireAuth(redirectTo) {
    if (!isLoggedIn()) {
      const target = redirectTo || 'm-dashboard.html';
      location.href = 'm-login.html?redirect=' + encodeURIComponent(target);
      return false;
    }
    return true;
  }

  /* ── Expose ─────────────────────────────────────────────────── */
  window.VPAuth = {
    apiBase,
    getToken,
    getUser,
    isLoggedIn,
    setSession,
    clearSession,
    register,
    login,
    logout,
    checkSession,
    requestPasswordReset,
    confirmPasswordReset,
    requireAuth
  };
})();
