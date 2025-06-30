/**
 * Settings panel related functionality
 */

// -----------------------------------------------------
// Settings panel functions
// -----------------------------------------------------

// UI hooks for updating model lists
window.uiHooks = window.uiHooks || {};

/**
 * Updates the Ollama models dropdown when models are refreshed
 * @param {boolean} fetchError - Whether there was an error fetching models
 */
window.uiHooks.updateOllamaModelsDropdown = function(fetchError) {
  if (window.serviceSelector && window.serviceSelector.value === 'ollama') {
    window.updateModelSelector();
    
    // Show status message if there was an error
    if (fetchError) {
      // Remove any existing status message
      const existingStatus = document.querySelector('.ollama-status');
      if (existingStatus) {
        existingStatus.remove();
      }
      
      // Create a new status message
      const statusElement = document.createElement('div');
      statusElement.className = 'ollama-status error';
      statusElement.textContent = 'Failed to fetch Ollama models. Check server connection.';
      
      // Add status message to the DOM
      const ollamaActionButtons = document.querySelector('.ollama-action-buttons');
      if (ollamaActionButtons) {
        ollamaActionButtons.insertAdjacentElement('afterend', statusElement);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
          statusElement.remove();
        }, 5000);
      }
    }
  }
};

/**
 * Updates the header information
 */
window.updateHeaderInfo = function() {
  const headerTitle = document.getElementById('header-title');
  const modelInfo = document.getElementById('model-info');
  
  // Check if required elements exist
  if (!headerTitle || !modelInfo || !window.modelSelector) {
    console.warn('Header elements not found, skipping updateHeaderInfo');
    return;
  }
  
  const model = window.modelSelector.value;
  
  try {
    // Set model name as the main header title
    if (model && model !== 'error' && model !== 'no-models') {
      headerTitle.textContent = `${model}`;
      window.modelSelector.setAttribute('data-last-selected', model);
    } else {
      headerTitle.textContent = 'AI Assistant';
    }
    
    // Show personality or prompt info in the modelInfo area
    let promptInfo = "";
    if (window.personalityPromptRadio.checked && window.personalityInput.value.trim() !== "") {
      // Only show personality if the user has actively set it
      if (window.personalityInput.hasAttribute('data-explicitly-set') && 
          window.personalityInput.getAttribute('data-explicitly-set') === 'true') {
        promptInfo = `Personality: ${window.personalityInput.value.trim()}`;
      }
    } else if (window.customPromptRadio.checked && window.systemPromptCustom.value.trim() !== "") {
      promptInfo = window.systemPromptCustom.value.trim();
    } else if (window.noPromptRadio && window.noPromptRadio.checked) {
      promptInfo = "No system prompt";
    }
    
    // Always display something in the model info area even if empty
    if (!promptInfo) {
      // Use the default personality explicitly and make sure it's set in the input
      if (window.DEFAULT_PERSONALITY) {
        // Set the personality in the UI if it's empty
        if (window.personalityInput && (!window.personalityInput.value.trim() || 
            !window.personalityInput.hasAttribute('data-explicitly-set'))) {
          window.personalityInput.value = window.DEFAULT_PERSONALITY;
          window.personalityInput.setAttribute('data-explicitly-set', 'true');
        }
        promptInfo = `Personality: ${window.DEFAULT_PERSONALITY}`;
      }
    }
    
    modelInfo.textContent = promptInfo;
    modelInfo.title = promptInfo; // Tooltip will show full text on hover
  } catch (error) {
    console.error('Error updating header info:', error);
    headerTitle.textContent = 'AI Assistant';
    modelInfo.textContent = 'Configuration error';
  }
};

/**
 * Updates model selector with available models for the current service
 */
