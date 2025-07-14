const appState = {
  theme: localStorage.getItem('theme') || 'light',
  currentSection: 'about',
  isMenuOpen: false,
  isLoading: true,
  formData: {
    name: '',
    email: '',
    phone: '',
    projectType: '',
    budget: '',
    services: [],
    message: '',
    timeline: 8,
    startDate: ''
  },
  formErrors: {},
  skillsActiveTab: 'frontend',
  projectsFilter: 'all',
  scrollProgress: 0
};


function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj);
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  if (typeof obj === 'object') {
    const clonedObj = {};
    for (let key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
}

function updateState(newState) {
  Object.assign(appState, newState);
  console.log('State updated:', newState);
}


function safeQuerySelector(selector, context = document) {
  try {
    return context.querySelector(selector);
  } catch (error) {
    console.error(`Invalid selector: ${selector}`, error);
    return null;
  }
}

function safeQuerySelectorAll(selector, context = document) {
  try {
    return context.querySelectorAll(selector);
  } catch (error) {
    console.error(`Invalid selector: ${selector}`, error);
    return [];
  }
}

const eventListeners = new Map();

function addEventListenerWithCleanup(element, event, handler, options = {}) {
  if (!element) return;
  
  element.addEventListener(event, handler, options);
  
  if (!eventListeners.has(element)) {
    eventListeners.set(element, []);
  }
  eventListeners.get(element).push({ event, handler, options });
}

function removeAllEventListeners(element) {
  if (!eventListeners.has(element)) return;
  
  const listeners = eventListeners.get(element);
  listeners.forEach(({ event, handler, options }) => {
    element.removeEventListener(event, handler, options);
  });
  eventListeners.delete(element);
}


function showLoading() {
  const loadingScreen = safeQuerySelector('.loading-screen');
  if (loadingScreen) {
    loadingScreen.classList.remove('hidden');
    updateState({ isLoading: true });
  }
}

function hideLoading() {
  const loadingScreen = safeQuerySelector('.loading-screen');
  if (loadingScreen) {
    loadingScreen.style.animation = 'fadeOut 0.5s ease-in-out forwards';
    setTimeout(() => {
      loadingScreen.classList.add('hidden');
      updateState({ isLoading: false });
    }, 500);
  }
}

async function initializeApp() {
  try {
    showLoading();
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await Promise.all([
      initializeTheme(),
      initializeNavigation(),
      initializeSkillsTabs(),
      initializeProjectFilters(),
      initializeForm(),
      initializeScrollEffects(),
      initializeCanvasAnimations()
    ]);
    
    hideLoading();
    console.log('App initialized successfully');
  } catch (error) {
    console.error('App initialization failed:', error);
    hideLoading();
  }
}


function initializeTheme() {
  const themeToggle = safeQuerySelector('.theme-toggle');
  const currentTheme = appState.theme;
  
  document.documentElement.setAttribute('data-theme', currentTheme);
  
  if (themeToggle) {
    addEventListenerWithCleanup(themeToggle, 'click', toggleTheme);
  }
  
  if (window.matchMedia) {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    addEventListenerWithCleanup(mediaQuery, 'change', handleSystemThemeChange);
  }
}

function toggleTheme() {
  const newTheme = appState.theme === 'light' ? 'dark' : 'light';
  setTheme(newTheme);
}

function setTheme(theme) {
  document.documentElement.classList.add('theme-transition');
  
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
  updateState({ theme });
  
  setTimeout(() => {
    document.documentElement.classList.remove('theme-transition');
  }, 300);
  
  window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme } }));
}

function handleSystemThemeChange(e) {
  if (appState.theme === 'auto') {
    const systemTheme = e.matches ? 'dark' : 'light';
    setTheme(systemTheme);
  }
}


function initializeNavigation() {
  const mobileToggle = safeQuerySelector('.mobile-menu-toggle');
  const navList = safeQuerySelector('.nav-list');
  const navLinks = safeQuerySelectorAll('.nav-list a');
  
  if (mobileToggle) {
    addEventListenerWithCleanup(mobileToggle, 'click', toggleMobileMenu);
  }
  
  navLinks.forEach(link => {
    addEventListenerWithCleanup(link, 'click', handleNavClick);
  });
  
  addEventListenerWithCleanup(document, 'click', handleDocumentClick);
  
  addEventListenerWithCleanup(document, 'keydown', handleEscapeKey);
}

