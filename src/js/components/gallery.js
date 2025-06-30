/**
 * Image Gallery functionality for the chatbot application
 * Provides functions for displaying and managing stored images from IndexedDB
 */

// -----------------------------------------------------
// Gallery functionality
// -----------------------------------------------------

// Global flag to track if slideshow is open
window.isSlideshowOpen = false;

/**
 * Initialize the gallery functionality
 */
window.initGallery = function() {
    // Add event listeners for gallery controls
    const galleryButton = document.getElementById('gallery-button');
    const closeGallery = document.querySelector('.close-gallery');
    const galleryPanel = document.getElementById('gallery-panel');
    const bulkDeleteBtn = document.getElementById('bulk-delete-images');
    const refreshGalleryBtn = document.getElementById('refresh-gallery');
    
    if (!galleryButton || !galleryPanel || !closeGallery) {
        console.error('Gallery elements not found in the DOM');
        return;
    }
    
    // Keep track of whether images have been loaded
    window.galleryImagesLoaded = false;
      // Toggle gallery visibility when the gallery button is clicked
    galleryButton.addEventListener('click', function() {
        const isExpanded = galleryButton.getAttribute('aria-expanded') === 'true';
        galleryButton.setAttribute('aria-expanded', !isExpanded);
        galleryPanel.setAttribute('aria-hidden', isExpanded);
        
        if (!isExpanded) {
            galleryPanel.removeAttribute('inert'); // Ensure panel is not inert when opened
            window.showGalleryPlaceholders();
            
            // Then load the actual images asynchronously
            setTimeout(() => {
                window.loadGalleryImages();
            }, 50); // Small delay to ensure animation completes first
        } else {
            galleryPanel.setAttribute('inert', 'true'); // Make panel inert when closed
        }
    });
      // Close gallery when the close button is clicked
    closeGallery.addEventListener('click', function() {
        galleryPanel.setAttribute('aria-hidden', 'true');
        galleryPanel.setAttribute('inert', 'true'); // Make panel inert when closed
        galleryButton.setAttribute('aria-expanded', 'false');
        galleryButton.focus(); // Explicitly move focus
    });
    
    // Refresh gallery when the refresh button is clicked
    if (refreshGalleryBtn) {
        refreshGalleryBtn.addEventListener('click', function() {
            window.loadGalleryImages();
        });
    }
    
    // Handle bulk delete
    if (bulkDeleteBtn) {
        bulkDeleteBtn.addEventListener('click', function() {
            window.bulkDeleteSelectedImages();
        });
    }
    // Close panels when clicking outside
    document.addEventListener('click', function(e) {
        // Close gallery panel when clicking outside, but only if slideshow is not open
        if (!window.isSlideshowOpen && 
            galleryPanel && galleryPanel.getAttribute('aria-hidden') === 'false' &&
            !galleryPanel.contains(e.target) && e.target !== galleryButton) {
            galleryPanel.setAttribute('aria-hidden', 'true');
            galleryPanel.setAttribute('inert', 'true'); // Make panel inert when closed
            galleryButton.setAttribute('aria-expanded', 'false');
            galleryButton.focus(); // Explicitly move focus
        }
        
        // Close settings panel when clicking outside (if it exists)
        const settingsPanel = document.getElementById('settings-panel');
        const settingsButton = document.getElementById('settings-button');
        if (settingsPanel && settingsButton && settingsPanel.classList.contains('active') &&
            !settingsPanel.contains(e.target) && e.target !== settingsButton) {
            settingsPanel.classList.remove('active');
            settingsButton.setAttribute('aria-expanded', 'false');
            settingsPanel.setAttribute('aria-hidden', 'true');
            if (settingsPanel.hasAttribute('inert')) {
                settingsPanel.setAttribute('inert', 'true');
            }
            settingsButton.style.display = '';
        }
          // Close history panel when clicking outside (if it exists)
        const historyPanel = document.getElementById('history-panel');
        const historyButton = document.getElementById('history-button');
        if (historyPanel && historyButton && historyPanel.getAttribute('aria-hidden') === 'false' &&
            !historyPanel.contains(e.target) && e.target !== historyButton) {
            historyPanel.setAttribute('aria-hidden', 'true');
            historyPanel.setAttribute('inert', 'true'); // Make panel inert when closed
            historyButton.setAttribute('aria-expanded', 'false');
            historyButton.focus(); // Explicitly move focus
        }
    });
};

