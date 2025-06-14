/**
 * Image generation tool implementations
 */

// Ensure the toolImplementations object exists
window.toolImplementations = window.toolImplementations || {};

/**
 * Fetch a URL with retry logic
 * @param {string} url - The URL to fetch
 * @param {number} maxRetries - Maximum number of retry attempts
 * @returns {Promise<Blob>} - The response as a Blob
 */
async function fetchWithRetry(url, maxRetries = 3) {
  let lastError;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      return await response.blob();
    } catch (error) {
      lastError = error;
      console.warn(`Fetch attempt ${attempt + 1}/${maxRetries} failed: ${error.message}`);
      // Wait before retrying (exponential backoff)
      const delay = Math.min(1000 * Math.pow(2, attempt), 8000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw lastError;
}

/**
 * Convert a Blob to a base64 data URL
 * @param {Blob} blob - The Blob to convert
 * @returns {Promise<string>} - The data URL
 */
async function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Generate image using Grok API
 * @param {Object} args - Arguments for the tool
 * @returns {Promise<Object>} - The result
 */
async function grokImage(args) {
  const apiKey = window.config.services.xai.apiKey;
  
  if (!apiKey) {
    return {
      notice: 'xAI (xAI) API key not configured. Please add your xAI API key in the API Keys settings.',
      error: null
    };
  }
  
  const url = "https://api.x.ai/v1/images/generations";
  const headers = { "Authorization": `Bearer ${apiKey}` };
  const payload = { 
    model: "grok-2-image-latest", 
    prompt: args.prompt,
    response_format: "b64_json" // Request base64 directly instead of URL
  };
  
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    
    if (!res.ok) throw new Error(`Grok API error: ${res.status}`);
    const data = await res.json();
    
    // Check if response contains base64 data directly
    if (data.data && data.data[0] && data.data[0].b64_json) {
      const b64 = data.data[0].b64_json;
      const dataUrl = `data:image/png;base64,${b64}`;
      return { url: dataUrl, error: null };
    }
    // Fallback to URL if for some reason base64 isn't returned
    else if (data.data && data.data[0] && data.data[0].url) {
      console.warn("Grok API returned URL instead of base64, trying to get base64 directly");
      try {
        // Create a local data URL from the image without external proxy
        // First, create a temporary image element
        const imageUrl = data.data[0].url;
        const imgBlob = await fetchWithRetry(imageUrl, 3);
        const base64 = await blobToBase64(imgBlob);
        return { url: base64, error: null };
      } catch (error) {
        console.error("Error converting image to base64:", error);
        throw error;
      }
    } else {
      throw new Error("No image data in Grok API response");
    }
  } catch (error) {
    return { url: null, error: error.message };
  }
}

/**
 * Generate image using Gemini API
 * @param {Object} args - Arguments for the tool
 * @returns {Promise<Object>} - The result
 */
async function geminiImage(args) {
  const apiKey = window.config.services.google.apiKey;
  
  if (!apiKey) {
    return {
      notice: 'Google API key not configured. Please add your Google API key in the API Keys settings.',
      error: null
    };
  }
  
  const model = "gemini-2.0-flash-preview-image-generation";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const payload = {
    contents: [{ parts: [{ text: args.prompt }] }],
    generationConfig: { responseModalities: ["TEXT", "IMAGE"] }
  };
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`Gemini API error: ${res.status}`);
    const data = await res.json();
    if (window.VERBOSE_LOGGING) console.log("Gemini API raw response:", data); // Debug log
    const parts = data.candidates[0].content.parts;
    const imagePart = parts.find(p => p.inlineData && p.inlineData.data);
    if (imagePart && imagePart.inlineData && imagePart.inlineData.data) {
      const b64 = imagePart.inlineData.data;
      const dataUrl = `data:image/png;base64,${b64}`;
      return { url: dataUrl, error: null };
    } else {
      throw new Error('No image data found in Gemini response');
    }
  } catch (error) {
    return { url: null, error: error.message };
  }
}

/**
 * Generate image using OpenAI API
 * @param {Object} args - Arguments for the tool
 * @returns {Promise<Object>} - The result
 */
