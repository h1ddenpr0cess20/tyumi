/**
 * User interaction handling for the chatbot application
 */

// -----------------------------------------------------
// Helper functions
// -----------------------------------------------------

/**
 * Checks if the current model/service supports vision capabilities
 * @returns {boolean} - True if the current model supports vision
 */
function currentModelSupportsVision() {
  const currentService = window.config.defaultService;
  
  // xAI (Grok) doesn't support vision
  if (currentService === 'xai') {
    return false;
  }
  
  // For Ollama, check if the current model is a vision model
  if (currentService === 'ollama') {
    const model = window.modelSelector ? window.modelSelector.value : '';
    if (!model) return false;
    
    // List of vision models available in Ollama (based on ollama.com/search?c=vision)
    const ollamaVisionModels = [
      'mistral-small3.2',
      'qwen2.5vl',
      'mistral-small3.1',
      'llama4',
      'gemma3',
      'granite3.2-vision',
      'llama3.2-vision',
      'minicpm-v',
      'llava-phi3',
      'llava-llama3',
      'moondream',
      'bakllava',
      'llava'
    ];
    
    // Check if the current model matches any vision model (case-insensitive)
    const modelLower = model.toLowerCase();
    return ollamaVisionModels.some(visionModel => 
      modelLower.includes(visionModel.toLowerCase()) || 
      modelLower.startsWith(visionModel.toLowerCase())
    );
  }
  
  // For other services (OpenAI, Anthropic, etc.), assume they support vision
  // Most modern API services have vision-capable models
  return true;
}

// -----------------------------------------------------
// Message sending and related functionality
// -----------------------------------------------------

/**
 * Sends a message to the API and handles the response
 */