/**
 * Show placeholder grid while images are loading
 */
window.showGalleryPlaceholders = function() {
    const galleryGrid = document.getElementById('gallery-grid');
    if (!galleryGrid) return;
    
    // Create 8 placeholder items (or adjust based on typical gallery size)
    galleryGrid.innerHTML = '';
    const count = window.galleryImages && window.galleryImages.length > 0 ? 
        window.galleryImages.length : 8;
    
    // Show count from last load
    const galleryCount = document.getElementById('gallery-count');
    if (galleryCount && window.galleryImages) {
        galleryCount.textContent = window.galleryImages.length || '...';
    } else if (galleryCount) {
        galleryCount.textContent = '...';
    }
    
    for (let i = 0; i < count; i++) {
        const placeholder = document.createElement('div');
        placeholder.className = 'gallery-item gallery-placeholder';
        placeholder.innerHTML = `
            <div class="gallery-item-image-container placeholder-pulse"></div>
            <div class="gallery-item-footer">
                <div class="truncated-prompt placeholder-pulse" style="width: 60px; height: 12px;"></div>
                <div class="gallery-actions">
                    <div class="placeholder-pulse" style="width: 20px; height: 20px; border-radius: 4px;"></div>
                    <div class="placeholder-pulse" style="width: 20px; height: 20px; border-radius: 4px;"></div>
                </div>
            </div>
        `;
        galleryGrid.appendChild(placeholder);
    }
};

/**
 * Load images from IndexedDB and display them in the gallery
 */
