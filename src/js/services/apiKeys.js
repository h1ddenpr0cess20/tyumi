/**
 * API key management functionality
 */

// -----------------------------------------------------
// API key management functions
// -----------------------------------------------------

// Storage keys for local storage
const API_KEYS_STORAGE_PREFIX = 'tyumi_api_key_';
const OLLAMA_SERVER_URL_KEY = 'tyumi_ollama_server_url';

// DOM element references
window.apiKeyInputs = {
    openai: null,
    xai: null,
    anthropic: null,
    google: null,
    mistral: null,
    huggingface: null,
    github: null
};

// Tool-specific API key inputs
window.toolApiKeyInputs = {
    rapidapi: null,
    // alphavantage: null, // Disabled
    openweather: null
};

window.ollamaServerUrlInput = null;
window.saveApiKeysButton = null;
window.saveOllamaUrlButton = null;
window.saveToolsApiKeysButton = null;

/**
 * Initialize API key management functionality
 */
window.initApiKeys = function() {
    // Get DOM references for main API keys
    window.apiKeyInputs.openai = document.getElementById('openai-api-key');
    window.apiKeyInputs.xai = document.getElementById('xai-api-key');    window.apiKeyInputs.anthropic = document.getElementById('anthropic-api-key');
    window.apiKeyInputs.google = document.getElementById('google-api-key');
    window.apiKeyInputs.mistral = document.getElementById('mistral-api-key');
    window.apiKeyInputs.huggingface = document.getElementById('huggingface-api-key');
    window.apiKeyInputs.github = document.getElementById('github-api-key');      // Get DOM references for tool-specific API keys
    window.toolApiKeyInputs.rapidapi = document.getElementById('tool-rapidapi-key');
    // window.toolApiKeyInputs.alphavantage = document.getElementById('tool-alphavantage-key'); // Disabled
    window.toolApiKeyInputs.openweather = document.getElementById('tool-openweather-key');
    
    window.ollamaServerUrlInput = document.getElementById('ollama-server-url');
    window.saveApiKeysButton = document.getElementById('save-api-keys');
    window.saveOllamaUrlButton = document.getElementById('save-ollama-url');
    window.saveToolsApiKeysButton = document.getElementById('save-tools-api-keys');    // Add click handlers to prevent propagation on all input fields
    Object.values(window.apiKeyInputs).forEach(input => {
        if (input) {
            input.addEventListener('click', function(event) {
                event.stopPropagation();
            });
        }
    });
    
    // Add click handlers for tool-specific API key inputs
    Object.values(window.toolApiKeyInputs).forEach(input => {
        if (input) {
            input.addEventListener('click', function(event) {
                event.stopPropagation();
            });
        }
    });
    
    // Also add click handler for Ollama server URL input
    if (window.ollamaServerUrlInput) {
        window.ollamaServerUrlInput.addEventListener('click', function(event) {
            event.stopPropagation();
        });
    }
    
    // Get password toggle buttons
    const toggleButtons = document.querySelectorAll('.toggle-password');
      // Add event listeners to toggle password visibility
    toggleButtons.forEach(button => {
        button.addEventListener('click', function(event) {
            // Prevent the event from propagating up to parent elements
            event.preventDefault();
            event.stopPropagation();
            
            const inputId = this.getAttribute('data-for');
            const input = document.getElementById(inputId);
            
            if (input.type === 'password') {
                input.type = 'text';
                this.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                        <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                `;
            } else {
                input.type = 'password';
                this.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                `;
            }
        });
    });    // Add event listener to save button
    if (window.saveApiKeysButton) {
        window.saveApiKeysButton.addEventListener('click', function(event) {
            // Prevent event propagation
            event.preventDefault();
            event.stopPropagation();
            window.saveApiKeys();
        });
    }
    
    // Add event listener to save Ollama URL button
    if (window.saveOllamaUrlButton) {
        window.saveOllamaUrlButton.addEventListener('click', function(event) {
            // Prevent event propagation
            event.preventDefault();
            event.stopPropagation();
            window.saveOllamaServerUrl();
        });    }
    
    // Add event listener to save tools API keys button
    if (window.saveToolsApiKeysButton) {
        window.saveToolsApiKeysButton.addEventListener('click', function(event) {
            // Prevent event propagation
            event.preventDefault();
            event.stopPropagation();
            window.saveToolsApiKeys();
        });
    }
    
    // Load API keys from storage
    window.loadApiKeys();
};

