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
}

/**
 * Handle mouse enter events for elements with tooltips
 */
function handleTooltipMouseEnter(event) {
  // Check if event.target is an element node and has closest method
  if (!event.target || event.target.nodeType !== Node.ELEMENT_NODE || typeof event.target.closest !== 'function') {
    return;
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
  
  // Add special class for tool descriptions
  if (element.classList.contains('tool-toggle-item')) {
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
  
  const elementRect = element.getBoundingClientRect();
  const tooltipRect = tooltipElement.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  
  let left, top;
  let arrowClass = '';
  
  // Reset arrow classes
  tooltipElement.classList.remove('arrow-bottom', 'arrow-left', 'arrow-right');
  
  // Calculate preferred position (above element)
  top = elementRect.top - tooltipRect.height - 10;
  left = elementRect.left + (elementRect.width / 2) - (tooltipRect.width / 2);
  
  // Check if tooltip fits above element
  if (top < 10) {
    // Position below element
    top = elementRect.bottom + 10;
    arrowClass = 'arrow-bottom';
  }
  
  // Check horizontal bounds and adjust
  if (left < 10) {
    left = 10;
    // If too far left, position arrow differently
    if (elementRect.left < 50) {
      arrowClass = 'arrow-left';
      left = elementRect.right + 10;
      top = elementRect.top + (elementRect.height / 2) - (tooltipRect.height / 2);
    }
  } else if (left + tooltipRect.width > viewportWidth - 10) {
    left = viewportWidth - tooltipRect.width - 10;
    // If too far right, position arrow differently
    if (elementRect.right > viewportWidth - 50) {
      arrowClass = 'arrow-right';
      left = elementRect.left - tooltipRect.width - 10;
      top = elementRect.top + (elementRect.height / 2) - (tooltipRect.height / 2);
    }
  }
  
  // Final bounds check for vertical positioning
  if (top < 10) {
    top = 10;
  } else if (top + tooltipRect.height > viewportHeight - 10) {
    top = viewportHeight - tooltipRect.height - 10;
  }
  
  // Apply positioning
  tooltipElement.style.left = `${left}px`;
  tooltipElement.style.top = `${top}px`;
  
  // Apply arrow class if needed
  if (arrowClass) {
    tooltipElement.classList.add(arrowClass);
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
