// Click Cover Letter Creator - Complete Application Logic
(function() {
  'use strict';

  // DOM Elements Cache
  const DOM = {
    // User Profile Elements
    firstName: null,
    lastName: null,
    addressLine1: null,
    addressLine2: null,
    phoneNumber: null,
    emailAddress: null,
    
    // Resume Upload Elements
    resumeUploadArea: null,
    resumeFileInput: null,
    uploadPlaceholder: null,
    resumeStatus: null,
    resumeName: null,
    resumeSize: null,
    removeResumeBtn: null,
    parsingStatus: null,
    
    // Job Information Elements
    roleTitle: null,
    companyName: null,
    contactPerson: null,
    businessAddress: null,
    refNumber: null,

    // Job Ad Paste Elements
    jobAdText: null,
    parseJobAdBtn: null,
    jobAdParseStatus: null,
    overwriteJobFields: null,
    jobAdUrl: null,
    fetchJobAdBtn: null,
    
    // Response Library Elements
    categoryUser: null,
    categoryCrowd: null,
    categoryAi: null,
    newResponseText: null,
    addResponseBtn: null,
    
    // Letter Builder Elements
    letterArea: null,
    newLetterBtn: null,
    saveLetterBtn: null,
    downloadPdfBtn: null,

    // Header/Nav Controls
    dbStatusBadge: null,
    syncResponsesBtn: null,
    themeToggleBtn: null,

    // Preview
    previewLetterBtn: null,
    letterPreview: null
  };

  // Application State
  let appState = {
    profile: {},
    responses: [],
    resume: {
      fileName: null,
      fileSize: null,
      uploadDate: null,
      parsedText: null,
      keywords: [],
      sections: {}
    },
    currentLetter: {
      paragraphs: []
    },
    settings: {
      theme: 'standard'
    }
  };

  // Utility Functions
  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  function sanitizeText(text) {
    return text.trim().replace(/<[^>]*>/g, '');
  }

  function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  function formatDateLongAU(dateObj = new Date()) {
    try {
      const opts = { day: 'numeric', month: 'long', year: 'numeric' };
      return dateObj.toLocaleDateString('en-AU', opts);
    } catch {
      // Fallback
      const d = dateObj.getDate();
      const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
      return `${d} ${months[dateObj.getMonth()]} ${dateObj.getFullYear()}`;
    }
  }
  
  function extractPersonalDetails(text) {
    console.log('Extracting personal details from resume...');
    
    const personalInfo = {
      firstName: '',
      lastName: '',
      fullName: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      postcode: ''
    };

    const fileName = (appState && appState.resume && appState.resume.fileName) ? appState.resume.fileName : '';
    
    // Extract email address
    const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const emailMatch = text.match(emailPattern);
    if (emailMatch) {
      personalInfo.email = emailMatch[0];
      console.log('Found email:', personalInfo.email);
    }
    
    // Extract phone number (various Australian formats)
    const phonePatterns = [
      /\b(?:\+?61|0)\s?[2-9]\s?\d{4}\s?\d{4}\b/g, // Australian mobile/landline
      /\b\(?0[2-9]\)?\s?\d{4}\s?\d{4}\b/g, // Standard Australian format
      /\b\d{2,4}\s?\d{3,4}\s?\d{3,4}\b/g // General phone pattern
    ];
    
    for (const pattern of phonePatterns) {
      const phoneMatch = text.match(pattern);
      if (phoneMatch) {
        personalInfo.phone = phoneMatch[0].replace(/\s+/g, ' ').trim();
        console.log('Found phone:', personalInfo.phone);
        break;
      }
    }
    
    // Extract full name (usually appears near the top of the document)
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    console.log('First 10 lines for name detection:', lines.slice(0, 10));
    
    // 1) Try extracting from header lines (normal case)
    for (let i = 0; i < Math.min(8, lines.length); i++) {
      const line = lines[i];
      
      // Skip lines with email, phone, dates, or job-related keywords
      if (line.includes('@') || 
          /\d{4}\s?\d{4}/.test(line) || 
          /\b\d{4}\b/.test(line) || // Skip years
          /\b(analyst|developer|manager|officer|coordinator|assistant|specialist|consultant|admin|clerk|representative|advisor)\b/i.test(line) ||
          /\b(resume|cv|curriculum|vitae)\b/i.test(line) ||
          line.length > 60) { // Skip very long lines
        console.log('Skipping line (not a name):', line);
        continue;
      }
      
      // Look for a line that looks like a name (2-4 words, proper case, reasonable length)
      const nameMatch = line.match(/^([A-Z][a-z]{2,}(?:\s+[A-Z][a-z]{2,}){1,3})$/);
      if (nameMatch) {
        const fullName = nameMatch[1];
        const nameParts = fullName.split(/\s+/);
        
        // Validate this looks like a real name
        if (nameParts.length >= 2 && nameParts.length <= 4) {
          const blacklist = /\b(the|and|for|with|from|service|desk|pay|ltd|inc|pty)\b/i;
          const validName = nameParts.every(part => part.length >= 2 && !blacklist.test(part));
          if (validName) {
            personalInfo.fullName = fullName;
            personalInfo.firstName = nameParts[0];
            personalInfo.lastName = nameParts[nameParts.length - 1];
            console.log('Found name (proper case):', personalInfo.fullName);
            break;
          }
        }
      }
    }

    // 1b) Try DETECTING SPACED ALL-CAPS (e.g., "A N D R E W   B A I L L I E")
    if (!personalInfo.firstName) {
      for (let i = 0; i < Math.min(10, lines.length); i++) {
        const line = lines[i].trim();
        if (!line) continue;
        // Candidate has many uppercase letters separated by single spaces
        const spacedTokens = line.split(/\s{2,}/); // split on 2+ spaces (word boundaries)
        if (spacedTokens.length >= 2 && spacedTokens.length <= 4) {
          const words = [];
          let valid = true;
          for (const token of spacedTokens) {
            // Token made of single-letter uppercase segments e.g., "A N D R E W"
            if (/^(?:[A-Z](?:\s+[A-Z]){1,})$/.test(token)) {
              const compact = token.replace(/\s+/g, '');
              words.push(compact);
            } else if (/^[A-Z][A-Z\s]+$/.test(token) && token.replace(/\s+/g, '').length >= 2) {
              // Allow general uppercase with spaces
              words.push(token.replace(/\s+/g, ''));
            } else {
              valid = false;
              break;
            }
          }
          if (valid && words.length >= 2) {
            const cap = s => s.charAt(0) + s.slice(1).toLowerCase();
            personalInfo.firstName = cap(words[0].toLowerCase());
            personalInfo.lastName = cap(words[1].toLowerCase());
            personalInfo.fullName = `${personalInfo.firstName} ${personalInfo.lastName}`;
            console.log('Found name (spaced ALL-CAPS):', personalInfo.fullName, 'from line:', line);
            break;
          }
        }
      }
    }

    // 2) If not found, try ALL CAPS names in header (e.g., ANDREW BAILLIE)
    if (!personalInfo.firstName) {
      for (let i = 0; i < Math.min(8, lines.length); i++) {
        const line = lines[i];
        if (/\b(resume|cv|curriculum|vitae)\b/i.test(line)) continue;
        if (line.includes('@') || /\d/.test(line)) continue;
        const capsMatch = line.match(/^([A-Z]{2,}(?:\s+[A-Z]{2,}){1,3})$/);
        if (capsMatch) {
          const fullName = capsMatch[1].toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
          const parts = fullName.split(/\s+/);
          if (parts.length >= 2 && parts.length <= 4) {
            personalInfo.fullName = fullName;
            personalInfo.firstName = parts[0];
            personalInfo.lastName = parts[parts.length - 1];
            console.log('Found name (ALL CAPS):', personalInfo.fullName);
            break;
          }
        }
      }
    }

    // 3) If still not found, try file name (e.g., "Andrew Baillie Resume 2025.docx")
    if (!personalInfo.firstName && fileName) {
      const fileBase = fileName.replace(/\.[^.]+$/, '').replace(/[._-]+/g, ' ').trim();
      console.log('File name base for name detection:', fileBase);
      // Try generic: first two TitleCase words at start
      let m = fileBase.match(/^([A-Z][a-z]+)\s+([A-Z][a-z]+)\b/);
      if (m && !/\b(resume|cv|curriculum|vitae)\b/i.test(m[1])) {
        personalInfo.firstName = m[1];
        personalInfo.lastName = m[2];
        personalInfo.fullName = `${m[1]} ${m[2]}`;
        console.log('Found name (file name start):', personalInfo.fullName);
      } else {
        // Previous specific pattern with trailing markers
        const fileNameMatch = fileBase.match(/([A-Z][a-z]{2,}\s+[A-Z][a-z]{2,})(?=\s+(resume|cv|curriculum|vitae|\d{4}[a-z]*|$))/i);
        if (fileNameMatch) {
          const fullName = fileNameMatch[1].trim();
          const parts = fullName.split(/\s+/);
          personalInfo.fullName = fullName;
          personalInfo.firstName = parts[0];
          personalInfo.lastName = parts[parts.length - 1];
          console.log('Found name (file name pattern):', personalInfo.fullName);
        }
      }
    }

    // 4) If still not found, infer from email local part (e.g., andrew.baillie@...)
    if (!personalInfo.firstName && personalInfo.email) {
      const local = personalInfo.email.split('@')[0];
      const parts = local.split(/[._-]+/).filter(Boolean);
      if (parts.length >= 2) {
        const cap = s => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
        personalInfo.firstName = cap(parts[0]);
        personalInfo.lastName = cap(parts[1]);
        personalInfo.fullName = `${personalInfo.firstName} ${personalInfo.lastName}`;
        console.log('Found name (from email):', personalInfo.fullName);
      }
    }

    // 5) As a last resort, look around contact lines (email/phone) for a preceding name
    if (!personalInfo.firstName) {
      const emailIndex = lines.findIndex(l => personalInfo.email && l.includes(personalInfo.email));
      // Use a lenient phone pattern to locate the line
      const phoneLineRegex = /(\+?\d[\d\s\-().]{7,}\d)/;
      const phoneIndex = lines.findIndex(l => phoneLineRegex.test(l));
      const idx = emailIndex !== -1 ? emailIndex : phoneIndex;
      if (idx > 0) {
        // Check up to two lines above
        for (let i = Math.max(0, idx - 2); i < idx; i++) {
          const cand = lines[i].trim();
          if (!cand || cand.length > 60) continue;
          if (/\d|@/.test(cand)) continue; // no digits or emails
          const m = cand.match(/^([A-Z][a-z]{2,}(?:\s+[A-Z][a-z]{2,}){1,3})$/);
          if (m) {
            const parts = m[1].split(/\s+/);
            const blacklist = /\b(the|and|for|with|from|service|desk|pay|resume|cv|curriculum|vitae)\b/i;
            if (parts.length >= 2 && parts.length <= 4 && parts.every(p => !blacklist.test(p))) {
              personalInfo.fullName = m[1];
              personalInfo.firstName = parts[0];
              personalInfo.lastName = parts[parts.length - 1];
              console.log('Found name (near contact line):', personalInfo.fullName);
              break;
            }
          }
        }
      }
    }
    
    // Extract address (look for Australian address patterns)
    const streetSuffix = '(Street|St|Road|Rd|Avenue|Ave|Lane|Ln|Drive|Dr|Court|Ct|Place|Pl|Boulevard|Blvd|Terrace|Tce|Parade|Pde|Crescent|Cres|Highway|Hwy)';
    const addressPatterns = [
      // Street address with suburb, state, postcode
      new RegExp(`\\b\\d+[\\\w\\s,-]+${streetSuffix}\\b[\\s\\S]*?\\b(?:NSW|VIC|QLD|WA|SA|TAS|NT|ACT)\\s*\\d{4}\\b`, 'gi'),
      // Street address without explicit state
      new RegExp(`\\b\\d+[\\\w\\s,-]+${streetSuffix}\\b`, 'gi'),
      // Just suburb, state, postcode (but not years like 2024)
      /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s*,?\s*(?:NSW|VIC|QLD|WA|SA|TAS|NT|ACT)\s*\d{4}\b/gi
    ];
    
    const looksLikeAddress = (addr) => {
      // must have either a street suffix or a state+postcode
      const hasSuffix = new RegExp(streetSuffix, 'i').test(addr);
      const hasStatePostcode = /\b(NSW|VIC|QLD|WA|SA|TAS|NT|ACT)\s*\d{4}\b/i.test(addr);
      const startsWithYear = /^(19|20)\d{2}\b/.test(addr);
      const containsBiz = /\b(analyst|developer|manager|officer|coordinator|assistant|specialist|consultant|admin|clerk|representative|advisor|engineer|technician|supervisor|director|service|desk|pay|solutions|systems|technologies|ltd|inc|pty|corp|company)\b/i.test(addr);
      return !startsWithYear && !containsBiz && (hasSuffix || hasStatePostcode) && addr.length <= 120;
    };

    for (const pattern of addressPatterns) {
      const addressMatches = text.match(pattern);
      if (addressMatches) {
        for (const addressCandidate of addressMatches) {
          const address = addressCandidate.replace(/\s+/g, ' ').trim();
          if (!looksLikeAddress(address)) {
            console.log('Skipping address candidate (fails validation):', address);
            continue;
          }
          personalInfo.address = address;
          console.log('Found address:', personalInfo.address);
          
          // Try to extract state and postcode separately
          const statePostcodeMatch = address.match(/\b(NSW|VIC|QLD|WA|SA|TAS|NT|ACT)\s*(\d{4})\b/i);
          if (statePostcodeMatch) {
            personalInfo.state = statePostcodeMatch[1];
            personalInfo.postcode = statePostcodeMatch[2];
          }
          
          break;
        }
        if (personalInfo.address) break; // Stop if we found a valid address
      }
    }
    
    // If no full address found, look for just city/suburb
    if (!personalInfo.address) {
      const cityPattern = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s*,\s*(?:NSW|VIC|QLD|WA|SA|TAS|NT|ACT)\b/g;
      const cityMatches = text.match(cityPattern);
      if (cityMatches) {
        for (const cityCandidate of cityMatches) {
          // Skip if it looks like a job title or company reference
          if (
            /\b(analyst|developer|manager|officer|service|desk|pay|ltd|inc|pty)\b/i.test(cityCandidate) ||
            /^(19|20)\d{2}\b/.test(cityCandidate)
          ) {
            console.log('Skipping city candidate (job title):', cityCandidate);
            continue;
          }
          
          personalInfo.city = cityCandidate;
          console.log('Found city:', personalInfo.city);
          break;
        }
      }
    }
    
    // Return the extracted details if we found at least a name or email
    if (personalInfo.firstName || personalInfo.email) {
      return personalInfo;
    }
    
    return null;
  }
  
  function autoFillProfile(personalDetails) {
    console.log('Auto-filling profile with extracted details...');
    
    // Only fill empty fields to avoid overwriting user data
    if (personalDetails.firstName && !DOM.firstName.value) {
      DOM.firstName.value = personalDetails.firstName;
      appState.profile.firstName = personalDetails.firstName;
    }
    
    if (personalDetails.lastName && !DOM.lastName.value) {
      DOM.lastName.value = personalDetails.lastName;
      appState.profile.lastName = personalDetails.lastName;
    }
    
    if (personalDetails.address && !DOM.addressLine1.value) {
      // Split address into two lines if it's long
      const addressText = personalDetails.address;
      if (addressText.length > 50) {
        const midpoint = addressText.indexOf(',', addressText.length / 2);
        if (midpoint > 0) {
          DOM.addressLine1.value = addressText.substring(0, midpoint).trim();
          DOM.addressLine2.value = addressText.substring(midpoint + 1).trim();
          appState.profile.addressLine1 = DOM.addressLine1.value;
          appState.profile.addressLine2 = DOM.addressLine2.value;
        } else {
          DOM.addressLine1.value = addressText;
          appState.profile.addressLine1 = addressText;
        }
      } else {
        DOM.addressLine1.value = addressText;
        appState.profile.addressLine1 = addressText;
      }
    } else if (personalDetails.city && !DOM.addressLine1.value) {
      DOM.addressLine1.value = personalDetails.city;
      appState.profile.addressLine1 = personalDetails.city;
    }
    
    // Save the updated profile
    saveAppState();
    
    // Also auto-fill phone and email if available and empty
    if (personalDetails.phone && DOM.phoneNumber && !DOM.phoneNumber.value) {
      DOM.phoneNumber.value = personalDetails.phone;
      appState.profile.phoneNumber = personalDetails.phone;
    }
    if (personalDetails.email && DOM.emailAddress && !DOM.emailAddress.value) {
      DOM.emailAddress.value = personalDetails.email;
      appState.profile.emailAddress = personalDetails.email;
    }

    // Show a notification to the user
    const extractedInfo = [];
    if (personalDetails.firstName) extractedInfo.push('name');
    if (personalDetails.address || personalDetails.city) extractedInfo.push('address');
    if (personalDetails.email) extractedInfo.push('email');
    if (personalDetails.phone) extractedInfo.push('phone');
    
    if (extractedInfo.length > 0) {
      console.log('Auto-filled profile fields:', extractedInfo.join(', '));
      // Could show a toast notification here in the future
    }
  }

  // Local Storage Management
  async function loadAppState() {
    try {
      const savedProfile = localStorage.getItem('userProfile');
      const savedResponses = localStorage.getItem('responses');
      const savedResume = localStorage.getItem('resumeData');
      const savedSettings = localStorage.getItem('appSettings');
      
      if (savedProfile) {
        appState.profile = JSON.parse(savedProfile);
      }
      
      if (savedResponses) {
        appState.responses = JSON.parse(savedResponses);
      } else {
        // First time - seed with default responses
        seedDefaultResponses();
      }
      
      if (savedResume) {
        appState.resume = JSON.parse(savedResume);
      }

      if (savedSettings) {
        try { appState.settings = JSON.parse(savedSettings); } catch {}
        // defaults
        appState.settings.theme = appState.settings.theme || 'standard';
        appState.settings.pageSize = appState.settings.pageSize || 'letter';
      }

      // Load auth from storage early (for gating)
      try {
        authToken = localStorage.getItem('authToken') || null;
        const rawUser = localStorage.getItem('authUser');
        if (rawUser) appState.authUser = JSON.parse(rawUser);
      } catch {}

      // Sync with backend: try to load all responses from DB.
      try {
        const dbResponses = await apiGetResponsesAll();
        if (dbResponses && dbResponses.length) {
          appState.responses = dbResponses.map(r => ({
            id: r.id,
            text: r.text,
            category: r.category || 'user',
            userCreated: !!r.userCreated,
            source: r.source || null,
            tags: r.tags || []
          }));
          // Cache to localStorage as well
          localStorage.setItem('responses', JSON.stringify(appState.responses));
        } else {
          // DB empty: seed it with current in-memory responses
          await persistAllResponsesToDb(appState.responses || []);
        }
      } catch (e) {
        // Backend offline - continue using local storage
        console.warn('Responses DB not available, using local storage cache.');
      }
    } catch (error) {
      console.error('Error loading app state:', error);
      seedDefaultResponses();
    }
  }

  function saveAppState() {
    try {
      localStorage.setItem('userProfile', JSON.stringify(appState.profile));
      localStorage.setItem('responses', JSON.stringify(appState.responses));
        // Load auth from storage
        try {
          authToken = localStorage.getItem('authToken') || null;
          const rawUser = localStorage.getItem('authUser');
          if (rawUser) appState.authUser = JSON.parse(rawUser);
        } catch {}
      localStorage.setItem('resumeData', JSON.stringify(appState.resume));
      localStorage.setItem('appSettings', JSON.stringify(appState.settings || { theme: 'standard', pageSize: 'letter' }));
    } catch (error) {
      console.error('Error saving app state:', error);
      alert('Unable to save data. Storage may be full.');
    }
  }

  function seedDefaultResponses() {
    const defaultResponses = [
      // Crowd Sourced
      { id: 'crowd1', text: 'I am writing to express my strong interest in the position at your company. With my background and experience, I believe I would be a valuable addition to your team.', category: 'crowd', userCreated: false },
      { id: 'crowd2', text: 'Having researched your company extensively, I am impressed by your commitment to innovation and excellence. I am excited about the opportunity to contribute to your continued success.', category: 'crowd', userCreated: false },
      { id: 'crowd3', text: 'My experience in the field has equipped me with the skills and knowledge necessary to excel in this role. I am confident that my background aligns well with your requirements.', category: 'crowd', userCreated: false },
      { id: 'crowd4', text: 'I am particularly drawn to this opportunity because it combines my passion for the industry with the chance to work for a company that shares my values and vision.', category: 'crowd', userCreated: false },
      { id: 'crowd5', text: 'Thank you for considering my application. I look forward to the opportunity to discuss how my skills and experience can contribute to your team\'s success.', category: 'crowd', userCreated: false },
      
      // AI Generated
      { id: 'ai1', text: 'As a results-driven professional with a proven track record of success, I am excited to bring my expertise to your dynamic organization and contribute to achieving your strategic objectives.', category: 'ai', userCreated: false },
      { id: 'ai2', text: 'Your company\'s reputation for fostering innovation and professional growth aligns perfectly with my career aspirations, making this an ideal opportunity for mutual benefit.', category: 'ai', userCreated: false },
      { id: 'ai3', text: 'Throughout my career, I have consistently demonstrated the ability to adapt to new challenges while maintaining high standards of quality and efficiency in all my endeavors.', category: 'ai', userCreated: false },
      { id: 'ai4', text: 'I am particularly excited about the prospect of joining a team that values collaboration, creativity, and continuous improvement, as these principles have guided my professional journey.', category: 'ai', userCreated: false },
      { id: 'ai5', text: 'I would welcome the opportunity to discuss how my unique perspective and experience can contribute to your organization\'s continued growth and success in the marketplace.', category: 'ai', userCreated: false }
    ];
    
    appState.responses = defaultResponses;
    saveAppState();
  }

  // Profile Management
  function toTitleCase(s) {
    return s.replace(/([A-Za-z\u00C0-\u024F][^\s-]*)/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
  }

  // Replace placeholders like [Role Title], {Company Name}, etc. with current job input field values
  function replacePlaceholders(text) {
    const val = s => sanitizeText((s || '').toString());
    const fields = {
      // Role
      'role title': val(DOM.roleTitle?.value),
      'role':        val(DOM.roleTitle?.value),
      'position':    val(DOM.roleTitle?.value),
      // Company
      'company name': val(DOM.companyName?.value),
      'company':      val(DOM.companyName?.value),
      'employer':     val(DOM.companyName?.value),
      // Contact
      'contact':       val(DOM.contactPerson?.value),
      'contact name':  val(DOM.contactPerson?.value),
      // Reference
      'ref':              val(DOM.refNumber?.value),
      'reference':        val(DOM.refNumber?.value),
      'reference number': val(DOM.refNumber?.value),
      'ref number':       val(DOM.refNumber?.value),
      // Address
      'business address': val(DOM.businessAddress?.value),
      'address':          val(DOM.businessAddress?.value),
      // Industry (extracted from job ad or manually entered)
      'industry':         '',  // Can be populated from job ad parsing
      // User contact details
      'phone':            val(DOM.phoneNumber?.value),
      'phone number':     val(DOM.phoneNumber?.value),
      'email':            val(DOM.emailAddress?.value),
      'email address':    val(DOM.emailAddress?.value)
    };
    return (text || '').replace(/[\[{]([^}\]]+)[}\]]/g, (m, rawKey) => {
      const k = rawKey.trim().toLowerCase();
      const v = fields[k];
      return v && v.length ? v : m;
    });
  }

  // Backend API (local) for persisting user responses
  const API_BASE = 'http://localhost:5050';
  let authToken = null;
  const API_TIMEOUT_MS = 3000;
  let apiHealthy = null; // null=unknown, true=ok, false=down

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

  async function apiGetResponsesAll() {
    const healthy = await apiHealthCheck();
    if (!healthy) throw new Error('API offline');
    const r = await fetchWithTimeout(`${API_BASE}/responses`, { headers: apiHeaders() });
    if (!r.ok) throw new Error(`GET failed ${r.status}`);
    const list = await r.json();
    return Array.isArray(list) ? list : [];
  }

  async function apiCreateResponse(resp) {
    const healthy = await apiHealthCheck();
    if (!healthy) throw new Error('API offline');
    const r = await fetchWithTimeout(`${API_BASE}/responses`, {
      method: 'POST',
      headers: apiHeaders(),
      body: JSON.stringify(resp)
    });
    if (!r.ok) throw new Error(`POST failed ${r.status}`);
    return await r.json();
  }

  async function apiUpdateResponse(resp) {
    const healthy = await apiHealthCheck();
    if (!healthy) throw new Error('API offline');
    const r = await fetchWithTimeout(`${API_BASE}/responses/${encodeURIComponent(resp.id)}`, {
      method: 'PUT',
      headers: apiHeaders(),
      body: JSON.stringify(resp)
    });
    if (!r.ok) throw new Error(`PUT failed ${r.status}`);
    return await r.json();
  }

  async function apiDeleteResponse(id) {
    const healthy = await apiHealthCheck();
    if (!healthy) throw new Error('API offline');
    const r = await fetchWithTimeout(`${API_BASE}/responses/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: apiHeaders()
    });
    if (!r.ok) throw new Error(`DELETE failed ${r.status}`);
    return true;
  }

  // UI helpers
  async function updateDbStatusBadge() {
    if (!DOM.dbStatusBadge) return;
    const badge = DOM.dbStatusBadge;
    badge.textContent = 'Checking…';
    badge.classList.remove('online','offline');
    try {
      const ok = await apiHealthCheck();
      if (ok) {
        badge.textContent = 'DB Online';
        badge.classList.add('online');
        badge.classList.remove('offline');
      } else {
        badge.textContent = 'DB Offline';
        badge.classList.add('offline');
        badge.classList.remove('online');
      }
    } catch {
      badge.textContent = 'DB Offline';
      badge.classList.add('offline');
      badge.classList.remove('online');
    }
  }

  async function apiRegister(username, password) {
    const r = await fetchWithTimeout(`${API_BASE}/auth/register`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password })
    });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  }
  async function apiLogin(username, password) {
    const r = await fetchWithTimeout(`${API_BASE}/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password })
    });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  }
  async function apiLogout() {
    if (!authToken) return;
    try { await fetchWithTimeout(`${API_BASE}/auth/logout`, { method: 'POST', headers: apiHeaders() }); } catch {}
  }

  async function syncResponsesFromDb() {
    try {
      const list = await apiGetResponsesAll();
      if (Array.isArray(list)) {
        appState.responses = list.map(r => ({
          id: r.id,
          text: r.text,
          category: r.category || 'user',
          userCreated: !!r.userCreated,
          source: r.source || null
        }));
        localStorage.setItem('responses', JSON.stringify(appState.responses));
        renderResponses();
      }
    } catch (e) {
      alert('Unable to sync from database. Is the server running?');
    }
  }

  // Theme toggle
  function initializeTheme() {
    try {
      const pref = localStorage.getItem('theme');
      if (pref === 'dark') {
        document.body.classList.add('theme-dark');
        if (DOM.themeToggleBtn) DOM.themeToggleBtn.textContent = '☀️';
      }
    } catch {}
  }

  function toggleTheme() {
    const dark = document.body.classList.toggle('theme-dark');
    try { localStorage.setItem('theme', dark ? 'dark' : 'light'); } catch {}
    if (DOM.themeToggleBtn) DOM.themeToggleBtn.textContent = dark ? '☀️' : '🌙';
  }

  async function persistAllResponsesToDb(responses) {
    try {
      const healthy = await apiHealthCheck();
      if (!healthy) throw new Error('API offline');
    } catch {
      return; // Silently skip if API down
    }
    for (const resp of responses) {
      try {
        await apiCreateResponse(resp);
      } catch (e) {
        // Ignore duplicates, log others
        if (!String(e.message || '').includes('409')) {
          console.warn('Persist create failed for', resp.id, e.message || e);
        }
      }
    }
  }

  function loadUserProfile() {
    if (DOM.firstName) DOM.firstName.value = appState.profile.firstName || '';
    if (DOM.lastName) DOM.lastName.value = appState.profile.lastName || '';
    if (DOM.addressLine1) DOM.addressLine1.value = appState.profile.addressLine1 || '';
    if (DOM.addressLine2) DOM.addressLine2.value = appState.profile.addressLine2 || '';
    if (DOM.phoneNumber) DOM.phoneNumber.value = appState.profile.phoneNumber || '';
    if (DOM.emailAddress) DOM.emailAddress.value = appState.profile.emailAddress || '';
  }

  function saveUserProfile() {
    appState.profile = {
      firstName: sanitizeText(DOM.firstName?.value || ''),
      lastName: sanitizeText(DOM.lastName?.value || ''),
      addressLine1: sanitizeText(DOM.addressLine1?.value || ''),
      addressLine2: sanitizeText(DOM.addressLine2?.value || ''),
      phoneNumber: sanitizeText(DOM.phoneNumber?.value || ''),
      emailAddress: sanitizeText(DOM.emailAddress?.value || '')
    };
    saveAppState();
  }

  // Resume Management Functions
  let pdfLibLoaded = false;
  let pdfLibLoading = false;
  
  function loadPdfLibrary() {
    if (pdfLibLoaded || pdfLibLoading) {
      return Promise.resolve();
    }
    
    pdfLibLoading = true;
    
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      script.onload = () => {
        // Set up worker
        if (typeof pdfjsLib !== 'undefined') {
          pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
          pdfLibLoaded = true;
          pdfLibLoading = false;
          resolve();
        } else {
          pdfLibLoading = false;
          reject(new Error('PDF.js failed to load'));
        }
      };
      script.onerror = () => {
        pdfLibLoading = false;
        reject(new Error('Failed to load PDF.js library'));
      };
      document.head.appendChild(script);
    });
  }
  
  function setupResumeUpload() {
    // If resume UI not present (e.g., on letter page), skip
    if (!DOM.resumeUploadArea || !DOM.resumeFileInput) return;

    // Click to upload
    DOM.resumeUploadArea.addEventListener('click', () => {
      DOM.resumeFileInput.click();
    });

    // File input change
    DOM.resumeFileInput.addEventListener('change', handleFileSelect);

    // Drag and drop events
    DOM.resumeUploadArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      DOM.resumeUploadArea.classList.add('drag-over');
    });

    DOM.resumeUploadArea.addEventListener('dragleave', (e) => {
      e.preventDefault();
      DOM.resumeUploadArea.classList.remove('drag-over');
    });

    DOM.resumeUploadArea.addEventListener('drop', (e) => {
      e.preventDefault();
      DOM.resumeUploadArea.classList.remove('drag-over');
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFileSelect({ target: { files: files } });
      }
    });

    // Remove resume button
    if (DOM.removeResumeBtn) DOM.removeResumeBtn.addEventListener('click', removeResume);
  }

  function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['.pdf', '.doc', '.docx', '.txt'];
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    
    if (!allowedTypes.includes(fileExtension)) {
      alert('Please select a PDF, DOC, DOCX, or TXT file.');
      return;
    }

    // Validate file size (different limits for different types)
    let maxSize;
    if (fileExtension === '.pdf') {
      maxSize = 5 * 1024 * 1024; // 5MB for PDFs (they're slower to process)
    } else {
      maxSize = 10 * 1024 * 1024; // 10MB for other formats
    }
    
    if (file.size > maxSize) {
      const maxSizeMB = Math.round(maxSize / (1024 * 1024));
      alert(`File size must be less than ${maxSizeMB}MB for ${fileExtension.toUpperCase()} files.`);
      return;
    }

    uploadResume(file);
  }

  function uploadResume(file) {
    // Update UI to show upload in progress
    showResumeStatus(file);
    setParsingStatus('processing', 'Preparing to process resume...');

    // Store file info
    appState.resume.fileName = file.name;
    appState.resume.fileSize = file.size;
    appState.resume.uploadDate = new Date().toISOString();

    // Parse the file based on type
    const fileExtension = file.name.split('.').pop().toLowerCase();
    
    if (fileExtension === 'txt') {
      setParsingStatus('processing', 'Processing text file...');
      parseTextFile(file);
    } else if (fileExtension === 'pdf') {
      setParsingStatus('processing', 'Loading PDF processor...');
      loadPdfLibrary()
        .then(() => {
          setParsingStatus('processing', 'Processing PDF file...');
          parsePDF(file);
        })
        .catch((error) => {
          console.error('Error loading PDF library:', error);
          setParsingStatus('error', 'Failed to load PDF processor. Please try uploading as a text file or Word document.');
        });
    } else if (fileExtension === 'doc' || fileExtension === 'docx') {
      setParsingStatus('processing', 'Processing Word document...');
      parseWordDocument(file);
    }
  }

  function parsePDF(file) {
    const fileReader = new FileReader();
    
    fileReader.onload = function(event) {
      try {
        const typedarray = new Uint8Array(event.target.result);
        
        if (typeof pdfjsLib === 'undefined') {
          setParsingStatus('error', 'PDF parsing library not loaded.');
          return;
        }

        // Set timeout for PDF processing
        const processingTimeout = setTimeout(() => {
          setParsingStatus('error', 'PDF processing timed out. Please try a smaller file or convert to Word document.');
        }, 30000); // 30 second timeout

        pdfjsLib.getDocument({ data: typedarray, verbosity: 0 }).promise.then(function(pdf) {
          clearTimeout(processingTimeout);
          let textContent = '';
          let pagesProcessed = 0;
          const totalPages = Math.min(pdf.numPages, 10); // Limit to first 10 pages for performance
          
          if (totalPages > 5) {
            setParsingStatus('processing', `Processing large PDF (${totalPages} pages)... this may take a moment.`);
          }

          // Process pages sequentially to avoid overwhelming the browser
          processPageSequentially(pdf, 1, totalPages, textContent, (finalText) => {
            finishResumeProcessing(finalText);
          });
          
        }).catch(function(error) {
          clearTimeout(processingTimeout);
          console.error('Error parsing PDF:', error);
          setParsingStatus('error', `Failed to parse PDF: ${error.message}. Try converting to Word document or reduce file size.`);
        });
      } catch (error) {
        console.error('Error reading PDF file:', error);
        setParsingStatus('error', 'Error reading PDF file. Please try a different file format.');
      }
    };

    fileReader.onerror = function() {
      setParsingStatus('error', 'Failed to read file. Please try again.');
    };

    fileReader.readAsArrayBuffer(file);
  }
  
  function processPageSequentially(pdf, pageNum, totalPages, textContent, callback) {
    if (pageNum > totalPages) {
      callback(textContent);
      return;
    }
    
    setParsingStatus('processing', `Processing page ${pageNum} of ${totalPages}...`);
    
    pdf.getPage(pageNum).then(function(page) {
      page.getTextContent().then(function(content) {
        const pageText = content.items.map(item => item.str).join(' ');
        textContent += pageText + '\n';
        
        // Small delay to prevent browser freezing
        setTimeout(() => {
          processPageSequentially(pdf, pageNum + 1, totalPages, textContent, callback);
        }, 100);
      }).catch(function(error) {
        console.warn(`Error processing page ${pageNum}:`, error);
        // Continue with next page even if one fails
        setTimeout(() => {
          processPageSequentially(pdf, pageNum + 1, totalPages, textContent, callback);
        }, 100);
      });
    }).catch(function(error) {
      console.warn(`Error loading page ${pageNum}:`, error);
      // Continue with next page even if one fails
      setTimeout(() => {
        processPageSequentially(pdf, pageNum + 1, totalPages, textContent, callback);
      }, 100);
    });
  }

  function parseTextFile(file) {
    const fileReader = new FileReader();
    
    fileReader.onload = function(event) {
      try {
        const text = event.target.result;
        setParsingStatus('processing', 'Analyzing resume content...');
        
        // Small delay to show processing status
        setTimeout(() => {
          finishResumeProcessing(text);
        }, 500);
      } catch (error) {
        console.error('Error parsing text file:', error);
        setParsingStatus('error', 'Failed to parse text file.');
      }
    };

    fileReader.onerror = function() {
      setParsingStatus('error', 'Failed to read text file.');
    };

    fileReader.readAsText(file, 'UTF-8');
  }

  function parseWordDocument(file) {
    console.log('Parsing Word document:', file.name, 'Size:', file.size, 'Type:', file.type);
    
    const fileExtension = file.name.split('.').pop().toLowerCase();
    
    // Check if it's a newer .docx file (should work with mammoth.js)
    if (fileExtension === 'docx' && typeof mammoth !== 'undefined') {
      setParsingStatus('processing', 'Parsing DOCX file with mammoth.js...');
      
      // Convert file to ArrayBuffer for mammoth.js
      const reader = new FileReader();
      reader.onload = function(event) {
        const arrayBuffer = event.target.result;
        
        // In parallel: use mammoth and low-level XML extraction (captures shapes/headers)
        Promise.all([
          mammoth.extractRawText({arrayBuffer: arrayBuffer}).then(res => res.value).catch(() => ''),
          extractDocxXmlText(arrayBuffer).catch(() => '')
        ]).then(([mammothText, xmlText]) => {
          const combined = [mammothText || '', xmlText || ''].join('\n');
          console.log('Combined DOCX text length:', combined.length);
          if ((mammothText?.length || 0) < 20 && (xmlText?.length || 0) < 20) {
            throw new Error('Very little text extracted');
          }
          finishResumeProcessing(combined);
        }).catch(function(error) {
          console.error('DOCX parsing failed or insufficient:', error);
          // Fallback to basic parsing
          parseWordDocumentFallback(file);
        });
      };
      reader.onerror = function() {
        console.error('Failed to read file as ArrayBuffer');
        parseWordDocumentFallback(file);
      };
      reader.readAsArrayBuffer(file);
    } else {
      // For .doc files or when mammoth.js fails, use fallback method
      console.log('Using fallback method for .doc file or mammoth.js unavailable');
      parseWordDocumentFallback(file);
    }
  }

  async function extractDocxXmlText(arrayBuffer) {
    // Ensure JSZip is available
    if (typeof JSZip === 'undefined') {
      await loadJsZip();
    }
    const zip = await JSZip.loadAsync(arrayBuffer);
    const xmlFiles = Object.keys(zip.files).filter(name => name.startsWith('word/') && name.endsWith('.xml'));
    const xmlStrings = await Promise.all(xmlFiles.map(name => zip.file(name).async('string')));
    let textParts = [];
    const decodeXml = (s) => s
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'");
    const tokenRegex = /<(?:w|a):t[^>]*>([\s\S]*?)<\/(?:w|a):t>/gim;
    for (const xml of xmlStrings) {
      let m;
      while ((m = tokenRegex.exec(xml)) !== null) {
        const val = decodeXml(m[1]);
        if (val && val.trim()) textParts.push(val.trim());
      }
    }
    return textParts.join(' ');
  }

  function loadJsZip() {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load JSZip'));
      document.head.appendChild(script);
    });
  }
  
  function parseWordDocumentFallback(file) {
    setParsingStatus('processing', 'Using alternative Word document parsing...');
    
    const fileReader = new FileReader();
    
    fileReader.onload = function(event) {
      try {
        let text = event.target.result;
        console.log('Raw document text length:', text.length);
        
        // Advanced cleaning for Word document text
        text = cleanWordDocumentText(text);
        
        console.log('Cleaned text length:', text.length);
        console.log('Cleaned sample:', text.substring(0, 300));
        
        if (text.length < 20) {
          setParsingStatus('error', 'Could not extract readable text from Word document. Please copy your resume text and save as a .txt file for best results.');
          return;
        }
        
        finishResumeProcessing(text);
      } catch (error) {
        console.error('Error in fallback Word parsing:', error);
        setParsingStatus('error', 'Failed to parse Word document. Please copy your resume text and save as .txt file, or try PDF format.');
      }
    };

    fileReader.onerror = function() {
      setParsingStatus('error', 'Failed to read Word document file.');
    };

    fileReader.readAsText(file, 'UTF-8');
  }
  
  function cleanWordDocumentText(rawText) {
    let text = rawText;
    
    // Remove control characters and binary data
    text = text.replace(/[\x00-\x1F\x7F-\xFF]/g, ' ');
    
    // Remove Word-specific artifacts
    text = text.replace(/Microsoft\s*Word|Office|Times New Roman|Calibri|Arial|Verdana/gi, '');
    text = text.replace(/Normal|Heading\d*|Title|Header|Footer/gi, '');
    
    // Remove common Word metadata
    text = text.replace(/\\[a-z]+\d*\s*/gi, ' '); // RTF codes
    text = text.replace(/[{}\\]/g, ' '); // RTF brackets
    
    // Keep only letters, numbers, and basic punctuation
    text = text.replace(/[^\w\s\.\,\;\:\!\?\-\'\"\(\)]/g, ' ');
    
    // Clean up spacing
    text = text.replace(/\s+/g, ' ').trim();
    
    // Remove very short words that are likely artifacts
    const words = text.split(' ');
    const cleanWords = words.filter(word => {
      // Keep words 3+ characters, or common short words
      const shortWords = ['a', 'an', 'at', 'be', 'by', 'do', 'go', 'he', 'if', 'in', 'is', 'it', 'me', 'my', 'no', 'of', 'on', 'or', 'so', 'to', 'up', 'we', 'am', 'as', 'us'];
      return word.length >= 3 || shortWords.includes(word.toLowerCase());
    });
    
    return cleanWords.join(' ');
  }

  function finishResumeProcessing(text) {
    // Clean and store the parsed text
    const cleanedText = sanitizeText(text);
    appState.resume.parsedText = cleanedText;
    
    // Debug logging
    console.log('Parsed text length:', cleanedText.length);
    console.log('First 500 characters:', cleanedText.substring(0, 500));
    
    // Extract personal details and auto-fill profile
    const personalDetails = extractPersonalDetails(cleanedText);
    if (personalDetails) {
      autoFillProfile(personalDetails);
    }
    
    // Extract keywords and sections
    appState.resume.keywords = extractKeywords(cleanedText);
    appState.resume.sections = extractSections(cleanedText);
    
    console.log('Extracted keywords:', appState.resume.keywords);
    console.log('Extracted sections:', Object.keys(appState.resume.sections));
    console.log('Extracted personal details:', personalDetails);
    
    // Save to localStorage
    saveAppState();
    
    // Update UI with more detailed information
    let statusMessage = appState.resume.keywords.length > 0 
      ? `Resume parsed successfully! Found ${appState.resume.keywords.length} key skills and qualifications: ${appState.resume.keywords.slice(0, 5).join(', ')}${appState.resume.keywords.length > 5 ? '...' : ''}`
      : `Resume parsed (${Math.round(cleanedText.length/1000)}k characters). Check console for debug info. Keywords may not have been detected - try TXT format for better parsing.`;
    
    // Add auto-fill notification if we extracted personal details
    if (personalDetails) {
      const extractedInfo = [];
      if (personalDetails.firstName) extractedInfo.push('name');
      if (personalDetails.address || personalDetails.city) extractedInfo.push('address');
      if (personalDetails.email) extractedInfo.push('email');
      if (personalDetails.phone) extractedInfo.push('phone');
      
      if (extractedInfo.length > 0) {
        statusMessage += ` Auto-filled profile: ${extractedInfo.join(', ')}.`;
      }
    }
    
    setParsingStatus('success', statusMessage);
    
    // Generate AI responses based on resume
    generateResumeBasedResponses();
  }

  function extractKeywords(text) {
    const keywords = new Set();
    const lowerText = text.toLowerCase();
    
    console.log('Extracting keywords from clean text, length:', text.length);
    console.log('Sample text:', text.substring(0, 300));
    
    // Healthcare & Social Services Skills
    const healthcareSkills = [
      'disability support', 'personal care', 'medication management', 'first aid',
      'mental health', 'aged care', 'community support', 'behavioral support',
      'ndis', 'therapeutic', 'rehabilitation', 'physiotherapy', 'occupational therapy',
      'nursing', 'healthcare', 'patient care', 'clinical', 'medical', 'wellness',
      'counseling', 'psychology', 'social work', 'case management', 'advocacy',
      'crisis intervention', 'risk assessment', 'care planning', 'documentation'
    ];
    
    // Education & Training Skills
    const educationSkills = [
      'teaching', 'tutoring', 'curriculum', 'lesson planning', 'assessment',
      'classroom management', 'special needs', 'early childhood', 'adult education',
      'training delivery', 'workshop facilitation', 'mentoring', 'coaching'
    ];
    
    // Business & Professional Skills
    const businessSkills = [
      'customer service', 'sales', 'marketing', 'accounting', 'bookkeeping',
      'human resources', 'recruitment', 'payroll', 'administration', 'reception',
      'data entry', 'scheduling', 'inventory', 'logistics', 'procurement',
      'project management', 'team leadership', 'supervision', 'quality assurance'
    ];
    
    // Technical Skills (IT & Engineering)
    const technicalSkills = [
      'javascript', 'python', 'java', 'php', 'ruby', 'html', 'css', 'sql',
      'react', 'angular', 'vue', 'docker', 'kubernetes', 'aws', 'azure',
      'linux', 'windows', 'excel', 'powerbi', 'tableau', 'salesforce',
      'engineering', 'mechanical', 'electrical', 'civil', 'software development'
    ];
    
    // Trades & Manual Skills
    const tradesSkills = [
      'carpentry', 'plumbing', 'electrical work', 'welding', 'construction',
      'maintenance', 'repair', 'installation', 'fabrication', 'machining',
      'automotive', 'landscaping', 'gardening', 'cleaning', 'security',
      'forklift', 'crane operation', 'heavy machinery', 'safety procedures'
    ];
    
    // Hospitality & Service Skills
    const hospitalitySkills = [
      'food service', 'cooking', 'kitchen management', 'barista', 'waitressing',
      'hotel management', 'housekeeping', 'event planning', 'catering',
      'retail', 'cashier', 'stock management', 'visual merchandising'
    ];
    
    // Creative & Media Skills
    const creativeSkills = [
      'graphic design', 'photography', 'videography', 'writing', 'editing',
      'social media', 'content creation', 'marketing campaigns', 'branding',
      'web design', 'illustration', 'animation'
    ];
    
    // Transport & Logistics Skills
    const transportSkills = [
      'driving', 'delivery', 'logistics', 'warehousing', 'dispatch',
      'fleet management', 'route planning', 'freight', 'shipping'
    ];
    
    // All professional skills combined
    const allSkills = [
      ...healthcareSkills,
      ...educationSkills, 
      ...businessSkills,
      ...technicalSkills,
      ...tradesSkills,
      ...hospitalitySkills,
      ...creativeSkills,
      ...transportSkills
    ];
    
    // Soft Skills & General Competencies
    const softSkills = [
      'communication', 'teamwork', 'leadership', 'problem solving', 'adaptability',
      'time management', 'organization', 'attention to detail', 'reliability',
      'initiative', 'creativity', 'flexibility', 'empathy', 'patience',
      'cultural awareness', 'conflict resolution', 'decision making'
    ];
    
    // Education & Certifications (All Fields)
    const educationTerms = [
      'bachelor', 'master', 'doctorate', 'degree', 'diploma', 'certificate',
      'certification', 'certified', 'licensed', 'accredited', 'qualification',
      'training', 'course', 'workshop', 'apprenticeship', 'trade qualification',
      'rto', 'tafe', 'university', 'college', 'professional development'
    ];
    
    // Industry Certifications & Licenses
    const certifications = [
      'first aid', 'cpr', 'working with children check', 'police check',
      'drivers license', 'forklift license', 'white card', 'blue card',
      'rsa', 'rcg', 'food safety', 'whs', 'occupational health and safety',
      'manual handling', 'disability worker screening', 'ndis worker screening'
    ];
    
    // Use word boundaries for better matching
    function findSkillWithBoundary(skill, text) {
      const regex = new RegExp(`\\b${skill}\\b`, 'i');
      return regex.test(text);
    }
    
    // Create a whitelist of all valid skills
    const validSkillsSet = new Set([
      ...allSkills,
      ...softSkills,
      ...educationTerms,
      ...certifications
    ]);
    
    // Check for all professional skills with word boundaries
    allSkills.forEach(skill => {
      if (findSkillWithBoundary(skill, text)) {
        keywords.add(skill);
      }
    });
    
    // Special cases for commonly abbreviated skills
    const specialSkills = {
      'sql': /\bsql\b/i,
      'aws': /\baws\b|amazon web services/i,
      'azure': /\bazure\b|microsoft azure/i,
      'gcp': /\bgcp\b|google cloud/i,
      'git': /\bgit\b(?!hub)/i, // Git but not GitHub
      'ai': /\bartificial intelligence\b|\bai\b/i,
      'ml': /\bmachine learning\b|\bml\b/i,
      'api': /\bapi\b|application programming interface/i,
      'ui': /\bui\b|user interface/i,
      'ux': /\bux\b|user experience/i
    };
    
    Object.entries(specialSkills).forEach(([skill, pattern]) => {
      if (pattern.test(text)) {
        keywords.add(skill);
      }
    });
    
    // Check for soft skills
    softSkills.forEach(skill => {
      if (findSkillWithBoundary(skill, text)) {
        keywords.add(skill);
      }
    });
    
    // Check for education terms
    educationTerms.forEach(term => {
      if (findSkillWithBoundary(term, text)) {
        keywords.add(term);
      }
    });
    
    // Check for certifications and licenses
    certifications.forEach(cert => {
      if (findSkillWithBoundary(cert, text)) {
        keywords.add(cert);
      }
    });
    
    // Extract years of experience
    const experienceMatches = text.match(/(\d+)\+?\s*years?\s*(?:of\s*)?(?:experience|exp)/gi);
    if (experienceMatches) {
      experienceMatches.forEach(match => {
        const cleanMatch = match.toLowerCase().replace(/\s+/g, ' ').trim();
        keywords.add(cleanMatch);
      });
    }
    
    // Extract action verbs for all professions
    const actionVerbs = [
      // Management & Leadership
      'managed', 'led', 'supervised', 'coordinated', 'organized', 'directed',
      'oversaw', 'administered', 'facilitated', 'guided', 'mentored', 'coached',
      
      // Healthcare & Care
      'assisted', 'supported', 'cared', 'treated', 'assessed', 'monitored',
      'administered', 'documented', 'advocated', 'counseled', 'rehabilitated',
      
      // General Professional
      'developed', 'created', 'implemented', 'designed', 'built', 'established',
      'achieved', 'improved', 'increased', 'reduced', 'optimized', 'delivered',
      'collaborated', 'communicated', 'presented', 'negotiated', 'resolved',
      
      // Service & Customer Focus
      'served', 'helped', 'provided', 'maintained', 'operated', 'performed',
      'processed', 'handled', 'resolved', 'responded', 'delivered'
    ];
    
    actionVerbs.forEach(verb => {
      if (findSkillWithBoundary(verb, text)) {
        keywords.add(verb);
      }
    });
    
    // Extract meaningful capitalized terms (companies, technologies, certifications)
    const meaningfulCapitalizedWords = text.match(/\b[A-Z][a-zA-Z]{2,}(?:\s+[A-Z][a-zA-Z]+)*\b/g);
    if (meaningfulCapitalizedWords) {
      meaningfulCapitalizedWords.forEach(word => {
        const cleanWord = word.toLowerCase().trim();
        // Only add if it's not a common word and has substance
        if (cleanWord.length >= 4 && 
            !['this', 'that', 'with', 'from', 'have', 'been', 'will', 'would', 'could', 'should'].includes(cleanWord) &&
            !cleanWord.match(/^[a-z]{1,2}$/)) { // Avoid single/double letters
          keywords.add(cleanWord);
        }
      });
    }
    
    // Strong filtering: Only accept known skills or valid English words
    const filteredKeywords = Array.from(keywords).filter(keyword => {
      const cleanKeyword = keyword.toLowerCase().trim();
      
      // First priority: Is it a known skill from our lists?
      if (validSkillsSet.has(cleanKeyword)) {
        return true;
      }
      
      // Second priority: Is it a valid experience phrase?
      if (cleanKeyword.match(/\d+\s*years?\s*(of\s*)?(experience|exp)/i)) {
        return true;
      }
      
      // Must be at least 4 characters for unknown words
      if (cleanKeyword.length < 4) {
        return false;
      }
      
      // Check for reasonable English word patterns
      const vowelCount = (cleanKeyword.match(/[aeiou]/g) || []).length;
      const consonantCount = cleanKeyword.length - vowelCount - (cleanKeyword.match(/[\s-]/g) || []).length;
      
      // Must have vowels (unless it's a short acronym)
      if (vowelCount === 0) {
        return false;
      }
      
      // Reject if mostly consonants (likely garbled Word doc text)
      if (consonantCount > vowelCount * 3) {
        return false;
      }
      
      // Reject obvious garbled patterns
      if (cleanKeyword.match(/^[bcdfghjklmnpqrstvwxyz]{4,}$|[qxz]{2,}|[bcdfghjklmnpqrstvwxyz]{5,}/)) {
        return false;
      }
      
      // Reject pure numbers or weird character combos
      if (cleanKeyword.match(/^\d+$|^[\d\s]+$|^[^a-zA-Z\s]+$|[^a-zA-Z\s]{2,}/)) {
        return false;
      }
      
      // For unknown words, be very strict
      // Only accept if it looks like a real English word (good vowel/consonant ratio)
      return vowelCount > 0 && consonantCount <= vowelCount * 2 && cleanKeyword.length <= 15;
    });
    
    // Sort by length and meaningfulness (longer phrases first, then known skills)
    const sortedKeywords = filteredKeywords.sort((a, b) => {
      // Prioritize phrases with spaces
      if (a.includes(' ') && !b.includes(' ')) return -1;
      if (!a.includes(' ') && b.includes(' ')) return 1;
      
      // Then by length (longer first)
      return b.length - a.length;
    });
    
    return sortedKeywords.slice(0, 20); // Top 20 meaningful keywords
  }

  function extractSections(text) {
    // Try to identify common resume sections
    const sections = {};
    
    // Look for education section
    const educationMatch = text.match(/education([\s\S]*?)(?=experience|work|employment|skills|projects|$)/i);
    if (educationMatch) {
      sections.education = educationMatch[1].trim();
    }
    
    // Look for experience section
    const experienceMatch = text.match(/(?:experience|work|employment)([\s\S]*?)(?=education|skills|projects|$)/i);
    if (experienceMatch) {
      sections.experience = experienceMatch[1].trim();
    }
    
    // Look for skills section
    const skillsMatch = text.match(/skills([\s\S]*?)(?=experience|education|projects|$)/i);
    if (skillsMatch) {
      sections.skills = skillsMatch[1].trim();
    }
    
    return sections;
  }

  async function generateResumeBasedResponses() {
    if (!appState.resume.parsedText) return;
    
    // Remove existing resume-based responses to regenerate (and delete from DB)
    const toDelete = appState.responses.filter(r => r.source === 'resume-based').map(r => r.id);
    for (const id of toDelete) {
      try { await apiDeleteResponse(id); } catch {}
    }
    appState.responses = appState.responses.filter(r => r.source !== 'resume-based');
    
    const keywords = appState.resume.keywords;
    const sections = appState.resume.sections;
    const resumeText = appState.resume.parsedText;
    
    // Generate intelligent, personalized responses
    const resumeResponses = [];
    
    // Experience-based opening
    if (keywords.length > 0) {
      resumeResponses.push({
        id: 'resume-exp-' + Date.now(),
        text: `With my background in ${keywords.slice(0, 3).join(', ')}, I am excited to bring my expertise to this role and contribute to your team's success.`,
        category: 'ai',
        userCreated: false,
        source: 'resume-based'
      });
    }
    
    // Skills-based qualification
    if (sections.skills) {
      resumeResponses.push({
        id: 'resume-skills-' + Date.now(),
        text: `My technical proficiency and hands-on experience have prepared me well for the challenges of this position, and I am confident in my ability to make an immediate impact.`,
        category: 'ai',
        userCreated: false,
        source: 'resume-based'
      });
    }
    
    // Education/certification based
    if (resumeText.toLowerCase().includes('degree') || resumeText.toLowerCase().includes('certified')) {
      resumeResponses.push({
        id: 'resume-edu-' + Date.now(),
        text: `My educational background and professional certifications have provided me with a strong foundation in the field, complemented by practical experience that directly applies to this role.`,
        category: 'ai',
        userCreated: false,
        source: 'resume-based'
      });
    }
    
    // Leadership/management experience
    if (keywords.some(k => k.includes('lead') || k.includes('manager') || k.includes('supervisor'))) {
      resumeResponses.push({
        id: 'resume-leadership-' + Date.now(),
        text: `My leadership experience has taught me the importance of collaboration, strategic thinking, and driving results - qualities I am eager to bring to your organization.`,
        category: 'ai',
        userCreated: false,
        source: 'resume-based'
      });
    }
    
    // Years of experience based
    const experienceMatch = resumeText.match(/(\d+)\+?\s*years?\s*of\s*experience/i);
    if (experienceMatch) {
      const years = experienceMatch[1];
      resumeResponses.push({
        id: 'resume-years-' + Date.now(),
        text: `With ${years} years of progressive experience in the industry, I have developed a comprehensive skill set and deep understanding that would be valuable to your team.`,
        category: 'ai',
        userCreated: false,
        source: 'resume-based'
      });
    }
    
    // Project/achievement based
    if (resumeText.toLowerCase().includes('project') || resumeText.toLowerCase().includes('achieved')) {
      resumeResponses.push({
        id: 'resume-achievements-' + Date.now(),
        text: `Throughout my career, I have successfully delivered complex projects and achieved measurable results, demonstrating my ability to execute effectively and add value to any organization.`,
        category: 'ai',
        userCreated: false,
        source: 'resume-based'
      });
    }
    
    // Add closing based on resume content
    resumeResponses.push({
      id: 'resume-closing-' + Date.now(),
      text: `I am excited about the opportunity to leverage my background and expertise to contribute to your organization's continued success and would welcome the chance to discuss how my experience aligns with your needs.`,
      category: 'ai',
      userCreated: false,
      source: 'resume-based'
    });
    
    // Add all generated responses and persist to DB
    appState.responses.push(...resumeResponses);

    // Persist creations
    for (const resp of resumeResponses) {
      try { await apiCreateResponse(resp); } catch (e) { console.warn('Backend create (resume-based) failed:', e.message || e); }
    }
    
    saveAppState();
    renderResponses();
    updateAuthUI();
  }

  function showResumeStatus(file) {
    DOM.uploadPlaceholder.style.display = 'none';
    DOM.resumeStatus.style.display = 'block';
    
    DOM.resumeName.textContent = file.name;
    DOM.resumeSize.textContent = formatFileSize(file.size);
  }

  function setParsingStatus(type, message) {
    if (!DOM.parsingStatus) return;
    DOM.parsingStatus.className = `parsing-status ${type}`;
    DOM.parsingStatus.textContent = message;
  }

  function removeResume() {
    if (confirm('Are you sure you want to remove your resume? This will also remove any AI-generated responses based on your resume.')) {
      // Reset resume data
      appState.resume = {
        fileName: null,
        fileSize: null,
        uploadDate: null,
        parsedText: null,
        keywords: [],
        sections: {}
      };
      
      // Remove resume-based responses
      appState.responses = appState.responses.filter(r => r.source !== 'resume-based');
      
      // Update UI
      DOM.uploadPlaceholder.style.display = 'block';
      DOM.resumeStatus.style.display = 'none';
      DOM.resumeFileInput.value = '';
      
      saveAppState();
      renderResponses();
    }
  }

  // Job Ad Parsing
  function handleParseJobAd() {
    const text = (DOM.jobAdText?.value || '').trim();
    if (!text) {
      DOM.jobAdParseStatus.textContent = 'Please paste a job ad to parse.';
      return;
    }
    const overwrite = !!(DOM.overwriteJobFields && DOM.overwriteJobFields.checked);
    const domain = (DOM.jobAdText?.dataset?.sourceDomain || (DOM.jobAdUrl?.value ? (normalizeUrl(DOM.jobAdUrl.value) ? new URL(normalizeUrl(DOM.jobAdUrl.value)).hostname : '') : '')).toLowerCase();
    const parsed = parseJobAdText(text, domain);

    const filled = [];
    const maybeSet = (el, key) => {
      if (!el) return;
      if (overwrite || !el.value) {
        if (parsed[key]) {
          el.value = parsed[key];
          filled.push(key);
        }
      }
    };

    maybeSet(DOM.roleTitle, 'roleTitle');
    maybeSet(DOM.companyName, 'companyName');
    maybeSet(DOM.contactPerson, 'contactPerson');
    maybeSet(DOM.refNumber, 'refNumber');

    if (filled.length) {
      DOM.jobAdParseStatus.textContent = `Parsed: ${filled.join(', ')}.`;
    } else {
      DOM.jobAdParseStatus.textContent = 'No new fields parsed. Try enabling "Overwrite existing fields" or adjust the job ad text.';
    }
    console.log('Job Ad Parsed ->', parsed);
  }

  async function handleFetchJobAdUrl() {
    const raw = (DOM.jobAdUrl?.value || '').trim();
    if (!raw) {
      DOM.jobAdParseStatus.textContent = 'Please paste a job URL to fetch.';
      return;
    }
    try {
      const url = normalizeUrl(raw);
      if (!url) {
        DOM.jobAdParseStatus.textContent = 'That does not look like a valid URL.';
        return;
      }
      DOM.jobAdParseStatus.textContent = 'Fetching job ad text...';
      const readableUrl = buildReadableProxyUrl(url);
      const resp = await fetch(readableUrl, { mode: 'cors' });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const text = await resp.text();
      const trimmed = text.replace(/\u0000/g,'').trim();
      if (!trimmed) throw new Error('Empty content');
      // Fill textarea and parse
      if (DOM.jobAdText) {
        DOM.jobAdText.value = trimmed;
        try { DOM.jobAdText.dataset.sourceDomain = new URL(url).hostname.toLowerCase(); } catch {}
      }
      DOM.jobAdParseStatus.textContent = 'Fetched ad successfully. Parsing...';
      // Slight delay to update UI
      setTimeout(()=> handleParseJobAd(), 10);
    } catch (err) {
      console.error('Fetch job ad failed:', err);
      DOM.jobAdParseStatus.textContent = `Failed to fetch job ad. ${err.message}.`;
    }
  }

  function normalizeUrl(input) {
    try {
      let u = input.trim();
      if (!/^https?:\/\//i.test(u)) u = 'https://' + u;
      const url = new URL(u);
      return url.href;
    } catch { return null; }
  }

  function buildReadableProxyUrl(u) {
    // Use r.jina.ai proxy to bypass CORS and extract readable text
    // Always prefix target with http:// for the proxy path
    try {
      const url = new URL(u);
      const target = 'http://' + url.hostname + url.pathname + url.search;
      return 'https://r.jina.ai/' + target;
    } catch {
      return 'https://r.jina.ai/' + u.replace(/^https?:\/\//i,'http://');
    }
  }

  function parseJobAdText(text, domain) {
    const original = text;
    text = text.replace(/\r/g, '');
    const lines = text.split(/\n+/).map(l => l.trim()).filter(Boolean);
    const joined = ' ' + lines.join(' ') + ' ';
    const out = { roleTitle: '', companyName: '', contactPerson: '', refNumber: '' };

    // Reference number / Job ID
    const refRegexes = [
      /(reference|ref(?:erence)?\s*(?:no\.?|number)?)[:\s#-]*([A-Z0-9\-_/]{3,})/i,
      /(job|req(?:uest)?)\s*id[:\s#-]*([A-Z0-9\-_/]{3,})/i
    ];
    for (const r of refRegexes) {
      const m = joined.match(r);
      if (m) { out.refNumber = m[2].trim(); break; }
    }

    // Company Name heuristics
    const companyLabel = joined.match(/(?:company|employer|organisation|organization)[:\s-]*([A-Z][\w&.,\-\s]{2,50})/i);
    if (companyLabel) out.companyName = toTitleCase(companyLabel[1].trim());
    if (!out.companyName) {
      const atPattern = joined.match(/\b(?:at|with)\s+([A-Z][A-Za-z0-9&'\-\s]{2,60})(?=[\.,;\)\s])/);
      if (atPattern) out.companyName = toTitleCase(atPattern[1].trim());
    }
    if (!out.companyName) {
      // Derive from email domain
      const email = joined.match(/[A-Za-z0-9._%+-]+@([A-Za-z0-9.-]+)\.[A-Za-z]{2,}/);
      if (email) {
        const dom = email[1].split('.').filter(p => !['com','au','uk','co','org','io','net'].includes(p.toLowerCase()))[0];
        if (dom) out.companyName = toTitleCase(dom.replace(/[-_]/g, ' '));
      }
    }

    // Role Title heuristics
    const titleLabels = [/(?:role|position|job|title|position\s*title)[:\s-]*([^\n\r]{3,80})/i];
    for (const r of titleLabels) {
      const m = text.match(r);
      if (m) { out.roleTitle = toTitleCase(m[1].replace(/^[\-\s]+/, '').trim()); break; }
    }
    if (!out.roleTitle && lines.length) {
      // Look for a headline-like first line (short, title-cased, few punctuation)
      const first = lines[0];
      if (/^[A-Za-z].{2,80}$/.test(first) && (first.match(/[A-Za-z]/g)||[]).length > (first.match(/[^A-Za-z\s]/g)||[]).length) {
        out.roleTitle = toTitleCase(first.replace(/^[\-\s]+/, ''));
      }
    }
    if (!out.roleTitle) {
      const seeking = joined.match(/\b(?:seeking|looking\s+for|hiring\s+an?)\s+([A-Za-z][A-Za-z\-\s]{2,60})(?=\s+(?:at|with|for)\b|[\.,;\)])/i);
      if (seeking) out.roleTitle = toTitleCase(seeking[1].trim());
    }

    // Contact person heuristics
    const contactRegexes = [
      /(?:contact|hiring\s+manager|recruiter|recruitment\s+(?:officer|consultant|team|manager))[:\s-]*([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})/i,
      /please\s+contact\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})/i,
      /for\s+further\s+information.*?contact\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})/i
    ];
    for (const r of contactRegexes) {
      const m = joined.match(r);
      if (m) { out.contactPerson = toTitleCase(m[1].trim()); break; }
    }

    // Site-specific tweaks
    if (domain) {
      const d = domain.toLowerCase();
      try {
        if (d.includes('seek')) applySeekHeuristics(out, lines, joined);
        else if (d.includes('indeed')) applyIndeedHeuristics(out, lines, joined);
        else if (d.includes('linkedin')) applyLinkedInHeuristics(out, lines, joined);
      } catch (e) { console.warn('Site-specific parse error:', e); }
    }

    // Cleanup: truncate and trim
    ['roleTitle','companyName','contactPerson','refNumber'].forEach(k => {
      if (out[k]) out[k] = out[k].toString().replace(/\s+/g,' ').trim().slice(0, 100);
    });

    return out;
  }

  function applySeekHeuristics(out, lines, joined) {
    // Role title: try first non-empty line if reasonable
    if (!out.roleTitle && lines.length) {
      const l0 = lines[0];
      if (/^[A-Za-z].{2,100}$/.test(l0)) out.roleTitle = toTitleCase(l0.replace(/\s{2,}/g,' ').trim());
    }
    // Company: often appears after "at" or under title
    if (!out.companyName) {
      const at = joined.match(/\b(?:at|with)\s+([A-Z][A-Za-z0-9&'\-\s]{2,60})(?=\s+(?:on|in|for|\||\.|,|\)|$))/);
      if (at) out.companyName = toTitleCase(at[1].trim());
    }
    // Reference: Job no/Job ID patterns
    if (!out.refNumber) {
      const m = joined.match(/\b(?:job\s*(?:no\.?|number|id)|reference\s*(?:no\.?|number|id)|ref\s*(?:no\.?|number|id)|req\s*id)[:\s#-]*([A-Z0-9\-_/]{3,})/i);
      if (m) out.refNumber = m[1];
    }
  }

  function applyIndeedHeuristics(out, lines, joined) {
    // Title - Company often in first line separated by "-"
    if ((!out.roleTitle || !out.companyName) && lines.length) {
      const l0 = lines[0];
      if (l0.includes(' - ')) {
        const parts = l0.split(' - ').map(s=>s.trim()).filter(Boolean);
        if (parts.length >= 2) {
          if (!out.roleTitle) out.roleTitle = toTitleCase(parts[0]);
          if (!out.companyName) out.companyName = toTitleCase(parts[1]);
        }
      }
    }
    if (!out.refNumber) {
      const m = joined.match(/\b(?:job|req)\s*id[:\s#-]*([A-Z0-9\-_/]{3,})/i);
      if (m) out.refNumber = m[1];
    }
  }

  function applyLinkedInHeuristics(out, lines, joined) {
    // About the job appears below header; first line is title, second is company
    if (lines.length >= 2) {
      if (!out.roleTitle && /^[A-Za-z].{2,100}$/.test(lines[0])) {
        out.roleTitle = toTitleCase(lines[0].replace(/\s{2,}/g,' '));
      }
      if (!out.companyName && /^[A-Z][A-Za-z0-9&'\-\s]{2,60}$/.test(lines[1]) && !/about\s+the\s+job/i.test(lines[1])) {
        out.companyName = toTitleCase(lines[1]);
      }
    }
    if (!out.refNumber) {
      const m = joined.match(/\b(?:job|req)\s*id[:\s#-]*([A-Z0-9\-_/]{3,})/i);
      if (m) out.refNumber = m[1];
    }
  }

  function loadResumeStatus() {
    // Only applicable on pages with resume UI
    if (!DOM.resumeStatus || !DOM.uploadPlaceholder || !DOM.resumeName || !DOM.resumeSize) return;
    if (appState.resume.fileName) {
      DOM.uploadPlaceholder.style.display = 'none';
      DOM.resumeStatus.style.display = 'block';
      
      DOM.resumeName.textContent = appState.resume.fileName;
      DOM.resumeSize.textContent = formatFileSize(appState.resume.fileSize);
      
      if (appState.resume.parsedText) {
        setParsingStatus('success', `Resume loaded! Found ${appState.resume.keywords.length} key skills and qualifications.`);
      }
    }
  }

  // Response Management
  let currentSearchQuery = '';
  
  // Common tags that should be highlighted
  const COMMON_TAGS = ['Introduction', 'Closing', 'Skills', 'Experience', 'Education / Qualifications'];
  
  // Preset tags for quick selection (alphabetically sorted)
  const PRESET_TAGS = [
    'Achievements / Awards',
    'Availability',
    'Career Goals / Aspirations',
    'Certifications',
    'Closing',
    'Communication',
    'Education / Qualifications',
    'Experience',
    'Industry Knowledge',
    'Introduction',
    'Languages',
    'Leadership',
    'Location / Relocation',
    'Motivation / Why this role',
    'Problem Solving',
    'Professional Memberships',
    'Projects',
    'Publications',
    'References / Endorsements',
    'Remote / Hybrid',
    'Skills',
    'Soft Skills',
    'Start Date',
    'Teamwork',
    'Technical Skills',
    'Travel Availability',
    'Volunteering / Community',
    'Why this company',
    'Work Preferences'
  ];
  
  function renderPresetTags(containerId, targetInputId, searchQuery = '') {
    const container = document.getElementById(containerId);
    const input = document.getElementById(targetInputId);
    if (!container || !input) return;
    
    container.innerHTML = '';
    const query = searchQuery.toLowerCase().trim();
    
    PRESET_TAGS.forEach(tag => {
      // Filter tags based on search query
      if (query && !tag.toLowerCase().includes(query)) {
        return; // Skip tags that don't match search
      }
      
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'preset-tag-btn';
      
      // Add 'common' class to frequently used tags
      if (COMMON_TAGS.includes(tag)) {
        btn.classList.add('common');
      }
      
      btn.textContent = tag;
      btn.onclick = () => togglePresetTag(tag, input, btn);
      container.appendChild(btn);
    });
  }
  
  function setupTagSearch(searchInputId, containerId, targetInputId) {
    const searchInput = document.getElementById(searchInputId);
    if (!searchInput) return;
    
    searchInput.addEventListener('input', (e) => {
      renderPresetTags(containerId, targetInputId, e.target.value);
      // Re-apply active state after filtering
      setTimeout(() => updatePresetTagsState(containerId, targetInputId), 10);
    });
  }
  
  function togglePresetTag(tag, input, btn) {
    const currentTags = input.value.split(',').map(t => t.trim()).filter(t => t.length > 0);
    const tagIndex = currentTags.findIndex(t => t.toLowerCase() === tag.toLowerCase());
    
    if (tagIndex > -1) {
      // Remove tag
      currentTags.splice(tagIndex, 1);
      btn.classList.remove('active');
    } else {
      // Add tag
      currentTags.push(tag);
      btn.classList.add('active');
    }
    
    input.value = currentTags.join(', ');
  }
  
  function updatePresetTagsState(containerId, targetInputId) {
    const container = document.getElementById(containerId);
    const input = document.getElementById(targetInputId);
    if (!container || !input) return;
    
    const currentTags = input.value.split(',').map(t => t.trim().toLowerCase()).filter(t => t.length > 0);
    const buttons = container.querySelectorAll('.preset-tag-btn');
    
    buttons.forEach(btn => {
      const tagName = btn.textContent.toLowerCase();
      if (currentTags.includes(tagName)) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  function filterResponses(searchQuery) {
    currentSearchQuery = searchQuery.toLowerCase().trim();
    renderResponses();
  }

  function matchesSearch(response, query) {
    if (!query) return true;
    
    // Search in text
    if (response.text.toLowerCase().includes(query)) return true;
    
    // Search in tags
    if (response.tags && response.tags.some(tag => tag.toLowerCase().includes(query))) return true;
    
    return false;
  }

  function renderResponses() {
    // Skip if response columns not present (e.g., on profile page)
    if (!DOM.categoryUser || !DOM.categoryCrowd || !DOM.categoryAi) return;
    // Clear existing responses
    DOM.categoryUser.innerHTML = '<h3>User Created <button type="button" id="addUserResponseBtn" class="add-category-btn" title="Add new response">+</button></h3>';
    DOM.categoryCrowd.innerHTML = '<h3>Crowd Sourced</h3>';
    DOM.categoryAi.innerHTML = '<h3>AI Generated</h3>';
    
    // Re-attach event listener for the + button
    const addBtn = document.getElementById('addUserResponseBtn');
    if (addBtn) addBtn.addEventListener('click', showCreateResponseModal);

    // Sort responses by first tag, then by creation date
    const sortedResponses = [...appState.responses].sort((a, b) => {
      const aFirstTag = (a.tags && a.tags.length > 0) ? a.tags[0].toLowerCase() : 'zzz';
      const bFirstTag = (b.tags && b.tags.length > 0) ? b.tags[0].toLowerCase() : 'zzz';
      
      if (aFirstTag !== bFirstTag) {
        return aFirstTag.localeCompare(bFirstTag);
      }
      
      // If same first tag (or both have no tags), maintain original order
      return 0;
    });

    sortedResponses.forEach(response => {
      // Apply search filter
      if (!matchesSearch(response, currentSearchQuery)) return;
      
      const responseEl = createResponseElement(response);
      
      if (response.category === 'user') {
        DOM.categoryUser.appendChild(responseEl);
      } else if (response.category === 'crowd') {
        DOM.categoryCrowd.appendChild(responseEl);
      } else if (response.category === 'ai') {
        DOM.categoryAi.appendChild(responseEl);
      }
    });
  }

  function createResponseElement(response) {
    const responseEl = document.createElement('div');
    responseEl.className = `response ${response.category}`;
    responseEl.draggable = true;
    responseEl.dataset.responseId = response.id;
    
    const textEl = document.createElement('p');
    textEl.textContent = response.text;
    responseEl.appendChild(textEl);
    
    // Add tags if present
    if (response.tags && response.tags.length > 0) {
      const tagsContainer = document.createElement('div');
      tagsContainer.className = 'response-tags';
      response.tags.forEach(tag => {
        const tagEl = document.createElement('span');
        tagEl.className = 'response-tag';
        tagEl.textContent = tag;
        tagsContainer.appendChild(tagEl);
      });
      responseEl.appendChild(tagsContainer);
    }
    
    // Add edit/delete controls for user-created responses
    if (response.userCreated) {
      const controlsEl = document.createElement('div');
      controlsEl.className = 'response-controls';
      
      const editBtn = document.createElement('button');
      editBtn.textContent = '✏️';
      editBtn.title = 'Edit';
      editBtn.onclick = (e) => {
        e.stopPropagation();
        editResponse(response.id);
      };
      
      const deleteBtn = document.createElement('button');
      deleteBtn.textContent = '🗑️';
      deleteBtn.title = 'Delete';
      deleteBtn.onclick = (e) => {
        e.stopPropagation();
        deleteResponse(response.id);
      };
      
      controlsEl.appendChild(editBtn);
      controlsEl.appendChild(deleteBtn);
      responseEl.appendChild(controlsEl);
    }
    
    // Add drag event listeners
    responseEl.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', response.id);
      e.dataTransfer.effectAllowed = 'copy';
    });
    
    return responseEl;
  }

  function insertPlaceholderAtCursor(textarea, placeholder) {
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    
    // Insert placeholder at cursor position
    textarea.value = text.substring(0, start) + placeholder + text.substring(end);
    
    // Move cursor to end of inserted placeholder
    const newPos = start + placeholder.length;
    textarea.setSelectionRange(newPos, newPos);
    textarea.focus();
  }
  
  function setupPlaceholderButtons(modalSelector, textareaId) {
    const modal = document.querySelector(modalSelector);
    if (!modal) return;
    
    const placeholderBtns = modal.querySelectorAll('.placeholder-btn');
    const textarea = document.getElementById(textareaId);
    
    placeholderBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const placeholder = btn.getAttribute('data-placeholder');
        insertPlaceholderAtCursor(textarea, placeholder);
      });
    });
  }

  function showCreateResponseModal() {
    if (!DOM.createResponseModal) return;
    if (DOM.modalResponseText) DOM.modalResponseText.value = '';
    const tagsInput = document.getElementById('modalResponseTags');
    if (tagsInput) tagsInput.value = '';
    
    // Clear tag search
    const tagSearchInput = document.getElementById('createTagSearch');
    if (tagSearchInput) tagSearchInput.value = '';
    
    if (DOM.modalError) DOM.modalError.textContent = '';
    
    // Render preset tags
    renderPresetTags('createPresetTags', 'modalResponseTags');
    
    // Setup tag search
    setupTagSearch('createTagSearch', 'createPresetTags', 'modalResponseTags');
    
    // Setup placeholder buttons
    setupPlaceholderButtons('#createResponseModal', 'modalResponseText');
    
    DOM.createResponseModal.classList.remove('hidden');
    setTimeout(() => DOM.modalResponseText?.focus(), 100);
  }

  function hideCreateResponseModal() {
    if (DOM.createResponseModal) DOM.createResponseModal.classList.add('hidden');
  }

  async function addResponse() {
    const text = sanitizeText(DOM.modalResponseText?.value || '');
    if (!text) {
      if (DOM.modalError) DOM.modalError.textContent = 'Please enter some response text.';
      return;
    }
    
    // Parse tags
    const tagsInput = document.getElementById('modalResponseTags');
    const tagsStr = tagsInput ? tagsInput.value.trim() : '';
    const tags = tagsStr ? tagsStr.split(',').map(t => t.trim()).filter(t => t.length > 0) : [];
    
    const newResponse = {
      id: generateId(),
      text: text,
      category: 'user',
      userCreated: true,
      tags: tags
    };

    // Try to persist to backend; fallback to local only
    try {
      await apiCreateResponse({ ...newResponse, source: 'user' });
    } catch (e) {
      console.warn('Backend create failed, caching locally:', e.message || e);
    }
    
    appState.responses.push(newResponse);
    saveAppState();
    renderResponses();
    
    hideCreateResponseModal();
  }

  let currentEditingResponseId = null;

  function showEditResponseModal(responseId) {
    if (!DOM.editResponseModal) return;
    const response = appState.responses.find(r => r.id === responseId);
    if (!response) return;
    
    currentEditingResponseId = responseId;
    if (DOM.editModalResponseText) DOM.editModalResponseText.value = response.text;
    
    // Populate tags
    const tagsInput = document.getElementById('editModalResponseTags');
    if (tagsInput) {
      tagsInput.value = response.tags ? response.tags.join(', ') : '';
    }
    
    // Clear tag search
    const tagSearchInput = document.getElementById('editTagSearch');
    if (tagSearchInput) tagSearchInput.value = '';
    
    // Render preset tags and update their state
    renderPresetTags('editPresetTags', 'editModalResponseTags');
    setTimeout(() => updatePresetTagsState('editPresetTags', 'editModalResponseTags'), 10);
    
    // Setup tag search
    setupTagSearch('editTagSearch', 'editPresetTags', 'editModalResponseTags');
    
    // Setup placeholder buttons
    setupPlaceholderButtons('#editResponseModal', 'editModalResponseText');
    
    if (DOM.editModalError) DOM.editModalError.textContent = '';
    DOM.editResponseModal.classList.remove('hidden');
    setTimeout(() => DOM.editModalResponseText?.focus(), 100);
  }

  function hideEditResponseModal() {
    if (DOM.editResponseModal) DOM.editResponseModal.classList.add('hidden');
    currentEditingResponseId = null;
  }

  function editResponse(responseId) {
    showEditResponseModal(responseId);
  }

  async function saveEditResponse() {
    if (!currentEditingResponseId) return;
    
    const text = sanitizeText(DOM.editModalResponseText?.value || '');
    if (!text) {
      if (DOM.editModalError) DOM.editModalError.textContent = 'Please enter some response text.';
      return;
    }
    
    // Parse tags
    const tagsInput = document.getElementById('editModalResponseTags');
    const tagsStr = tagsInput ? tagsInput.value.trim() : '';
    const tags = tagsStr ? tagsStr.split(',').map(t => t.trim()).filter(t => t.length > 0) : [];
    
    const response = appState.responses.find(r => r.id === currentEditingResponseId);
    if (response) {
      response.text = text;
      response.tags = tags;
      // Persist any category to backend
      try { await apiUpdateResponse(response); } catch (e) { console.warn('Backend update failed:', e.message || e); }
      saveAppState();
      renderResponses();
    }
    
    hideEditResponseModal();
  }

  async function deleteResponse(responseId) {
    if (confirm('Are you sure you want to delete this response?')) {
      try { await apiDeleteResponse(responseId); } catch (e) { console.warn('Backend delete failed:', e.message || e); }
      appState.responses = appState.responses.filter(r => r.id !== responseId);
      saveAppState();
      renderResponses();
    }
  }

  // Letter Builder
  function setupLetterBuilder() {
    if (!DOM.letterArea) return;
    DOM.letterArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    });
    
    DOM.letterArea.addEventListener('drop', (e) => {
      e.preventDefault();
      const responseId = e.dataTransfer.getData('text/plain');
      addParagraphToLetter(responseId);
    });
    
    // Make letter paragraphs sortable using SortableJS
    new Sortable(DOM.letterArea, {
      animation: 150,
      ghostClass: 'sortable-ghost',
      onEnd: updateLetterOrder
    });
  }

  function addParagraphToLetter(responseId) {
    const response = appState.responses.find(r => r.id === responseId);
    if (!response) return;
    
    // Remove placeholder if it exists
    const placeholder = DOM.letterArea.querySelector('.placeholder');
    if (placeholder) {
      placeholder.remove();
    }
    
    const paragraphEl = document.createElement('div');
    paragraphEl.className = 'letter-paragraph';
    paragraphEl.dataset.responseId = responseId;
    paragraphEl.textContent = replacePlaceholders(response.text);
    
    // Add remove button
    const removeBtn = document.createElement('button');
    removeBtn.textContent = '×';
    removeBtn.style.cssText = 'position: absolute; top: 5px; right: 5px; background: #ff4757; color: white; border: none; border-radius: 50%; width: 20px; height: 20px; cursor: pointer; font-size: 12px;';
    removeBtn.onclick = () => {
      paragraphEl.remove();
      updateLetterState();
    };
    
    paragraphEl.style.position = 'relative';
    paragraphEl.appendChild(removeBtn);
    
    DOM.letterArea.appendChild(paragraphEl);
    updateLetterState();
  }

  function updateLetterOrder() {
    updateLetterState();
  }

  function updateSalutationPreview() {
    // Remove existing salutation
    const existingSalutation = DOM.letterArea.querySelector('.letter-salutation');
    if (existingSalutation) {
      existingSalutation.remove();
    }
    
    // Don't add salutation if only placeholder exists
    const hasContent = DOM.letterArea.querySelectorAll('.letter-paragraph').length > 0;
    if (!hasContent) return;
    
    // Create salutation element
    const salutationEl = document.createElement('div');
    salutationEl.className = 'letter-salutation';
    salutationEl.style.cssText = 'margin-bottom: 15px; font-style: italic; color: #666; border-left: 3px solid #3498db; padding-left: 10px;';
    
    const contactPerson = sanitizeText(DOM.contactPerson.value);
    const companyName = sanitizeText(DOM.companyName.value);
    
    if (contactPerson) {
      salutationEl.textContent = `Dear ${contactPerson},`;
    } else if (companyName) {
      salutationEl.textContent = 'Dear Hiring Manager,';
    } else {
      salutationEl.textContent = 'Dear Recruitment Officer,';
    }
    
    // Insert salutation at the beginning (after any placeholder removal)
    const placeholder = DOM.letterArea.querySelector('.placeholder');
    if (placeholder) {
      DOM.letterArea.insertBefore(salutationEl, placeholder);
    } else {
      DOM.letterArea.insertBefore(salutationEl, DOM.letterArea.firstChild);
    }

    // Refresh dynamic placeholders in current letter paragraphs
    const paras = DOM.letterArea.querySelectorAll('.letter-paragraph');
    paras.forEach(p => {
      const id = p.dataset.responseId;
      const resp = appState.responses.find(r => r.id === id);
      if (!resp) return;
      // Update only the text node content, keep the remove button
      const first = p.firstChild;
      if (first && first.nodeType === Node.TEXT_NODE) {
        first.nodeValue = replacePlaceholders(resp.text);
      } else {
        // Fallback: reset text content then re-append the remove button if present
        const removeBtn = p.querySelector('button');
        p.textContent = replacePlaceholders(resp.text);
        if (removeBtn) p.appendChild(removeBtn);
      }
    });
  }

  function updateLetterState() {
    const paragraphs = DOM.letterArea.querySelectorAll('.letter-paragraph');
    appState.currentLetter.paragraphs = Array.from(paragraphs).map(p => p.dataset.responseId);
    
    // Show placeholder if no paragraphs
    if (paragraphs.length === 0) {
      const placeholder = document.createElement('p');
      placeholder.className = 'placeholder';
      placeholder.textContent = 'Drag responses here to build your letter';
      DOM.letterArea.appendChild(placeholder);
    }
    
    // Update salutation preview
    updateSalutationPreview();
    
    // Persist current letter state to localStorage
    saveCurrentLetter();
  }
  
  function saveCurrentLetter() {
    try {
      const letterState = {
        paragraphs: appState.currentLetter.paragraphs,
        jobInfo: {
          roleTitle: DOM.roleTitle?.value || '',
          companyName: DOM.companyName?.value || '',
          contactPerson: DOM.contactPerson?.value || '',
          businessAddress: DOM.businessAddress?.value || '',
          refNumber: DOM.refNumber?.value || ''
        }
      };
      localStorage.setItem('currentLetter', JSON.stringify(letterState));
    } catch (e) {
      console.error('Failed to save current letter:', e);
    }
  }
  
  function restoreCurrentLetter() {
    if (!DOM.letterArea) return;
    
    try {
      const savedLetter = localStorage.getItem('currentLetter');
      if (!savedLetter) return;
      
      const letterState = JSON.parse(savedLetter);
      
      // Restore job information
      if (letterState.jobInfo) {
        if (DOM.roleTitle) DOM.roleTitle.value = letterState.jobInfo.roleTitle || '';
        if (DOM.companyName) DOM.companyName.value = letterState.jobInfo.companyName || '';
        if (DOM.contactPerson) DOM.contactPerson.value = letterState.jobInfo.contactPerson || '';
        if (DOM.businessAddress) DOM.businessAddress.value = letterState.jobInfo.businessAddress || '';
        if (DOM.refNumber) DOM.refNumber.value = letterState.jobInfo.refNumber || '';
      }
      
      // Restore letter paragraphs
      if (letterState.paragraphs && letterState.paragraphs.length > 0) {
        // Clear placeholder
        const placeholder = DOM.letterArea.querySelector('.placeholder');
        if (placeholder) placeholder.remove();
        
        // Add each paragraph back
        letterState.paragraphs.forEach(responseId => {
          addParagraphToLetter(responseId);
        });
        
        console.log('Restored letter with', letterState.paragraphs.length, 'paragraphs');
      }
    } catch (e) {
      console.error('Failed to restore current letter:', e);
    }
  }

  function newLetter() {
    if (confirm('Are you sure you want to start a new letter? This will clear the current letter.')) {
      DOM.letterArea.innerHTML = '<p class="placeholder">Drag responses here to build your letter</p>';
      appState.currentLetter.paragraphs = [];
      
      // Clear job form
      DOM.roleTitle.value = '';
      DOM.companyName.value = '';
      DOM.contactPerson.value = '';
      DOM.businessAddress.value = '';
      DOM.refNumber.value = '';
      
      // Clear salutation preview
      updateSalutationPreview();
      
      // Clear saved letter state
      localStorage.removeItem('currentLetter');
    }
  }

  function saveLetterLocally() {
    if (appState.currentLetter.paragraphs.length === 0) {
      alert('Please add some content to your letter before saving.');
      return;
    }
    
    const jobTitle = sanitizeText(DOM.roleTitle.value);
    const company = sanitizeText(DOM.companyName.value);
    const timestamp = new Date().toLocaleString();
    
    const letterName = `${jobTitle || 'Letter'} - ${company || 'Company'} - ${timestamp}`;
    
    const letterData = {
      name: letterName,
      jobInfo: {
        roleTitle: DOM.roleTitle.value,
        companyName: DOM.companyName.value,
        contactPerson: DOM.contactPerson.value,
        businessAddress: DOM.businessAddress.value,
        refNumber: DOM.refNumber.value
      },
      paragraphs: [...appState.currentLetter.paragraphs],
      savedAt: Date.now()
    };
    
    const savedLetters = JSON.parse(localStorage.getItem('savedLetters') || '[]');
    savedLetters.push(letterData);
    localStorage.setItem('savedLetters', JSON.stringify(savedLetters));
    
    alert(`Letter saved as: ${letterName}`);
  }

  // Build a letter DOM element for preview/PDF based on selected theme
  function buildLetterElement(selectedTheme) {
    const profile = appState.profile;
    const fullName = `${profile.firstName || ''} ${profile.lastName || ''}`.trim();
    const jobTitle = sanitizeText(DOM.roleTitle.value);
    const companyName = sanitizeText(DOM.companyName.value);
    const contactPerson = sanitizeText(DOM.contactPerson.value);
    const businessAddress = sanitizeText(DOM.businessAddress.value);
    const todayLong = formatDateLongAU(new Date());

    const printEl = document.createElement('div');
    printEl.style.padding = '20px';
    printEl.style.background = 'white';
    printEl.style.color = '#000';
    printEl.style.fontFamily = 'Segoe UI, sans-serif';
    printEl.style.lineHeight = '1.5';
    printEl.style.fontSize = '12pt';
    printEl.style.wordBreak = 'break-word';
    printEl.style.overflowWrap = 'anywhere';
    printEl.style.whiteSpace = 'pre-wrap';

    if (selectedTheme === 'modern-centered') {
      const headerBlock = document.createElement('div');
      headerBlock.style.textAlign = 'center';
      headerBlock.style.marginBottom = '18px';

      if (fullName) {
        const nameEl = document.createElement('div');
        nameEl.innerText = fullName.toUpperCase().split('').join(' ');
        nameEl.style.fontWeight = '700';
        nameEl.style.fontSize = '20pt';
        nameEl.style.letterSpacing = '6px';
        nameEl.style.marginBottom = '6px';
        nameEl.style.pageBreakInside = 'avoid';
        nameEl.style.breakInside = 'avoid-page';
        headerBlock.appendChild(nameEl);
      }

      const taglineEl = document.createElement('div');
      const defaultTagline = 'NDIS SUPPORT SPECIALIST | DISABILITY CARE ADVOCATE';
      taglineEl.innerText = defaultTagline;
      taglineEl.style.fontSize = '10pt';
      taglineEl.style.letterSpacing = '3px';
      taglineEl.style.color = '#444';
      taglineEl.style.marginBottom = '6px';
      taglineEl.style.pageBreakInside = 'avoid';
      taglineEl.style.breakInside = 'avoid-page';
      headerBlock.appendChild(taglineEl);

      const contacts = [];
      if (profile.phoneNumber) contacts.push(profile.phoneNumber);
      if (profile.emailAddress) contacts.push(profile.emailAddress);
      if (contacts.length) {
        const contactEl = document.createElement('div');
        contactEl.innerText = contacts.join(' | ');
        contactEl.style.fontSize = '10pt';
        contactEl.style.color = '#333';
        contactEl.style.pageBreakInside = 'avoid';
        contactEl.style.breakInside = 'avoid-page';
        headerBlock.appendChild(contactEl);
      }

      const hr = document.createElement('div');
      hr.style.height = '1px';
      hr.style.background = '#ddd';
      hr.style.margin = '12px 0 8px';
      headerBlock.appendChild(hr);

      printEl.appendChild(headerBlock);

      // Date (right-aligned)
      const dateEl = document.createElement('div');
      dateEl.innerText = todayLong;
      dateEl.style.textAlign = 'right';
      dateEl.style.marginBottom = '10px';
      printEl.appendChild(dateEl);

      const salutationP = document.createElement('p');
      if (contactPerson && contactPerson.trim()) {
        salutationP.innerText = `Dear ${contactPerson.trim()},`;
      } else if (companyName && companyName.trim()) {
        salutationP.innerText = 'Dear Hiring Team,';
      } else {
        salutationP.innerText = 'Dear Hiring Team,';
      }
      salutationP.style.marginBottom = '16px';
      salutationP.style.pageBreakInside = 'avoid';
      salutationP.style.breakInside = 'avoid-page';
      printEl.appendChild(salutationP);

      const paras = DOM.letterArea.querySelectorAll('.letter-paragraph');
      paras.forEach(para => {
        const p = document.createElement('p');
        p.innerText = para.textContent.replace('×', '');
        p.style.marginBottom = '12px';
        p.style.pageBreakInside = 'avoid';
        p.style.breakInside = 'avoid-page';
        p.style.wordBreak = 'break-word';
        p.style.overflowWrap = 'anywhere';
        p.style.whiteSpace = 'pre-wrap';
        printEl.appendChild(p);
      });

      if (fullName || profile.phoneNumber || profile.emailAddress) {
        const signatureP = document.createElement('p');
        signatureP.style.marginTop = '30px';
        signatureP.style.pageBreakInside = 'avoid';
        signatureP.style.breakInside = 'avoid-page';
        let sig = 'Sincerely,';
        if (fullName) sig += `\n${fullName}`;
        if (profile.phoneNumber) sig += `\nPhone: ${profile.phoneNumber}`;
        if (profile.emailAddress) sig += `\nEmail: ${profile.emailAddress}`;
        signatureP.innerText = sig;
        printEl.appendChild(signatureP);
      }

      return printEl;
    }

    // Formal Classic theme (Sender right + Date, Recipient left)
    if (selectedTheme === 'formal-classic') {
      // Sender block (right-aligned)
      const sender = document.createElement('div');
      sender.style.textAlign = 'right';
      sender.style.marginBottom = '12px';

      const senderName = document.createElement('div');
      senderName.innerText = fullName || '';
      senderName.style.fontWeight = '600';
      senderName.style.fontSize = '12pt';
      sender.appendChild(senderName);

      if (profile.addressLine1) sender.appendChild(Object.assign(document.createElement('div'), { innerText: profile.addressLine1 }));
      if (profile.addressLine2) sender.appendChild(Object.assign(document.createElement('div'), { innerText: profile.addressLine2 }));
      if (profile.phoneNumber) sender.appendChild(Object.assign(document.createElement('div'), { innerText: `Tel: ${profile.phoneNumber}` }));
      if (profile.emailAddress) sender.appendChild(Object.assign(document.createElement('div'), { innerText: `Email: ${profile.emailAddress}` }));

      const dateEl = document.createElement('div');
      dateEl.innerText = formatDateLongAU(new Date());
      dateEl.style.marginTop = '8px';
      sender.appendChild(dateEl);

      printEl.appendChild(sender);

      // Recipient block (left-aligned)
      if (companyName || businessAddress) {
        const recip = document.createElement('div');
        recip.style.textAlign = 'left';
        recip.style.marginBottom = '12px';
        if (companyName) recip.appendChild(Object.assign(document.createElement('div'), { innerText: companyName }));
        if (businessAddress) recip.appendChild(Object.assign(document.createElement('div'), { innerText: businessAddress }));
        printEl.appendChild(recip);
      }

      // Salutation
      const salutationP = document.createElement('p');
      if (contactPerson && contactPerson.trim()) {
        salutationP.innerText = `Dear ${contactPerson.trim()},`;
      } else if (companyName && companyName.trim()) {
        salutationP.innerText = 'Dear Hiring Manager,';
      } else {
        salutationP.innerText = 'Dear Hiring Team,';
      }
      salutationP.style.marginBottom = '16px';
      salutationP.style.pageBreakInside = 'avoid';
      salutationP.style.breakInside = 'avoid-page';
      printEl.appendChild(salutationP);

      // Body
      const parasFC = DOM.letterArea.querySelectorAll('.letter-paragraph');
      parasFC.forEach(para => {
        const p = document.createElement('p');
        p.innerText = para.textContent.replace('×', '');
        p.style.marginBottom = '12px';
        p.style.pageBreakInside = 'avoid';
        p.style.breakInside = 'avoid-page';
        p.style.wordBreak = 'break-word';
        p.style.overflowWrap = 'anywhere';
        p.style.whiteSpace = 'pre-wrap';
        printEl.appendChild(p);
      });

      // Signature
      if (fullName || profile.phoneNumber || profile.emailAddress) {
        const signatureP = document.createElement('p');
        signatureP.style.marginTop = '30px';
        signatureP.style.pageBreakInside = 'avoid';
        signatureP.style.breakInside = 'avoid-page';
        let sig = 'Sincerely,';
        if (fullName) sig += `\n${fullName}`;
        if (profile.phoneNumber) sig += `\nPhone: ${profile.phoneNumber}`;
        if (profile.emailAddress) sig += `\nEmail: ${profile.emailAddress}`;
        signatureP.innerText = sig;
        printEl.appendChild(signatureP);
      }

      return printEl;
    }

    // Sidebar Profile theme (left sidebar, right content)
    if (selectedTheme === 'sidebar-profile') {
      const container = document.createElement('div');
      container.style.display = 'flex';
      container.style.gap = '16px';

      const sidebar = document.createElement('div');
      sidebar.style.flex = '0 0 28%';
      sidebar.style.minWidth = '180px';
      sidebar.style.background = '#f7f8ff';
      sidebar.style.border = '1px solid #e6eaf2';
      sidebar.style.borderRadius = '8px';
      sidebar.style.padding = '12px';

      if (fullName) {
        const name = document.createElement('div');
        name.innerText = fullName;
        name.style.fontWeight = '700';
        name.style.marginBottom = '6px';
        sidebar.appendChild(name);
      }
      if (profile.phoneNumber) sidebar.appendChild(Object.assign(document.createElement('div'), { innerText: profile.phoneNumber }));
      if (profile.emailAddress) sidebar.appendChild(Object.assign(document.createElement('div'), { innerText: profile.emailAddress }));
      if (profile.addressLine1) sidebar.appendChild(Object.assign(document.createElement('div'), { innerText: profile.addressLine1 }));
      if (profile.addressLine2) sidebar.appendChild(Object.assign(document.createElement('div'), { innerText: profile.addressLine2 }));

      const content = document.createElement('div');
      content.style.flex = '1';

      if (companyName || businessAddress) {
        const header = document.createElement('div');
        header.style.marginBottom = '8px';
        if (companyName) header.appendChild(Object.assign(document.createElement('div'), { innerText: companyName, style: 'font-weight:600;' }));
        if (businessAddress) header.appendChild(Object.assign(document.createElement('div'), { innerText: businessAddress }));
        content.appendChild(header);
      }

      // Date (right-aligned within content)
      const dateEl = document.createElement('div');
      dateEl.innerText = todayLong;
      dateEl.style.textAlign = 'right';
      dateEl.style.marginBottom = '8px';
      content.appendChild(dateEl);

      const sal = document.createElement('p');
      if (contactPerson && contactPerson.trim()) sal.innerText = `Dear ${contactPerson.trim()},`; else sal.innerText = 'Dear Hiring Manager,';
      sal.style.marginBottom = '12px';
      content.appendChild(sal);

      const parasSB = DOM.letterArea.querySelectorAll('.letter-paragraph');
      parasSB.forEach(para => {
        const p = document.createElement('p');
        p.innerText = para.textContent.replace('×', '');
        p.style.marginBottom = '12px';
        p.style.wordBreak = 'break-word';
        p.style.overflowWrap = 'anywhere';
        p.style.whiteSpace = 'pre-wrap';
        content.appendChild(p);
      });

      if (fullName || profile.phoneNumber || profile.emailAddress) {
        const signatureP = document.createElement('p');
        signatureP.style.marginTop = '24px';
        let sig = 'Sincerely,';
        if (fullName) sig += `\n${fullName}`;
        if (profile.phoneNumber) sig += `\nPhone: ${profile.phoneNumber}`;
        if (profile.emailAddress) sig += `\nEmail: ${profile.emailAddress}`;
        signatureP.innerText = sig;
        content.appendChild(signatureP);
      }

      container.appendChild(sidebar);
      container.appendChild(content);
      printEl.appendChild(container);
      return printEl;
    }

    // Letterhead Accent theme (top bar)
    if (selectedTheme === 'letterhead-accent') {
      const bar = document.createElement('div');
      bar.style.background = 'linear-gradient(120deg, #151a6a, #6c63ff, #18c4a5)';
      bar.style.color = '#fff';
      bar.style.padding = '12px 16px';
      bar.style.borderRadius = '8px';
      bar.style.marginBottom = '12px';

      if (fullName) {
        const name = document.createElement('div');
        name.innerText = fullName;
        name.style.fontWeight = '700';
        name.style.fontSize = '14pt';
        bar.appendChild(name);
      }
      const sub = document.createElement('div');
      sub.innerText = (appState.settings?.tagline) || 'NDIS SUPPORT SPECIALIST | DISABILITY CARE ADVOCATE';
      sub.style.opacity = '0.9';
      sub.style.letterSpacing = '1px';
      sub.style.fontSize = '10pt';
      bar.appendChild(sub);

      const contact = [];
      if (profile.phoneNumber) contact.push(profile.phoneNumber);
      if (profile.emailAddress) contact.push(profile.emailAddress);
      if (contact.length) {
        const c = document.createElement('div');
        c.innerText = contact.join(' | ');
        c.style.opacity = '0.95';
        c.style.fontSize = '9pt';
        bar.appendChild(c);
      }
      printEl.appendChild(bar);

      // Date (right-aligned)
      const dateEl = document.createElement('div');
      dateEl.innerText = todayLong;
      dateEl.style.textAlign = 'right';
      dateEl.style.margin = '6px 0 10px';
      printEl.appendChild(dateEl);

      // Body
      const salutationP = document.createElement('p');
      if (contactPerson && contactPerson.trim()) salutationP.innerText = `Dear ${contactPerson.trim()},`; else if (companyName) salutationP.innerText = 'Dear Hiring Team,'; else salutationP.innerText = 'Dear Hiring Team,';
      salutationP.style.marginBottom = '16px';
      printEl.appendChild(salutationP);

      const parasLH = DOM.letterArea.querySelectorAll('.letter-paragraph');
      parasLH.forEach(para => {
        const p = document.createElement('p');
        p.innerText = para.textContent.replace('×', '');
        p.style.marginBottom = '12px';
        printEl.appendChild(p);
      });

      if (fullName || profile.phoneNumber || profile.emailAddress) {
        const signatureP = document.createElement('p');
        signatureP.style.marginTop = '30px';
        let sig = 'Sincerely,';
        if (fullName) sig += `\n${fullName}`;
        if (profile.phoneNumber) sig += `\nPhone: ${profile.phoneNumber}`;
        if (profile.emailAddress) sig += `\nEmail: ${profile.emailAddress}`;
        signatureP.innerText = sig;
        printEl.appendChild(signatureP);
      }

      return printEl;
    }

    // Standard theme (left/right header)
    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'flex-start';
    header.style.gap = '20px';
    header.style.marginBottom = '16px';

    const leftCol = document.createElement('div');
    leftCol.style.flex = '1';
    leftCol.style.textAlign = 'left';
    if (companyName) {
      const p = document.createElement('p');
      p.innerText = companyName;
      p.style.margin = '0 0 4px 0';
      p.style.fontWeight = '600';
      p.style.pageBreakInside = 'avoid';
      p.style.breakInside = 'avoid-page';
      leftCol.appendChild(p);
    }
    if (businessAddress) {
      const p = document.createElement('p');
      p.innerText = businessAddress;
      p.style.margin = '0';
      p.style.pageBreakInside = 'avoid';
      p.style.breakInside = 'avoid-page';
      leftCol.appendChild(p);
    }

    const rightCol = document.createElement('div');
    rightCol.style.flex = '1';
    rightCol.style.textAlign = 'right';
    if (fullName) {
      const p = document.createElement('p');
      p.innerText = fullName;
      p.style.margin = '0 0 4px 0';
      p.style.fontWeight = '600';
      p.style.pageBreakInside = 'avoid';
      p.style.breakInside = 'avoid-page';
      rightCol.appendChild(p);
    }
    if (profile.addressLine1) {
      const p = document.createElement('p');
      p.innerText = profile.addressLine1;
      p.style.margin = '0';
      p.style.pageBreakInside = 'avoid';
      p.style.breakInside = 'avoid-page';
      rightCol.appendChild(p);
    }
    if (profile.addressLine2) {
      const p = document.createElement('p');
      p.innerText = profile.addressLine2;
      p.style.margin = '0';
      p.style.pageBreakInside = 'avoid';
      p.style.breakInside = 'avoid-page';
      rightCol.appendChild(p);
    }

    header.appendChild(leftCol);
    header.appendChild(rightCol);
    printEl.appendChild(header);

    printEl.appendChild(document.createElement('br'));

    // Date (right-aligned)
    const dateEl = document.createElement('div');
    dateEl.innerText = todayLong;
    dateEl.style.textAlign = 'right';
    dateEl.style.marginBottom = '10px';
    printEl.appendChild(dateEl);

    const salutationP = document.createElement('p');
    salutationP.style.marginBottom = '16px';
    salutationP.style.pageBreakInside = 'avoid';
    salutationP.style.breakInside = 'avoid-page';
    if (contactPerson && contactPerson.trim()) {
      salutationP.innerText = `Dear ${contactPerson.trim()},`;
    } else if (companyName && companyName.trim()) {
      salutationP.innerText = 'Dear Hiring Manager,';
    } else {
      salutationP.innerText = 'Dear Recruitment Officer,';
    }
    printEl.appendChild(salutationP);

    const paras = DOM.letterArea.querySelectorAll('.letter-paragraph');
    paras.forEach(para => {
      const p = document.createElement('p');
      p.innerText = para.textContent.replace('×', '');
      p.style.marginBottom = '12px';
      p.style.pageBreakInside = 'avoid';
      p.style.breakInside = 'avoid-page';
      p.style.wordBreak = 'break-word';
      p.style.overflowWrap = 'anywhere';
      p.style.whiteSpace = 'pre-wrap';
      printEl.appendChild(p);
    });

    if (fullName || profile.phoneNumber || profile.emailAddress) {
      const signatureP = document.createElement('p');
      signatureP.style.marginTop = '30px';
      signatureP.style.pageBreakInside = 'avoid';
      signatureP.style.breakInside = 'avoid-page';
      signatureP.style.whiteSpace = 'pre-wrap';
      let sig = 'Sincerely,';
      if (fullName) sig += `\n${fullName}`;
      if (profile.phoneNumber) sig += `\nPhone: ${profile.phoneNumber}`;
      if (profile.emailAddress) sig += `\nEmail: ${profile.emailAddress}`;
      signatureP.innerText = sig;
      printEl.appendChild(signatureP);
    }

    return printEl;
  }

  function renderLetterPreview() {
    if (!DOM.letterPreview) return;
    const theme = (DOM.themeSelect && DOM.themeSelect.value) || (appState.settings?.theme) || 'standard';
    const el = buildLetterElement(theme);
    // Center within preview panel
    const wrapper = document.createElement('div');
    wrapper.style.maxWidth = '700px';
    wrapper.style.margin = '0 auto';
    wrapper.appendChild(el);
    DOM.letterPreview.innerHTML = '';
    DOM.letterPreview.appendChild(wrapper);
  }

  // AI Functions
  async function checkAiStatus() {
    try {
      const response = await fetch('/api/ai-status');
      const status = await response.json();
      return status;
    } catch (e) {
      return { available: false, quotaExceeded: false };
    }
  }

  async function handleAiExtract() {
    const jobAdText = DOM.jobAdText?.value?.trim();
    if (!jobAdText) {
      showJobAdStatus('Please paste a job ad first', 'error');
      return;
    }

    if (!authToken) {
      showJobAdStatus('Please sign in to use AI features', 'error');
      return;
    }

    // Check AI availability
    const aiStatus = await checkAiStatus();
    if (aiStatus.quotaExceeded) {
      showJobAdStatus('⚠️ AI features are temporarily unavailable (quota exceeded)', 'error');
      disableAiButtons();
      return;
    }

    showJobAdStatus('🤖 Extracting job information with AI...', 'loading');
    
    try {
      const response = await fetch('/api/extract-job-ad', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ jobAdText })
      });

      if (!response.ok) {
      const err = await response.json();
        if (err.quotaExceeded) {
          disableAiButtons();
          throw new Error('⚠️ AI quota exceeded - features disabled');
        }
        throw new Error(err.error || 'Failed to extract');
      }

      const extracted = await response.json();
      
      // Update fields
      const overwrite = DOM.overwriteJobFields?.checked;
      if (extracted.roleTitle && (overwrite || !DOM.roleTitle.value)) {
        DOM.roleTitle.value = extracted.roleTitle;
      }
      if (extracted.companyName && (overwrite || !DOM.companyName.value)) {
        DOM.companyName.value = extracted.companyName;
      }
      if (extracted.contactPerson && (overwrite || !DOM.contactPerson.value)) {
        DOM.contactPerson.value = extracted.contactPerson;
      }
      if (extracted.businessAddress && (overwrite || !DOM.businessAddress.value)) {
        DOM.businessAddress.value = extracted.businessAddress;
      }
      if (extracted.reference && (overwrite || !DOM.refNumber.value)) {
        DOM.refNumber.value = extracted.reference;
      }

      showJobAdStatus('✅ Job information extracted successfully!', 'success');
      updateSalutationPreview();
    } catch (error) {
      console.error('AI extraction error:', error);
      showJobAdStatus(`❌ ${error.message}`, 'error');
    }
  }

  async function handleAiGenerate() {
    const jobAdText = DOM.jobAdText?.value?.trim();
    if (!jobAdText) {
      showJobAdStatus('Please paste a job ad first', 'error');
      return;
    }

    if (!authToken) {
      showJobAdStatus('Please sign in to use AI features', 'error');
      return;
    }

    // Check AI availability
    const aiStatus = await checkAiStatus();
    if (aiStatus.quotaExceeded) {
      showJobAdStatus('⚠️ AI features are temporarily unavailable (quota exceeded)', 'error');
      disableAiButtons();
      return;
    }

    showJobAdStatus('✨ Generating cover letter paragraphs with AI...', 'loading');
    
    try {
      const response = await fetch('/api/generate-paragraphs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          jobAdText,
          roleTitle: DOM.roleTitle?.value,
          companyName: DOM.companyName?.value
        })
      });

      if (!response.ok) {
      const err = await response.json();
        if (err.quotaExceeded) {
          disableAiButtons();
          throw new Error('⚠️ AI quota exceeded - features disabled');
        }
        throw new Error(err.error || 'Failed to generate');
      }

      const paragraphs = await response.json();
      
      // Add generated paragraphs as AI responses
      if (paragraphs.opening) {
        await addResponseToLibrary(paragraphs.opening, 'ai', 'AI Opening');
      }
      if (paragraphs.body) {
        await addResponseToLibrary(paragraphs.body, 'ai', 'AI Body');
      }
      if (paragraphs.closing) {
        await addResponseToLibrary(paragraphs.closing, 'ai', 'AI Closing');
      }

      showJobAdStatus('✅ AI paragraphs generated and added to library!', 'success');
      await syncResponsesFromDb();
    } catch (error) {
      console.error('AI generation error:', error);
      showJobAdStatus(`❌ ${error.message}`, 'error');
    }
  }

  async function addResponseToLibrary(text, category, source) {
    if (!authToken) return;
    
    const newResponse = {
      id: generateId(),
      text: sanitizeText(text),
      category: category,
      userCreated: false,
      source: source || null
    };

    try {
      const response = await fetch('/responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(newResponse)
      });

      if (!response.ok) {
        throw new Error('Failed to save response');
      }
    } catch (error) {
      console.error('Error adding response:', error);
    }
  }

  function showJobAdStatus(message, type) {
    if (!DOM.jobAdParseStatus) return;
    DOM.jobAdParseStatus.textContent = message;
    DOM.jobAdParseStatus.className = `job-ad-status ${type}`;
  }

  function disableAiButtons() {
    if (DOM.aiExtractBtn) {
      DOM.aiExtractBtn.disabled = true;
      DOM.aiExtractBtn.title = 'AI quota exceeded - temporarily unavailable';
      DOM.aiExtractBtn.style.opacity = '0.5';
      DOM.aiExtractBtn.style.cursor = 'not-allowed';
    }
    if (DOM.aiGenerateBtn) {
      DOM.aiGenerateBtn.disabled = true;
      DOM.aiGenerateBtn.title = 'AI quota exceeded - temporarily unavailable';
      DOM.aiGenerateBtn.style.opacity = '0.5';
      DOM.aiGenerateBtn.style.cursor = 'not-allowed';
    }
  }

  function enableAiButtons() {
    if (DOM.aiExtractBtn) {
      DOM.aiExtractBtn.disabled = false;
      DOM.aiExtractBtn.title = 'Use AI to extract job info';
      DOM.aiExtractBtn.style.opacity = '1';
      DOM.aiExtractBtn.style.cursor = 'pointer';
    }
    if (DOM.aiGenerateBtn) {
      DOM.aiGenerateBtn.disabled = false;
      DOM.aiGenerateBtn.title = 'Generate cover letter paragraphs with AI';
      DOM.aiGenerateBtn.style.opacity = '1';
      DOM.aiGenerateBtn.style.cursor = 'pointer';
    }
  }

  // PDF Export (Enhanced)
  function downloadPdf() {
    const profile = appState.profile;
    const fullName = `${profile.firstName || ''} ${profile.lastName || ''}`.trim();
    const today = new Date().toISOString().split('T')[0];
    const jobTitle = sanitizeText(DOM.roleTitle.value);
    const companyName = sanitizeText(DOM.companyName.value);

    const fileName = `${fullName} - ${jobTitle} - ${companyName} - ${today}`
      .replace(/[^\w\d\- ]+/g, '')
      .replace(/\s+/g, ' ')
      .trim() + '.pdf';

    const selectedTheme = (DOM.themeSelect && DOM.themeSelect.value) || (appState.settings?.theme) || 'standard';
    const el = buildLetterElement(selectedTheme);

    const pageSize = (DOM.pageSizeSelect && DOM.pageSizeSelect.value) || (appState.settings?.pageSize) || 'letter';

    const opt = {
      margin: 0.6,
      filename: fileName,
      image: { type: 'jpeg', quality: 0.98 },
      pagebreak: { mode: ['css', 'legacy'] },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: pageSize === 'a4' ? 'a4' : 'letter', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(el).save();
  }

  // Event Listeners Setup
  function setupEventListeners() {
    // Profile auto-save on input
    [DOM.firstName, DOM.lastName, DOM.addressLine1, DOM.addressLine2, DOM.phoneNumber, DOM.emailAddress].forEach(input => {
      if (!input) return;
      input.addEventListener('blur', saveUserProfile);
    });
    
    // Job info changes - update salutation preview and refresh placeholders
    [DOM.contactPerson, DOM.companyName, DOM.roleTitle, DOM.businessAddress, DOM.refNumber].forEach(input => {
      input.addEventListener('input', () => {
        updateSalutationPreview();
        saveCurrentLetter(); // Save job info changes
      });
      input.addEventListener('blur', () => {
        updateSalutationPreview();
        saveCurrentLetter(); // Save job info changes
      });
    });
    
    // Response management - create modal
    if (DOM.addUserResponseBtn) DOM.addUserResponseBtn.addEventListener('click', showCreateResponseModal);
    if (DOM.modalSaveBtn) DOM.modalSaveBtn.addEventListener('click', addResponse);
    if (DOM.modalCancelBtn) DOM.modalCancelBtn.addEventListener('click', hideCreateResponseModal);
    if (DOM.modalResponseText) {
      DOM.modalResponseText.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && e.ctrlKey) {
          addResponse();
        }
      });
    }

    // Response management - edit modal
    if (DOM.editModalSaveBtn) DOM.editModalSaveBtn.addEventListener('click', saveEditResponse);
    if (DOM.editModalCancelBtn) DOM.editModalCancelBtn.addEventListener('click', hideEditResponseModal);
    if (DOM.editModalResponseText) {
      DOM.editModalResponseText.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && e.ctrlKey) {
          saveEditResponse();
        }
      });
    }
    
    // Letter actions
    if (DOM.newLetterBtn) DOM.newLetterBtn.addEventListener('click', newLetter);
    if (DOM.saveLetterBtn) DOM.saveLetterBtn.addEventListener('click', saveLetterLocally);
    if (DOM.downloadPdfBtn) DOM.downloadPdfBtn.addEventListener('click', downloadPdf);

    // Job ad parsing
    if (DOM.parseJobAdBtn) DOM.parseJobAdBtn.addEventListener('click', handleParseJobAd);
    if (DOM.fetchJobAdBtn) DOM.fetchJobAdBtn.addEventListener('click', handleFetchJobAdUrl);
    if (DOM.jobAdUrl) DOM.jobAdUrl.addEventListener('keydown', (e)=>{ if(e.key==='Enter'){ e.preventDefault(); handleFetchJobAdUrl(); }});
    
    // AI features
    DOM.aiExtractBtn = document.getElementById('aiExtractBtn');
    DOM.aiGenerateBtn = document.getElementById('aiGenerateBtn');
    if (DOM.aiExtractBtn) DOM.aiExtractBtn.addEventListener('click', handleAiExtract);
    if (DOM.aiGenerateBtn) DOM.aiGenerateBtn.addEventListener('click', handleAiGenerate);

    // Header/Nav events
    if (DOM.themeToggleBtn) DOM.themeToggleBtn.addEventListener('click', toggleTheme);
    if (DOM.syncResponsesBtn) DOM.syncResponsesBtn.addEventListener('click', syncResponsesFromDb);

    // Auth controls
    if (DOM.authBtn) DOM.authBtn.addEventListener('click', () => { showAuthModal(); });
    if (DOM.logoutBtn) DOM.logoutBtn.addEventListener('click', async () => { await handleLogout(); });
    if (DOM.authCancelBtn) DOM.authCancelBtn.addEventListener('click', hideAuthModal);
    if (DOM.authSubmitBtn) DOM.authSubmitBtn.addEventListener('click', handleAuthSubmit);
    if (DOM.forgotPasswordBtn) DOM.forgotPasswordBtn.addEventListener('click', showResetPasswordModal);
    if (DOM.resetSubmitBtn) DOM.resetSubmitBtn.addEventListener('click', handlePasswordReset);
    if (DOM.resetCancelBtn) DOM.resetCancelBtn.addEventListener('click', hideResetPasswordModal);

    // Theme selection
    if (DOM.themeSelect) {
      if (appState.settings && appState.settings.theme) {
        DOM.themeSelect.value = appState.settings.theme;
      }
      DOM.themeSelect.addEventListener('change', () => {
        appState.settings = appState.settings || {};
        appState.settings.theme = DOM.themeSelect.value;
        saveAppState();
        if (DOM.letterPreview && DOM.letterPreview.childNodes.length) {
          renderLetterPreview();
        }
      });
    }

    // Page size selection
    if (DOM.pageSizeSelect) {
      if (appState.settings && appState.settings.pageSize) {
        DOM.pageSizeSelect.value = appState.settings.pageSize;
      }
      DOM.pageSizeSelect.addEventListener('change', () => {
        appState.settings = appState.settings || {};
        appState.settings.pageSize = DOM.pageSizeSelect.value;
        saveAppState();
        if (DOM.letterPreview && DOM.letterPreview.childNodes.length) {
          renderLetterPreview();
        }
      });
    }

    // Preview button
    if (DOM.previewLetterBtn) {
      DOM.previewLetterBtn.addEventListener('click', renderLetterPreview);
    }
    
    // Search functionality
    const searchInput = document.getElementById('responseSearchInput');
    const clearSearchBtn = document.getElementById('clearSearchBtn');
    
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        filterResponses(e.target.value);
      });
    }
    
    if (clearSearchBtn) {
      clearSearchBtn.addEventListener('click', () => {
        if (searchInput) searchInput.value = '';
        filterResponses('');
      });
    }
  }

  // Initialize DOM Elements
  function initializeDOM() {
    DOM.firstName = document.getElementById('firstName');
    DOM.lastName = document.getElementById('lastName');
    DOM.addressLine1 = document.getElementById('addressLine1');
    DOM.addressLine2 = document.getElementById('addressLine2');
    DOM.phoneNumber = document.getElementById('phoneNumber');
    DOM.emailAddress = document.getElementById('emailAddress');
    
    // Resume upload elements
    DOM.resumeUploadArea = document.getElementById('resumeUploadArea');
    DOM.resumeFileInput = document.getElementById('resumeFileInput');
    DOM.uploadPlaceholder = document.getElementById('uploadPlaceholder');
    DOM.resumeStatus = document.getElementById('resumeStatus');
    DOM.resumeName = document.getElementById('resumeName');
    DOM.resumeSize = document.getElementById('resumeSize');
    DOM.removeResumeBtn = document.getElementById('removeResumeBtn');
    DOM.parsingStatus = document.getElementById('parsingStatus');
    
    DOM.roleTitle = document.getElementById('roleTitle');
    DOM.companyName = document.getElementById('companyName');
    DOM.contactPerson = document.getElementById('contactPerson');
    DOM.businessAddress = document.getElementById('businessAddress');
    DOM.refNumber = document.getElementById('refNumber');

    // Job Ad elements
    DOM.jobAdText = document.getElementById('jobAdText');
    DOM.parseJobAdBtn = document.getElementById('parseJobAdBtn');
    DOM.jobAdParseStatus = document.getElementById('jobAdParseStatus');
    DOM.overwriteJobFields = document.getElementById('overwriteJobFields');
    DOM.jobAdUrl = document.getElementById('jobAdUrl');
    DOM.fetchJobAdBtn = document.getElementById('fetchJobAdBtn');
    DOM.aiExtractBtn = document.getElementById('aiExtractBtn');
    DOM.aiGenerateBtn = document.getElementById('aiGenerateBtn');
    
    DOM.categoryUser = document.getElementById('category-user');
    DOM.categoryCrowd = document.getElementById('category-crowd');
    DOM.categoryAi = document.getElementById('category-ai');
    
    // Create response modal
    DOM.createResponseModal = document.getElementById('createResponseModal');
    DOM.modalResponseText = document.getElementById('modalResponseText');
    DOM.modalSaveBtn = document.getElementById('modalSaveBtn');
    DOM.modalCancelBtn = document.getElementById('modalCancelBtn');
    DOM.modalError = document.getElementById('modalError');
    DOM.addUserResponseBtn = document.getElementById('addUserResponseBtn');
    
    // Edit response modal
    DOM.editResponseModal = document.getElementById('editResponseModal');
    DOM.editModalResponseText = document.getElementById('editModalResponseText');
    DOM.editModalSaveBtn = document.getElementById('editModalSaveBtn');
    DOM.editModalCancelBtn = document.getElementById('editModalCancelBtn');
    DOM.editModalError = document.getElementById('editModalError');
    
    DOM.letterArea = document.getElementById('letterArea');
    DOM.newLetterBtn = document.getElementById('newLetterBtn');
    DOM.saveLetterBtn = document.getElementById('saveLetterBtn');
    DOM.downloadPdfBtn = document.getElementById('downloadPdfBtn');
    DOM.themeSelect = document.getElementById('themeSelect');
    DOM.pageSizeSelect = document.getElementById('pageSizeSelect');

    // Preview
    DOM.previewLetterBtn = document.getElementById('previewLetterBtn');
    DOM.letterPreview = document.getElementById('letterPreview');

    // Header/Nav
    DOM.dbStatusBadge = document.getElementById('dbStatusBadge');
    DOM.syncResponsesBtn = document.getElementById('syncResponsesBtn');
    DOM.themeToggleBtn = document.getElementById('themeToggleBtn');
    DOM.authBtn = document.getElementById('authBtn');
    DOM.logoutBtn = document.getElementById('logoutBtn');
    DOM.userBadge = document.getElementById('userBadge');

    // Auth landing (full-screen)
    DOM.authModal = document.getElementById('authLanding') || document.getElementById('authModal');
    DOM.authUsername = document.getElementById('authUsername');
    DOM.authPassword = document.getElementById('authPassword');
    DOM.authCreate = document.getElementById('authCreate');
    DOM.authCancelBtn = document.getElementById('authCancelBtn');
    DOM.authSubmitBtn = document.getElementById('authSubmitBtn');
    DOM.authError = document.getElementById('authError');
    DOM.forgotPasswordBtn = document.getElementById('forgotPasswordBtn');
    
    // Password reset modal
    DOM.resetPasswordModal = document.getElementById('resetPasswordModal');
    DOM.resetUsername = document.getElementById('resetUsername');
    DOM.resetNewPassword = document.getElementById('resetNewPassword');
    DOM.resetConfirmPassword = document.getElementById('resetConfirmPassword');
    DOM.resetSubmitBtn = document.getElementById('resetSubmitBtn');
    DOM.resetCancelBtn = document.getElementById('resetCancelBtn');
    DOM.resetError = document.getElementById('resetError');
  }

  // Application Initialization
  function updateAuthUI() {
    const username = appState.authUser?.username;
    const signedIn = !!username;
    if (signedIn && DOM.userBadge && DOM.logoutBtn && DOM.authBtn) {
      DOM.userBadge.style.display = '';
      DOM.userBadge.textContent = username;
      DOM.logoutBtn.style.display = '';
      DOM.authBtn.style.display = 'none';
    } else {
      if (DOM.userBadge) DOM.userBadge.style.display = 'none';
      if (DOM.logoutBtn) DOM.logoutBtn.style.display = 'none';
      if (DOM.authBtn) DOM.authBtn.style.display = '';
    }
    // Gate the app with the auth landing overlay
    if (DOM.authModal) {
      if (signedIn) {
        DOM.authModal.classList.add('hidden');
      } else {
        DOM.authError && (DOM.authError.textContent = '');
        DOM.authUsername && (DOM.authUsername.value = '');
        DOM.authPassword && (DOM.authPassword.value = '');
        DOM.authCreate && (DOM.authCreate.checked = false);
        DOM.authModal.classList.remove('hidden');
      }
    }
  }

  function showAuthModal() {
    if (!DOM.authModal) return;
    if (DOM.authError) DOM.authError.textContent = '';
    if (DOM.authUsername) DOM.authUsername.value = '';
    if (DOM.authPassword) DOM.authPassword.value = '';
    if (DOM.authCreate) DOM.authCreate.checked = false;
    DOM.authModal.classList.remove('hidden');
  }
  function hideAuthModal() { if (DOM.authModal) DOM.authModal.classList.add('hidden'); }

  async function handleAuthSubmit() {
    try {
      const u = (DOM.authUsername?.value || '').trim();
      const p = (DOM.authPassword?.value || '').trim();
      const create = !!(DOM.authCreate && DOM.authCreate.checked);
      if (DOM.authError) DOM.authError.textContent = '';
      if (u.length < 3 || p.length < 6) {
        if (DOM.authError) DOM.authError.textContent = 'Username min 3 chars, Password min 6 chars';
        return;
      }
      const res = create ? await apiRegister(u, p) : await apiLogin(u, p);
      authToken = res.token;
      appState.authUser = res.user;
      localStorage.setItem('authToken', authToken);
      localStorage.setItem('authUser', JSON.stringify(res.user));
      updateAuthUI();
      hideAuthModal();
      // Load user responses
      await syncResponsesFromDb();
    } catch (e) {
      console.error('Auth error:', e);
      let errorMsg = 'Authentication failed.';
      if (e.message) {
        if (e.message.includes('Invalid credentials')) errorMsg = 'Invalid username or password.';
        else if (e.message.includes('already exists')) errorMsg = 'Username already exists.';
        else if (e.message.includes('fetch')) errorMsg = 'Cannot connect to server. Ensure it is running.';
      }
      if (DOM.authError) DOM.authError.textContent = errorMsg;
    }
  }

  function showResetPasswordModal() {
    if (!DOM.resetPasswordModal) return;
    if (DOM.authModal) DOM.authModal.classList.add('hidden');
    if (DOM.resetError) DOM.resetError.textContent = '';
    if (DOM.resetUsername) DOM.resetUsername.value = '';
    if (DOM.resetNewPassword) DOM.resetNewPassword.value = '';
    if (DOM.resetConfirmPassword) DOM.resetConfirmPassword.value = '';
    DOM.resetPasswordModal.classList.remove('hidden');
  }

  function hideResetPasswordModal() {
    if (DOM.resetPasswordModal) DOM.resetPasswordModal.classList.add('hidden');
    if (DOM.authModal) DOM.authModal.classList.remove('hidden');
  }

  async function handlePasswordReset() {
    try {
      const u = (DOM.resetUsername?.value || '').trim();
      const p1 = (DOM.resetNewPassword?.value || '').trim();
      const p2 = (DOM.resetConfirmPassword?.value || '').trim();
      
      if (DOM.resetError) DOM.resetError.textContent = '';
      
      if (!u || u.length < 3) {
        if (DOM.resetError) DOM.resetError.textContent = 'Please enter your username';
        return;
      }
      
      if (p1.length < 6) {
        if (DOM.resetError) DOM.resetError.textContent = 'Password must be at least 6 characters';
        return;
      }
      
      if (p1 !== p2) {
        if (DOM.resetError) DOM.resetError.textContent = 'Passwords do not match';
        return;
      }
      
      const response = await fetch(`${API_BASE}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: u, newPassword: p1 })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }
      
      // Success
      alert('Password reset successfully! Please sign in with your new password.');
      hideResetPasswordModal();
    } catch (e) {
      console.error('Password reset error:', e);
      let errorMsg = 'Failed to reset password.';
      if (e.message) {
        if (e.message.includes('not found')) errorMsg = 'Username not found.';
        else if (e.message.includes('fetch')) errorMsg = 'Cannot connect to server.';
        else errorMsg = e.message;
      }
      if (DOM.resetError) DOM.resetError.textContent = errorMsg;
    }
  }

  async function handleLogout() {
    try { await apiLogout(); } catch {}
    authToken = null;
    appState.authUser = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    updateAuthUI();
  }

  // Company Names Management
  function loadCompanyNames() {
    const saved = localStorage.getItem('companyNames');
    return saved ? JSON.parse(saved) : [];
  }

  function saveCompanyName(companyName) {
    if (!companyName || companyName.trim().length === 0) return;
    const normalized = companyName.trim();
    let companies = loadCompanyNames();
    
    // Add if not already in list (case-insensitive check)
    if (!companies.some(c => c.toLowerCase() === normalized.toLowerCase())) {
      companies.push(normalized);
      companies.sort(); // Keep alphabetically sorted
      localStorage.setItem('companyNames', JSON.stringify(companies));
      updateCompanyDatalist();
    }
  }

  function updateCompanyDatalist() {
    const datalist = document.getElementById('companyNameList');
    if (!datalist) return;
    
    const companies = loadCompanyNames();
    datalist.innerHTML = companies.map(name => `<option value="${name}"></option>`).join('');
  }

  function setupCompanyNameWatcher() {
    const companyInput = document.getElementById('companyName');
    if (!companyInput) return;
    
    // Save company name when user moves away from the field (blur event)
    companyInput.addEventListener('blur', () => {
      const value = companyInput.value.trim();
      if (value) {
        saveCompanyName(value);
      }
    });
  }

  async function initializeApp() {
    initializeDOM();
    await loadAppState();

    // Theme init
    initializeTheme();

    loadUserProfile();
    loadResumeStatus();
    renderResponses();
    setupLetterBuilder();
    restoreCurrentLetter(); // Restore in-progress letter
    setupResumeUpload();
    setupEventListeners();
    
    // Initialize company names dropdown
    updateCompanyDatalist();
    setupCompanyNameWatcher();

    // Auth UI gate
    updateAuthUI();

    // Check AI status and disable buttons if quota exceeded
    const aiStatus = await checkAiStatus();
    if (aiStatus.quotaExceeded) {
      disableAiButtons();
      if (DOM.jobAdParseStatus) {
        DOM.jobAdParseStatus.textContent = '⚠️ AI features currently unavailable (quota exceeded)';
        DOM.jobAdParseStatus.className = 'job-ad-status error';
      }
    }

    // Update DB status badge initially and periodically
    updateDbStatusBadge();
    setInterval(updateDbStatusBadge, 15000);
    
    console.log('Click Cover Letter Creator initialized successfully!');
  }

  // Start the application when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
  } else {
    initializeApp();
  }

})();