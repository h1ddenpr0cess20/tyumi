/**
 * Utility functions for the chatbot application
 */

// Using window object to make functions globally available

/**
 * Debounces a function call
 * @param {Function} func - The function to debounce
 * @param {number} wait - Time to wait in milliseconds
 * @returns {Function} - The debounced function
 */
window.debounce = function(func, wait) {
  let timeout;
  return function (...args) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), wait);
  };
};

/**
 * Throttles a function call
 * @param {Function} func - The function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} - The throttled function
 */
window.throttle = function(func, limit) {
  let inThrottle;
  return function (...args) {
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

/**
 * Sanitizes user input to prevent XSS attacks
 * @param {string} text - Text to sanitize
 * @returns {string} - Sanitized text
 */
window.sanitizeInput = function(text) {
  return text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
};


/**
 * Filter out thinking tags from assistant messages
 * @param {string} text - The text to filter
 * @returns {string} - Text with thinking tags processed
 */
window.filterThinkingTags = function(text) {
  // Extract thinking content and wrap in a styled container
  return text.replace(/<think>([\s\S]*?)<\/think>/g, function(match, thinkingContent) {
    // Create a unique ID for this thinking container
    const containerId = 'thinking-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    
    // Return raw HTML that won't be processed by markdown
    return `<div id="${containerId}" class="thinking-container collapsed">
      <div class="thinking-title" onclick="toggleThinking('${containerId}', event)">AI Thinking</div>
      <div class="thinking-content">${thinkingContent}</div>
    </div>`;
  });
};

/**
 * Toggle the visibility of the thinking/reasoning container
 * @param {string} id - The ID of the thinking container to toggle
 */
window.toggleThinking = function(id, event) {
  // Prevent event bubbling that might affect other elements
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }
  
  const thinkingContainer = document.getElementById(id);
  if (!thinkingContainer) {
    console.warn('Thinking container not found:', id);
    return;
  }
  
  // Get the current state before toggling
  const wasCollapsed = thinkingContainer.classList.contains('collapsed');
  
  // Toggle this specific container's state
  thinkingContainer.classList.toggle('collapsed');
  
  // Debug logging
  if (window.VERBOSE_LOGGING) {
    console.log(`Toggled thinking container ${id}: ${wasCollapsed ? 'expanded' : 'collapsed'}`);
  }
  
  // If we're expanding this container, scroll to show its content
  if (wasCollapsed) {
    const contentDiv = thinkingContainer.querySelector('.thinking-content');
    if (contentDiv) {
      setTimeout(() => {
        contentDiv.scrollTop = 0;
      }, 100);
    }
  }
};

/**
 * Downloads an image and converts it to base64
 * @param {string} url - The URL of the image to download
 * @returns {Promise<string>} - A promise that resolves to the base64 data URL
 */
window.downloadImageAsBase64 = async function(url) {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

// Store generated images as object URLs
window.imageStore = new Map();

/**
 * Downloads and stores an image
 * @param {string} url - The URL of the image to download
 * @returns {Promise<string>} - A promise that resolves to the blob URL
 */
window.downloadImage = async function(url) {
  const response = await fetch(url);
  const blob = await response.blob();
  const blobUrl = URL.createObjectURL(blob);
  const id = Date.now().toString();
  window.imageStore.set(id, blobUrl);
  return blobUrl;
};

/**
 * Saves a base64 image and returns a URL for display
 * @param {string} base64Data - The base64 image data
 * @param {string} prompt - The original prompt
 * @returns {string} - The object URL for the image
 */
window.saveImageToLocal = function(base64Data, prompt) {
  // Convert base64 to blob
  const byteString = atob(base64Data);
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  const blob = new Blob([ab], { type: 'image/png' });
  
  // Create and store object URL
  const imageUrl = URL.createObjectURL(blob);
  const filename = `ai_image_${Date.now()}.png`;
  window.imageStore.set(filename, imageUrl);
  
  return filename;
};

/**
 * File system utilities for image storage
 */

// Create a temp directory for storing images
window.getImageTempFolder = function() {
  // Use the OS temp directory
  const os = require('os');
  const path = require('path');
  const fs = require('fs');
  
  // Create a specific folder for our app in the temp directory
  const tempDir = path.join(os.tmpdir(), 'chatbot3-images');
  
  // Ensure the directory exists
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  
  return tempDir;
};

/**
 * Saves a base64 image to the temp folder
 * @param {string} base64Data - The base64 image data
 * @param {string} filename - The filename to save as
 * @returns {string} - The file path of the saved image
 */
window.saveImageToTemp = function(base64Data, filename) {
  const fs = require('fs');
  const path = require('path');
  
  // Get the temp folder path
  const tempFolder = window.getImageTempFolder();
  
  // Remove the data:image prefix if it exists
  let imageData = base64Data;
  if (base64Data.startsWith('data:image')) {
    // Extract the base64 part after the comma
    imageData = base64Data.split(',')[1];
  }
  
  // Create a buffer from the base64 data
  const buffer = Buffer.from(imageData, 'base64');
  
  // Generate full file path
  const filePath = path.join(tempFolder, filename);
  
  // Write the file
  fs.writeFileSync(filePath, buffer);
  
  // Return the full file path
  return filePath;
};

/**
 * Loads an image from the temp folder and returns as data URL
 * @param {string} filename - The filename to load
 * @returns {string} - The data URL of the image
 */
window.loadImageFromTemp = function(filename) {
  const fs = require('fs');
  const path = require('path');
  
  try {
    // Get the temp folder path
    const tempFolder = window.getImageTempFolder();
    
    // Generate full file path
    const filePath = path.join(tempFolder, filename);
    
    // Check if the file exists
    if (!fs.existsSync(filePath)) {
      console.warn(`Image file not found: ${filePath}`);
      return null;
    }
    
    // Read the file as buffer
    const buffer = fs.readFileSync(filePath);
    
    // Convert buffer to base64
    const base64 = buffer.toString('base64');
    
    // Determine MIME type based on file extension
    let mimeType = 'image/png'; // default
    if (filename.endsWith('.jpg') || filename.endsWith('.jpeg')) {
      mimeType = 'image/jpeg';
    } else if (filename.endsWith('.gif')) {
      mimeType = 'image/gif';
    } else if (filename.endsWith('.webp')) {
      mimeType = 'image/webp';
    }
    
    // Return as data URL
    return `data:${mimeType};base64,${base64}`;
  } catch (error) {
    console.error('Error loading image from temp folder:', error);
    return null;
  }
};

/**
 * Debug function to check thinking containers
 */
window.debugThinkingContainers = function() {
  const thinkingContainers = document.querySelectorAll('.thinking-container');
  
  console.log('=== Thinking Container Debug ===');
  console.log(`Found ${thinkingContainers.length} thinking containers`);
  
  thinkingContainers.forEach((container, index) => {
    const isCollapsed = container.classList.contains('collapsed');
    console.log(`Thinking container ${index} (${container.id}): ${isCollapsed ? 'collapsed' : 'expanded'}`);
  });
};

/**
 * Replace base64 image data URLs in a user message with filename placeholders.
 * This prevents large base64 strings from being stored in conversation history.
 * @param {string} messageId - ID of the user message
 * @param {Array} placeholders - Array of placeholder strings like '[[IMAGE: file.jpg]]'
 */
window.stripBase64FromHistory = function(messageId, placeholders = []) {
  if (!Array.isArray(window.conversationHistory)) return;
  const entry = window.conversationHistory.find(msg => msg.id === messageId);
  if (!entry || entry.role !== 'user') return;

  let textPart = entry.content || '';
  
  // Check if placeholders already exist in the content
  const existingPlaceholders = placeholders.filter(placeholder => 
    textPart.includes(placeholder)
  );
  
  // If all placeholders already exist, just remove base64 data
  if (existingPlaceholders.length === placeholders.length) {
    entry.content = textPart.replace(/data:image\/[^;]+;base64,[^\s]+/g, '').trim();
    return;
  }
  
  // Remove any base64 image data
  textPart = textPart.replace(/data:image\/[^;]+;base64,[^\s]+/g, '').trim();
  const placeholderText = placeholders.join('\n');
  entry.content = placeholderText + (textPart ? `\n\n${textPart}` : '');
};
