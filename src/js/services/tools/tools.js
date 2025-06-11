/**
 * Tool coordination and execution for OpenAI API
 */

// We'll load the tool implementations using script tags in index.html
// This file will be responsible for coordinating all the tools

// Ensure the toolImplementations object exists
window.toolImplementations = window.toolImplementations || {};

// Wait for all tool modules to be loaded
document.addEventListener('DOMContentLoaded', function() {
  // Ensure all tool-related properties are properly initialized on window
  if (!window.toolDefinitions) {
    console.warn('Tool definitions not loaded. Make sure to include the definitions.js file before tools.js');
  }
  
  if (Object.keys(window.toolImplementations).length === 0) {
    console.warn('Tool implementations not loaded. Make sure to include all tool implementation files before tools.js');
  }
});

  /**
 * Process the function/tool calling response from the API
 * @param {Object} response - The API response containing tool calls
 * @param {Array} messages - The conversation history messages
 * @returns {Promise<Object>} - Object containing processed response and updated messages
 */
window.processToolCalls = async function(response, messages) {
  // Only log if actual tool calls are present
  if (window.VERBOSE_LOGGING && response.tool_calls && response.tool_calls.length > 0) {
    console.info(`Processing ${response.tool_calls.length} tool call(s)`);
    if (response.content) {
      console.info('Assistant response content:', response.content);
    }
  }
  // Check if the response has tool calls
  if (!response.tool_calls || response.tool_calls.length === 0) {
    return { finalContent: response.content, messages, shouldContinue: false };
  }

  // We have tool calls to process
  const assistantMessage = {
    role: 'assistant',
    content: response.content || null,
    tool_calls: response.tool_calls
  };

  // Add the assistant's tool request to messages
  messages.push(assistantMessage);

  // Ensure a global array for generated images exists
  if (!window.generatedImages) {
    window.generatedImages = [];
  }
  
  // Collection to store generated image HTML
  if (!window.currentGeneratedImageHtml) {
    window.currentGeneratedImageHtml = [];
  }
  
  // Generate a unique session ID for this batch of images
  const sessionId = Date.now().toString(36) + Math.random().toString(36).substring(2, 5);
  
  // Function to generate unique filename
  function generateUniqueFilename(index, extension = 'png') {
    const timestamp = new Date().toISOString()
      .replace(/[-:]/g, '')  // Remove dashes and colons
      .replace('T', '-')     // Replace T with dash
      .replace(/\.\d+Z$/, ''); // Remove milliseconds and Z
    
    return `image-${timestamp}-${sessionId}-${index}.${extension}`;
  }

  // Track image count for this batch
  let imageCount = 0;

  // Process each tool call
  for (const toolCall of response.tool_calls) {
    const toolName = toolCall.function.name;
    let toolArgs;
    try {
      toolArgs = JSON.parse(toolCall.function.arguments);
    } catch (e) {
      if (window.VERBOSE_LOGGING) console.error(`Error parsing tool arguments for ${toolName}:`, e);
      toolArgs = {};
    }
    if (window.VERBOSE_LOGGING) {
      console.info(`Tool call: ${toolName}`);
      console.info('Tool arguments:', toolArgs);
    }
    let toolResult;
    try {
      toolResult = await window.executeToolFunction(toolName, toolArgs);
      if (window.VERBOSE_LOGGING) {
        console.info('Tool result:', toolResult);
      }
    } catch (e) {
      console.error(`Error executing tool ${toolName}:`, e);
      toolResult = { error: e.message || 'Unknown error executing tool' };
    }

    // If this is an image generation tool, collect the image HTML instead of displaying immediately
    if (["grok_image", "gemini_image", "openai_image", "openai_image_edit"].includes(toolName) && toolResult && toolResult.url) {
      if (typeof toolResult.url === 'string' && toolResult.url.startsWith('data:image/')) {
        imageCount++;
        const filename = generateUniqueFilename(imageCount);
        // Create a unique timestamp for this image
        const timestamp = new Date().toISOString();
        
        const imgHtml = `<img src="${toolResult.url}" alt="Generated Image" class="generated-image-thumbnail" data-filename="${filename}" data-prompt="${toolArgs.prompt || ''}" data-timestamp="${timestamp}" />`;
        window.currentGeneratedImageHtml.push(imgHtml);
        
        // Find the last assistant message ID to associate with this image
        let associatedMessageId = null;
        for (let i = messages.length - 1; i >= 0; i--) {
          if (messages[i].role === 'assistant' && messages[i].content) {
            // If the message doesn't have an ID, create one
            if (!messages[i].id) {
              messages[i].id = `msg-${Date.now()}-${i}`;
            }
            associatedMessageId = messages[i].id;
            
            // Mark the message as having images for easy identification later
            messages[i].hasImages = true;
            break;
          }
        }
        
        // Add to generatedImages with all necessary metadata
        window.generatedImages.push({
          url: toolResult.url,
          tool: toolName,
          prompt: toolArgs.prompt || '',
          timestamp: timestamp,
          filename: filename,
          associatedMessageId: associatedMessageId
        });
        
        // Also store the image in IndexedDB for persistence
        if (window.saveImageToDb) {
          window.saveImageToDb(toolResult.url, filename, {
            tool: toolName,
            prompt: toolArgs.prompt || '',
            timestamp: timestamp,
            associatedMessageId: associatedMessageId
          }).catch(error => {
            console.error('Failed to save image to IndexedDB:', error);
          });
        }
      }
    }
    // Always add the tool response to messages, but omit base64 from history
    let toolResultForHistory = { ...toolResult };
    if (["grok_image", "gemini_image", "openai_image", "openai_image_edit"].includes(toolName) && toolResultForHistory && toolResultForHistory.url) {
      // Use the existing filename already generated for this image
      const filename = window.generatedImages[window.generatedImages.length - 1].filename;
      toolResultForHistory.url = `[[IMAGE: ${filename}]]`;
    }
    messages.push({
      role: 'tool',
      tool_call_id: toolCall.id,
      content: JSON.stringify(toolResultForHistory)
    });
  }

  // Return updated messages and flag to continue the conversation loop
  return { finalContent: null, messages, shouldContinue: true };
};

