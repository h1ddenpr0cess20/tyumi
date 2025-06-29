/**
 * Event listeners setup for the chatbot application
 */

/**
 * Set up all event listeners for the application
 */
function setupEventListeners() {
  if (window.VERBOSE_LOGGING) console.info('Setting up event listeners...');
  // Check essential UI elements before proceeding
  if (!window.userInput || !window.sendButton) {
    console.error('Essential UI elements not found. Check your HTML structure.');
    return;
  }

  // Store original values for settings panel
  let originalPersonalityValue = '';
  let originalCustomPromptValue = '';

  // Send message on enter (without shift)
  window.userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      
      if (!window.activeAbortController) {
        window.sendMessage();
      } else {
        console.info('Message sending prevented - generation in progress');
      }
    }
  });

  // Send button click handler
  window.sendButton.addEventListener('click', window.sendMessage);

  // Fix for SVG click events in button elements
  document.querySelectorAll('#settings-button svg, #history-button svg, #gallery-button svg, .close-settings svg, .close-history svg, .close-gallery svg').forEach(svg => {
    svg.addEventListener('click', (e) => {
      e.stopPropagation();
      const parentButton = e.currentTarget.closest('button');
      if (parentButton) {
        parentButton.click();
      }
    });
  });
  // Adjust textarea height as user types
  window.userInput.addEventListener('input', () => {
    // Store the current height before resetting
    const currentHeight = window.userInput.style.height;
    // Set minimum height to prevent shrinking below the CSS defined height
    window.userInput.style.height = '56px';
    window.userInput.style.height = Math.max(56, window.userInput.scrollHeight) + 'px';
  });

  // Lazy load gallery module on first use
  if (window.galleryButton) {
    const firstGalleryClick = async (e) => {
      e.preventDefault();
      if (typeof window.loadGalleryModule === 'function') {
        await window.loadGalleryModule();
      }
      if (typeof window.initGallery === 'function') {
        window.initGallery();
      }
      window.galleryButton.removeEventListener('click', firstGalleryClick);
      window.galleryButton.click();
    };
    window.galleryButton.addEventListener('click', firstGalleryClick, { once: true });
  }
  


  // Settings panel toggle
  if (window.settingsButton && window.settingsPanel) {
    window.settingsButton.addEventListener('click', () => {
      // Store the current values when opening settings
      originalPersonalityValue = window.personalityInput.value;
      originalCustomPromptValue = window.systemPromptCustom ? window.systemPromptCustom.value : '';
      
      window.settingsPanel.classList.add('active');
      window.settingsButton.setAttribute('aria-expanded', 'true');
      window.settingsPanel.setAttribute('aria-hidden', 'false');
      window.settingsPanel.removeAttribute('inert'); // Ensure panel is not inert when opened
      window.settingsButton.style.display = 'none'; // Hide settings button when panel is active
      if (window.historyButton) window.historyButton.style.display = 'none';
      if (window.galleryButton) window.galleryButton.style.display = 'none';
      
      // Organize the settings layout for the wider panel
      if (typeof window.organizeSettingsLayout === 'function') {
        window.organizeSettingsLayout();
      }
      
      // window.updateHeaderInfo();
    });
  }

  if (window.closeSettingsButton && window.settingsPanel) {
    window.closeSettingsButton.addEventListener('click', () => {
      // Restore original values if the user didn't click their respective "Set" buttons
      if (window.personalityPromptRadio.checked) {
        window.personalityInput.value = originalPersonalityValue;
      }
      
      // For custom prompts, restore original value if they didn't click "Set Custom Prompt"
      if (window.customPromptRadio && window.customPromptRadio.checked && window.systemPromptCustom) {
        window.systemPromptCustom.value = originalCustomPromptValue;
      }
      
      window.settingsPanel.classList.remove('active');
      window.settingsButton.setAttribute('aria-expanded', 'false');
      window.settingsPanel.setAttribute('aria-hidden', 'true');
      window.settingsPanel.setAttribute('inert', 'true'); // Make panel inert when hidden
      window.settingsButton.style.display = ''; // Show settings button when panel is closed
      if (window.historyButton) window.historyButton.style.display = '';
      if (window.galleryButton) window.galleryButton.style.display = '';
      window.updateHeaderInfo();
      window.settingsButton.focus(); // Explicitly move focus
    });
  }

  // Setup slider event listeners
  setupSliderEventListeners();
  
  // Setup button event listeners
  setupButtonEventListeners(originalPersonalityValue, originalCustomPromptValue);
  
  // Setup selector event listeners
  setupSelectorEventListeners();
  
  // Setup prompt radio button event listeners
  setupPromptRadioEventListeners();
    // Setup input field event listeners
  setupInputFieldEventListeners();
  
  // Setup personality preset event listeners
  setupPersonalityPresetEventListeners();
  
  // Setup settings panel outside click handler
  setupSettingsPanelOutsideClickHandler(originalPersonalityValue, originalCustomPromptValue);
    // Setup TTS event listeners
  setupTtsEventListeners();
  
  // Setup location event listeners
  setupLocationEventListeners();
  
  // Setup tool calling event listeners
  setupToolCallingEventListeners();
  
  // Setup chat history event listeners
  setupChatHistoryEventListeners();
  
  // Setup debug event listeners
  setupDebugEventListeners();
  
  // Setup location event listeners
  setupLocationEventListeners();
}

