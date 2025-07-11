/**
 * All global variables and DOM element references for the chatbot application
 */

// -----------------------------------------------------
// Global variables and state
// -----------------------------------------------------
window.conversationHistory = [];
window.activeAbortController = null;
window.hljsLoaded = false;
window.shouldStopGeneration = false;
window.shouldAutoScroll = true;

// Add chat history variables
window.currentConversationId = null;
window.currentConversationName = null;
window.generatedImages = [];
window.currentGeneratedImageHtml = [];
window.loadedSystemPrompt = null;
window.loadedModel = null;
window.loadedService = null;

// Default settings are now pulled from config.js
// window.DEFAULT_SYSTEM_PROMPT and window.DEFAULT_PERSONALITY are defined there

// -----------------------------------------------------
// DOM element references
// -----------------------------------------------------
// Main UI elements
window.chatBox = null;
window.userInput = null;
window.sendButton = null;
window.sendButtonIcon = null;
window.settingsButton = null;
window.settingsPanel = null;
window.closeSettingsButton = null;

// Model and service controls
window.modelSelector = null;
window.serviceSelector = null;
window.temperatureSlider = null;
window.temperatureValue = null;
window.topPSlider = null;
window.topPValue = null;
window.frequencyPenaltySlider = null;
window.frequencyPenaltyValue = null;
window.presencePenaltySlider = null;
window.presencePenaltyValue = null;
window.topKSlider = null;
window.topKValue = null;
window.maxTokensInput = null;
window.maxContextInput = null;

// Prompt configuration elements
window.personalityPromptRadio = null;
window.personalityInput = null;
window.customPromptRadio = null;
window.systemPromptCustom = null;
window.noPromptRadio = null;

// Action buttons
window.clearMemoryButton = null;
window.exportChatButton = null;
window.resetPersonalityButton = null;
window.setPersonalityButton = null;
window.setCustomPromptButton = null;
window.setNoPromptButton = null;

// TTS-related references
window.ttsToggle = null;
window.ttsAutoplayToggle = null;
window.ttsVoiceSelector = null;
window.ttsInstructionsInput = null;
window.testTtsButton = null;
window.stopTtsButton = null;
window.clearTtsCacheButton = null;

// Location-related references
window.locationToggle = null;
window.locationStatus = null;

// Tool calling toggle reference
window.toolCallingToggle = null;
window.individualToolsContainer = null;

// Chat history references
window.historyButton = null;
window.historyPanel = null;
window.closeHistoryButton = null;
window.historyList = null;

// Gallery references
window.galleryButton = null;
window.galleryPanel = null;
window.closeGalleryButton = null;
window.galleryGrid = null;