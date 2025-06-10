/**
 * Core initialization and setup for the chatbot application
 * This file loads all the initialization modules
 */

// Load initialization modules in order
// Note: These files define functions on the window object, so order matters

// 1. Load global variables first
// (globals.js is loaded automatically by HTML)

// 2. Load DOM initialization
// (dom.js is loaded automatically by HTML)

// 3. Load model settings initialization
// (modelSettings.js is loaded automatically by HTML)

// 4. Load marked initialization
// (marked.js is loaded automatically by HTML)

// 5. Load services initialization
// (services.js is loaded automatically by HTML)

// 6. Load TTS initialization
// (ttsInitialization.js is loaded automatically by HTML)

// 7. Load About tab initialization
// (aboutTab.js is loaded automatically by HTML)

// 8. Load event listeners
// (eventListeners.js is loaded automatically by HTML)

// 9. Load main initialization coordinator
// (initialization.js is loaded automatically by HTML)

// All modules are now loaded via script tags in index.html
// This file serves as a reference for the loading order and can be removed
// if all modules are properly loaded via HTML script tags.

if (window.VERBOSE_LOGGING) {
  console.info('Init.js loaded - initialization modules should be loaded via HTML script tags');
}