/**
 * Save API keys to localStorage
 */
window.saveApiKeys = function() {
    try {
        // Save each API key to localStorage
        for (const [service, input] of Object.entries(window.apiKeyInputs)) {
            if (input && input.value) {
                localStorage.setItem(`${API_KEYS_STORAGE_PREFIX}${service}`, input.value);
                
                // Update the config object
                if (window.config && window.config.services && window.config.services[service]) {
                    window.config.services[service].apiKey = input.value;
                }
            }
        }
        
        // Show success message
        window.showApiKeyStatus('API Keys saved successfully!', 'success');
          // Update the UI to reflect the new keys
        if (typeof window.updateModelSelector === 'function') {
            window.updateModelSelector(false); // Don't commit the model selection
        }
        
        if (window.VERBOSE_LOGGING) {
            console.info('API keys saved to localStorage');
        }
    } catch (error) {
        console.error('Error saving API keys:', error);
        window.showApiKeyStatus('Error saving API keys', 'error');
    }
};

/**
 * Save Ollama server URL to localStorage
 */
window.saveOllamaServerUrl = function() {
    try {
        // Save Ollama server URL
        if (window.ollamaServerUrlInput && window.ollamaServerUrlInput.value) {
            let serverUrl = window.ollamaServerUrlInput.value.trim();
            
            // Remove trailing slash if present
            if (serverUrl.endsWith('/')) {
                serverUrl = serverUrl.slice(0, -1);
            }
            
            // Remove /v1 suffix if present (we'll add it back when getting the URL)
            if (serverUrl.endsWith('/v1')) {
                serverUrl = serverUrl.slice(0, -3);
            }
            
            localStorage.setItem(OLLAMA_SERVER_URL_KEY, serverUrl);
              // Update the config object with the full URL including /v1
            if (window.config && window.config.services && window.config.services.ollama) {
                window.config.services.ollama.baseUrl = serverUrl + '/v1';
                
                // Fetch models from the new URL
                if (typeof window.config.services.ollama.fetchAndUpdateModels === 'function') {
                    window.config.services.ollama.fetchAndUpdateModels().catch(error => {
                        console.error('Error fetching Ollama models after URL update:', error);
                    });
                }            }
            
            // Show success message in the Ollama section
            const existingStatus = document.querySelector('.ollama-status');
            if (existingStatus) {
                existingStatus.remove();
            }
            
            const statusElement = document.createElement('div');
            statusElement.className = `ollama-status success`;
            statusElement.textContent = 'Ollama Server URL saved successfully!';
            
            const ollamaActionButtons = document.querySelector('.ollama-action-buttons');
            if (ollamaActionButtons) {
                ollamaActionButtons.insertAdjacentElement('afterend', statusElement);
                
                // Auto-remove after 5 seconds
                setTimeout(() => {
                    statusElement.remove();
                }, 5000);
            }
            
            if (window.VERBOSE_LOGGING) {
                console.info('Ollama Server URL saved to localStorage:', serverUrl);
            }        } else {
            // Show error message in the Ollama section
            const existingStatus = document.querySelector('.ollama-status');
            if (existingStatus) {
                existingStatus.remove();
            }
            
            const statusElement = document.createElement('div');
            statusElement.className = `ollama-status error`;
            statusElement.textContent = 'Please enter a valid Ollama Server URL';
            
            const ollamaActionButtons = document.querySelector('.ollama-action-buttons');
            if (ollamaActionButtons) {
                ollamaActionButtons.insertAdjacentElement('afterend', statusElement);
                
                // Auto-remove after 5 seconds
                setTimeout(() => {
                    statusElement.remove();
                }, 5000);
            }
        }
    } catch (error) {
        console.error('Error saving Ollama Server URL:', error);
        
        // Show error message in the Ollama section
        const existingStatus = document.querySelector('.ollama-status');
        if (existingStatus) {
            existingStatus.remove();
        }
        
        const statusElement = document.createElement('div');
        statusElement.className = `ollama-status error`;
        statusElement.textContent = 'Error saving Ollama Server URL';
        
        const ollamaActionButtons = document.querySelector('.ollama-action-buttons');
        if (ollamaActionButtons) {
            ollamaActionButtons.insertAdjacentElement('afterend', statusElement);
            
            // Auto-remove after 5 seconds
            setTimeout(() => {
                statusElement.remove();
            }, 5000);
        }
    }
};

