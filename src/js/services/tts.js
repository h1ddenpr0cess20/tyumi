/**
 * Text-to-Speech (TTS) service for generating speech from assistant messages
 */

// TTS configuration object
window.ttsConfig = {
  enabled: false,
  voice: 'ash', // Default voice changed to 'ash'
  instructions: '', // Custom instructions for speech generation
  autoplay: true    // Enable autoplay by default
};

// SVG Icons for TTS controls
window.ttsSvgIcons = {
  play: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>`,
  pause: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>`,
  stop: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="0"></rect></svg>`,
  download: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>`
};

// Track currently playing TTS audio
window.activeTtsAudio = null;
// Track message ids in sequence for autoplay
window.ttsMessageQueue = [];
// Track if we're currently in autoplay mode
window.ttsAutoplayActive = false;

// Track active audio URL for cleanup
window.activeTtsAudioUrl = null;

// Check if we need to load the audio storage module
document.addEventListener('DOMContentLoaded', () => {
  // Dynamically load the audioStorage.js script if not already loaded
  if (typeof window.initAudioDb === 'undefined') {
    const script = document.createElement('script');
    script.src = './js/utils/audioStorage.js';
    script.onload = () => {
      console.info('Audio storage module loaded');
    };
    script.onerror = (err) => {
      console.error('Failed to load audio storage module:', err);
    };
    document.head.appendChild(script);
  }
});

// Audio resource management
window.ttsAudioResources = {
  // This temporary object stores URLs and other data for the currently active session
  // For persistent storage, we use IndexedDB via the audioStorage.js module
  activeUrls: new Map(),   // Map of messageId -> {url, timestamp, audioData}
  
  // Add a new audio URL to track
  addUrl: function(url, messageId, audioData) {
    this.activeUrls.set(messageId, {
      url: url,
      timestamp: Date.now(),
      audioData: audioData
    });
    
    // Save to IndexedDB if available and not already saved
    if (typeof window.saveAudioToDb === 'function' && audioData) {
      // Get the voice and text from the message if possible
      const messageElement = document.getElementById(messageId);
      let text = '';
      let voice = window.ttsConfig.voice;
      
      if (messageElement) {
        const controlsContainer = messageElement.querySelector('.tts-controls');
        if (controlsContainer) {
          text = controlsContainer.getAttribute('data-original-text') || '';
          voice = controlsContainer.getAttribute('data-voice') || voice;
        }
      }
      
      window.saveAudioToDb(audioData, messageId, text, voice)
        .catch(err => {
          console.error('Failed to save audio to IndexedDB:', err);
        });
    }
  },
  
  // Remove a specific URL from tracking
  removeUrl: function(url) {
    // Find the messageId for this URL
    for (const [messageId, data] of this.activeUrls.entries()) {
      if (data.url === url) {
        this.activeUrls.delete(messageId);
        break;
      }
    }
  },
  
  // Get URL for a message ID
  getUrl: function(messageId) {
    const data = this.activeUrls.get(messageId);
    return data ? data.url : null;
  },
  
  // Get audio data for a message ID
  getAudioData: function(messageId) {
    const data = this.activeUrls.get(messageId);
    return data ? data.audioData : null;
  },
  
  // Clear all audio resources (except currently playing)
  clearAll: function() {
    const currentlyPlaying = window.activeTtsAudioUrl;
    
    // Collect URLs to revoke
    const urlsToRevoke = [];
    for (const [messageId, data] of this.activeUrls.entries()) {
      if (data.url !== currentlyPlaying) {
        urlsToRevoke.push(data.url);
        this.activeUrls.delete(messageId);
      }
    }
    
    // Revoke object URLs
    urlsToRevoke.forEach(url => {
      try {
        URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Error revoking URL:', error);
      }
    });
    
    if (window.VERBOSE_LOGGING) console.info('Cleared all stored audio resources');
  }
};

// Available voices for TTS - categorized by gender
window.availableTtsVoices = {
  neutral: [
    { id: 'fable', name: 'Fable', gender: 'Neutral' }
  ],
  male: [
    { id: 'ash', name: 'Ash', gender: 'Male' },
    { id: 'ballad', name: 'Ballad', gender: 'Male' },
    { id: 'echo', name: 'Echo', gender: 'Male' },
    { id: 'onyx', name: 'Onyx', gender: 'Male' },
    { id: 'verse', name: 'Verse', gender: 'Male' }
  ],
  female: [
    { id: 'alloy', name: 'Alloy', gender: 'Female' },
    { id: 'coral', name: 'Coral', gender: 'Female' },
    { id: 'nova', name: 'Nova', gender: 'Female' },
    { id: 'sage', name: 'Sage', gender: 'Female' },
    { id: 'shimmer', name: 'Shimmer', gender: 'Female' }
  ]
};

