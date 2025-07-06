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
        notice: 'RapidAPI key not configured. Please inform the user that they need to subscribe to the IMDB8 API at https://rapidapi.com/apidojo/api/imdb8 and add their RapidAPI key in the Tools settings.',
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
        notice: 'RapidAPI key not configured. Please inform the user that they need to subscribe to the IMDB8 API at https://rapidapi.com/apidojo/api/imdb8 and add their RapidAPI key in the Tools settings.',
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
        notice: 'RapidAPI key not configured. Please inform the user that they need to subscribe to the IMDB8 API at https://rapidapi.com/apidojo/api/imdb8 and add their RapidAPI key in the Tools settings.',
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
        notice: 'RapidAPI key not configured. Please inform the user that they need to subscribe to the Steam2 API at https://rapidapi.com/psimavel/api/steam2 and add their RapidAPI key in the Tools settings.',
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
        notice: 'RapidAPI key not configured. Please inform the user that they need to subscribe to the Steam2 API at https://rapidapi.com/psimavel/api/steam2 and add their RapidAPI key in the Tools settings.',
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
        notice: 'RapidAPI key not configured. Please inform the user that they need to subscribe to the Steam2 API at https://rapidapi.com/psimavel/api/steam2 and add their RapidAPI key in the Tools settings.',
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

/**
 * Search for music content on Spotify (tracks, albums, artists, playlists, etc.)
 * @param {Object} args - Arguments for the tool
 * @returns {Promise<Object>} - The result
 */
