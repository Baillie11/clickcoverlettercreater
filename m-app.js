/**
 * VitaePro Mobile — Application Logic
 * Depends on m-auth.js, m-api.js
 */
(function () {
  'use strict';

  const STORE_KEY = 'vp_workflow';
  const $ = id => document.getElementById(id);

  /* ──────────────────────────────────────────────────────────── *
   *  Workflow State  (persisted in localStorage between pages)
   * ──────────────────────────────────────────────────────────── */
  function loadState() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      return raw ? JSON.parse(raw) : defaultState();
    } catch { return defaultState(); }
  }

  function saveState(s) {
    localStorage.setItem(STORE_KEY, JSON.stringify(s));
  }

  function defaultState() {
    return {
      jobTitle: '',
      companyName: '',
      contactPerson: '',
      jobAdText: '',
      answers: {},
      suggestions: [],
      selectedIndexes: [],
      sections: [],
      atsScore: null,
      appId: null
    };
  }

  function clearWorkflow() {
    localStorage.removeItem(STORE_KEY);
  }

  /* ──────────────────────────────────────────────────────────── *
   *  Helpers
   * ──────────────────────────────────────────────────────────── */
  function toast(msg, type) {
    const el = $('toast');
    if (!el) return;
    el.textContent = msg;
    el.className = 'toast show ' + (type || '');
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.remove('show'), 3000);
  }

  function genId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
  }

  function formatDate(d) {
    const dt = d ? new Date(d) : new Date();
    return dt.toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  /** Profile stored by old app — try to read it */
  function getProfile() {
    try {
      const raw = localStorage.getItem('userProfile');
      return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
  }

  /* ──────────────────────────────────────────────────────────── *
   *  Voice Input (Web Speech API)
   * ──────────────────────────────────────────────────────────── */
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  let recognition = null;
  let activeVoiceBtn = null;

  function supportsVoice() { return !!SpeechRecognition; }

  function startVoice(textareaId, btn) {
    if (!SpeechRecognition) return;
    if (recognition) { recognition.abort(); recognition = null; }

    recognition = new SpeechRecognition();
    recognition.lang = 'en-AU';
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    activeVoiceBtn = btn;
    btn.classList.add('recording');

    let finalTranscript = '';
    const textarea = $(textareaId);
    const existing = textarea.value;

    recognition.onresult = e => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) {
          finalTranscript += e.results[i][0].transcript + ' ';
        } else {
          interim += e.results[i][0].transcript;
        }
      }
      textarea.value = existing + (existing ? ' ' : '') + finalTranscript + interim;
    };

    recognition.onerror = () => stopVoice();
    recognition.onend = () => stopVoice();
    recognition.start();
  }

  function stopVoice() {
    if (recognition) { try { recognition.stop(); } catch {} recognition = null; }
    if (activeVoiceBtn) { activeVoiceBtn.classList.remove('recording'); activeVoiceBtn = null; }
  }

  /* ──────────────────────────────────────────────────────────── *
   *  PAGE: Dashboard
   * ──────────────────────────────────────────────────────────── */
  function initDashboard() {
    if (!VPAuth.requireAuth('m-dashboard.html')) return;

    const user = VPAuth.getUser();
    const welcomeMsg = $('welcomeMsg');
    if (user && welcomeMsg) {
      const name = user.username ? user.username.split('@')[0] : '';
      welcomeMsg.textContent = 'Welcome' + (name ? ', ' + name : ' back');
    }

    $('logoutBtn').addEventListener('click', async () => {
      await VPAuth.logout();
      location.href = 'm-login.html';
    });

    // Clear any previous workflow
    clearWorkflow();

    // Load stats
    loadDashboardStats();
  }

  async function loadDashboardStats() {
    try {
      const apps = await VPApi.getApplications();
      $('statTotal').textContent = apps.length;
      $('statDrafts').textContent = apps.filter(a => (a.status || '').toLowerCase() === 'draft').length;
      $('statInterviews').textContent = apps.filter(a => (a.status || '').toLowerCase().includes('interview')).length;

      // Recent apps
      const recent = apps.slice(0, 5);
      const container = $('recentApps');
      if (recent.length === 0) return;

      container.innerHTML = recent.map(app => `
        <div class="card" style="cursor:pointer" data-id="${app.id}">
          <div class="card-header">
            <div class="card-title">${esc(app.role || 'Untitled')}</div>
            <span class="badge badge-${statusColor(app.status)}">${esc(app.status || 'Draft')}</span>
          </div>
          <div class="card-body">${esc(app.company || '')} ${app.date ? '· ' + formatDate(app.date) : ''}</div>
        </div>
      `).join('');
    } catch (e) {
      console.warn('Failed to load stats:', e);
    }
  }

  function statusColor(s) {
    if (!s) return 'primary';
    const l = s.toLowerCase();
    if (l.includes('draft')) return 'warning';
    if (l.includes('applied')) return 'info';
    if (l.includes('interview')) return 'primary';
    if (l.includes('offer')) return 'success';
    if (l.includes('reject')) return 'danger';
    return 'primary';
  }

  /* ──────────────────────────────────────────────────────────── *
   *  PAGE: Job Details (Step 2)
   * ──────────────────────────────────────────────────────────── */
  function initJobDetails() {
    if (!VPAuth.requireAuth('m-job-details.html')) return;

    const state = loadState();
    $('jobTitle').value = state.jobTitle || '';
    $('companyName').value = state.companyName || '';
    $('contactPerson').value = state.contactPerson || '';
    $('jobAdText').value = state.jobAdText || '';

    // Auto-save on change
    ['jobTitle', 'companyName', 'contactPerson', 'jobAdText'].forEach(id => {
      $(id).addEventListener('input', () => {
        const s = loadState();
        s[id] = $(id).value;
        saveState(s);
      });
    });

    // Extract info from ad
    $('extractBtn').addEventListener('click', async () => {
      const adText = $('jobAdText').value.trim();
      if (!adText) { toast('Paste a job ad first', 'error'); return; }
      $('extractBtn').disabled = true;
      $('extractBtn').textContent = 'Extracting…';
      try {
        const info = await VPApi.extractJobAd(adText);
        if (info.roleTitle) $('jobTitle').value = info.roleTitle;
        if (info.companyName) $('companyName').value = info.companyName;
        if (info.contactPerson) $('contactPerson').value = info.contactPerson;
        // Save
        const s = loadState();
        s.jobTitle = $('jobTitle').value;
        s.companyName = $('companyName').value;
        s.contactPerson = $('contactPerson').value;
        saveState(s);
        toast('Job info extracted!', 'success');
      } catch (e) {
        toast(e.message, 'error');
      }
      $('extractBtn').disabled = false;
      $('extractBtn').textContent = '✨ Extract Job Info from Ad';
    });

    // Continue
    $('continueBtn').addEventListener('click', () => {
      const title = $('jobTitle').value.trim();
      const company = $('companyName').value.trim();
      const ad = $('jobAdText').value.trim();
      if (!title || !company) { toast('Job title and company are required', 'error'); return; }
      if (!ad) { toast('Please paste the job advertisement', 'error'); return; }
      location.href = 'm-guided.html';
    });
  }

  /* ──────────────────────────────────────────────────────────── *
   *  PAGE: Guided Builder (Step 3)
   * ──────────────────────────────────────────────────────────── */
  const GUIDED_QUESTIONS = [
    { key: 'interest', text: 'Why are you interested in this role?' },
    { key: 'experience', text: 'What relevant experience do you have?' },
    { key: 'achievement', text: 'What achievement are you most proud of?' },
    { key: 'fit', text: 'What makes you a strong fit for this company?' }
  ];

  function initGuided() {
    if (!VPAuth.requireAuth('m-guided.html')) return;

    const state = loadState();
    const container = $('questionsContainer');
    const hasVoice = supportsVoice();

    container.innerHTML = GUIDED_QUESTIONS.map((q, i) => `
      <div class="question-card">
        <div class="question-number">Question ${i + 1} of ${GUIDED_QUESTIONS.length}</div>
        <div class="question-text">${q.text}</div>
        <div class="question-input-row">
          <textarea class="form-textarea" id="answer_${q.key}" placeholder="Type your answer…">${esc(state.answers[q.key] || '')}</textarea>
          <button type="button" class="voice-btn ${hasVoice ? '' : 'hidden'}" data-target="answer_${q.key}" title="Voice input">🎤</button>
        </div>
      </div>
    `).join('');

    // Auto-save answers
    GUIDED_QUESTIONS.forEach(q => {
      $('answer_' + q.key).addEventListener('input', () => {
        const s = loadState();
        s.answers[q.key] = $('answer_' + q.key).value;
        saveState(s);
      });
    });

    // Voice buttons
    container.querySelectorAll('.voice-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.classList.contains('recording')) {
          stopVoice();
        } else {
          startVoice(btn.dataset.target, btn);
        }
      });
    });

    // Generate
    $('generateBtn').addEventListener('click', () => {
      // Save final state
      const s = loadState();
      GUIDED_QUESTIONS.forEach(q => {
        s.answers[q.key] = $('answer_' + q.key).value;
      });
      saveState(s);
      location.href = 'm-suggestions.html';
    });
  }

  /* ──────────────────────────────────────────────────────────── *
   *  PAGE: AI Suggestions (Step 4)
   * ──────────────────────────────────────────────────────────── */
  function initSuggestions() {
    if (!VPAuth.requireAuth('m-suggestions.html')) return;

    const state = loadState();

    // If we already have suggestions, render them
    if (state.suggestions && state.suggestions.length > 0) {
      renderSuggestions(state);
    } else {
      generateSuggestions(state);
    }

    $('buildLetterBtn').addEventListener('click', () => {
      const s = loadState();
      if (!s.selectedIndexes || s.selectedIndexes.length === 0) {
        toast('Select at least one paragraph', 'error');
        return;
      }
      // Build sections from selected suggestions
      s.sections = s.selectedIndexes.map(i => ({
        tag: s.suggestions[i].tag,
        text: s.suggestions[i].text
      }));
      saveState(s);
      location.href = 'm-editor.html';
    });
  }

  async function generateSuggestions(state) {
    const overlay = $('loadingOverlay');
    overlay.classList.remove('hidden');

    try {
      const profile = getProfile();
      const result = await VPApi.generateFromAnswers(state.jobAdText, state.answers, profile);
      state.suggestions = result.responses || [];
      state.selectedIndexes = state.suggestions.map((_, i) => i); // Select all by default

      // Try ATS score
      try {
        const letterText = state.suggestions.map(s => s.text).join('\n\n');
        const ats = await VPApi.getAtsScore(state.jobAdText, letterText, profile);
        state.atsScore = ats;
      } catch { state.atsScore = null; }

      saveState(state);
      renderSuggestions(state);
    } catch (e) {
      toast('AI generation failed: ' + e.message, 'error');
      // Fallback — try the standard endpoint
      try {
        const profile = getProfile();
        const result = await VPApi.generateParagraphs(state.jobAdText, profile);
        state.suggestions = result.responses || [];
        state.selectedIndexes = state.suggestions.map((_, i) => i);
        saveState(state);
        renderSuggestions(state);
      } catch (e2) {
        toast('Generation failed. Try again later.', 'error');
      }
    }

    overlay.classList.add('hidden');
  }

  function renderSuggestions(state) {
    // ATS Score
    if (state.atsScore) {
      const ats = state.atsScore;
      const card = $('atsCard');
      card.style.display = '';
      const score = ats.score || 0;
      $('atsValue').textContent = score + '%';
      const ring = $('atsRing');
      ring.className = 'ats-score-ring ' + (score >= 75 ? 'high' : score >= 50 ? 'medium' : 'low');

      const bd = $('atsBreakdown');
      const items = ats.breakdown || [];
      bd.innerHTML = items.map(item => `
        <div class="ats-item">
          <span class="${item.matched ? 'ats-check' : 'ats-miss'}">${item.matched ? '✓' : '✗'}</span>
          ${esc(item.label)}
        </div>
      `).join('');
    }

    // Suggestions
    const container = $('suggestionsContainer');
    container.innerHTML = state.suggestions.map((s, i) => {
      const selected = (state.selectedIndexes || []).includes(i);
      return `
        <div class="suggestion-card ${selected ? 'selected' : ''}" data-index="${i}">
          <span class="suggestion-tag">${esc(s.tag || 'Paragraph')}</span>
          <div class="suggestion-text">${esc(s.text)}</div>
          <div class="suggestion-actions">
            <button class="btn btn-sm ${selected ? 'btn-primary' : 'btn-secondary'}" data-action="toggle" data-index="${i}">
              ${selected ? '✓ Selected' : 'Add to Letter'}
            </button>
            <button class="btn btn-sm btn-ghost" data-action="save" data-index="${i}">💾 Save to Library</button>
          </div>
        </div>
      `;
    }).join('');

    // Events
    container.querySelectorAll('.suggestion-card').forEach(card => {
      card.addEventListener('click', e => {
        if (e.target.closest('button')) return;
        card.classList.toggle('expanded');
      });
    });

    container.querySelectorAll('[data-action="toggle"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.index);
        const s = loadState();
        const set = new Set(s.selectedIndexes || []);
        if (set.has(idx)) set.delete(idx); else set.add(idx);
        s.selectedIndexes = [...set].sort((a, b) => a - b);
        saveState(s);
        renderSuggestions(s);
      });
    });

    container.querySelectorAll('[data-action="save"]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const idx = parseInt(btn.dataset.index);
        const s = loadState();
        const sg = s.suggestions[idx];
        try {
          await VPApi.createResponse({
            id: genId(),
            text: sg.text,
            category: sg.tag || 'General',
            userCreated: true,
            source: 'ai'
          });
          toast('Saved to library!', 'success');
        } catch (e) {
          toast(e.message, 'error');
        }
      });
    });
  }

  /* ──────────────────────────────────────────────────────────── *
   *  PAGE: Editor (Step 5)
   * ──────────────────────────────────────────────────────────── */
  function initEditor() {
    if (!VPAuth.requireAuth('m-editor.html')) return;

    const state = loadState();
    renderEditorSections(state.sections || []);

    // Add Section modal
    $('addSectionBtn').addEventListener('click', () => {
      $('addSectionModal').classList.add('open');
    });

    $('cancelAddSection').addEventListener('click', () => {
      $('addSectionModal').classList.remove('open');
    });

    $('addSectionModal').addEventListener('click', e => {
      if (e.target === $('addSectionModal')) $('addSectionModal').classList.remove('open');
    });

    $('confirmAddSection').addEventListener('click', () => {
      const label = $('newSectionLabel').value.trim();
      const text = $('newSectionText').value.trim();
      if (!label || !text) { toast('Fill in both fields', 'error'); return; }
      const s = loadState();
      s.sections.push({ tag: label, text: text });
      saveState(s);
      renderEditorSections(s.sections);
      $('addSectionModal').classList.remove('open');
      $('newSectionLabel').value = '';
      $('newSectionText').value = '';
    });

    // Save application
    $('saveAppBtn').addEventListener('click', () => saveCurrentApplication());

    // Preview
    $('previewBtn').addEventListener('click', () => {
      syncEditorToState();
      location.href = 'm-preview.html';
    });
  }

  function renderEditorSections(sections) {
    const container = $('editorSections');
    container.innerHTML = sections.map((sec, i) => `
      <div class="editor-section expanded" data-index="${i}">
        <div class="editor-section-header">
          <span class="section-label">
            <span class="drag-handle">⠿</span>
            ${esc(sec.tag || 'Section ' + (i + 1))}
          </span>
          <div class="flex gap-2 items-center">
            <button class="btn btn-sm btn-ghost" data-action="delete" data-index="${i}" title="Remove">🗑</button>
            <span class="toggle-arrow">▼</span>
          </div>
        </div>
        <div class="editor-section-body">
          <textarea class="form-textarea" id="section_${i}" data-index="${i}">${esc(sec.text)}</textarea>
          <button class="btn btn-sm btn-ghost mt-2" data-action="save-lib" data-index="${i}">💾 Save to Library</button>
        </div>
      </div>
    `).join('');

    // Toggle expand/collapse
    container.querySelectorAll('.editor-section-header').forEach(header => {
      header.addEventListener('click', e => {
        if (e.target.closest('button')) return;
        header.closest('.editor-section').classList.toggle('expanded');
      });
    });

    // Delete
    container.querySelectorAll('[data-action="delete"]').forEach(btn => {
      btn.addEventListener('click', () => {
        syncEditorToState();
        const s = loadState();
        s.sections.splice(parseInt(btn.dataset.index), 1);
        saveState(s);
        renderEditorSections(s.sections);
      });
    });

    // Save to library
    container.querySelectorAll('[data-action="save-lib"]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const idx = parseInt(btn.dataset.index);
        syncEditorToState();
        const s = loadState();
        const sec = s.sections[idx];
        try {
          await VPApi.createResponse({
            id: genId(),
            text: sec.text,
            category: sec.tag || 'General',
            userCreated: true,
            source: 'manual'
          });
          toast('Saved to library!', 'success');
        } catch (e) { toast(e.message, 'error'); }
      });
    });

    // SortableJS for reordering
    if (typeof Sortable !== 'undefined') {
      Sortable.create(container, {
        handle: '.drag-handle',
        animation: 200,
        onEnd: () => {
          // Read new order from DOM
          const s = loadState();
          const newSections = [];
          container.querySelectorAll('.editor-section').forEach(el => {
            const idx = parseInt(el.dataset.index);
            const textarea = el.querySelector('textarea');
            newSections.push({ tag: s.sections[idx].tag, text: textarea.value });
          });
          s.sections = newSections;
          saveState(s);
          renderEditorSections(s.sections);
        }
      });
    }
  }

  function syncEditorToState() {
    const s = loadState();
    s.sections.forEach((sec, i) => {
      const ta = $('section_' + i);
      if (ta) sec.text = ta.value;
    });
    saveState(s);
  }

  async function saveCurrentApplication() {
    syncEditorToState();
    const s = loadState();
    const paragraphs = s.sections.map(sec => ({ tag: sec.tag, text: sec.text }));
    const data = {
      id: s.appId || genId(),
      company: s.companyName,
      role: s.jobTitle,
      status: 'Draft',
      notes: '',
      date: new Date().toISOString().split('T')[0],
      paragraphs: paragraphs
    };

    try {
      if (s.appId) {
        await VPApi.updateApplication(s.appId, data);
      } else {
        await VPApi.createApplication(data);
        s.appId = data.id;
        saveState(s);
      }
      toast('Application saved!', 'success');
    } catch (e) {
      toast('Save failed: ' + e.message, 'error');
    }
  }

  /* ──────────────────────────────────────────────────────────── *
   *  PAGE: Preview (Step 6)
   * ──────────────────────────────────────────────────────────── */
  function initPreview() {
    if (!VPAuth.requireAuth('m-preview.html')) return;

    const state = loadState();
    renderLetterPreview(state);

    $('themeSelect').addEventListener('change', () => renderLetterPreview(loadState()));
    $('editBtn').addEventListener('click', () => { location.href = 'm-editor.html'; });

    $('downloadBtn').addEventListener('click', () => {
      const element = $('letterPreview');
      const s = loadState();
      const filename = `Cover_Letter_${(s.companyName || 'Company').replace(/\s+/g, '_')}_${(s.jobTitle || 'Role').replace(/\s+/g, '_')}.pdf`;
      html2pdf().set({
        margin: [10, 10, 10, 10],
        filename: filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      }).from(element).save();
      toast('PDF downloading…', 'success');
    });

    $('saveBtn').addEventListener('click', async () => {
      const s = loadState();
      const paragraphs = s.sections.map(sec => ({ tag: sec.tag, text: sec.text }));
      const data = {
        id: s.appId || genId(),
        company: s.companyName,
        role: s.jobTitle,
        status: 'Applied',
        date: new Date().toISOString().split('T')[0],
        paragraphs: paragraphs
      };
      try {
        if (s.appId) {
          await VPApi.updateApplication(s.appId, { ...data, status: 'Applied' });
        } else {
          await VPApi.createApplication(data);
          s.appId = data.id;
          saveState(s);
        }
        toast('Application saved!', 'success');
      } catch (e) { toast(e.message, 'error'); }
    });

    // Show certified badges if recruiter reviewed
    if (state.recruiterStatus === 'certified') {
      $('certBadges').classList.remove('hidden');
    }
  }

  function renderLetterPreview(state) {
    const profile = getProfile();
    const preview = $('letterPreview');
    const theme = $('themeSelect').value;

    const fromName = [profile.firstName, profile.lastName].filter(Boolean).join(' ') || 'Your Name';
    const fromAddress = [profile.addressLine1, profile.addressLine2].filter(Boolean).join(', ');
    const fromContact = [profile.phoneNumber, profile.emailAddress].filter(Boolean).join(' | ');
    const toCompany = state.companyName || '';
    const toContact = state.contactPerson ? 'Dear ' + state.contactPerson + ',' : 'Dear Hiring Manager,';
    const dateStr = formatDate();
    const re = state.jobTitle ? 'Re: Application for ' + state.jobTitle : '';

    let bodyHtml = (state.sections || []).map(s => '<p>' + esc(s.text) + '</p>').join('');

    if (theme === 'modern-centered') {
      preview.innerHTML = `
        <div style="text-align:center;margin-bottom:24px">
          <div style="font-size:1.1rem;font-weight:bold">${esc(fromName)}</div>
          <div style="font-size:0.8rem;color:#666">${esc(fromContact)}</div>
          <div style="font-size:0.8rem;color:#666">${esc(fromAddress)}</div>
        </div>
        <div style="margin-bottom:16px;font-size:0.85rem">${esc(dateStr)}</div>
        ${re ? '<div style="font-weight:bold;margin-bottom:12px">' + esc(re) + '</div>' : ''}
        <div style="margin-bottom:12px">${esc(toContact)}</div>
        <div class="letter-body">${bodyHtml}</div>
        <div class="letter-closing" style="margin-top:24px">
          <p>Yours sincerely,</p>
          <p style="margin-top:20px;font-weight:bold">${esc(fromName)}</p>
        </div>`;
    } else if (theme === 'formal-classic') {
      preview.innerHTML = `
        <div style="text-align:right;margin-bottom:20px;font-size:0.85rem">
          <div>${esc(fromName)}</div>
          <div>${esc(fromAddress)}</div>
          <div>${esc(fromContact)}</div>
          <div style="margin-top:8px">${esc(dateStr)}</div>
        </div>
        <div style="margin-bottom:16px;font-size:0.85rem">
          <div>${esc(toCompany)}</div>
        </div>
        ${re ? '<div style="font-weight:bold;margin-bottom:12px">' + esc(re) + '</div>' : ''}
        <div style="margin-bottom:12px">${esc(toContact)}</div>
        <div class="letter-body">${bodyHtml}</div>
        <div class="letter-closing" style="margin-top:24px">
          <p>Yours faithfully,</p>
          <p style="margin-top:20px;font-weight:bold">${esc(fromName)}</p>
        </div>`;
    } else {
      // Standard
      preview.innerHTML = `
        <div class="letter-from" style="margin-bottom:16px;font-size:0.85rem">
          <div style="font-weight:bold">${esc(fromName)}</div>
          <div>${esc(fromAddress)}</div>
          <div>${esc(fromContact)}</div>
        </div>
        <div class="letter-date" style="margin-bottom:16px;font-size:0.85rem">${esc(dateStr)}</div>
        <div class="letter-to" style="margin-bottom:16px;font-size:0.85rem">
          <div>${esc(toCompany)}</div>
        </div>
        ${re ? '<div style="font-weight:bold;margin-bottom:12px">' + esc(re) + '</div>' : ''}
        <div style="margin-bottom:12px">${esc(toContact)}</div>
        <div class="letter-body">${bodyHtml}</div>
        <div class="letter-closing" style="margin-top:24px">
          <p>Kind regards,</p>
          <p style="margin-top:20px;font-weight:bold">${esc(fromName)}</p>
        </div>`;
    }
  }

  /* ──────────────────────────────────────────────────────────── *
   *  Quick Apply
   * ──────────────────────────────────────────────────────────── */
  function initQuickApply() {
    if (!VPAuth.requireAuth('m-quick-apply.html')) return;

    $('quickGenerateBtn').addEventListener('click', async () => {
      const ad = $('quickJobAd').value.trim();
      if (!ad) { toast('Paste a job ad first', 'error'); return; }

      $('quickStep1').classList.add('hidden');
      $('quickLoading').classList.remove('hidden');

      try {
        const profile = getProfile();
        const resumeText = localStorage.getItem('vp_resume_text') || '';
        const result = await VPApi.quickApply(ad, profile, resumeText);

        // Store in workflow
        const s = defaultState();
        s.jobAdText = ad;
        s.jobTitle = result.jobInfo?.roleTitle || '';
        s.companyName = result.jobInfo?.companyName || '';
        s.contactPerson = result.jobInfo?.contactPerson || '';
        s.suggestions = result.responses || [];
        s.selectedIndexes = s.suggestions.map((_, i) => i);
        s.sections = s.suggestions.map(r => ({ tag: r.tag, text: r.text }));
        saveState(s);

        // Show draft
        $('quickLoading').classList.add('hidden');
        $('quickStep2').classList.remove('hidden');

        const draftEl = $('quickDraft');
        draftEl.innerHTML = s.sections.map(sec => `
          <div class="editor-section expanded" style="margin-bottom:12px">
            <div class="editor-section-header" style="cursor:default">
              <span class="section-label">${esc(sec.tag)}</span>
            </div>
            <div class="editor-section-body" style="display:block">
              <textarea class="form-textarea" data-tag="${esc(sec.tag)}">${esc(sec.text)}</textarea>
            </div>
          </div>
        `).join('');

      } catch (e) {
        toast('Generation failed: ' + e.message, 'error');
        $('quickLoading').classList.add('hidden');
        $('quickStep1').classList.remove('hidden');
      }
    });

    $('quickPreviewBtn').addEventListener('click', () => {
      // Sync edits back
      const s = loadState();
      const textareas = $('quickDraft').querySelectorAll('textarea');
      s.sections = [];
      textareas.forEach(ta => {
        s.sections.push({ tag: ta.dataset.tag || 'Paragraph', text: ta.value });
      });
      saveState(s);
      location.href = 'm-preview.html';
    });
  }

  /* ──────────────────────────────────────────────────────────── *
   *  Library
   * ──────────────────────────────────────────────────────────── */
  function initLibrary() {
    if (!VPAuth.requireAuth('m-library.html')) return;

    let allResponses = [];
    let activeTab = 'all';
    let searchTerm = '';

    const searchInput = $('librarySearch');
    if (searchInput) {
      searchInput.addEventListener('input', () => {
        searchTerm = searchInput.value.toLowerCase();
        renderLibrary();
      });
    }

    // Tabs
    document.querySelectorAll('.tab[data-filter]').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.tab[data-filter]').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        activeTab = tab.dataset.filter;
        renderLibrary();
      });
    });

    // Add response
    $('addResponseBtn')?.addEventListener('click', () => {
      $('addResponseModal').classList.add('open');
    });
    $('cancelAddResponse')?.addEventListener('click', () => {
      $('addResponseModal').classList.remove('open');
    });
    $('confirmAddResponse')?.addEventListener('click', async () => {
      const text = $('newResponseText').value.trim();
      const cat = $('newResponseCategory').value.trim();
      if (!text || !cat) { toast('Fill in all fields', 'error'); return; }
      try {
        await VPApi.createResponse({ id: genId(), text, category: cat, userCreated: true, source: 'manual' });
        toast('Response added!', 'success');
        $('addResponseModal').classList.remove('open');
        $('newResponseText').value = '';
        loadLibrary();
      } catch (e) { toast(e.message, 'error'); }
    });

    async function loadLibrary() {
      try {
        const [user, crowd] = await Promise.all([
          VPApi.getResponses(),
          VPApi.getCrowdResponses().catch(() => [])
        ]);
        allResponses = [
          ...user.map(r => ({ ...r, _source: 'user' })),
          ...crowd.map(r => ({ ...r, _source: 'crowd' }))
        ];
        renderLibrary();
      } catch (e) { toast('Failed to load library', 'error'); }
    }

    function renderLibrary() {
      let filtered = allResponses;
      if (activeTab !== 'all') {
        filtered = filtered.filter(r => r._source === activeTab);
      }
      if (searchTerm) {
        filtered = filtered.filter(r =>
          r.text.toLowerCase().includes(searchTerm) ||
          (r.category || '').toLowerCase().includes(searchTerm)
        );
      }

      const container = $('libraryList');
      if (filtered.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-icon">📚</div><div class="empty-title">No responses found</div></div>';
        return;
      }

      container.innerHTML = filtered.map(r => `
        <div class="response-item">
          <div class="response-category">${esc(r.category || 'General')}</div>
          <div class="response-text">${esc(r.text)}</div>
          <div class="response-meta">
            <span class="response-source badge badge-${r._source === 'user' ? 'primary' : r._source === 'crowd' ? 'warning' : 'info'}">${r._source}</span>
            <div class="response-actions">
              ${r._source === 'user' ? `<button class="btn btn-sm btn-ghost" data-action="delete" data-id="${r.id}">🗑</button>` : ''}
            </div>
          </div>
        </div>
      `).join('');

      // Delete handlers
      container.querySelectorAll('[data-action="delete"]').forEach(btn => {
        btn.addEventListener('click', async () => {
          try {
            await VPApi.deleteResponse(btn.dataset.id);
            toast('Deleted', 'success');
            loadLibrary();
          } catch (e) { toast(e.message, 'error'); }
        });
      });
    }

    loadLibrary();
  }

  /* ──────────────────────────────────────────────────────────── *
   *  Recruiter Dashboard
   * ──────────────────────────────────────────────────────────── */
  function initRecruiter() {
    if (!VPAuth.requireAuth('m-recruiter.html')) return;

    loadRecruiterData();

    async function loadRecruiterData() {
      try {
        const candidates = await VPApi.getRecruiterCandidates();
        renderCandidates(candidates);
      } catch (e) {
        $('recruiterContent').innerHTML = '<div class="empty-state"><div class="empty-icon">🔒</div><div class="empty-title">Access Denied</div><div class="empty-desc">Recruiter features are available for agency accounts.</div></div>';
      }
    }

    function renderCandidates(candidates) {
      const container = $('recruiterContent');
      if (!candidates || candidates.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-icon">👥</div><div class="empty-title">No candidates yet</div></div>';
        return;
      }

      container.innerHTML = candidates.map(c => `
        <div class="candidate-card" data-id="${c.id}">
          <div class="candidate-avatar">${(c.username || '?')[0].toUpperCase()}</div>
          <div class="candidate-info">
            <div class="candidate-name">${esc(c.username || 'Unknown')}</div>
            <div class="candidate-role">${esc(c.role || '')} at ${esc(c.company || '')}</div>
          </div>
          <div class="candidate-status">
            <span class="badge badge-${statusColor(c.status)}">${esc(c.status || 'Pending')}</span>
          </div>
        </div>
      `).join('');
    }
  }

  /* ──────────────────────────────────────────────────────────── *
   *  Account Page
   * ──────────────────────────────────────────────────────────── */
  function initAccount() {
    if (!VPAuth.requireAuth('m-account.html')) return;

    const user = VPAuth.getUser();
    const profile = getProfile();

    // Fill fields
    if ($('acctEmail')) $('acctEmail').textContent = user?.username || '';
    if ($('acctFirstName')) $('acctFirstName').value = profile.firstName || '';
    if ($('acctLastName')) $('acctLastName').value = profile.lastName || '';
    if ($('acctPhone')) $('acctPhone').value = profile.phoneNumber || '';
    if ($('acctAddress1')) $('acctAddress1').value = profile.addressLine1 || '';
    if ($('acctAddress2')) $('acctAddress2').value = profile.addressLine2 || '';

    // Save profile
    $('saveProfileBtn')?.addEventListener('click', () => {
      const p = getProfile();
      p.firstName = $('acctFirstName').value;
      p.lastName = $('acctLastName').value;
      p.phoneNumber = $('acctPhone').value;
      p.addressLine1 = $('acctAddress1').value;
      p.addressLine2 = $('acctAddress2').value;
      localStorage.setItem('userProfile', JSON.stringify(p));
      toast('Profile saved!', 'success');
    });

    $('logoutBtn')?.addEventListener('click', async () => {
      await VPAuth.logout();
      location.href = 'm-login.html';
    });
  }

  /* ──────────────────────────────────────────────────────────── *
   *  Applications List
   * ──────────────────────────────────────────────────────────── */
  function initApplications() {
    if (!VPAuth.requireAuth('m-applications.html')) return;

    loadApplicationsList();

    async function loadApplicationsList() {
      try {
        const apps = await VPApi.getApplications();
        const container = $('appsList');

        if (!apps || apps.length === 0) {
          container.innerHTML = '<div class="empty-state"><div class="empty-icon">📋</div><div class="empty-title">No applications</div><div class="empty-desc">Start a new application from the dashboard.</div></div>';
          return;
        }

        container.innerHTML = apps.map(app => `
          <div class="card mb-3">
            <div class="card-header">
              <div class="card-title">${esc(app.role || 'Untitled')}</div>
              <span class="badge badge-${statusColor(app.status)}">${esc(app.status || 'Draft')}</span>
            </div>
            <div class="card-body">${esc(app.company || '')} ${app.date ? '· ' + formatDate(app.date) : ''}</div>
            <div class="card-footer">
              <button class="btn btn-sm btn-ghost" data-action="delete" data-id="${app.id}">🗑 Delete</button>
            </div>
          </div>
        `).join('');

        container.querySelectorAll('[data-action="delete"]').forEach(btn => {
          btn.addEventListener('click', async () => {
            if (!confirm('Delete this application?')) return;
            try {
              await VPApi.deleteApplication(btn.dataset.id);
              toast('Deleted', 'success');
              loadApplicationsList();
            } catch (e) { toast(e.message, 'error'); }
          });
        });
      } catch (e) { toast('Failed to load', 'error'); }
    }
  }

  /* ──────────────────────────────────────────────────────────── *
   *  Utilities
   * ──────────────────────────────────────────────────────────── */
  function esc(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /* ──────────────────────────────────────────────────────────── *
   *  Public API
   * ──────────────────────────────────────────────────────────── */
  window.VPApp = {
    initDashboard,
    initJobDetails,
    initGuided,
    initSuggestions,
    initEditor,
    initPreview,
    initQuickApply,
    initLibrary,
    initRecruiter,
    initAccount,
    initApplications,
    toast,
    loadState,
    saveState,
    clearWorkflow
  };
})();