// Listen for chat history clearing events
document.addEventListener('DOMContentLoaded', () => {
  // Set up the voice change listener after DOM is loaded
  // Don't call setupTtsVoiceChangeListener directly here, it could be too early
  
  // If the clear memory button exists, add a listener to clear TTS resources when chat is cleared
  const clearMemoryButton = document.getElementById('clear-memory');
  if (clearMemoryButton) {
    clearMemoryButton.addEventListener('click', () => {
      // Clear all TTS audio resources when chat history is cleared
      if (typeof window.clearTtsAudioResources === 'function') {
        window.clearTtsAudioResources();
      }
    });
  }
});

/**
 * Initializes TTS references and settings
 * @param {Object} refs - References to DOM elements
 */
window.initTtsReferences = function(refs) {
  this.ttsToggle = refs.ttsToggle;
  this.ttsAutoplayToggle = refs.ttsAutoplayToggle;
  this.ttsVoiceSelector = refs.ttsVoiceSelector;
  this.ttsInstructionsInput = refs.ttsInstructionsInput;
  this.personalityInput = refs.personalityInput;
  this.personalityPromptRadio = refs.personalityPromptRadio;
  
  // Now that we have the references, set up the voice change listener
  // This ensures we only attempt to set up the listener after the element is available
  if (this.ttsVoiceSelector) {
    this.ttsVoiceSelector.addEventListener('change', (e) => {
      // Update the TTS configuration with the new voice
      window.ttsConfig.voice = e.target.value;
      
      // No notification popup - just update the voice silently
    });
  } else {
    console.warn('ttsVoiceSelector not found during initialization');
  }
};

/**
 * Generates speech from text using OpenAI TTS API
 * @param {string} text - The text to convert to speech
 * @returns {Promise<ArrayBuffer>} - The audio data
 */
