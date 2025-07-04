/**
 * Theme management functions for the AI Assistant
 */

// Initialize theme variables
window.themeSelector = null;
window.currentTheme = 'theme-super-dark'; // Default theme

// Theme categories - will be populated dynamically from CSS files
let themeCategories = {};

/**
 * Extract theme names from CSS files
 */
async function extractThemesFromCSS() {
  const categories = {
    'Dark Themes': [],
    'Light Themes': [],
    'Metal Themes': [],
    'Neon Themes': [],
    'Country Themes': [],
    'Special Themes': []
  };

  const themeFiles = {
    'Dark Themes': '/src/css/themes/base/dark.css',
    'Light Themes': '/src/css/themes/base/light.css',
    'Metal Themes': '/src/css/themes/base/metal.css',
    'Neon Themes': '/src/css/themes/base/neon.css',
    'Country Themes': '/src/css/themes/base/country.css',
    'Special Themes': '/src/css/themes/base/special.css'
  };

  for (const [category, filePath] of Object.entries(themeFiles)) {
    try {
      const response = await fetch(filePath);
      const cssContent = await response.text();
      
      // Extract theme class names using regex
      const themeMatches = cssContent.match(/^\.theme-[a-zA-Z0-9-]+(?=\s*\{)/gm);
      if (themeMatches) {
        const themes = themeMatches
          .map(match => match.substring(1)) // Remove the leading dot
          .filter((theme, index, arr) => arr.indexOf(theme) === index)
          .filter(theme => theme !== 'theme-teletext'); // Exclude teletext theme from selector

        categories[category] = themes;
      }
    } catch (error) {
      console.error(`Failed to load themes from ${filePath}:`, error);
    }
  }

  return categories;
}

// Special cases for theme display names
const themeNameOverrides = {
  'theme-usa': 'USA',
  'theme-uk': 'United Kingdom'
};

/**
 * Convert theme ID to display name
 * @param {string} themeId - The theme ID (e.g., 'theme-dark-red')
 * @returns {string} - The display name (e.g., 'Dark Red')
 */
function getThemeDisplayName(themeId) {
  // Check for overrides first
  if (themeNameOverrides[themeId]) {
    return themeNameOverrides[themeId];
  }
  
  // Remove 'theme-' prefix and convert to title case
  return themeId
    .replace('theme-', '')
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Generate flat array of theme classes for validation
function getThemeClasses() {
  return Object.values(themeCategories).flat();
}

/**
 * Populate the theme selector with organized optgroups
 */
async function populateThemeSelector() {
  const themeSelector = document.getElementById('theme-selector');
  if (!themeSelector) {
    console.error('Theme selector not found');
    return;
  }

  // Extract themes from CSS files if not already loaded
  if (Object.keys(themeCategories).length === 0) {
    themeCategories = await extractThemesFromCSS();
  }

  // Clear existing options
  themeSelector.innerHTML = '';

  // Create optgroups and options
  Object.entries(themeCategories).forEach(([categoryName, themes]) => {
    if (themes.length === 0) return; // Skip empty categories
    
    const optgroup = document.createElement('optgroup');
    optgroup.label = categoryName;

    themes.forEach(themeId => {
      const option = document.createElement('option');
      option.value = themeId;
      option.textContent = getThemeDisplayName(themeId);
      optgroup.appendChild(option);
    });

    themeSelector.appendChild(optgroup);
  });
}

/**
 * Initialize theme functionality
 */
window.initTheme = async function() {
  // Extract themes from CSS files first
  themeCategories = await extractThemesFromCSS();
  
  // Populate the theme selector
  await populateThemeSelector();
  
  // Get theme selector
  window.themeSelector = document.getElementById('theme-selector');
  
  if (!window.themeSelector) {
    console.error('Theme selector not found');
    return;
  }
  
  // Load saved theme if it exists
  const savedTheme = localStorage.getItem('selectedTheme');
  if (savedTheme) {
    window.currentTheme = savedTheme;
    window.themeSelector.value = savedTheme;
  }
  
  // Apply the current theme
  window.applyTheme(window.currentTheme);
  
  // Add event listener for theme changes
  window.themeSelector.addEventListener('change', function(e) {
    const newTheme = e.target.value;
    window.applyTheme(newTheme);
    window.currentTheme = newTheme;
    localStorage.setItem('selectedTheme', newTheme);
  });
};

/**
 * Apply a theme to the document
 * @param {string} themeName - The name/class of the theme to apply
 */
window.applyTheme = function(themeName) {
  // Remove all theme classes from body
  document.body.classList.remove(...getThemeClasses());
  
  // Add the selected theme class
  document.body.classList.add(themeName);
  
  // Save the selected theme to localStorage
  localStorage.setItem('selectedTheme', themeName);
  
  // Update the theme selector dropdown
  document.getElementById('theme-selector').value = themeName;
  
  // Update code highlighting to match the theme
  window.updateCodeHighlighting(themeName);
  
  // Update preview dots in settings if visible
  window.updateThemePreview();
};

/**
 * Rehighlight all code blocks to apply the current theme styling
 */
window.rehighlightCodeBlocks = function() {
  try {
    // Check if highlight.js is loaded
    if (window.hljs || typeof hljs !== 'undefined') {
      const codeBlocks = document.querySelectorAll('pre code');
      
      if (codeBlocks && codeBlocks.length > 0) {
        console.log(`Rehighlighting ${codeBlocks.length} code blocks with current theme`);
        
        // Configure highlight.js to ignore unescaped HTML for security
        hljs.configure({ 
          ignoreUnescapedHTML: true
        });
        
        codeBlocks.forEach(function(codeBlock) {
          try {
            // Store original content if not already stored
            if (!codeBlock.hasAttribute('data-original-code')) {
              codeBlock.setAttribute('data-original-code', codeBlock.textContent);
            }
            
            // Apply highlighting
            hljs.highlightElement(codeBlock);
            
            // Add code-block class to parent for styling
            if (codeBlock.parentElement && !codeBlock.parentElement.classList.contains('code-block')) {
              codeBlock.parentElement.classList.add('code-block');
            }
          } catch (error) {
            console.error('Error highlighting code block:', error);
          }
        });
      } else {
        console.log('No code blocks found to rehighlight');
      }
    } else {
      console.log('Highlight.js not loaded, attempting to load it');
      // Try to load highlight.js
      if (typeof loadHighlightJS === 'function') {
        loadHighlightJS().then(function() {
          // Try again after loading
          console.log('Highlight.js loaded, retrying rehighlight');
          window.rehighlightCodeBlocks();
        }).catch(function(error) {
          console.error('Failed to load highlight.js:', error);
        });
      } else if (typeof window.loadHighlightJS === 'function') {
        window.loadHighlightJS().then(function() {
          // Try again after loading
          window.rehighlightCodeBlocks();
        }).catch(function(error) {
          console.error('Failed to load highlight.js:', error);
        });
      } else {
        console.error('loadHighlightJS function not available');
      }
    }
  } catch (error) {
    console.error('Error in rehighlightCodeBlocks:', error);
  }
};

/**
 * Update the theme preview dots in the settings panel
 */
window.updateThemePreview = function() {
  // Update color dots to reflect current theme
  const colorDots = document.querySelectorAll('.color-dot');
  if (colorDots && colorDots.length > 0) {
    colorDots[0].style.backgroundColor = 'var(--bg-primary)';
    colorDots[1].style.backgroundColor = 'var(--bg-secondary)';
    colorDots[2].style.backgroundColor = 'var(--text-primary)';
    colorDots[3].style.backgroundColor = 'var(--accent-color)';
    colorDots[4].style.backgroundColor = 'var(--user-bg)';
  }
};

function updateCodeHighlighting(themeName) {
  // Find all pre code blocks and update their classes to match the theme
  const codeBlocks = document.querySelectorAll('pre code');
  codeBlocks.forEach(block => {
    // Preserve the language class
    const languageClass = Array.from(block.classList).find(cls => cls.startsWith('language-'));
    
    // Remove all theme-related classes
    block.className = languageClass || '';
    
    // Add theme-specific styling
    if (themeName === 'theme-minimal-light' || themeName === 'theme-minimal-dark') {
      block.classList.add('hljs');
    }
  });
  
  // Re-highlight code blocks
  if (window.hljs) {
    window.hljs.highlightAll();
  }
}

/**
 * Initializes theme based on localStorage or default
 */
window.initializeTheme = function() {
  const savedTheme = localStorage.getItem('selectedTheme') || 'theme-dark-gray';
  document.body.className = savedTheme;
  
  // Set the theme selector to the saved theme
  if (window.themeSelector) {
    window.themeSelector.value = savedTheme;
  }
  
  // Initialize any theme-specific TTS UI elements
  if (window.ttsConfig) {
    const toggleSwitch = document.querySelector('.toggle-switch');
    if (toggleSwitch) {
      toggleSwitch.style.backgroundColor = window.ttsConfig.enabled ? 
        'var(--accent-color)' : 'var(--bg-secondary)';
    }
  }
};

// Add theme initialization to window load event
window.addEventListener('DOMContentLoaded', function() {
  // Wait a moment to ensure all resources are loaded
  setTimeout(function() {
    window.initTheme();
  }, 100);
}); 