/**
 * Conversation history and URL state management functions
 */

// -----------------------------------------------------
// History and state management
// -----------------------------------------------------

/**
 * Updates the browser history with the current state
 */
window.updateBrowserHistory = function() {
  let systemPromptValue = "";
  let promptType = "none";
  
  if (window.personalityPromptRadio.checked) {
    promptType = "personality";
    systemPromptValue = window.personalityInput.value.trim();
  } else if (window.customPromptRadio.checked) {
    promptType = "custom";
    systemPromptValue = window.systemPromptCustom.value;
  }
  
  const newHistoryState = {
    conversationHistory: [...window.conversationHistory],
    historyStateId: Date.now(),
    modelSelection: window.modelSelector.value,
    serviceSelection: window.serviceSelector.value,
    promptType: promptType,
    personalityValue: window.personalityInput.value,
    systemPrompt: systemPromptValue
  };
  window.history.pushState(newHistoryState, 'Chat');
};

/**
 * Loads conversation from URL parameters if available
 */
window.loadFromUrl = function() {
  if (window.location.search) {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.has('chat')) {
        const chatData = JSON.parse(decodeURIComponent(urlParams.get('chat')));
        
        // Add to conversation history
        window.conversationHistory = chatData.messages || [];
        
        // Load saved messages into the UI
        chatData.messages.forEach((msg) => {
          if (msg.role !== 'system') {
            window.appendMessage(msg.role === 'user' ? 'You' : '  ', msg.content, msg.role);
          }
        });
        
        // Select the model if available
        if (chatData.model) {
          const modelOption = Array.from(window.modelSelector.options).find(
            option => option.value === chatData.model
          );
          
          if (modelOption) {
            window.modelSelector.value = chatData.model;
            window.updateHeaderInfo();
          }
        }
        
        // Save the loaded conversation to IndexedDB
        const now = new Date();
        const conversation = {
          id: 'url-import-' + now.getTime(),
          name: chatData.name || 'Imported Conversation ' + now.toLocaleString(),
          created: chatData.created || now.toISOString(),
          updated: now.toISOString(),
          messages: window.conversationHistory,
          images: chatData.images || [],
          model: chatData.model || (window.modelSelector ? window.modelSelector.value : 'Unknown'),
          service: chatData.service || (window.config ? window.config.defaultService : 'Unknown'),
          systemPrompt: chatData.systemPrompt || {
            type: 'none',
            content: ''
          }
        };
        
        // Set as current conversation
        window.currentConversationId = conversation.id;
        window.currentConversationName = conversation.name;
        
        // Save to IndexedDB
        window.saveConversationToDb(conversation)
          .then(id => {
            if (window.VERBOSE_LOGGING) {
              console.info('Saved URL-imported conversation to IndexedDB:', id);
            }
          })
          .catch(err => {
            console.error('Failed to save URL-imported conversation to IndexedDB:', err);
          });
      }
    } catch (error) {
      console.error('Error loading chat from URL:', error);
    }
  }
};

// -----------------------------------------------------
// Chat History Management
// -----------------------------------------------------

// Get all saved conversations
window.getAllConversations = function() {
  return window.getAllConversationsFromDb();
};

