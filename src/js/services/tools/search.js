/**
 * Search and news tool implementations
 */

// Ensure the toolImplementations object exists
window.toolImplementations = window.toolImplementations || {};

// Google Custom Search Engine ID (this is not sensitive)
const GOOGLE_CX = "52ef49e3c28ff47e5";

/**
 * Search for news articles
 * @param {Object} args - Arguments for the tool
 * @returns {Promise<Object>} - The result
 */
async function searchNews(args) {
  const query = args.query;
  const limit = args.limit || 10;
  const timePublished = args.time_published || "anytime";
  const country = args.country || "US";
  const lang = args.lang || "en";
  const source = args.source || ""; // Optional source parameter
  
  if (window.VERBOSE_LOGGING) console.info(`Searching news for: "${query}", limit: ${limit}, country: ${country}`);
  
  try {
    // Build the URL with query parameters
    const baseUrl = "https://real-time-news-data.p.rapidapi.com/search";
    const params = new URLSearchParams({
      query: query,
      limit: limit,
      time_published: timePublished,
      country: country,
      lang: lang
    });
    
    // Add optional source parameter if provided
    if (source) {
      params.append("source", source);
    }    // Create a tracked controller for this request
    const controller = window.createNetworkController ? window.createNetworkController() : new AbortController();
      // Get RapidAPI key from tool API keys
    const rapidApiKey = window.getToolApiKey ? window.getToolApiKey('rapidapi') : null;
    
    if (!rapidApiKey) {
      return {
        query: query,
        notice: 'RapidAPI key not configured. Please enable the free version of the Real-Time News Data API at https://rapidapi.com/letscrape-6bRBa3QguO5/api/real-time-news-data and add your RapidAPI key in the Tools settings.',
        timestamp: new Date().toISOString()
      };
    }
    
    try {
      const response = await fetch(`${baseUrl}?${params.toString()}`, {
        method: "GET",
        headers: {
          "x-rapidapi-key": rapidApiKey,
          "x-rapidapi-host": "real-time-news-data.p.rapidapi.com"
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
      
      // Filter out sub_articles from each article
      const filteredArticles = (data.data || []).map(article => {
        const { sub_articles, ...filteredArticle } = article;
        return filteredArticle;
      });
      
      return {
        query: query,
        articles: filteredArticles,
        count: filteredArticles.length,
        timestamp: new Date().toISOString(),
        params: {
          country,
          lang,
          limit,
          time_published: timePublished,
          source: source || undefined
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
    console.error('Error searching news:', error);
    return {
      query: query,
      error: error.message || 'Unknown error searching news',
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Get headlines
 * @param {Object} args - Arguments for the tool
 * @returns {Promise<Object>} - The result
 */
async function getHeadlines(args) {
  const limit = args.limit || 10;
  const country = args.country || "US";
  const lang = args.lang || "en";
  
  if (window.VERBOSE_LOGGING) console.info(`Fetching ${limit} headlines for country: ${country}, language: ${lang}`);
  
  try {    const url = "https://real-time-news-data.p.rapidapi.com/top-headlines";
    const params = new URLSearchParams({
      limit: limit,
      country: country,
      lang: lang
    });
    
    // Create a tracked controller for this request
    const controller = window.createNetworkController ? window.createNetworkController() : new AbortController();
    
    // Get RapidAPI key from tool API keys
    const rapidApiKey = window.getToolApiKey ? window.getToolApiKey('rapidapi') : null;
    
    if (!rapidApiKey) {
      return {
        notice: 'RapidAPI key not configured. Please enable the free version of the Real-Time News Data API at https://rapidapi.com/letscrape-6bRBa3QguO5/api/real-time-news-data and add your RapidAPI key in the Tools settings.',
        timestamp: new Date().toISOString()
      };
    }
    
    try {
      const response = await fetch(`${url}?${params.toString()}`, {
        method: "GET",
        headers: {
          "x-rapidapi-key": rapidApiKey,
          "x-rapidapi-host": "real-time-news-data.p.rapidapi.com"
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
      
      // Filter out sub_articles from each headline
      const filteredHeadlines = (data.data || []).map(headline => {
        const { sub_articles, ...filteredHeadline } = headline;
        return filteredHeadline;
      });
      
      return {
        headlines: filteredHeadlines,
        count: filteredHeadlines.length,
        timestamp: new Date().toISOString(),
        params: {
          country,
          lang,
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
    console.error('Error fetching headlines:', error);
    return {
      error: error.message || 'Unknown error fetching headlines',
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Perform OpenAI search
 * @param {Object} args - Arguments for the tool
 * @returns {Promise<Object>} - The result
 */
async function openaiSearch(args) {
  const query = args.query;
  const country = args.country || "";
  const timezone = args.timezone || "America/New_York";
  
  if (window.VERBOSE_LOGGING) console.info(`Performing OpenAI search for: "${query}"`);
    try {
    // Get OpenAI API key from config
    const apiKey = window.config.services.openai.apiKey;
    
    if (!apiKey) {
      return {
        query: query,
        notice: 'OpenAI API key not configured. Please add your OpenAI API key in the API Keys settings.',
        timestamp: new Date().toISOString()
      };
    }
    
    const url = "https://api.openai.com/v1/chat/completions";
    const headers = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    };
    
    const data = {
      "model": "gpt-4o-search-preview",
      "messages": [
        {"role": "user", "content": query}
      ],
      "response_format": {
        "type": "json_schema",
        "json_schema": {
          "name": "search_results",
          "strict": true,
          "schema": {
            "type": "object",
            "properties": {
              "query": {"type": "string", "description": "The search query that was executed."},
              "total_results": {"type": "number", "description": "The total number of results found for the query."},
              "results": {
                "type": "array",
                "description": "An array of result objects that match the search query.",
                "items": {
                  "type": "object",
                  "properties": {
                    "title": {"type": "string", "description": "The title of the search result."},
                    "url": {"type": "string", "description": "The URL of the search result."},
                    "snippet": {"type": "string", "description": "A brief snippet or summary of the search result."}
                  },
                  "required": ["title", "url", "snippet"],
                  "additionalProperties": false
                }
              },
              "timestamp": {"type": "string", "description": "The time when the search was performed."}
            },
            "required": ["query", "total_results", "results", "timestamp"],
            "additionalProperties": false
          }
        }
      },
      "web_search_options": {
        "search_context_size": "medium",
        "user_location": {
          "type": "approximate",
          "approximate": {
            "country": country,
            "timezone": timezone
          }
        }
      },
      "store": false
    };
    
    const response = await fetch(url, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(data),
      timeout: 60000 // 60 seconds timeout
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}: ${await response.text()}`);
    }
    
    const resultData = await response.json();
    if (window.VERBOSE_LOGGING) console.info('Search results received:', resultData);
    
    // Return the search results content
    return {
      query: query,
      results: resultData.choices[0].message.content,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error(`Error performing OpenAI search:`, error);
    return {
      query: query,
      error: error.message || 'Unknown error during search',
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Get local headlines for a specific location
 * @param {Object} args - Arguments for the tool
 * @returns {Promise<Object>} - The result
 */
async function getLocalHeadlines(args) {
  const query = args.query;
  const limit = args.limit || 10;
  const country = args.country || "US";
  const lang = args.lang || "en";
  
  if (window.VERBOSE_LOGGING) console.info(`Fetching ${limit} local headlines for query: ${query}, country: ${country}, language: ${lang}`);
  
  try {    const url = "https://real-time-news-data.p.rapidapi.com/local-headlines";
    const params = new URLSearchParams({
      query: query,
      limit: limit,
      country: country,
      lang: lang
    });
      // Create a tracked controller for this request
    const controller = window.createNetworkController ? window.createNetworkController() : new AbortController();
    
    // Get RapidAPI key from tool API keys
    const rapidApiKey = window.getToolApiKey ? window.getToolApiKey('rapidapi') : null;
    
    if (!rapidApiKey) {
      return {
        query: query,
        notice: 'RapidAPI key not configured. Please enable the free version of the Real-Time News Data API at https://rapidapi.com/letscrape-6bRBa3QguO5/api/real-time-news-data and add your RapidAPI key in the Tools settings.',
        timestamp: new Date().toISOString()
      };
    }
    
    try {
      const response = await fetch(`${url}?${params.toString()}`, {
        method: "GET",
        headers: {
          "x-rapidapi-key": rapidApiKey,
          "x-rapidapi-host": "real-time-news-data.p.rapidapi.com"
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
      
      // Filter out sub_articles from each local headline
      const filteredLocalHeadlines = (data.data || []).map(headline => {
        const { sub_articles, ...filteredHeadline } = headline;
        return filteredHeadline;
      });
      
      return {
        query: query,
        localHeadlines: filteredLocalHeadlines,
        count: filteredLocalHeadlines.length,
        timestamp: new Date().toISOString(),
        params: {
          country,
          lang,
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
    console.error('Error fetching local headlines:', error);
    return {
      query: query,
      error: error.message || 'Unknown error fetching local headlines',
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Get full story coverage for a given story ID
 * @param {Object} args - Arguments for the tool
 * @returns {Promise<Object>} - The result
 */
async function getFullStoryCoverage(args) {
  const story_id = args.story_id;
  const sort = args.sort || "RELEVANCE";

  if (window.VERBOSE_LOGGING) console.info(`Fetching full story coverage for story ID: "${story_id}", sort: ${sort}`);

  try {    const baseUrl = "https://real-time-news-data.p.rapidapi.com/full-story-coverage";
    const params = new URLSearchParams({
      story_id: story_id,
      sort: sort
    });    const controller = window.createNetworkController ? window.createNetworkController() : new AbortController();

    // Get RapidAPI key from tool API keys
    const rapidApiKey = window.getToolApiKey ? window.getToolApiKey('rapidapi') : null;
    
    if (!rapidApiKey) {
      return {
        story_id: story_id,
        notice: 'RapidAPI key not configured. Please enable the free version of the Real-Time News Data API at https://rapidapi.com/letscrape-6bRBa3QguO5/api/real-time-news-data and add your RapidAPI key in the Tools settings.',
        timestamp: new Date().toISOString()
      };
    }

    try {
      const response = await fetch(`${baseUrl}?${params.toString()}`, {
        method: "GET",
        headers: {
          "x-rapidapi-key": rapidApiKey,
          "x-rapidapi-host": "real-time-news-data.p.rapidapi.com"
        },
        signal: controller.signal
      });

      if (window.removeNetworkController) {
        window.removeNetworkController(controller);
      }

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }      const data = await response.json();

      // Filter out sub_articles from each article
      const filteredArticles = (data.data || []).map(article => {
        const { sub_articles, ...filteredArticle } = article;
        return filteredArticle;
      });

      return {
        story_id: story_id,
        articles: filteredArticles,
        count: filteredArticles.length,
        timestamp: new Date().toISOString(),
        params: {
          sort
        }
      };
    } catch (error) {
      if (window.removeNetworkController) {
        window.removeNetworkController(controller);
      }
      if (error.name === 'AbortError' || window.shouldStopGeneration) {
        throw new Error('Request canceled');
      }
      throw error;
    }
  } catch (error) {
    console.error('Error fetching full story coverage:', error);
    return {
      story_id: story_id,
      error: error.message || 'Unknown error fetching full story coverage',
      timestamp: new Date().toISOString()
    };  }
}

/**
 * Google Custom Search Engine API
 * @param {Object} args - Arguments for the tool
 * @returns {Promise<Object>} - The result
 */
async function googleSearch(args) {
  const query = args.query;
  const num = Math.min(args.num || 10, 10); // Max 10 results per request
  const start = args.start || 1; // Starting index (1-based)
  const lr = args.lr || ""; // Language restriction
  const cr = args.cr || ""; // Country restriction
  const dateRestrict = args.dateRestrict || ""; // Date restriction
  const sort = args.sort || ""; // Sort order
  const searchType = args.searchType || ""; // image for image search
  const safe = args.safe || "off"; // Safe search level
  const siteSearch = args.siteSearch || ""; // Restrict to specific site
  const fileType = args.fileType || ""; // File type restriction

  if (window.VERBOSE_LOGGING) console.info(`Google search for: "${query}", num: ${num}, start: ${start}`);  try {
    // Get Google API key from main API keys or tool API keys
    const googleApiKey = window.getApiKey ? window.getApiKey('google') : null;
      if (!googleApiKey) {
      return {
        query: query,
        notice: 'Google API key not configured. Please enable the Custom Search API in your Google Cloud Console at https://console.cloud.google.com/apis/library/customsearch.googleapis.com and add your Google API key in the API Keys settings.',
        timestamp: new Date().toISOString()
      };
    }
    
    const baseUrl = "https://www.googleapis.com/customsearch/v1";
    const params = new URLSearchParams({
      key: googleApiKey,
      cx: GOOGLE_CX,
      q: query,
      num: num.toString(),
      start: start.toString(),
      safe: safe
    });

    // Add optional parameters
    if (lr) params.append("lr", lr);
    if (cr) params.append("cr", cr);
    if (dateRestrict) params.append("dateRestrict", dateRestrict);
    if (sort) params.append("sort", sort);
    if (searchType) params.append("searchType", searchType);
    if (siteSearch) params.append("siteSearch", siteSearch);
    if (fileType) params.append("fileType", fileType);

    const controller = window.createNetworkController ? window.createNetworkController() : new AbortController();

    try {
      const response = await fetch(`${baseUrl}?${params.toString()}`, {
        method: "GET",
        headers: {
          "Accept": "application/json"
        },
        signal: controller.signal
      });

      if (window.removeNetworkController) {
        window.removeNetworkController(controller);
      }

      if (!response.ok) {
        throw new Error(`Google API error: ${response.status}`);
      }

      const data = await response.json();

      return {
        query: query,
        searchInformation: data.searchInformation || {},
        items: data.items || [],
        count: (data.items || []).length,
        totalResults: data.searchInformation?.totalResults || "0",
        searchTime: data.searchInformation?.searchTime || 0,
        timestamp: new Date().toISOString(),
        params: {
          num,
          start,
          lr,
          cr,
          safe,
          searchType
        }
      };
    } catch (error) {
      if (window.removeNetworkController) {
        window.removeNetworkController(controller);
      }
      if (error.name === 'AbortError' || window.shouldStopGeneration) {
        throw new Error('Request canceled');
      }
      throw error;
    }
  } catch (error) {
    console.error('Error in Google search:', error);
    return {
      query: query,
      error: error.message || 'Unknown error in Google search',
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Search YouTube videos
 * @param {Object} args - Arguments for the tool
 * @returns {Promise<Object>} - The result
 */
async function youtubeSearch(args) {
  const query = args.query;
  const maxResults = Math.min(args.maxResults || 10, 50); // Max 50 results per request
  const order = args.order || "relevance"; // relevance, date, rating, viewCount, title
  const type = args.type || "video"; // video, channel, playlist
  const videoDuration = args.videoDuration || ""; // short, medium, long
  const publishedAfter = args.publishedAfter || ""; // RFC 3339 format
  const publishedBefore = args.publishedBefore || ""; // RFC 3339 format
  const regionCode = args.regionCode || ""; // ISO 3166-1 alpha-2 country code
  const relevanceLanguage = args.relevanceLanguage || ""; // ISO 639-1 language code
  if (window.VERBOSE_LOGGING) console.info(`YouTube search for: "${query}", maxResults: ${maxResults}, order: ${order}`);
  try {
    // Get Google API key from main API keys
    const googleApiKey = window.getApiKey ? window.getApiKey('google') : null;
    
    if (!googleApiKey) {
      return {
        query: query,
        notice: 'Google API key not configured. Please enable the YouTube Data API v3 in your Google Cloud Console at https://console.cloud.google.com/apis/library/youtube.googleapis.com and add your Google API key in the API Keys settings.',
        timestamp: new Date().toISOString()
      };
    }
    
    const baseUrl = "https://www.googleapis.com/youtube/v3/search";
    const params = new URLSearchParams({
      key: googleApiKey,
      q: query,
      part: "snippet",
      maxResults: maxResults.toString(),
      order: order,
      type: type
    });

    // Add optional parameters
    if (videoDuration) params.append("videoDuration", videoDuration);
    if (publishedAfter) params.append("publishedAfter", publishedAfter);
    if (publishedBefore) params.append("publishedBefore", publishedBefore);
    if (regionCode) params.append("regionCode", regionCode);
    if (relevanceLanguage) params.append("relevanceLanguage", relevanceLanguage);

    const controller = window.createNetworkController ? window.createNetworkController() : new AbortController();

    try {
      const response = await fetch(`${baseUrl}?${params.toString()}`, {
        method: "GET",
        headers: {
          "Accept": "application/json"
        },
        signal: controller.signal
      });

      if (window.removeNetworkController) {
        window.removeNetworkController(controller);
      }

      if (!response.ok) {
        throw new Error(`YouTube API error: ${response.status}`);
      }

      const data = await response.json();

      return {
        query: query,
        items: data.items || [],
        count: (data.items || []).length,
        totalResults: data.pageInfo?.totalResults || 0,
        resultsPerPage: data.pageInfo?.resultsPerPage || 0,
        nextPageToken: data.nextPageToken || null,
        timestamp: new Date().toISOString(),
        params: {
          maxResults,
          order,
          type,
          videoDuration,
          regionCode
        }
      };
    } catch (error) {
      if (window.removeNetworkController) {
        window.removeNetworkController(controller);
      }
      if (error.name === 'AbortError' || window.shouldStopGeneration) {
        throw new Error('Request canceled');
      }
      throw error;
    }
  } catch (error) {
    console.error('Error in YouTube search:', error);
    return {
      query: query,
      error: error.message || 'Unknown error in YouTube search',
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Get YouTube video details
 * @param {Object} args - Arguments for the tool
 * @returns {Promise<Object>} - The result
 */
async function youtubeVideoDetails(args) {
  const videoId = args.videoId;
  const parts = args.parts || "snippet,statistics,contentDetails"; // What details to retrieve

  if (window.VERBOSE_LOGGING) console.info(`Getting YouTube video details for ID: ${videoId}`);  try {
    // Get Google API key from main API keys
    const googleApiKey = window.getApiKey ? window.getApiKey('google') : null;
      if (!googleApiKey) {
      return {
        videoId: videoId,
        notice: 'Google API key not configured. Please enable the YouTube Data API v3 in your Google Cloud Console at https://console.cloud.google.com/apis/library/youtube.googleapis.com and add your Google API key in the API Keys settings.',
        timestamp: new Date().toISOString()
      };
    }
    
    const baseUrl = "https://www.googleapis.com/youtube/v3/videos";
    const params = new URLSearchParams({
      key: googleApiKey,
      id: videoId,
      part: parts
    });

    const controller = window.createNetworkController ? window.createNetworkController() : new AbortController();

    try {
      const response = await fetch(`${baseUrl}?${params.toString()}`, {
        method: "GET",
        headers: {
          "Accept": "application/json"
        },
        signal: controller.signal
      });

      if (window.removeNetworkController) {
        window.removeNetworkController(controller);
      }

      if (!response.ok) {
        throw new Error(`YouTube API error: ${response.status}`);
      }

      const data = await response.json();

      return {
        videoId: videoId,
        items: data.items || [],
        count: (data.items || []).length,
        timestamp: new Date().toISOString(),
        params: {
          parts
        }
      };
    } catch (error) {
      if (window.removeNetworkController) {
        window.removeNetworkController(controller);
      }
      if (error.name === 'AbortError' || window.shouldStopGeneration) {
        throw new Error('Request canceled');
      }
      throw error;
    }
  } catch (error) {
    console.error('Error getting YouTube video details:', error);
    return {
      videoId: videoId,
      error: error.message || 'Unknown error getting YouTube video details',
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Search for local businesses
 * @param {Object} args - Arguments for the tool
 * @returns {Promise<Object>} - The result
 */
async function localBusinessSearch(args) {
  const query = args.query;
  const limit = args.limit || 20;
  const lat = args.lat;
  const lng = args.lng;
  const zoom = args.zoom || 13;
  const language = args.language || "en";
  const region = args.region || "us";
  const extractEmailsAndContacts = args.extract_emails_and_contacts || false;
  const subtypes = args.subtypes || ""; // Business categories (comma-separated)
  const verified = args.verified || false; // Only verified businesses
  const businessStatus = args.business_status || ""; // OPEN, CLOSED_TEMPORARILY, CLOSED
  const fields = args.fields || ""; // Specific fields to include in response

  if (window.VERBOSE_LOGGING) console.info(`Searching local businesses for: "${query}", limit: ${limit}, lat: ${lat}, lng: ${lng}`);

  try {
    // Build the URL with query parameters
    const baseUrl = "https://local-business-data.p.rapidapi.com/search";
    const params = new URLSearchParams({
      query: query,
      limit: limit
    });

    // Add optional location parameters
    if (lat !== undefined) params.append("lat", lat);
    if (lng !== undefined) params.append("lng", lng);
    
    params.append("zoom", zoom);
    params.append("language", language);
    params.append("region", region);
    params.append("extract_emails_and_contacts", extractEmailsAndContacts);

    // Add optional parameters
    if (subtypes) params.append("subtypes", subtypes);
    if (verified) params.append("verified", verified);
    if (businessStatus) params.append("business_status", businessStatus);
    if (fields) params.append("fields", fields);

    // Create a tracked controller for this request
    const controller = window.createNetworkController ? window.createNetworkController() : new AbortController();

    // Get RapidAPI key from tool API keys
    const rapidApiKey = window.getToolApiKey ? window.getToolApiKey('rapidapi') : null;

    if (!rapidApiKey) {
      return {
        query: query,
        notice: 'RapidAPI key not configured. Please enable the Local Business Data API at https://rapidapi.com/letscrape-6bRBa3QguO5/api/local-business-data and add your RapidAPI key in the Tools settings.',
        timestamp: new Date().toISOString()
      };
    }

    try {
      const response = await fetch(`${baseUrl}?${params.toString()}`, {
        method: "GET",
        headers: {
          "x-rapidapi-key": rapidApiKey,
          "x-rapidapi-host": "local-business-data.p.rapidapi.com"
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
        query: query,
        businesses: data.data || [],
        count: (data.data || []).length,
        timestamp: new Date().toISOString(),        params: {
          limit,
          lat,
          lng,
          zoom,
          language,
          region,
          extract_emails_and_contacts: extractEmailsAndContacts,
          subtypes,
          verified,
          business_status: businessStatus,
          fields
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
    console.error('Error searching local businesses:', error);
    return {
      query: query,
      error: error.message || 'Unknown error searching local businesses',
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Get business details by business ID
 * @param {Object} args - Arguments for the tool
 * @returns {Promise<Object>} - The result
 */
async function getBusinessDetails(args) {
  const businessId = args.business_id;
  const extractEmailsAndContacts = args.extract_emails_and_contacts;
  const extractShareLink = args.extract_share_link;
  const fields = args.fields;
  const region = args.region;
  const language = args.language;

  if (window.VERBOSE_LOGGING) console.info(`Getting business details for ID: ${businessId}`);

  try {
    // Build the URL with query parameters
    const baseUrl = "https://local-business-data.p.rapidapi.com/business-details";
    const params = new URLSearchParams({
      business_id: businessId
    });

    // Add optional parameters only if provided
    if (extractEmailsAndContacts !== undefined) params.append("extract_emails_and_contacts", extractEmailsAndContacts);
    if (extractShareLink !== undefined) params.append("extract_share_link", extractShareLink);
    if (fields) params.append("fields", fields);
    if (region) params.append("region", region);
    if (language) params.append("language", language);

    // Create a tracked controller for this request
    const controller = window.createNetworkController ? window.createNetworkController() : new AbortController();

    // Get RapidAPI key from tool API keys
    const rapidApiKey = window.getToolApiKey ? window.getToolApiKey('rapidapi') : null;

    if (!rapidApiKey) {
      return {
        business_id: businessId,
        notice: 'RapidAPI key not configured. Please enable the Local Business Data API at https://rapidapi.com/letscrape-6bRBa3QguO5/api/local-business-data and add your RapidAPI key in the Tools settings.',
        timestamp: new Date().toISOString()
      };
    }

    try {
      const response = await fetch(`${baseUrl}?${params.toString()}`, {
        method: "GET",
        headers: {
          "x-rapidapi-key": rapidApiKey,
          "x-rapidapi-host": "local-business-data.p.rapidapi.com"
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
        business_id: businessId,
        business: data.data || {},
        timestamp: new Date().toISOString(),
        params: {
          extract_emails_and_contacts: extractEmailsAndContacts,
          extract_share_link: extractShareLink,
          fields,
          region,
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
    console.error('Error getting business details:', error);
    return {
      business_id: businessId,
      error: error.message || 'Unknown error getting business details',
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Get business reviews by business ID
 * @param {Object} args - Arguments for the tool
 * @returns {Promise<Object>} - The result
 */
async function getBusinessReviews(args) {
  const businessId = args.business_id;
  const limit = args.limit;
  const offset = args.offset;
  const translateReviews = args.translate_reviews;
  const query = args.query;
  const sortBy = args.sort_by;
  const fields = args.fields;
  const region = args.region;

  if (window.VERBOSE_LOGGING) console.info(`Getting business reviews for ID: ${businessId}`);

  try {
    // Build the URL with query parameters
    const baseUrl = "https://local-business-data.p.rapidapi.com/business-reviews";
    const params = new URLSearchParams({
      business_id: businessId
    });

    // Add optional parameters only if provided
    if (limit !== undefined) params.append("limit", limit);
    if (offset !== undefined) params.append("offset", offset);
    if (translateReviews !== undefined) params.append("translate_reviews", translateReviews);
    if (query) params.append("query", query);
    if (sortBy) params.append("sort_by", sortBy);
    if (fields) params.append("fields", fields);
    if (region) params.append("region", region);

    // Create a tracked controller for this request
    const controller = window.createNetworkController ? window.createNetworkController() : new AbortController();

    // Get RapidAPI key from tool API keys
    const rapidApiKey = window.getToolApiKey ? window.getToolApiKey('rapidapi') : null;

    if (!rapidApiKey) {
      return {
        business_id: businessId,
        notice: 'RapidAPI key not configured. Please enable the Local Business Data API at https://rapidapi.com/letscrape-6bRBa3QguO5/api/local-business-data and add your RapidAPI key in the Tools settings.',
        timestamp: new Date().toISOString()
      };
    }

    try {
      const response = await fetch(`${baseUrl}?${params.toString()}`, {
        method: "GET",
        headers: {
          "x-rapidapi-key": rapidApiKey,
          "x-rapidapi-host": "local-business-data.p.rapidapi.com"
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
        business_id: businessId,
        reviews: data.data || [],
        count: (data.data || []).length,
        timestamp: new Date().toISOString(),
        params: {
          limit,
          offset,
          translate_reviews: translateReviews,
          query,
          sort_by: sortBy,
          fields,
          region
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
    console.error('Error getting business reviews:', error);
    return {
      business_id: businessId,
      error: error.message || 'Unknown error getting business reviews',
      timestamp: new Date().toISOString()
    };
  }
}

// Register the tool implementations
window.toolImplementations.search_news = searchNews;
window.toolImplementations.headlines = getHeadlines;
window.toolImplementations.local_headlines = getLocalHeadlines;
window.toolImplementations.openai_search = openaiSearch;
window.toolImplementations.full_story_coverage = getFullStoryCoverage;
window.toolImplementations.google_search = googleSearch;
window.toolImplementations.youtube_search = youtubeSearch;
window.toolImplementations.youtube_video_details = youtubeVideoDetails;
window.toolImplementations.local_business_search = localBusinessSearch;
window.toolImplementations.get_business_details = getBusinessDetails;
window.toolImplementations.get_business_reviews = getBusinessReviews;