/**
 * Setup slider event listeners
 */
function setupSliderEventListeners() {
  // Sliders value display updates
  if (window.temperatureSlider && window.temperatureValue) {
    window.temperatureSlider.addEventListener('input', () => {
      window.temperatureValue.textContent = window.temperatureSlider.value;
    });
  }

  if (window.topPSlider && window.topPValue) {
    window.topPSlider.addEventListener('input', () => {
      window.topPValue.textContent = window.topPSlider.value;
    });
  }

  if (window.frequencyPenaltySlider && window.frequencyPenaltyValue) {
    window.frequencyPenaltySlider.addEventListener('input', () => {
      window.frequencyPenaltyValue.textContent = window.frequencyPenaltySlider.value;
    });
  }

  if (window.presencePenaltySlider && window.presencePenaltyValue) {
    window.presencePenaltySlider.addEventListener('input', () => {
      window.presencePenaltyValue.textContent = window.presencePenaltySlider.value;
    });
  }
}

/**
 * Setup button event listeners
 */
function setupButtonEventListeners(originalPersonalityValue, originalCustomPromptValue) {
  // Clear memory button
  if (window.clearMemoryButton) {
    window.clearMemoryButton.addEventListener('click', () => {
      // Create a new conversation instead of just clearing the array
      window.startNewConversation('New Conversation');
      
      // Update UI
      window.updateHeaderInfo();
      if (typeof window.updateBrowserHistory === 'function') {
        window.updateBrowserHistory();
      }
      // Only focus on non-mobile devices
      if (typeof window.isMobileDevice === 'function' && !window.isMobileDevice()) {
        window.userInput.focus();
      }
    });
  }
  // Set personality button
  if (window.setPersonalityButton) {
    window.setPersonalityButton.addEventListener('click', () => {
      // Start new conversation FIRST to save current conversation with its original system prompt
      const personalityName = window.personalityInput.value.trim();
      window.startNewConversation('Personality: ' + personalityName);
      
      // THEN make UI changes for the new conversation
      // Make sure personality prompt radio is selected
      window.personalityPromptRadio.checked = true;
      
      // Mark the personality as explicitly set
      window.personalityInput.setAttribute('data-explicitly-set', 'true');
      
      // Update prompt visibility in UI
      window.updatePromptVisibility();
      
      // Close settings panel
      if (window.settingsPanel && window.settingsPanel.classList.contains('active')) {
        window.settingsPanel.classList.remove('active');
        window.settingsButton.setAttribute('aria-expanded', 'false');
        window.settingsPanel.setAttribute('aria-hidden', 'true');
        window.settingsPanel.setAttribute('inert', 'true'); // Make panel inert when hidden
        window.settingsButton.style.display = '';
        if (window.historyButton) window.historyButton.style.display = '';
        if (window.galleryButton) window.galleryButton.style.display = '';
      }
      
      // Update the UI to show the selected personality
      window.updateHeaderInfo();
      
      // Update browser history
      if (typeof window.updateBrowserHistory === 'function') {
        window.updateBrowserHistory();
      }
      if (typeof window.focusUserInputSafely === 'function') {
        window.focusUserInputSafely();
      }
    });
  }

  // Export chat button
  if (window.exportChatButton) {
    window.exportChatButton.addEventListener('click', window.exportChat);
  }
  // Reset personality button
  if (window.resetPersonalityButton) {
    window.resetPersonalityButton.addEventListener('click', () => {
      // Create a new conversation FIRST to save current conversation with its original system prompt
      window.startNewConversation('Default Personality');
      
      // THEN make UI changes for the new conversation
      // Reset to default personality from config
      window.personalityInput.value = window.DEFAULT_PERSONALITY;
      window.personalityPromptRadio.checked = true;
      
      // Mark the personality as explicitly set since user clicked reset
      window.personalityInput.setAttribute('data-explicitly-set', 'true');
      
      // Update UI
      window.updatePromptVisibility();
      window.updateHeaderInfo();
      
      // Close settings panel
      if (window.settingsPanel && window.settingsPanel.classList.contains('active')) {
        window.settingsPanel.classList.remove('active');
        window.settingsButton.setAttribute('aria-expanded', 'false');
        window.settingsPanel.setAttribute('aria-hidden', 'true');
        window.settingsPanel.setAttribute('inert', 'true'); // Make panel inert when hidden
        window.settingsButton.style.display = '';
        if (window.historyButton) window.historyButton.style.display = '';
        if (window.galleryButton) window.galleryButton.style.display = '';
      }
      
      // Update browser history
      if (typeof window.updateBrowserHistory === 'function') {
        window.updateBrowserHistory();
      }
      if (typeof window.focusUserInputSafely === 'function') {
        window.focusUserInputSafely();
      }
    });
  }
  // Add listener for the new Set Custom Prompt button
  if (window.setCustomPromptButton) {
    window.setCustomPromptButton.addEventListener('click', () => {
      // Create a new conversation FIRST to save current conversation with its original system prompt
      const customPrompt = window.systemPromptCustom ? window.systemPromptCustom.value.trim().substring(0, 30) : '';
      const conversationName = 'Custom: ' + (customPrompt || 'Prompt');
      window.startNewConversation(conversationName);
      
      // THEN make UI changes for the new conversation
      // Make sure custom prompt radio is selected
      window.customPromptRadio.checked = true;
      
      // Update prompt visibility
      window.updatePromptVisibility(); 
      
      // Close settings panel
      if (window.settingsPanel && window.settingsPanel.classList.contains('active')) {
        window.settingsPanel.classList.remove('active');
        window.settingsButton.setAttribute('aria-expanded', 'false');
        window.settingsPanel.setAttribute('aria-hidden', 'true');
        window.settingsPanel.setAttribute('inert', 'true');
        window.settingsButton.style.display = '';
        if (window.historyButton) window.historyButton.style.display = '';
        if (window.galleryButton) window.galleryButton.style.display = '';
      }
      
      // Update UI and history
      window.updateHeaderInfo();
      if (typeof window.updateBrowserHistory === 'function') {
        window.updateBrowserHistory();
      }
      window.userInput.focus();
    });
  }
  // Add listener for the new Set No Prompt button
  if (window.setNoPromptButton) {
    window.setNoPromptButton.addEventListener('click', () => {
      // Create new conversation FIRST to save current conversation with its original system prompt
      window.startNewConversation('No System Prompt');
      
      // THEN make UI changes for the new conversation
      // Make sure no prompt radio is selected
      window.noPromptRadio.checked = true;
      
      // Update prompt visibility
      window.updatePromptVisibility();
      
      // Close settings panel
      if (window.settingsPanel && window.settingsPanel.classList.contains('active')) {
        window.settingsPanel.classList.remove('active');
        window.settingsButton.setAttribute('aria-expanded', 'false');
        window.settingsPanel.setAttribute('aria-hidden', 'true');
        window.settingsPanel.setAttribute('inert', 'true');
        window.settingsButton.style.display = '';
        if (window.historyButton) window.historyButton.style.display = '';
        if (window.galleryButton) window.galleryButton.style.display = '';
      }
      
      // Update UI and history
      window.updateHeaderInfo();
      if (typeof window.updateBrowserHistory === 'function') {
        window.updateBrowserHistory();
      }
      window.userInput.focus();
    });
  }  // Reset model settings button
  const resetModelSettingsButton = document.getElementById('reset-model-settings');
  if (resetModelSettingsButton) {
    resetModelSettingsButton.addEventListener('click', () => {
      if (window.temperatureSlider) {
        window.temperatureSlider.value = window.DEFAULT_SETTINGS.temperature;
        if (window.temperatureValue) window.temperatureValue.textContent = window.DEFAULT_SETTINGS.temperature;
      }
      if (window.topPSlider) {
        window.topPSlider.value = window.DEFAULT_SETTINGS.topP;
        if (window.topPValue) window.topPValue.textContent = window.DEFAULT_SETTINGS.topP;
      }
      if (window.frequencyPenaltySlider) {
        window.frequencyPenaltySlider.value = window.DEFAULT_SETTINGS.frequencyPenalty;
        if (window.frequencyPenaltyValue) window.frequencyPenaltyValue.textContent = window.DEFAULT_SETTINGS.frequencyPenalty;
      }
      if (window.presencePenaltySlider) {
        window.presencePenaltySlider.value = window.DEFAULT_SETTINGS.presencePenalty;
        if (window.presencePenaltyValue) window.presencePenaltyValue.textContent = window.DEFAULT_SETTINGS.presencePenalty;
      }
      if (window.maxContextInput) {
        window.maxContextInput.value = window.DEFAULT_SETTINGS.maxContextMessages;
      }
    });
  }

  // Refresh Ollama models button handler
  const refreshOllamaModelsButton = document.getElementById('refresh-ollama-models');
  if (refreshOllamaModelsButton) {
    refreshOllamaModelsButton.addEventListener('click', async (event) => {
      // Prevent the event from closing the settings panel
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation(); // Stop other handlers from firing
      
      if (window.config && window.config.services.ollama && typeof window.config.services.ollama.fetchAndUpdateModels === 'function') {
        // Change the button appearance to indicate loading
        refreshOllamaModelsButton.disabled = true;
        refreshOllamaModelsButton.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="rotating-svg">
            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
          </svg>
        `;
        
        try {
          await window.config.services.ollama.fetchAndUpdateModels();
          
          // Update the model selector now that we have fresh models
          window.updateModelSelector();
          
          // Show success message in the Ollama section
          const existingStatus = document.querySelector('.ollama-status');
          if (existingStatus) {
            existingStatus.remove();
          }
          
          const statusElement = document.createElement('div');
          statusElement.className = 'ollama-status success';
          statusElement.textContent = 'Ollama models updated successfully!';
          
          const ollamaActionButtons = document.querySelector('.ollama-action-buttons');
          if (ollamaActionButtons) {
            ollamaActionButtons.insertAdjacentElement('afterend', statusElement);
            
            // Auto-remove after 5 seconds
            setTimeout(() => {
              statusElement.remove();
            }, 5000);
          }
        } catch (error) {
          console.error('Error refreshing Ollama models:', error);
          
          // Show error message in the Ollama section
          const existingStatus = document.querySelector('.ollama-status');
          if (existingStatus) {
            existingStatus.remove();
          }
          
          const statusElement = document.createElement('div');
          statusElement.className = 'ollama-status error';
          statusElement.textContent = 'Failed to refresh Ollama models';
          
          const ollamaActionButtons = document.querySelector('.ollama-action-buttons');
          if (ollamaActionButtons) {
            ollamaActionButtons.insertAdjacentElement('afterend', statusElement);
            
            // Auto-remove after 5 seconds
            setTimeout(() => {
              statusElement.remove();
            }, 5000);
          }
        } finally {
          // Restore button appearance
          refreshOllamaModelsButton.disabled = false;
          refreshOllamaModelsButton.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
            </svg>
          `;
        }
      }
    });
  }
}

