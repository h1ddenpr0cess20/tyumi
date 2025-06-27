/**
 * Global Tooltip System
 * Provides tooltip functionality that appears on the top layer
 */

// Global tooltip instance
let tooltipElement = null;
let tooltipTimeout = null;
const TOOLTIP_DELAY = 500; // 500ms delay before showing tooltip

/**
 * Initialize the tooltip system
 */
function initTooltipSystem() {
  // Create the tooltip element if it doesn't exist
  if (!tooltipElement) {
    tooltipElement = document.createElement('div');
    tooltipElement.className = 'tooltip';
    document.body.appendChild(tooltipElement);
  }
  
  // Add event listeners to document for tooltip triggers
  document.addEventListener('mouseenter', handleTooltipMouseEnter, true);
  document.addEventListener('mouseleave', handleTooltipMouseLeave, true);
  document.addEventListener('scroll', hideTooltip, true);
  window.addEventListener('resize', hideTooltip);
  
  // Add touch event listeners for mobile devices
  document.addEventListener('touchstart', handleTooltipTouchStart, true);
  document.addEventListener('touchend', handleTooltipTouchEnd, true);
  
  // Add touch event listener to hide tooltips when touching outside
  document.addEventListener('touchstart', (event) => {
    // If touching outside a help icon and a tooltip is visible, hide it
    if (tooltipElement && tooltipElement.classList.contains('visible')) {
      if (!event.target.classList.contains('tool-help-icon')) {
        hideTooltip();
      }
    }
  }, { passive: true });
}

/**
 * Handle mouse enter events for elements with tooltips
 */
function handleTooltipMouseEnter(event) {
  // Check if event.target is an element node and has closest method
  if (!event.target || event.target.nodeType !== Node.ELEMENT_NODE || typeof event.target.closest !== 'function') {
    return;
  }
  
  // For tool help icons, only show on desktop (not mobile)
  if (event.target.classList.contains('tool-help-icon')) {
    // Check if this is a mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                     window.innerWidth <= 768;
    
    if (isMobile) {
      return; // Don't show tooltip on hover for mobile devices
    }
  }
  
  const element = event.target.closest('[data-tooltip]');
  if (!element) return;
  
  const tooltipText = element.getAttribute('data-tooltip');
  if (!tooltipText) return;
  
  // Clear any existing timeout
  if (tooltipTimeout) {
    clearTimeout(tooltipTimeout);
  }
  
  // Show tooltip after delay
  tooltipTimeout = setTimeout(() => {
    showTooltip(element, tooltipText);
  }, TOOLTIP_DELAY);
}

/**
 * Handle mouse leave events for elements with tooltips
 */
function handleTooltipMouseLeave(event) {
  // Check if event.target is an element node and has closest method
  if (!event.target || event.target.nodeType !== Node.ELEMENT_NODE || typeof event.target.closest !== 'function') {
    return;
  }
  
  const element = event.target.closest('[data-tooltip]');
  if (!element) return;
  
  // Clear timeout and hide tooltip
  if (tooltipTimeout) {
    clearTimeout(tooltipTimeout);
    tooltipTimeout = null;
  }
  
  hideTooltip();
}

/**
 * Show tooltip for the given element
 */
function showTooltip(element, text) {
  if (!tooltipElement || !text) return;
  
  // Set tooltip content
  tooltipElement.textContent = text;
  
  // Add appropriate classes
  tooltipElement.className = 'tooltip';
  
  // Add special class for tool descriptions (check for both old and new styles)
  if (element.classList.contains('tool-toggle-item') || element.classList.contains('tool-help-icon')) {
    tooltipElement.classList.add('tool-description');
  }
  
  // Position tooltip
  positionTooltip(element);
  
  // Show tooltip
  tooltipElement.classList.add('visible');
}

/**
 * Hide tooltip
 */
function hideTooltip() {
  if (!tooltipElement) return;
  
  tooltipElement.classList.remove('visible');
  
  // Clear timeout if exists
  if (tooltipTimeout) {
    clearTimeout(tooltipTimeout);
    tooltipTimeout = null;
  }
}

/**
 * Position tooltip relative to the target element
 */
