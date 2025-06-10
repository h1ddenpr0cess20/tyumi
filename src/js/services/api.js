/**
 * API communication functions
 */

// All UI references will be initialized in core.js and shared via initApiReferences
// No need to declare them here as they'll be available through function scope when needed

/**
 * Makes an API call to the specified endpoint
 * @param {string} apiEndpoint - The API endpoint URL
 * @param {Object} requestBody - The request body
 * @param {Object} headers - The request headers
 * @param {AbortController} abortController - Optional AbortController for canceling requests
 * @returns {Promise<Response>} - The fetch response
 */
window.callApi = async function(apiEndpoint, requestBody, headers, abortController) {
  try {
    // Ensure API keys are loaded before making API calls
    if (typeof window.ensureApiKeysLoaded === 'function') {
      window.ensureApiKeysLoaded();
    }
    
    const fetchOptions = {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(requestBody),
      signal: abortController ? abortController.signal : null,
    };

    const response = await fetch(apiEndpoint, fetchOptions);
    
    if (!response.ok) {
      let errorDetails = '';
      try {
        const errorData = await response.json();
        errorDetails = errorData.error?.message || JSON.stringify(errorData);
      } catch (jsonError) {
        errorDetails = `HTTP ${response.status} - ${response.statusText}`;
      }
      throw new Error(`API request failed: ${errorDetails}`);
    }
    return response;
  } catch (error) {
    // Don't log or rethrow aborted requests
    if (error.name === 'AbortError') {
      console.info('Request was aborted');
      return null;
    }
    console.error('API call error:', error);
    throw error;
  }
}

/**
 * Gets the API endpoint based on the current service configuration
 * @returns {string} The API endpoint URL
 */
window.getApiEndpoint = function() {
  const currentService = window.config.defaultService;
  
  // Default endpoint for OpenAI-compatible APIs
  return `${window.config.getBaseUrl()}/chat/completions`;
}


/**
 * Get current date and time in a readable format
 * @returns {string} - Formatted date and time string
 */
window.getCurrentDateTime = function() {
  const now = new Date();
  return now.toLocaleString();
}


/**
 * Prepares the request data for API call
 * @param {string} message - The user message
 * @returns {Object} - Object containing requestBody and headers
 */