/**
 * Setup selector event listeners
 */
function setupSelectorEventListeners() {
  // Model selector change handler
  if (window.modelSelector) {
    window.modelSelector.addEventListener('change', () => {
      window.modelSelector.setAttribute('data-last-selected', window.modelSelector.value);
      window.updateHeaderInfo();
      if (typeof window.updateBrowserHistory === 'function') {
        window.updateBrowserHistory();
      }
    });
  }

  // Service selector change handler
  if (window.serviceSelector) {
    window.serviceSelector.addEventListener('change', () => {
      const selectedService = window.serviceSelector.value;
      
      window.config.defaultService = selectedService;
      if (typeof window.ensureApiKeysLoaded === 'function') {
        window.ensureApiKeysLoaded();
      }
      window.updateModelSelector();
      window.updateParameterControls();
      window.updateHeaderInfo();
      if (typeof window.updateBrowserHistory === 'function') {
        window.updateBrowserHistory();
      }
    });
  }
}

/**
 * Setup prompt radio button event listeners
 */
function setupPromptRadioEventListeners() {
  // Event listeners for prompt type radio buttons to update UI visibility
  if (window.personalityPromptRadio) {
    window.personalityPromptRadio.addEventListener('change', () => {
      if (window.personalityPromptRadio.checked) {
        window.updatePromptVisibility();
      }
    });
  }
  
  if (window.customPromptRadio) {
    window.customPromptRadio.addEventListener('change', () => {
      if (window.customPromptRadio.checked) {
        window.updatePromptVisibility();
      }
    });
  }
  
  if (window.noPromptRadio) {
    window.noPromptRadio.addEventListener('change', () => {
      if (window.noPromptRadio.checked) {
        window.updatePromptVisibility();
      }
    });
  }
}