window.sendMessage = async function() {
  const message = window.userInput.value.trim();
  if (!message && (!window.pendingUploads || window.pendingUploads.length === 0)) {
    if (window.VERBOSE_LOGGING) console.info('No message entered. sendMessage aborted.');
    return;
  }

  const uploads = window.pendingUploads || [];
  let uploadHtml = '';
  let placeholders = [];
  uploads.forEach(up => {
    const ext = up.file && up.file.name.includes('.') ? up.file.name.split('.').pop() : 'png';
    const filename = `upload-${Date.now()}-${Math.random().toString(36).substring(2,8)}.${ext}`;
    up.filename = filename;
    up.timestamp = new Date().toISOString();
    uploadHtml += `<img src="${up.dataUrl}" alt="Uploaded Image" class="generated-image-thumbnail" data-filename="${filename}" data-timestamp="${up.timestamp}" />`;
    placeholders.push(`[[IMAGE: ${filename}]]`);
  });
  
  window.shouldStopGeneration = false;
  
  // Create a new AbortController for this request
  window.activeAbortController = new AbortController();
  if (window.VERBOSE_LOGGING) console.info('New message send initiated:', message);

  
  // Transform send button into stop button
  window.sendButton.classList.add('stop-mode');
  window.sendButton.title = "Stop generation";
  
  // Change button action to stop generation
  window.sendButton.removeEventListener('click', window.sendMessage);
  window.sendButton.addEventListener('click', window.stopGeneration);

  let userHtml = window.sanitizeInput(message);
  if (uploadHtml) {
    userHtml = `<div class="generated-images">${uploadHtml}</div>` + userHtml;
  }

  // Add user message to the conversation and store in history manually
  const userElement = window.appendMessage('You', userHtml, 'user', true);
  const userId = userElement ? userElement.id : (typeof window.generateMessageId === 'function'
    ? window.generateMessageId()
    : 'msg-' + Date.now());
  const historyContent = placeholders.length > 0 ? `${placeholders.join('\n')}\n\n${message}` : message;
  window.conversationHistory.push({
    role: 'user',
    content: historyContent,
    id: userId,
    timestamp: new Date().toISOString()
  });
  if (typeof window.addMessageCopyButton === 'function') {
    window.addMessageCopyButton(userElement, userId);
  }
  if (uploads.length > 0) {
    window.generatedImages = window.generatedImages || [];
    for (const up of uploads) {
      window.generatedImages.push({
        url: up.dataUrl,
        tool: 'upload',
        prompt: '',
        timestamp: up.timestamp,
        filename: up.filename,
        associatedMessageId: userId,
        uploaded: true
      });
      if (window.saveImageToDb) {
        window.saveImageToDb(up.dataUrl, up.filename, {
          tool: 'upload',
          prompt: '',
          timestamp: up.timestamp,
          associatedMessageId: userId,
          uploaded: true
        }).catch(err => console.error('Failed to save upload image:', err));
      }
    }
    window.pendingUploads = [];
    const preview = document.querySelector('.upload-previews');
    if (preview) preview.innerHTML = '';
  }
  console.info('User message added to conversation history.');
  // Auto-save after user message
  if (window.saveCurrentConversation) window.saveCurrentConversation();
  
  // Clear input and adjust height
  window.userInput.value = '';
  window.userInput.style.height = 'auto';

  // Create loading message with pure animation
  const loadingId = 'loading-' + Date.now();
  const loadingHTML = '<div class="loading-animation"><div class="loading-dot"></div><div class="loading-dot"></div><div class="loading-dot"></div></div>';
  window.appendMessage('Assistant', loadingHTML, 'assistant', true);
  const loadingElement = window.chatBox.lastElementChild;
  loadingElement.id = loadingId;
  
  // Update browser URL
  if (typeof window.updateBrowserHistory === 'function') {
    window.updateBrowserHistory();
    console.info('Browser history updated.');
  }

  try {
    // Get API endpoint and prepare request data
    const apiEndpoint = window.getApiEndpoint();
    
    // Check if current model supports vision and exclude images if not
    const supportsVision = currentModelSupportsVision();
    const shouldExcludeImages = uploads.length > 0 && !supportsVision;
    
    // Use the historyContent (which includes placeholders) for the API call
    const messageWithPlaceholders = placeholders.length > 0 ? `${placeholders.join('\n')}\n\n${message}` : message;
    const { requestBody, headers } = window.prepareRequestData(messageWithPlaceholders, uploads, shouldExcludeImages);

    // Ensure an API key is configured before proceeding (except for Ollama)
    const currentService = window.config.defaultService;
    const apiKey = window.config.getApiKey ? window.config.getApiKey() : null;
    if (!apiKey && currentService !== 'ollama') {
      // Remove the loading indicator and warn the user
      window.removeLoadingIndicator(loadingId);
      if (window.showWarning) {
        const name = currentService.charAt(0).toUpperCase() + currentService.slice(1);
        window.showWarning(`${name} API key is missing. Please add it in the API Keys settings.`);
      }
      return;
    }

    if (window.VERBOSE_LOGGING) console.info('API request prepared:', { apiEndpoint, requestBody, headers });

    // Check if function calling is enabled and toolDefinitions exists with actual tools
    const useFunctionCalling = window.config.enableFunctionCalling === true && 
                               typeof window.toolDefinitions !== 'undefined' && 
                               Array.isArray(window.toolDefinitions) && 
                               window.toolDefinitions.length > 0;
    
    let response;
    if (useFunctionCalling) {
      if (window.VERBOSE_LOGGING) console.info('Using function calling logic');
      // Use the function calling handler
      response = await window.handleFunctionCalling(requestBody, headers);
      if (window.VERBOSE_LOGGING) console.info('Function calling response received:', response);
    } else {
      // Make standard API call
      response = await window.callApi(apiEndpoint, requestBody, headers, window.activeAbortController);
      if (window.VERBOSE_LOGGING) console.info('Standard API response received:', response);
    }
    
    if (!response) {
      // Request was aborted
      window.removeLoadingIndicator(loadingId);
      window.resetSendButton();
      console.warn('API response was empty (possibly aborted).');
      return;
    }    // For function calling responses, we handle them the same as regular responses
    if (useFunctionCalling) {
      if (window.VERBOSE_LOGGING) console.info('Processing function calling response');
      
      // Check if response is valid and has headers before processing
      if (!response || !response.headers) {
        console.error('Invalid response from function calling:', response);
        window.removeLoadingIndicator(loadingId);
        window.resetSendButton();
        if (window.showError) {
          window.showError('Function calling failed. Please try again.');
        }
        return;
      }
      
      // Check if response is a streaming response
      const contentType = response.headers.get('content-type');
      const isStreamingResponse = contentType && contentType.includes('text/event-stream');
      
      if (isStreamingResponse) {
        // Handle streaming response
        if (window.VERBOSE_LOGGING) console.info('Handling streaming response from function calling');
        await window.handleStreamedResponse(response, loadingId);
        if (window.VERBOSE_LOGGING) console.info('Streaming function calling response handled.');
      } else {
        // Handle non-streaming response
        const data = await response.json();
        if (window.VERBOSE_LOGGING) console.info('TOOL CALLING RESPONSE DATA (non-streaming):', JSON.stringify(data, null, 2));
        window.handleNonStreamingResponse(data, loadingId);
        if (window.VERBOSE_LOGGING) console.info('Non-streaming function calling response handled.');
      }
      return;
    }    // For standard API responses, check if streaming is supported
    if (!response || !response.headers) {
      console.error('Invalid response from API:', response);
      window.removeLoadingIndicator(loadingId);
      window.resetSendButton();
      if (window.showError) {
        window.showError('API request failed. Please check your settings and try again.');
      }
      return;
    }
    
    const contentType = response.headers.get('content-type');
    const isStreamingResponse = contentType && contentType.includes('text/event-stream');
    if (window.VERBOSE_LOGGING) console.info('Response content-type:', contentType, 'Streaming:', isStreamingResponse);

    if (isStreamingResponse) {
      // Handle streaming response
      await window.handleStreamedResponse(response, loadingId);
      if (window.VERBOSE_LOGGING) console.info('Streaming response handled.');
    } else {
      // Handle non-streaming response
      const data = await response.json();
      window.handleNonStreamingResponse(data, loadingId);
      if (window.VERBOSE_LOGGING) console.info('Non-streaming response handled.');
    }

  } catch (error) {
    console.error('Error during message send:', error);
    window.handleInvalidResponse(loadingId);
    if (window.showError) {
      window.showError(`Error: ${error.message}`);
    }
  } finally {
    // Reset UI state
    window.resetSendButton();
    if (uploads.length > 0 && typeof window.stripBase64FromHistory === 'function') {
      window.stripBase64FromHistory(userId, placeholders);
    }
    if (window.VERBOSE_LOGGING) console.info('Send button reset.');
  }
};

