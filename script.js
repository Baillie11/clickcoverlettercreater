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

  // Local Storage Management
  function loadAppState() {
    try {
      const savedProfile = localStorage.getItem('userProfile');
      const savedResponses = localStorage.getItem('responses');
      const savedResume = localStorage.getItem('resumeData');
      
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
    } catch (error) {
      console.error('Error loading app state:', error);
      seedDefaultResponses();
    }
  }

  function saveAppState() {
    try {
      localStorage.setItem('userProfile', JSON.stringify(appState.profile));
      localStorage.setItem('responses', JSON.stringify(appState.responses));
      localStorage.setItem('resumeData', JSON.stringify(appState.resume));
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
    DOM.removeResumeBtn.addEventListener('click', removeResume);
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
    // For Word documents, we'll use a simple text extraction
    // In a real implementation, you might want to use a library like mammoth.js
    const fileReader = new FileReader();
    
    fileReader.onload = function(event) {
      // This is a simplified approach - for production, use mammoth.js or similar
      try {
        let text = event.target.result;
        
        // Remove common Word document artifacts
        text = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '');
        text = text.replace(/\s+/g, ' ');
        
        finishResumeProcessing(text);
      } catch (error) {
        console.error('Error parsing Word document:', error);
        setParsingStatus('error', 'Failed to parse Word document. Please try converting to TXT or PDF format.');
      }
    };

    fileReader.onerror = function() {
      setParsingStatus('error', 'Failed to read Word document.');
    };

    fileReader.readAsText(file);
  }

  function finishResumeProcessing(text) {
    // Clean and store the parsed text
    appState.resume.parsedText = sanitizeText(text);
    
    // Extract keywords and sections
    appState.resume.keywords = extractKeywords(text);
    appState.resume.sections = extractSections(text);
    
    // Save to localStorage
    saveAppState();
    
    // Update UI
    setParsingStatus('success', `Resume parsed successfully! Found ${appState.resume.keywords.length} key skills and qualifications.`);
    
    // Generate AI responses based on resume
    generateResumeBasedResponses();
  }

  function extractKeywords(text) {
    // Common professional keywords to look for
    const skillPatterns = [
      /\b(JavaScript|Python|Java|C\+\+|HTML|CSS|SQL|React|Angular|Vue|Node\.js)\b/gi,
      /\b(project management|leadership|team lead|manager|director|supervisor)\b/gi,
      /\b(Bachelor|Master|PhD|degree|certification|certified|licensed)\b/gi,
      /\b(years? of experience|experience with|expertise in|proficient in|skilled in)\b/gi
    ];
    
    const keywords = new Set();
    
    skillPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => keywords.add(match.toLowerCase()));
      }
    });
    
    return Array.from(keywords).slice(0, 20); // Limit to 20 keywords
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

  function generateResumeBasedResponses() {
    if (!appState.resume.parsedText) return;
    
    // Remove existing resume-based responses to regenerate
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
    
    // Add all generated responses
    appState.responses.push(...resumeResponses);
    
    saveAppState();
    renderResponses();
  }

  function showResumeStatus(file) {
    DOM.uploadPlaceholder.style.display = 'none';
    DOM.resumeStatus.style.display = 'block';
    
    DOM.resumeName.textContent = file.name;
    DOM.resumeSize.textContent = formatFileSize(file.size);
  }

  function setParsingStatus(type, message) {
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

  function loadResumeStatus() {
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
    loadResumeStatus();
    renderResponses();
    setupLetterBuilder();
    setupResumeUpload();
    setupEventListeners();
    
    console.log('Click Cover Letter Creator with Resume Upload initialized successfully!');
  }

  // Start the application when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
  } else {
    initializeApp();
  }

})();