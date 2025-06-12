/**
 * Entertainment tool implementations (Movies, TV Shows, etc.)
 */

// Ensure the toolImplementations object exists
window.toolImplementations = window.toolImplementations || {};

/**
 * Search for movies, TV shows, actors, etc. using IMDB
 * @param {Object} args - Arguments for the tool
 * @returns {Promise<Object>} - The result
 */
async function searchIMDB(args) {
  const searchTerm = args.searchTerm;
  const type = args.type; // One of: VIDEO_GAME|PODCAST_SERIES|TV_EPISODE|TV|MOVIE|NAME
  const first = Math.min(args.first || 20, 50); // Limit to 50 results max
  const country = args.country || "US";
  const language = args.language || "en-US";
  
  if (window.VERBOSE_LOGGING) console.info(`Searching IMDB for: "${searchTerm}", type: ${type}, first: ${first}`);
    try {
    const baseUrl = "https://imdb8.p.rapidapi.com/v2/search";
    const params = new URLSearchParams({
      searchTerm: searchTerm,
      first: first,
      country: country,
      language: language
    });
    
    // Only add type parameter if it's provided
    if (type) {
      params.append('type', type);
    }
    
    // Create a tracked controller for this request
    const controller = window.createNetworkController ? window.createNetworkController() : new AbortController();
    
    // Get RapidAPI key from tool API keys
    const rapidApiKey = window.getToolApiKey ? window.getToolApiKey('rapidapi') : null;
    
    if (!rapidApiKey) {
      return {
        searchTerm: searchTerm,
        notice: 'RapidAPI key not configured. Please subscribe to the IMDB8 API at https://rapidapi.com/apidojo/api/imdb8 and add your RapidAPI key in the Tools settings.',
        timestamp: new Date().toISOString()
      };
    }
    
    try {
      const response = await fetch(`${baseUrl}?${params.toString()}`, {
        method: "GET",
        headers: {
          "x-rapidapi-key": rapidApiKey,
          "x-rapidapi-host": "imdb8.p.rapidapi.com"
        },
        signal: controller.signal
      });
      
      // Remove from tracking
      if (window.removeNetworkController) {
        window.removeNetworkController(controller);
      }
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      return {
        searchTerm: searchTerm,
        results: data.data || [],
        count: (data.data || []).length,
        timestamp: new Date().toISOString(),
        params: {
          type,
          first,
          country,
          language
        }
      };
    } catch (error) {
      // Remove from tracking in case of error
      if (window.removeNetworkController) {
        window.removeNetworkController(controller);
      }
      
      // If aborted, don't retry
      if (error.name === 'AbortError' || window.shouldStopGeneration) {
        throw new Error('Request canceled');
      }
      
      throw error;
    }
  } catch (error) {
    console.error('Error searching IMDB:', error);
    return {
      searchTerm: searchTerm,
      error: error.message || 'Unknown error searching IMDB',
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Get detailed information about a specific movie or TV show
 * @param {Object} args - Arguments for the tool
 * @returns {Promise<Object>} - The result
 */
async function getTitleDetails(args) {
  const titleId = args.titleId;
  const country = args.country || "US";
  const language = args.language || "en-US";
  
  if (window.VERBOSE_LOGGING) console.info(`Getting title details for: ${titleId}`);
  
  try {
    if (!titleId || !titleId.startsWith('tt')) {
      return {
        titleId: titleId,
        error: 'Title ID must be provided and start with "tt"',
        timestamp: new Date().toISOString()
      };
    }

    const baseUrl = "https://imdb8.p.rapidapi.com/title/v2/get-overview";
    const params = new URLSearchParams({
      tconst: titleId
    });

    // Add country and language if both are provided
    if (country && language) {
      params.append('country', country);
      params.append('language', language);
    }

    // Create a tracked controller for this request
    const controller = window.createNetworkController ? window.createNetworkController() : new AbortController();
    
    // Get RapidAPI key from tool API keys
    const rapidApiKey = window.getToolApiKey ? window.getToolApiKey('rapidapi') : null;
    
    if (!rapidApiKey) {
      return {
        titleId: titleId,
        notice: 'RapidAPI key not configured. Please subscribe to the IMDB8 API at https://rapidapi.com/apidojo/api/imdb8 and add your RapidAPI key in the Tools settings.',
        timestamp: new Date().toISOString()
      };
    }

    try {
      const response = await fetch(`${baseUrl}?${params.toString()}`, {
        method: "GET",
        headers: {
          "x-rapidapi-key": rapidApiKey,
          "x-rapidapi-host": "imdb8.p.rapidapi.com"
        },
        signal: controller.signal
      });
      
      // Remove from tracking
      if (window.removeNetworkController) {
        window.removeNetworkController(controller);
      }
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      return {
        titleId: titleId,
        data: data.data || data,
        timestamp: new Date().toISOString(),
        params: {
          country,
          language
        }
      };
    } catch (error) {
      // Remove from tracking in case of error
      if (window.removeNetworkController) {
        window.removeNetworkController(controller);
      }
      
      // If aborted, don't retry
      if (error.name === 'AbortError' || window.shouldStopGeneration) {
        throw new Error('Request canceled');
      }
      
      throw error;
    }
  } catch (error) {
    console.error('Error getting title details:', error);
    return {
      titleId: titleId,
      error: error.message || 'Unknown error getting title details',
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Get detailed information about a specific actor or person
 * @param {Object} args - Arguments for the tool
 * @returns {Promise<Object>} - The result
 */
async function getActorDetails(args) {
  const personId = args.personId;
  const first = Math.min(args.first || 20, 50); // Limit to 50 results max
  const country = args.country || "US";
  const language = args.language || "en-US";
  
  if (window.VERBOSE_LOGGING) console.info(`Getting actor details for: ${personId}`);
  
  try {
    if (!personId || !personId.startsWith('nm')) {
      return {
        personId: personId,
        error: 'Person ID must be provided and start with "nm"',
        timestamp: new Date().toISOString()
      };
    }

    const baseUrl = "https://imdb8.p.rapidapi.com/actors/v2/get-overview";
    const params = new URLSearchParams({
      nconst: personId,
      first: first.toString()
    });

    // Add country and language if both are provided
    if (country && language) {
      params.append('country', country);
      params.append('language', language);
    }

    // Create a tracked controller for this request
    const controller = window.createNetworkController ? window.createNetworkController() : new AbortController();
    
    // Get RapidAPI key from tool API keys
    const rapidApiKey = window.getToolApiKey ? window.getToolApiKey('rapidapi') : null;
    
    if (!rapidApiKey) {
      return {
        personId: personId,
        notice: 'RapidAPI key not configured. Please subscribe to the IMDB8 API at https://rapidapi.com/apidojo/api/imdb8 and add your RapidAPI key in the Tools settings.',
        timestamp: new Date().toISOString()
      };
    }

    try {
      const response = await fetch(`${baseUrl}?${params.toString()}`, {
        method: "GET",
        headers: {
          "x-rapidapi-key": rapidApiKey,
          "x-rapidapi-host": "imdb8.p.rapidapi.com"
        },
        signal: controller.signal
      });
      
      // Remove from tracking
      if (window.removeNetworkController) {
        window.removeNetworkController(controller);
      }
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      return {
        personId: personId,
        data: data.data || data,
        timestamp: new Date().toISOString(),
        params: {
          first,
          country,
          language
        }
      };
    } catch (error) {
      // Remove from tracking in case of error
      if (window.removeNetworkController) {
        window.removeNetworkController(controller);
      }
      
      // If aborted, don't retry
      if (error.name === 'AbortError' || window.shouldStopGeneration) {
        throw new Error('Request canceled');
      }
      
      throw error;
    }
  } catch (error) {
    console.error('Error getting actor details:', error);
    return {
      personId: personId,
      error: error.message || 'Unknown error getting actor details',
      timestamp: new Date().toISOString()
    };
  }
}

// Register the tool implementations
window.toolImplementations.search_imdb = searchIMDB;
window.toolImplementations.get_title_details = getTitleDetails;
window.toolImplementations.get_actor_details = getActorDetails;
