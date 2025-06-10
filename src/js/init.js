/**
 * Core initialization entry point for the chatbot application
 * 
 * This file has been refactored into multiple smaller modules:
 * - init/globals.js - Global variables and state
 * - init/dom.js - DOM element references and initialization
 * - init/modelSettings.js - Model parameter initialization
 * - init/marked.js - Markdown parser initialization
 * - init/services.js - Service and model initialization
 * - init/ttsInitialization.js - TTS functionality initialization
 * - init/aboutTab.js - About tab and crypto donations setup
 * - init/eventListeners.js - All event listener setup
 * - init/initialization.js - Main initialization coordinator
 * 
 * Make sure to include all these files in your HTML:
 * 
 * <script src="src/js/init/globals.js"></script>
 * <script src="src/js/init/dom.js"></script>
 * <script src="src/js/init/modelSettings.js"></script>
 * <script src="src/js/init/marked.js"></script>
 * <script src="src/js/init/services.js"></script>
 * <script src="src/js/init/ttsInitialization.js"></script>
 * <script src="src/js/init/aboutTab.js"></script>
 * <script src="src/js/init/eventListeners.js"></script>
 * <script src="src/js/init/initialization.js"></script>
 * 
 * The initialization.js file contains the main DOMContentLoaded listener
 * that coordinates the entire startup process.
 */

// Legacy support - if modules aren't loaded, show error
if (typeof initializeDOMReferences === 'undefined') {
  console.error('Initialization modules not loaded! Please include all init/*.js files in your HTML.');
  console.error('See the comment at the top of init.js for the required script tags.');
}

// All functions have been moved to modular files:
// - initializeMobileKeyboardHandling -> init/ttsInitialization.js
// - initializeTts -> init/ttsInitialization.js
// - populateTtsVoiceSelector -> init/ttsInitialization.js
// All TTS initialization functions have been moved to init/ttsInitialization.js
// Do not implement them here to avoid conflicts with the modularized code