/**
 * Streaming response handling for the chatbot application
 */

// -----------------------------------------------------
// Streaming response handling functions
// -----------------------------------------------------

/**
 * Ensures all generated images have proper message ID associations
 * This improves image rendering and organization in conversation history
 * @returns {number} - Number of images that were updated with message IDs
 */
window.ensureImagesHaveMessageIds = function() {
  if (!window.generatedImages || !window.conversationHistory) {
    return 0;
  }
  
  let updatedCount = 0;
  const unassociatedImages = window.generatedImages.filter(img => !img.associatedMessageId);
  
  if (unassociatedImages.length === 0) {
    return 0;
  }
  
  // Find assistant messages that might need image associations
  const assistantMessages = window.conversationHistory
    .filter(msg => msg.role === 'assistant' && msg.id)
    .sort((a, b) => {
      // Sort by timestamp if available, otherwise use position in array
      const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return timeB - timeA; // Most recent first
    });
  
  // For each unassociated image, try to find the most appropriate message
  unassociatedImages.forEach(img => {
    // First, try to find a message with an image placeholder or reference to this image
    let associatedMessage = null;
    
    // 1. Check for specific filename references
    for (const msg of assistantMessages) {
      if (msg.content && msg.content.includes(`[[IMAGE: ${img.filename}]]`)) {
        associatedMessage = msg;
        break;
      }
    }
    
    // 3. If still not found, use the most recent assistant message (closest to image generation time)
    if (!associatedMessage && assistantMessages.length > 0) {
      if (img.timestamp) {
        // Find the message closest in time to the image (before or after)
        let closestMessage = assistantMessages[0];
        let smallestTimeDiff = Infinity;
        
        for (const msg of assistantMessages) {
          if (!msg.timestamp) continue;
          const timeDiff = Math.abs(
            new Date(msg.timestamp).getTime() - new Date(img.timestamp).getTime()
          );
          if (timeDiff < smallestTimeDiff) {
            smallestTimeDiff = timeDiff;
            closestMessage = msg;
          }
        }
        associatedMessage = closestMessage;
      } else {
        // Just use the most recent message if no timestamp
        associatedMessage = assistantMessages[0];
      }
    }
    
    // Update the image with the associated message ID
    if (associatedMessage) {
      img.associatedMessageId = associatedMessage.id;
      updatedCount++;
      
      // Also check if the message has the hasImages flag
      if (!associatedMessage.hasImages) {
        associatedMessage.hasImages = true;
      }
    }
  });
  
  return updatedCount;
}

/**
 * Handles a streaming response from the API
 * @param {Response} response - The response object from fetch
 * @param {string} loadingId - The ID of the loading indicator element
 */