window.loadGalleryImages = async function() {
    const galleryGrid = document.getElementById('gallery-grid');
    if (!galleryGrid) return;
    
    try {
        // Get all image keys from IndexedDB
        const images = await window.getAllImagesFromDb();
        
        if (!images || images.length === 0) {
            galleryGrid.innerHTML = '<div class="gallery-empty">No images found in gallery</div>';
            return;
        }
        
        // Sort images by timestamp, newest first
        images.sort((a, b) => {
            const dateA = a.timestamp ? new Date(a.timestamp) : new Date(0);
            const dateB = b.timestamp ? new Date(b.timestamp) : new Date(0);
            return dateB - dateA;
        });
        
        // Store images globally for slideshow access
        window.galleryImages = images;
        window.galleryImagesLoaded = true;
        
        // Clear placeholders
        galleryGrid.innerHTML = '';
        
        // Update gallery count
        const galleryCount = document.getElementById('gallery-count');
        if (galleryCount) {
            galleryCount.textContent = images.length;
        }
        
        // Process images in batches to not block the UI
        const batchSize = 10;
        
        function processBatch(startIndex) {
            const endIndex = Math.min(startIndex + batchSize, images.length);
            
            for (let i = startIndex; i < endIndex; i++) {
                const image = images[i];
                
                // Create gallery item
                const galleryItem = document.createElement('div');
                galleryItem.className = 'gallery-item';
                galleryItem.dataset.filename = image.filename;
                galleryItem.dataset.index = i;
                
                // Create selection bar at the top
                const selectionBar = document.createElement('div');
                selectionBar.className = 'gallery-selection-bar';
                
                // Create image container
                const imageContainer = document.createElement('div');
                imageContainer.className = 'gallery-item-image-container';
                
                // Create image element with lazy loading
                const img = document.createElement('img');
                img.loading = 'lazy';
                img.src = image.data;
                img.alt = image.prompt || 'Generated image';
                img.title = image.prompt || '';
                imageContainer.appendChild(img);
                
                // Create checkbox for selection
                const selectContainer = document.createElement('label');
                selectContainer.className = 'gallery-select-container';
                selectContainer.innerHTML = `
                    <input type="checkbox" class="gallery-select-checkbox">
                    <span>Select</span>
                `;
                selectionBar.appendChild(selectContainer);
                
                // Create footer with actions
                const itemFooter = document.createElement('div');
                itemFooter.className = 'gallery-item-footer';
                
                // Format date for tooltip
                const date = image.timestamp 
                    ? new Date(image.timestamp).toLocaleDateString() + ' ' + new Date(image.timestamp).toLocaleTimeString() 
                    : 'Unknown date';
                    
                // Create actions container
                const actions = document.createElement('div');
                actions.className = 'gallery-actions';
                actions.innerHTML = `
                    <button class="gallery-download-btn" title="Download image">
                        <img src="/src/assets/img/icons/download.svg" width="16" height="16" alt="download">
                    </button>
                    <button class="gallery-delete-btn" title="Delete image">
                        <img src="/src/assets/img/icons/trash.svg" width="16" height="16" alt="delete">
                    </button>
                `;
                
                // Add event listeners to buttons
                const deleteBtn = actions.querySelector('.gallery-delete-btn');
                deleteBtn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    if (confirm('Delete this image?')) {
                        window.deleteImageAndUpdateGallery(image.filename);
                    }
                });
                
                const downloadBtn = actions.querySelector('.gallery-download-btn');
                downloadBtn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    window.downloadGalleryImage(image.data, image.filename);
                });
                
                // Add prompt truncated text (first few words)
                const truncatedPrompt = document.createElement('div');
                truncatedPrompt.className = 'truncated-prompt';
                truncatedPrompt.title = image.prompt || 'No prompt data';
                truncatedPrompt.textContent = image.prompt ? 
                    (image.prompt.length > 50 ? image.prompt.substring(0, 50) + '...' : image.prompt) : 
                    'No prompt';
                
                itemFooter.appendChild(truncatedPrompt);
                itemFooter.appendChild(actions);
                
                // Stop propagation for checkbox to prevent triggering slideshow
                const checkbox = selectContainer.querySelector('.gallery-select-checkbox');
                if (checkbox) {
                    checkbox.addEventListener('click', function(e) {
                        e.stopPropagation();
                    });
                    
                    // Also prevent propagation from the label
                    selectContainer.addEventListener('click', function(e) {
                        e.stopPropagation();
                    });
                }
                
                // Add click event to show slideshow starting with this image
                galleryItem.addEventListener('click', function() {
                    window.startGallerySlideshow(i);
                });
                
                // Append all elements to gallery item in the correct order
                galleryItem.appendChild(selectionBar);
                galleryItem.appendChild(imageContainer);
                galleryItem.appendChild(itemFooter);
                
                // Add the complete item to the grid
                galleryGrid.appendChild(galleryItem);
            }
            
            // Process next batch if needed
            if (endIndex < images.length) {
                setTimeout(() => processBatch(endIndex), 0);
            }
        }
        
        // Start processing the first batch
        processBatch(0);
        
    } catch (error) {
        console.error('Error loading gallery images:', error);
        galleryGrid.innerHTML = '<div class="gallery-error">Error loading images from storage</div>';
    }
};

/**
 * Get all images from IndexedDB
 * @returns {Promise<Array>} Promise resolving to an array of image objects
 */
window.getAllImagesFromDb = function() {
    return new Promise((resolve, reject) => {
        if (!window.imageDb) {
            window.initImageDb()
                .then(() => window.getAllImagesFromDb())
                .then(resolve)
                .catch(reject);
            return;
        }          const images = [];
        const transaction = window.imageDb.transaction([IMAGE_STORE_NAME], 'readonly');
        const store = transaction.objectStore(IMAGE_STORE_NAME);
        
        const request = store.openCursor();
        
        request.onerror = (event) => {
            reject(event.target.error);
        };
        
        request.onsuccess = (event) => {
            const cursor = event.target.result;
            if (cursor) {
                images.push(cursor.value);
                cursor.continue();
            } else {
                resolve(images);
            }
        };
    });
};

