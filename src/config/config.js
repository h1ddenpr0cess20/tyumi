/**
 * Configuration file for the chatbot application
 * This file must be loaded before any other JavaScript files
 */

// Enable debug mode (set to false in production)
window.DEBUG = false;
// Enable verbose logging (set to false to reduce log noise)
window.VERBOSE_LOGGING = false;

// Store any API keys (these should be set by the user in the UI and stored in localStorage)
// DO NOT hardcode actual API keys here

// Application version
window.APP_VERSION = '0.9.3';

// GitHub repository URL
window.GITHUB_URL = 'https://github.com/h1ddenpr0cess20/Nonagon';


// Cryptocurrency donation addresses
window.CRYPTO_DONATIONS = [
  {
    name: 'Bitcoin (BTC)',
    address: '34rgxUdtg3aM5Fm6Q3aMwT1qEuFYQmSzLd',
    symbol: 'BTC'
  },
  {
    name: 'Bitcoin Cash (BCH)',
    address: '13JUmyzZ3vnddCqiqwAvzHJaCmMcjVpJD1',
    symbol: 'BCH'
  },
  {
    name: 'Ethereum (ETH)',
    address: '0xE8ac85A7331F66e7795A64Ab51C8c5A5A85Ed761',
    symbol: 'ETH'
  }, 
  {
    name: 'Dogecoin (DOGE)',
    address: 'DCmgAhS7U77krayBN1cooeaic2H8F289uY',
    symbol: 'DOGE'
  }
];

// Default system prompts
window.DEFAULT_SYSTEM_PROMPT = 'You are a helpful AI assistant. Provide clear, accurate, and concise information. Respond in a friendly, professional, and engaging manner. Adapt your tone to the user’s needs and always prioritize usefulness and clarity.';
window.DEFAULT_PERSONALITY = 'a helpful and knowledgeable assistant named Nonagon';

// Prompt templates
window.PERSONALITY_PROMPT_TEMPLATE = 'Assume the personality of {personality}. Roleplay and never break character. Keep your responses relatively short and to the point unless the prompt implies a longer response (such as articles, poems, stories, etc.  use your best judgment). [current date and location, for reference when needed: {datetime} | {location}]';
window.CUSTOM_PROMPT_TEMPLATE = '{custom_prompt} (current date and location, for reference when needed: {datetime}, {location})';

// Default model and UI settings
window.DEFAULT_SETTINGS = {
  temperature: 0.7,
  topP: 0.8,
  frequencyPenalty: 1.0,
  presencePenalty: 1.0,
  maxContextMessages: 10
};

// Set up console logging wrapper for better debugging
// Store original console methods globally so they can be accessed by debug toggle
window.originalConsole = {
  log: console.log,
  error: console.error,
  warn: console.warn,
  info: console.info
};

if (window.DEBUG) {
  // Add timestamps and enhance logging
  console.log = function(...args) {
    if (window.VERBOSE_LOGGING) {
      const timestamp = new Date().toISOString();
      window.originalConsole.log(`[${timestamp}] [LOG]`, ...args);
    }
  };
  
  console.error = function(...args) {
    const timestamp = new Date().toISOString();
    window.originalConsole.error(`[${timestamp}] [ERROR]`, ...args);
  };
  
  console.warn = function(...args) {
    const timestamp = new Date().toISOString();
    window.originalConsole.warn(`[${timestamp}] [WARN]`, ...args);
  };
  
  console.info = function(...args) {
    if (window.VERBOSE_LOGGING) {
      const timestamp = new Date().toISOString();
      window.originalConsole.info(`[${timestamp}] [INFO]`, ...args);
    }
  };
  
  if (window.VERBOSE_LOGGING) {
    console.log('Debug mode enabled');
  }
} else {
  // In production mode, suppress logging unless explicitly enabled
  if (!localStorage.getItem('enableLogging')) {
    console.log = function() {};
    console.info = function() {};
  }
}

