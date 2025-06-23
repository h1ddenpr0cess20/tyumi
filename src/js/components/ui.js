/**
 * UI management functions for the chatbot application
 */

// -----------------------------------------------------
// Tab Control for Settings
// -----------------------------------------------------

/**
 * Initialize tabs in the settings panel
 */
window.initTabs = function() {
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabContents = document.querySelectorAll('.tab-content');
  
  if (!tabButtons.length || !tabContents.length) {
    console.warn('Tab elements not found, skipping tab initialization');
    return;
  }
  
  // Add click event to each tab button
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Remove active class from all buttons and contents
      tabButtons.forEach(btn => {
        btn.classList.remove('active');
        btn.setAttribute('aria-selected', 'false');
      });
      
      tabContents.forEach(content => {
        content.classList.remove('active');
      });
      
      // Add active class to clicked button and its content
      button.classList.add('active');
      button.setAttribute('aria-selected', 'true');
      
      const contentId = button.getAttribute('aria-controls');
      const content = document.getElementById(contentId);
      
      if (content) {
        content.classList.add('active');
      }
    });
  });
};

/**
 * Switch to a specific tab in the settings panel
 * @param {string} tabId - The ID of the tab to switch to
 */
window.switchToTab = function(tabId) {
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabContents = document.querySelectorAll('.tab-content');
  
  // Remove active class from all buttons and contents
  tabButtons.forEach(btn => {
    btn.classList.remove('active');
    btn.setAttribute('aria-selected', 'false');
  });
  
  tabContents.forEach(content => {
    content.classList.remove('active');
  });
  
  // Activate the specified tab
  const targetButton = document.getElementById(tabId);
  const targetContentId = targetButton ? targetButton.getAttribute('aria-controls') : null;
  const targetContent = targetContentId ? document.getElementById(targetContentId) : null;
  
  if (targetButton && targetContent) {
    targetButton.classList.add('active');
    targetButton.setAttribute('aria-selected', 'true');
    targetContent.classList.add('active');
  }
};

/**
 * Check if any API keys are missing for the current service
 * @returns {boolean} - True if API keys are missing, false otherwise
 */
window.checkApiKeysMissing = function() {
  if (!window.config || !window.config.services) return false;
  
  const currentService = window.config.defaultService;
  
  // Skip check for services that don't require a key (e.g., Ollama)
  if (currentService === 'ollama') return false;
  
  // Check if an API key exists for the current service
  const apiKey = window.getApiKey ? window.getApiKey(currentService) : null;
  
  return !apiKey || apiKey.trim() === '';
};

/**
 * Automatically open the settings panel and switch to API keys tab if no keys are set
 */
window.openApiKeysTabIfNeeded = function() {
  if (!window.checkApiKeysMissing()) return;
  
  // Check if settings elements exist
  if (!window.settingsPanel || !window.settingsButton) {
    console.warn('Settings panel elements not found, cannot auto-open API keys tab');
    return;
  }
  
  // Store the current values when opening settings (similar to manual opening)
  const originalPersonalityValue = window.personalityInput ? window.personalityInput.value : '';
  const originalCustomPromptValue = window.systemPromptCustom ? window.systemPromptCustom.value : '';
  
  // Open the settings panel
  window.settingsPanel.classList.add('active');
  window.settingsButton.setAttribute('aria-expanded', 'true');
  window.settingsPanel.setAttribute('aria-hidden', 'false');
  window.settingsPanel.removeAttribute('inert');
  window.settingsButton.style.display = 'none';
  
  // Switch to the API keys tab
  window.switchToTab('tab-apikeys');
  
  // Organize the settings layout for the wider panel
  if (typeof window.organizeSettingsLayout === 'function') {
    window.organizeSettingsLayout();
  }
  
  if (window.VERBOSE_LOGGING) {
    console.info('Automatically opened API keys tab due to missing API key');
  }
};

// -----------------------------------------------------
// UI manipulation functions
// -----------------------------------------------------

/**
 * Downloads an image from a URL or data URL
 * @param {string} url - The image URL or data URL
 * @param {string} filename - The filename to save as
 */
window.downloadImage = function(url, filename) {
  // For data URLs, we can directly create an anchor and trigger download
  if (url.startsWith('data:')) {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return;
  }
  
  // For regular URLs, need to fetch the image first
  fetch(url)
    .then(response => response.blob())
    .then(blob => {
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    })
    .catch(error => console.error('Error downloading image:', error));
};

