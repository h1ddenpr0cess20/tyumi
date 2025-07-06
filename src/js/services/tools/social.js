/**
 * Social media tool implementations (Twitter/X)
 */

// Ensure the toolImplementations object exists
window.toolImplementations = window.toolImplementations || {};

/**
 * Search for tweets by keyword, hashtag, or phrase
 * @param {Object} args - Arguments for the tool
 * @returns {Promise<Object>} - The result
 */
async function searchTweets(args) {
  const query = args.query;
  const limit = Math.min(args.limit || 20, 100); // Limit to 100 tweets max
  const section = args.section || "top"; // top, latest, people, photos, videos
  const min_retweets = args.min_retweets || 0;
  const min_likes = args.min_likes || 0;
  
  if (window.VERBOSE_LOGGING) console.info(`Searching tweets for: "${query}", limit: ${limit}, section: ${section}`);
  
  try {
    const baseUrl = "https://twitter154.p.rapidapi.com/search/search";
    const params = new URLSearchParams({
      query: query,
      section: section,
      min_retweets: min_retweets,
      min_likes: min_likes,
      limit: limit
    });
    
    // Create a tracked controller for this request
    const controller = window.createNetworkController ? window.createNetworkController() : new AbortController();
    
    // Get RapidAPI key from tool API keys
    const rapidApiKey = window.getToolApiKey ? window.getToolApiKey('rapidapi') : null;
    
    if (!rapidApiKey) {
      return {
        query: query,
        notice: 'RapidAPI key not configured. Please inform the user that they need to subscribe to the The Old Bird API at https://rapidapi.com/datahungrybeast/api/twitter154 and add their RapidAPI key in the Tools settings.',
        timestamp: new Date().toISOString()
      };
    }
    
    try {
      const response = await fetch(`${baseUrl}?${params.toString()}`, {
        method: "GET",
        headers: {
          "x-rapidapi-key": rapidApiKey,
          "x-rapidapi-host": "twitter154.p.rapidapi.com"
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
        tweets: data.results || [],
        count: (data.results || []).length,
        timestamp: new Date().toISOString(),
        params: {
          section,
          limit,
          min_retweets,
          min_likes
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
    console.error('Error searching tweets:', error);
    return {
      query: query,
      error: error.message || 'Unknown error searching tweets',
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Get user profile information
 * @param {Object} args - Arguments for the tool
 * @returns {Promise<Object>} - The result
 */
async function getUserProfile(args) {
  const username = args.username;
  
  if (window.VERBOSE_LOGGING) console.info(`Getting user profile for: ${username}`);
  
  try {
    const baseUrl = "https://twitter154.p.rapidapi.com/user/details";
    const params = new URLSearchParams({
      username: username
    });
    
    // Create a tracked controller for this request
    const controller = window.createNetworkController ? window.createNetworkController() : new AbortController();
    
    // Get RapidAPI key from tool API keys
    const rapidApiKey = window.getToolApiKey ? window.getToolApiKey('rapidapi') : null;
    
    if (!rapidApiKey) {
      return {
        username: username,
        notice: 'RapidAPI key not configured. Please inform the user that they need to subscribe to the The Old Bird API at https://rapidapi.com/datahungrybeast/api/twitter154 and add their RapidAPI key in the Tools settings.',
        timestamp: new Date().toISOString()
      };
    }
    
    try {
      const response = await fetch(`${baseUrl}?${params.toString()}`, {
        method: "GET",
        headers: {
          "x-rapidapi-key": rapidApiKey,
          "x-rapidapi-host": "twitter154.p.rapidapi.com"
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
        username: username,
        profile: data,
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
    console.error('Error getting user profile:', error);
    return {
      username: username,
      error: error.message || 'Unknown error getting user profile',
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Get user's recent tweets
 * @param {Object} args - Arguments for the tool
 * @returns {Promise<Object>} - The result
 */
async function getUserTweets(args) {
  const username = args.username;
  const limit = Math.min(args.limit || 20, 100); // Limit to 100 tweets max
  const user_id = args.user_id; // Optional user ID
  const include_replies = args.include_replies || false;
  const include_pinned = args.include_pinned || false;
  
  if (window.VERBOSE_LOGGING) console.info(`Getting tweets for user: ${username}, limit: ${limit}`);
  
  try {
    const baseUrl = "https://twitter154.p.rapidapi.com/user/tweets";
    const params = new URLSearchParams({
      username: username,
      limit: limit,
      include_replies: include_replies.toString(),
      include_pinned: include_pinned.toString()
    });
    
    // Add user_id if provided
    if (user_id) {
      params.append("user_id", user_id);
    }
    
    // Create a tracked controller for this request
    const controller = window.createNetworkController ? window.createNetworkController() : new AbortController();
    
    // Get RapidAPI key from tool API keys
    const rapidApiKey = window.getToolApiKey ? window.getToolApiKey('rapidapi') : null;
      if (!rapidApiKey) {
      return {
        username: username,
        notice: 'RapidAPI key not configured. Please inform the user that they need to subscribe to the The Old Bird API at https://rapidapi.com/datahungrybeast/api/twitter154 and add their RapidAPI key in the Tools settings.',
        timestamp: new Date().toISOString()
      };
    }
    
    try {
      const response = await fetch(`${baseUrl}?${params.toString()}`, {
        method: "GET",
        headers: {
          "x-rapidapi-key": rapidApiKey,
          "x-rapidapi-host": "twitter154.p.rapidapi.com"
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
        username: username,
        tweets: data.results || [],
        count: (data.results || []).length,
        timestamp: new Date().toISOString(),
        params: {
          limit,
          user_id,
          include_replies,
          include_pinned
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
    console.error('Error getting user tweets:', error);
    return {
      username: username,
      error: error.message || 'Unknown error getting user tweets',
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Get trending topics/hashtags
 * @param {Object} args - Arguments for the tool
 * @returns {Promise<Object>} - The result
 */
async function getTrendingTopics(args) {
  const woeid = args.woeid || 1; // Where On Earth ID (1 = Worldwide)
  
  if (window.VERBOSE_LOGGING) console.info(`Getting trending topics for WOEID: ${woeid}`);
  
  try {
    const baseUrl = `https://twitter154.p.rapidapi.com/trends/?woeid=${woeid}`;
    
    // Create a tracked controller for this request
    const controller = window.createNetworkController ? window.createNetworkController() : new AbortController();
    
    // Get RapidAPI key from tool API keys
    const rapidApiKey = window.getToolApiKey ? window.getToolApiKey('rapidapi') : null;
      if (!rapidApiKey) {
      return {
        woeid: woeid,
        notice: 'RapidAPI key not configured. Please inform the user that they need to subscribe to the The Old Bird API at https://rapidapi.com/datahungrybeast/api/twitter154 and add their RapidAPI key in the Tools settings.',
        timestamp: new Date().toISOString()
      };
    }
    
    try {
      const response = await fetch(baseUrl, {
        method: "GET",
        headers: {
          "x-rapidapi-key": rapidApiKey,
          "x-rapidapi-host": "twitter154.p.rapidapi.com"
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
        woeid: woeid,
        trends: data || [],
        count: (data || []).length,
        timestamp: new Date().toISOString(),
        params: {
          woeid
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
    console.error('Error getting trending topics:', error);
    return {
      woeid: woeid,
      error: error.message || 'Unknown error getting trending topics',
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Get detailed information about a specific tweet
 * @param {Object} args - Arguments for the tool
 * @returns {Promise<Object>} - The result
 */
async function getTweetDetails(args) {
  const tweet_id = args.tweet_id;
  
  if (window.VERBOSE_LOGGING) console.info(`Getting tweet details for ID: ${tweet_id}`);
  
  try {
    const baseUrl = "https://twitter154.p.rapidapi.com/tweet/details";
    const params = new URLSearchParams({
      tweet_id: tweet_id
    });
    
    // Create a tracked controller for this request
    const controller = window.createNetworkController ? window.createNetworkController() : new AbortController();
    
    // Get RapidAPI key from tool API keys
    const rapidApiKey = window.getToolApiKey ? window.getToolApiKey('rapidapi') : null;
    
    if (!rapidApiKey) {
      return {
        tweet_id: tweet_id,
        notice: 'RapidAPI key not configured. Please inform the user that they need to subscribe to the The Old Bird API at https://rapidapi.com/datahungrybeast/api/twitter154 and add their RapidAPI key in the Tools settings.',
        timestamp: new Date().toISOString()
      };
    }
    
    try {
      const response = await fetch(`${baseUrl}?${params.toString()}`, {
        method: "GET",
        headers: {
          "x-rapidapi-key": rapidApiKey,
          "x-rapidapi-host": "twitter154.p.rapidapi.com"
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
        tweet_id: tweet_id,
        tweet: data,
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
    console.error('Error getting tweet details:', error);
    return {
      tweet_id: tweet_id,
      error: error.message || 'Unknown error getting tweet details',
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Search for users by username or display name
 * @param {Object} args - Arguments for the tool
 * @returns {Promise<Object>} - The result
 */
async function searchUsers(args) {
  const query = args.query;
  const limit = Math.min(args.limit || 20, 50); // Limit to 50 users max
  
  if (window.VERBOSE_LOGGING) console.info(`Searching users for: "${query}", limit: ${limit}`);
  
  try {
    const baseUrl = "https://twitter154.p.rapidapi.com/search/users";
    const params = new URLSearchParams({
      query: query,
      limit: limit
    });
    
    // Create a tracked controller for this request
    const controller = window.createNetworkController ? window.createNetworkController() : new AbortController();
    
    // Get RapidAPI key from tool API keys
    const rapidApiKey = window.getToolApiKey ? window.getToolApiKey('rapidapi') : null;
    
    if (!rapidApiKey) {
      return {
        query: query,
        notice: 'RapidAPI key not configured. Please inform the user that they need to subscribe to the The Old Bird API at https://rapidapi.com/datahungrybeast/api/twitter154 and add their RapidAPI key in the Tools settings.',
        timestamp: new Date().toISOString()
      };
    }
    
    try {
      const response = await fetch(`${baseUrl}?${params.toString()}`, {
        method: "GET",
        headers: {
          "x-rapidapi-key": rapidApiKey,
          "x-rapidapi-host": "twitter154.p.rapidapi.com"
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
        users: data.results || [],
        count: (data.results || []).length,
        timestamp: new Date().toISOString(),
        params: {
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
    console.error('Error searching users:', error);
    return {
      query: query,
      error: error.message || 'Unknown error searching users',
      timestamp: new Date().toISOString()
    };
  }
}

// Register the tool implementations
window.toolImplementations.search_tweets = searchTweets;
window.toolImplementations.get_user_profile = getUserProfile;
window.toolImplementations.get_user_tweets = getUserTweets;
window.toolImplementations.get_trending_topics = getTrendingTopics;
window.toolImplementations.get_tweet_details = getTweetDetails;
window.toolImplementations.search_users = searchUsers;
