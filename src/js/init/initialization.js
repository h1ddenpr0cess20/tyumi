/**
 * Main initialization coordinator for the chatbot application
 * This file loads all initialization modules and coordinates the startup process
 */

// Main initialization function
function initialize() {
  try {
    if (window.VERBOSE_LOGGING) console.info('Initializing chatbot application...');
    
    // Initialize DOM references first
    initializeDOMReferences();
    if (window.VERBOSE_LOGGING) console.info('DOM references initialized.');
    
    // Initialize textarea height to prevent shrinking when typing
    initializeTextareaHeight();
    
    // Check if essential elements are available
    if (!window.modelSelector || !window.userInput) {
      console.error('Essential DOM elements not found. Check your HTML structure.');
      return;
    }
    
    // Initialize default values from config
    initializeDefaultValues();
    
    // Initialize About tab and crypto donations
    initializeAboutTab();
    
    // Initialize model parameter controls with values from config
    initializeModelSettings();
    
    // Set initial conversation name based on personality/prompt type
    initializeConversationName();
    
    // Initialize marked (Markdown parser)
    initializeMarked();
    if (window.VERBOSE_LOGGING) console.info('Marked (Markdown parser) initialized.');
    
    // Setup event listeners
    setupEventListeners();
    if (window.VERBOSE_LOGGING) console.info('Event listeners set up.');
    
    // Initialize tabs in settings panel
    if (typeof window.initTabs === 'function') {
      window.initTabs();
      if (window.VERBOSE_LOGGING) console.info('Settings panel tabs initialized.');
    } else {
      console.warn('Tab initialization function not found');
    }
    
    // Initialize tools settings
    if (typeof window.initToolsSettings === 'function') {
      window.initToolsSettings();
      if (window.VERBOSE_LOGGING) console.info('Tools settings initialized.');
    } else {
      console.warn('Tools settings initialization function not found');
    }
    
    // Try to load from URL if available
    try {
      window.loadFromUrl();
      if (window.VERBOSE_LOGGING) console.info('Loaded chat state from URL (if present).');
    } catch (e) {
      console.warn('Error loading from URL:', e);
    }
    
    // Initialize services and models
    initializeServicesAndModels();
    
    // Initialize TTS
    window.initializeTts();
    if (window.VERBOSE_LOGGING) console.info('TTS initialized.');
    
    // Initialize mobile keyboard handling
    window.initializeMobileKeyboardHandling();
    if (window.VERBOSE_LOGGING) console.info('Mobile keyboard handling initialized.');
    
    // Call these functions to initialize the UI
    window.updateParameterControls();
    
    // Ensure API keys are loaded before updating model selector
    if (typeof window.ensureApiKeysLoaded === 'function') {
      window.ensureApiKeysLoaded();
      if (window.VERBOSE_LOGGING) console.info('API keys loaded from localStorage.');
    }
    
    window.updateModelSelector();
    window.updateHeaderInfo();
    if (window.VERBOSE_LOGGING) console.info('UI controls and selectors initialized.');
    
    // Share references with the API module
    initializeApiReferences();
      // Add scroll event listener to chatBox to track when user manually scrolls
    setupScrollTracking();
    
    // Focus the user input safely (checks for mobile device)
    focusInputField();
    
    // Pre-load highlight.js
    window.loadHighlightJS().then(() => {
      if (window.VERBOSE_LOGGING) console.info('Highlight.js preloaded.');
    }).catch(err => console.error('Failed to preload highlight.js', err));    // Initialize tool calling toggle state
    initializeToolCalling();
    
    // Initialize location service
    initializeLocationService();
    
    if (window.VERBOSE_LOGGING) console.info('Chatbot application initialization complete.');
    
  } catch (error) {
    console.error('Initialization error:', error);
  }
}

/**
 * Initialize API references sharing
 */
function initializeApiReferences() {
  if (window.initApiReferences) {
    window.initApiReferences({
      personalityPromptRadio: window.personalityPromptRadio,
      personalityInput: window.personalityInput,
      customPromptRadio: window.customPromptRadio,
      systemPromptCustom: window.systemPromptCustom, 
      noPromptRadio: window.noPromptRadio,      modelSelector: window.modelSelector,      temperatureSlider: window.temperatureSlider,
      topPSlider: window.topPSlider,
      frequencyPenaltySlider: window.frequencyPenaltySlider,
      presencePenaltySlider: window.presencePenaltySlider,
      maxContextInput: window.maxContextInput,
      conversationHistory: window.conversationHistory
    });
    if (window.VERBOSE_LOGGING) console.info('API references shared.');
  } else {
    console.warn('initApiReferences function not found. API integration may not work properly.');
  }
}

/**
 * Setup scroll tracking for auto-scroll functionality
 */
function setupScrollTracking() {
  window.chatBox.addEventListener('scroll', () => {
    const wasAtBottom = window.chatBox.scrollHeight - window.chatBox.clientHeight - window.chatBox.scrollTop < 20;
    window.shouldAutoScroll = wasAtBottom;
  });
}

/**
 * Focus user input safely (checks for mobile devices)
 * Uses the implementation from mobileHandling.js when available
 */
function focusInputField() {
  // Check if the implementation from mobileHandling.js is available
  const externalImplementation = window.focusUserInputSafely;
  
  if (typeof externalImplementation === 'function') {
    // Call the implementation from mobileHandling.js
    externalImplementation();
  } else if (window.userInput) {
    // Fallback to simple focus
    window.userInput.focus();
    if (window.VERBOSE_LOGGING) console.info('User input focused.');
  }
}

/**
 * Initialize textarea height to prevent changing height when typing starts
 */
function initializeTextareaHeight() {
  if (window.userInput) {
    // Set initial height to the default value from CSS
    window.userInput.style.height = '56px';
  }
}

// Set up the initialization when DOM is loaded
document.addEventListener('DOMContentLoaded', initialize);

// Make main function available globally for debugging
window.initialize = initialize;
