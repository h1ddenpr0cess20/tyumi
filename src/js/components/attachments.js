/**
 * Image upload and attachment handling
 */

window.pendingUploads = [];

window.initImageUploads = function() {
  const uploadInput = document.getElementById('image-upload');
  const uploadButton = document.getElementById('upload-button');
  const inputWrapper = document.querySelector('.input-wrapper');
  const userInput = document.getElementById('user-input');
  
  if (!uploadInput || !uploadButton || !inputWrapper || !userInput) return;

  uploadButton.addEventListener('click', () => uploadInput.click());
  uploadInput.addEventListener('change', async (e) => {
    const files = Array.from(e.target.files || []);
    await handleFiles(files);
    uploadInput.value = '';
  });

  // Drag and drop functionality
  setupDragAndDrop(inputWrapper);
  
  // Paste functionality
  setupPasteHandler(userInput);
};

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Handle files from various sources (upload, drag/drop, paste)
 */
async function handleFiles(files) {
  if (files.length === 0) return;
  
  // Reset pending uploads
  window.pendingUploads = [];
  
  for (const file of files) {
    if (!file.type.startsWith('image/')) continue;
    const dataUrl = await readFileAsDataURL(file);
    window.pendingUploads.push({ file, dataUrl });
  }
  
  if (typeof window.showPendingUploadPreviews === 'function') {
    window.showPendingUploadPreviews();
  }
}

/**
 * Setup drag and drop functionality for the input wrapper
 */
function setupDragAndDrop(inputWrapper) {
  let dragTimeout = null;

  // Prevent default drag behaviors on both wrapper and document
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    inputWrapper.addEventListener(eventName, preventDefaults, false);
    document.body.addEventListener(eventName, preventDefaults, false);
  });

  // Show drag-over state when dragging over the wrapper
  inputWrapper.addEventListener('dragenter', handleDragEnter, false);
  inputWrapper.addEventListener('dragover', handleDragOver, false);
  
  // Hide drag-over state when leaving wrapper or dropping
  inputWrapper.addEventListener('dragleave', handleDragLeave, false);
  inputWrapper.addEventListener('drop', handleDrop, false);

  // Global cleanup when drag operation ends
  document.addEventListener('dragend', cleanupDragState, false);

  function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  function handleDragEnter(e) {
    // Clear any existing timeout
    if (dragTimeout) {
      clearTimeout(dragTimeout);
      dragTimeout = null;
    }
    
    // Only activate if dragging files
    if (e.dataTransfer && e.dataTransfer.types.includes('Files')) {
      inputWrapper.classList.add('drag-over');
    }
  }

  function handleDragOver(e) {
    // Clear any existing timeout
    if (dragTimeout) {
      clearTimeout(dragTimeout);
      dragTimeout = null;
    }
    
    // Keep the drag-over state active
    if (e.dataTransfer && e.dataTransfer.types.includes('Files')) {
      inputWrapper.classList.add('drag-over');
    }
  }

  function handleDragLeave(e) {
    // Use a small timeout to prevent flickering when moving between child elements
    if (dragTimeout) {
      clearTimeout(dragTimeout);
    }
    
    dragTimeout = setTimeout(() => {
      // Check if we're still within the wrapper area
      const rect = inputWrapper.getBoundingClientRect();
      const isStillInside = e.clientX >= rect.left && e.clientX <= rect.right && 
                           e.clientY >= rect.top && e.clientY <= rect.bottom;
      
      if (!isStillInside) {
        inputWrapper.classList.remove('drag-over');
      }
    }, 50); // Small delay to handle rapid enter/leave events
  }

  function cleanupDragState() {
    // Clean up when drag operation ends anywhere
    if (dragTimeout) {
      clearTimeout(dragTimeout);
      dragTimeout = null;
    }
    inputWrapper.classList.remove('drag-over');
  }

  async function handleDrop(e) {
    // Clean up drag state
    if (dragTimeout) {
      clearTimeout(dragTimeout);
      dragTimeout = null;
    }
    inputWrapper.classList.remove('drag-over');
    
    const dt = e.dataTransfer;
    const files = Array.from(dt.files);
    
    // Filter for image files only
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length > 0) {
      await handleFiles(imageFiles);
    }
  }
}

/**
 * Setup paste functionality for the textarea
 */
function setupPasteHandler(userInput) {
  userInput.addEventListener('paste', async (e) => {
    const items = Array.from(e.clipboardData.items);
    const imageItems = items.filter(item => item.type.startsWith('image/'));
    
    if (imageItems.length > 0) {
      e.preventDefault(); // Prevent default paste behavior for images
      
      const files = [];
      for (const item of imageItems) {
        const file = item.getAsFile();
        if (file) {
          files.push(file);
        }
      }
      
      if (files.length > 0) {
        await handleFiles(files);
      }
    }
  });
}

window.showPendingUploadPreviews = function() {
  const wrapper = document.querySelector('.input-wrapper');
  if (!wrapper) return;
  let preview = wrapper.querySelector('.upload-previews');
  if (!preview) {
    preview = document.createElement('div');
    preview.className = 'upload-previews';
    wrapper.insertBefore(preview, wrapper.firstChild);
  }
  preview.innerHTML = '';
  window.pendingUploads.forEach((up, index) => {
    const container = document.createElement('div');
    container.className = 'upload-preview-container';
    
    const img = document.createElement('img');
    img.src = up.dataUrl;
    img.alt = 'Upload preview';
    img.className = 'upload-preview-img';
    
    const removeBtn = document.createElement('button');
    removeBtn.className = 'upload-preview-remove';
    removeBtn.innerHTML = '×';
    removeBtn.title = 'Remove image';
    removeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      removeUploadPreview(index);
    });
    
    container.appendChild(img);
    container.appendChild(removeBtn);
    preview.appendChild(container);
  });
};

/**
 * Remove an image from pending uploads by index
 */
function removeUploadPreview(index) {
  if (index >= 0 && index < window.pendingUploads.length) {
    window.pendingUploads.splice(index, 1);
    window.showPendingUploadPreviews();
  }
}