/**
 * Execute the tool function based on the name
 * @param {string} toolName - The name of the tool to execute
 * @param {Object} toolArgs - The arguments for the tool
 * @returns {Promise<any>} - The result of the tool execution
 */
window.executeToolFunction = async function(toolName, toolArgs) {
  if (window.VERBOSE_LOGGING) console.info(`Tool call: ${toolName}`);
  
  // Check if the requested tool exists in the implementation map
  if (!window.toolImplementations[toolName]) {
    if (window.VERBOSE_LOGGING) console.error(`Tool '${toolName}' is not implemented`);
    throw new Error(`Tool '${toolName}' is not implemented`);
  }

  try {
    // Execute the tool function with the provided arguments
    const result = await window.toolImplementations[toolName](toolArgs);
    return result;
  } catch (error) {
    console.error(`Error executing tool ${toolName}:`, error);
    // Return structured error response
    return {
      error: true,
      message: error.message || 'Unknown error executing tool',
      toolName: toolName
    };
  }
};

/**
 * Handle the complete function calling flow with OpenAI API
 * @param {Object} initialRequestBody - The initial request body
 * @param {Object} headers - The request headers
 * @returns {Promise<Object>} - The final response
 */
window.handleFunctionCalling = async function(initialRequestBody, headers) {
  if (window.VERBOSE_LOGGING) console.info('Function calling flow started');
  let requestBody = { ...initialRequestBody };
  let messages = [...requestBody.messages];
  let finalContent = null;
  
  // Only log error if no tools
  if (!window.toolDefinitions || window.toolDefinitions.length === 0) {
    console.warn('No tool definitions available, falling back to regular API call');
    const endpoint = window.getApiEndpoint();
    const response = await window.callApi(endpoint, requestBody, headers);
    return response;
  }
  
  // Add tools to the request body
  requestBody.tools = window.toolDefinitions;
  requestBody.tool_choice = "auto";
  
  // Start the conversation loop
  let shouldContinue = true;
  let loopCount = 0;
  const MAX_LOOPS = 10; // Safety limit to prevent infinite loops
  
  while (shouldContinue && loopCount < MAX_LOOPS) {
    loopCount++;
    const endpoint = window.getApiEndpoint();
    try {
      // Clean messages before sending to API to remove any extra fields
      const cleanedMessages = window.cleanMessagesForApi ? window.cleanMessagesForApi(messages) : messages;
      requestBody.messages = cleanedMessages;
      
      // Temporarily disable streaming for the tool calling loop
      const originalStream = requestBody.stream;
      requestBody.stream = false;
      
      const apiResponse = await window.callApi(endpoint, requestBody, headers);
      
      // Restore original streaming setting
      requestBody.stream = originalStream;
      
      if (!apiResponse || !apiResponse.ok) {
        console.error('API returned error response:', apiResponse);
        throw new Error('API request failed during function calling');
      }
      
      const responseData = await apiResponse.json();
      if (!responseData.choices || !responseData.choices[0] || !responseData.choices[0].message) {
        console.error('Invalid response format:', responseData);
        throw new Error('Invalid response format from API');
      }
      
      // Get the assistant's response (the last message)
      const assistantResponse = responseData.choices[0].message;
      const result = await window.processToolCalls(assistantResponse, messages);
      finalContent = result.finalContent;
      messages = result.messages;
      shouldContinue = result.shouldContinue;
      
      // Update the request body with the new messages for the next iteration
      requestBody.messages = messages;
    } catch (error) {
      console.error('Error in function calling loop:', error);
      // If something goes wrong, break the loop and return a formatted error
      finalContent = `Error in function calling: ${error.message}`;
      shouldContinue = false;
    }
  }
  
  if (loopCount >= MAX_LOOPS) {
    console.warn('Max function calling loops reached, forcing completion');
    finalContent = finalContent || 'The assistant was unable to complete the task after multiple attempts.';
    
    // Add a system message to guide the model to provide a final response
    messages.push({
      role: "system",
      content: "The conversation has reached maximum tool calling iterations. Please provide a final response summarizing what you've accomplished or what issues were encountered."
    });
    
    // Log the message history length for debugging
    console.warn(`Message history contains ${messages.length} messages after max loops`);
  }
  
  if (window.VERBOSE_LOGGING) console.info('Function calling flow complete');
  
  // Final API call
  const finalRequestBody = { ...initialRequestBody };
  // Clean messages before final API call to remove any extra fields
  finalRequestBody.messages = window.cleanMessagesForApi ? window.cleanMessagesForApi(messages) : messages;
  delete finalRequestBody.tools;
  delete finalRequestBody.tool_choice;
  
  // Add enhanced debugging logs with FULL message history
  console.log('FINAL REQUEST DETAILS', {
    endpoint: window.getApiEndpoint(),
    model: finalRequestBody.model,
    messageCount: finalRequestBody.messages.length
  });
  
  // Log the complete message history for debugging
  console.log('COMPLETE MESSAGE HISTORY:', JSON.stringify(finalRequestBody.messages, null, 2));
  
  // Use the original API endpoint and make a standard API call
  const endpoint = window.getApiEndpoint();
  if (window.VERBOSE_LOGGING) console.info('Final API call to endpoint:', endpoint);
  
  try {
    const finalResponse = await window.callApi(endpoint, finalRequestBody, headers);
    
    // Check if this is a streaming response or not
    // For streaming responses, don't try to parse as JSON
    if (finalRequestBody.stream === true) {
      console.log('FINAL API RESPONSE IS STREAMING:', {
        status: finalResponse.status,
        statusText: finalResponse.statusText,
        headers: Object.fromEntries(finalResponse.headers.entries()),
        bodyType: finalResponse.bodyUsed ? 'consumed' : 'available'
      });
      
      // For streaming, we don't want to consume the body here as it will be processed by the streaming handler
    } else {
      // For non-streaming responses, we can safely parse as JSON
      const responseClone = finalResponse.clone();
      responseClone.json().then(data => {
        console.log('FINAL API RESPONSE DATA:', {
          status: finalResponse.status,
          statusText: finalResponse.statusText,
          hasChoices: !!data.choices,
          choicesCount: data.choices ? data.choices.length : 0,
          content: data.choices && data.choices[0] && data.choices[0].message ? 
                  (data.choices[0].message.content || '(empty content)') : '(no content found)',
          finishReason: data.choices && data.choices[0] ? data.choices[0].finish_reason : null,
          model: data.model,
          totalTokens: data.usage ? data.usage.total_tokens : null
        });
      }).catch(err => {
        console.error('Error parsing final response JSON:', err);
      });
    }
    
    return finalResponse;
  } catch (error) {
    console.error('Error in final API call:', error);
    
    // If the final API call fails, construct a basic response with the error
    const errorContent = `Error in processing: ${error.message}`;
    const errorResponse = {
      ok: true,
      status: 200,
      statusText: 'OK',
      json: () => Promise.resolve({
        choices: [{ message: { content: errorContent, role: 'assistant' } }],
        object: 'chat.completion',
        model: requestBody.model
      })
    };
    
    return errorResponse;
  }
};