function toggleMobileMenu() {
  const navList = safeQuerySelector('.nav-list');
  const mobileToggle = safeQuerySelector('.mobile-menu-toggle');
  
  if (navList && mobileToggle) {
    const isOpen = navList.classList.contains('active');
    
    if (isOpen) {
      closeMobileMenu();
    } else {
      openMobileMenu();
    }
  }
}

function openMobileMenu() {
  const navList = safeQuerySelector('.nav-list');
  const mobileToggle = safeQuerySelector('.mobile-menu-toggle');
  
  if (navList && mobileToggle) {
    navList.classList.add('active');
    mobileToggle.setAttribute('aria-expanded', 'true');
    updateState({ isMenuOpen: true });
    
    const lines = mobileToggle.querySelectorAll('.hamburger-line');
    lines.forEach((line, index) => {
      line.style.transform = index === 0 ? 'rotate(45deg) translateY(6px)' :
                            index === 1 ? 'opacity(0)' :
                            'rotate(-45deg) translateY(-6px)';
    });
  }
}

function closeMobileMenu() {
  const navList = safeQuerySelector('.nav-list');
  const mobileToggle = safeQuerySelector('.mobile-menu-toggle');
  
  if (navList && mobileToggle) {
    navList.classList.remove('active');
    mobileToggle.setAttribute('aria-expanded', 'false');
    updateState({ isMenuOpen: false });
    
    const lines = mobileToggle.querySelectorAll('.hamburger-line');
    lines.forEach(line => {
      line.style.transform = '';
    });
  }
}

function handleNavClick(event) {
  event.preventDefault();
  const targetId = event.target.getAttribute('href');
  const targetSection = safeQuerySelector(targetId);
  
  if (targetSection) {
    targetSection.scrollIntoView({ 
      behavior: 'smooth',
      block: 'start'
    });
    
    updateActiveNavigation(targetId.substring(1));
    
    if (appState.isMenuOpen) {
      closeMobileMenu();
    }
  }
}

function updateActiveNavigation(sectionId) {
  const navLinks = safeQuerySelectorAll('.nav-list a');
  
  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href === `#${sectionId}`) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
  
  updateState({ currentSection: sectionId });
}

function handleDocumentClick(event) {
  const navList = safeQuerySelector('.nav-list');
  const mobileToggle = safeQuerySelector('.mobile-menu-toggle');
  
  if (appState.isMenuOpen && navList && mobileToggle) {
    if (!navList.contains(event.target) && !mobileToggle.contains(event.target)) {
      closeMobileMenu();
    }
  }
}

function handleEscapeKey(event) {
  if (event.key === 'Escape') {
    if (appState.isMenuOpen) {
      closeMobileMenu();
    }
    
    const modal = safeQuerySelector('.modal:not(.hidden)');
    if (modal) {
      closeModal();
    }
  }
}


function initializeSkillsTabs() {
  const tabButtons = safeQuerySelectorAll('.tab-button');
  const tabPanels = safeQuerySelectorAll('.tab-panel');
  
  tabButtons.forEach(button => {
    addEventListenerWithCleanup(button, 'click', handleTabClick);
  });
  
  showTab(appState.skillsActiveTab);
}

function handleTabClick(event) {
  const tabId = event.target.getAttribute('data-tab');
  showTab(tabId);
}

function showTab(tabId) {
  const tabButtons = safeQuerySelectorAll('.tab-button');
  const tabPanels = safeQuerySelectorAll('.tab-panel');
  
  tabButtons.forEach(button => {
    const buttonTabId = button.getAttribute('data-tab');
    if (buttonTabId === tabId) {
      button.classList.add('active');
      button.setAttribute('aria-selected', 'true');
    } else {
      button.classList.remove('active');
      button.setAttribute('aria-selected', 'false');
    }
  });
  
  tabPanels.forEach(panel => {
    if (panel.id === tabId) {
      panel.classList.add('active');
      panel.setAttribute('aria-hidden', 'false');
    } else {
      panel.classList.remove('active');
      panel.setAttribute('aria-hidden', 'true');
    }
  });
  
  updateState({ skillsActiveTab: tabId });
}


