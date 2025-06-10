/**
 * Model settings initialization for the chatbot application
 */

/**
 * Initialize model settings controls with values from config
 */
function initializeModelSettings() {
  if (window.temperatureSlider && window.temperatureValue) {
    window.temperatureSlider.value = window.DEFAULT_SETTINGS.temperature;
    window.temperatureValue.textContent = window.DEFAULT_SETTINGS.temperature;
  }
  
  if (window.topPSlider && window.topPValue) {
    window.topPSlider.value = window.DEFAULT_SETTINGS.topP;
    window.topPValue.textContent = window.DEFAULT_SETTINGS.topP;
  }
  
  if (window.frequencyPenaltySlider && window.frequencyPenaltyValue) {
    window.frequencyPenaltySlider.value = window.DEFAULT_SETTINGS.frequencyPenalty;
    window.frequencyPenaltyValue.textContent = window.DEFAULT_SETTINGS.frequencyPenalty;
  }    if (window.presencePenaltySlider && window.presencePenaltyValue) {
    window.presencePenaltySlider.value = window.DEFAULT_SETTINGS.presencePenalty;
    window.presencePenaltyValue.textContent = window.DEFAULT_SETTINGS.presencePenalty;
  }
  
  if (window.maxContextInput) {
    window.maxContextInput.value = window.DEFAULT_SETTINGS.maxContextMessages;
  }
  
  if (window.VERBOSE_LOGGING) console.info('Model settings initialized from config');
}

// Make function available globally
window.initializeModelSettings = initializeModelSettings;