window.handleStreamedResponse = async function(response, loadingId) {
  const loadingMessage = document.getElementById(loadingId);
  if (!loadingMessage) return;
  const contentWrapper = loadingMessage.querySelector('.message-content');
  if (!contentWrapper) return;

  // Clear initial "Processing..." or previous content
  contentWrapper.innerHTML = '';

  // First, check if there are any generated images to add before streaming text
  if (window.currentGeneratedImageHtml && window.currentGeneratedImageHtml.length > 0) {
    const imagesContainer = document.createElement('div');
    imagesContainer.className = 'generated-images';
    imagesContainer.innerHTML = window.currentGeneratedImageHtml.join('');
    contentWrapper.appendChild(imagesContainer);
    
    // Setup image interactions immediately
    window.setupImageInteractions(contentWrapper);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let accumulatedContent = '';
  let accumulatedReasoning = '';
  let thinkingContainer = null; // Reference to the DOM element
  let mainContentContainer = null; // Reference to the DOM element

  // Create main content container immediately
  mainContentContainer = document.createElement('div');
  mainContentContainer.className = 'main-response-content';
  contentWrapper.appendChild(mainContentContainer);

  // Reset auto-scroll flag to true when a new response starts
  window.shouldAutoScroll = true;
  // Force scroll to bottom when response begins streaming
  window.chatBox.scrollTop = window.chatBox.scrollHeight;

  try {
    while (!window.shouldStopGeneration) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      buffer += chunk;
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.trim() === '' || !line.startsWith('data:')) continue;
        const jsonStr = line.substring(5).trim();
        if (jsonStr === '[DONE]') {
          window.shouldStopGeneration = true;
          break;
        }

        try {
          const json = JSON.parse(jsonStr);
          const contentDelta = json.choices?.[0]?.delta?.content || '';
          const reasoningDelta = json.choices?.[0]?.delta?.reasoning_content || '';

          if (contentDelta || reasoningDelta) {
            if (contentDelta) accumulatedContent += contentDelta;
            if (reasoningDelta) accumulatedReasoning += reasoningDelta;

            // Prefer explicit reasoning_content if present, else use tag-based extraction
            let thinkingContent = accumulatedReasoning;
            let hasThinking = !!accumulatedReasoning;
            let processedText = accumulatedContent;
            if (!hasThinking) {
              const separated = window.separateThinkingContent(accumulatedContent);
              processedText = separated.processedText;
              thinkingContent = separated.thinkingContent;
              hasThinking = separated.hasThinking;
            }
            const thinkingId = 'thinking-' + loadingMessage.id;

            // Ensure thinking container exists if needed (created ONCE)
            if (hasThinking && !thinkingContainer) {
              thinkingContainer = document.getElementById(thinkingId);
              if (!thinkingContainer) {
                const containerHTML =
                  `<div id="${thinkingId}" class="thinking-container collapsed">
                     <div class="thinking-title" onclick="toggleThinking('${thinkingId}', event)">Reasoning</div>
                     <div class="thinking-content"></div>
                   </div>`;
                // Insert the thinking container before the main content, but after any images
                mainContentContainer.insertAdjacentHTML('beforebegin', containerHTML);
                thinkingContainer = document.getElementById(thinkingId);
              }
            }

            // Update main content container's innerHTML (only this part)
            mainContentContainer.innerHTML = window.processMainContentMarkdown(processedText);

            // Update thinking content's textContent (asynchronously)
            if (thinkingContainer && hasThinking) {
              const currentThinkingContent = thinkingContent;
              requestAnimationFrame(() => {
                const currentContainer = document.getElementById(thinkingId);
                if (currentContainer) {
                  const contentDiv = currentContainer.querySelector('.thinking-content');
                  if (contentDiv) {
                    contentDiv.textContent = currentThinkingContent;
                    if (!currentContainer.classList.contains('collapsed')) {
                      contentDiv.scrollTop = contentDiv.scrollHeight;
                    }
                  }
                }
              });
            }

            // Safely call highlightAndAddCopyButtons if it exists
            if (typeof window.highlightAndAddCopyButtons === 'function') {
              try {
                window.highlightAndAddCopyButtons(loadingMessage);
              } catch (e) {
                console.warn('Error highlighting code during streaming:', e);
              }
            }
            
            if (window.shouldAutoScroll) {
              // Use the optimized scroll function if available
              if (typeof window.fastScroll === 'function') {
                window.fastScroll(window.chatBox, window.chatBox.scrollHeight);
              } else {
                // Fall back to default scrolling
                requestAnimationFrame(() => {
                  window.chatBox.scrollTop = window.chatBox.scrollHeight;
                });
              }
            }
          }
        } catch (jsonParseError) {
          console.error('Error parsing JSON chunk:', jsonParseError, line);
        }
      }
    }
    window.finalizeStreamedResponse(loadingMessage, { content: accumulatedContent, reasoning: accumulatedReasoning });
  } catch (streamError) {
    // Handle stream reading errors
    if (streamError.name === 'AbortError') {
      // Just finish with what we have
      if (accumulatedContent.trim() || accumulatedReasoning.trim()) {
        window.finalizeStreamedResponse(loadingMessage, { content: accumulatedContent, reasoning: accumulatedReasoning });
      } else {
        window.removeLoadingIndicator(loadingId);
        if (window.showInfo) {
          window.showInfo('Generation stopped');
        }
      }
    } else {
      console.error('Stream reading error:', streamError);
      window.removeLoadingIndicator(loadingId);
      if (window.showError) {
        window.showError('An error occurred while reading the response stream');
      }
    }
  } finally {
    // Always reset the send button when done
    window.resetSendButton();
    window.shouldStopGeneration = false;
    
    // Clear the current generated images collection after we've used them
    window.currentGeneratedImageHtml = [];
  }
};

/**
 * Separates thinking/reasoning content and main response content from accumulated text,
 * handling both <think>...</think> and <|begin_of_thought|>...<|end_of_thought|> formats.
 * @param {string} text - The accumulated text.
 * @returns {{processedText: string, thinkingContent: string, hasThinking: boolean}} - Extracted content.
 */
