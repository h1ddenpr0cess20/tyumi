/**
 * Tools settings panel functionality
 */

// Initialize tool-related variables
window.enabledTools = window.enabledTools || {};
window.originalToolDefinitions = null;

/**
 * Initialize the tools settings tab
 */
window.initToolsSettings = function() {
  // Keep a copy of the original tool definitions for reference
  if (!window.originalToolDefinitions) {
    window.originalToolDefinitions = JSON.parse(JSON.stringify(window.toolDefinitions));
  }

  const container = document.getElementById('individual-tools-container');
  if (!container) {
    console.error('Tools container not found');
    return;
  }

  // Clear existing tools
  container.innerHTML = '';

  // Get all available tools
  const tools = getAllToolDefinitions();

  // Create toggles for each tool
  tools.forEach(tool => {
    // Create tool toggle element
    const toolElement = createToolToggle(tool);
    container.appendChild(toolElement);
  });

  // Initialize tool state from localStorage
  initToolStatesFromStorage();
  
  // Make sure to update tool definitions based on master toggle state
  // This is critical for initial page load
  const masterEnabled = window.config && window.config.enableFunctionCalling !== false;
  if (typeof window.updateMasterToolCallingStatus === 'function') {
    window.updateMasterToolCallingStatus(masterEnabled);
  }
};

/**
 * Get all tool definitions
 * @returns {Array} Array of tool objects with name, description and active status
 */
function getAllToolDefinitions() {
  const tools = [];
    // Process all tools from toolDefinitions
  window.toolDefinitions.forEach(definition => {
    if (definition.function && definition.function.name) {
      tools.push({
        name: definition.function.name,
        description: definition.function.description,
        active: false
      });
    }
  });
  
  // Add tools from original definitions that are not in the current definitions
  // This handles tools that might have been disabled
  if (window.originalToolDefinitions) {
    window.originalToolDefinitions.forEach(definition => {
      if (definition.function && definition.function.name) {
        const name = definition.function.name;
        if (!tools.some(tool => tool.name === name)) {
          tools.push({
            name: name,
            description: definition.function.description,
            active: false
          });
        }
      }
    });
  }
  
  return tools;
}

/**
 * Create a toggle element for a tool
 * @param {Object} tool - The tool object containing name, description and active status
 * @returns {HTMLElement} The created tool toggle element
 */
function createToolToggle(tool) {
  const toolElement = document.createElement('div');
  toolElement.className = 'setting-item tool-toggle-item';
  toolElement.dataset.toolName = tool.name;
  
  const label = document.createElement('label');
  label.htmlFor = `tool-toggle-${tool.name}`;
  label.textContent = tool.name;
  
  const toggleContainer = document.createElement('div');
  toggleContainer.className = 'toggle-container';
  
  const input = document.createElement('input');
  input.type = 'checkbox';
  input.id = `tool-toggle-${tool.name}`;
  input.checked = tool.active;
  input.dataset.toolName = tool.name;
  
  // Add event listener to handle toggle
  input.addEventListener('change', (e) => {
    toggleTool(tool.name, e.target.checked);
  });
  
  const toggleLabel = document.createElement('label');
  toggleLabel.htmlFor = `tool-toggle-${tool.name}`;
  toggleLabel.className = 'toggle-switch';
  
  const description = document.createElement('p');
  description.className = 'info-text';
  description.textContent = tool.description || 'No description available';
  
  toggleContainer.appendChild(input);
  toggleContainer.appendChild(toggleLabel);
  
  toolElement.appendChild(label);
  toolElement.appendChild(toggleContainer);
  toolElement.appendChild(description);
  
  return toolElement;
}

/**
 * Initialize tool states from localStorage
 */
function initToolStatesFromStorage() {
  try {
    const storedTools = localStorage.getItem('enabledTools');
    // Check if master tool calling toggle is enabled
    const masterToggleEnabled = localStorage.getItem('enableFunctionCalling') === 'true';
    
    // Set toggle states based on stored values
    if (storedTools) {
      window.enabledTools = JSON.parse(storedTools);
      
    // Apply stored states to toggles
      const tools = getAllToolDefinitions();
      tools.forEach(tool => {
        const toggle = document.getElementById(`tool-toggle-${tool.name}`);
        if (toggle) {
          // If tool is explicitly tracked, use that value; otherwise use the default active state
          const isEnabled = window.enabledTools[tool.name] !== undefined 
            ? window.enabledTools[tool.name] 
            : tool.active;
            
          toggle.checked = isEnabled;
          
          // Disable the toggle if master tool calling is disabled
          toggle.disabled = !masterToggleEnabled;
        }
      });
      
      // Apply stored states to tool definitions - regardless of master toggle
      // This ensures definitions are correctly set on page load
      updateToolDefinitions();
    } else {      // Initialize with all current tools disabled by default
      const tools = getAllToolDefinitions();
      window.enabledTools = {};
      
      tools.forEach(tool => {
        window.enabledTools[tool.name] = tool.active;
        
        // Also update the UI toggle
        const toggle = document.getElementById(`tool-toggle-${tool.name}`);
        if (toggle) {
          toggle.checked = tool.active;
          toggle.disabled = !masterToggleEnabled;
        }
      });
      
      localStorage.setItem('enabledTools', JSON.stringify(window.enabledTools));
      
      // Apply initial states to tool definitions
      updateToolDefinitions();
    }
  } catch (error) {
    console.error('Error initializing tool states:', error);
  }
}

