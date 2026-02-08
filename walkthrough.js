/**
 * VitaePro Interactive Walkthrough Guide
 * 
 * Provides step-by-step tutorials for each page of the application.
 * Automatically shows on first login, can be triggered manually via button.
 */

(function() {
  'use strict';

  // Walkthrough state
  let currentStep = 0;
  let currentWalkthrough = null;
  let isActive = false;
  let overlay = null;
  let tooltip = null;
  let highlightBox = null;

  // Check if user has completed walkthrough for a specific page
  function hasCompletedWalkthrough(page) {
    const completed = JSON.parse(localStorage.getItem('walkthroughCompleted') || '{}');
    return completed[page] === true;
  }

  // Mark walkthrough as completed for a page
  function markWalkthroughCompleted(page) {
    const completed = JSON.parse(localStorage.getItem('walkthroughCompleted') || '{}');
    completed[page] = true;
    localStorage.setItem('walkthroughCompleted', JSON.stringify(completed));
  }

  // Reset all walkthroughs (for testing or user request)
  function resetAllWalkthroughs() {
    localStorage.removeItem('walkthroughCompleted');
  }

  // Walkthrough definitions for each page
  const walkthroughs = {
    app: {
      title: 'Welcome to VitaePro!',
      steps: [
        {
          title: 'Welcome to Your Cover Letter Creator',
          content: 'VitaePro helps you create professional cover letters quickly using reusable paragraphs. Let\'s take a quick tour!',
          target: null, // No specific target, general intro
          position: 'center'
        },
        {
          title: 'Response Library',
          content: 'This is your response library. It contains reusable paragraphs organized into three categories: <strong>User Created</strong> (your own), <strong>Crowd Sourced</strong> (from other users), and <strong>AI Generated</strong> (created by AI).',
          target: '.response-panel',
          position: 'right'
        },
        {
          title: 'Search Responses',
          content: 'Use this search box to quickly find responses by keywords or tags. Try searching for "experience" or "skills".',
          target: '#responseSearchInput',
          position: 'bottom'
        },
        {
          title: 'Toggle Categories',
          content: 'Click these toggle buttons (▼/▶) to show or hide each category. This helps you focus on the responses you need.',
          target: '.toggle-category-btn',
          position: 'bottom'
        },
        {
          title: 'Add Your Own Response',
          content: 'Click the <strong>+</strong> button to create your own reusable paragraph. You can use it across multiple cover letters!',
          target: '#addUserResponseBtn',
          position: 'bottom'
        },
        {
          title: 'Job Information',
          content: 'Enter details about the job you\'re applying for. VitaePro will use this information in your cover letter header.',
          target: '.job-info',
          position: 'bottom'
        },
        {
          title: 'AI Generate',
          content: 'Click this button to generate tailored responses using AI. Just paste the job ad, and AI will create relevant paragraphs for you!',
          target: '#aiGenerateBtn',
          position: 'bottom'
        },
        {
          title: 'Building Your Letter',
          content: 'This is your letter building area. <strong>Drag responses</strong> from the left panel and drop them here to build your cover letter.',
          target: '.letter-drop-area',
          position: 'top'
        },
        {
          title: 'Reorder Paragraphs',
          content: 'Once paragraphs are in your letter, you can drag them to reorder. Click inside any paragraph to edit the text directly.',
          target: '.letter-drop-area',
          position: 'top'
        },
        {
          title: 'Preview & Download',
          content: 'Click <strong>Preview</strong> to see your formatted letter, then <strong>Download as PDF</strong> when ready. You can also save drafts to continue later.',
          target: '.letter-actions',
          position: 'top'
        },
        {
          title: 'Choose Your Theme',
          content: 'Select from 6 professional letter themes and customize the page size (A4 or Letter).',
          target: '#themeSelect',
          position: 'top'
        },
        {
          title: 'You\'re Ready!',
          content: 'That\'s it! Start by entering job details, then drag responses to build your letter. Click the <strong>?</strong> button in the navigation to replay this guide anytime.',
          target: null,
          position: 'center'
        }
      ]
    },

    profile: {
      title: 'Your Profile',
      steps: [
        {
          title: 'Profile Page',
          content: 'Your profile information is used to personalize your cover letters. Let\'s set it up!',
          target: null,
          position: 'center'
        },
        {
          title: 'Personal Information',
          content: 'Enter your name and contact details. This information will appear in the header of every cover letter you create.',
          target: '.profile-section:first-child',
          position: 'right'
        },
        {
          title: 'Address Details',
          content: 'Add your full address. VitaePro uses this for the sender\'s address in your cover letters.',
          target: '.profile-section:nth-child(2)',
          position: 'right'
        },
        {
          title: 'Industry & Keywords',
          content: 'Select your industry and add up to 3 keywords that describe your expertise. These help organize and tag your responses.',
          target: '#industry',
          position: 'bottom'
        },
        {
          title: 'Upload Your Resume',
          content: 'Upload your resume (PDF or DOCX). VitaePro will extract your information to auto-fill your profile and help AI generate better responses.',
          target: '#resumeUploadArea',
          position: 'left'
        },
        {
          title: 'Sharing Preferences',
          content: 'Choose whether to share your responses with the community. Shared responses help other users (anonymously) and appear in the Crowd Sourced library.',
          target: '#shareResponsesCheckbox',
          position: 'left'
        },
        {
          title: 'Save Your Changes',
          content: 'Don\'t forget to click <strong>Save Profile</strong> after making changes. Your information is stored securely and used only for your cover letters.',
          target: '.profile-actions button',
          position: 'top'
        },
        {
          title: 'Profile Complete!',
          content: 'Your profile is set up! Head to the <strong>Create Letter</strong> page to start building your first cover letter.',
          target: null,
          position: 'center'
        }
      ]
    },

    dashboard: {
      title: 'Your Dashboard',
      steps: [
        {
          title: 'Application Dashboard',
          content: 'Track all your job applications in one place. Let\'s explore how to use your dashboard effectively.',
          target: null,
          position: 'center'
        },
        {
          title: 'Your Statistics',
          content: 'See your job search progress at a glance: total applications, pending responses, interviews scheduled, and offers received.',
          target: '.stats-grid',
          position: 'bottom'
        },
        {
          title: 'Add New Application',
          content: 'Click here to record a new job application. Track the company, role, application date, and current status.',
          target: '.add-application-btn',
          position: 'bottom'
        },
        {
          title: 'Filter Applications',
          content: 'Filter your applications by status: All, Pending, Interviewing, or Offer. This helps you focus on what needs your attention.',
          target: '.filter-buttons',
          position: 'bottom'
        },
        {
          title: 'Sort Your Applications',
          content: 'Sort applications by date (newest/oldest), company name, or status. Stay organized as your job search grows!',
          target: '#sortApplications',
          position: 'bottom'
        },
        {
          title: 'Application Details',
          content: 'Each application card shows the company, role, dates, and status. Click the <strong>eye icon</strong> to view details, or the <strong>edit/trash icons</strong> to update or delete.',
          target: '.application-card',
          position: 'left'
        },
        {
          title: 'Status Updates',
          content: 'Update application status as you progress: Applied → Interview → Offer → Rejected. This helps you track your job search pipeline.',
          target: '.application-card .status-badge',
          position: 'left'
        },
        {
          title: 'Dashboard Ready!',
          content: 'You\'re all set! Use your dashboard to stay organized and track every application. Good luck with your job search!',
          target: null,
          position: 'center'
        }
      ]
    }
  };

  // Create overlay and tooltip elements
  function createWalkthroughUI() {
    // Dark overlay
    overlay = document.createElement('div');
    overlay.className = 'walkthrough-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.7);
      z-index: 9998;
      display: none;
    `;
    document.body.appendChild(overlay);

    // Highlight box
    highlightBox = document.createElement('div');
    highlightBox.className = 'walkthrough-highlight';
    highlightBox.style.cssText = `
      position: fixed;
      border: 3px solid #667eea;
      border-radius: 8px;
      box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.7), 0 0 20px rgba(102, 126, 234, 0.5);
      z-index: 9999;
      pointer-events: none;
      display: none;
      transition: all 0.3s ease;
    `;
    document.body.appendChild(highlightBox);

    // Tooltip
    tooltip = document.createElement('div');
    tooltip.className = 'walkthrough-tooltip';
    tooltip.style.cssText = `
      position: fixed;
      background: white;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
      padding: 24px;
      max-width: 400px;
      z-index: 10000;
      display: none;
    `;
    tooltip.innerHTML = `
      <div class="walkthrough-header">
        <h3 class="walkthrough-title" style="margin: 0 0 8px 0; font-size: 1.25rem; color: #333;"></h3>
        <div class="walkthrough-progress" style="font-size: 0.875rem; color: #666; margin-bottom: 16px;"></div>
      </div>
      <div class="walkthrough-content" style="font-size: 1rem; line-height: 1.6; color: #444; margin-bottom: 20px;"></div>
      <div class="walkthrough-actions" style="display: flex; justify-content: space-between; align-items: center; gap: 12px;">
        <button class="walkthrough-skip" style="background: none; border: none; color: #666; cursor: pointer; font-size: 0.875rem; padding: 8px 12px;">Skip Tour</button>
        <div style="display: flex; gap: 8px;">
          <button class="walkthrough-prev" style="background: #e5e7eb; border: none; color: #333; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: 500; display: none;">Previous</button>
          <button class="walkthrough-next" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border: none; color: white; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: 500;">Next</button>
        </div>
      </div>
    `;
    document.body.appendChild(tooltip);

    // Event listeners
    tooltip.querySelector('.walkthrough-next').addEventListener('click', nextStep);
    tooltip.querySelector('.walkthrough-prev').addEventListener('click', prevStep);
    tooltip.querySelector('.walkthrough-skip').addEventListener('click', endWalkthrough);
  }

  // Position tooltip relative to target element
  function positionTooltip(target, position) {
    if (!target) {
      // Center on screen
      tooltip.style.top = '50%';
      tooltip.style.left = '50%';
      tooltip.style.transform = 'translate(-50%, -50%)';
      highlightBox.style.display = 'none';
      overlay.style.display = 'block';
      return;
    }

    const rect = target.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    const padding = 20;

    // Show and position highlight box
    highlightBox.style.display = 'block';
    highlightBox.style.top = `${rect.top - 8}px`;
    highlightBox.style.left = `${rect.left - 8}px`;
    highlightBox.style.width = `${rect.width + 16}px`;
    highlightBox.style.height = `${rect.height + 16}px`;

    // Position tooltip based on preference
    let top, left;
    tooltip.style.transform = 'none';

    switch (position) {
      case 'top':
        top = rect.top - tooltipRect.height - padding;
        left = rect.left + rect.width / 2 - tooltipRect.width / 2;
        break;
      case 'bottom':
        top = rect.bottom + padding;
        left = rect.left + rect.width / 2 - tooltipRect.width / 2;
        break;
      case 'left':
        top = rect.top + rect.height / 2 - tooltipRect.height / 2;
        left = rect.left - tooltipRect.width - padding;
        break;
      case 'right':
        top = rect.top + rect.height / 2 - tooltipRect.height / 2;
        left = rect.right + padding;
        break;
      default:
        top = rect.bottom + padding;
        left = rect.left + rect.width / 2 - tooltipRect.width / 2;
    }

    // Keep tooltip within viewport
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    if (left < padding) left = padding;
    if (left + tooltipRect.width > viewportWidth - padding) {
      left = viewportWidth - tooltipRect.width - padding;
    }
    if (top < padding) top = padding;
    if (top + tooltipRect.height > viewportHeight - padding) {
      top = viewportHeight - tooltipRect.height - padding;
    }

    tooltip.style.top = `${top}px`;
    tooltip.style.left = `${left}px`;

    // Scroll element into view if needed
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  // Show a specific step
  function showStep(stepIndex) {
    const walkthrough = currentWalkthrough;
    if (!walkthrough || stepIndex < 0 || stepIndex >= walkthrough.steps.length) {
      return;
    }

    currentStep = stepIndex;
    const step = walkthrough.steps[stepIndex];

    // Update tooltip content
    tooltip.querySelector('.walkthrough-title').textContent = step.title;
    tooltip.querySelector('.walkthrough-progress').textContent = 
      `Step ${stepIndex + 1} of ${walkthrough.steps.length}`;
    tooltip.querySelector('.walkthrough-content').innerHTML = step.content;

    // Update button visibility
    const prevBtn = tooltip.querySelector('.walkthrough-prev');
    const nextBtn = tooltip.querySelector('.walkthrough-next');
    
    prevBtn.style.display = stepIndex > 0 ? 'block' : 'none';
    nextBtn.textContent = stepIndex === walkthrough.steps.length - 1 ? 'Finish' : 'Next';

    // Show UI
    overlay.style.display = 'block';
    tooltip.style.display = 'block';

    // Position tooltip
    const target = step.target ? document.querySelector(step.target) : null;
    positionTooltip(target, step.position);
  }

  // Navigate to next step
  function nextStep() {
    if (currentStep < currentWalkthrough.steps.length - 1) {
      showStep(currentStep + 1);
    } else {
      endWalkthrough(true);
    }
  }

  // Navigate to previous step
  function prevStep() {
    if (currentStep > 0) {
      showStep(currentStep - 1);
    }
  }

  // End walkthrough
  function endWalkthrough(completed = false) {
    if (completed && currentWalkthrough) {
      markWalkthroughCompleted(currentWalkthrough.page);
    }

    isActive = false;
    currentWalkthrough = null;
    currentStep = 0;

    if (overlay) overlay.style.display = 'none';
    if (tooltip) tooltip.style.display = 'none';
    if (highlightBox) highlightBox.style.display = 'none';
  }

  // Start walkthrough for a specific page
  function startWalkthrough(page) {
    const walkthrough = walkthroughs[page];
    if (!walkthrough) {
      console.warn(`No walkthrough defined for page: ${page}`);
      return;
    }

    if (isActive) {
      endWalkthrough();
    }

    currentWalkthrough = { ...walkthrough, page };
    currentStep = 0;
    isActive = true;

    // Create UI if not exists
    if (!overlay) {
      createWalkthroughUI();
    }

    showStep(0);
  }

  // Auto-start walkthrough on first visit
  function autoStartWalkthrough() {
    // Determine current page
    const path = window.location.pathname;
    let page = 'app';
    if (path.includes('profile.html')) page = 'profile';
    if (path.includes('dashboard.html')) page = 'dashboard';

    // Check if user has seen this walkthrough
    if (!hasCompletedWalkthrough(page)) {
      // Wait for page to fully load
      setTimeout(() => {
        startWalkthrough(page);
      }, 1000);
    }
  }

  // Add help button to navigation
  function addHelpButton() {
    // Wait for nav to be available
    setTimeout(() => {
      const nav = document.querySelector('.app-nav .nav-right');
      if (!nav) return;

      // Check if button already exists
      if (document.getElementById('walkthroughHelpBtn')) return;

      const helpBtn = document.createElement('button');
      helpBtn.id = 'walkthroughHelpBtn';
      helpBtn.className = 'help-btn';
      helpBtn.innerHTML = '❓';
      helpBtn.title = 'Show guide';
      helpBtn.style.cssText = `
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border: none;
        color: white;
        width: 36px;
        height: 36px;
        border-radius: 50%;
        cursor: pointer;
        font-size: 1.25rem;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-left: 12px;
        box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
        transition: all 0.2s ease;
      `;

      helpBtn.addEventListener('mouseenter', () => {
        helpBtn.style.transform = 'scale(1.1)';
        helpBtn.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
      });

      helpBtn.addEventListener('mouseleave', () => {
        helpBtn.style.transform = 'scale(1)';
        helpBtn.style.boxShadow = '0 2px 8px rgba(102, 126, 234, 0.3)';
      });

      helpBtn.addEventListener('click', () => {
        const path = window.location.pathname;
        let page = 'app';
        if (path.includes('profile.html')) page = 'profile';
        if (path.includes('dashboard.html')) page = 'dashboard';
        startWalkthrough(page);
      });

      nav.appendChild(helpBtn);
    }, 500);
  }

  // Handle window resize
  window.addEventListener('resize', () => {
    if (isActive && currentWalkthrough) {
      const step = currentWalkthrough.steps[currentStep];
      const target = step.target ? document.querySelector(step.target) : null;
      positionTooltip(target, step.position);
    }
  });

  // Public API
  window.VitaeProWalkthrough = {
    start: startWalkthrough,
    end: endWalkthrough,
    reset: resetAllWalkthroughs,
    hasCompleted: hasCompletedWalkthrough
  };

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      addHelpButton();
      autoStartWalkthrough();
    });
  } else {
    addHelpButton();
    autoStartWalkthrough();
  }

})();
