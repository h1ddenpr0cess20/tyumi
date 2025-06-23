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
  const tools = getAllToolDefinitions();  // Define tool categories
  const categories = {
    'Search': [
      'google_search', 'openai_search'
    ],
    'News': [
      'search_news', 'headlines', 'local_headlines', 'full_story_coverage'
    ],
    'Business': [
      'local_business_search', 'get_business_details', 'get_business_reviews'
    ],
    'Social Media': [
      'search_tweets', 'get_user_profile', 'get_user_tweets', 
      'get_trending_topics', 'get_tweet_details', 'search_users'
    ],
    'Entertainment': [
      'search_imdb', 'get_title_details', 'get_actor_details', 
      'steam_search_games', 'steam_get_app_details', 'steam_get_app_reviews',
      'youtube_search', 'youtube_video_details'
    ],
    'Images': [
      'openai_image', 'grok_image', 'gemini_image', 'openai_image_edit'
    ],
    'Finance': [
      'crypto_prices', 'twelve_data_price', 'twelve_data_quote'
    ],    'More': [
      'search_recipes', 'weather', 'search_jobs', 'get_job_details'
    ]
  };

  // Create categorized tool groups
  for (const [categoryName, toolNames] of Object.entries(categories)) {
    const categoryTools = tools.filter(tool => toolNames.includes(tool.name));
    
    if (categoryTools.length === 0) continue;

    // Create category container
    const categoryDiv = document.createElement('div');
    categoryDiv.className = 'tool-category';

    // Create category header
    const headerDiv = document.createElement('div');
    headerDiv.className = 'tool-category-header';
    headerDiv.textContent = categoryName;

    // Create grid for tools in this category
    const gridDiv = document.createElement('div');
    gridDiv.className = 'tool-category-grid';

    // Add tools to the grid
    categoryTools.forEach(tool => {
      const toolElement = createToolToggle(tool);
      gridDiv.appendChild(toolElement);
    });

    categoryDiv.appendChild(headerDiv);
    categoryDiv.appendChild(gridDiv);
    container.appendChild(categoryDiv);
  }

  // Add any uncategorized tools
  const categorizedToolNames = Object.values(categories).flat();
  const uncategorizedTools = tools.filter(tool => !categorizedToolNames.includes(tool.name));
  
  if (uncategorizedTools.length > 0) {
    const categoryDiv = document.createElement('div');
    categoryDiv.className = 'tool-category';

    const headerDiv = document.createElement('div');
    headerDiv.className = 'tool-category-header';
    headerDiv.textContent = 'Other Tools';

    const gridDiv = document.createElement('div');
    gridDiv.className = 'tool-category-grid';

    uncategorizedTools.forEach(tool => {
      const toolElement = createToolToggle(tool);
      gridDiv.appendChild(toolElement);
    });

    categoryDiv.appendChild(headerDiv);
    categoryDiv.appendChild(gridDiv);
    container.appendChild(categoryDiv);
  }
  // Initialize tool state from localStorage
  initToolStatesFromStorage();
  
  // Set up bulk action buttons
  setupBulkActionButtons();
  
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
  
  // Add tooltip with tool description
  if (tool.description) {
    toolElement.setAttribute('data-tooltip', tool.description);
  }
  
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
  
  toggleContainer.appendChild(input);
  toggleContainer.appendChild(toggleLabel);
  
  toolElement.appendChild(label);
  toolElement.appendChild(toggleContainer);
  
  // No longer adding description paragraph - using tooltip instead
  
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
    // Hide/show the entire container based on master toggle
    container.style.display = enabled ? 'flex' : 'none';
    
    const toggles = container.querySelectorAll('input[type="checkbox"]');
    toggles.forEach(toggle => {
      toggle.disabled = !enabled;
    });
  }
  
  // Also hide/show the bulk action buttons
  const bulkActions = document.querySelector('.tools-bulk-actions');
  if (bulkActions) {
    bulkActions.style.display = enabled ? 'flex' : 'none';
  }
  
  // Hide/show the "Individual Tool Settings" section header and description
  const individualToolsSection = document.querySelector('#content-tools .settings-group .setting-item h4');
  if (individualToolsSection && individualToolsSection.textContent === 'Individual Tool Settings') {
    const settingItem = individualToolsSection.closest('.setting-item');
    if (settingItem) {
      settingItem.style.display = enabled ? 'block' : 'none';
    }
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
  
  if (window.DEBUG) {
    console.log('Setting up bulk action buttons:', {
      enableAllButton: !!enableAllButton,
      disableAllButton: !!disableAllButton
    });
  }
  
  if (enableAllButton) {
    enableAllButton.addEventListener('click', () => {
      if (window.DEBUG) console.log('Enable all tools clicked');
      setAllTools(true);
    });
  } else {
    console.warn('Enable all tools button not found');
  }
  
  if (disableAllButton) {
    disableAllButton.addEventListener('click', () => {
      if (window.DEBUG) console.log('Disable all tools clicked');
      setAllTools(false);
    });
  } else {
    console.warn('Disable all tools button not found');
  }
}

/**
 * Set all tools to enabled or disabled
 * @param {boolean} enabled - Whether to enable or disable all tools
 */
function setAllTools(enabled) {
  if (window.DEBUG) {
    console.log(`Setting all tools to ${enabled ? 'enabled' : 'disabled'}`);
  }
  
  // Only do this if the master toggle is enabled
  if (!window.config.enableFunctionCalling) {
    console.warn('Cannot set all tools: master tool calling is disabled');
    return;
  }
  
  const tools = getAllToolDefinitions();
  if (window.DEBUG) {
    console.log(`Found ${tools.length} tools to update`);
  }
  
  // Update all toggles and trigger their change events
  tools.forEach(tool => {
    const toggle = document.getElementById(`tool-toggle-${tool.name}`);
    if (toggle && !toggle.disabled) {
      toggle.checked = enabled;
      // Trigger the toggle function to ensure everything is updated properly
      window.toggleTool(tool.name, enabled);
    }
  });
  
  if (window.DEBUG) {
    console.log('All tools update complete');
  }
}
