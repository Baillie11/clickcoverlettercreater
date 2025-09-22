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
    
    // Job Information Elements
    roleTitle: null,
    companyName: null,
    contactPerson: null,
    businessAddress: null,
    refNumber: null,
    
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
    downloadPdfBtn: null
  };

  // Application State
  let appState = {
    profile: {},
    responses: [],
    currentLetter: {
      paragraphs: []
    }
  };

  // Utility Functions
  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  function sanitizeText(text) {
    return text.trim().replace(/<[^>]*>/g, '');
  }

  // Local Storage Management
  function loadAppState() {
    try {
      const savedProfile = localStorage.getItem('userProfile');
      const savedResponses = localStorage.getItem('responses');
      
      if (savedProfile) {
        appState.profile = JSON.parse(savedProfile);
      }
      
      if (savedResponses) {
        appState.responses = JSON.parse(savedResponses);
      } else {
        // First time - seed with default responses
        seedDefaultResponses();
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
  function loadUserProfile() {
    DOM.firstName.value = appState.profile.firstName || '';
    DOM.lastName.value = appState.profile.lastName || '';
    DOM.addressLine1.value = appState.profile.addressLine1 || '';
    DOM.addressLine2.value = appState.profile.addressLine2 || '';
  }

  function saveUserProfile() {
    appState.profile = {
      firstName: sanitizeText(DOM.firstName.value),
      lastName: sanitizeText(DOM.lastName.value),
      addressLine1: sanitizeText(DOM.addressLine1.value),
      addressLine2: sanitizeText(DOM.addressLine2.value)
    };
    saveAppState();
  }

  // Response Management
  function renderResponses() {
    // Clear existing responses
    DOM.categoryUser.innerHTML = '<h3>User Created</h3>';
    DOM.categoryCrowd.innerHTML = '<h3>Crowd Sourced</h3>';
    DOM.categoryAi.innerHTML = '<h3>AI Generated</h3>';

    appState.responses.forEach(response => {
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
    
    // Add edit/delete controls for user-created responses
    if (response.userCreated) {
      const controlsEl = document.createElement('div');
      controlsEl.className = 'response-controls';
      
      const editBtn = document.createElement('button');
      editBtn.textContent = '✏️';
      editBtn.title = 'Edit';
      editBtn.onclick = (e) => {
        e.stopPropagation();
        editResponse(response.id, responseEl);
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

  function addResponse() {
    const text = sanitizeText(DOM.newResponseText.value);
    if (!text) {
      alert('Please enter some response text.');
      return;
    }
    
    const newResponse = {
      id: generateId(),
      text: text,
      category: 'user',
      userCreated: true
    };
    
    appState.responses.push(newResponse);
    saveAppState();
    renderResponses();
    
    DOM.newResponseText.value = '';
  }

  function editResponse(responseId, responseEl) {
    const response = appState.responses.find(r => r.id === responseId);
    if (!response) return;
    
    responseEl.classList.add('editing');
    
    const textEl = responseEl.querySelector('p');
    const currentText = textEl.textContent;
    
    const textarea = document.createElement('textarea');
    textarea.value = currentText;
    
    const saveBtn = document.createElement('button');
    saveBtn.textContent = 'Save';
    saveBtn.className = 'save-edit-btn';
    saveBtn.onclick = () => {
      const newText = sanitizeText(textarea.value);
      if (newText) {
        response.text = newText;
        saveAppState();
        renderResponses();
      }
    };
    
    textEl.style.display = 'none';
    responseEl.appendChild(textarea);
    responseEl.appendChild(saveBtn);
    
    textarea.focus();
    textarea.select();
  }

  function deleteResponse(responseId) {
    if (confirm('Are you sure you want to delete this response?')) {
      appState.responses = appState.responses.filter(r => r.id !== responseId);
      saveAppState();
      renderResponses();
    }
  }

  // Letter Builder
  function setupLetterBuilder() {
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
    paragraphEl.textContent = response.text;
    
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

  // PDF Export (Enhanced)
  function downloadPdf() {
    const profile = appState.profile;
    const fullName = `${profile.firstName || ''} ${profile.lastName || ''}`.trim();
    const today = new Date().toISOString().split('T')[0];
    const jobTitle = sanitizeText(DOM.roleTitle.value);
    const companyName = sanitizeText(DOM.companyName.value);
    const contactPerson = sanitizeText(DOM.contactPerson.value);
    const businessAddress = sanitizeText(DOM.businessAddress.value);
    const refNumber = sanitizeText(DOM.refNumber.value);

    const fileName = `${fullName} - ${jobTitle} - ${companyName} - ${today}`
      .replace(/[^\w\d\- ]+/g, '')
      .replace(/\s+/g, ' ')
      .trim() + '.pdf';

    const printEl = document.createElement('div');
    printEl.style.padding = '20px';
    printEl.style.background = 'white';
    printEl.style.color = '#000';
    printEl.style.fontFamily = 'Segoe UI, sans-serif';
    printEl.style.lineHeight = '1.5';
    printEl.style.fontSize = '12pt';

    // User profile block
    if (fullName) printEl.appendChild(Object.assign(document.createElement('p'), { innerText: fullName }));
    if (profile.addressLine1) printEl.appendChild(Object.assign(document.createElement('p'), { innerText: profile.addressLine1 }));
    if (profile.addressLine2) printEl.appendChild(Object.assign(document.createElement('p'), { innerText: profile.addressLine2 }));

    printEl.appendChild(document.createElement('br'));

    // Job Info block (only if data exists)
    if (companyName) printEl.appendChild(Object.assign(document.createElement('p'), { innerText: `Company: ${companyName}` }));
    if (jobTitle) printEl.appendChild(Object.assign(document.createElement('p'), { innerText: `Role: ${jobTitle}` }));
    if (contactPerson) printEl.appendChild(Object.assign(document.createElement('p'), { innerText: `Contact: ${contactPerson}` }));
    if (businessAddress) printEl.appendChild(Object.assign(document.createElement('p'), { innerText: `Address: ${businessAddress}` }));
    if (refNumber) printEl.appendChild(Object.assign(document.createElement('p'), { innerText: `Reference No: ${refNumber}` }));

    printEl.appendChild(document.createElement('br'));

    // Salutation
    const salutationP = document.createElement('p');
    salutationP.style.marginBottom = '16px';
    
    if (contactPerson && contactPerson.trim()) {
      // Use contact person's name
      salutationP.innerText = `Dear ${contactPerson.trim()},`;
    } else if (companyName && companyName.trim()) {
      // Use company-specific default
      salutationP.innerText = 'Dear Hiring Manager,';
    } else {
      // Generic default
      salutationP.innerText = 'Dear Recruitment Officer,';
    }
    
    printEl.appendChild(salutationP);

    // Letter paragraphs
    const paras = DOM.letterArea.querySelectorAll('.letter-paragraph');
    paras.forEach(para => {
      const p = document.createElement('p');
      p.innerText = para.textContent.replace('×', ''); // Remove the × button text
      p.style.marginBottom = '12px';
      printEl.appendChild(p);
    });

    // Signature
    if (fullName) {
      const signatureP = document.createElement('p');
      signatureP.style.marginTop = '30px';
      signatureP.innerText = `Sincerely,\n${fullName}`;
      printEl.appendChild(signatureP);
    }

    const opt = {
      margin: 0.5,
      filename: fileName,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(printEl).save();
  }

  // Event Listeners Setup
  function setupEventListeners() {
    // Profile auto-save on input
    [DOM.firstName, DOM.lastName, DOM.addressLine1, DOM.addressLine2].forEach(input => {
      input.addEventListener('blur', saveUserProfile);
    });
    
    // Job info changes - update salutation preview
    [DOM.contactPerson, DOM.companyName].forEach(input => {
      input.addEventListener('input', updateSalutationPreview);
      input.addEventListener('blur', updateSalutationPreview);
    });
    
    // Response management
    DOM.addResponseBtn.addEventListener('click', addResponse);
    DOM.newResponseText.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && e.ctrlKey) {
        addResponse();
      }
    });
    
    // Letter actions
    DOM.newLetterBtn.addEventListener('click', newLetter);
    DOM.saveLetterBtn.addEventListener('click', saveLetterLocally);
    DOM.downloadPdfBtn.addEventListener('click', downloadPdf);
  }

  // Initialize DOM Elements
  function initializeDOM() {
    DOM.firstName = document.getElementById('firstName');
    DOM.lastName = document.getElementById('lastName');
    DOM.addressLine1 = document.getElementById('addressLine1');
    DOM.addressLine2 = document.getElementById('addressLine2');
    
    DOM.roleTitle = document.getElementById('roleTitle');
    DOM.companyName = document.getElementById('companyName');
    DOM.contactPerson = document.getElementById('contactPerson');
    DOM.businessAddress = document.getElementById('businessAddress');
    DOM.refNumber = document.getElementById('refNumber');
    
    DOM.categoryUser = document.getElementById('category-user');
    DOM.categoryCrowd = document.getElementById('category-crowd');
    DOM.categoryAi = document.getElementById('category-ai');
    DOM.newResponseText = document.getElementById('newResponseText');
    DOM.addResponseBtn = document.getElementById('addResponseBtn');
    
    DOM.letterArea = document.getElementById('letterArea');
    DOM.newLetterBtn = document.getElementById('newLetterBtn');
    DOM.saveLetterBtn = document.getElementById('saveLetterBtn');
    DOM.downloadPdfBtn = document.getElementById('downloadPdfBtn');
  }

  // Application Initialization
  function initializeApp() {
    initializeDOM();
    loadAppState();
    loadUserProfile();
    renderResponses();
    setupLetterBuilder();
    setupEventListeners();
    
    console.log('Click Cover Letter Creator initialized successfully!');
  }

  // Start the application when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
  } else {
    initializeApp();
  }

})();