// Save the current conversation (auto-save)
window.saveCurrentConversation = function(meta = {}) {
  // Initialize generatedImages array if it doesn't exist
  if (!window.generatedImages) window.generatedImages = [];
  
  // Ensure images have message associations before saving
  if (typeof window.ensureImagesHaveMessageIds === 'function') {
    const updatedCount = window.ensureImagesHaveMessageIds();
    if (window.VERBOSE_LOGGING && updatedCount > 0) {
      console.info(`Associated ${updatedCount} images with messages before saving`);
    }
  }
  
  const now = new Date();
  
  // Determine current system prompt type and content
  let promptType = 'none';
  let promptContent = '';

  // If a conversation was loaded, and we are saving it (not starting a new one after a load)
  // then preserve its original system prompt.
  if (window.loadedSystemPrompt && window.currentConversationId) {
    promptType = window.loadedSystemPrompt.type;
    promptContent = window.loadedSystemPrompt.content;
  } else {
    // Otherwise, use the currently selected prompt options in the UI
    if (window.personalityPromptRadio && window.personalityPromptRadio.checked) {
      promptType = 'personality';
      promptContent = window.personalityInput ? window.personalityInput.value : '';
    } else if (window.customPromptRadio && window.customPromptRadio.checked) {
      promptType = 'custom';
      promptContent = window.systemPromptCustom ? window.systemPromptCustom.value : '';
    }
  }
  
  // Process images - store them in IndexedDB and keep references
  const savePromises = [];
  const processedImages = window.generatedImages.map(img => {
    // Create a copy to avoid modifying the original
    const processedImg = { ...img };
    
    // If the URL is a data URL, save it to IndexedDB
    if (processedImg.url && processedImg.url.startsWith('data:image')) {
      try {
        // Create a unique filename if one doesn't exist
        if (!processedImg.filename) {
          const extension = processedImg.url.startsWith('data:image/jpeg') ? 'jpg' : 'png';
          processedImg.filename = `image-${Date.now()}-${Math.random().toString(36).substring(2, 10)}.${extension}`;
        }
        
        // Store image data in IndexedDB
        const savePromise = window.saveImageToDb(processedImg.url, processedImg.filename, {
          prompt: processedImg.prompt || '',
          tool: processedImg.tool || '',
          associatedMessageId: processedImg.associatedMessageId || ''
        }).catch(err => {
          console.error('Failed to save image to IndexedDB:', err);
          return null;
        });
        
        savePromises.push(savePromise);
        
        // Store only the reference
        const storageRef = {
          filename: processedImg.filename,
          prompt: processedImg.prompt || '',
          tool: processedImg.tool || '',
          timestamp: processedImg.timestamp || new Date().toISOString(),
          associatedMessageId: processedImg.associatedMessageId || '',
          isStoredInDb: true
        };
        
        return storageRef;
      } catch (e) {
        console.error('Error processing image for storage:', e);
        // Keep a minimal record that there was an image
        return {
          filename: processedImg.filename || `fallback-${Date.now()}.png`,
          prompt: processedImg.prompt || '',
          timestamp: new Date().toISOString(),
          imageUnavailable: true,
          error: e.message
        };
      }
    }
    
    return processedImg;
  });
  
  // Mark messages that have images for easy identification
  const markedMessages = window.conversationHistory.map(msg => {
    // Create a copy to avoid modifying the original
    const markedMsg = { ...msg };
    
    // If this is an assistant message, check if it might contain images
    if (markedMsg.role === 'assistant') {
      // Find any images associated with this message
      const hasAssociatedImages = processedImages.some(img => 
        img.associatedMessageId === markedMsg.id
      );
      
      // If it has associated images, mark it for easy identification later
      if (hasAssociatedImages) {
        markedMsg.hasImages = true;
        
        // Assign a message ID if needed for image association
        if (!markedMsg.id) {
          markedMsg.id = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
        }
      }
    }
    return markedMsg;
  });
  
  const conversation = {
    id: window.currentConversationId || ('' + now.getTime()),
    name: meta.name || window.currentConversationName || 'Conversation ' + now.toLocaleString(),
    created: meta.created || now.toISOString(),
    updated: now.toISOString(),
    messages: markedMessages,
    images: processedImages,
    model: window.modelSelector ? window.modelSelector.value : 'Unknown',
    service: window.config ? window.config.defaultService : 'Unknown',
    systemPrompt: {
      type: promptType,
      content: promptContent
    }
  };
  
  // Store conversation ID
  window.currentConversationId = conversation.id;
  window.currentConversationName = conversation.name;
  
  // Wait for all image saves to complete
  Promise.all(savePromises).then(results => {
    if (window.VERBOSE_LOGGING && results.length > 0) {
      console.info(`Saved ${results.filter(Boolean).length} images to IndexedDB`);
    }
  }).catch(err => {
    console.error('Error saving images to IndexedDB:', err);
  });
  
  // Save the conversation to IndexedDB
  window.saveConversationToDb(conversation)
    .then(id => {
      if (window.VERBOSE_LOGGING) {
        console.info('Saved conversation to IndexedDB:', id);
      }
    })
    .catch(err => {
      console.error('Failed to save conversation to IndexedDB:', err);
    });
};