async function openaiImage(args) {
  const apiKey = window.config.services.openai.apiKey;
  
  if (!apiKey) {
    return {
      notice: 'OpenAI API key not configured. Please add your OpenAI API key in the API Keys settings.',
      error: null
    };
  }
  
  const url = "https://api.openai.com/v1/images/generations";
  const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${apiKey}`
  };
  const data = {
    model: "gpt-image-1",
    prompt: args.prompt,
    n: 1,
    moderation: "low",
    quality: args.quality || "medium"
  };
  try {
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`OpenAI API error: ${res.status}`);
    const result = await res.json();
    if (result.data && result.data[0] && result.data[0].b64_json) {
      const b64 = result.data[0].b64_json;
      const dataUrl = `data:image/png;base64,${b64}`;
      return { url: dataUrl, error: null };
    } else {
      throw new Error("No image data returned from OpenAI");
    }
  } catch (error) {
    return { url: null, error: error.message };
  }
}

// Register the tool implementations
window.toolImplementations.grok_image = grokImage;
window.toolImplementations.gemini_image = geminiImage;
window.toolImplementations.openai_image = openaiImage;

/**
 * Edit image using OpenAI GPT-Image-1 API
 * @param {Object} args - Arguments for the tool
 * @returns {Promise<Object>} - The result with edited image
 */
async function openaiImageEdit(args) {
  const apiKey = window.config.services.openai.apiKey;
  
  if (!apiKey) {
    return {
      notice: 'OpenAI API key not configured. Please add your OpenAI API key in the API Keys settings.',
      error: null
    };
  }
  
  const url = "https://api.openai.com/v1/images/edits";
  const headers = {
    "Authorization": `Bearer ${apiKey}`
  };

  // Create FormData object for the multipart/form-data request
  const formData = new FormData();
  
  // For debugging
  if (window.VERBOSE_LOGGING) {
    console.log("Processing images:", args.images);
  }

  try {
    // Process images based on whether it's an array or single image
    if (Array.isArray(args.images)) {
      // Handle multiple images (up to 16 for gpt-image-1)
      for (let i = 0; i < args.images.length; i++) {
        try {
          // Get image ID from the input
          const imageId = args.images[i];
          
          if (!imageId) {
            console.warn(`Empty image reference at index ${i}, skipping`);
            continue;
          }
          
          // Get the image blob from storage
          const blob = await window.getImageBlobForUpload(imageId);
          
          // Use image[] as the field name for multiple images
          formData.append('image[]', blob, `${imageId}.png`);
          
          if (window.VERBOSE_LOGGING) {
            console.log(`Added image ${i} (${imageId}) as Blob for API upload`);
          }
        } catch (error) {
          console.warn(`Could not process image at index ${i}: ${error.message}`);
        }
      }
      
      // Check if any images were added
      if ([...formData.entries()].filter(entry => entry[0].startsWith('image[')).length === 0) {
        throw new Error('No valid images could be retrieved from storage');
      }
    } 
    // Handle single image
    else if (args.images) {
      try {
        // Get the image blob from storage
        const imageId = args.images;
        const blob = await window.getImageBlobForUpload(imageId);
        
        formData.append('image', blob, `${imageId}.png`);
        
        if (window.VERBOSE_LOGGING) {
          console.log(`Added single image (${imageId}) as Blob for API upload`);
        }
      } catch (error) {
        throw new Error(`Failed to get image from storage: ${error.message}`);
      }
    } else {
      throw new Error('No image IDs provided for editing');
    }
  } catch (error) {
    console.error('Error retrieving images from storage:', error);
    throw error;
  }
  
  // Add required prompt
  formData.append('prompt', args.prompt);
  
  // Add optional parameters if provided
  formData.append('model', 'gpt-image-1'); // Explicitly set model to gpt-image-1
  
  // Handle mask if provided
  if (args.mask) {
    try {
      // Get the mask blob from storage
      const maskBlob = await window.getImageBlobForUpload(args.mask);
      formData.append('mask', maskBlob, `${args.mask}.png`);
      
      if (window.VERBOSE_LOGGING) {
        console.log(`Added mask (${args.mask}) as Blob for API upload`);
      }
    } catch (error) {
      console.error('Error processing mask:', error);
      // Continue without the mask rather than failing the whole operation
    }
  }
  
  if (args.background) {
    formData.append('background', args.background); // transparent, opaque, or auto
  }
  
  if (args.n) {
    formData.append('n', args.n.toString());
  }
  
  if (args.quality) {
    formData.append('quality', args.quality); // high, medium, low
  }
  
  // Size parameter
  if (args.size) {
    formData.append('size', args.size);
  }
  
  // User parameter for OpenAI monitoring if available
  if (args.user) {
    formData.append('user', args.user);
  }  try {
    // Log FormData entries for debugging if verbose logging is enabled
    if (window.VERBOSE_LOGGING) {
      console.log("OpenAI Image Edit API request:", {
        url,
        prompt: args.prompt,
        formDataKeys: [...formData.keys()],
      });
      
      // Show what's in the FormData (cannot show blobs directly)
      console.log("FormData entries:");
      for (const pair of formData.entries()) {
        if (pair[1] instanceof Blob) {
          console.log(`  ${pair[0]}: Blob (size: ${pair[1].size} bytes, type: ${pair[1].type})`);
        } else {
          console.log(`  ${pair[0]}: ${pair[1]}`);
        }
      }
      
      // Check if we have all required fields
      if (![...formData.keys()].some(key => key === 'image' || key === 'image[]')) {
        console.warn("WARNING: FormData does not contain 'image' or 'image[]' field!");
      }
      if (![...formData.keys()].includes('prompt')) {
        console.warn("WARNING: FormData does not contain 'prompt' field!");
      }
      if (![...formData.keys()].includes('model')) {
        console.warn("WARNING: FormData does not contain 'model' field!");
      }
    }
    
    // Make sure Content-Type is NOT set (browser will set with proper boundary)
    // The Authorization header should be the only header we need to set
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: formData,
    });
    
    if (!res.ok) {
      let errorText;
      try {
        errorText = await res.text();
      } catch (e) {
        errorText = "Could not read error response";
      }
      
      let errorMessage = `OpenAI API error: ${res.status}`;
      try {
        // Try to parse the error as JSON
        if (errorText && errorText.trim().startsWith('{')) {
          const errorData = JSON.parse(errorText);
          if (errorData.error && errorData.error.message) {
            errorMessage = errorData.error.message;
          }
        } else if (errorText) {
          errorMessage = `${errorMessage} - ${errorText}`;
        }
      } catch (e) {
        // If parsing fails, use the raw error text
        if (errorText) errorMessage = `${errorMessage} - ${errorText}`;
      }
      
      console.error("OpenAI Image Edit API error:", errorMessage);
      throw new Error(errorMessage);
    }
      const result = await res.json();
    if (window.VERBOSE_LOGGING) console.log("OpenAI Image Edit API response:", result);
    
    // GPT-Image-1 always returns base64-encoded images
    if (result.data && result.data[0] && result.data[0].b64_json) {
      const b64 = result.data[0].b64_json;
      const dataUrl = `data:image/png;base64,${b64}`;
      
      // Generate a unique filename
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 10);
      const filename = `edited-image-${timestamp}-${randomString}.png`;
        // We'll let tools.js handle adding to the generatedImages collection and saving to IndexedDB
      // This ensures consistent handling of all image generation tools
        // Return the data URL directly, letting the tools.js handle storing the reference
      // This is important because tools.js expects a dataURL for all image generation tools
      return { url: dataUrl, error: null };
    } else {
      throw new Error("No image data returned from OpenAI");
    }
  } catch (error) {
    return { url: null, error: error.message };
  }
}

/**
 * Helper function to convert a data URL to a Blob
 * @param {string} dataURL - The data URL to convert
 * @returns {Blob} - The resulting Blob
 */
function dataURLtoBlob(dataURL) {  try {
    if (!dataURL || typeof dataURL !== 'string') {
      throw new Error('Invalid data URL: must be a non-empty string');
    }
    
    // Validate data URL format
    if (!dataURL.startsWith('data:')) {
      throw new Error('Invalid data URL format: must start with "data:"');
    }
    
    const parts = dataURL.split(';base64,');
    if (parts.length !== 2) {
      throw new Error('Invalid data URL format: missing ";base64," marker');
    }
    
    const contentType = parts[0].split(':')[1] || 'image/png'; // Default to PNG if no MIME type
    const base64Data = parts[1].trim();
    
    // Minimal validation - just make sure we have some data
    if (!base64Data) {
      throw new Error('Empty base64 data in data URL');
    }
    
    // Decode base64 - let the browser's atob function handle validation
    let raw;
    try {
      raw = window.atob(base64Data);
    } catch (e) {
      throw new Error(`Base64 decode failed: ${e.message}`);
    }
    
    const rawLength = raw.length;
    const uInt8Array = new Uint8Array(rawLength);
    
    for (let i = 0; i < rawLength; ++i) {
      uInt8Array[i] = raw.charCodeAt(i);
    }
    
    return new Blob([uInt8Array], { type: contentType });
  } catch (error) {
    console.error('Error converting data URL to Blob:', error);
    throw error;
  }
}

/**
 * Basic validation for base64 strings
 * This function is now more permissive as the browser's atob function will handle
 * the actual validation during decoding
 * @param {string} str - The string to check
 * @returns {boolean} - Whether the string looks like valid base64
 */
function isValidBase64(str) {
  return !!(str && typeof str === 'string' && str.length > 0);
}

// Register the image edit tool implementation
window.toolImplementations.openai_image_edit = openaiImageEdit;
