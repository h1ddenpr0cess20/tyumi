/**
 * Message handling and display functions
 */

// -----------------------------------------------------
// Message display functions
// -----------------------------------------------------

/**
 * Highlights code blocks in a message element and adds copy buttons
 * @param {HTMLElement} messageElement - The message element to process
 */
window.highlightAndAddCopyButtons = function(messageElement) {
  if (!messageElement) return;
  
  const codeBlocks = messageElement.querySelectorAll('pre code');
  if (codeBlocks.length === 0) return;
  
  if (typeof hljs !== 'undefined') {
    codeBlocks.forEach((codeBlock) => {
      // Check if code block has no language class or only has the default hljs class
      const hasLanguageClass = Array.from(codeBlock.classList).some(cls => 
        cls.startsWith('language-') && cls !== 'language-plaintext' && cls !== 'language-');
        
        // If no language specified, explicitly set it as plaintext to prevent auto-detection
        if (!hasLanguageClass) {
          codeBlock.classList.add('language-plaintext');
          codeBlock.classList.add('plaintext');
        }
        
        if (!codeBlock.classList.contains('hljs')) {
          hljs.highlightElement(codeBlock);
        }
        window.addCopyButton(codeBlock);
    });
  } else if (window.hljsLoaded) {
    if (typeof hljs !== 'undefined') {
      codeBlocks.forEach((codeBlock) => {
        // Check if code block has no language class or only has the default hljs class
        const hasLanguageClass = Array.from(codeBlock.classList).some(cls => 
          cls.startsWith('language-') && cls !== 'language-plaintext' && cls !== 'language-');
          
          // If no language specified, explicitly set it as plaintext to prevent auto-detection
          if (!hasLanguageClass) {
            codeBlock.classList.add('language-plaintext');
            codeBlock.classList.add('plaintext');
          }
          
          if (!codeBlock.classList.contains('hljs')) {
            hljs.highlightElement(codeBlock);
          }
          window.addCopyButton(codeBlock);
      });
    }
  } else {
    window.loadHighlightJS().then(() => {
      if (typeof hljs !== 'undefined') {
        codeBlocks.forEach((codeBlock) => {
          // Check if code block has no language class or only has the default hljs class
          const hasLanguageClass = Array.from(codeBlock.classList).some(cls => 
            cls.startsWith('language-') && cls !== 'language-plaintext' && cls !== 'language-');
            
            // If no language specified, explicitly set it as plaintext to prevent auto-detection
            if (!hasLanguageClass) {
              codeBlock.classList.add('language-plaintext');
              codeBlock.classList.add('plaintext');
            }
            
            if (!codeBlock.classList.contains('hljs')) {
              hljs.highlightElement(codeBlock);
            }
            window.addCopyButton(codeBlock);
        });
      }
    });
  }
};

/**
 * Generate a unique message ID
 * @returns {string} A unique message ID
 */