// Delete a conversation by id
window.deleteConversation = function(id) {
  window.deleteConversationFromDb(id)
    .then(() => {
      // If the current conversation was deleted, clear the current ID
      if (window.currentConversationId === id) {
        window.currentConversationId = null;
        window.currentConversationName = null;
      }
      // Update the UI
      window.renderChatHistoryList();
    })
    .catch(err => {
      console.error('Failed to delete conversation from IndexedDB:', err);
    });
};

// Rename a conversation
window.renameConversation = function(id, newName) {
  window.renameConversationInDb(id, newName)
    .then(() => {
      // Update current conversation name if it's the active one
      if (window.currentConversationId === id) {
        window.currentConversationName = newName;
      }
      // Update the UI
      window.renderChatHistoryList();
    })
    .catch(err => {
      console.error('Failed to rename conversation in IndexedDB:', err);
    });
};

// Start a new conversation
window.startNewConversation = function(name = null) {
  // Save current conversation first if it has any messages
  if (window.conversationHistory && window.conversationHistory.length > 0 && window.currentConversationId) {
    window.saveCurrentConversation();
  }
  
  // Reset all conversation state
  window.conversationHistory = [];
  window.generatedImages = [];
  window.currentConversationId = null;
  window.currentConversationName = name || null;
  window.loadedSystemPrompt = null; // Reset loaded system prompt
  
  // Clear UI
  if (window.chatBox) {
    window.chatBox.innerHTML = '';
  }
  
  // For debugging
  if (window.VERBOSE_LOGGING) {
    console.info('Started new conversation');
  }
};

// Load a conversation by id
window.loadConversation = function(id) {
  return window.loadConversationFromDb(id)
    .then(convo => {
      if (!convo) {
        console.warn(`Conversation ${id} not found in IndexedDB`);
        return false;
      }

      const ensureHighlight = typeof hljs === 'undefined' && typeof window.loadHighlightJS === 'function'
        ? window.loadHighlightJS() : Promise.resolve();
      const ensureMarked = typeof marked === 'undefined' && typeof window.loadMarkedLibrary === 'function'
        ? window.loadMarkedLibrary() : Promise.resolve();

      return Promise.all([ensureHighlight, ensureMarked])
        .then(() => {
          loadConversationIntoUI(convo);
          return true;
        });
    })
    .catch(err => {
      console.error('Error loading conversation from IndexedDB:', err);
      return false;
    });
  
  // Helper function to load a conversation into the UI
  function loadConversationIntoUI(convo) {
    // Save data
    window.conversationHistory = convo.messages || [];
    window.generatedImages = convo.images || [];
    window.currentConversationId = convo.id;
    window.currentConversationName = convo.name;
    window.loadedSystemPrompt = convo.systemPrompt; // Store the loaded system prompt
    
    // Clear UI before loading
    if (window.chatBox) {
      window.chatBox.innerHTML = '';
    }
    
    // Pre-load images from IndexedDB before rendering messages
    const imageLoadPromises = [];
    const imageCache = new Map();
    
    if (convo.images && convo.images.length > 0) {
      convo.images.forEach(imgRef => {
        // If this image is stored in IndexedDB
        if (imgRef.isStoredInDb && imgRef.filename) {
          const loadPromise = window.loadImageFromDb(imgRef.filename)
            .then(imageRecord => {
              // Store the actual image data in our cache
              if (imageRecord && imageRecord.data) {
                // Store just the image data string, not the whole record
                imageCache.set(imgRef.filename, imageRecord.data);
                if (window.VERBOSE_LOGGING) {
                  console.info(`Loaded image from IndexedDB: ${imgRef.filename}`);
                }
              }
            })
            .catch(err => {
              console.warn(`Failed to load image ${imgRef.filename} from IndexedDB:`, err);
            });
          
          imageLoadPromises.push(loadPromise);
        }
      });
    }
    
    // Wait for all images to load, then render the messages
    Promise.all(imageLoadPromises)
      .then(() => {
        if (window.VERBOSE_LOGGING) {
          console.info(`Loaded ${imageCache.size} images from IndexedDB`);
        }
        
        // Now render messages, with images from our cache
        renderConversationMessages(convo, imageCache);
      })
      .catch(err => {
        console.error('Error loading images from IndexedDB:', err);
        // Fall back to rendering without loaded images
        renderConversationMessages(convo, imageCache);
      });
  }
};

