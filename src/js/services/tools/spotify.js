/**
 * Spotify music search tool implementations
 */

// Ensure the toolImplementations object exists
window.toolImplementations = window.toolImplementations || {};

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
        notice: 'RapidAPI key not configured. Please subscribe to the Spotify API at https://rapidapi.com/Glavier/api/spotify23 and add your RapidAPI key in the Tools settings.',
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

// Register the tool implementation
window.toolImplementations.search_spotify = searchSpotify;