window.generateSpeech = async function(text) {
  if (!this.ttsConfig.enabled) return null;
  
  try {
    // Always use OpenAI API key specifically for TTS, regardless of current service
    const openaiApiKey = window.config.services.openai?.apiKey;
    
    if (!openaiApiKey) {
      console.error('OpenAI API key not found for TTS. Please ensure your OpenAI API key is configured.');
      return null;
    }
    
    // Determine TTS instructions
    let instructions = this.ttsConfig.instructions || '';
    
    // If using personality and no custom instructions, use the entire system prompt
    if (!instructions && this.personalityPromptRadio.checked && 
        this.personalityInput.value.trim() !== '' &&
        this.personalityInput.hasAttribute('data-explicitly-set') && 
        this.personalityInput.getAttribute('data-explicitly-set') === 'true') {
      // Use the full system prompt format
      instructions = `Assume the personality of ${this.personalityInput.value.trim()}. Roleplay and never break character.  Do not read code blocks that appear between backticks or other non-speech content such as emotes which appear between asterisks in *italics* like that.`;
    }
    
    // If no instructions set, use a default
    if (!instructions) {
      instructions = 'Speak in a natural, conversational tone.';
    }
    
    // Create request body
    const requestBody = {
      model: 'gpt-4o-mini-tts',
      input: text,
      voice: this.ttsConfig.voice,
      instructions: instructions,
      response_format: "wav"  // Use WAV instead of default MP3 for potentially faster processing
    };
    
    // Request headers
    const headers = {
      'Authorization': `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json'
    };
    
    // Make API call
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      let errorDetails = '';
      try {
        const errorData = await response.json();
        errorDetails = errorData.error?.message || JSON.stringify(errorData);
      } catch (jsonError) {
        errorDetails = `HTTP ${response.status} - ${response.statusText}`;
      }
      throw new Error(`TTS API request failed: ${errorDetails}`);
    }
    
    // Return audio data
    return await response.arrayBuffer();
  } catch (error) {
    console.error('TTS generation error:', error);
    return null;
  }
};

/**
 * Stops any currently playing TTS audio
 */
window.stopTtsAudio = function() {
  if (window.activeTtsAudio) {
    try {
      window.activeTtsAudio.pause();
      window.activeTtsAudio.currentTime = 0;
      
      // If we have an audio URL to revoke, clean it up
      if (window.activeTtsAudioUrl) {
        // Remove from tracked resources first
        window.ttsAudioResources.removeUrl(window.activeTtsAudioUrl);
        
        // Then revoke the URL
        URL.revokeObjectURL(window.activeTtsAudioUrl);
        window.activeTtsAudioUrl = null;
      }
      
      window.activeTtsAudio = null;
      
      // Reset UI state of all play buttons
      document.querySelectorAll('.tts-play-pause').forEach(btn => {
        // Only reset buttons that might be showing a pause icon
        const svgContent = btn.innerHTML;
        if (svgContent.includes('pause') || !svgContent.includes('polygon')) {
          btn.innerHTML = window.ttsSvgIcons.play;
          btn.title = 'Play voice';
          btn.setAttribute('aria-label', 'Play voice');
          
          // Also hide any visible status texts
          const statusText = btn.parentElement.querySelector('.tts-status');
          if (statusText && statusText.style.display === 'inline') {
            statusText.textContent = 'Stopped';
            setTimeout(() => {
              statusText.style.display = 'none';
            }, 2000);
          }
        }
      });
    } catch (error) {
      console.error('Error stopping TTS audio:', error);
    }
  }
};

/**
 * Plays TTS audio from the given ArrayBuffer
 * @param {ArrayBuffer} audioData - The audio data to play
 */
window.playTtsAudio = function(audioData) {
  if (!audioData) return;
  
  try {
    // Stop any currently playing audio first
    window.stopTtsAudio();
    
    // Create audio element
    const audioBlob = new Blob([audioData], { type: 'audio/wav' });
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    
    // Store references to the active audio
    window.activeTtsAudio = audio;
    window.activeTtsAudioUrl = audioUrl;
    
    // Track this new audio resource
    window.ttsAudioResources.addUrl(audioUrl, 'test_audio_' + Date.now(), audioData);
    
    // Clean up after playing
    audio.onended = () => {
      // Remove from tracking
      window.ttsAudioResources.removeUrl(audioUrl);
      
      // Revoke the URL
      URL.revokeObjectURL(audioUrl);
      window.activeTtsAudioUrl = null;
      window.activeTtsAudio = null;
    };
    
    // Play audio
    audio.play().catch(error => {
      console.error('Failed to play TTS audio:', error);
      window.activeTtsAudio = null;
      window.activeTtsAudioUrl = null;
      
      // Clean up on error
      window.ttsAudioResources.removeUrl(audioUrl);
      URL.revokeObjectURL(audioUrl);
    });
  } catch (error) {
    console.error('Error playing TTS audio:', error);
  }
};

/**
 * Processes a message for TTS and generates audio
 * @param {string} text - The text to speak
 * @param {string} messageId - The ID of the message element to attach audio controls to
 */
window.generateTtsForMessage = async function(text, messageId) {
  if (!this.ttsConfig.enabled) return;
  
  try {
    // Don't process messages containing specific keywords that might create loops
    const lowerText = text.toLowerCase();
    const keywordsToFilter = ['voice playback stopped', 'tts test', 'testing tts', 'stop voice'];
    
    // Skip TTS for known system messages or messages with stop-related keywords
    if (keywordsToFilter.some(keyword => lowerText.includes(keyword))) {
      console.info('Skipping TTS for system message or message with trigger keywords');
      return;
    }
    
    // Only generate audio immediately if autoplay is enabled
    if (this.ttsConfig.autoplay) {
      // Generate speech
      const audioData = await this.generateSpeech(text);
      
      if (audioData) {
        // Store the audio data and add playback controls to the message
        this.addTtsControlsToMessage(audioData, messageId, text);
        
        // Add to message queue for autoplay
        if (!window.ttsMessageQueue.includes(messageId)) {
          console.info('Adding message to TTS queue:', messageId);
          window.ttsMessageQueue.push(messageId);
          
          // If not already playing something, start autoplay
          if (!window.activeTtsAudio) {
            console.info('No active audio, starting autoplay sequence');
            window.ttsAutoplayActive = true;
            window.playNextMessageInQueue();
          } else {
            console.info('Audio already playing, message queued for later playback');
          }
        }
      } else {
        // If TTS fails, show a notification only once
        if (!window.ttsErrorShown) {
          window.ttsErrorShown = true;
          if (window.showError) {
            window.showError('TTS failed. Please check your API key configuration.');
          }
          
          // Reset error flag after a while so we don't spam errors
          setTimeout(() => {
            window.ttsErrorShown = false;
          }, 30000); // 30 seconds
        }
        
        // Auto-disable TTS to prevent further errors
        if (window.ttsToggle) {
          window.ttsToggle.checked = false;
          window.ttsConfig.enabled = false;
        }
      }
    } else {
      // When autoplay is disabled, add placeholder controls that will generate audio on demand
      this.addPlaceholderTtsControls(messageId, text);
    }
  } catch (error) {
    console.error('Failed to generate TTS for message:', error);
  }
};

/**
 * Adds placeholder TTS controls to a message that will generate audio on first play
 * @param {string} messageId - The ID of the message element
 * @param {string} text - The original text of the message
 */
window.addPlaceholderTtsControls = function(messageId, text) {
  const messageElement = document.getElementById(messageId);
  if (!messageElement) return;
  
  // Remove any existing controls first
  const existingControls = messageElement.querySelector('.tts-controls');
  if (existingControls) {
    try {
      existingControls.parentNode.removeChild(existingControls);
    } catch (error) {
      console.error('Error removing existing TTS controls:', error);
    }
  }
  
  // Create controls container
  const controlsContainer = document.createElement('div');
  controlsContainer.className = 'tts-controls';
  
  // Store the original text as a data attribute for voice changes
  controlsContainer.setAttribute('data-original-text', text);
  controlsContainer.setAttribute('data-voice', window.ttsConfig.voice);
  controlsContainer.setAttribute('data-audio-generated', 'false');
  
  // Create placeholder play button
  const playButton = document.createElement('button');
  playButton.className = 'tts-play-pause';
  playButton.title = 'Generate and play voice';
  playButton.setAttribute('aria-label', 'Generate and play voice');
  playButton.innerHTML = window.ttsSvgIcons.play;
  
  // Status text
  const statusText = document.createElement('span');
  statusText.className = 'tts-status';
  statusText.style.display = 'none'; // Hide initially
  
  // Add loading spinner for audio generation
  const loadingSpinner = document.createElement('div');
  loadingSpinner.className = 'tts-loading-spinner';
  
  // On click, generate the audio and replace with full controls
  playButton.addEventListener('click', async () => {
    // Show loading state
    playButton.innerHTML = '';
    playButton.appendChild(loadingSpinner);
    statusText.textContent = 'Generating...';
    statusText.style.display = 'inline';
    
    try {
      // Generate speech on demand
      const audioData = await window.generateSpeech(text);
      
      if (audioData) {
        // Replace placeholder with full controls
        window.addTtsControlsToMessage(audioData, messageId, text);
        
        // Get the new controls and play the audio immediately
        setTimeout(() => {
          const newControls = document.getElementById(messageId)?.querySelector('.tts-controls');
          if (newControls) {
            const newPlayButton = newControls.querySelector('.tts-play-pause');
            if (newPlayButton) {
              newPlayButton.click();
            }
          }
        }, 100);
      } else {
        // If generation fails, show error
        statusText.textContent = 'Failed to generate audio';
        playButton.innerHTML = window.ttsSvgIcons.play;
        setTimeout(() => {
          statusText.style.display = 'none';
        }, 3000);
      }
    } catch (error) {
      console.error('Failed to generate audio on demand:', error);
      playButton.innerHTML = window.ttsSvgIcons.play;
      statusText.textContent = 'Error';
      statusText.style.display = 'inline';
      setTimeout(() => {
        statusText.style.display = 'none';
      }, 3000);
    }
  });
  
  // Add elements to container
  controlsContainer.appendChild(playButton);
  controlsContainer.appendChild(statusText);
  
  // Add to message
  const contentElement = messageElement.querySelector('.message-content');
  if (contentElement) {
    contentElement.appendChild(controlsContainer);
  } else {
    // Fallback to adding at the end of the message
    messageElement.appendChild(controlsContainer);
  }
};

/**
 * Plays the next message in the autoplay queue
 */
window.playNextMessageInQueue = function() {
  // Exit early if queue is empty or autoplay is disabled
  if (!window.ttsMessageQueue.length || !window.ttsConfig.autoplay) {
    console.info('Autoplay sequence ended: queue empty or autoplay disabled');
    window.ttsAutoplayActive = false;
    return;
  }
  
  // If audio is already playing, wait for it to finish
  if (window.activeTtsAudio) {
    console.info('Audio already playing, will continue queue when finished');
    return;
  }
  
  console.info('Playing next message in queue. Queue length:', window.ttsMessageQueue.length);
  
  const nextMessageId = window.ttsMessageQueue[0];
  const messageElement = document.getElementById(nextMessageId);
  
  if (messageElement) {
    const controlsContainer = messageElement.querySelector('.tts-controls');
    if (controlsContainer) {
      const playButton = controlsContainer.querySelector('.tts-play-pause');
      if (playButton) {
        console.info('Found play button for message:', nextMessageId);
        // Remove this message from the queue immediately to prevent duplicates
        window.ttsMessageQueue.shift();
        
        try {
          // Simulate a click on the play button
          playButton.click();
          return;
        } catch (error) {
          console.error('Error clicking play button:', error);
          // If there was an error, try the next message
          setTimeout(() => window.playNextMessageInQueue(), 100);
          return;
        }
      }
    }
    console.warn('Could not find play controls for message:', nextMessageId);
  } else {
    console.warn('Could not find message element:', nextMessageId);
  }
  
  // If we couldn't find the element or controls, remove it from the queue and try the next one
  window.ttsMessageQueue.shift();
  // Try to play the next message if available
  setTimeout(() => window.playNextMessageInQueue(), 100);
};

/**
 * Audio ended event handler - to be attached to audio elements
 * This is extracted to a separate function to be easily reused
 */
window.handleTtsAudioEnded = function(playPauseButton, statusText, audioUrl, isPlayingRef) {
  return function() {
    // Update playing state (if we have a reference to the state variable)
    if (isPlayingRef) {
      isPlayingRef.isPlaying = false;
    }
    
    // Update UI
    playPauseButton.innerHTML = window.ttsSvgIcons.play;
    playPauseButton.title = 'Play voice';
    playPauseButton.setAttribute('aria-label', 'Play voice');
    statusText.textContent = 'Finished';
    statusText.style.display = 'inline';
    setTimeout(() => {
      statusText.style.display = 'none';
    }, 2000);
    
    // Clean up resources
    window.activeTtsAudio = null;
    
    // Clean up the audio resource
    if (window.activeTtsAudioUrl === audioUrl) {
      window.activeTtsAudioUrl = null;
    }
    
    // If autoplay is enabled, play the next message in queue after a short delay
    if (window.ttsConfig.autoplay) {
      console.info('Audio finished, checking for next message in queue');
      setTimeout(() => window.playNextMessageInQueue(), 500);
    }
  };
};

/**
 * Adds TTS playback controls to a message
 * @param {ArrayBuffer} audioData - The audio data
 * @param {string} messageId - The ID of the message element
 * @param {string} originalText - The original text of the message for regeneration
 */
window.addTtsControlsToMessage = function(audioData, messageId, originalText) {
  const messageElement = document.getElementById(messageId);
  if (!messageElement) return;
  
  // Remove any existing controls first
  const existingControls = messageElement.querySelector('.tts-controls');
  if (existingControls) {
    try {
      existingControls.parentNode.removeChild(existingControls);
    } catch (error) {
      console.error('Error removing existing TTS controls:', error);
    }
  }
  
  // Create audio blob and URL
  const audioBlob = new Blob([audioData], { type: 'audio/wav' });
  const audioUrl = URL.createObjectURL(audioBlob);
  
  // Track this new audio resource
  window.ttsAudioResources.addUrl(audioUrl, messageId, audioData);
  
  // Create audio element
  const audio = new Audio(audioUrl);
  
  // Create a reference object to track isPlaying state that can be updated from the callback
  const playbackState = { isPlaying: false };
  
  // Track loading and playing states
  let isLoading = false;
  
  // Create controls container with better styling
  const controlsContainer = document.createElement('div');
  controlsContainer.className = 'tts-controls';
  
  // Store the original text as a data attribute for voice changes
  controlsContainer.setAttribute('data-original-text', originalText);
  
  // Store voice used for this audio
  controlsContainer.setAttribute('data-voice', window.ttsConfig.voice);
  
  // Create play/pause button with smaller styling
  const playPauseButton = document.createElement('button');
  playPauseButton.className = 'tts-play-pause';
  playPauseButton.title = 'Play voice';
  playPauseButton.setAttribute('aria-label', 'Play voice');
  
  playPauseButton.innerHTML = window.ttsSvgIcons.play;
  
  // Create stop button
  const stopButton = document.createElement('button');
  stopButton.className = 'tts-stop';
  stopButton.title = 'Stop and reset voice';
  stopButton.setAttribute('aria-label', 'Stop voice');
  
  stopButton.innerHTML = window.ttsSvgIcons.stop;
  
  // Create download button
  const downloadButton = document.createElement('button');
  downloadButton.className = 'tts-download';
  downloadButton.title = 'Download audio';
  downloadButton.setAttribute('aria-label', 'Download audio');
  
  // Use a download icon (Unicode character)
  downloadButton.innerHTML = window.ttsSvgIcons.download;
  
  // Status text with better styling
  const statusText = document.createElement('span');
  statusText.className = 'tts-status';
  statusText.style.display = 'none'; // Hide initially
  
  // Add loading spinner for audio loading
  const loadingSpinner = document.createElement('div');
  loadingSpinner.className = 'tts-loading-spinner';
  
  // Add animation style if not already present
  if (!document.getElementById('tts-spinner-style')) {
    const style = document.createElement('style');
    style.id = 'tts-spinner-style';
    style.textContent = `
      @keyframes tts-spin {
        to { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
  }
  
  // Track loading and playing states
  let isPlaying = false;
  
  // Play/pause event with improved handling
  playPauseButton.addEventListener('click', async () => {
    if (isLoading) return; // Prevent multiple clicks during loading
    
    // Check if voice has changed and regenerate if needed
    const audioVoice = controlsContainer.getAttribute('data-voice');
    const currentVoice = window.ttsConfig.voice;
    
    if (audioVoice !== currentVoice) {
      // Voice has changed, need to regenerate
      if (isPlaying) {
        audio.pause();
        audio.currentTime = 0;
        isPlaying = false;
      }
      
      // Show loading state
      isLoading = true;
      playPauseButton.innerHTML = '';
      playPauseButton.appendChild(loadingSpinner);
      
      // Get the original text and regenerate with current voice
      const messageText = controlsContainer.getAttribute('data-original-text');
      if (messageText) {
        try {
          // Generate new audio with current voice
          const newAudioData = await window.generateSpeech(messageText);
          if (newAudioData) {
            // Clean up old audio resources
            window.ttsAudioResources.removeUrl(audioUrl);
            URL.revokeObjectURL(audioUrl);
            
            // Add new controls with new audio data and auto-play
            window.addTtsControlsToMessage(newAudioData, messageId, messageText);
            
            // Get the new controls and play the audio automatically
            setTimeout(() => {
              const newControls = document.getElementById(messageId)?.querySelector('.tts-controls');
              if (newControls) {
                const newPlayButton = newControls.querySelector('.tts-play-pause');
                if (newPlayButton) {
                  newPlayButton.click();
                }
              }
            }, 100);
            return; // Exit early as we've regenerated the controls
          } else {
            // Handle generation failure
            isLoading = false;
            playPauseButton.innerHTML = window.ttsSvgIcons.play;
            statusText.textContent = 'Voice change failed';
            statusText.style.display = 'inline';
            setTimeout(() => {
              statusText.style.display = 'none';
            }, 3000);
            return;
          }
        } catch (error) {
          console.error('Failed to regenerate audio:', error);
          isLoading = false;
          playPauseButton.innerHTML = window.ttsSvgIcons.play;
          statusText.textContent = 'Error';
          statusText.style.display = 'inline';
          setTimeout(() => {
            statusText.style.display = 'none';
          }, 3000);
          return;
        }
      }
    }
    
    if (audio.paused) {
      // Show loading state if first play
      if (audio.readyState < 3 && !isPlaying) {
        isLoading = true;
        playPauseButton.innerHTML = '';
        playPauseButton.appendChild(loadingSpinner);
        
        // Stop any currently playing audio
        if (window.activeTtsAudio && window.activeTtsAudio !== audio) {
          window.activeTtsAudio.pause();
          window.activeTtsAudio.currentTime = 0;
          
          // Reset other play buttons
          document.querySelectorAll('.tts-play-pause').forEach(btn => {
            if (btn !== playPauseButton && !btn.contains(loadingSpinner)) {
              btn.innerHTML = window.ttsSvgIcons.play;
              btn.title = 'Play voice';
              btn.setAttribute('aria-label', 'Play voice');
            }
          });
        }
        
        // Audio loaded event
        const canPlayHandler = () => {
          isLoading = false;
          audio.play().then(() => {
            playbackState.isPlaying = true;
            isPlaying = true;
            playPauseButton.innerHTML = window.ttsSvgIcons.pause;
            playPauseButton.title = 'Pause voice';
            playPauseButton.setAttribute('aria-label', 'Pause voice');
            statusText.textContent = 'Playing';
            statusText.style.display = 'inline';
            window.activeTtsAudio = audio;
          }).catch(error => {
            console.error('Failed to play audio:', error);
            playPauseButton.innerHTML = window.ttsSvgIcons.play;
            statusText.textContent = 'Failed';
            statusText.style.display = 'inline';
            setTimeout(() => {
              statusText.style.display = 'none';
            }, 3000);
          });
        };
        
        if (audio.readyState >= 3) {
          canPlayHandler();
        } else {
          audio.addEventListener('canplay', canPlayHandler, { once: true });
        }
      } else {
        // Resume playback if already loaded
        audio.play();
        playbackState.isPlaying = true;
        isPlaying = true;
        playPauseButton.innerHTML = window.ttsSvgIcons.pause;
        playPauseButton.title = 'Pause voice';
        playPauseButton.setAttribute('aria-label', 'Pause voice');
        statusText.textContent = 'Playing';
        statusText.style.display = 'inline';
        window.activeTtsAudio = audio;
      }
    } else {
      // Pause playback
      audio.pause();
      playbackState.isPlaying = false;
      isPlaying = false;
      playPauseButton.innerHTML = window.ttsSvgIcons.play;
      playPauseButton.title = 'Play voice';
      playPauseButton.setAttribute('aria-label', 'Play voice');
      statusText.textContent = 'Paused';
      statusText.style.display = 'inline';
      setTimeout(() => {
        if (audio.paused) {
          statusText.style.display = 'none';
        }
      }, 2000);
    }
  });
  
  // Stop button event
  stopButton.addEventListener('click', () => {
    audio.pause();
    audio.currentTime = 0;
    isPlaying = false;
    playPauseButton.innerHTML = window.ttsSvgIcons.play;
    playPauseButton.title = 'Play voice';
    playPauseButton.setAttribute('aria-label', 'Play voice');
    statusText.textContent = 'Stopped';
    statusText.style.display = 'inline';
    setTimeout(() => {
      statusText.style.display = 'none';
    }, 2000);
    
    if (window.activeTtsAudio === audio) {
      window.activeTtsAudio = null;
    }
  });
  
  // Download button event
  downloadButton.addEventListener('click', () => {
    statusText.textContent = 'Downloading...';
    statusText.style.display = 'inline';
    
    try {
      // Create a meaningful filename using messageId and voice
      const now = new Date();
      const timestamp = now.toISOString().replace(/[-:]/g, '').replace(/\..+/, '');
      const voiceName = window.ttsConfig.voice;
      const filename = `tts_${voiceName}_${timestamp}.wav`;
      
      // Either use the cached audio data or get it from the blob URL
      const audioData = window.ttsAudioResources.getAudioData(messageId);
      
      if (audioData) {
        // Use the exportAudioForDownload function if available
        if (typeof window.exportAudioForDownload === 'function') {
          window.exportAudioForDownload(audioData, filename);
          statusText.textContent = 'Downloaded';
        } else {
          // Fallback to direct download with Blob
          const blob = new Blob([audioData], { type: 'audio/wav' });
          const url = URL.createObjectURL(blob);
          
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          
          // Clean up the URL
          setTimeout(() => URL.revokeObjectURL(url), 100);
          statusText.textContent = 'Downloaded';
        }
      } else {
        // If we don't have the audio data cached, use the existing URL
        const a = document.createElement('a');
        a.href = audioUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        statusText.textContent = 'Downloaded';
      }
      
      setTimeout(() => {
        statusText.style.display = 'none';
      }, 2000);
    } catch (error) {
      console.error('Error downloading audio:', error);
      statusText.textContent = 'Download failed';
      setTimeout(() => {
        statusText.style.display = 'none';
      }, 2000);
    }
  });
  
  // Audio ended event
  audio.addEventListener('ended', window.handleTtsAudioEnded(playPauseButton, statusText, audioUrl, playbackState));
  
  // Audio error event
  audio.addEventListener('error', (e) => {
    console.error('Audio playback error:', e);
    isLoading = false;
    isPlaying = false;
    playbackState.isPlaying = false;
    playPauseButton.innerHTML = window.ttsSvgIcons.play;
    statusText.textContent = 'Error';
    statusText.style.display = 'inline';
    setTimeout(() => {
      statusText.style.display = 'none';
    }, 3000);
    
    // Clean up the audio resource on error
    window.ttsAudioResources.removeUrl(audioUrl);
    
    // Continue autoplay with next message if enabled
    if (window.ttsConfig.autoplay) {
      console.info('Audio error, trying next message in queue');
      setTimeout(() => window.playNextMessageInQueue(), 500);
    }
  });
  
  // Add elements to container
  controlsContainer.appendChild(playPauseButton);
  controlsContainer.appendChild(stopButton);
  controlsContainer.appendChild(downloadButton);
  
  controlsContainer.appendChild(statusText);
  
  // Find the right place to add the controls
  // (directly in the message content, after the text)
  const contentElement = messageElement.querySelector('.message-content');
  if (contentElement) {
    contentElement.appendChild(controlsContainer);
  } else {
    // Fallback to adding at the end of the message
    messageElement.appendChild(controlsContainer);
  }
};

// Add a utility function to clear all audio resources
window.clearTtsAudioResources = function() {
  // Stop any currently playing audio
  window.stopTtsAudio();
  
  // Clear all tracked resources
  window.ttsAudioResources.clearAll();
  
  console.info('All audio resources cleared');
  if (window.VERBOSE_LOGGING) console.info('All audio resources cleared');
};

/**
 * Handles the 'ended' event of an Audio object
 */
window.handleAudioEnded = function() {
  if (window.VERBOSE_LOGGING) console.info('Audio finished, checking for next message in queue');
  // Clear the active audio tracking
  window.activeTtsAudio = null;
  window.activeTtsAudioUrl = null; // Clear the URL as well
  
  // Continue the autoplay sequence if active
  if (window.ttsConfig.autoplay && window.ttsAutoplayActive) {
    window.playQueuedTtsMessage();
  }
};

/**
 * Handles errors during audio playback
 * @param {Event} event - The error event
 */
window.handleAudioError = function(event) {
  console.error('Audio playback error:', event);
  // Clear the active audio tracking
  window.activeTtsAudio = null;
  window.activeTtsAudioUrl = null; // Clear the URL as well
  
  // If autoplay is active, try the next message in the queue
  if (window.ttsConfig.autoplay && window.ttsAutoplayActive) {
    console.error('Audio error, trying next message in queue');
    window.playQueuedTtsMessage();
  }
};

/**
 * Determines if a message should be skipped for TTS.
 * System messages or messages with specific trigger keywords are skipped.
 * @param {string} messageId - The ID of the message.
 * @returns {boolean} - True if the message should be skipped, false otherwise.
 */
window.shouldSkipTts = function(messageId) {
    const messageElement = document.getElementById(`message-${messageId}`);
    if (!messageElement) {
        return true; // Skip if message element not found
    }

    // Skip system messages (identified by a class or data attribute)
    if (messageElement.classList.contains('system-message')) {
        if (window.VERBOSE_LOGGING) console.info('Skipping TTS for system message or message with trigger keywords');
        return true;
    }

    const messageText = messageElement.querySelector('.message-text')?.innerText || '';

    // Check for trigger keywords that indicate non-speech content
    const triggerKeywords = [
        'tool_code\nprint(', 
        'tool_code\nconsole.',
        'tool_code\nwindow.',
        '\n```python',
        '\n```javascript',
        '\n```json',
        '\n```bash',
        '\n```terminal',
        '\n```text',
        '\n```',
        '<tool_code>',
        '</tool_code>',
        '<tool_code_output>',
        '</tool_code_output>'
    ];

    for (const keyword of triggerKeywords) {
        if (messageText.includes(keyword)) {
            if (window.VERBOSE_LOGGING) console.info('Skipping TTS for system message or message with trigger keywords');
            return true;
        }
    }

    return false;
};

/**
 * Adds a message ID to the TTS queue for autoplay playback.
 * @param {string} messageId - The ID of the message to queue.
 */
window.addMessageToTtsQueue = function(messageId) {
    if (!window.ttsConfig.enabled || !window.ttsConfig.autoplay) {
        return; // Do nothing if TTS or autoplay is disabled
    }

    if (window.shouldSkipTts(messageId)) {
        return; // Skip if the message content indicates it shouldn't be spoken
    }

    // Check if the message is already in the queue to avoid duplicates
    if (!window.ttsMessageQueue.includes(messageId)) {
        window.ttsMessageQueue.push(messageId);
        if (window.VERBOSE_LOGGING) console.info('Adding message to TTS queue:', messageId);
        
        // If no audio is currently playing and autoplay is active, start the sequence
        if (!window.activeTtsAudio && window.ttsAutoplayActive) {
            if (window.VERBOSE_LOGGING) console.info('No active audio, starting autoplay sequence');
            window.playQueuedTtsMessage();
        } else if (window.activeTtsAudio) {
             if (window.VERBOSE_LOGGING) console.info('Audio already playing, message queued for later playback');
        }
    }
};

/**
 * Starts the autoplay sequence from the current queue.
 */
window.startTtsAutoplay = function() {
    if (window.ttsConfig.enabled && window.ttsConfig.autoplay && !window.ttsAutoplayActive) {
        window.ttsAutoplayActive = true;
        if (window.VERBOSE_LOGGING) console.info('Starting TTS autoplay sequence.');
        window.playQueuedTtsMessage(); // Start playing the first message in the queue
    } else {
         if (window.VERBOSE_LOGGING) console.info('TTS autoplay not started: already active or disabled.');
    }
};

/**
 * Stops the TTS autoplay sequence.
 */
window.stopTtsAutoplay = function() {
    if (window.ttsAutoplayActive) {
        window.ttsAutoplayActive = false;
        if (window.VERBOSE_LOGGING) console.info('Stopping TTS autoplay sequence.');
        window.stopTtsAudio(); // Stop currently playing audio
        // The queue remains, but playback will not automatically continue
    }
};