/**
 * Setup input field event listeners
 */
function setupInputFieldEventListeners() {
  if (window.personalityInput) {
    // Add keydown event listener to set personality on Enter key press
    window.personalityInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        
        // Trigger the same functionality as the Set Personality button
        if (window.setPersonalityButton) {
          window.setPersonalityButton.click();
        }
      }
    });
    
    window.personalityInput.addEventListener('input', window.debounce(() => {
      // Personality updates are handled when Set Personality button is clicked
    }, 1000));
  }
  
  if (window.systemPromptCustom) {
    window.systemPromptCustom.addEventListener('input', window.debounce(() => {
      // Custom prompts should also wait for Set button click, just like personality
      // No automatic updateHeaderInfo or updateBrowserHistory here
    }, 1000));
  }
}

/**
 * Setup personality preset button event listeners
 */
function setupPersonalityPresetEventListeners() {
  const presetButtons = document.querySelectorAll('.preset-button');
  
  presetButtons.forEach(button => {
    // Set hover tooltip from data-personality attribute
    const personality = button.getAttribute('data-personality');
    if (personality) {
      button.title = personality;
    }
    
    button.addEventListener('click', () => {
      if (personality && window.personalityInput) {
        // Start new conversation FIRST to save current conversation with its original system prompt
        window.startNewConversation('Personality: ' + personality);
        
        // THEN make UI changes for the new conversation
        // Set the personality input value
        window.personalityInput.value = personality;
        
        // Make sure personality prompt radio is selected
        if (window.personalityPromptRadio) {
          window.personalityPromptRadio.checked = true;
        }
        
        // Mark the personality as explicitly set
        window.personalityInput.setAttribute('data-explicitly-set', 'true');
        
        // Update prompt visibility in UI
        if (typeof window.updatePromptVisibility === 'function') {
          window.updatePromptVisibility();
        }
        
        // Close settings panel
        if (window.settingsPanel && window.settingsPanel.classList.contains('active')) {
          window.settingsPanel.classList.remove('active');
          window.settingsButton.setAttribute('aria-expanded', 'false');
          window.settingsPanel.setAttribute('aria-hidden', 'true');
          window.settingsPanel.setAttribute('inert', 'true');
          window.settingsButton.style.display = '';
          if (window.historyButton) window.historyButton.style.display = '';
          if (window.galleryButton) window.galleryButton.style.display = '';
        }
        
        // Update the UI to show the selected personality
        if (typeof window.updateHeaderInfo === 'function') {
          window.updateHeaderInfo();
        }
        
        // Update browser history
        if (typeof window.updateBrowserHistory === 'function') {
          window.updateBrowserHistory();
        }
        
        // Focus input if available
        if (typeof window.focusUserInputSafely === 'function') {
          window.focusUserInputSafely();
        } else if (window.userInput) {
          window.userInput.focus();
        }
      }
    });
  });
}