function initializeProjectFilters() {
  const filterButtons = safeQuerySelectorAll('.filter-btn');
  const projectCards = safeQuerySelectorAll('.project-card');
  
  filterButtons.forEach(button => {
    addEventListenerWithCleanup(button, 'click', handleFilterClick);
  });
  
  filterProjects('all');
}

function handleFilterClick(event) {
  const filter = event.target.getAttribute('data-filter');
  filterProjects(filter);
}

function filterProjects(filter) {
  const filterButtons = safeQuerySelectorAll('.filter-btn');
  const projectCards = safeQuerySelectorAll('.project-card');
  
  filterButtons.forEach(button => {
    const buttonFilter = button.getAttribute('data-filter');
    if (buttonFilter === filter) {
      button.classList.add('active');
    } else {
      button.classList.remove('active');
    }
  });
  
  projectCards.forEach((card, index) => {
    const category = card.getAttribute('data-category');
    const shouldShow = filter === 'all' || category === filter;
    
    if (shouldShow) {
      card.style.display = 'block';
      card.style.opacity = '0';
      card.style.transform = 'translateY(20px)';
      
      setTimeout(() => {
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
      }, index * 100);
    } else {
      card.style.opacity = '0';
      card.style.transform = 'translateY(20px)';
      
      setTimeout(() => {
        card.style.display = 'none';
      }, 300);
    }
  });
  
  updateState({ projectsFilter: filter });
}


function initializeForm() {
  const form = safeQuerySelector('.contact-form');
  const inputs = safeQuerySelectorAll('.form-input, .form-select, .form-textarea');
  const radioInputs = safeQuerySelectorAll('.radio-input');
  const checkboxInputs = safeQuerySelectorAll('.checkbox-input');
  const rangeInput = safeQuerySelector('.range-input');
  
  if (form) {
    addEventListenerWithCleanup(form, 'submit', handleSubmit);
    addEventListenerWithCleanup(form, 'reset', handleFormReset);
  }
  
  inputs.forEach(input => {
    addEventListenerWithCleanup(input, 'input', handleInputChange);
    addEventListenerWithCleanup(input, 'blur', handleInputBlur);
    addEventListenerWithCleanup(input, 'focus', handleInputFocus);
  });
  
  radioInputs.forEach(input => {
    addEventListenerWithCleanup(input, 'change', handleRadioChange);
  });
  
  checkboxInputs.forEach(input => {
    addEventListenerWithCleanup(input, 'change', handleCheckboxChange);
  });
  
  if (rangeInput) {
    addEventListenerWithCleanup(rangeInput, 'input', handleRangeChange);
  }
  
  const startDateInput = safeQuerySelector('#start-date');
  if (startDateInput) {
    const today = new Date().toISOString().split('T')[0];
    startDateInput.setAttribute('min', today);
  }
}

async function handleSubmit(event) {
  event.preventDefault();
  
  const isValid = await validateForm();
  if (!isValid) return false;
  
  const submitBtn = safeQuerySelector('.submit-btn');
  const btnText = safeQuerySelector('.btn-text');
  const btnLoader = safeQuerySelector('.btn-loader');
  
  if (submitBtn && btnText && btnLoader) {
    submitBtn.disabled = true;
    btnText.style.opacity = '0';
    btnLoader.classList.remove('hidden');
  }
  
  try {
    await submitFormData(appState.formData);
    
    showNotification('Thank you! Your message has been sent successfully.', 'success');
    
    event.target.reset();
    resetFormState();
    
  } catch (error) {
    console.error('Form submission error:', error);
    showNotification('Sorry, there was an error sending your message. Please try again.', 'error');
  } finally {
    if (submitBtn && btnText && btnLoader) {
      submitBtn.disabled = false;
      btnText.style.opacity = '1';
      btnLoader.classList.add('hidden');
    }
  }
  
  return false;
}