// Handle uncaught errors
window.addEventListener('error', function(event) {
  if (window.DEBUG) {
    console.error('Uncaught error:', event.error || event.message || 'Unknown error');
  }
});

// OpenAI API Configuration

window.config = {
    // Default service to use
    defaultService: 'openai',
    
    // Enable OpenAI function calling
    enableFunctionCalling: false,
    
    // Configure services (add more as needed)
    services: {
        // Standard OpenAI service
        openai: {
            baseUrl: 'https://api.openai.com/v1',
            apiKey: '',
            models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4.1', 'gpt-4.1-mini', 'gpt-4.1-nano', 'o3-mini', 'o4-mini', 'o3-pro', 'o3'],
            defaultModel: 'gpt-4.1-mini',
            organization: null,  // OpenAI organization ID (if applicable)
        },
        
        // x.ai API (Grok)
        xai: {
            baseUrl: 'https://api.x.ai/v1',
            apiKey: '',
            models: ['grok-3-mini-fast-latest', 'grok-3-mini-latest', 'grok-3-fast-latest', 'grok-3-latest'],
            defaultModel: 'grok-3-latest',
        },
        
        // Google's Gemini API
        google: {
            baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
            apiKey: '',
            models: ['gemini-1.5-flash', 'gemini-2.0-flash-exp', 'gemini-2.5-pro-exp-03-25', 'gemini-2.5-flash-preview-04-17'],
            defaultModel: 'gemini-2.5-flash-preview-04-17',
        },
        
        // Anthropic API (Claude)
        anthropic: {
            baseUrl: 'https://api.anthropic.com/v1',
            apiKey: '',
            models: ['claude-3-5-sonnet-latest', 'claude-3-7-sonnet-latest', 'claude-sonnet-4-0', 'claude-opus-4-0', 'claude-3-opus-latest', 'claude-3-5-haiku-latest'],
            defaultModel: 'claude-sonnet-4-0',
        },
        
        // Mistral AI API
        mistral: {
            baseUrl: 'https://api.mistral.ai/v1',
            apiKey: '',
            models: ['mistral-large-latest', 'mistral-small-latest', 'mistral-medium-latest', 'codestral-latest'],
            defaultModel: 'mistral-small-latest',
        },
        
        // Ollama - Local AI models with OpenAI-compatible API
        ollama: {
            baseUrl: 'http://localhost:11434/v1',
            apiKey: '', // Typically empty for Ollama
            models: [], // Initialize as empty, will be populated dynamically
            defaultModel: 'qwen3',
            modelsFetching: false, // Track fetching state

            // New function to fetch and update Ollama models
            async fetchAndUpdateModels() {
                this.modelsFetching = true; // Set flag when starting fetch
                let ollamaApiRoot = 'http://localhost:11434'; // Default Ollama API root

                if (typeof window.getOllamaServerUrl === 'function') {
                    const configuredOllamaUrl = window.getOllamaServerUrl();
                    try {
                        const urlObj = new URL(configuredOllamaUrl);
                        ollamaApiRoot = `${urlObj.protocol}//${urlObj.host}`; // Strips path, gets http://host:port
                    } catch (e) {
                        console.warn(`Invalid Ollama server URL from getOllamaServerUrl ('${configuredOllamaUrl}'), attempting to parse from ollama.baseUrl. Error: ${e.message}`);
                        try {
                            const baseUrlObj = new URL(this.baseUrl); // this.baseUrl is 'http://localhost:11434/v1'
                            ollamaApiRoot = `${baseUrlObj.protocol}//${baseUrlObj.host}`;
                        } catch (e2) {
                            console.error(`Failed to parse ollama.baseUrl ('${this.baseUrl}') as well. Using hardcoded default ${ollamaApiRoot}. Error: ${e2.message}`);
                        }
                    }
                } else {
                    console.warn('window.getOllamaServerUrl function not found. Attempting to parse Ollama host from ollama.baseUrl.');
                    try {
                        const baseUrlObj = new URL(this.baseUrl);
                        ollamaApiRoot = `${baseUrlObj.protocol}//${baseUrlObj.host}`;
                    } catch (e) {
                        console.error(`Failed to parse ollama.baseUrl ('${this.baseUrl}'). Using hardcoded default ${ollamaApiRoot}. Error: ${e.message}`);
                    }
                }

                const endpoint = `${ollamaApiRoot}/api/tags`;
                console.info(`Fetching Ollama models from: ${endpoint}`);
                let fetchError = false;
                try {
                    const response = await fetch(endpoint);
                    if (!response.ok) {
                        console.error(`Error fetching Ollama models: ${response.status} ${response.statusText}. Response:`, await response.text());
                        this.models = ['Error: Could not fetch models'];
                        fetchError = true;
                    } else {
                        const data = await response.json();
                        if (data && Array.isArray(data.models)) {
                            // Process model names to remove :latest suffix 
                            this.models = data.models.map(model => {
                                // Remove :latest suffix if present
                                return model.name.endsWith(':latest') 
                                    ? model.name.slice(0, -7) // Remove the last 7 characters (':latest')
                                    : model.name;
                            }).sort();
                            
                            if (this.models.length === 0) {
                                this.models = ['No models found on server'];
                            }
                            console.info('Successfully updated Ollama models:', this.models);
                        } else {
                            console.error('Unexpected response format from Ollama /api/tags:', data);
                            this.models = ['Error: Invalid server response'];
                            fetchError = true;
                        }
                    }
                } catch (error) {
                    console.error('Failed to fetch or parse Ollama models:', error);
                    this.models = [`Error: Failed to connect to ${ollamaApiRoot}`];
                    fetchError = true;
                } finally {
                    this.modelsFetching = false; // Clear flag when done
                }

                // Attempt to update UI
                if (typeof window.uiHooks !== 'undefined' && typeof window.uiHooks.updateOllamaModelsDropdown === 'function') {
                    window.uiHooks.updateOllamaModelsDropdown(fetchError);
                } else {
                    console.warn('window.uiHooks.updateOllamaModelsDropdown function not found. UI will not be updated with new Ollama models.');
                }
            },
            
        },

    },

    // Helper function to get the active service configuration
    getActiveService: function() {
        return this.services[this.defaultService];
    },
    
    // Helper to get the API key for the current service
    getApiKey: function() {
        // First, check if the API key is available in the active service (which will be updated by apiKeys.js)
        return this.getActiveService().apiKey;
    },
    
    // Helper to get the base URL for the current service
    getBaseUrl: function() {
        // Special case for Ollama - use the stored URL if available
        if (this.defaultService === 'ollama' && typeof window.getOllamaServerUrl === 'function') {
            return window.getOllamaServerUrl();
        }
        return this.getActiveService().baseUrl;
    },
    
    // Helper to get the default model for the current service
    getDefaultModel: function() {
        const defaultModel = this.getActiveService().defaultModel;
        
        // For now, just return the default model as is
        return defaultModel;
    },
    
    // Helper to get available models for the current service
    getAvailableModels: function() {
        return this.getActiveService().models;
    },
    
    // Helper to determine if a model should use 'developer' role instead of 'system' role
    shouldUseDeveloperRole: function(modelName = null) {
        const model = modelName || this.getDefaultModel();
        
        // For OpenAI models starting with 'o' (o3-mini, o4-mini, etc.), use 'developer' role
        if (this.defaultService === 'openai' && model && model.toLowerCase().startsWith('o')) {
            return true;
        }
        
        return false;
    },
    
    // Helper to get the appropriate system role for the current model
    getSystemRole: function(modelName = null) {
        return this.shouldUseDeveloperRole(modelName) ? 'developer' : 'system';
    }
};