function positionTooltip(element) {
  if (!tooltipElement) return;
  
  // Make tooltip visible but hidden to get accurate dimensions
  tooltipElement.style.visibility = 'hidden';
  tooltipElement.classList.add('visible');
  
  const elementRect = element.getBoundingClientRect();
  const tooltipRect = tooltipElement.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
  const scrollY = window.pageYOffset || document.documentElement.scrollTop;
  
  let left, top;
  
  // Reset classes and inline styles
  tooltipElement.classList.remove('arrow-bottom', 'arrow-left', 'arrow-right');
  tooltipElement.style.maxWidth = '';
  tooltipElement.style.removeProperty('--arrow-offset');
  
  // Special positioning for help icons - position like native tooltip
  if (element.classList.contains('tool-help-icon')) {
    // Position tooltip below and slightly to the right of the help icon
    top = elementRect.bottom + scrollY + 5;
    left = elementRect.left + scrollX - 10; // Slight offset to the left
  } else {
    // Default position (above element) for other tooltips
    top = elementRect.top + scrollY - tooltipRect.height - 10;
    left = elementRect.left + scrollX + (elementRect.width / 2) - (tooltipRect.width / 2);
  }
  
  // Check if tooltip fits above element (skip for help icons which are already positioned below)
  if (!element.classList.contains('tool-help-icon') && elementRect.top < tooltipRect.height + 10) {
    // Position below element
    top = elementRect.bottom + scrollY + 10;
  }
  
  // Handle horizontal positioning and edge cases
  if (left < scrollX + 10) {
    // Too close to left edge
    if (elementRect.left < 50 && !element.classList.contains('tool-help-icon')) {
      // Position to the right of the element (skip for help icons)
      left = elementRect.right + scrollX + 10;
      top = elementRect.top + scrollY + (elementRect.height / 2) - (tooltipRect.height / 2);
    } else {
      // Align with left edge with padding
      left = scrollX + 10;
      // For help icons, adjust arrow position since we moved the tooltip
      if (element.classList.contains('tool-help-icon')) {
        // Calculate where the arrow should point relative to the help icon
        const arrowOffset = (elementRect.left + scrollX + elementRect.width / 2) - left;
        tooltipElement.style.setProperty('--arrow-offset', `${Math.max(10, Math.min(arrowOffset, tooltipRect.width - 10))}px`);
      }
    }
  } else if (left + tooltipRect.width > scrollX + viewportWidth - 10) {
    // Too close to right edge
    if (elementRect.right > viewportWidth - 50 && !element.classList.contains('tool-help-icon')) {
      // Position to the left of the element (skip for help icons)
      left = elementRect.left + scrollX - tooltipRect.width - 10;
      top = elementRect.top + scrollY + (elementRect.height / 2) - (tooltipRect.height / 2);
    } else {
      // Align with right edge with padding
      left = scrollX + viewportWidth - tooltipRect.width - 10;
      // For help icons, adjust arrow position since we moved the tooltip
      if (element.classList.contains('tool-help-icon')) {
        // Calculate where the arrow should point relative to the help icon
        const arrowOffset = (elementRect.left + scrollX + elementRect.width / 2) - left;
        tooltipElement.style.setProperty('--arrow-offset', `${Math.max(10, Math.min(arrowOffset, tooltipRect.width - 10))}px`);
      }
    }
  }
  
  // Final bounds check for vertical positioning
  if (top < scrollY + 10) {
    top = scrollY + 10;
  } else if (top + tooltipRect.height > scrollY + viewportHeight - 10) {
    top = scrollY + viewportHeight - tooltipRect.height - 10;
  }
  
  // Apply positioning
  tooltipElement.style.left = `${Math.round(left)}px`;
  tooltipElement.style.top = `${Math.round(top)}px`;
  
  // Make tooltip visible again
  tooltipElement.style.visibility = 'visible';
}

/**
 * Handle touch start events for mobile tooltip support
 */
function handleTooltipTouchStart(event) {
  // Only handle touch events on help icons
  if (!event.target || !event.target.classList.contains('tool-help-icon')) {
    return;
  }
  
  const element = event.target;
  const tooltipText = element.getAttribute('data-tooltip');
  if (!tooltipText) return;
  
  // Prevent default touch behavior to avoid triggering mouse events
  event.preventDefault();
  event.stopPropagation();
  
  // Clear any existing timeout
  if (tooltipTimeout) {
    clearTimeout(tooltipTimeout);
  }
  
  // Show tooltip immediately on touch
  showTooltip(element, tooltipText);
  
  // Set a flag to track that we're showing a tooltip via touch
  element.dataset.tooltipTouchActive = 'true';
}

/**
 * Handle touch end events for mobile tooltip support
 */
function handleTooltipTouchEnd(event) {
  // Only handle if we have an active touch tooltip
  if (event.target && event.target.dataset.tooltipTouchActive) {
    // Clear the touch active flag
    delete event.target.dataset.tooltipTouchActive;
    
    // Hide tooltip after a short delay
    if (tooltipTimeout) {
      clearTimeout(tooltipTimeout);
    }
    
    tooltipTimeout = setTimeout(() => {
      hideTooltip();
    }, 2000); // Hide after 2 seconds
  }
}

/**
 * Add tooltip to an element
 */
function addTooltip(element, text) {
  if (!element || !text) return;
  element.setAttribute('data-tooltip', text);
}

/**
 * Remove tooltip from an element
 */
function removeTooltip(element) {
  if (!element) return;
  element.removeAttribute('data-tooltip');
}

/**
 * Update tooltip text for an element
 */
function updateTooltip(element, text) {
  if (!element) return;
  if (text) {
    element.setAttribute('data-tooltip', text);
  } else {
    element.removeAttribute('data-tooltip');
  }
}

// Initialize tooltip system when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initTooltipSystem);
} else {
  initTooltipSystem();
}

// Export functions for use in other modules
window.tooltipSystem = {
  init: initTooltipSystem,
  show: showTooltip,
  hide: hideTooltip,
  add: addTooltip,
  remove: removeTooltip,
  update: updateTooltip
};