/**
 * Setup settings panel outside click handler
 */
function setupSettingsPanelOutsideClickHandler(originalPersonalityValue, originalCustomPromptValue) {
  document.addEventListener('click', function(e) {
    // Enhanced debugging for copy button issues
    if (window.VERBOSE_LOGGING && e.target.closest('.copy-address')) {
      console.info('Outside click handler - copy button detected:', {
        target: e.target,
        closest: e.target.closest('.copy-address'),
        defaultPrevented: e.defaultPrevented,
        cancelBubble: e.cancelBubble,
        handled: e.handled,
        timeStamp: e.timeStamp
      });
    }
    
    // If the event has been marked as handled or propagation stopped, don't do anything
    if (e.defaultPrevented || e.cancelBubble || e.handled) {
      if (window.VERBOSE_LOGGING) console.info('Outside click handler: event already handled/prevented');
      return;
    }
    
    // Also check if the event came from a copy button specifically
    const isCopyButton = e.target.closest('.copy-address');
    if (isCopyButton) {
      if (window.VERBOSE_LOGGING) console.info('Outside click handler: ignoring copy button click');
      return;
    }
    
    // Check if click target is a settings panel element
    const isSettingsPanelElement = window.settingsPanel && window.settingsPanel.contains(e.target);
    
    // Check if click target is the settings button
    const isSettingsButton = e.target === window.settingsButton;
    
    if (window.settingsPanel && window.settingsPanel.classList.contains('active') &&
        !isSettingsPanelElement &&
        !isSettingsButton) {
        
        if (window.VERBOSE_LOGGING) console.info('Outside click detected, closing settings panel');
        
        // Restore original personality value if the user didn't click "Set Personality"
        if (window.personalityPromptRadio && window.personalityPromptRadio.checked) {
          window.personalityInput.value = originalPersonalityValue;
        }
        
        // For custom prompts, restore original value if they didn't click "Set Custom Prompt"
        if (window.customPromptRadio && window.customPromptRadio.checked && window.systemPromptCustom) {
          window.systemPromptCustom.value = originalCustomPromptValue;
        }
        
        window.settingsPanel.classList.remove('active');
        window.settingsButton.setAttribute('aria-expanded', 'false');
        window.settingsPanel.setAttribute('aria-hidden', 'true');
        window.settingsPanel.setAttribute('inert', 'true'); // Make panel inert when hidden
        window.settingsButton.style.display = ''; // Show the settings button again
        if (window.historyButton) window.historyButton.style.display = '';
        if (window.galleryButton) window.galleryButton.style.display = '';
        window.updateHeaderInfo();
        window.settingsButton.focus(); // Explicitly move focus
    }
  });
}