window.separateThinkingContent = function(text) {
    const thinkStartTag = '<think>';
    const thinkEndTag = '</think>';
    const thoughtStartTag = '<|begin_of_thought|>';
    const thoughtEndTag = '<|end_of_thought|>';
    const solutionStartTag = '<|begin_of_solution|>';
    const solutionEndTag = '<|end_of_solution|>';

    let processedText = text;
    let thinkingContent = '';
    let hasThinking = false;

    const thinkStartIndex = text.indexOf(thinkStartTag);
    const thoughtStartIndex = text.indexOf(thoughtStartTag);

    if (thinkStartIndex !== -1) {
        // Handle <think> format (existing behavior)
        hasThinking = true;
        const thinkEndIndex = text.indexOf(thinkEndTag);
        if (thinkEndIndex !== -1 && thinkEndIndex > thinkStartIndex) {
            thinkingContent = text.substring(thinkStartIndex + thinkStartTag.length, thinkEndIndex);
            processedText = text.substring(0, thinkStartIndex) + text.substring(thinkEndIndex + thinkEndTag.length);
        } else {
            // Incomplete <think> block
            thinkingContent = text.substring(thinkStartIndex + thinkStartTag.length);
            processedText = text.substring(0, thinkStartIndex);
        }
    } else if (thoughtStartIndex !== -1) {
        // Handle <|begin_of_thought|> format
        hasThinking = true;
        const thoughtEndIndex = text.indexOf(thoughtEndTag);
        const solutionStartIndex = text.indexOf(solutionStartTag);
        const solutionEndIndex = text.indexOf(solutionEndTag);

        // Extract thinking content
        if (thoughtEndIndex !== -1 && thoughtEndIndex > thoughtStartIndex) {
            thinkingContent = text.substring(thoughtStartIndex + thoughtStartTag.length, thoughtEndIndex);
        } else {
            thinkingContent = text.substring(thoughtStartIndex + thoughtStartTag.length);
        }

        // Extract solution/processed text
        if (solutionStartIndex !== -1) {
            if (solutionEndIndex !== -1 && solutionEndIndex > solutionStartIndex) {
                processedText = text.substring(solutionStartIndex + solutionStartTag.length, solutionEndIndex);
            } else {
                processedText = text.substring(solutionStartIndex + solutionStartTag.length);
            }
        } else {
             // If solution hasn't started yet, main text is empty for now
             // (or potentially content before thought block if that's desired? Sticking to empty for now)
            processedText = '';
        }
    }
    // If neither format is detected, processedText remains the original text, thinkingContent is empty.

    return { processedText, thinkingContent, hasThinking };
};

/**
 * Processes accumulated markdown, handling thinking tags and incomplete blocks.
 * @param {string} accumulatedText - The full text received so far.
 * @param {HTMLElement} loadingMessage - The parent message element.
 * @returns {string} - HTML string ready to be set as innerHTML for the main content area.
 */
window.processMainContentMarkdown = function(mainText) {
    let html = mainText;
    // Handle incomplete code blocks
    if (html.split('```').length % 2 === 0) {
        html += '\n```';
    }
    // Handle incomplete inline code
    const backtickCount = (html.match(/`/g) || []).length;
    if (backtickCount % 2 !== 0 && html.endsWith('`')) {
        html += '`';
    }
      // First parse the markdown content
    if (typeof marked === 'undefined' && typeof window.loadMarkedLibrary === 'function') {
        window.loadMarkedLibrary();
    }
    let parsedContent = typeof marked !== 'undefined'
        ? (window.sanitizeWithYouTube ? window.sanitizeWithYouTube(marked.parse(html)) : DOMPurify.sanitize(marked.parse(html)))
        : DOMPurify.sanitize(html);
    
    // Then wrap image placeholders with span elements so they can be hidden with CSS
    // This ensures the markdown parser doesn't interfere with our spans
    parsedContent = parsedContent.replace(/\[\[IMAGE: ([^\]]+)\]\]/g, (match, filename) => {
        return `<span class="hidden-image-placeholder">${match}</span>`;
    });
    
    return parsedContent;
};

/**
 * Finalizes the streamed response by updating UI and saving to history
 */