async function submitFormData(data) {
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  if (Math.random() < 0.1) {
    throw new Error('Network error');
  }
  
  console.log('Form data submitted:', data);
  return { success: true, message: 'Data submitted successfully' };
}

function handleInputChange(event) {
  const { name, value } = event.target;
  
  const normalizedName = name.replace(/-([a-z])/g, (match, letter) => letter.toUpperCase());
  
  const newFormData = { ...appState.formData, [normalizedName]: value };
  updateState({ formData: newFormData });
  
  newFormData[name] = value;
  updateState({ formData: newFormData });
  
  if (appState.formErrors[name] || appState.formErrors[normalizedName]) {
    const isValid = validateField(name, value);
    if (isValid) {
      clearFieldError(name);
      clearFieldError(normalizedName);
    }
  }
}

function handleInputBlur(event) {
  const { name, value } = event.target;
  const isValid = validateField(name, value);
  if (!isValid) {
    showFieldError(name, getFieldError(name, value));
  }
}

function handleInputFocus(event) {
  const { name } = event.target;
  clearFieldError(name);
}

function handleRadioChange(event) {
  const { name, value } = event.target;
  const normalizedName = name.replace(/-([a-z])/g, (match, letter) => letter.toUpperCase());
  const newFormData = { ...appState.formData, [normalizedName]: value };
  updateState({ formData: newFormData });
}

function handleCheckboxChange(event) {
  const { name, value, checked } = event.target;
  const currentServices = appState.formData.services || [];
  
  let newServices;
  if (checked) {
    newServices = [...currentServices, value];
  } else {
    newServices = currentServices.filter(service => service !== value);
  }
  
  const newFormData = { ...appState.formData, services: newServices };
  updateState({ formData: newFormData });
}

function handleRangeChange(event) {
  const { name, value } = event.target;
  const normalizedName = name.replace(/-([a-z])/g, (match, letter) => letter.toUpperCase());
  const newFormData = { ...appState.formData, [normalizedName]: parseInt(value) };
  updateState({ formData: newFormData });
  
  updateTimelineOutput(value);
}

function updateTimelineOutput(value) {
  const output = safeQuerySelector('#timeline-output');
  if (output) {
    output.textContent = value;
  }
}

window.updateTimelineOutput = updateTimelineOutput;

async function validateForm() {
  const requiredFields = ['name', 'email', 'message'];
  let isValid = true;
  const errors = {};
  
  for (const field of requiredFields) {
    const value = appState.formData[field];
    const fieldValid = validateField(field, value);
    if (!fieldValid) {
      isValid = false;
      errors[field] = getFieldError(field, value);
    }
  }
  
  updateState({ formErrors: errors });
  return isValid;
}

function validateField(fieldName, value) {
  switch (fieldName) {
    case 'name':
      return value && value.trim().length >= 2;
    case 'email':
      return value && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    case 'phone':
      return !value || /^[+]?[\d\s\-()]+$/.test(value);
    case 'message':
      return value && value.trim().length >= 10;
    default:
      return true;
  }
}

function getFieldError(fieldName, value) {
  switch (fieldName) {
    case 'name':
      return !value ? 'Name is required' : 'Name must be at least 2 characters';
    case 'email':
      return !value ? 'Email is required' : 'Please enter a valid email address';
    case 'phone':
      return 'Please enter a valid phone number';
    case 'message':
      return !value ? 'Message is required' : 'Message must be at least 10 characters';
    default:
      return 'This field is invalid';
  }
}

function showFieldError(fieldName, message) {
  const errorElement = safeQuerySelector(`#${fieldName}-error`);
  const inputElement = safeQuerySelector(`#${fieldName}`);
  
  if (errorElement) {
    errorElement.textContent = message;
    errorElement.style.display = 'block';
  }
  
  if (inputElement) {
    inputElement.classList.add('error');
    inputElement.setAttribute('aria-invalid', 'true');
  }
}