/**
 * Appends a message to the chat box
 * @param {string} sender - The sender of the message (You/Assistant)
 * @param {string} content - The message content
 * @param {string} type - The message type (user/assistant/system/error)
 * @param {boolean} skipHistory - Whether to skip adding this message to conversation history
 * @returns {HTMLElement} - The created message element
 */
window.appendMessage = function(sender, content, type, skipHistory = false) {
  const messageElement = document.createElement('div');
  messageElement.classList.add('message');
  if (type) {
    messageElement.classList.add(type);
  }
  
  const messageId = 'msg-' + Date.now();
  messageElement.id = messageId;

  const senderElement = document.createElement('div');
  senderElement.className = 'message-sender';
  senderElement.textContent = sender;

  const contentElement = document.createElement('div');
  contentElement.className = 'message-content';

  messageElement.appendChild(senderElement);
  messageElement.appendChild(contentElement);
  window.chatBox.appendChild(messageElement);

  setTimeout(() => {
    const sanitized = DOMPurify.sanitize(marked.parse(content));
    contentElement.innerHTML = sanitized;
    
    // Safely call the highlightAndAddCopyButtons function if it exists
    if (typeof window.highlightAndAddCopyButtons === 'function') {
      try {
        window.highlightAndAddCopyButtons(messageElement);
      } catch (e) {
        console.error('Error highlighting code:', e);
      }
    }
    
    // Safely call setupImageInteractions if it exists
    if (typeof window.setupImageInteractions === 'function') {
      try {
        window.setupImageInteractions(messageElement);
      } catch (e) {
        console.error('Error setting up image interactions:', e);
      }
    }
    
    // Immediate scroll without delay for better responsiveness
    if (window.shouldAutoScroll) {
      window.chatBox.scrollTop = window.chatBox.scrollHeight;
    }
    
    if ((type === 'user' || type === 'system') && !skipHistory) {
      window.shouldAutoScroll = true;
    }
  }, 0); // Reduced from 10ms to 0ms for immediate execution
  
  return messageElement;
};

/**
 * Sets up image interactions for a message element
 * @param {HTMLElement} messageElement - The message element to process
 */