window.finalizeStreamedResponse = function(loadingMessage, contentObj) {
  // contentObj: { content, reasoning }
  const content = typeof contentObj === 'string' ? contentObj : (contentObj.content || '');
  const reasoning = typeof contentObj === 'string' ? '' : (contentObj.reasoning || '');
  if (!content.trim() && !reasoning.trim() || !loadingMessage) return;

  // Clean any accidental double image tags that might have been generated by the model
  let cleanedContent = content;
  
  // Keep image placeholders in the content and let CSS handle hiding them
  // We no longer remove the placeholders, so they're preserved in conversation history
  // Only handle duplicates at the beginning of the content
  if (window.currentGeneratedImageHtml && window.currentGeneratedImageHtml.length > 0) {
    // Get all image tags in the content
    const imagePlaceholderMatches = cleanedContent.match(/\[\[IMAGE: ([^\]]+)\]\]/g) || [];
    
    // Check if we have image tags at the start followed by newlines
    // We no longer remove them, so this section is kept for compatibility
    // Later they'll be wrapped in hidden spans in processMainContentMarkdown
  }

  let processedText = cleanedContent;
  let thinkingContent = reasoning;
  let hasThinking = !!reasoning;
  if (!hasThinking) {
    const separated = window.separateThinkingContent(cleanedContent);
    processedText = separated.processedText;
    thinkingContent = separated.thinkingContent;
    hasThinking = separated.hasThinking;
  }
  const thinkingId = 'thinking-' + loadingMessage.id;
  const contentWrapper = loadingMessage.querySelector('.message-content');
  if (!contentWrapper) return;

  // Ensure this message has a stable ID for history association
  if (!loadingMessage.id) {
    loadingMessage.id = typeof window.generateMessageId === 'function'
      ? window.generateMessageId()
      : 'msg-' + Date.now();
  }

  // Include any generated images in the conversation history
  let fullContent = content;

  // First check if the content already contains image placeholders
  const hasExistingImagePlaceholders = /\[\[IMAGE: [^\]]+\]\]/.test(fullContent);

  // Only add image placeholders if there aren't any already in the content
  const willHaveImages = !hasExistingImagePlaceholders &&
                         window.currentGeneratedImageHtml &&
                         window.currentGeneratedImageHtml.length > 0;

  if (willHaveImages) {
    // Build the placeholder list from the images generated for this message
    const imageList = window.currentGeneratedImageHtml
      .map(html => {
        const match = html.match(/data-filename="([^"]+)"/);
        return match ? `[[IMAGE: ${match[1]}]]` : null;
      })
      .filter(Boolean)
      .join('\n');
    if (imageList) {
      fullContent = imageList + '\n\n' + fullContent;
    }
  }

  window.conversationHistory.push({
    role: 'assistant',
    content: fullContent,
    reasoning: reasoning,
    id: loadingMessage.id,
    timestamp: new Date().toISOString(),
    hasImages: willHaveImages
  });

  // Create a fresh content structure
  contentWrapper.innerHTML = '';
  
  // Step 1: Add images if they exist
  if (window.currentGeneratedImageHtml && window.currentGeneratedImageHtml.length > 0) {
    const imagesContainer = document.createElement('div');
    imagesContainer.className = 'generated-images';
    imagesContainer.innerHTML = window.currentGeneratedImageHtml.join('');
    contentWrapper.appendChild(imagesContainer);
    
    // Setup image interactions for the newly added images
    window.setupImageInteractions(imagesContainer);
    
    // Don't clear the currentGeneratedImageHtml array yet - we need it for history
    // But make a copy of it to associate with this message specifically
    const thisMessageImages = [...window.currentGeneratedImageHtml];

    // Create a unique ID for this message to properly associate images
    if (!loadingMessage.id) {
      loadingMessage.id = 'msg-' + Date.now();
    }

    // Associate these images in the global generatedImages array
    const filenamesForThisMessage = thisMessageImages
      .map(html => {
        const match = html.match(/data-filename="([^"]+)"/);
        return match ? match[1] : null;
      })
      .filter(Boolean);
    if (Array.isArray(window.generatedImages)) {
      window.generatedImages.forEach(img => {
        if (!img.associatedMessageId && filenamesForThisMessage.includes(img.filename)) {
          img.associatedMessageId = loadingMessage.id;
        }
      });
    }

    // Mark the conversation history entry as having images
    const historyEntry = window.conversationHistory && window.conversationHistory.find(msg => msg.id === loadingMessage.id);
    if (historyEntry) {
      historyEntry.hasImages = true;
    }

    // Store these images with this specific message ID for future reference
    if (!window.messageImages) window.messageImages = {};
    window.messageImages[loadingMessage.id] = thisMessageImages;
    
    // Now clear the global array for the next message
    window.currentGeneratedImageHtml = [];
  }
  
  // Step 2: Add reasoning container if it exists
  if (hasThinking) {
    const containerHTML = 
      `<div id="${thinkingId}" class="thinking-container">
         <div class="thinking-title" onclick="toggleThinking('${thinkingId}', event)">Reasoning</div>
         <div class="thinking-content">${thinkingContent}</div>
       </div>`;
    contentWrapper.insertAdjacentHTML('beforeend', containerHTML);
    // Get the container we just created
    const thinkingContainer = document.getElementById(thinkingId);
    if (thinkingContainer) {
      // Initially collapse the reasoning
      thinkingContainer.classList.add('collapsed');
    }
  }
  
  // Step 3: Add the main content container
  const mainContentContainer = document.createElement('div');
  mainContentContainer.className = 'main-response-content';
  mainContentContainer.innerHTML = window.processMainContentMarkdown(processedText);
  contentWrapper.appendChild(mainContentContainer);

  window.updateFinalMessage(loadingMessage);

  const cleanContentForTTS = content.replace(/<think>[\s\S]*?<\/think>/g, '').replace(/<\|begin_of_thought\|>[^\|]*?<\|end_of_thought\|>/g, '').replace(/<\|begin_of_solution\|>/g, '').replace(/<\|end_of_solution\|>/g, '');
  if (window.ttsConfig && window.ttsConfig.enabled && typeof window.generateTtsForMessage === 'function') {
    window.generateTtsForMessage(cleanContentForTTS, loadingMessage.id);
  }

  if (typeof window.updateBrowserHistory === 'function') {
    window.updateBrowserHistory();
  }
  
  // Auto-save conversation after assistant message is finalized
  if (window.saveCurrentConversation) {
    window.saveCurrentConversation();
  }
};