function clearFieldError(fieldName) {
  const errorElement = safeQuerySelector(`#${fieldName}-error`);
  const inputElement = safeQuerySelector(`#${fieldName}`);
  
  if (errorElement) {
    errorElement.textContent = '';
    errorElement.style.display = 'none';
  }
  
  if (inputElement) {
    inputElement.classList.remove('error');
    inputElement.setAttribute('aria-invalid', 'false');
  }
  
  const newErrors = { ...appState.formErrors };
  delete newErrors[fieldName];
  updateState({ formErrors: newErrors });
}

function handleFormReset() {
  resetFormState();
  clearAllErrors();
}

function resetFormState() {
  const initialFormData = {
    name: '',
    email: '',
    phone: '',
    projectType: '',
    budget: '',
    services: [],
    message: '',
    timeline: 8,
    startDate: ''
  };
  
  updateState({ formData: initialFormData, formErrors: {} });
  updateTimelineOutput('8');
}

function clearAllErrors() {
  const errorElements = safeQuerySelectorAll('.error-message');
  const inputElements = safeQuerySelectorAll('.form-input, .form-select, .form-textarea');
  
  errorElements.forEach(element => {
    element.textContent = '';
    element.style.display = 'none';
  });
  
  inputElements.forEach(element => {
    element.classList.remove('error');
    element.setAttribute('aria-invalid', 'false');
  });
}


function showNotification(message, type = 'info', duration = 5000) {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `
    <div class="notification-content">
      <span class="notification-icon">${getNotificationIcon(type)}</span>
      <span class="notification-message">${message}</span>
      <button class="notification-close" aria-label="Close notification">&times;</button>
    </div>
  `;
  
  Object.assign(notification.style, {
    position: 'fixed',
    top: '20px',
    right: '20px',
    backgroundColor: type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6',
    color: 'white',
    padding: '12px 16px',
    borderRadius: '8px',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    zIndex: '9999',
    maxWidth: '400px',
    animation: 'slideInRight 0.3s ease-out'
  });
  
  document.body.appendChild(notification);
  
  const closeButton = notification.querySelector('.notification-close');
  if (closeButton) {
    closeButton.addEventListener('click', () => removeNotification(notification));
  }
  
  setTimeout(() => removeNotification(notification), duration);
}

function getNotificationIcon(type) {
  switch (type) {
    case 'success': return '✅';
    case 'error': return '❌';
    case 'warning': return '⚠️';
    default: return 'ℹ️';
  }
}

function removeNotification(notification) {
  notification.style.animation = 'slideOutRight 0.3s ease-out';
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, 300);
}


function openProjectModal(projectId) {
  const modal = safeQuerySelector('#project-modal');
  const modalTitle = safeQuerySelector('#modal-title');
  const modalContent = safeQuerySelector('#modal-content');
  
  if (!modal || !modalTitle || !modalContent) return;
  
  const projectData = getProjectData(projectId);
  if (!projectData) return;
  
  modalTitle.textContent = projectData.title;
  modalContent.innerHTML = generateModalContent(projectData);
  
  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden', 'false');
  
  const closeButton = modal.querySelector('.modal-close');
  if (closeButton) {
    closeButton.focus();
  }
  
  document.body.style.overflow = 'hidden';
  
  const overlay = modal.querySelector('.modal-overlay');
  if (overlay) {
    overlay.addEventListener('click', closeModal);
  }
}

function closeModal() {
  const modal = safeQuerySelector('#project-modal');
  if (!modal) return;
  
  modal.classList.add('hidden');
  modal.setAttribute('aria-hidden', 'true');
  
  document.body.style.overflow = '';
  
  const overlay = modal.querySelector('.modal-overlay');
  if (overlay) {
    overlay.removeEventListener('click', closeModal);
  }
}

