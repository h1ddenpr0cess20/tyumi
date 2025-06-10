/**
 * DOM initialization for chatbot application
 */

/**
 * Initialize all DOM references
 */
function initializeDOMReferences() {  window.chatBox = document.getElementById('chat-box');
  window.userInput = document.getElementById('user-input');
  window.sendButton = document.getElementById('send-button');
  window.sendButtonIcon = window.sendButton ? {
    send: window.sendButton.querySelector('.send-icon'),
    stop: window.sendButton.querySelector('.stop-icon'),
    spinner: window.sendButton.querySelector('.stopping-spinner')
  } : null;
  window.settingsButton = document.getElementById('settings-button');
  window.settingsPanel = document.getElementById('settings-panel');
  window.closeSettingsButton = document.querySelector('.close-settings');
  window.modelSelector = document.getElementById('model-selector');
  window.serviceSelector = document.getElementById('service-selector');
  window.temperatureSlider = document.getElementById('temperature-slider');
  window.temperatureValue = document.getElementById('temperature-value');
  window.topPSlider = document.getElementById('top-p-slider');
  window.topPValue = document.getElementById('top-p-value');
  window.frequencyPenaltySlider = document.getElementById('frequency-penalty-slider');  
  window.frequencyPenaltyValue = document.getElementById('frequency-penalty-value');  
  window.presencePenaltySlider = document.getElementById('presence-penalty-slider');
  window.presencePenaltyValue = document.getElementById('presence-penalty-value');
  window.maxContextInput = document.getElementById('max-context');
  window.personalityPromptRadio = document.getElementById('personality-prompt');
  window.customPromptRadio = document.getElementById('custom-prompt');
  window.noPromptRadio = document.getElementById('no-prompt');
  window.personalityInput = document.getElementById('personality-input');
  window.systemPromptCustom = document.getElementById('system-prompt-custom');
  window.clearMemoryButton = document.getElementById('clear-memory');
  window.exportChatButton = document.getElementById('export-chat');
  window.resetPersonalityButton = document.getElementById('reset-personality');
  window.setPersonalityButton = document.getElementById('set-personality');
  window.setCustomPromptButton = document.getElementById('set-custom-prompt');
  window.setNoPromptButton = document.getElementById('set-no-prompt');
    // TTS elements
  window.ttsToggle = document.getElementById('tts-toggle');
  window.ttsAutoplayToggle = document.getElementById('tts-autoplay-toggle');
  window.ttsVoiceSelector = document.getElementById('tts-voice-selector');
  window.ttsInstructionsInput = document.getElementById('tts-instructions');
  window.testTtsButton = document.getElementById('test-tts');
  window.stopTtsButton = document.getElementById('stop-tts');
  window.clearTtsCacheButton = document.getElementById('clear-tts-cache');

  // Location elements
  window.locationToggle = document.getElementById('location-toggle');
  window.locationStatus = document.getElementById('location-status');

  // Tool calling toggle element
  window.toolCallingToggle = document.getElementById('tool-calling-toggle');
  
  // Individual tools container
  window.individualToolsContainer = document.getElementById('individual-tools-container');

  // Chat history elements
  window.historyButton = document.getElementById('history-button');
  window.historyPanel = document.getElementById('history-panel');
  window.closeHistoryButton = document.querySelector('.close-history');
  window.historyList = document.getElementById('history-list');
  
  // Gallery elements
  window.galleryButton = document.getElementById('gallery-button');
  window.galleryPanel = document.getElementById('gallery-panel');
  window.closeGalleryButton = document.querySelector('.close-gallery');
  window.galleryGrid = document.getElementById('gallery-grid');

  if (window.VERBOSE_LOGGING) console.info('DOM references assigned:', {
    chatBox: !!window.chatBox,
    userInput: !!window.userInput,
    sendButton: !!window.sendButton,
    modelSelector: !!window.modelSelector,
    serviceSelector: !!window.serviceSelector
    // ...add more if needed
  });
}

// Make function available globally
window.initializeDOMReferences = initializeDOMReferences;