/**
 * Save tool-specific API keys to localStorage
 */
window.saveToolsApiKeys = function() {
    try {        // Save each tool API key to localStorage
        for (const [service, input] of Object.entries(window.toolApiKeyInputs)) {
            if (input && input.value) {
                localStorage.setItem(`tyumi_tool_api_key_${service}`, input.value);
            }
        }
        
        // Show success message
        window.showToolsApiKeyStatus('Tool API Keys saved successfully!', 'success');
        
        if (window.VERBOSE_LOGGING) {
            console.info('Tool API keys saved to localStorage');
        }
    } catch (error) {
        console.error('Error saving tool API keys:', error);
        window.showToolsApiKeyStatus('Error saving tool API keys', 'error');
    }
};

/**
 * Load API keys from localStorage
 */
window.loadApiKeys = function() {
    try {
        // Load each API key from localStorage
        for (const [service, input] of Object.entries(window.apiKeyInputs)) {
            if (input) {
                const storedKey = localStorage.getItem(`${API_KEYS_STORAGE_PREFIX}${service}`);
                
                if (storedKey) {
                    input.value = storedKey;
                    
                    // Update the config object
                    if (window.config && window.config.services && window.config.services[service]) {
                        window.config.services[service].apiKey = storedKey;
                    }
                } else if (window.config && window.config.services && window.config.services[service] && window.config.services[service].apiKey) {
                    // If nothing in localStorage but key exists in config, show it in the input
                    // This preserves any hardcoded keys
                    input.value = window.config.services[service].apiKey;
                }
            }
        }
          // Load Ollama server URL
        if (window.ollamaServerUrlInput) {
            const storedUrl = localStorage.getItem(OLLAMA_SERVER_URL_KEY);
            
            if (storedUrl) {
                window.ollamaServerUrlInput.value = storedUrl;
                
                // Update the config object (ensuring it has the /v1 ending)
                if (window.config && window.config.services && window.config.services.ollama) {
                    window.config.services.ollama.baseUrl = storedUrl + '/v1';
                }
            } else if (window.config && window.config.services && window.config.services.ollama && window.config.services.ollama.baseUrl) {
                // If nothing in localStorage but URL exists in config, show it in the input without the /v1 part
                let configUrl = window.config.services.ollama.baseUrl;
                if (configUrl.endsWith('/v1')) {
                    configUrl = configUrl.slice(0, -3);
                }
                window.ollamaServerUrlInput.value = configUrl;
            }        }
          // Load tool-specific API keys
        for (const [service, input] of Object.entries(window.toolApiKeyInputs)) {
            if (input) {
                const storedKey = localStorage.getItem(`tyumi_tool_api_key_${service}`);
                if (storedKey) {
                    input.value = storedKey;
                }
            }
        }
        
        if (window.VERBOSE_LOGGING) {
            console.info('API keys loaded from localStorage');
        }
    } catch (error) {
        console.error('Error loading API keys:', error);
    }
};

/**
 * Gets an API key for a service from localStorage
 * @param {string} service - The service to get the key for
 * @returns {string|null} - The API key or null if not found
 */
window.getApiKey = function(service) {
    try {
        // Try localStorage first
        const storedKey = localStorage.getItem(`${API_KEYS_STORAGE_PREFIX}${service}`);
        if (storedKey) {
            return storedKey;
        }
        
        // Fall back to config if exists
        if (window.config?.services?.[service]?.apiKey) {
            return window.config.services[service].apiKey;
        }
        
        return null;
    } catch (error) {
        console.error(`Error getting API key for ${service}:`, error);        return null;
    }
};

/**
 * Gets a tool API key for a service from localStorage
 * @param {string} service - The service to get the key for (e.g., 'rapidapi', 'alphavantage')
 * @returns {string|null} - The API key or null if not found
 */