/**
 * Updates the final message with processed HTML
 */
window.updateFinalMessage = function(loadingMessage) {
  if (!loadingMessage) return;
  
  // Safely call highlightAndAddCopyButtons if it exists
  if (typeof window.highlightAndAddCopyButtons === 'function') {
    try {
      window.highlightAndAddCopyButtons(loadingMessage);
    } catch (e) {
      console.warn('Error highlighting code in final message:', e);
    }
  }
  
  loadingMessage.className = 'message assistant';
  if (!loadingMessage.id) {
    loadingMessage.id = 'msg-' + Date.now();
  }
  if (typeof window.addMessageCopyButton === 'function') {
    window.addMessageCopyButton(loadingMessage, loadingMessage.id);
  }
};

/**
 * Handles the non-streaming response from the API
 * @param {Object} data - The parsed JSON response data
 * @param {string} loadingId - The ID of the loading indicator element
 */
window.handleNonStreamingResponse = function(data, loadingId) {
  const loadingMessage = document.getElementById(loadingId);
  
  // Always reset the send button when response is complete
  window.resetSendButton();
  
  if (window.hasValidAssistantMessage(data)) {
    const messageObj = data.choices[0].message;
    const assistantMessage = messageObj.content;
    const reasoning = messageObj.reasoning_content || '';
    const msgId = window.addToConversationHistory(assistantMessage, reasoning);
    window.updateLoadingIndicator(loadingMessage, { content: assistantMessage, reasoning, id: msgId });
  } else {
    // Handle invalid or empty response
    window.handleInvalidResponse(loadingId);
  }

  // Auto-save conversation
  if (window.saveCurrentConversation) {
    window.saveCurrentConversation();
  }
};

/**
 * Checks if the response data contains a valid assistant message
 * @param {Object} data - The parsed JSON response data
 * @returns {boolean} - Whether the data contains a valid message
 */
window.hasValidAssistantMessage = function(data) {
  return data.choices && 
         data.choices[0] && 
         data.choices[0].message && 
         data.choices[0].message.content;
};

/**
 * Adds the assistant's message to conversation history
 * @param {string} assistantMessage - The assistant's response message
 */
