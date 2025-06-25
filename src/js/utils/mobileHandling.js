/**
 * Utility functions to handle mobile keyboard behavior and scrolling optimization
 */

/**
 * Check if the device is a mobile device
 * @returns {boolean} True if the current device is mobile
 */
window.isMobileDevice = function() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
         window.innerWidth <= 768;
};

/**
 * Handles mobile keyboard appearance and ensures the input remains visible
 */
window.setupMobileKeyboardHandling = function() {
  // Check if Visual Viewport API is available
  if (window.visualViewport) {
    // Use visualViewport API to detect keyboard appearance
    window.visualViewport.addEventListener('resize', () => {
      if (document.activeElement === window.userInput) {
        window.scrollInputIntoView();
      }
    });
  }

  // Add focus event to scroll input into view when focused
  if (window.userInput) {
    window.userInput.addEventListener('focus', window.scrollInputIntoView);
  }
};

/**
 * Scrolls the input field into view
 * Uses smooth scrolling for better UX
 */
window.scrollInputIntoView = function() {
  // Use a minimal timeout to ensure DOM is ready and keyboard has appeared
  setTimeout(() => {
    // Find the input container for better positioning
    const inputContainer = document.querySelector('.input-container');
    
    if (inputContainer) {
      // Scroll the input container into view with auto behavior for faster response
      inputContainer.scrollIntoView({ behavior: 'auto', block: 'end' });
      
      // For iOS which can be particularly problematic
      if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        // Add extra padding to the bottom in iOS to prevent input from being right at screen edge
        document.body.style.paddingBottom = '20px';
      }
    }
  }, 100); // Reduced delay for faster response
};

/**
 * Safely focuses the user input field, handling mobile differences
 */
window.focusUserInputSafely = function() {
  if (!window.userInput) return;
  
  const isMobile = window.isMobileDevice();
  
  if (!isMobile) {
    // On desktop, focus immediately
    window.userInput.focus();
  } else {
    // On mobile, only focus if the user has interacted with the page
    // to prevent keyboard from automatically popping up
    document.addEventListener('touchstart', function onFirstTouch() {
      document.removeEventListener('touchstart', onFirstTouch);
      // The first touch happened, now we can enable the focus
      window.userInteracted = true;
    });
  }
};

/**
 * Initializes mobile keyboard handling for the app
 * Combined from scrollOptimizer.js
 */
window.initializeMobileKeyboardHandling = function() {
  // Setup mobile keyboard handling
  window.setupMobileKeyboardHandling();
  
  // Add a class to the body to identify mobile devices for CSS targeting
  const isMobile = window.isMobileDevice();
  
  if (isMobile) {
    document.body.classList.add('mobile-device');
  }
  
  // Optimize scrolling behavior for better performance on mobile
  window.optimizeScrolling();
  
  // Setup tap-to-expand for system prompt area
  window.setupPromptTapExpand();
};

/**
 * Optimizes scrolling behavior throughout the app
 * Makes scrolling more responsive on mobile devices
 * Combined from scrollOptimizer.js
 */
window.optimizeScrolling = function() {
  // Use passive event listeners for touch events to prevent scrolling jank
  document.addEventListener('touchstart', function() {}, { passive: true });
  document.addEventListener('touchmove', function() {}, { passive: true });
  
  // Override default scroll behavior for mobile
  if (window.chatBox) {
    // Use this technique to make scrolling more immediate on mobile
    window.fastScroll = function(element, to) {
      if (!element) return;
      
      // Check if we're on a mobile device where animations can be jerky
      const isMobile = document.body.classList.contains('mobile-device');
      
      if (isMobile) {
        // On mobile, scroll instantly for better performance
        element.scrollTop = to;
      } else {
        // On desktop, we can use smooth scrolling with a small timeout
        requestAnimationFrame(() => {
          element.scrollTop = to;
        });
      }
    };
    
    // Replace any direct scrollTop references with our optimized version
    const originalAppendMessage = window.appendMessage;
    if (originalAppendMessage) {
      window.appendMessage = function(sender, content, type, skipHistory = false) {
        const messageElement = originalAppendMessage(sender, content, type, skipHistory);
        
        // Optimize scroll behavior when adding new messages
        if (window.shouldAutoScroll && window.chatBox) {
          window.fastScroll(window.chatBox, window.chatBox.scrollHeight);
        }
        
        return messageElement;
      };
    }
  }
};

/**
 * Sets up tap-to-expand functionality for the system prompt area on mobile
 */
window.setupPromptTapExpand = function() {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.setupPromptTapExpand);
    return;
  }
  
  const promptContainer = document.getElementById('model-info');
  if (!promptContainer) {
    console.log('model-info element not found for tap-to-expand, retrying in 1 second...');
    setTimeout(window.setupPromptTapExpand, 1000);
    return;
  }
  
  // Only add this functionality on mobile devices
  const isMobile = window.isMobileDevice();
  if (!isMobile) {
    console.log('Not a mobile device, skipping tap-to-expand');
    return;
  }
  
  console.log('Setting up mobile tap-to-expand for system prompt');
  
  // Remove any existing event listeners first
  promptContainer.removeEventListener('click', handlePromptTap);
  
  function handlePromptTap(e) {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('Prompt container tapped, current classes:', promptContainer.className);
    
    // Toggle expanded state
    if (promptContainer.classList.contains('expanded')) {
      promptContainer.classList.remove('expanded');
      console.log('Collapsed prompt');
    } else {
      promptContainer.classList.add('expanded');
      console.log('Expanded prompt');
    }
  }
  
  // Add click event listener
  promptContainer.addEventListener('click', handlePromptTap);
  
  // Close expanded state when tapping elsewhere
  document.addEventListener('click', function(e) {
    if (!promptContainer.contains(e.target) && promptContainer.classList.contains('expanded')) {
      promptContainer.classList.remove('expanded');
      console.log('Closing expanded prompt');
    }
  });
  
  console.log('Tap-to-expand setup complete');
};

// Test function to manually trigger setup
window.testPromptExpand = function() {
  console.log('Manual test of prompt expand');
  const element = document.getElementById('model-info');
  if (element) {
    console.log('Found element:', element);
    console.log('Current content:', element.textContent);
    element.classList.toggle('expanded');
    console.log('Toggled expanded class, new classes:', element.className);
  } else {
    console.log('Element not found');
  }
};

// Also force setup on window load
window.addEventListener('load', function() {
  console.log('Window loaded, forcing prompt expand setup');
  setTimeout(window.setupPromptTapExpand, 100);
});
