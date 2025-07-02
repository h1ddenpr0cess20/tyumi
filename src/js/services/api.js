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
 * Cleans a messages array to only include standard OpenAI Chat Completions API fields
 * This prevents issues with strict APIs like Mistral that reject extra fields
 * @param {Array} messages - Array of message objects to clean
 * @returns {Array} - Cleaned messages array
 */
window.cleanMessagesForApi = function(messages) {
  return messages.map(msg => {
    if (msg.role === 'user' || msg.role === 'assistant') {
      let content = msg.content || '';
      
      // Handle different content formats
      if (typeof content === 'string') {
        // Remove thinking tags from string content
        content = content.replace(/<think>[\s\S]*?<\/think>/g, '');
        content = content.replace(/<\|begin_of_thought\|>[\s\S]*?<\|end_of_thought\|>/g, '');
      } else if (Array.isArray(content)) {
        // Handle multimodal content (array of objects)
        content = content.map(part => {
          if (part.type === 'text' && typeof part.text === 'string') {
            return {
              ...part,
              text: part.text
                .replace(/<think>[\s\S]*?<\/think>/g, '')
                .replace(/<\|begin_of_thought\|>[\s\S]*?<\|end_of_thought\|>/g, '')
            };
          }
          return part; // Return non-text parts unchanged
        });
      }
      
      // Return only standard OpenAI Chat Completions API fields
      const cleanedMsg = {
        role: msg.role,
        content: content
      };
      
      // Preserve tool_calls if present (for function calling)
      if (msg.tool_calls) {
        cleanedMsg.tool_calls = msg.tool_calls;
      }
      
      return cleanedMsg;
    } else if (msg.role === 'system' || msg.role === 'developer') {
      // System/developer messages should only have role and content
      // Ensure content is a string for these message types
      let content = msg.content || '';
      if (typeof content !== 'string') {
        // If content is not a string, try to extract text from it
        if (Array.isArray(content)) {
          const textParts = content.filter(part => part.type === 'text').map(part => part.text || '');
          content = textParts.join(' ');
        } else {
          content = String(content);
        }
      }
      return {
        role: msg.role,
        content: content
      };
    } else if (msg.role === 'tool') {
      // Tool messages need role, content, and tool_call_id
      // Ensure content is a string for tool messages
      let content = msg.content || '';
      if (typeof content !== 'string') {
        content = String(content);
      }
      return {
        role: msg.role,
        content: content,
        tool_call_id: msg.tool_call_id
      };
    }
    
    // For any other message types, return as-is but this shouldn't happen
    return msg;
  });
};

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
 * @param {Array} uploads - Array of uploaded files
 * @param {boolean} shouldExcludeImages - Whether to exclude images from the API call
 * @returns {Object} - Object containing requestBody and headers
 */