window.addToConversationHistory = function(assistantMessage, reasoning) {
  const msgId = typeof window.generateMessageId === 'function'
    ? window.generateMessageId()
    : 'msg-' + Date.now();

  window.conversationHistory.push({
    role: 'assistant',
    content: assistantMessage,
    reasoning: reasoning || '',
    id: msgId,
    timestamp: new Date().toISOString()
  });

  return msgId;
  
  // Update browser history
  if (typeof window.updateBrowserHistory === 'function') {
    window.updateBrowserHistory();
  }
};

/**
 * Updates the loading indicator UI element
 * @param {HTMLElement} loadingMessage - The loading indicator element
 * @param {string} assistantMessage - The assistant's response message
 */
window.updateLoadingIndicator = function(loadingMessage, assistantMessageObj) {
  if (loadingMessage) {
    if (assistantMessageObj && assistantMessageObj.id) {
      loadingMessage.id = assistantMessageObj.id;
    }
    const cursor = loadingMessage.querySelector('.streaming-cursor');
    if (cursor) {
      cursor.classList.add('fade-out');
      setTimeout(() => {
        window.updateMessageContent(loadingMessage, assistantMessageObj);
      }, 250);
    } else {
      window.updateMessageContent(loadingMessage, assistantMessageObj);
    }
  } else {
    const processedMessage = window.processMainContentMarkdown(assistantMessageObj.content);
    window.appendAssistantMessage(processedMessage);
  }
};

/**
 * Updates the message content with the parsed markdown
 */
// Accepts raw message and processes it
window.updateMessageContent = function(loadingMessage, assistantMessageObj) {
  if (!loadingMessage) return;
  const contentWrapper = loadingMessage.querySelector('.message-content');
  if (!contentWrapper) return;
  const content = typeof assistantMessageObj === 'string' ? assistantMessageObj : (assistantMessageObj.content || '');
  const reasoning = typeof assistantMessageObj === 'string' ? '' : (assistantMessageObj.reasoning || '');
  let processedText = content;
  let thinkingContent = reasoning;
  let hasThinking = !!reasoning;
  if (!hasThinking) {
    const separated = window.separateThinkingContent(content);
    processedText = separated.processedText;
    thinkingContent = separated.thinkingContent;
    hasThinking = separated.hasThinking;
  }
  const thinkingId = 'thinking-' + loadingMessage.id;

  // Create a fresh content structure
  contentWrapper.innerHTML = '';
  
  // Step 1: Check if we have stored images for this message
  if (window.messageImages && window.messageImages[loadingMessage.id]) {
    const imagesContainer = document.createElement('div');
    imagesContainer.className = 'generated-images';
    imagesContainer.innerHTML = window.messageImages[loadingMessage.id].join('');
    contentWrapper.appendChild(imagesContainer);
    
    // Setup image interactions for the images
    window.setupImageInteractions(imagesContainer);
  }
  
  // Step 2: Add reasoning container if it exists
  if (hasThinking) {
    const containerHTML = 
      `<div id="${thinkingId}" class="thinking-container">
         <div class="thinking-title" onclick="toggleThinking('${thinkingId}', event)">Reasoning</div>
         <div class="thinking-content">${thinkingContent}</div>
       </div>`;
    contentWrapper.insertAdjacentHTML('beforeend', containerHTML);
    // Get the container we just created
    const thinkingContainer = document.getElementById(thinkingId);
    if (thinkingContainer) {
      // Initially collapse the reasoning
      thinkingContainer.classList.add('collapsed');
    }
  }
  
  // Step 3: Add the main content container
  const mainContentContainer = document.createElement('div');
  mainContentContainer.className = 'main-response-content';
  mainContentContainer.innerHTML = window.processMainContentMarkdown(processedText);
  contentWrapper.appendChild(mainContentContainer);
  
  window.updateFinalMessage(loadingMessage);
};

/**
 * Removes the loading indicator element
 * @param {string} loadingId - The ID of the loading indicator element
 */
window.removeLoadingIndicator = function(loadingId) {
  const loadingMessage = document.getElementById(loadingId);
  if (loadingMessage) {
    window.chatBox.removeChild(loadingMessage);
  }
};

/**
 * Handles an invalid API response by showing an error message
 * @param {string} loadingId - The ID of the loading indicator element
 */
window.handleInvalidResponse = function(loadingId) {
  window.removeLoadingIndicator(loadingId);
  // Show error notification instead of chat message
  if (window.showError) {
    window.showError('Unexpected API response format.');
  }
};