/**
 * Chat export functionality
 */

// -----------------------------------------------------
// Export functions
// -----------------------------------------------------

/**
 * Exports the current chat conversation to a text file
 */
window.exportChat = function() {
  // Ask for confirmation before exporting (user can cancel if they don't want to export)
  const confirmExport = confirm('Export chat history? Click OK to export, Cancel to abort.');
  
  // If user clicked Cancel, don't export
  if (!confirmExport) {
    return;
  }
  
  // Check if the user wants to include thinking tags based on checkbox setting
  const includeThinkingCheckbox = document.getElementById('include-thinking');
  const includeThinking = includeThinkingCheckbox ? includeThinkingCheckbox.checked : false;
  
  const chatExport = window.conversationHistory
    .filter((msg) => msg.role !== 'system')
    .map((msg) => {
      // Filter thinking tags from assistant messages if checkbox is not checked
      const content = msg.role === 'assistant' && !includeThinking 
        ? window.filterThinkingTags(msg.content) 
        : msg.content;
      return `${msg.role === 'user' ? 'You' : 'Assistant'}: ${content}`;
    })
    .join('\n\n');

  const blob = new Blob([chatExport], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'chat-export-' + new Date().toISOString().slice(0, 10) + '.txt';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}; 