/**
 * Delete an image from IndexedDB and remove it from the gallery
 * @param {string} filename - The filename of the image to delete
 */
window.deleteImageAndUpdateGallery = async function(filename) {
    try {
        await window.deleteImageFromDb(filename);
        
        // Remove the image element from the gallery
        const galleryItem = document.querySelector(`.gallery-item[data-filename="${filename}"]`);
        if (galleryItem) {
            galleryItem.remove();
            
            // Update gallery count
            const galleryCount = document.getElementById('gallery-count');
            if (galleryCount) {
                const currentCount = parseInt(galleryCount.textContent);
                galleryCount.textContent = currentCount - 1;
            }
            
            // Show empty message if no more images
            const galleryGrid = document.getElementById('gallery-grid');
            if (galleryGrid && galleryGrid.children.length === 0) {
                galleryGrid.innerHTML = '<div class="gallery-empty">No images found in gallery</div>';
            }
        }
    } catch (error) {
        console.error('Error deleting image:', error);
        alert('Failed to delete the image. Please try again.');
    }
};

/**
 * Download a gallery image
 * @param {string} imageData - Base64 image data
 * @param {string} filename - The filename to save as
 */
window.downloadGalleryImage = function(imageData, filename) {
    const a = document.createElement('a');
    a.href = imageData;
    a.download = filename || 'image.png';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
};

/**
 * Start the gallery slideshow from a specific index
 * @param {number} startIndex - The index to start from
 */
window.startGallerySlideshow = function(startIndex) {
  if (!window.galleryImages || window.galleryImages.length === 0) {
    console.error('No images available for slideshow');
    return;
  }
  
  // Use the shared slideshow function, passing gallery mode as true
  window.createImageSlideshow(window.galleryImages, startIndex, true);
};

/**
 * Show a full-size view of an image
 * @param {string} imageUrl - The image URL or base64 data
 * @param {Object} imageData - The image metadata
 */
window.showFullSizeImage = function(imageUrl, imageData) {
    // Find the image index in gallery images
    const index = window.galleryImages.findIndex(img => img.filename === imageData.filename);
    if (index !== -1) {
        window.startGallerySlideshow(index);
    } else {
        // If image not found in gallery, add it temporarily and show
        const tempImage = {
            data: imageUrl,
            filename: imageData.filename,
            prompt: imageData.prompt,
            timestamp: imageData.timestamp
        };
        
        if (!window.galleryImages) {
            window.galleryImages = [];
        }
        
        window.galleryImages.push(tempImage);
        window.startGallerySlideshow(window.galleryImages.length - 1);
    }
};

/**
 * Bulk delete selected images
 */
window.bulkDeleteSelectedImages = async function() {
    const selectedCheckboxes = document.querySelectorAll('.gallery-select-checkbox:checked');
    
    if (selectedCheckboxes.length === 0) {
        alert('No images selected');
        return;
    }
    
    if (!confirm(`Delete ${selectedCheckboxes.length} selected images?`)) {
        return;
    }
    
    // Show loading indicator
    const galleryGrid = document.getElementById('gallery-grid');
    const loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'bulk-delete-indicator';
    loadingIndicator.textContent = `Deleting ${selectedCheckboxes.length} images...`;
    
    if (galleryGrid) {
        galleryGrid.classList.add('deleting-images');
        galleryGrid.appendChild(loadingIndicator);
    }
    
    try {
        const deletePromises = [];
        
        selectedCheckboxes.forEach(checkbox => {
            const galleryItem = checkbox.closest('.gallery-item');
            if (galleryItem) {
                const filename = galleryItem.dataset.filename;
                if (filename) {
                    deletePromises.push(window.deleteImageFromDb(filename));
                }
            }
        });
        
        await Promise.all(deletePromises);
        
        // Reload the gallery
        window.loadGalleryImages();
    } catch (error) {
        console.error('Error bulk deleting images:', error);
        alert('Some images could not be deleted. Please try again.');
        
        // Reload the gallery
        window.loadGalleryImages();
    }
};