window.generateMessageId = function() {
  return `msg-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
};

/**
 * Appends a message to the message container
 * @param {string} sender - The sender name (e.g., 'You', 'Assistant')
 * @param {string} message - The message content
 * @param {string} role - The role of the message sender (e.g., 'user', 'assistant')
 * @param {boolean} skipHistory - Whether to skip adding the message to history
 * @returns {HTMLElement} The created message element
 */
window.appendMessage = function(sender, message, role, skipHistory = false) {
  const messageContainer = document.getElementById('chatBox') || document.getElementById('message-container');
  if (!messageContainer) return null;

  // Create a unique ID for the message for referencing later
  const messageId = window.generateMessageId();

  // Create the message element
  const messageElement = document.createElement('div');
  messageElement.classList.add('message', role);
  messageElement.id = messageId;
  
  // Create sender element
  const senderElement = document.createElement('div');
  senderElement.className = 'message-sender';
  const icon = document.createElement('img');
  icon.width = 20;
  icon.height = 20;
  icon.alt = sender;
  icon.src = sender === 'You'
    ? 'src/assets/img/human.svg'
    : 'src/assets/img/robot.svg';
  senderElement.appendChild(icon);
  messageElement.appendChild(senderElement);
  
  // Create content wrapper for the message
  const contentWrapper = document.createElement('div');
  contentWrapper.className = 'message-content';
  messageElement.appendChild(contentWrapper);
  
  // If this is just text, parse it
  if (typeof message === 'string') {
    // Convert markdown to HTML if markdownit is available
    let parsedContent = message;
    if (window.markdownit) {
      parsedContent = window.markdownit().render(message);
    } else {      // Basic handling for code blocks if markdown parser is not available
      parsedContent = message
        .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
        .replace(/\n/g, '<br>');
    }
    contentWrapper.innerHTML = window.sanitizeWithYouTube ? window.sanitizeWithYouTube(parsedContent) : DOMPurify.sanitize(parsedContent);
  } 
  // Otherwise, it might be a complex object with content and reasoning
  else if (typeof message === 'object' && message !== null) {
    // Use updateMessageContent to handle complex message objects
    window.updateMessageContent(messageElement, message);
  }
  
  // Add the message to the container
  messageContainer.appendChild(messageElement);
  
  // Apply syntax highlighting to code blocks
  window.highlightAndAddCopyButtons(messageElement);
  
  // Setup image interactions if any
  if (typeof window.setupImageInteractions === 'function') {
    window.setupImageInteractions(contentWrapper);
  }

  // If we should add this to conversation history, do so
  if (!skipHistory) {
    const historyEntry = {
      role: role,
      content: typeof message === 'string' ? message : message.content,
      id: messageId,
      timestamp: new Date().toISOString()
    };
    
    // Add reasoning if available
    if (typeof message === 'object' && message.reasoning) {
      historyEntry.reasoning = message.reasoning;
    }
    
    // Add to conversation history
    window.conversationHistory = window.conversationHistory || [];
    window.conversationHistory.push(historyEntry);
    
    // Auto-save after message is added to conversation history
    if (window.saveCurrentConversation) {
      window.saveCurrentConversation();
    }
  }
  
  // Scroll to the bottom of the message container
  setTimeout(() => {
    messageContainer.scrollTop = messageContainer.scrollHeight;
  }, 100);
  
  return messageElement;
};

/**
 * Updates the content of a message
 * @param {HTMLElement} messageElement - The message element to update
 * @param {Object} contentObj - Object containing content and optional reasoning
 */
window.updateMessageContent = function(messageElement, contentObj) {
  if (!messageElement) return;
  
  // Get or create message content wrapper
  let contentWrapper = messageElement.querySelector('.message-content');
  if (!contentWrapper) {
    contentWrapper = document.createElement('div');
    contentWrapper.className = 'message-content';
    messageElement.appendChild(contentWrapper);
  }
  
  // Get content and reasoning from the object
  const content = contentObj.content || '';
  const reasoning = contentObj.reasoning || '';
  
  // Convert Markdown to HTML for the main content
  let parsedContent = '';
  if (contentObj.isHtml) {
    parsedContent = content;
  } else if (window.markdownit) {
    parsedContent = window.markdownit().render(content);
  } else {
    parsedContent = content
      .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
      .replace(/\n/g, '<br>');
  }
  
  // Check if there are any images to display with this message
  const messageId = messageElement.id;
  if (window.generatedImages && window.generatedImages.length > 0 && messageId) {
    // Find images associated with this message
    const associatedImages = window.generatedImages.filter(img => 
      img.associatedMessageId === messageId || 
      (!img.associatedMessageId && img.timestamp && 
       Math.abs(new Date(img.timestamp) - new Date()) < 10000) // Images created in the last 10 seconds
    );
    
    // If we have images to display with this message
    if (associatedImages.length > 0) {
      // Create a container for images
      const imagesContainer = document.createElement('div');
      imagesContainer.className = 'generated-images';
      
      // Associate these images with this message
      associatedImages.forEach(img => {
        if (!img.associatedMessageId) {
          img.associatedMessageId = messageId;
        }
        
        // Create image element
        const imgEl = document.createElement('img');
        imgEl.src = img.url;
        imgEl.alt = img.prompt || 'Generated Image';
        imgEl.className = 'generated-image-thumbnail';
        imgEl.dataset.filename = img.filename || '';
        imgEl.dataset.messageId = messageId;
        imgEl.dataset.prompt = img.prompt || '';
        imgEl.dataset.timestamp = img.timestamp || '';
        
        // Add loading event handlers
        imgEl.onload = () => {
          if (window.VERBOSE_LOGGING) {
            console.info(`Image loaded successfully in message: ${img.filename || 'unnamed'}`);
          }
        };
        
        imgEl.onerror = (e) => {
          console.error(`Error loading image in message: ${img.filename || 'unnamed'}`, e);
          
          // Create a placeholder for the failed image
          const placeholder = document.createElement('div');
          placeholder.className = 'image-placeholder';
          placeholder.textContent = `Image could not be loaded: ${img.filename || 'unnamed'}`;
          
          // Replace the image with the placeholder
          if (imgEl.parentNode) {
            imgEl.parentNode.replaceChild(placeholder, imgEl);
          }
        };
        
        // Add the image to the container
        imagesContainer.appendChild(imgEl);
      });
      
      // Add the images container to the message
      contentWrapper.appendChild(imagesContainer);
      
      // Update the message in history to mark it as having images
      if (!skipHistory && window.conversationHistory) {
        const historyEntry = window.conversationHistory.find(msg => msg.id === messageId);
        if (historyEntry) {
          historyEntry.hasImages = true;
        }
      }
    }
  }
  
  // Create a container for the main content
  const mainContent = document.createElement('div');
  mainContent.className = 'main-content';
  mainContent.innerHTML = window.sanitizeWithYouTube ? window.sanitizeWithYouTube(parsedContent) : DOMPurify.sanitize(parsedContent);
  contentWrapper.appendChild(mainContent);
  
  // If there's reasoning, create the reasoning section
  if (reasoning.trim()) {
    // Create reasoning container
    const reasoningContainer = document.createElement('div');
    reasoningContainer.className = 'reasoning-container collapsed';
    
    // Create reasoning toggle button
    const reasoningToggle = document.createElement('button');
    reasoningToggle.className = 'reasoning-toggle';
    reasoningToggle.innerHTML = '<span class="toggle-icon">▶</span> <span class="toggle-label">Show reasoning</span>';
    reasoningToggle.onclick = function(event) {
      // Prevent event bubbling that might affect other elements
      if (event) {
        event.stopPropagation();
        event.preventDefault();
      }
      
      reasoningContainer.classList.toggle('collapsed');
      const isCollapsed = reasoningContainer.classList.contains('collapsed');
      reasoningToggle.querySelector('.toggle-icon').textContent = isCollapsed ? '▶' : '▼';
      reasoningToggle.querySelector('.toggle-label').textContent = isCollapsed ? 'Show reasoning' : 'Hide reasoning';
    };
    contentWrapper.appendChild(reasoningToggle);
      // Create reasoning content
    const reasoningContent = document.createElement('div');
    reasoningContent.className = 'reasoning-content';
    if (window.markdownit) {
      reasoningContent.innerHTML = window.sanitizeWithYouTube ? window.sanitizeWithYouTube(window.markdownit().render(reasoning)) : DOMPurify.sanitize(window.markdownit().render(reasoning));
    } else {
      reasoningContent.innerHTML = window.sanitizeWithYouTube ? window.sanitizeWithYouTube(reasoning.replace(/\n/g, '<br>')) : DOMPurify.sanitize(reasoning.replace(/\n/g, '<br>'));
    }
    reasoningContainer.appendChild(reasoningContent);
    contentWrapper.appendChild(reasoningContainer);
  }
};