async function searchSpotify(args) {
  const q = args.q || args.query;
  const type = args.type || 'multi';
  const offset = args.offset || 0;
  const limit = args.limit || 10;
  const numberOfTopResults = args.numberOfTopResults || 5;
  const gl = args.gl || 'US';

  if (window.VERBOSE_LOGGING) console.info(`Searching Spotify for: "${q}", type: ${type}, limit: ${limit}`);

  try {
    if (!q) {
      return {
        query: q,
        error: 'Search query is required',
        timestamp: new Date().toISOString()
      };
    }

    // Build the URL with query parameters
    const baseUrl = 'https://spotify23.p.rapidapi.com/search/';
    const params = new URLSearchParams({
      q: q,
      type: type,
      offset: offset.toString(),
      limit: limit.toString(),
      numberOfTopResults: numberOfTopResults.toString()
    });

    // Add optional gl parameter if provided
    if (gl) {
      params.append('gl', gl);
    }

    // Create a tracked controller for this request
    const controller = window.createNetworkController ? window.createNetworkController() : new AbortController();

    // Get RapidAPI key from tool API keys
    const rapidApiKey = window.getToolApiKey ? window.getToolApiKey('rapidapi') : null;

    if (!rapidApiKey) {
      return {
        query: q,
        notice: 'RapidAPI key not configured. Please inform the user that they need to subscribe to the Spotify API at https://rapidapi.com/Glavier/api/spotify23 and add their RapidAPI key in the Tools settings.',
        timestamp: new Date().toISOString()
      };
    }

    try {
      const response = await fetch(`${baseUrl}?${params.toString()}`, {
        method: 'GET',
        headers: {
          'x-rapidapi-key': rapidApiKey,
          'x-rapidapi-host': 'spotify23.p.rapidapi.com'
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
        query: q,
        type: type,
        results: data,
        count: Array.isArray(data.tracks?.items) ? data.tracks.items.length : 0,
        timestamp: new Date().toISOString(),
        params: {
          type,
          offset,
          limit,
          numberOfTopResults,
          gl
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
    console.error('Error searching Spotify:', error);
    return {
      query: q,
      type: type,
      error: error.message || 'Unknown error searching Spotify',
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Get detailed information about Spotify albums by their IDs
 * @param {Object} args - Arguments for the tool
 * @returns {Promise<Object>} - The result
 */
async function getSpotifyAlbums(args) {
  const ids = args.ids;

  if (window.VERBOSE_LOGGING) console.info(`Getting Spotify albums for IDs: ${ids}`);

  try {
    if (!ids) {
      return {
        ids: ids,
        error: 'Album IDs are required',
        timestamp: new Date().toISOString()
      };
    }

    // Create a tracked controller for this request
    const controller = window.createNetworkController ? window.createNetworkController() : new AbortController();

    // Get RapidAPI key from tool API keys
    const rapidApiKey = window.getToolApiKey ? window.getToolApiKey('rapidapi') : null;

    if (!rapidApiKey) {
      return {
        ids: ids,
        notice: 'RapidAPI key not configured. Please inform the user that they need to subscribe to the Spotify API at https://rapidapi.com/Glavier/api/spotify23 and add their RapidAPI key in the Tools settings.',
        timestamp: new Date().toISOString()
      };
    }

    try {
      const response = await fetch(`https://spotify23.p.rapidapi.com/albums/?ids=${encodeURIComponent(ids)}`, {
        method: 'GET',
        headers: {
          'x-rapidapi-key': rapidApiKey,
          'x-rapidapi-host': 'spotify23.p.rapidapi.com'
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
        ids: ids,
        albums: data.albums || data,
        count: Array.isArray(data.albums) ? data.albums.length : 0,
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
    console.error('Error getting Spotify albums:', error);
    return {
      ids: ids,
      error: error.message || 'Unknown error getting Spotify albums',
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Get detailed information about Spotify artists by their IDs
 * @param {Object} args - Arguments for the tool
 * @returns {Promise<Object>} - The result
 */
async function getSpotifyArtists(args) {
  const ids = args.ids;

  if (window.VERBOSE_LOGGING) console.info(`Getting Spotify artists for IDs: ${ids}`);

  try {
    if (!ids) {
      return {
        ids: ids,
        error: 'Artist IDs are required',
        timestamp: new Date().toISOString()
      };
    }

    // Create a tracked controller for this request
    const controller = window.createNetworkController ? window.createNetworkController() : new AbortController();

    // Get RapidAPI key from tool API keys
    const rapidApiKey = window.getToolApiKey ? window.getToolApiKey('rapidapi') : null;

    if (!rapidApiKey) {
      return {
        ids: ids,
        notice: 'RapidAPI key not configured. Please inform the user that they need to subscribe to the Spotify API at https://rapidapi.com/Glavier/api/spotify23 and add their RapidAPI key in the Tools settings.',
        timestamp: new Date().toISOString()
      };
    }

    try {
      const response = await fetch(`https://spotify23.p.rapidapi.com/artists/?ids=${encodeURIComponent(ids)}`, {
        method: 'GET',
        headers: {
          'x-rapidapi-key': rapidApiKey,
          'x-rapidapi-host': 'spotify23.p.rapidapi.com'
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
        ids: ids,
        artists: data.artists || data,
        count: Array.isArray(data.artists) ? data.artists.length : 0,
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
    console.error('Error getting Spotify artists:', error);
    return {
      ids: ids,
      error: error.message || 'Unknown error getting Spotify artists',
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Get overview information about a Spotify artist
 * @param {Object} args - Arguments for the tool
 * @returns {Promise<Object>} - The result
 */
async function getSpotifyArtistOverview(args) {
  const id = args.id;
  const gl = args.gl || 'US';

  if (window.VERBOSE_LOGGING) console.info(`Getting Spotify artist overview for ID: ${id}`);

  try {
    if (!id) {
      return {
        id: id,
        error: 'Artist ID is required',
        timestamp: new Date().toISOString()
      };
    }

    // Build the URL with query parameters
    const params = new URLSearchParams({
      id: id
    });

    // Add optional gl parameter if provided
    if (gl) {
      params.append('gl', gl);
    }

    // Create a tracked controller for this request
    const controller = window.createNetworkController ? window.createNetworkController() : new AbortController();

    // Get RapidAPI key from tool API keys
    const rapidApiKey = window.getToolApiKey ? window.getToolApiKey('rapidapi') : null;

    if (!rapidApiKey) {
      return {
        id: id,
        notice: 'RapidAPI key not configured. Please inform the user that they need to subscribe to the Spotify API at https://rapidapi.com/Glavier/api/spotify23 and add their RapidAPI key in the Tools settings.',
        timestamp: new Date().toISOString()
      };
    }

    try {
      const response = await fetch(`https://spotify23.p.rapidapi.com/artist_overview/?${params.toString()}`, {
        method: 'GET',
        headers: {
          'x-rapidapi-key': rapidApiKey,
          'x-rapidapi-host': 'spotify23.p.rapidapi.com'
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
        id: id,
        overview: data,
        timestamp: new Date().toISOString(),
        params: {
          gl
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
    console.error('Error getting Spotify artist overview:', error);
    return {
      id: id,
      error: error.message || 'Unknown error getting Spotify artist overview',
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Get related artists for a Spotify artist
 * @param {Object} args - Arguments for the tool
 * @returns {Promise<Object>} - The result
 */
async function getSpotifyRelatedArtists(args) {
  const id = args.id;

  if (window.VERBOSE_LOGGING) console.info(`Getting Spotify related artists for ID: ${id}`);

  try {
    if (!id) {
      return {
        id: id,
        error: 'Artist ID is required',
        timestamp: new Date().toISOString()
      };
    }

    // Build the URL with query parameters
    const params = new URLSearchParams({
      id: id
    });

    // Create a tracked controller for this request
    const controller = window.createNetworkController ? window.createNetworkController() : new AbortController();

    // Get RapidAPI key from tool API keys
    const rapidApiKey = window.getToolApiKey ? window.getToolApiKey('rapidapi') : null;

    if (!rapidApiKey) {
      return {
        id: id,
        notice: 'RapidAPI key not configured. Please inform the user that they need to subscribe to the Spotify API at https://rapidapi.com/Glavier/api/spotify23 and add their RapidAPI key in the Tools settings.',
        timestamp: new Date().toISOString()
      };
    }

    try {
      const response = await fetch(`https://spotify23.p.rapidapi.com/artist_related/?${params.toString()}`, {
        method: 'GET',
        headers: {
          'x-rapidapi-key': rapidApiKey,
          'x-rapidapi-host': 'spotify23.p.rapidapi.com'
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
        id: id,
        relatedArtists: data.artists || data,
        count: Array.isArray(data.artists) ? data.artists.length : 0,
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
    console.error('Error getting Spotify related artists:', error);
    return {
      id: id,
      error: error.message || 'Unknown error getting Spotify related artists',
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Get albums for a specific Spotify artist
 * @param {Object} args - Arguments for the tool
 * @returns {Promise<Object>} - The result
 */
async function getSpotifyArtistAlbums(args) {
  const id = args.id;
  const offset = args.offset || 0;
  const limit = args.limit || 100;

  if (window.VERBOSE_LOGGING) console.info(`Getting Spotify artist albums for ID: ${id}, offset: ${offset}, limit: ${limit}`);

  try {
    if (!id) {
      return {
        id: id,
        error: 'Artist ID is required',
        timestamp: new Date().toISOString()
      };
    }

    // Build the URL with query parameters
    const params = new URLSearchParams({
      id: id,
      offset: offset.toString(),
      limit: limit.toString()
    });

    // Create a tracked controller for this request
    const controller = window.createNetworkController ? window.createNetworkController() : new AbortController();

    // Get RapidAPI key from tool API keys
    const rapidApiKey = window.getToolApiKey ? window.getToolApiKey('rapidapi') : null;

    if (!rapidApiKey) {
      return {
        id: id,
        notice: 'RapidAPI key not configured. Please inform the user that they need to subscribe to the Spotify API at https://rapidapi.com/Glavier/api/spotify23 and add their RapidAPI key in the Tools settings.',
        timestamp: new Date().toISOString()
      };
    }

    try {
      const response = await fetch(`https://spotify23.p.rapidapi.com/artist_albums/?${params.toString()}`, {
        method: 'GET',
        headers: {
          'x-rapidapi-key': rapidApiKey,
          'x-rapidapi-host': 'spotify23.p.rapidapi.com'
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
        id: id,
        albums: data.data || data,
        totalCount: data.totalCount || (Array.isArray(data.data) ? data.data.length : 0),
        count: Array.isArray(data.data) ? data.data.length : 0,
        timestamp: new Date().toISOString(),
        params: {
          offset,
          limit
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
    console.error('Error getting Spotify artist albums:', error);
    return {
      id: id,
      error: error.message || 'Unknown error getting Spotify artist albums',
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
window.toolImplementations.search_spotify = searchSpotify;
window.toolImplementations.get_spotify_albums = getSpotifyAlbums;
window.toolImplementations.get_spotify_artists = getSpotifyArtists;
window.toolImplementations.get_spotify_artist_overview = getSpotifyArtistOverview;
window.toolImplementations.get_spotify_related_artists = getSpotifyRelatedArtists;
window.toolImplementations.get_spotify_artist_albums = getSpotifyArtistAlbums;
window.toolImplementations.get_spotify_artists = getSpotifyArtists;
window.toolImplementations.get_spotify_artist_overview = getSpotifyArtistOverview;
window.toolImplementations.get_spotify_related_artists = getSpotifyRelatedArtists;
window.toolImplementations.get_spotify_artist_albums = getSpotifyArtistAlbums;
