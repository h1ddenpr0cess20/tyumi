/**
 * User interaction handling for the chatbot application
 */

// -----------------------------------------------------
// Message sending and related functionality
// -----------------------------------------------------

/**
 * Sends a message to the API and handles the response
 */
window.sendMessage = async function() {
  const message = window.userInput.value.trim();
  if (!message) {
    if (window.VERBOSE_LOGGING) console.info('No message entered. sendMessage aborted.');
    return;
  }
  
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

  // Add user message to the conversation and store in history manually
  const userElement = window.appendMessage('You', window.sanitizeInput(message), 'user', true);
  const userId = userElement ? userElement.id : (typeof window.generateMessageId === 'function'
    ? window.generateMessageId()
    : 'msg-' + Date.now());
  window.conversationHistory.push({
    role: 'user',
    content: message,
    id: userId,
    timestamp: new Date().toISOString()
  });
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
    const { requestBody, headers } = window.prepareRequestData(message);

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