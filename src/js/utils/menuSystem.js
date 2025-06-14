/**
 * Handles loading external HTML content and initializing menus
 */

// HTML Content Loader Utility
window.HTMLLoader = {
  /**
   * Load HTML content from a file and insert it into a container
   * @param {string} filePath - Path to the HTML file
   * @param {string} containerId - ID of the container element
   */
  async loadHTML(filePath, containerId) {
    try {
      const response = await fetch(filePath);
      if (!response.ok) {
        throw new Error(`Failed to load ${filePath}: ${response.status}`);
      }
      const htmlContent = await response.text();
      const container = document.getElementById(containerId);
      if (container) {
        container.innerHTML = htmlContent;
      } else {
        console.error(`Container with ID '${containerId}' not found`);
      }
    } catch (error) {
      console.error(`Error loading HTML content from ${filePath}:`, error);
    }
  },

  /**
   * Load multiple HTML files into their respective containers
   * @param {Array} loadConfigs - Array of {filePath, containerId} objects
   */
  async loadMultiple(loadConfigs) {
    const promises = loadConfigs.map(config => 
      this.loadHTML(config.filePath, config.containerId)
    );
    await Promise.all(promises);
  }
};

// Menu Loader Initialization
(async function initializeMenus() {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    await new Promise(resolve => document.addEventListener('DOMContentLoaded', resolve));
  }
  
  // Wait for the HTML loader to be available
  if (typeof window.HTMLLoader === 'undefined') {
    console.error('HTMLLoader not available');
    return;
  }

  try {
    // Load the combined panels HTML file
    await window.HTMLLoader.loadHTML('src/html/panels.html', 'menu-panels-container');
    console.log('All menu panels loaded successfully');
    
    // Now that menus are loaded, initialize the application
    if (typeof initialize === 'function') {
      initialize();
    } else {
      console.error('Initialize function not found');
    }
  } catch (error) {
    console.error('Error loading menu panels:', error);
  }
})();