window.prepareRequestData = function(message) {
  const model = this.modelSelector.value;
  const temperature = parseFloat(this.temperatureSlider.value);
  const topP = parseFloat(this.topPSlider.value);
  const frequencyPenalty = parseFloat(this.frequencyPenaltySlider.value);
  const presencePenalty = parseFloat(this.presencePenaltySlider.value);
  const maxContext = parseInt(this.maxContextInput.value);
  const currentService = window.config.defaultService;

  // Get current date and time
  const currentDateTime = window.getCurrentDateTime();

  // Figure out which system prompt to use
  let systemPrompt = "";
  const locationInfo = typeof window.getLocationForPrompt === 'function' ? window.getLocationForPrompt() : '';
  
  if (this.personalityPromptRadio.checked && this.personalityInput.value.trim() !== "") {
    // Only use personality if it has been explicitly set
    if (this.personalityInput.hasAttribute('data-explicitly-set') && 
        this.personalityInput.getAttribute('data-explicitly-set') === 'true') {
      systemPrompt = window.PERSONALITY_PROMPT_TEMPLATE
        .replace('{personality}', this.personalityInput.value.trim())
        .replace('{datetime}', currentDateTime)
        .replace('{location}', locationInfo);
    }
  } else if (this.customPromptRadio.checked) {
    systemPrompt = window.CUSTOM_PROMPT_TEMPLATE
      .replace('{custom_prompt}', this.systemPromptCustom.value)
      .replace('{datetime}', currentDateTime)
      .replace('{location}', locationInfo);
  }

  // Add Cogito deep thinking subroutine check
  if (model && model.toLowerCase().includes('cogito')) {
    if (systemPrompt) {
      systemPrompt += " Enable deep thinking subroutine.";
    } else {
      systemPrompt = "Enable deep thinking subroutine.";
    }
  }

  // Add tools description if function calling is enabled
  if (window.config.enableFunctionCalling && systemPrompt && typeof window.getToolsDescription === 'function') {
    systemPrompt += window.getToolsDescription();
  }

  // Handle system prompt in conversation history
  if (systemPrompt) {
    const existingSystemIdx = this.conversationHistory.findIndex(msg => msg.role === 'system');
    if (existingSystemIdx >= 0) {
      this.conversationHistory[existingSystemIdx].content = systemPrompt;
    } else {
      this.conversationHistory.unshift({ role: 'system', content: systemPrompt });
    }
  } else {
    const existingSystemIdx = this.conversationHistory.findIndex(msg => msg.role === 'system');
    if (existingSystemIdx >= 0) {
      this.conversationHistory.splice(existingSystemIdx, 1);
    }
  }

  // Build messages array from conversation history
  let contextMessages = [];
  if (this.conversationHistory.length > 0) {
    // IMPORTANT: First extract the system message from the FULL conversation history
    // This ensures we always keep it, even when trimming long conversations
    const systemMessage = this.conversationHistory.find(msg => msg.role === 'system');
    
    // Get the most recent messages according to maxContext
    // Filter out the system message as we're handling it separately
    let rawMessages = this.conversationHistory
      .filter(msg => msg.role !== 'system')
      .slice(-(maxContext * 2));
    
    // Remove <think>...</think> and <|begin_of_thought|>...</|end_of_thought|> from user/assistant messages
    rawMessages = rawMessages.map(msg => {
      if (msg.role === 'user' || msg.role === 'assistant') {
        let content = msg.content || '';
        // Remove <think>...</think>
        content = content.replace(/<think>[\s\S]*?<\/think>/g, '');
        // Remove <\|begin_of_thought\|>[\s\S]*?<\|end_of_thought\|>/g
        content = content.replace(/<\|begin_of_thought\|>[\s\S]*?<\|end_of_thought\|>/g, '');
        return { ...msg, content };
      }
      return msg;
    });
    
    // Process the raw messages for tool handling
    if (window.config.enableFunctionCalling) {
      console.info('Processing history for tool-related messages');
      
      // Filter out tool-related messages
      const regularMessages = rawMessages.filter(msg => {
        return msg.role !== 'tool' && !msg.tool_calls;
      });
      
      // Combine the messages, always putting the system message first if it exists
      contextMessages = systemMessage ? 
        [systemMessage, ...regularMessages] : 
        regularMessages;
      
      console.info(`History trimming: Original=${rawMessages.length}, After filtering=${contextMessages.length}, System message ${systemMessage ? 'preserved' : 'not found'}`);
    } else {
      // For non-function calling, just add the system message back in
      contextMessages = systemMessage ? [systemMessage, ...rawMessages] : rawMessages;
    }
  }

  const apiMessages = [...contextMessages];

  if (window.VERBOSE_LOGGING) {
    console.info('Current context messages:', apiMessages);
  }

  // Prepare headers
  const headers = {
    'Content-Type': 'application/json',
  };
  const apiKey = window.config.getApiKey();
  
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  if (currentService === 'anthropic') {
    headers['anthropic-dangerous-direct-browser-access'] = 'true';
    headers['anthropic-version'] = '2023-06-01';
  }

  // Prepare request body
  let requestBody = {
    model,
    messages: apiMessages,
    temperature,
    stream: true
  };
  
  // Add tools if function calling is enabled
  if (window.config.enableFunctionCalling && window.toolDefinitions) {
    requestBody.tools = window.toolDefinitions;
    requestBody.tool_choice = "auto";
    console.info(`Tool count: ${window.toolDefinitions.length}, Service: ${currentService}, Model: ${model}`);
  } else if (window.config.enableFunctionCalling) {
    console.warn('Function calling is enabled but toolDefinitions is undefined. Make sure tools.js is loaded before api.js');
  }

  // Add optional parameters based on service/model support
  if (currentService !== 'google' && currentService !== 'anthropic') {
    // OpenAI and compatible services support top_p
    requestBody.top_p = topP;
    
    // Only add frequency/presence penalties for fully OpenAI-compatible services
    if (currentService === 'openai' || currentService === 'azure') {
      requestBody.frequency_penalty = frequencyPenalty;
      requestBody.presence_penalty = presencePenalty;
    }
  }

  // Add search_parameters for x.ai Grok models
  if (currentService === 'xai' && model && model.toLowerCase().includes('grok')) {
    requestBody.search_parameters = {
      mode: "auto"      
    };
    if (window.VERBOSE_LOGGING) {
      console.info('Added search_parameters for Grok model');
    }
  }

  return { requestBody, headers };
}


// This function will be called from core.js to initialize references
window.initApiReferences = function(refs) {
  // Store references in local variables for use in this module
  this.personalityPromptRadio = refs.personalityPromptRadio;
  this.personalityInput = refs.personalityInput;
  this.customPromptRadio = refs.customPromptRadio;
  this.systemPromptCustom = refs.systemPromptCustom;
  this.noPromptRadio = refs.noPromptRadio;
  this.modelSelector = refs.modelSelector;
  this.temperatureSlider = refs.temperatureSlider;
  this.topPSlider = refs.topPSlider;
  this.frequencyPenaltySlider = refs.frequencyPenaltySlider;
  this.presencePenaltySlider = refs.presencePenaltySlider;
  this.maxContextInput = refs.maxContextInput;
  this.conversationHistory = refs.conversationHistory;
}