window.setupImageInteractions = function(messageElement) {
  if (!messageElement) return;
  const images = messageElement.querySelectorAll('.message-content img');
  if (images.length === 0) return;
  
  // Define the download icon SVG
  const downloadIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>`;
  
  // Wrap each image in a container and add download button
  images.forEach((img, index) => {
    // Skip if already processed
    if (img.parentNode.classList.contains('image-container')) return;
    
    // Create container for the image
    const container = document.createElement('div');
    container.className = 'image-container';
    img.parentNode.insertBefore(container, img);
    container.appendChild(img);
    
    // Create download button
    const downloadBtn = document.createElement('button');
    downloadBtn.className = 'image-download-btn';
    downloadBtn.innerHTML = downloadIconSvg;
    downloadBtn.setAttribute('aria-label', 'Download image');
    downloadBtn.title = 'Download image';
    container.appendChild(downloadBtn);
    
    // Download button click handler
    downloadBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      // Use the pre-generated filename if available, otherwise generate a new one
      const filename = img.dataset.filename || `image-${Date.now()}-${index + 1}.png`;
      window.downloadImage(img.src, filename);
    });
  });
  
  // Use slideshow for all images, even if there's only one
  images.forEach((img) => {
    img.addEventListener('click', () => {
      // Check if a slideshow is already open to prevent duplicates
      if (window.isSlideshowOpen) {
        console.log('Slideshow already open, preventing duplicate');
        return; // Don't create another slideshow if one is already open
      }
      
      // Set the flag immediately to prevent race conditions
      window.isSlideshowOpen = true;
      
      // Gather all images from all message bubbles in the conversation
      const allImagesData = window.gatherAllConversationImages(img);
      // Create slideshow with all conversation images, starting from the clicked image
      window.createImageSlideshow(allImagesData.images, allImagesData.clickedIndex);
    });
  });
};

/**
 * Creates a unified slideshow for both gallery and chat message images
 * @param {Array} images - Array of image elements or objects
 * @param {number} startIndex - Index to start from
 * @param {boolean} isGalleryMode - Whether this is being called from the gallery (vs chat)
 */
window.createImageSlideshow = function(images, startIndex, isGalleryMode = false) {
  if (!images || images.length === 0) return;
  
  // Remove any existing slideshow elements first
  const existingSlideshow = document.querySelector('.gallery-slideshow');
  if (existingSlideshow) {
    document.body.removeChild(existingSlideshow);
  }
  
  let currentIndex = startIndex || 0;
  const isMobile = typeof window.isMobileDevice === 'function' ? window.isMobileDevice() : false;
  
  // Create slideshow container
  const slideshow = document.createElement('div');
  slideshow.className = 'gallery-slideshow';
  if (isMobile) slideshow.classList.add('mobile-slideshow');
  
  // Create slideshow content
  const slideshowContainer = document.createElement('div');
  slideshowContainer.className = 'gallery-slideshow-container';
  
  // Create image element
  const img = document.createElement('img');
  img.className = 'gallery-slideshow-image';
  slideshowContainer.appendChild(img);
  
  // Create navigation buttons
  const prevBtn = document.createElement('button');
  prevBtn.className = 'gallery-slideshow-nav gallery-slideshow-prev';
  prevBtn.innerHTML = '&#10094;';
  prevBtn.title = 'Previous image';
  
  const nextBtn = document.createElement('button');
  nextBtn.className = 'gallery-slideshow-nav gallery-slideshow-next';
  nextBtn.innerHTML = '&#10095;';
  nextBtn.title = 'Next image';
  
  slideshowContainer.appendChild(prevBtn);
  slideshowContainer.appendChild(nextBtn);
  
  // Create controls bar for the upper-right corner
  const controlsBar = document.createElement('div');
  controlsBar.className = 'gallery-slideshow-top-controls';
  
  // Create buttons based on device capabilities
  let downloadBtn;
  
  if (isMobile && navigator.share) {
    // Use share button instead of download on mobile if Web Share API is available
    downloadBtn = document.createElement('button');
    downloadBtn.className = 'slideshow-icon-btn';
    downloadBtn.id = 'slideshow-share';
    downloadBtn.title = 'Share this image';
    downloadBtn.setAttribute('aria-label', 'Share this image');
    downloadBtn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="18" cy="5" r="3"></circle>
        <circle cx="6" cy="12" r="3"></circle>
        <circle cx="18" cy="19" r="3"></circle>
        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
      </svg>
    `;
  } else {
    // Standard download button for desktop
    downloadBtn = document.createElement('button');
    downloadBtn.className = 'slideshow-icon-btn';
    downloadBtn.id = 'slideshow-download';
    downloadBtn.title = 'Download this image';
    downloadBtn.setAttribute('aria-label', 'Download this image');
    downloadBtn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="7 10 12 15 17 10"/>
        <line x1="12" y1="15" x2="12" y2="3"/>
      </svg>
    `;
  }
  
  const closeBtn = document.createElement('button');
  closeBtn.className = 'slideshow-icon-btn';
  closeBtn.id = 'slideshow-close';
  closeBtn.title = 'Close image viewer';
  closeBtn.setAttribute('aria-label', 'Close image viewer');
  closeBtn.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  `;
  
  // Add delete button only for gallery mode
  if (isGalleryMode) {
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'slideshow-icon-btn';
    deleteBtn.id = 'slideshow-delete';
    deleteBtn.title = 'Delete this image permanently';
    deleteBtn.setAttribute('aria-label', 'Delete this image permanently');
    deleteBtn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="3 6 5 6 21 6"/>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
        <line x1="10" y1="11" x2="10" y2="17"/>
        <line x1="14" y1="11" x2="14" y2="17"/>
      </svg>
    `;
    controlsBar.appendChild(deleteBtn);
    
    // Add delete button handler
    deleteBtn.addEventListener('click', () => {
      const image = window.galleryImages[currentIndex];
      if (confirm('Delete this image?')) {
        window.deleteImageFromDb(image.filename).then(() => {
          // Remove from array
          window.galleryImages.splice(currentIndex, 1);
          
          // Remove from gallery
          const galleryItem = document.querySelector(`.gallery-item[data-filename="${image.filename}"]`);
          if (galleryItem) galleryItem.remove();
          
          // Update counter
          const galleryCount = document.getElementById('gallery-count');
          if (galleryCount) {
            const currentCount = parseInt(galleryCount.textContent);
            galleryCount.textContent = currentCount - 1;
          }
          
          if (window.galleryImages.length === 0) {
            closeSlideshow();
            const galleryGrid = document.getElementById('gallery-grid');
            if (galleryGrid) {
              galleryGrid.innerHTML = '<div class="gallery-empty">No images found in gallery</div>';
            }
          } else {
            showSlide(Math.min(currentIndex, window.galleryImages.length - 1));
          }
        }).catch(error => {
          console.error('Error deleting image:', error);
          alert('Failed to delete the image. Please try again.');
        });
      }
    });
  }
  
  // Add buttons to controls bar
  controlsBar.appendChild(downloadBtn);
  controlsBar.appendChild(closeBtn);
  
  // Create info panel at bottom with metadata
  const infoPanel = document.createElement('div');
  infoPanel.className = 'gallery-slideshow-info';
  
  // Add elements to document
  slideshowContainer.appendChild(controlsBar);
  slideshow.appendChild(slideshowContainer);
  slideshow.appendChild(infoPanel);
  document.body.appendChild(slideshow);
  
  // Set the global flag to indicate slideshow is open
  window.isSlideshowOpen = true;
  
  // Function to update the current slide
  const showSlide = (index) => {
    if (index < 0) index = images.length - 1;
    if (index >= images.length) index = 0;
    
    currentIndex = index;
    
    let imageUrl, prompt, timestamp, filename;
    
    if (isGalleryMode) {
      // Gallery mode - data comes directly from gallery images object
      const image = images[currentIndex];
      imageUrl = image.data;
      prompt = image.prompt || 'No prompt data';
      timestamp = image.timestamp;
      filename = image.filename;
    } else {
      // Message image mode - data comes from image element
      const imgElement = images[currentIndex];
      imageUrl = imgElement.src;
      prompt = imgElement.dataset.prompt || imgElement.alt || 'No prompt available';
      timestamp = imgElement.dataset.timestamp || null;
      filename = imgElement.dataset.filename || null;
    }
    
    // Update image source
    img.src = imageUrl;
    
    // Format date string
    const date = timestamp 
      ? new Date(timestamp).toLocaleDateString() + ' ' + new Date(timestamp).toLocaleTimeString() 
      : 'Unknown date';
    
    // Update info panel with all available metadata
    infoPanel.innerHTML = `
      <h3>Image Details</h3>
      <p><strong>Prompt:</strong> ${prompt}</p>
      <p><strong>Date:</strong> ${date}</p>
      <p><strong>Filename:</strong> ${filename}</p>
    `;
    
    // Update counter if there's more than one image
    if (images.length > 1) {
      // Remove any existing counter to prevent duplicates
      const existingCounter = slideshowContainer.querySelector('.gallery-slideshow-counter');
      if (existingCounter) {
        existingCounter.remove();
      }
      
      // Create a new counter with proper positioning
      const counter = document.createElement('div');
      counter.className = 'gallery-slideshow-counter';
      counter.textContent = `${currentIndex + 1} / ${images.length}`;
      slideshowContainer.appendChild(counter);
    }
  };
  
  // Initialize with the starting image
  showSlide(currentIndex);
  
  // Event listeners for navigation
  prevBtn.addEventListener('click', () => showSlide(currentIndex - 1));
  nextBtn.addEventListener('click', () => showSlide(currentIndex + 1));
  
  // Add keyboard navigation
  const handleKeydown = (e) => {
    if (e.key === 'ArrowLeft') {
      showSlide(currentIndex - 1);
    } else if (e.key === 'ArrowRight') {
      showSlide(currentIndex + 1);
    } else if (e.key === 'Escape') {
      closeSlideshow();
    }
  };
  
  document.addEventListener('keydown', handleKeydown);
  
  // Close on click outside
  slideshow.addEventListener('click', (e) => {
    if (e.target === slideshow) {
      closeSlideshow();
    }
  });
  
  // Control buttons
  closeBtn.addEventListener('click', closeSlideshow);
  
  // Add touch swipe navigation for mobile devices
  if (isMobile) {
    let touchStartX = 0;
    let touchEndX = 0;
    
    // Set up touch event handlers
    slideshowContainer.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });
    
    slideshowContainer.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipe();
    }, { passive: true });
    
    const handleSwipe = () => {
      // Calculate distance swiped
      const swipeDistance = touchEndX - touchStartX;
      
      // Determine minimum distance for a swipe (20% of screen width)
      const minSwipeDistance = window.innerWidth * 0.2;
      
      if (swipeDistance > minSwipeDistance) {
        // Swiped right -> show previous image
        showSlide(currentIndex - 1);
      } else if (swipeDistance < -minSwipeDistance) {
        // Swiped left -> show next image
        showSlide(currentIndex + 1);
      }
    };
    
    // Show/hide navigation UI based on tap (toggle)
    img.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent closing slideshow
      
      // Toggle visibility of controls
      controlsBar.style.opacity = controlsBar.style.opacity === '0' ? '1' : '0';
      prevBtn.style.opacity = prevBtn.style.opacity === '0' ? '1' : '0';
      nextBtn.style.opacity = nextBtn.style.opacity === '0' ? '1' : '0';
      infoPanel.style.opacity = infoPanel.style.opacity === '0' ? '1' : '0';
    });
  }
  
  // Handle download or share
  downloadBtn.addEventListener('click', () => {
    if (isMobile && navigator.share) {
      // Use Web Share API on mobile devices
      shareImage(isGalleryMode ? images[currentIndex] : images[currentIndex]);
    } else {
      // Traditional download on desktop
      if (isGalleryMode) {
        const image = images[currentIndex];
        window.downloadGalleryImage(image.data, image.filename);
      } else {
        const imgElement = images[currentIndex];
        const filename = imgElement.dataset.filename || `image-${Date.now()}.png`;
        window.downloadImage(imgElement.src, filename);
      }
    }
  });
  
  // Share image using Web Share API (mobile)
  async function shareImage(image) {
    try {
      // Get image data and convert to blob for sharing
      const imageUrl = isGalleryMode ? image.data : image.src;
      const imageName = isGalleryMode ? image.filename : (image.dataset.filename || 'image.png');
      
      // For base64 data URLs, convert to blob
      const fetchResponse = await fetch(imageUrl);
      const blob = await fetchResponse.blob();
      
      // Create file object for sharing
      const file = new File([blob], imageName, { type: blob.type });
      
      // Share the image
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Shared Image',
          text: isGalleryMode ? (image.prompt || 'Check out this image') : (image.alt || 'Check out this image')
        });
      } else {
        // Fallback if file sharing is not supported
        await navigator.share({
          title: 'Shared Image',
          text: isGalleryMode ? (image.prompt || 'Check out this image') : (image.alt || 'Check out this image'),
          url: window.location.href
        });
      }
    } catch (error) {
      console.error('Error sharing image:', error);
      alert('Unable to share this image. Try downloading it instead.');
      
      // Fallback to download
      if (isGalleryMode) {
        window.downloadGalleryImage(image.data, image.filename);
      } else {
        window.downloadImage(image.src, image.dataset.filename || 'image.png');
      }
    }
  }
  
  // Function to close slideshow
  function closeSlideshow() {
    document.removeEventListener('keydown', handleKeydown);
    document.body.removeChild(slideshow);
    
    // Reset the global flag after a small delay to prevent gallery from closing
    // This gives time for the current event loop to complete
    setTimeout(() => {
      window.isSlideshowOpen = false;
    }, 50);
  }
};

/**
 * Gathers all images from the current conversation
 * @returns {Object} An object with all images and the index of the clicked image
 */
window.gatherAllConversationImages = function(clickedImg) {
  // Get all message bubbles in the conversation
  const allMessages = Array.from(document.querySelectorAll('.message'));
  const allImages = [];
  let clickedImageIndex = -1;
  
  // Loop through each message and collect all images
  allMessages.forEach(message => {
    const messageImages = Array.from(message.querySelectorAll('.message-content img'));
    
    messageImages.forEach(img => {
      allImages.push(img);
      
      // Check if this is the image that was clicked
      if (img === clickedImg) {
        clickedImageIndex = allImages.length - 1;
      }
    });
  });
  
  return {
    images: allImages,
    clickedIndex: clickedImageIndex >= 0 ? clickedImageIndex : 0
  };
};

/**
 * Appends an assistant message to the chat box and conversation history
 * @param {string} assistantMessage - The assistant's message
 * @param {boolean} skipHistory - Whether to skip adding this message to conversation history
 * @returns {HTMLElement} - The created message element
 */
window.appendAssistantMessage = function(assistantMessage, skipHistory = false) {
  // Only store in conversation history if not skipped
  if (!skipHistory) {
    window.conversationHistory.push({ role: 'assistant', content: assistantMessage });
  }
  
  // Process the message with thinking tags and display it
  return window.appendMessage('Assistant', assistantMessage, 'assistant', skipHistory);
};

/**
 * Updates the visibility of system prompt input areas based on selected radio button
 */
window.updatePromptVisibility = function() {
  const personalityContainer = document.getElementById('personality-container');
  const customPromptContainer = document.getElementById('custom-prompt-container');
  const noPromptContainer = document.getElementById('no-prompt-container');
  
  if (window.personalityPromptRadio.checked) {
    if (personalityContainer) personalityContainer.style.display = 'block';
    if (customPromptContainer) customPromptContainer.style.display = 'none';
    if (noPromptContainer) noPromptContainer.style.display = 'none';
  } else if (window.customPromptRadio.checked) {
    if (personalityContainer) personalityContainer.style.display = 'none';
    if (customPromptContainer) customPromptContainer.style.display = 'block';
    if (noPromptContainer) noPromptContainer.style.display = 'none';
  } else if (window.noPromptRadio.checked) {
    if (personalityContainer) personalityContainer.style.display = 'none';
    if (customPromptContainer) customPromptContainer.style.display = 'none';
    if (noPromptContainer) noPromptContainer.style.display = 'block';
  }
};

/**
 * Updates parameter controls based on selected service
 */
window.updateParameterControls = function() {
  const currentService = window.config.defaultService;
  
  // Get sliders first
  if (!window.topPSlider || !window.frequencyPenaltySlider || !window.presencePenaltySlider) {
    console.warn('Parameter sliders not found, skipping updateParameterControls');
    return;
  }
  
  // Get the parent .setting-item containers
  const topPContainer = window.topPSlider.closest('.setting-item');
  const frequencyPenaltyContainer = window.frequencyPenaltySlider.closest('.setting-item');
  const presencePenaltyContainer = window.presencePenaltySlider.closest('.setting-item');
  
  // If containers don't exist, return early
  if (!topPContainer || !frequencyPenaltyContainer || !presencePenaltyContainer) {
    console.warn('Parameter containers not found, skipping updateParameterControls');
    return;
  }
  
  const isGoogle = currentService === 'google';
  const isOllama = currentService === 'ollama';
  
  // Show/hide refresh Ollama models button based on selected service
  const refreshOllamaModelsButton = document.getElementById('refresh-ollama-models');
  const ollamaRefreshInfo = document.querySelector('.ollama-refresh-info');
  
  if (refreshOllamaModelsButton) {
    refreshOllamaModelsButton.style.display = isOllama ? 'flex' : 'none';
  }
  
  if (ollamaRefreshInfo) {
    ollamaRefreshInfo.style.display = isOllama ? 'block' : 'none';
  }
  
  // Apply service-specific parameter visibility
  if (isGoogle) {
    topPContainer.style.opacity = '0.5';
    frequencyPenaltyContainer.style.opacity = '0.5';
    presencePenaltyContainer.style.opacity = '0.5';
    
    // Add compatibility notice if not already present
    if (!document.getElementById('google-compatibility-notice')) {
      const notice = document.createElement('div');
      notice.id = 'google-compatibility-notice';
      notice.className = 'service-compatibility-notice';
      notice.textContent =
        'Note: Top P, Frequency and Presence penalties are not supported by Google AI.';
      presencePenaltyContainer.parentNode.insertBefore(notice, presencePenaltyContainer.nextSibling);
    }
  } else if (isOllama) {
    topPContainer.style.opacity = '0.8';
    frequencyPenaltyContainer.style.opacity = '0.5';
    presencePenaltyContainer.style.opacity = '0.5';
    
    if (!document.getElementById('ollama-compatibility-notice')) {
      const notice = document.createElement('div');
      notice.id = 'ollama-compatibility-notice';
      notice.className = 'service-compatibility-notice';
      notice.textContent =
        'Note: Ollama supports temperature and top_p, but frequency/presence penalties may have limited effect. Server URL can be configured in the API Keys tab.';
      presencePenaltyContainer.parentNode.insertBefore(notice, presencePenaltyContainer.nextSibling);
    }
    const googleNotice = document.getElementById('google-compatibility-notice');
    if (googleNotice) {
      googleNotice.remove();
    }
  } else {
    topPContainer.style.opacity = '1';
    frequencyPenaltyContainer.style.opacity = '1';
    presencePenaltyContainer.style.opacity = '1';
    
    const googleNotice = document.getElementById('google-compatibility-notice');
    if (googleNotice) {
      googleNotice.remove();
    }
    
    const ollamaNotice = document.getElementById('ollama-compatibility-notice');
    if (ollamaNotice) {
      ollamaNotice.remove();
    }
  }
};