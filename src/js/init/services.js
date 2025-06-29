/**
 * Service and model initialization for the chatbot application
 */

/**
 * Initialize services and models
 */
function initializeServicesAndModels() {
  // Initialize the service selector
  if (window.serviceSelector && window.config) {
    window.populateServiceSelector();
    window.serviceSelector.value = window.config.defaultService;
    if (window.VERBOSE_LOGGING) console.info('Service selector initialized.');
    
    // Only update model selector immediately if not using Ollama as default
    if (window.config.defaultService !== 'ollama') {
      window.updateModelSelector();
    }
    
    // Load Ollama models if default service is Ollama
    initializeOllamaModels();
  }
}

/**
 * Initialize Ollama models if using Ollama service
 */
function initializeOllamaModels() {
  if (window.config.defaultService === 'ollama' && 
      window.config.services.ollama && 
      typeof window.config.services.ollama.fetchAndUpdateModels === 'function') {
    window.config.services.ollama.fetchAndUpdateModels()
      .then(() => {
        if (window.VERBOSE_LOGGING) console.info('Ollama models fetched on initialization');
        // Update model selector after fetching models
        if (window.config.defaultService === 'ollama') {
          window.updateModelSelector();
        }
      })
      .catch(err => {
        console.error('Failed to fetch Ollama models on initialization:', err);
        // Still update model selector to show error state
        window.updateModelSelector();
      });
  }
}

/**
 * Initialize conversation name based on current settings
 */
function initializeConversationName() {
  // Set initial conversation name based on personality/prompt type
  if (window.personalityPromptRadio && window.personalityPromptRadio.checked && window.personalityInput) {
    window.currentConversationName = 'Personality: ' + window.personalityInput.value.trim();
  } else if (window.customPromptRadio && window.customPromptRadio.checked) {
    window.currentConversationName = 'Custom Prompt';
  } else if (window.noPromptRadio && window.noPromptRadio.checked) {
    window.currentConversationName = 'No System Prompt';
  } else {
    window.currentConversationName = 'Personality: ' + window.DEFAULT_PERSONALITY;
  }
}

/**
 * Initialize default values from configuration
 */
function initializeDefaultValues() {
  // Initialize default values from config
  if (window.systemPromptCustom) {
    window.systemPromptCustom.value = window.DEFAULT_SYSTEM_PROMPT;
    if (window.VERBOSE_LOGGING) console.info('Default system prompt set.');
  }
  
  if (window.personalityInput) {
    window.personalityInput.value = window.DEFAULT_PERSONALITY;
    window.personalityInput.setAttribute('data-explicitly-set', 'true');
    if (window.VERBOSE_LOGGING) console.info('Default personality set.');
  }
}

/**
 * Initialize tool calling toggle state
 */
function initializeToolCalling() {
  // Initialize tool calling toggle state from config/localStorage
  if (window.toolCallingToggle) {
    let enabled = true;
    if (localStorage.getItem('enableFunctionCalling') !== null) {
      enabled = localStorage.getItem('enableFunctionCalling') === 'true';
    } else if (window.config && typeof window.config.enableFunctionCalling === 'boolean') {
      enabled = window.config.enableFunctionCalling;
    }
    window.toolCallingToggle.checked = enabled;
    window.config.enableFunctionCalling = enabled;

    // Make sure to apply the master toggle state to individual tool toggles
    if (typeof window.updateMasterToolCallingStatus === 'function') {
      window.updateMasterToolCallingStatus(enabled);
    }

    // Load tool scripts on first initialization if enabled
    if (enabled && typeof window.loadToolScripts === 'function') {
      window.loadToolScripts().catch(err => console.error('Failed to load tool scripts:', err));
    }
  }
}

// Make functions available globally
window.initializeServicesAndModels = initializeServicesAndModels;
window.initializeOllamaModels = initializeOllamaModels;
window.initializeConversationName = initializeConversationName;
window.initializeDefaultValues = initializeDefaultValues;
window.initializeToolCalling = initializeToolCalling;
// Note: initializeLocationService is defined in location.js, not here