// Render chat history list in the panel
window.renderChatHistoryList = function() {
  if (!window.historyList) return;
  
  // Get all conversations from IndexedDB
  window.getAllConversationsFromDb()
    .then(convos => {
      window.historyList.innerHTML = '';
      
      if (!convos || convos.length === 0) {
        window.historyList.innerHTML = '<div class="history-empty">No saved conversations yet.</div>';
        return;
      }
      
      // Sort by most recently updated
      convos.sort((a, b) => new Date(b.updated) - new Date(a.updated));
      
      // Create the action toolbar
      const toolbarDiv = document.createElement('div');
      toolbarDiv.className = 'history-toolbar';
      toolbarDiv.innerHTML = `
        <div class="history-toolbar-left">
          <button class="history-new-button">
            <span>+ Start New Conversation</span>
          </button>
          <label class="selection-mode-toggle">
            <input type="checkbox" id="multi-select-mode"> Multi-select
          </label>
        </div>
        <div class="history-toolbar-right">
          <span class="selection-status" style="display: none; font-size: 0.85rem; color: var(--text-secondary); margin-right: 8px;">
            <span class="selected-count">0</span> selected
          </span>
          <button class="history-select-all-btn" title="Select all conversations" style="display: none;">Select All</button>
          <button class="history-clear-selection-btn" title="Clear selection" style="display: none;">Clear</button>
          <button class="history-load-btn" title="Load selected conversation" disabled>Load</button>
          <button class="history-rename-btn" title="Rename selected conversation" disabled>Rename</button>
          <button class="history-delete-btn" title="Delete selected conversations" disabled>Delete (<span class="delete-count">0</span>)</button>
        </div>
      `;
      
      // Add event handlers for toolbar buttons
      const newButton = toolbarDiv.querySelector('.history-new-button');
      const multiSelectCheckbox = toolbarDiv.querySelector('#multi-select-mode');
      const selectionStatus = toolbarDiv.querySelector('.selection-status');
      const selectedCountSpan = toolbarDiv.querySelector('.selected-count');
      const selectAllButton = toolbarDiv.querySelector('.history-select-all-btn');
      const clearSelectionButton = toolbarDiv.querySelector('.history-clear-selection-btn');
      const loadButton = toolbarDiv.querySelector('.history-load-btn');
      const renameButton = toolbarDiv.querySelector('.history-rename-btn');
      const deleteButton = toolbarDiv.querySelector('.history-delete-btn');
      const deleteCountSpan = toolbarDiv.querySelector('.delete-count');
      
      // Function to update button states
      const updateButtonStates = () => {
        const selectedRows = document.querySelectorAll('.history-row.selected');
        const isMultiSelect = multiSelectCheckbox.checked;
        const selectedCount = selectedRows.length;
        
        // Show/hide multi-select specific buttons and status
        selectAllButton.style.display = isMultiSelect ? 'inline-block' : 'none';
        clearSelectionButton.style.display = isMultiSelect ? 'inline-block' : 'none';
        selectionStatus.style.display = isMultiSelect && selectedCount > 0 ? 'inline-block' : 'none';
        
        // Update selection count displays
        selectedCountSpan.textContent = selectedCount;
        deleteCountSpan.textContent = selectedCount;
        
        // Update button states
        loadButton.disabled = selectedCount !== 1; // Load only works with single selection
        renameButton.disabled = selectedCount !== 1; // Rename only works with single selection
        deleteButton.disabled = selectedCount === 0;
        
        // Update delete button text
        deleteButton.title = selectedCount > 1 ? 
          `Delete ${selectedCount} selected conversations` : 
          'Delete selected conversation';
      };
      
      newButton.onclick = () => {
        window.startNewConversation();
        window.historyPanel.setAttribute('aria-hidden', 'true');
        window.historyButton.setAttribute('aria-expanded', 'false');
      };
      
      multiSelectCheckbox.onchange = () => {
        const isMultiSelect = multiSelectCheckbox.checked;
        
        // Clear existing selections when switching modes
        document.querySelectorAll('.history-row').forEach(row => {
          row.classList.remove('selected');
        });
        
        // Update table display mode
        const table = document.querySelector('.history-table');
        if (table) {
          table.classList.toggle('multi-select-mode', isMultiSelect);
        }
        
        updateButtonStates();
      };
      
      selectAllButton.onclick = () => {
        document.querySelectorAll('.history-row').forEach(row => {
          row.classList.add('selected');
        });
        updateButtonStates();
      };
      
      clearSelectionButton.onclick = () => {
        document.querySelectorAll('.history-row').forEach(row => {
          row.classList.remove('selected');
        });
        updateButtonStates();
      };
      
      loadButton.onclick = () => {
        const selectedRow = document.querySelector('.history-row.selected');
        if (selectedRow) {
          const conversationId = selectedRow.dataset.conversationId;
          window.loadConversation(conversationId).then(() => {
            window.historyPanel.setAttribute('aria-hidden', 'true'); 
            window.historyButton.setAttribute('aria-expanded', 'false');
          });
        }
      };
      
      renameButton.onclick = () => {
        const selectedRow = document.querySelector('.history-row.selected');
        if (selectedRow) {
          const conversationId = selectedRow.dataset.conversationId;
          const currentTitle = selectedRow.querySelector('.history-title').textContent;
          const newName = prompt('Rename conversation:', currentTitle);
          if (newName && newName.trim()) {
            window.renameConversation(conversationId, newName.trim());
          }
        }
      };
      
      deleteButton.onclick = () => {
        const selectedRows = document.querySelectorAll('.history-row.selected');
        if (selectedRows.length === 0) return;
        
        const conversationIds = Array.from(selectedRows).map(row => row.dataset.conversationId);
        const confirmMessage = conversationIds.length === 1 ? 
          'Delete this conversation?' : 
          `Delete ${conversationIds.length} conversations?`;
          
        if (confirm(confirmMessage)) {
          // Delete all selected conversations
          Promise.all(conversationIds.map(id => window.deleteConversationFromDb(id)))
            .then(() => {
              // Update UI state
              conversationIds.forEach(id => {
                if (window.currentConversationId === id) {
                  window.currentConversationId = null;
                  window.currentConversationName = null;
                }
              });
              // Refresh the list
              window.renderChatHistoryList();
            })
            .catch(err => {
              console.error('Failed to delete conversations:', err);
              alert('Error deleting conversations. Please try again.');
            });
        }
      };
      
      window.historyList.appendChild(toolbarDiv);
      
      // Add keyboard event handler for the history panel
      const handleKeydown = (e) => {
        if (window.historyPanel.getAttribute('aria-hidden') === 'true') return;
        
        if (e.key === 'Delete' || e.key === 'Backspace') {
          const selectedRows = document.querySelectorAll('.history-row.selected');
          if (selectedRows.length > 0) {
            deleteButton.click();
          }
        } else if (e.key === 'Enter') {
          const selectedRows = document.querySelectorAll('.history-row.selected');
          if (selectedRows.length === 1) {
            loadButton.click();
          }
        } else if (e.key === 'a' && (e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          if (multiSelectCheckbox.checked) {
            selectAllButton.click();
          }
        } else if (e.key === 'Escape') {
          clearSelectionButton.click();
        }
      };
      
      document.addEventListener('keydown', handleKeydown);
      
      // Create the table container
      const tableContainer = document.createElement('div');
      tableContainer.className = 'history-table-container';
      
      // Create the table
      const table = document.createElement('table');
      table.className = 'history-table';
      
      // Create table header
      const thead = document.createElement('thead');
      thead.innerHTML = `
        <tr>
          <th class="col-title">Conversation</th>
          <th class="col-prompt">Prompt</th>
          <th class="col-model">Model</th>
          <th class="col-stats">Stats</th>
          <th class="col-date">Updated</th>
        </tr>
      `;
      table.appendChild(thead);
      
      // Create table body
      const tbody = document.createElement('tbody');
      
      // Add all conversations as table rows
      convos.forEach(convo => {
        const row = document.createElement('tr');
        row.className = 'history-row';
        row.dataset.conversationId = convo.id;
        
        // Highlight current conversation
        if (window.currentConversationId === convo.id) {
          row.classList.add('current-conversation');
        }
        
        // Get title from first user message
        let title = '';
        const userMsg = convo.messages.find(m => m.role === 'user');
        if (userMsg) {
          title = userMsg.content.substring(0, 50) + (userMsg.content.length > 50 ? '...' : '');
        } else {
          title = '(No user message)';
        }
        
        const date = new Date(convo.updated);
        const formatted = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
        
        // Get prompt type info
        let promptInfo = '';
        let promptClass = 'none';
        if (convo.systemPrompt) {
          if (convo.systemPrompt.type === 'personality') {
            promptInfo = convo.systemPrompt.content || 'Default';
            promptClass = 'personality';
          } else if (convo.systemPrompt.type === 'custom') {
            promptInfo = (convo.systemPrompt.content || '').substring(0, 30) + 
                        ((convo.systemPrompt.content || '').length > 30 ? '...' : '');
            promptClass = 'custom';
          } else {
            promptInfo = 'None';
            promptClass = 'none';
          }
        }
        
        // Model info
        const modelInfo = convo.model || 'Unknown';
        const serviceInfo = convo.service || 'Unknown';
        
        // Stats info
        const messageCount = convo.messages.length;
        const imageCount = convo.images.length;
        
        row.innerHTML = `
          <td class="col-title">
            <div class="history-title">${title}</div>
          </td>
          <td class="col-prompt">
            <span class="prompt-type ${promptClass}">${promptInfo}</span>
          </td>
          <td class="col-model">
            <div class="model-info">
              <div class="model-name">${modelInfo}</div>
              <div class="service-name">${serviceInfo}</div>
            </div>
          </td>
          <td class="col-stats">
            <div class="stats-info">
              <span class="message-count">${messageCount} msg</span>
              ${imageCount > 0 ? `<span class="image-count">${imageCount} img</span>` : ''}
            </div>
          </td>
          <td class="col-date">
            <span class="date-info">${formatted}</span>
          </td>
        `;
        
        // Add click handler for row selection
        row.onclick = (e) => {
          const isMultiSelect = multiSelectCheckbox.checked;
          
          if (isMultiSelect) {
            // Multi-select mode: toggle selection
            if (e.ctrlKey || e.metaKey) {
              // Ctrl/Cmd+click: toggle this row
              row.classList.toggle('selected');
            } else if (e.shiftKey) {
              // Shift+click: select range
              const allRows = Array.from(document.querySelectorAll('.history-row'));
              const lastSelected = document.querySelector('.history-row.selected:last-of-type');
              
              if (lastSelected) {
                const startIndex = allRows.indexOf(lastSelected);
                const endIndex = allRows.indexOf(row);
                const [minIndex, maxIndex] = [Math.min(startIndex, endIndex), Math.max(startIndex, endIndex)];
                
                // Select all rows in range
                for (let i = minIndex; i <= maxIndex; i++) {
                  allRows[i].classList.add('selected');
                }
              } else {
                row.classList.add('selected');
              }
            } else {
              // Regular click: toggle this row
              row.classList.toggle('selected');
            }
          } else {
            // Single-select mode: only one can be selected
            document.querySelectorAll('.history-row').forEach(r => r.classList.remove('selected'));
            row.classList.add('selected');
          }
          
          updateButtonStates();
        };
        
        tbody.appendChild(row);
      });
      
      table.appendChild(tbody);
      tableContainer.appendChild(table);
      window.historyList.appendChild(tableContainer);
    })
    .catch(err => {
      console.error('Error loading conversations for history list:', err);
      window.historyList.innerHTML = '<div class="history-error">Error loading conversation history.</div>';
    });
};

// Helper function to render conversation messages
function renderConversationMessages(convo, imageCache) {
  if (!window.appendMessage || !window.chatBox) return;
  
  // Helper: Replace image placeholders in content with <img> or placeholder divs
  function replaceImagePlaceholders(content, convo, imageCache) {
    if (!content) return '';
    // Replace [[IMAGE: filename]] placeholders
    content = content.replace(/\[\[IMAGE: ([^\]]+)\]\]/g, (match, filename) => {
      filename = filename.trim();
      // Find image in convo.images
      const img = (convo.images || []).find(img => img.filename === filename);
      if (img) {
        let src = '';
        if (img.url && img.url.startsWith('data:image')) {
          src = img.url;
        } else if (img.isStoredInDb && imageCache && imageCache.has(filename)) {
          src = imageCache.get(filename);
        }
        if (src) {
          // Return inline image tag
          return `<img src="${src}" alt="${img.prompt || 'Generated Image'}" class="generated-image-thumbnail" data-filename="${filename}" data-prompt="${img.prompt || ''}" data-timestamp="${img.timestamp || ''}" style="max-width:160px;max-height:160px;border-radius:8px;margin:8px 0;cursor:pointer;" />`;
        }
      }
      // If not found, return a placeholder div
      return `<div class='image-placeholder' style='padding:40px;background:#f1f1f1;border-radius:8px;margin:8px 0;text-align:center;font-style:italic;color:#666;'>Image could not be loaded: ${filename}</div>`;    });
    return content;
  }

  // Render all messages in the conversation
  convo.messages.forEach((msg) => {
    if (msg.role === 'system') {
      // Skip system messages in UI
      return;
    }
    if (msg.role === 'user') {
      const processed = replaceImagePlaceholders(msg.content, convo, imageCache);
      const userElement = window.appendMessage('You', processed, 'user', true);
      // Ensure we have the proper message ID and add copy button
      if (userElement && typeof window.addMessageCopyButton === 'function') {
        const messageId = msg.id || userElement.id;
        if (msg.id) {
          userElement.id = msg.id;
        }
        window.addMessageCopyButton(userElement, messageId);
      }
    } else if (msg.role === 'assistant') {
      const messageElement = document.createElement('div');
      messageElement.classList.add('message', 'assistant');
      const messageId = msg.id || ('msg-history-' + Date.now());
      messageElement.id = messageId;
      const sender = document.createElement('div');
      sender.className = 'message-sender';
      sender.innerHTML = `
        <svg class="sender-icon assistant-icon" width="24" height="24" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g stroke="var(--accent-color)" stroke-width="1"></g>
        </svg>
      `;
      
      // Call generateNonagonLogo to populate the g element
      const originalSelector = document.querySelector;
      document.querySelector = function(selector) {
        if (selector === '#tyumi-logo g') {
          return sender.querySelector('g');
        }
        return originalSelector.call(document, selector);
      };
      
      if (typeof generateNonagonLogo === 'function') {
        generateNonagonLogo();
      }
      
      // Restore original querySelector
      document.querySelector = originalSelector;
      messageElement.appendChild(sender);      
      const contentWrapper = document.createElement('div');
      contentWrapper.className = 'message-content';
      messageElement.appendChild(contentWrapper);
      window.chatBox.appendChild(messageElement);
        // Extract associated images from content and create a container for them
      let displayContent = msg.content || '';
      const imageFilenames = [];
      const seenFilenames = new Set(); // Track seen filenames to prevent duplicates
      
      // Extract image filenames from content
      // Don't remove the placeholders, just wrap them in hidden spans
      // Using a new instance of RegExp for extraction to avoid state issues
      const extractRegex = new RegExp("\\[\\[IMAGE: ([^\\]]+)\\]\\]", "g");
      let match;
      while ((match = extractRegex.exec(displayContent)) !== null) {
        const trimmedFilename = match[1].trim();
        // Only add each filename once
        if (!seenFilenames.has(trimmedFilename)) {
          seenFilenames.add(trimmedFilename);
          imageFilenames.push(trimmedFilename);
        }
      }
      
      // Wrap the placeholders in hidden spans instead of removing them
      // Using a separate RegExp instance for replacement
      displayContent = displayContent.replace(new RegExp("\\[\\[IMAGE: ([^\\]]+)\\]\\]", "g"), (match, filename) => {
        return `<span class="hidden-image-placeholder">${match}</span>`;
      });
      
      // If we found image placeholders, add them at the top
      if (imageFilenames.length > 0) {
        const imagesContainer = document.createElement('div');
        imagesContainer.className = 'generated-images';
        
        // Create HTML for each image
        const imgHtmlArray = [];
        
        imageFilenames.forEach(filename => {
          // Find image in convo.images
          const img = (convo.images || []).find(img => img.filename === filename);
          if (img) {
            let src = '';
            if (img.url && img.url.startsWith('data:image')) {
              src = img.url;
            } else if (img.isStoredInDb && imageCache && imageCache.has(filename)) {
              src = imageCache.get(filename);
            }
            
            if (src) {
              const imgEl = document.createElement('img');
              imgEl.src = src;
              imgEl.alt = img.prompt || 'Generated Image';
              imgEl.className = 'generated-image-thumbnail';
              imgEl.dataset.filename = filename;
              imgEl.dataset.messageId = messageElement.id;
              imgEl.dataset.prompt = img.prompt || '';
              imgEl.dataset.timestamp = img.timestamp || '';
              imagesContainer.appendChild(imgEl);
              
              // Store HTML for message images array
              imgHtmlArray.push(imgEl.outerHTML);
            } else {
              // Create placeholder for missing image
              const placeholder = document.createElement('div');
              placeholder.className = 'image-placeholder';
              placeholder.textContent = `Image could not be loaded: ${filename}`;
              imagesContainer.appendChild(placeholder);
            }
          }
        });
        
        // Add container at the top of the message
        if (imagesContainer.childNodes.length > 0) {
          contentWrapper.appendChild(imagesContainer);
          
          // Store these images with this specific message ID for future reference
          // This matches what streaming.js does with live chat images
          if (!window.messageImages) window.messageImages = {};
          window.messageImages[messageElement.id] = imgHtmlArray;
        }
      }
      
      // Reasoning
      const reasoning = msg.reasoning || '';
      const contentObj = { content: displayContent, reasoning };
      window.updateMessageContent(messageElement, contentObj);
      window.highlightAndAddCopyButtons(messageElement);
      
      // Add copy button to the message
      if (typeof window.addMessageCopyButton === 'function') {
        window.addMessageCopyButton(messageElement, messageId);
      }
      
      if (window.setupImageInteractions) {
        window.setupImageInteractions(contentWrapper);
      }
    }
  });
  
  // Restore the system prompt type and content
  if (convo.systemPrompt) {
    const systemPrompt = convo.systemPrompt;
    window.loadedSystemPrompt = systemPrompt; // Store loaded system prompt
    
    // Set the appropriate radio button
    if (systemPrompt.type === 'personality' && window.personalityPromptRadio) {
      window.personalityPromptRadio.checked = true;
      if (window.personalityInput) {
        window.personalityInput.value = systemPrompt.content || '';
        window.personalityInput.setAttribute('data-explicitly-set', 'true');
      }
    } else if (systemPrompt.type === 'custom' && window.customPromptRadio) {
      window.customPromptRadio.checked = true;
      if (window.systemPromptCustom) {
        window.systemPromptCustom.value = systemPrompt.content || '';
      }
    } else if (systemPrompt.type === 'none' && window.noPromptRadio) {
      window.noPromptRadio.checked = true;
    }
    
    // Update prompt visibility based on the selected type
    if (window.updatePromptVisibility) {
      window.updatePromptVisibility();
    }
  }
  
  // Select the service first so that available models are populated correctly
  let servicePromise = Promise.resolve();
  if (convo.service && window.serviceSelector && window.config) {
    const serviceOption = Array.from(window.serviceSelector.options).find(
      option => option.value === convo.service
    );
    if (serviceOption) {
      window.config.defaultService = convo.service;
      window.serviceSelector.value = convo.service;

      if (
        convo.service === 'ollama' &&
        window.config.services.ollama &&
        typeof window.config.services.ollama.fetchAndUpdateModels === 'function'
      ) {
        servicePromise = window.config.services.ollama
          .fetchAndUpdateModels()
          .catch(err => {
            console.error('Failed to refresh Ollama models:', err);
          })
          .then(() => {
            window.updateModelSelector();
          });
      } else {
        window.updateModelSelector();
      }
    }
  } else {
    window.updateModelSelector();
  }

  servicePromise.then(() => {
    if (convo.model && window.modelSelector) {
      const modelOption = Array.from(window.modelSelector.options).find(
        option => option.value === convo.model
      );
      if (modelOption) {
        window.modelSelector.value = convo.model;
      }
    }

    if (window.updateHeaderInfo) {
      window.updateHeaderInfo();
    }
  });

  // If a new conversation is started, ensure the system prompt is not from a loaded conversation
  if (!convo.id) {
    window.loadedSystemPrompt = null;
  }
}