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
window.APP_VERSION = '0.9.9';

// GitHub repository URL
window.GITHUB_URL = 'https://github.com/h1ddenpr0cess20/Tyumi';

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
    name: 'Dogecoin (DOGE)',
    address: 'DCmgAhS7U77krayBN1cooeaic2H8F289uY',
    symbol: 'DOGE'
  }
];

// Default system prompts
window.DEFAULT_SYSTEM_PROMPT = "You are a helpful AI assistant. Provide clear, accurate, and concise information. Respond in a friendly, professional, and engaging manner. Adapt your tone to the user’s needs and always prioritize usefulness and clarity.";
window.DEFAULT_PERSONALITY = "a helpful and knowledgeable assistant named Tyumi";

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
        
        // xAI API (Grok)
        xai: {
            baseUrl: 'https://api.x.ai/v1',
            apiKey: '',
            models: [
                'grok-3-mini-fast',
                'grok-3-mini',
                'grok-3-fast',
                'grok-3'
            ],
            defaultModel: 'grok-3',
        },
        
        // Google's Gemini API
        google: {
            baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
            apiKey: '',
            models: [
                'gemini-2.0-flash',
                'gemini-2.5-pro',
                'gemini-2.5-flash',
                'gemini-2.5-flash-lite-preview-06-17'
            ],
            defaultModel: 'gemini-2.5-flash',
        },
        
        // Anthropic API (Claude)
        anthropic: {
            baseUrl: 'https://api.anthropic.com/v1',
            apiKey: '',
            models: [
                'claude-3-5-sonnet-latest',
                'claude-3-7-sonnet-latest',
                'claude-sonnet-4-0',
                'claude-opus-4-0',
                'claude-3-opus-latest',
                'claude-3-5-haiku-latest'
            ],
            defaultModel: 'claude-sonnet-4-0',
        },
        
        // Mistral API
        mistral: {
            baseUrl: 'https://api.mistral.ai/v1',
            apiKey: '',
            models: [
                'mistral-large-latest',
                'mistral-small-latest',
                'mistral-medium-latest',
                'codestral-latest'
            ],
            defaultModel: 'mistral-small-latest',
        },
        
        // Hugging Face Inference API
        huggingface: {
            baseUrl: 'https://router.huggingface.co/v1',
            apiKey: '',
            models: [
                'deepseek-ai/DeepSeek-V3',
                'deepseek-ai/DeepSeek-V3-0324',
                'deepseek-ai/DeepSeek-R1',
                'deepseek-ai/DeepSeek-R1-0528',
                'deepseek-ai/DeepSeek-R1-Distill-Qwen-32B',
                'meta-llama/Llama-4-Maverick-17B-128E-Instruct',
                'meta-llama/Llama-4-Scout-17B-16E-Instruct',
                'Qwen/QwQ-32B',
                'Qwen/Qwen3-14B',
                'Qwen/Qwen3-235B-A22B',
                'Qwen/Qwen3-30B-A3B',
                'Qwen/Qwen2.5-Coder-32B-Instruct',
                'unsloth/Mistral-Small-3.2-24B-Instruct-2506',
                'mistralai/Magistral-Small-2506',
                'mistralai/Mixtral-8x7B-Instruct-v0.1',
                'microsoft/phi-4',
                'meta-llama/Llama-3.3-70B-Instruct',
                'baidu/ERNIE-4.5-21B-A3B-PT',
                'baidu/ERNIE-4.5-VL-424B-A47B-Base-PT', 
                'failspy/llama-3-70B-Instruct-abliterated',
                'google/gemma-3-27b-it'
            ],
            defaultModel: 'Qwen/Qwen3-30B-A3B',
        },
        
        // GitHub Models
        github: {
            baseUrl: 'https://models.github.ai/inference',
            apiKey: '',
            models: [
                'openai/gpt-4.1',
                'openai/gpt-4.1-mini',
                'openai/gpt-4.1-nano',
                'openai/gpt-4o',
                'openai/gpt-4o-mini',
                'openai/o1',
                'openai/o1-mini',
                'openai/o1-preview',
                'openai/o3',
                'openai/o3-mini',
                'openai/o4-mini',
                'deepseek/deepseek-r1',
                'deepseek/deepseek-r1-0528',
                'deepseek/deepseek-v3-0324',
                'meta/llama-3.2-11b-vision-instruct',
                'meta/llama-3.2-90b-vision-instruct',
                'meta/llama-3.3-70b-instruct',
                'meta/llama-4-maverick-17b-128e-instruct-fp8',
                'meta/llama-4-scout-17b-16e-instruct',
                'meta/meta-llama-3.1-405b-instruct',
                'meta/meta-llama-3.1-8b-instruct',
                'mistral-ai/codestral-2501',
                'mistral-ai/ministral-3b',
                'mistral-ai/mistral-large-2411',
                'mistral-ai/mistral-medium-2505',
                'mistral-ai/mistral-nemo',
                'mistral-ai/mistral-small-2503',
                'xai/grok-3',
                'xai/grok-3-mini',
                'microsoft/mai-ds-r1',
                'microsoft/phi-3.5-mini-instruct',
                'microsoft/phi-3.5-moe-instruct',
                'microsoft/phi-3.5-vision-instruct',
                'microsoft/phi-3-medium-128k-instruct',
                'microsoft/phi-3-medium-4k-instruct',
                'microsoft/phi-3-mini-128k-instruct',
                'microsoft/phi-3-mini-4k-instruct',
                'microsoft/phi-3-small-128k-instruct',
                'microsoft/phi-3-small-8k-instruct',
                'microsoft/phi-4',
                'microsoft/phi-4-mini-instruct',
                'microsoft/phi-4-mini-reasoning',
                'microsoft/phi-4-multimodal-instruct',
                'microsoft/phi-4-reasoning',
                'ai21-labs/ai21-jamba-1.5-large',
                'ai21-labs/ai21-jamba-1.5-mini',
                'cohere/cohere-command-a',
                'cohere/cohere-command-r-08-2024',
                'cohere/cohere-command-r-plus-08-2024',
                'core42/jais-30b-chat'
            ],
            defaultModel: 'openai/gpt-4.1-mini',
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
                            } else {
                                // If the current default model is not in the fetched models, 
                                // and we have valid models, optionally update the default
                                const validModels = this.models.filter(model => !model.startsWith('Error:') && !model.startsWith('No models'));
                                if (validModels.length > 0 && !this.models.includes(this.defaultModel)) {
                                    console.info(`Current default model '${this.defaultModel}' not found in fetched models. Available models:`, validModels);
                                }
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
        const activeService = this.getActiveService();
        const defaultModel = activeService.defaultModel;
        
        // For Ollama, check if the default model is available in the fetched models list
        if (this.defaultService === 'ollama' && Array.isArray(activeService.models) && activeService.models.length > 0) {
            // If the default model is not in the available models list, use the first available model
            if (!activeService.models.includes(defaultModel)) {
                // Filter out error messages and use the first valid model
                const validModels = activeService.models.filter(model => !model.startsWith('Error:') && !model.startsWith('No models'));
                if (validModels.length > 0) {
                    console.info(`Default model '${defaultModel}' not found in Ollama models. Using first available model: '${validModels[0]}'`);
                    return validModels[0];
                }
            }
        }
        
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