function getProjectData(projectId) {
  const projects = {
    localpulse: {
      title: 'Local Pulse',
      description: 'A comprehensive community commerce platform designed specifically for Goa, connecting local businesses with customers and promoting local economy.',
      technologies: ['Figma'],
      features: [
        'Business directory with location-based search',
        'Customer reviews and ratings system',
        'Online ordering and delivery tracking',
        'Local event calendar integration',
        'Multi-language support (English, Hindi, Konkani)'
      ],
      challenges: [
        'Implementing offline-first functionality',
        'Optimizing for mobile devices with limited connectivity',
        'Creating an intuitive UI for all age groups'
      ],
      images: ['localpulse-1.png', 'localpulse-2.png'],
      liveUrl: 'https://drive.google.com/file/d/1uSZShIS0x90aZ6E3Plh9dwvTScpJ91um/view?usp=sharing',
      githubUrl: 'https://drive.google.com/file/d/1uSZShIS0x90aZ6E3Plh9dwvTScpJ91um/view?usp=sharing'
    }
  };
  
  return projects[projectId];
}

function generateModalContent(project) {
  return `
    <div class="modal-project">
      <div class="modal-project-description">
        <h4>Project Overview</h4>
        <p>${project.description}</p>
      </div>
      
      ${project.images && project.images.length > 0 ? `
      <div class="modal-project-gallery">
        <h4>Project Images</h4>
        <div class="project-image-gallery">
          ${project.images.map(image => `
            <div class="project-image-item">
              <img src="${image}" alt="${project.title} screenshot" loading="lazy">
            </div>
          `).join('')}
        </div>
      </div>
      ` : ''}
      
      <div class="modal-project-tech">
        <h4>Technologies Used</h4>
        <div class="tech-tags">
          ${project.technologies.map(tech => `<span class="tech-tag">${tech}</span>`).join('')}
        </div>
      </div>
      
      <div class="modal-project-features">
        <h4>Key Features</h4>
        <ul>
          ${project.features.map(feature => `<li>${feature}</li>`).join('')}
        </ul>
      </div>
      
      <div class="modal-project-challenges">
        <h4>Technical Challenges</h4>
        <ul>
          ${project.challenges.map(challenge => `<li>${challenge}</li>`).join('')}
        </ul>
      </div>
      
      <div class="modal-project-links">
        <a href="${project.liveUrl}" target="_blank" rel="noopener" class="project-link">
          View Design
        </a>
        <a href="${project.githubUrl}" target="_blank" rel="noopener" class="project-link">
          View Case Study
        </a>
      </div>
    </div>
  `;
}


function initializeScrollEffects() {
  initializeScrollProgress();
  initializeBackToTop();
  initializeScrollAnimations();
  initializeParallaxEffects();
}