/**
 * Setup TTS event listeners
 */
function setupTtsEventListeners() {
  // TTS settings
  if (window.ttsToggle) {
    window.ttsToggle.addEventListener('change', async (e) => {
      if (e.target.checked) {
        if (typeof window.loadTtsModule === 'function' && !window.lazyModulesLoaded?.tts) {
          await window.loadTtsModule();
        }
        // Ensure config exists after loading module
        window.ttsConfig = window.ttsConfig || { enabled: false, voice: 'ash', instructions: '', autoplay: true };
        window.ttsConfig.enabled = true;

        if (typeof window.initializeTts === 'function') {
          window.initializeTts();
        }
      } else {
        if (window.ttsConfig) {
          window.ttsConfig.enabled = false;
        }
        if (typeof window.stopTtsAudio === 'function') {
          window.stopTtsAudio();
        }
      }
    });
  }
  
  if (window.ttsAutoplayToggle) {
    window.ttsAutoplayToggle.addEventListener('change', (e) => {
      window.ttsConfig = window.ttsConfig || { enabled: false, voice: 'ash', instructions: '', autoplay: true };
      window.ttsConfig.autoplay = e.target.checked;
      
      // If autoplay was enabled and we have messages in queue, start playing
      if (e.target.checked && window.ttsMessageQueue && window.ttsMessageQueue.length > 0 && !window.activeTtsAudio) {
        window.ttsAutoplayActive = true;
        window.playNextMessageInQueue();
      }
    });
  }
  
  if (window.ttsVoiceSelector) {
    window.ttsVoiceSelector.addEventListener('change', (e) => {
      // Update the TTS configuration with the new voice
      window.ttsConfig = window.ttsConfig || { enabled: false, voice: 'ash', instructions: '', autoplay: true };
      window.ttsConfig.voice = e.target.value;
      
      // Notification is now handled in tts.js
    });
  }
  
  if (window.ttsInstructionsInput) {
    window.ttsInstructionsInput.addEventListener('change', (e) => {
      window.ttsConfig = window.ttsConfig || { enabled: false, voice: 'ash', instructions: '', autoplay: true };
      window.ttsConfig.instructions = e.target.value;
    });
  }
  if (window.testTtsButton) {
    window.testTtsButton.addEventListener('click', () => {
      window.ttsConfig = window.ttsConfig || { enabled: false, voice: 'ash', instructions: '', autoplay: true };
      if (!window.ttsConfig.enabled) {
        console.warn('TTS is disabled. Enable it first to test.');
        return;
      }
      
      // Check if OpenAI API key is configured
      const openaiApiKey = window.config.services.openai?.apiKey;
      
      if (!openaiApiKey) {
        return;
      }
      
      // Test sample message - directly call the TTS functions without showing system message
      const testMessage = 'This is a test of the text-to-speech feature. How does this voice sound?';
      
      // Direct call to speech generation to avoid system message complications
      window.generateSpeech(testMessage).then(audioData => {
        if (audioData) {
          window.playTtsAudio(audioData);
        } else {
          console.error('TTS test failed. Check console for details.');
        }
      });
    });
  }

  // Add listener for Stop Voice button
  if (window.stopTtsButton) {
    window.stopTtsButton.addEventListener('click', () => {
      if (typeof window.stopTtsAudio === 'function') {
        window.stopTtsAudio();
        // No notification popup
      }
    });
  }

  // Add listener for Clear Audio Cache button
  if (window.clearTtsCacheButton) {
    window.clearTtsCacheButton.addEventListener('click', () => {
      if (typeof window.clearTtsAudioResources === 'function') {
        window.clearTtsAudioResources();
        // No notification popup
      }
    });
  }

  // Add a beforeunload event to clean up resources when the page is closed
  window.addEventListener('beforeunload', () => {
    if (typeof window.clearTtsAudioResources === 'function') {
      window.clearTtsAudioResources();
    }
  });
}

/**
 * Setup tool calling event listeners
 */