/**
 * Toggle a specific tool on or off
 * @param {string} toolName - The name of the tool to toggle
 * @param {boolean} enabled - Whether to enable or disable the tool
 */
window.toggleTool = function(toolName, enabled) {
  // Update in memory
  window.enabledTools[toolName] = enabled;
  
  // Save to localStorage
  localStorage.setItem('enabledTools', JSON.stringify(window.enabledTools));
  
  // Update tool definitions
  updateToolDefinitions();
};

/**
 * Update tool definitions based on enabled/disabled status
 */
function updateToolDefinitions() {
  // Start with a clean slate
  window.toolDefinitions = [];
  
  // Filter and add enabled tools from the original definitions
  if (window.originalToolDefinitions) {
    // Check master toggle state
    const masterEnabled = window.config && window.config.enableFunctionCalling !== false;
    
    window.originalToolDefinitions.forEach(definition => {
      if (definition.function && definition.function.name) {
        const toolName = definition.function.name;
          // Include tool if master toggle is on AND this specific tool is enabled
        // (default to disabled if not explicitly enabled)
        if (masterEnabled && window.enabledTools[toolName] === true) {
          // Deep clone the definition to avoid reference issues
          const clonedDef = JSON.parse(JSON.stringify(definition));
          window.toolDefinitions.push(clonedDef);
        }
      } else {
        // Include non-tool definitions (if any)
        window.toolDefinitions.push(definition);
      }
    });
  }
}

/**
 * Updates the tools description in the system prompt
 * Uses bullet points instead of numbering
 * @returns {string} - The tools description with bullet points
 */
window.getToolsDescription = function() {
  // If function calling is disabled completely, return empty string
  if (!window.config.enableFunctionCalling) {
    return '';
  }

  let toolsList = '';
  
  // Dynamically generate tool descriptions from active tools
  const activeToolDefinitions = window.toolDefinitions || [];
  
  activeToolDefinitions.forEach(definition => {
    if (definition.function && definition.function.name) {
      const toolName = definition.function.name;
      const toolDescription = definition.function.description;
        // Special handling for image generation tools - they'll be grouped together
      if (['openai_image', 'grok_image', 'gemini_image'].includes(toolName)) {
        // These will be handled separately
        return;
      }
        // Add this tool to the list
      toolsList += `
• ${toolName}
  Description: ${toolDescription}`;
    }
  });
    // Handle image generation tools separately - group them together if any are enabled
  const imageTools = ['openai_image', 'grok_image', 'gemini_image', 'openai_image_edit'];
  const enabledImageTools = imageTools.filter(toolName => {
    return activeToolDefinitions.some(def => def.function && def.function.name === toolName);
  });
  
  if (enabledImageTools.length > 0) {
    toolsList += `
• Image Generation Tools:`;
    
    enabledImageTools.forEach(toolName => {
      toolsList += `
  - ${toolName}`;
    });
    
    // Add shared description for all image tools
    toolsList += `
  Description: Generate images based on text prompts formulated from the user's request and conversation history.  
               The images will be sent to the chat interface programmatically where placeholders appear, but the actual images are not stored in the context due to the size of the base64 strings.  The images are stored in the browser's IndexedDB instead.
               Never mention the filename or placeholder text in the chat, never output an image tag.  Provide a description of the generated images.`;
  }
  
  return `
You have access to the following tools:${toolsList}
`;
};





/**
 * Update master tool calling status
 * This should be called when the master tool calling toggle is changed
 * @param {boolean} enabled - Whether tool calling is enabled
 */
window.updateMasterToolCallingStatus = function(enabled) {
  // Update tool toggles state based on master toggle
  const container = document.getElementById('individual-tools-container');
  if (container) {
    const toggles = container.querySelectorAll('input[type="checkbox"]');
    toggles.forEach(toggle => {
      toggle.disabled = !enabled;
    });
  }
  
  // Also update the tool definitions to ensure they're in sync
  // with the master toggle state
  updateToolDefinitions();
};

/**
 * Set up event listeners for the bulk action buttons
 */
function setupBulkActionButtons() {
  const enableAllButton = document.getElementById('enable-all-tools');
  const disableAllButton = document.getElementById('disable-all-tools');
  
  if (enableAllButton) {
    enableAllButton.addEventListener('click', () => {
      setAllTools(true);
    });
  }
  
  if (disableAllButton) {
    disableAllButton.addEventListener('click', () => {
      setAllTools(false);
    });
  }
}

/**
 * Set all tools to enabled or disabled
 * @param {boolean} enabled - Whether to enable or disable all tools
 */
function setAllTools(enabled) {
  // Only do this if the master toggle is enabled
  if (!window.config.enableFunctionCalling) {
    return;
  }
  
  const tools = getAllToolDefinitions();
  
  // Update all toggles
  tools.forEach(tool => {
    const toggle = document.getElementById(`tool-toggle-${tool.name}`);
    if (toggle && !toggle.disabled) {
      toggle.checked = enabled;
      window.enabledTools[tool.name] = enabled;
    }
  });
  
  // Save to localStorage
  localStorage.setItem('enabledTools', JSON.stringify(window.enabledTools));
  
  // Update tool definitions
  updateToolDefinitions();
}

// Call setupBulkActionButtons when tools settings are initialized
document.addEventListener('DOMContentLoaded', () => {
  // Wait for DOM to ensure buttons exist
  setupBulkActionButtons();
});