function initializeScrollProgress() {
  const progressBar = document.createElement('div');
  progressBar.className = 'scroll-progress';
  progressBar.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 0%;
    height: 3px;
    background: linear-gradient(90deg, var(--primary-500), var(--secondary-500));
    z-index: 9999;
    transition: width 0.1s ease-out;
  `;
  
  document.body.appendChild(progressBar);
  
  const throttledScrollHandler = throttle(() => {
    const scrollProgress = (window.pageYOffset / (document.body.scrollHeight - window.innerHeight)) * 100;
    progressBar.style.width = `${Math.min(scrollProgress, 100)}%`;
    updateState({ scrollProgress });
  }, 16);
  
  addEventListenerWithCleanup(window, 'scroll', throttledScrollHandler);
}

function initializeBackToTop() {
  const backToTop = safeQuerySelector('.back-to-top');
  if (!backToTop) return;
  
  const throttledScrollHandler = throttle(() => {
    if (window.pageYOffset > 300) {
      backToTop.classList.remove('hidden');
    } else {
      backToTop.classList.add('hidden');
    }
  }, 100);
  
  addEventListenerWithCleanup(window, 'scroll', throttledScrollHandler);
  addEventListenerWithCleanup(backToTop, 'click', scrollToTop);
}

function scrollToTop() {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
}

function initializeScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-in');
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  });
  
  const animatedElements = safeQuerySelectorAll('.skill-card, .project-card, .education-item');
  animatedElements.forEach(element => {
    observer.observe(element);
  });
}

function initializeParallaxEffects() {
  const parallaxElements = safeQuerySelectorAll('.header-decoration');
  
  const throttledScrollHandler = throttle(() => {
    const scrolled = window.pageYOffset;
    const parallax = scrolled * 0.5;
    
    parallaxElements.forEach(element => {
      element.style.transform = `translate(-50%, calc(-50% + ${parallax}px))`;
    });
  }, 16);
  
  addEventListenerWithCleanup(window, 'scroll', throttledScrollHandler);
}

function highlightCard(card) {
  if (card) {
    card.style.backgroundColor = '#bfdbfe';
    card.style.transform = 'translateY(-4px) scale(1.02)';
    card.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1)';
  }
}

function removeHighlight(card) {
  if (card) {
    card.style.backgroundColor = '';
    card.style.transform = '';
    card.style.boxShadow = '';
  }
}

function showAlert() {
  showNotification("You clicked on the Mood Mosaic project! This demonstrates a simple notification system.", 'info');
}

function startDemo(event) {
  event.stopPropagation();
  showNotification("Demo started! This would typically launch an interactive demo.", 'success');
}


function initializeCustomCursor() {
  if (window.matchMedia('(pointer: fine)').matches) {
    const cursor = safeQuerySelector('.custom-cursor');
    const cursorDot = safeQuerySelector('.custom-cursor-dot');
    
    if (cursor && cursorDot) {
      let mouseX = 0;
      let mouseY = 0;
      let cursorX = 0;
      let cursorY = 0;
      
      const lerp = (start, end, factor) => start + (end - start) * factor;
      
      const updateCursor = () => {
        cursorX = lerp(cursorX, mouseX, 0.1);
        cursorY = lerp(cursorY, mouseY, 0.1);
        
        cursor.style.transform = `translate(${cursorX - 20}px, ${cursorY - 20}px)`;
        cursorDot.style.transform = `translate(${mouseX - 4}px, ${mouseY - 4}px)`;
        
        requestAnimationFrame(updateCursor);
      };
      
      addEventListenerWithCleanup(document, 'mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
      });
      
      updateCursor();
    }
  }
}


function initializeKeyboardNavigation() {
  let focusableElements = 'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [tabindex="0"], [contenteditable]';
  
  addEventListenerWithCleanup(document, 'keydown', (e) => {
    if (e.key === 'Tab') {
      const focusable = Array.from(document.querySelectorAll(focusableElements));
      const currentIndex = focusable.indexOf(document.activeElement);
      
      if (e.shiftKey) {
        if (currentIndex <= 0) {
          focusable[focusable.length - 1].focus();
          e.preventDefault();
        }
      } else {
        if (currentIndex >= focusable.length - 1) {
          focusable[0].focus();
          e.preventDefault();
        }
      }
    }
  });
}

function initializePerformanceMonitoring() {
  if (typeof performance !== 'undefined' && performance.mark) {
    performance.mark('app-start');
    
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.duration > 50) {
            console.warn('Long task detected:', entry.duration + 'ms');
          }
        });
      });
      
      observer.observe({ entryTypes: ['longtask'] });
    }
    
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.value > 0.1) {
            console.warn('Layout shift detected:', entry.value);
          }
        });
      });
      
      observer.observe({ entryTypes: ['layout-shift'] });
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM fully loaded');
  initializeApp();
});

window.addEventListener('load', () => {
  console.log('All resources loaded');
  
  if (typeof performance !== 'undefined' && performance.mark) {
    performance.mark('app-ready');
    performance.measure('app-load-time', 'app-start', 'app-ready');
    
    const measure = performance.getEntriesByName('app-load-time')[0];
    console.log(`App load time: ${measure.duration}ms`);
  }
});

window.addEventListener('beforeunload', () => {
  eventListeners.forEach((listeners, element) => {
    removeAllEventListeners(element);
  });
  
  localStorage.setItem('appState', JSON.stringify(appState));
});

window.addEventListener('online', () => {
  showNotification('Connection restored!', 'success');
});

window.addEventListener('offline', () => {
  showNotification('You are offline. Some features may be limited.', 'warning');
});

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    appState,
    updateState,
    showNotification,
    debounce,
    throttle,
    deepClone
  };
}