function setupToolCallingEventListeners() {
  // Tool calling toggle change handler
  if (window.toolCallingToggle) {
    window.toolCallingToggle.addEventListener('change', (e) => {
      window.config.enableFunctionCalling = e.target.checked;
      localStorage.setItem('enableFunctionCalling', e.target.checked);
      
      // Update individual tool toggles through our dedicated function
      if (typeof window.updateMasterToolCallingStatus === 'function') {
        window.updateMasterToolCallingStatus(e.target.checked);
      } else {
        // Fallback if the function is not available
        if (window.individualToolsContainer) {
          const toggles = window.individualToolsContainer.querySelectorAll('input[type="checkbox"]');
          toggles.forEach(toggle => {
            toggle.disabled = !e.target.checked;
          });
        }
      }

      if (e.target.checked && typeof window.loadToolScripts === 'function') {
        window.loadToolScripts().catch(err => console.error('Failed to load tool scripts:', err));
      }
    });
  }
}

/**
 * Setup location event listeners
 */
function setupLocationEventListeners() {
  // Location toggle change handler
  if (window.locationToggle) {
    window.locationToggle.addEventListener('change', async (e) => {
      const isEnabled = e.target.checked;

      if (isEnabled) {
        if (typeof window.loadLocationModule === 'function' && !window.lazyModulesLoaded?.location) {
          await window.loadLocationModule();
        }
        // Request location permission
        const result = await window.requestLocation();
        
        if (result.success) {
          // Update UI on success
          if (typeof window.updateLocationUI === 'function') {
            window.updateLocationUI();
          }
          
          if (window.VERBOSE_LOGGING) {
            console.info('Location enabled:', result.locationString);
          }
        } else {
          // Reset toggle on error
          window.locationToggle.checked = false;
            // Update UI to show error
          if (typeof window.updateLocationUI === 'function') {
            window.updateLocationUI();
          }
          
          // Show error notification
          if (window.showError) {
            window.showError(`Location request failed: ${result.error}`);
          }
          
          console.warn('Location request failed:', result.error);
        }
      } else {
        // Disable location services
        if (typeof window.disableLocation === 'function') {
          window.disableLocation();
        }
        
        // Update UI
        if (typeof window.updateLocationUI === 'function') {
          window.updateLocationUI();
        }
        
        if (window.VERBOSE_LOGGING) {
          console.info('Location services disabled');
        }
      }
    });
  }
}

/**
 * Setup chat history event listeners
 */
function setupChatHistoryEventListeners() {  // Chat history panel toggle
  if (window.historyButton && window.historyPanel) {
    window.historyButton.addEventListener('click', async () => {
      if (typeof window.loadHistoryModule === 'function' && !window.lazyModulesLoaded?.history) {
        await window.loadHistoryModule();
      }
      const isExpanded = window.historyButton.getAttribute('aria-expanded') === 'true';
      window.historyButton.setAttribute('aria-expanded', String(!isExpanded));
      window.historyPanel.setAttribute('aria-hidden', String(isExpanded));
      if (!isExpanded) {
        window.historyPanel.removeAttribute('inert');
        if (typeof window.renderChatHistoryList === 'function') {
          window.renderChatHistoryList();
        }
      } else {
        window.historyPanel.setAttribute('inert', 'true');
      }
    });
  }

  // Close history panel
  if (window.closeHistoryButton && window.historyPanel) {
    window.closeHistoryButton.addEventListener('click', () => {
      window.historyPanel.setAttribute('aria-hidden', 'true');
      window.historyPanel.setAttribute('inert', 'true');
      window.historyButton.setAttribute('aria-expanded', 'false');
      window.historyButton.focus(); // Explicitly move focus
    });
  }
}

/**
 * Setup debug event listeners
 */
function setupDebugEventListeners() {
  // Setup triple-click debug toggle on About tab
  setupAboutTabDebugToggle();
  
  // Debug images button - only show in developer mode
  if (window.debugImagesButton) {
    // Only show the debug button if in developer mode
    if (localStorage.getItem('developerMode') === 'true') {
      window.debugImagesButton.style.display = 'block';
      
      // Add click handler for the debug button
      window.debugImagesButton.addEventListener('click', () => {
        if (typeof window.debugImageLoading === 'function') {
          const diagnostics = window.debugImageLoading(true);
          console.group('Image Loading Diagnostics Results');
          console.table(diagnostics);
          
          // Show a summary in an alert
          const summary = `Image Loading Diagnostics:
- Messages with images: ${diagnostics.messagesWithImages}
- Total image placeholders: ${diagnostics.totalImagePlaceholders}
- Filename-specific placeholders: ${diagnostics.filenameSpecificPlaceholders}
- Generic placeholders: ${diagnostics.genericPlaceholders}
- Images missing message associations: ${diagnostics.imagesWithoutAssociatedMessage}`;
          
          alert(summary);
          
          // Run the image association function to fix any issues
          if (typeof window.ensureImagesHaveMessageIds === 'function') {
            const fixedCount = window.ensureImagesHaveMessageIds();
            console.info(`Fixed ${fixedCount} image associations`);
            if (fixedCount > 0) {
              alert(`Fixed ${fixedCount} image associations. Save the conversation to preserve these changes.`);
            }
          }
        } else {
          console.error('Debug image loading function not available');
          alert('Debug image loading function not available');
        }
      });
    }
  }
}