/**
 * Stops ongoing generation
 */
window.stopGeneration = function() {
  if (window.activeAbortController) {
    window.sendButton.disabled = true;
    window.sendButton.classList.add('stopping');
    window.sendButton.classList.remove('stop-mode');
    
    window.shouldStopGeneration = true;
    window.activeAbortController.abort();
    window.activeAbortController = null;
  }
};

/**
 * Resets the send button to its original state
 */
window.resetSendButton = function() {
  window.sendButton.classList.remove('stop-mode', 'stopping');
  window.sendButton.title = "Send message";
  window.sendButton.disabled = false;
  
  // Reset the abort controller
  window.activeAbortController = null;
  
  // Reset both button and enter key handlers
  window.sendButton.removeEventListener('click', window.stopGeneration);
  window.sendButton.addEventListener('click', window.sendMessage);
  
  // Make sure userInput is properly enabled but don't focus on mobile
  if (window.userInput) {
    window.userInput.disabled = false;
    
    // Only focus on desktop devices, skip on mobile to prevent keyboard popup
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                    window.innerWidth <= 768;
    
    if (!isMobile) {
      window.userInput.focus();
    } else if (typeof window.scrollInputIntoView === 'function') {
      // For mobile, ensure the input is visible without forcing focus
      window.scrollInputIntoView();
    }
  }
};