window.getToolApiKey = function(service) {    try {
        // Try localStorage first
        const storedKey = localStorage.getItem(`tyumi_tool_api_key_${service}`);
        if (storedKey) {
            return storedKey;
        }
        
        return null;
    } catch (error) {
        console.error(`Error getting tool API key for ${service}:`, error);
        return null;
    }
};

/**
 * Gets the Ollama server URL from localStorage
 * @returns {string|null} - The Ollama server URL or null if not found
 */
window.getOllamaServerUrl = function() {
    try {
        // Try localStorage first
        let storedUrl = localStorage.getItem(OLLAMA_SERVER_URL_KEY);
        if (storedUrl) {
            // Ensure the URL ends with /v1
            if (!storedUrl.endsWith('/v1')) {
                storedUrl = storedUrl + '/v1';
            }
            return storedUrl;
        }
        
        // Fall back to config if exists
        if (window.config?.services?.ollama?.baseUrl) {
            return window.config.services.ollama.baseUrl;
        }
        
        // Default fallback
        return 'http://localhost:11434/v1';
    } catch (error) {
        console.error('Error getting Ollama server URL:', error);
        return 'http://localhost:11434/v1';
    }
};

/**
 * Ensure API keys are loaded and warn if missing
 */
window.ensureApiKeysLoaded = function() {
    // Load keys if not already loaded
    if (typeof window.loadApiKeys === 'function') {
        window.loadApiKeys();
    }

    if (!window.config || !window.config.services) return;

    const service = window.config.defaultService;

    // Skip warning for services that don't require a key (e.g., Ollama)
    if (service === 'ollama') return;

    const apiKey = window.getApiKey ? window.getApiKey(service) : null;

    // Track warnings to avoid repetition
    window._shownApiKeyWarnings = window._shownApiKeyWarnings || new Set();

    // Notification disabled - users can check API key status in settings if needed
    // if (!apiKey && window.showWarning && !window._shownApiKeyWarnings.has(service)) {
    //     const name = service.charAt(0).toUpperCase() + service.slice(1);
    //     window.showWarning(`${name} API key is missing. Please add it in the API Keys settings.`);
    //     window._shownApiKeyWarnings.add(service);
    // }
};

/**
 * Show status message in the API keys tab
 * @param {string} message - The message to show
 * @param {string} type - The type of message ('success' or 'error')
 */
window.showApiKeyStatus = function(message, type = 'success') {
    // Remove any existing status message
    const existingStatus = document.querySelector('.api-keys-status');
    if (existingStatus) {
        existingStatus.remove();
    }
    
    // Create a new status message
    const statusElement = document.createElement('div');
    statusElement.className = `api-keys-status ${type}`;
    statusElement.textContent = message;
    
    // Add status message to the DOM
    const apiKeysActionButtons = document.querySelector('.api-keys-action-buttons');
    if (apiKeysActionButtons) {
        apiKeysActionButtons.insertAdjacentElement('afterend', statusElement);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            statusElement.remove();
        }, 5000);
    }
};

/**
 * Show status message in the Tools API keys section
 * @param {string} message - The message to show
 * @param {string} type - The type of message ('success' or 'error')
 */
window.showToolsApiKeyStatus = function(message, type = 'success') {
    // Remove any existing status message
    const existingStatus = document.querySelector('.tools-api-keys-status');
    if (existingStatus) {
        existingStatus.remove();
    }
    
    // Create a new status message
    const statusElement = document.createElement('div');
    statusElement.className = `tools-api-keys-status ${type}`;
    statusElement.textContent = message;
    
    // Add status message to the DOM
    const toolsApiKeysActionButtons = document.querySelector('.tools-api-keys-actions');
    if (toolsApiKeysActionButtons) {
        toolsApiKeysActionButtons.insertAdjacentElement('afterend', statusElement);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            statusElement.remove();
        }, 5000);
    }
};

// Initialize API keys management on page load
document.addEventListener('DOMContentLoaded', function() {
    // Give a small delay to ensure other components are initialized
    setTimeout(function() {
        window.initApiKeys();
        
        // Log success message if verbose logging is enabled
        if (window.VERBOSE_LOGGING) {
            console.info('API keys management system initialized');
        }
    }, 100);
});

// Initialize API keys when the config object is ready
// This ensures API keys are loaded even if the DOMContentLoaded event has already fired
if (window.config && window.config.services) {
    window.initApiKeys();
}
