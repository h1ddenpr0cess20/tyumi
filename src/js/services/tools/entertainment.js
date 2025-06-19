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

/**
 * Search for Steam games
 * @param {Object} args - Arguments for the tool
 * @returns {Promise<Object>} - The result
 */
async function steamSearchGames(args) {
  const term = args.term;
  const page = args.page || 1;
  
  if (window.VERBOSE_LOGGING) console.info(`Searching Steam for: "${term}", page: ${page}`);
  
  try {
    const baseUrl = `https://steam2.p.rapidapi.com/search/${encodeURIComponent(term)}/page/${page}`;
    
    // Create a tracked controller for this request
    const controller = window.createNetworkController ? window.createNetworkController() : new AbortController();
    
    // Get RapidAPI key from tool API keys
    const rapidApiKey = window.getToolApiKey ? window.getToolApiKey('rapidapi') : null;
    
    if (!rapidApiKey) {
      return {
        term: term,
        page: page,
        notice: 'RapidAPI key not configured. Please subscribe to the Steam2 API at https://rapidapi.com/psimavel/api/steam2 and add your RapidAPI key in the Tools settings.',
        timestamp: new Date().toISOString()
      };
    }
    
    try {
      const response = await fetch(baseUrl, {
        method: "GET",
        headers: {
          "x-rapidapi-key": rapidApiKey,
          "x-rapidapi-host": "steam2.p.rapidapi.com"
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
        term: term,
        page: page,
        results: data || [],
        timestamp: new Date().toISOString()
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
    console.error('Error searching Steam games:', error);
    return {
      term: term,
      page: page,
      error: error.message || 'Unknown error searching Steam games',
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Get detailed information about a Steam app/game
 * @param {Object} args - Arguments for the tool
 * @returns {Promise<Object>} - The result
 */
async function steamGetAppDetails(args) {
  const appId = args.appId;
  
  if (window.VERBOSE_LOGGING) console.info(`Getting Steam app details for ID: ${appId}`);
  
  try {
    if (!appId) {
      return {
        appId: appId,
        error: 'App ID must be provided',
        timestamp: new Date().toISOString()
      };
    }

    const baseUrl = `https://steam2.p.rapidapi.com/appDetail/${appId}`;
    
    // Create a tracked controller for this request
    const controller = window.createNetworkController ? window.createNetworkController() : new AbortController();
    
    // Get RapidAPI key from tool API keys
    const rapidApiKey = window.getToolApiKey ? window.getToolApiKey('rapidapi') : null;
    
    if (!rapidApiKey) {
      return {
        appId: appId,
        notice: 'RapidAPI key not configured. Please subscribe to the Steam2 API at https://rapidapi.com/psimavel/api/steam2 and add your RapidAPI key in the Tools settings.',
        timestamp: new Date().toISOString()
      };
    }

    try {
      const response = await fetch(baseUrl, {
        method: "GET",
        headers: {
          "x-rapidapi-key": rapidApiKey,
          "x-rapidapi-host": "steam2.p.rapidapi.com"
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
        appId: appId,
        data: data,
        timestamp: new Date().toISOString()
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
    console.error('Error getting Steam app details:', error);
    return {
      appId: appId,
      error: error.message || 'Unknown error getting Steam app details',
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Get reviews for a Steam app/game
 * @param {Object} args - Arguments for the tool
 * @returns {Promise<Object>} - The result
 */
async function steamGetAppReviews(args) {
  const appId = args.appId;
  const limit = Math.min(args.limit || 40, 200); // Limit to 200 reviews max
  const cursor = args.cursor || ""; // For pagination
  
  if (window.VERBOSE_LOGGING) console.info(`Getting Steam app reviews for ID: ${appId}, limit: ${limit}`);
  
  try {
    if (!appId) {
      return {
        appId: appId,
        error: 'App ID must be provided',
        timestamp: new Date().toISOString()
      };
    }    let baseUrl = `https://steam2.p.rapidapi.com/appReviews/${appId}/limit/${limit}/*`;
    
    // Add cursor parameter if provided for pagination
    if (cursor) {
      baseUrl += `?cursor=${encodeURIComponent(cursor)}`;
    }
    
    // Create a tracked controller for this request
    const controller = window.createNetworkController ? window.createNetworkController() : new AbortController();
    
    // Get RapidAPI key from tool API keys
    const rapidApiKey = window.getToolApiKey ? window.getToolApiKey('rapidapi') : null;
    
    if (!rapidApiKey) {
      return {
        appId: appId,
        limit: limit,
        notice: 'RapidAPI key not configured. Please subscribe to the Steam2 API at https://rapidapi.com/psimavel/api/steam2 and add your RapidAPI key in the Tools settings.',
        timestamp: new Date().toISOString()
      };
    }

    try {
      const response = await fetch(baseUrl, {
        method: "GET",
        headers: {
          "x-rapidapi-key": rapidApiKey,
          "x-rapidapi-host": "steam2.p.rapidapi.com"
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
        appId: appId,
        limit: limit,
        cursor: cursor,
        reviews: data,
        timestamp: new Date().toISOString()
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
    console.error('Error getting Steam app reviews:', error);
    return {
      appId: appId,
      limit: limit,
      cursor: cursor,
      error: error.message || 'Unknown error getting Steam app reviews',
      timestamp: new Date().toISOString()
    };
  }
}

// Register the tool implementations
window.toolImplementations.search_imdb = searchIMDB;
window.toolImplementations.get_title_details = getTitleDetails;
window.toolImplementations.get_actor_details = getActorDetails;
window.toolImplementations.steam_search_games = steamSearchGames;
window.toolImplementations.steam_get_app_details = steamGetAppDetails;
window.toolImplementations.steam_get_app_reviews = steamGetAppReviews;
