/**
 * VitaePro Mobile — API Client
 * Depends on m-auth.js (VPAuth must be loaded first).
 */
(function () {
  'use strict';

  function authHeaders() {
    const token = VPAuth.getToken();
    const h = { 'Content-Type': 'application/json' };
    if (token) h['Authorization'] = 'Bearer ' + token;
    return h;
  }

  function base() { return VPAuth.apiBase(); }

  async function request(method, path, body) {
    const opts = { method, headers: authHeaders() };
    if (body && method !== 'GET') opts.body = JSON.stringify(body);
    const res = await fetch(base() + path, opts);
    if (res.status === 401) {
      VPAuth.clearSession();
      location.href = 'm-login.html';
      throw new Error('Session expired');
    }
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
  }

  /* ── Responses ──────────────────────────────────────────────── */
  async function getResponses(category) {
    const q = category ? '?category=' + encodeURIComponent(category) : '';
    return request('GET', '/responses' + q);
  }

  async function getCrowdResponses() {
    return request('GET', '/responses/crowd');
  }

  async function createResponse(data) {
    return request('POST', '/responses', data);
  }

  async function updateResponse(id, data) {
    return request('PUT', '/responses/' + id, data);
  }

  async function deleteResponse(id) {
    return request('DELETE', '/responses/' + id);
  }

  /* ── Applications ───────────────────────────────────────────── */
  async function getApplications() {
    return request('GET', '/applications');
  }

  async function createApplication(data) {
    return request('POST', '/applications', data);
  }

  async function updateApplication(id, data) {
    return request('PUT', '/applications/' + id, data);
  }

  async function deleteApplication(id) {
    return request('DELETE', '/applications/' + id);
  }

  /* ── User Preferences ───────────────────────────────────────── */
  async function getPreferences() {
    return request('GET', '/user/preferences');
  }

  async function updatePreferences(data) {
    return request('PUT', '/user/preferences', data);
  }

  /* ── AI Endpoints ───────────────────────────────────────────── */
  async function extractJobAd(jobAdText) {
    return request('POST', '/api/extract-job-ad', { jobAdText });
  }

  async function generateParagraphs(jobAdText, profile, resumeText) {
    return request('POST', '/api/generate-paragraphs', { jobAdText, profile, resumeText });
  }

  async function generateFromAnswers(jobAdText, answers, profile) {
    return request('POST', '/api/generate-from-answers', { jobAdText, answers, profile });
  }

  async function getAtsScore(jobAdText, coverLetterText, profile) {
    return request('POST', '/api/ats-score', { jobAdText, coverLetterText, profile });
  }

  async function quickApply(jobAdText, profile, resumeText) {
    return request('POST', '/api/quick-apply', { jobAdText, profile, resumeText });
  }

  /* ── AI Status ──────────────────────────────────────────────── */
  async function getAiStatus() {
    const res = await fetch(base() + '/api/ai-status');
    return res.json();
  }

  /* ── Recruiter ──────────────────────────────────────────────── */
  async function getRecruiterCandidates() {
    return request('GET', '/api/recruiter/candidates');
  }

  async function getRecruiterApplication(id) {
    return request('GET', '/api/recruiter/applications/' + id);
  }

  async function submitReview(data) {
    return request('POST', '/api/recruiter/review', data);
  }

  async function getAgencyLibrary() {
    return request('GET', '/api/recruiter/library');
  }

  async function addToAgencyLibrary(data) {
    return request('POST', '/api/recruiter/library', data);
  }

  /* ── Expose ─────────────────────────────────────────────────── */
  window.VPApi = {
    getResponses,
    getCrowdResponses,
    createResponse,
    updateResponse,
    deleteResponse,
    getApplications,
    createApplication,
    updateApplication,
    deleteApplication,
    getPreferences,
    updatePreferences,
    extractJobAd,
    generateParagraphs,
    generateFromAnswers,
    getAtsScore,
    quickApply,
    getAiStatus,
    getRecruiterCandidates,
    getRecruiterApplication,
    submitReview,
    getAgencyLibrary,
    addToAgencyLibrary
  };
})();