window.prepareRequestData = function(message, uploads = [], shouldExcludeImages = false) {
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
  
  if (this.personalityPromptRadio.checked) {
    // If personality is explicitly set, use it
    if (this.personalityInput.value.trim() !== "" && 
        this.personalityInput.hasAttribute('data-explicitly-set') && 
        this.personalityInput.getAttribute('data-explicitly-set') === 'true') {
      systemPrompt = window.PERSONALITY_PROMPT_TEMPLATE
        .replace('{personality}', this.personalityInput.value.trim())
        .replace('{datetime}', currentDateTime)
        .replace('{location}', locationInfo);
    } 
    // Otherwise, use the default personality
    else if (window.DEFAULT_PERSONALITY) {
      systemPrompt = window.PERSONALITY_PROMPT_TEMPLATE
        .replace('{personality}', window.DEFAULT_PERSONALITY)
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
    // Determine the appropriate role based on the model
    const systemRole = window.config.getSystemRole ? window.config.getSystemRole(model) : 'system';
    
    // Find existing system or developer message
    const existingSystemIdx = this.conversationHistory.findIndex(msg => 
      msg.role === 'system' || msg.role === 'developer');
    
    if (existingSystemIdx >= 0) {
      // Update existing message with new role and content
      this.conversationHistory[existingSystemIdx].role = systemRole;
      this.conversationHistory[existingSystemIdx].content = systemPrompt;
    } else {
      // Add new message with appropriate role
      this.conversationHistory.unshift({ role: systemRole, content: systemPrompt });
    }
  } else {
    // Remove any existing system or developer message
    const existingSystemIdx = this.conversationHistory.findIndex(msg => 
      msg.role === 'system' || msg.role === 'developer');
    if (existingSystemIdx >= 0) {
      this.conversationHistory.splice(existingSystemIdx, 1);
    }
  }

  // Build messages array from conversation history
  let contextMessages = [];
  if (this.conversationHistory.length > 0) {
    // IMPORTANT: First extract the system message from the FULL conversation history
    // This ensures we always keep it, even when trimming long conversations
    const systemMessage = this.conversationHistory.find(msg => 
      msg.role === 'system' || msg.role === 'developer');
    
    // Get the most recent messages according to maxContext
    // Filter out the system/developer message as we're handling it separately
    let rawMessages = this.conversationHistory
      .filter(msg => msg.role !== 'system' && msg.role !== 'developer')
      .slice(-(maxContext * 2));

    if (uploads.length > 0 && !shouldExcludeImages && rawMessages.length > 0 && rawMessages[rawMessages.length - 1].role === 'user') {
      rawMessages.pop(); // replace with image-based message below
    }
    
    // Clean messages: remove thinking tags and extra fields not supported by all APIs
    rawMessages = window.cleanMessagesForApi(rawMessages);
    
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
      
      console.info(`History trimming: Original=${rawMessages.length}, After filtering=${contextMessages.length}, System/Developer message ${systemMessage ? 'preserved' : 'not found'}`);
    } else {
      // For non-function calling, just add the system/developer message back in
      contextMessages = systemMessage ? [systemMessage, ...rawMessages] : rawMessages;
    }
  }

  const apiMessages = [...contextMessages];

  if (uploads.length > 0 && !shouldExcludeImages) {
    const imageParts = uploads.map(up => ({
      type: 'image_url',
      image_url: { url: up.dataUrl }
    }));
    apiMessages.push({
      role: 'user',
      content: [
        { type: 'text', text: message },
        ...imageParts
      ]
    });
  } else {
    // Add just the text message without images
    apiMessages.push({
      role: 'user', 
      content: message
    });
  }

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
    stream: true
  };
  
  // Only add temperature and other parameters for models that support them
  const shouldUseRestrictedParams = window.config.shouldUseDeveloperRole && window.config.shouldUseDeveloperRole(model);
  
  if (!shouldUseRestrictedParams) {
    requestBody.temperature = temperature;
  }
  
  // Add tools if function calling is enabled and tools are available
  if (window.config.enableFunctionCalling && window.toolDefinitions && window.toolDefinitions.length > 0) {
    requestBody.tools = window.toolDefinitions;
    requestBody.tool_choice = "auto";
    console.info(`Tool count: ${window.toolDefinitions.length}, Service: ${currentService}, Model: ${model}`);
  } else if (window.config.enableFunctionCalling && (!window.toolDefinitions || window.toolDefinitions.length === 0)) {
    console.warn('Function calling is enabled but no tools are available. Operating in standard mode.');
  } else if (window.config.enableFunctionCalling) {
    console.warn('Function calling is enabled but toolDefinitions is undefined. Make sure tools.js is loaded before api.js');
  }

  // Add optional parameters based on service/model support
  if (currentService !== 'google' && currentService !== 'anthropic' && !shouldUseRestrictedParams) {
    // OpenAI and compatible services support top_p (but not o-series models)
    requestBody.top_p = topP;
    
    // Only add frequency/presence penalties for fully OpenAI-compatible services (but not o-series models)
    if (currentService === 'openai' || currentService === 'azure') {
      requestBody.frequency_penalty = frequencyPenalty;
      requestBody.presence_penalty = presencePenalty;
    }
  }

  // Add search_parameters for xAI Grok models
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