window.updateModelSelector = function() {
  // Check if modelSelector exists
  if (!window.modelSelector) {
    console.warn('Model selector not found, skipping updateModelSelector');
    return;
  }

  const currentlySelectedModel = window.modelSelector.value;
  const savedModel = window.modelSelector.getAttribute('data-last-selected');
  
  window.modelSelector.innerHTML = '';
  
  try {
    // Check if we're using Ollama and models are currently being fetched
    const isOllamaLoading = window.config.defaultService === 'ollama' && 
                           window.config.services.ollama.modelsFetching === true;
    
    if (isOllamaLoading) {
      const option = document.createElement('option');
      option.value = 'loading';
      option.textContent = 'Loading models...';
      window.modelSelector.appendChild(option);
      return;
    }
    
    const models = window.config.getAvailableModels();
    if (!Array.isArray(models) || models.length === 0) {
      console.error('No models available for the selected service');
      const option = document.createElement('option');
      option.value = 'no-models';
      option.textContent = 'No models available';
      window.modelSelector.appendChild(option);
      return;
    }
    
    models.forEach((model) => {
      const option = document.createElement('option');
      option.value = model;
      option.textContent = model;
      window.modelSelector.appendChild(option);
    });

    // If the currently selected model from a loaded conversation isn't in the
    // list of available models, preserve it as a custom option so history loads
    // use the original model instead of defaulting to another one.
    if (currentlySelectedModel && !models.includes(currentlySelectedModel)) {
      const unavailableOption = document.createElement('option');
      unavailableOption.value = currentlySelectedModel;
      unavailableOption.textContent = `${currentlySelectedModel} (unavailable)`;
      unavailableOption.dataset.unavailable = 'true';
      window.modelSelector.appendChild(unavailableOption);
    }
    
    // First try to use the currently selected model (may be an unavailable one
    // added above)
    if (currentlySelectedModel) {
      window.modelSelector.value = currentlySelectedModel;
    }
    // Then try to use the saved model
    else if (savedModel && models.includes(savedModel)) {
      window.modelSelector.value = savedModel;
    } 
    // Then try to use the default model from config
    else {
      const defaultModel = window.config.getDefaultModel();
      
      // Try exact match first
      if (defaultModel && models.includes(defaultModel)) {
        window.modelSelector.value = defaultModel;
      } 
      // Try matching without the :latest suffix
      else if (defaultModel) {
        // Find model that matches without the :latest suffix (e.g., "llama3" matches "llama3:latest")
        const matchingModel = models.find(model => 
          model === defaultModel || 
          (model.endsWith(':latest') && model.slice(0, -7) === defaultModel)
        );
        
        if (matchingModel) {
          window.modelSelector.value = matchingModel;
        } else if (models.length > 0) {
          window.modelSelector.value = models[0];
        }
      } else if (models.length > 0) {
        window.modelSelector.value = models[0];
      }
    }
    
    window.modelSelector.setAttribute('data-last-selected', window.modelSelector.value);
    window.updateHeaderInfo();
  } catch (error) {
    console.error('Error updating model selector:', error);
    const option = document.createElement('option');
    option.value = 'error';
    option.textContent = 'Error loading models';
    window.modelSelector.appendChild(option);
  }
};

/**
 * Dynamically populates the service selector dropdown based on available services in config
 */
window.populateServiceSelector = function() {
  if (!window.serviceSelector || !window.config || !window.config.services) {
    console.warn('Service selector or config not found, skipping populateServiceSelector');
    return;
  }
  
  // Clear existing options
  window.serviceSelector.innerHTML = '';
  
  // Create and append options for each service in config
  Object.keys(window.config.services).forEach(serviceKey => {
    
    const service = window.config.services[serviceKey];
    const option = document.createElement('option');
    option.value = serviceKey;
    
    // Determine display name based on service key
    let displayName = serviceKey.charAt(0).toUpperCase() + serviceKey.slice(1);
    
    // Add specific labels for known services
    switch(serviceKey) {
      case 'openai':
        displayName = 'OpenAI';
        break;
      case 'xai':
        displayName = 'xAI (Grok)';
        break;
      case 'google':
        displayName = 'Google AI';
        break;
      case 'mistral':
        displayName = 'Mistral';
        break;
      case 'ollama':
        displayName = 'Ollama (Local)';
        break;
      case 'anthropic':
        displayName = 'Anthropic (Claude)';
        break;
      default:
        displayName = serviceKey.charAt(0).toUpperCase() + serviceKey.slice(1);
    }
    
    option.textContent = displayName;
    window.serviceSelector.appendChild(option);
  });
};

/**
 * Explicitly initialize the personality input with the default personality
 */
window.initializePersonalityInput = function() {
  if (window.personalityInput && window.DEFAULT_PERSONALITY) {
    window.personalityInput.value = window.DEFAULT_PERSONALITY;
    window.personalityInput.setAttribute('data-explicitly-set', 'true');
    console.info('Default personality explicitly set in personality input box');
  } else {
    console.warn('Could not initialize personality input: element or default personality not available');
  }
};

/**
 * Organizes settings content into columns for wider panel layout
 */
window.organizeSettingsLayout = function() {
  // Apply to the Model tab
  const modelTab = document.getElementById('model-settings');
  if (modelTab) {
    // Create wrapper if it doesn't exist
    if (!modelTab.querySelector('.settings-tab-columns')) {
      const groups = modelTab.querySelectorAll('.settings-group');
      const midpoint = Math.ceil(groups.length / 2);
      
      // Create column wrapper
      const wrapper = document.createElement('div');
      wrapper.className = 'settings-tab-columns';
      
      // Create two columns
      const column1 = document.createElement('div');
      column1.className = 'settings-column';
      
      const column2 = document.createElement('div');
      column2.className = 'settings-column';
      
      // Distribute groups between columns
      groups.forEach((group, index) => {
        if (index < midpoint) {
          column1.appendChild(group.cloneNode(true));
        } else {
          column2.appendChild(group.cloneNode(true));
        }
      });
      
      // Replace content with new layout
      wrapper.appendChild(column1);
      wrapper.appendChild(column2);
      
      // Replace content with the new layout
      const content = modelTab.querySelector('.tab-content-container');
      if (content) {
        // Remove old groups
        groups.forEach(group => group.remove());
        // Add new layout
        content.appendChild(wrapper);
      }
    }
  }
};