/**
 * Setup triple-click debug toggle on About tab
 */
function setupAboutTabDebugToggle() {
  const aboutTab = document.getElementById('tab-about');
  if (!aboutTab) return;
  
  let clickCount = 0;
  let clickTimer = null;
  const clickTimeout = 1000;
  aboutTab.addEventListener('click', (event) => {
    clickCount++;
    
    // Clear existing timer
    if (clickTimer) {
      clearTimeout(clickTimer);
    }
    
    // Set new timer
    clickTimer = setTimeout(() => {
      // Check if we got 3 clicks
      if (clickCount === 3) {
        // Toggle debug mode
        toggleDebugMode();
      }
      
      // Reset click count
      clickCount = 0;
    }, clickTimeout);

    // If this is the third click, prevent default tab switching temporarily
    if (clickCount === 3) {
      event.preventDefault();
      event.stopPropagation();
    }
  }, true); // Use capture phase to intercept before normal tab handling
}

/**
 * Toggle debug mode (both DEBUG and VERBOSE_LOGGING variables)
 */
function toggleDebugMode() {
  // Toggle both debug variables
  window.DEBUG = !window.DEBUG;
  window.VERBOSE_LOGGING = !window.VERBOSE_LOGGING;
  
  // Update console logging behavior
  updateConsoleLogging();
  
  // Show notification
  const status = window.DEBUG ? 'enabled' : 'disabled';
  console.info(`Debug mode ${status}:`, {
    DEBUG: window.DEBUG,
    VERBOSE_LOGGING: window.VERBOSE_LOGGING
  });
  
  // Optional: Show a brief visual indicator
  showDebugToggleNotification(status);
}

/**
 * Update console logging behavior based on DEBUG and VERBOSE_LOGGING settings
 */
function updateConsoleLogging() {
  if (window.DEBUG) {
    // Add timestamps and enhance logging
    console.log = function(...args) {
      if (window.VERBOSE_LOGGING) {
        const timestamp = new Date().toISOString();
        window.originalConsole.log(`[${timestamp}] [LOG]`, ...args);
      }
    };
    
    console.error = function(...args) {
      const timestamp = new Date().toISOString();
      window.originalConsole.error(`[${timestamp}] [ERROR]`, ...args);
    };
    
    console.warn = function(...args) {
      const timestamp = new Date().toISOString();
      window.originalConsole.warn(`[${timestamp}] [WARN]`, ...args);
    };
    
    console.info = function(...args) {
      if (window.VERBOSE_LOGGING) {
        const timestamp = new Date().toISOString();
        window.originalConsole.info(`[${timestamp}] [INFO]`, ...args);
      }
    };
    
    if (window.VERBOSE_LOGGING) {
      console.log('Debug mode enabled via triple-click');
    }
  } else {
    // Restore original console methods or disable logging
    if (window.originalConsole) {
      console.log = window.originalConsole.log;
      console.error = window.originalConsole.error;
      console.warn = window.originalConsole.warn;
      console.info = window.originalConsole.info;
    }
    
    // In production mode, suppress logging unless explicitly enabled
    if (!localStorage.getItem('enableLogging')) {
      console.log = function() {};
      console.info = function() {};
    }
  }
}

/**
 * Show a brief visual notification that debug mode was toggled
 */
function showDebugToggleNotification(status) {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = 'debug-toggle-notification';
  notification.textContent = `Debug Mode ${status.charAt(0).toUpperCase() + status.slice(1)}`;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: var(--accent-color);
    color: var(--button-text-color);
    padding: 10px 15px;
    border-radius: 4px;
    font-size: 0.9rem;
    z-index: 10000;
    opacity: 0;
    transition: opacity 0.3s ease;
    pointer-events: none;
  `;
  
  // Add to document
  document.body.appendChild(notification);
  
  // Animate in
  requestAnimationFrame(() => {
    notification.style.opacity = '1';
  });
  
  // Remove after 2 seconds
  setTimeout(() => {
    notification.style.opacity = '0';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, 2000);
}

// Make function available globally
window.setupEventListeners = setupEventListeners;
