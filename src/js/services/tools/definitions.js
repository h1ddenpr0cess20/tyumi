/**
 * Tool definitions for function calling
 */

/**
 * Define available tools for function calling
 */
window.toolDefinitions = [
  {
    type: "function",
    function: {
      name: "search_news",
      description: "Search for news articles on specific topics or keywords",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "The search query to find relevant news articles (e.g., 'Elon Musk', 'xAI', 'cryptocurrency')."
          },
          limit: {
            type: "number",
            description: "Maximum number of news articles to return. Default is 10, max is 500."
          },          time_published: {
            type: "string",
            enum: ["anytime", "1h", "1d", "7d", "1y", "rapid_do_not_include_in_request_key"],
            description: "Filter articles by publication time. Default is 'anytime'."
          },
          country: {
            type: "string",
            description: "Country code to get news for. Default is 'US'."
          },
          lang: {
            type: "string",
            description: "Language code for the results (e.g., 'en' for English). Default is 'en'."
          },
          source: {
            type: "string",
            description: "Optional: Domain of the source to filter by (e.g., 'cnn.com')."
          }
        },
        required: ["query"],
        additionalProperties: false
      },
      strict: false
    }
  },
  {
    type: "function",
    function: {
      name: "headlines",
      description: "Fetch top headlines from around the world or from a specific country",
      parameters: {
        type: "object",
        properties: {
          limit: {
            type: "number",
            description: "Number of articles to get. Default is 10."
          },
          country: {
            type: "string",
            description: "Country to get news for. Default is 'US'"
          },
          lang: {
            type: "string",
            description: "Language. Default is 'en'"
          }
        },
        required: [],
        additionalProperties: false
      },
      strict: false
    }
  },
  {
    type: "function",
    function: {
      name: "local_headlines",
      description: "Fetch local news headlines for a specific location or city",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Area, city or country to fetch news for (e.g., 'New York', 'London')."
          },
          limit: {
            type: "number",
            description: "Maximum number of news articles to return. Default is 10, max is 500."
          },
          country: {
            type: "string",
            description: "Country code to get news for. Default is 'US'."
          },
          lang: {
            type: "string",
            description: "Language code for the results (e.g., 'en' for English). Default is 'en'."
          }
        },
        required: ["query"],
        additionalProperties: false
      },
      strict: false
    }
  },  {
    type: "function",
    function: {
      name: "full_story_coverage",
      description: "Fetches full coverage for a specific news story ID.",
      parameters: {
        type: "object",
        properties: {
          story_id: {
            type: "string",
            description: "The ID of the story to get full coverage for. Story IDs can be obtained from a News Story URL."
          },
          sort: {
            type: "string",
            enum: ["RELEVANCE", "DATE"],
            description: "Sort order for the articles. Defaults to RELEVANCE."
          }
        },
        required: ["story_id"],
        additionalProperties: false
      },
      strict: false
    }
  },  // {
  //   type: "function",
  //   function: {
  //     name: "stock_prices",
  //     description: "Fetches real-time and historical stock price data for a specified ticker symbol.",
  //     parameters: {
  //       type: "object",
  //       properties: {
  //         symbol: {
  //           type: "string",
  //           description: "The stock ticker symbol (e.g., AAPL, MSFT, GOOGL)"
  //         },
  //         dataType: {
  //           type: "string",
  //           enum: ["quote", "daily", "weekly", "monthly"],
  //           description: "The type of data to retrieve (quote for real-time, or historical time series)"
  //         }
  //       },
  //       required: ["symbol"],
  //       additionalProperties: false
  //     },
  //     strict: false
  //   }
  // },
  {
    type: "function",
    function: {
      name: "weather",
      description: "Get the current weather for a location",
      parameters: {
        type: "object",
        properties: {
          location: {
            type: "string",
            description: "The city and state, e.g. San Francisco, California, or a city name (e.g. London)"
          },
          unit: {
            type: "string",
            enum: ["celsius", "fahrenheit"],
            description: "The unit of temperature"
          }
        },
        required: ["location"],
        additionalProperties: false
      },
        strict: false
    }  
  },
  {
    type: "function",
    function: {
      name: "crypto_prices",
      description: "Fetches the conversion rate for a cryptocurrency (e.g., BTC, ETH) to a target currency (default: USD).",
      parameters: {
        type: "object",
        properties: {
          currency: {
            type: "string",
            description: "The cryptocurrency symbol (e.g., BTC, ETH) for which the conversion rate is being fetched."
          },
          to: {
            type: "string",
            description: "The target currency symbol (e.g., USD, EUR) to convert to. Defaults to USD.",
            default: "USD"
          }
        },
        required: ["currency"],
        additionalProperties: false
      },
      strict: false
    }
  },  {
    type: "function",
    function: {
      name: "openai_search",
      description: "Perform a web search using OpenAI's search capability and return structured search results.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "The search query to execute."
          },
          country: {
            type: "string",
            description: "Optional: The country code to localize search results (e.g., US, GB, CA)."
          },
          timezone: {
            type: "string",
            description: "Optional: The timezone for the search. Defaults to America/New_York.",
            default: "America/New_York"
          }
        },
        required: ["query"],
        additionalProperties: false
      },
      strict: false
    }
  },
  {
    type: "function",
    function: {
      name: "grok_image",
      description: "Generates an image using xAI (Grok) image generation API.",
      parameters: {
        type: "object",
        properties: {
          prompt: {
            type: "string",
            description: "A text description of the image to generate, formulated from the user's request and conversation context."
          }
        },
        required: ["prompt"],
        additionalProperties: false
      },
      strict: false
    }
  },
  {
    type: "function",
    function: {
      name: "gemini_image",
      description: "Generates an image using Google Gemini image generation API.",
      parameters: {
        type: "object",
        properties: {
          prompt: {
            type: "string",
            description: "A text description of the image to generate, formulated from the user's request and conversation context."
          }
        },
        required: ["prompt"],
        additionalProperties: false
      },
      strict: false
    }
  },
  {
    type: "function",
    function: {
      name: "openai_image",
      description: "Generates an image using OpenAI's gpt-image-1 image generation API",
      parameters: {
        type: "object",
        properties: {
          prompt: {
            type: "string",
            description: "A text description of the image to generate, formulated from the user's request and conversation context."
          },
          quality: {
            type: "string",
            enum: ["low", "medium", "high"],
            description: "The quality of the generated image.  Defaults to medium."
          }
        },
        required: ["prompt"],
        additionalProperties: false
      },
      strict: false
    }
  },
  {
    type: "function",
    function: {
      name: "openai_image_edit",
      description: "Edits or extends existing images using OpenAI's GPT-Image-1 image editing API",
      parameters: {
        type: "object",
        properties: {          
          images: {
            oneOf: [
              {
                type: "string",
                description: "A single image ID from storage to edit"
              },
              {
                type: "array",
                items: {
                  type: "string"
                },
                description: "Array of image IDs from storage to edit (up to 16 images for gpt-image-1)"
              }
            ],
            description: "The image(s) to edit, most often only needs the most recently generated image in the chat history. Can be a single image ID or an array of image IDs."
          },
          prompt: {
            type: "string",
            description: "A text description of the desired edited image(s)."
          },          
          mask: {
            type: "string",
            description: "Optional: A data URL of an image whose transparent areas indicate where the source image should be edited. Must start with 'data:image/'."
          },
          background: {
            type: "string",
            enum: ["transparent", "opaque", "auto"],
            description: "Optional: Set transparency for the background. Default is auto."
          },
          n: {
            type: "number",
            description: "Optional: Number of images to generate. Must be between 1 and 10. Default is 1."
          },
          quality: {
            type: "string",
            enum: ["low", "medium", "high"],
            description: "Optional: The quality of the generated image. Default is medium."
          },
          size: {
            type: "string",
            enum: ["1024x1024", "1536x1024", "1024x1536", "auto"],
            description: "Optional: The size of the generated images. Default is auto."
          },
          user: {
            type: "string",
            description: "Optional: A unique identifier representing your end-user, which can help OpenAI to monitor and detect abuse."
          }
        },
        required: ["images", "prompt"],
        additionalProperties: false
      },      strict: false
    }
  },
  {
    type: "function",
    function: {
      name: "google_search",
      description: "Search the web using Google.  You can display images in your response using markdown tags and embed videos using html iframe tags.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "The search query to find relevant web results"
          },
          num: {
            type: "number",
            description: "Number of search results to return (1-10). Default is 10."
          },
          start: {
            type: "number", 
            description: "Starting index for results (1-based). Default is 1. Use for pagination."
          },
          lr: {
            type: "string",
            description: "Language restriction (e.g., 'lang_en' for English, 'lang_es' for Spanish)"
          },
          cr: {
            type: "string",
            description: "Country restriction (e.g., 'countryUS' for United States, 'countryGB' for UK)"
          },
          dateRestrict: {
            type: "string",
            description: "Date restriction (e.g., 'd1' for past day, 'w1' for past week, 'm1' for past month, 'y1' for past year)"
          },
          sort: {
            type: "string",
            description: "Sort order (e.g., 'date' to sort by date)"
          },
          searchType: {
            type: "string",
            enum: ["image"],
            description: "Type of search. Use 'image' for image search, omit for web search"
          },
          safe: {
            type: "string",
            enum: ["active", "off"],
            description: "Safe search level. Default is 'off'"
          },
          siteSearch: {
            type: "string",
            description: "Restrict search to a specific site (e.g., 'reddit.com', 'github.com')"
          },
          fileType: {
            type: "string",
            description: "File type restriction (e.g., 'pdf', 'doc', 'ppt')"
          }
        },
        required: ["query"],
        additionalProperties: false
      },      strict: false
    }
  },
  {
    type: "function",
    function: {
      name: "youtube_search",
      description: "Search for YouTube videos, channels, or playlists.  Please embed video results in your response using html <iframe> tags.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "The search query to find relevant YouTube content"
          },
          maxResults: {
            type: "number",
            description: "Number of search results to return (1-50). Default is 10."
          },
          order: {
            type: "string",
            enum: ["relevance", "date", "rating", "viewCount", "title"],
            description: "Sort order for results. Default is 'relevance'."
          },
          type: {
            type: "string",
            enum: ["video", "channel", "playlist"],
            description: "Type of content to search for. Default is 'video'."
          },
          videoDuration: {
            type: "string",
            enum: ["short", "medium", "long"],
            description: "Filter by video duration. Only applies when type is 'video'."
          },
          publishedAfter: {
            type: "string",
            description: "Filter videos published after this date (RFC 3339 format, e.g., '2023-01-01T00:00:00Z')"
          },
          publishedBefore: {
            type: "string",
            description: "Filter videos published before this date (RFC 3339 format, e.g., '2023-12-31T23:59:59Z')"
          },
          regionCode: {
            type: "string",
            description: "ISO 3166-1 alpha-2 country code to restrict results (e.g., 'US', 'GB')"
          },
          relevanceLanguage: {
            type: "string",
            description: "ISO 639-1 language code for result relevance (e.g., 'en', 'es')"
          }
        },
        required: ["query"],
        additionalProperties: false
      },
      strict: false
    }
  },
  {
    type: "function",
    function: {
      name: "youtube_video_details",
      description: "Get detailed information about a specific YouTube video",
      parameters: {
        type: "object",
        properties: {
          videoId: {
            type: "string",
            description: "The YouTube video ID (e.g., 'dQw4w9WgXcQ')"
          },
          parts: {
            type: "string",
            description: "Comma-separated list of video parts to retrieve (e.g., 'snippet,statistics,contentDetails'). Default includes basic info, stats, and duration."
          }
        },
        required: ["videoId"],
        additionalProperties: false
      },
      strict: false
    }
  },
  {
    type: "function",
    function: {
      name: "search_recipes",
      description: "Search for recipes using keywords or ingredients",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "The search query for recipes (e.g., 'pasta', 'chicken curry', 'chocolate cake')"
          },
          from: {
            type: "number",
            description: "Starting index for pagination. Default is 0."
          },
          size: {
            type: "number",
            description: "Number of recipes to return. Default is 10, maximum is 40."
          }        },
        required: ["query"],
        additionalProperties: false
      },
      strict: false
    }
  },  {
    type: "function",
    function: {
      name: "search_tweets",
      description: "Search for tweets by keyword, hashtag, or phrase. Returns recent tweets matching the search criteria.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "The search query for tweets (e.g., 'AI technology', '#OpenAI', 'from:elonmusk')"
          },
          limit: {
            type: "number",
            description: "Number of tweets to return. Default is 20, maximum is 100."
          },
          section: {
            type: "string",
            enum: ["top", "latest", "people", "photos", "videos"],
            description: "Type of search results. Default is 'top'."
          },
          min_retweets: {
            type: "number",
            description: "Minimum number of retweets required. Default is 0."
          },
          min_likes: {
            type: "number",
            description: "Minimum number of likes required. Default is 0."
          }
        },
        required: ["query"],
        additionalProperties: false
      },
      strict: false
    }
  },
  {
    type: "function",
    function: {
      name: "get_user_profile",
      description: "Get detailed profile information for a Twitter/X user by username.",
      parameters: {
        type: "object",
        properties: {
          username: {
            type: "string",
            description: "The username (without @) of the Twitter/X user to get profile information for"
          }
        },
        required: ["username"],
        additionalProperties: false
      },
      strict: false
    }
  },  {
    type: "function",
    function: {
      name: "get_user_tweets",
      description: "Get recent tweets from a specific Twitter/X user.",
      parameters: {
        type: "object",
        properties: {
          username: {
            type: "string",
            description: "The username (without @) of the Twitter/X user to get tweets from"
          },
          limit: {
            type: "number",
            description: "Number of tweets to return. Default is 20, maximum is 100."
          },
          user_id: {
            type: "string",
            description: "Optional: The user ID of the Twitter/X user (can be used instead of or alongside username)"
          },
          include_replies: {
            type: "boolean",
            description: "Whether to include reply tweets. Default is false."
          },
          include_pinned: {
            type: "boolean",
            description: "Whether to include pinned tweets. Default is false."
          }
        },
        required: ["username"],
        additionalProperties: false
      },
      strict: false
    }
  },{
    type: "function",
    function: {
      name: "get_trending_topics",
      description: "Get current trending topics and hashtags on Twitter/X for a specific location using Where On Earth ID (WOEID).",
      parameters: {
        type: "object",
        properties: {
          woeid: {
            type: "number",
            description: "Where On Earth ID for the location. Common values: 1 (Worldwide), 23424977 (US), 23424975 (UK), 23424856 (Japan). Default is 1 (Worldwide)."
          }
        },
        required: [],
        additionalProperties: false
      },
      strict: false
    }
  },
  {
    type: "function",
    function: {
      name: "get_tweet_details",
      description: "Get detailed information about a specific tweet including replies, likes, retweets, and other metrics.",
      parameters: {
        type: "object",
        properties: {
          tweet_id: {
            type: "string",
            description: "The ID of the tweet to get detailed information for"
          }
        },
        required: ["tweet_id"],
        additionalProperties: false
      },
      strict: false
    }
  },
  {
    type: "function",
    function: {
      name: "search_users",
      description: "Search for Twitter/X users by username or display name.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "The search query for users (username or display name)"
          },
          limit: {
            type: "number",
            description: "Number of users to return. Default is 20, maximum is 50."
          }
        },        required: ["query"],
        additionalProperties: false
      },
      strict: false
    }
  },
  {
    type: "function",
    function: {
      name: "search_imdb",
      description: "Search for movies, TV shows, actors, and other entertainment content using the IMDB database.",
      parameters: {
        type: "object",
        properties: {
          searchTerm: {
            type: "string",
            description: "The search term for movies, TV shows, actors, etc. (e.g., 'Tom Cruise', 'Inception', 'Breaking Bad')"
          },          type: {
            type: "string",
            enum: ["VIDEO_GAME", "PODCAST_SERIES", "TV_EPISODE", "TV", "MOVIE", "NAME"],
            description: "Type of content to search for. Optional parameter."
          },
          first: {
            type: "number",
            description: "Number of results to return. Default is 20, maximum is 50."
          },
          country: {
            type: "string",
            description: "Country code for localized results (e.g., 'US', 'UK'). Default is 'US'."
          },
          language: {
            type: "string",
            description: "Language code for results (e.g., 'en-US', 'es-ES'). Default is 'en-US'."
          }
        },
        required: ["searchTerm"],
        additionalProperties: false
      },
      strict: false
    }
  },  {
    type: "function",
    function: {
      name: "get_title_details",
      description: "Get detailed information about a specific movie or TV show using IMDB title ID",
      parameters: {
        type: "object",
        properties: {
          titleId: {
            type: "string",
            description: "IMDB title ID (must start with 'tt', e.g., 'tt0120338')"
          },
          country: {
            type: "string",
            description: "Country code (optional, default: 'US')"
          },
          language: {
            type: "string",
            description: "Language code (optional, default: 'en-US')"
          }
        },
        required: ["titleId"],
        additionalProperties: false
      },
      strict: false
    }
  },
  {
    type: "function",
    function: {
      name: "get_actor_details",
      description: "Get detailed information about a specific actor or person using IMDB person ID",
      parameters: {
        type: "object",
        properties: {
          personId: {
            type: "string",
            description: "IMDB person ID (must start with 'nm', e.g., 'nm0000138')"
          },
          first: {
            type: "number",
            description: "Number of items per response for paging purpose (default: 20, max: 50)"
          },
          country: {
            type: "string",
            description: "Country code (optional, default: 'US')"
          },
          language: {
            type: "string",
            description: "Language code (optional, default: 'en-US')"
          }
        },
        required: ["personId"],
        additionalProperties: false
      },
      strict: false
    }
  },
  {
    type: "function",
    function: {
      name: "steam_search_games",
      description: "Search for Steam games by term with pagination support",
      parameters: {
        type: "object",
        properties: {
          term: {
            type: "string",
            description: "The search term to find Steam games (e.g., 'Counter Strike', 'Half-Life', 'RPG')"
          },
          page: {
            type: "number",
            description: "Page number for pagination (default: 1)"
          }
        },
        required: ["term"],
        additionalProperties: false
      },
      strict: false
    }
  },
  {
    type: "function",
    function: {
      name: "steam_get_app_details",
      description: "Get detailed information about a specific Steam app/game using Steam App ID",
      parameters: {
        type: "object",
        properties: {
          appId: {
            type: "string",
            description: "Steam App ID (e.g., '730' for Counter-Strike 2, '570' for Dota 2)"
          }
        },
        required: ["appId"],
        additionalProperties: false
      },
      strict: false
    }
  },
  {
    type: "function",
    function: {
      name: "steam_get_app_reviews",
      description: "Get user reviews for a specific Steam app/game with pagination support",
      parameters: {
        type: "object",
        properties: {
          appId: {
            type: "string",
            description: "Steam App ID to get reviews for (e.g., '730' for Counter-Strike 2)"
          },
          limit: {
            type: "number",
            description: "Maximum number of reviews to return (default: 40, max: 200)"
          },
          cursor: {
            type: "string",
            description: "Cursor for pagination - use value returned from previous response for next batch"
          }
        },
        required: ["appId"],
        additionalProperties: false
      },
      strict: false
    }
  },
  {
    type: "function",
    function: {
      name: "twelve_data_price",
      description: "Get real-time stock and cryptocurrency prices using twelve-data API",
      parameters: {
        type: "object",
        properties: {
          symbol: {
            type: "string",
            description: "The stock ticker symbol or cryptocurrency symbol (e.g., AAPL, MSFT, AMZN, BTC/USD, ETH/EUR)"
          },
          format: {
            type: "string",
            enum: ["json", "csv"],
            description: "Response format. Default is json."
          },
          outputsize: {
            type: "number",
            description: "Number of data points to return. Default is 30."
          }
        },
        required: ["symbol"],
        additionalProperties: false
      },
      strict: false
    }
  },
  {
    type: "function",
    function: {
      name: "twelve_data_quote",
      description: "Get stock quote or cryptocurrency quote with time series data using twelve-data API",
      parameters: {
        type: "object",
        properties: {
          symbol: {
            type: "string",
            description: "The stock ticker or cryptocurrency symbol (e.g., AAPL, MSFT, AMZN, BTC/USD, ETH/EUR)"
          },
          interval: {
            type: "string",
            enum: ["1min", "5min", "15min", "30min", "45min", "1h", "2h", "4h", "1day", "1week", "1month"],
            description: "Time interval for the data"
          },
          format: {
            type: "string",
            enum: ["json", "csv"],
            description: "Response format. Default is json."          },
          outputsize: {
            type: "number",
            description: "Number of data points to return. Default is 30."
          }
        },
        required: ["symbol", "interval"],
        additionalProperties: false
      },
      strict: false
    }
  },
  {
    type: "function",
    function: {
      name: "local_business_search",
      description: "Search for local businesses by query, location, and various filters. Returns business information including names, addresses, ratings, and contact details.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Search query for businesses (e.g., 'Hotels in San Francisco', 'Pizza near me', 'Plumbers in New York')"
          },
          limit: {
            type: "number",
            description: "Maximum number of businesses to return. Default is 20."
          },
          lat: {
            type: "number",
            description: "Latitude coordinate for location-based search"
          },
          lng: {
            type: "number", 
            description: "Longitude coordinate for location-based search"
          },
          zoom: {
            type: "number",
            description: "Zoom level for the search area. Default is 13."
          },
          language: {
            type: "string",
            description: "Language code for results (e.g., 'en', 'es'). Default is 'en'."
          },
          region: {
            type: "string", 
            description: "Region code (e.g., 'us', 'gb'). Default is 'us'."
          },
          extract_emails_and_contacts: {
            type: "boolean",
            description: "Whether to extract contact information. Default is false."
          },
          subtypes: {
            type: "string",
            description: "Comma-separated business categories to filter by (e.g., 'Plumber,Carpenter,Electrician')"
          },
          verified: {
            type: "boolean",
            description: "Whether to return only verified businesses. Default is false."
          },
          business_status: {
            type: "string",
            enum: ["OPEN", "CLOSED_TEMPORARILY", "CLOSED"],
            description: "Filter businesses by operational status"
          },
          fields: {
            type: "string",
            description: "Comma-separated list of specific fields to include in response (e.g., 'business_id,type,phone_number,full_address')"
          }
        },
        required: ["query"],
        additionalProperties: false
      },
      strict: false
    }
  },
  {
    type: "function",
    function: {
      name: "get_business_details",
      description: "Get detailed information about a specific business using its business ID. Returns comprehensive business data including contact info, hours, reviews summary, and more.",
      parameters: {
        type: "object",
        properties: {
          business_id: {
            type: "string",
            description: "Unique business identifier (obtained from local_business_search results)"
          },
          extract_emails_and_contacts: {
            type: "boolean",
            description: "Whether to extract contact information and social profiles"
          },
          extract_share_link: {
            type: "boolean",
            description: "Whether to extract the business's shareable Google Maps link"
          },
          fields: {
            type: "string",
            description: "Comma-separated list of specific fields to include in response"
          },
          region: {
            type: "string",
            description: "Region code for the query (e.g., 'us', 'gb')"
          },
          language: {
            type: "string",
            description: "Language code for results (e.g., 'en', 'es')"
          }
        },
        required: ["business_id"],
        additionalProperties: false
      },
      strict: false
    }
  },
  {
    type: "function",
    function: {
      name: "get_business_reviews",
      description: "Get customer reviews for a specific business using its business ID. Supports filtering, sorting, and pagination of reviews.",
      parameters: {
        type: "object",
        properties: {
          business_id: {
            type: "string",
            description: "Unique business identifier (obtained from local_business_search results)"
          },
          limit: {
            type: "number",
            description: "Maximum number of reviews to return (typically 1-1000)"
          },
          offset: {
            type: "number",
            description: "Number of reviews to skip for pagination"
          },
          translate_reviews: {
            type: "boolean",
            description: "Whether to translate reviews to the specified language"
          },
          query: {
            type: "string",
            description: "Return only reviews containing specific text/keywords"
          },
          sort_by: {
            type: "string",
            enum: ["most_relevant", "newest", "highest_ranking", "lowest_ranking"],
            description: "How to sort the reviews. Default is 'most_relevant'."
          },
          fields: {
            type: "string",
            description: "Comma-separated list of specific review fields to include"
          },
          region: {
            type: "string",
            description: "Region code for the query (e.g., 'us', 'gb')"
          }
        },
        required: ["business_id"],
        additionalProperties: false
      },
      strict: false
    }
  },
  {
    type: "function",
    function: {
      name: "search_jobs",
      description: "Search for job listings by query, location, and various filters. Returns job information including titles, companies, locations, descriptions, and application links.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Free-form jobs search query. It is highly recommended to include job title and location as part of the query. (e.g., 'web development jobs in chicago', 'marketing manager in new york via linkedin')"
          },
          page: {
            type: "number",
            description: "Page to return (each page includes up to 10 results). Default is 1, allowed values: 1-100"
          },
          num_pages: {
            type: "number",
            description: "Number of pages to return, starting from page. Default is 1, allowed values: 1-20"
          },
          country: {
            type: "string",
            description: "Country code of the country from which to return job postings. Default is 'us'"
          },
          date_posted: {
            type: "string",
            enum: ["all", "today", "3days", "week", "month"],
            description: "Find jobs posted within the time you specify. Default is 'all'"
          },
          work_from_home: {
            type: "boolean",
            description: "Only return work from home / remote jobs. Default is false"
          },
          employment_types: {
            type: "string",
            description: "Find jobs of particular employment types, specified as a comma delimited list of the following values: FULLTIME, CONTRACTOR, PARTTIME, INTERN"
          },
          job_requirements: {
            type: "string",
            description: "Find jobs with specific requirements, specified as a comma delimited list of the following values: under_3_years_experience, more_than_3_years_experience, no_experience, no_degree"
          },
          radius: {
            type: "number",
            description: "Return jobs within a certain distance from location as specified as part of the query (in km). This internally sent as the Google 'rad' parameter and although it might affect the results, it is not strictly followed by Google for Jobs."
          },
          exclude_job_publishers: {
            type: "string",
            description: "Exclude jobs published by specific publishers, specified as a comma (,) separated list of publishers to exclude."
          },
          fields: {
            type: "string",
            description: "A comma separated list of job fields to include in the response (field projection). By default all fields are returned."
          }
        },
        required: ["query"],
        additionalProperties: false
      },
      strict: false
    }
  },
  {
    type: "function",
    function: {
      name: "get_job_details",
      description: "Get detailed information about a specific job posting using the job ID",
      parameters: {
        type: "object",
        properties: {
          job_id: {
            type: "string",
            description: "Job ID of the job for which to get details. Batching of up to 20 Job Ids is supported by separating multiple Job Ids by comma (,). Note that each Job Id in a batch request is counted as a request for quota calculation."
          },
          country: {
            type: "string",
            description: "Country code of the country from which to return job posting. Default is 'us'"
          },
          language: {
            type: "string",
            description: "Language code in which to return job postings. Leave empty to use the primary language in the specified country (country parameter)."
          },
          fields: {
            type: "string",
            description: "A comma separated list of job fields to include in the response (field projection). By default all fields are returned."
          }
        },
        required: ["job_id"],
        additionalProperties: false
      },
      strict: false
    }
  },
  {
    type: "function",
    function: {
      name: "search_rental_properties",
      description: "Search for rental properties using Zillow API. Returns detailed rental listings with pricing, location, amenities, and property details.",
      parameters: {
        type: "object",
        properties: {
          location: {
            type: "string",
            description: "Enter an address, neighborhood, city, or ZIP code (e.g., 'New York, NY', 'Brooklyn, NY', '10001')"
          },
          page: {
            type: "number",
            description: "The page index, for paging purpose. Default is 1."
          },
          sortBy: {
            type: "string",
            enum: ["relevance", "recentlyChanged", "daysOn", "priceHighToLow", "priceLowToHigh", "beds", "baths", "livingArea", "lotArea", "yearBuilt"],
            description: "Sort order for the results. Default is 'relevance'."
          },
          price: {
            type: "object",
            description: "Price range filter. Example: {\"min\":60000,\"max\":240000} or {\"max\":240000} or {\"min\":60000}"
          },
          bedrooms: {
            type: "object",
            description: "Bedrooms filter. Example: {\"min\":0,\"max\":2} or {\"max\":2} or {\"min\":0}. Values for bedrooms from 0 to 5"
          },
          minBathrooms: {
            type: "number",
            description: "Minimum number of bathrooms. Values: 1, 1.5, 2, 3, 4"
          },
          homeTypes: {
            type: "array",
            items: {
              type: "string",
              enum: ["houses", "townhomes", "apartmentsCondosCoops"]
            },
            description: "Types of homes to include. Options: houses, townhomes, apartmentsCondosCoops"
          },
          moveInDate: {
            type: "object",
            description: "Move-in date filter. Example: {\"availableBefore\": \"2023-11-18\", \"hideListings\": true}. availableBefore: The date has the format YYYY-MM-DD, hideListings: true/false"
          },
          rentalAmenities: {
            type: "array",
            items: {
              type: "string",
              enum: ["allowsLargeDogs", "allowsSmallDogs", "allowsCats", "onSiteParking", "inUnitLaundry", "incomeRestricted", "apartmentCommunity", "acceptsZillowApplications"]
            },
            description: "Rental amenities to filter by"
          },
          popularFilters: {
            type: "array",
            items: {
              type: "string",
              enum: ["3dTourOnly", "singleStoryHomesOnly"]
            },
            description: "Popular filters: 3D tour only, single-story homes only"
          },
          homeSize: {
            type: "object",
            description: "Home size filter in square feet. Example: {\"min\":500,\"max\":2500} or {\"max\":2500} or {\"min\":500}"
          },
          lotSize: {
            type: "object",
            description: "Lot size filter. 1 acre = 43560 sqft. Example: {\"min\":1000,\"max\":2000} or {\"max\":2000} or {\"min\":1000}"
          },
          yearBuilt: {
            type: "object",
            description: "Year built filter. Example: {\"min\":2009,\"max\":2020} or {\"max\":2020} or {\"min\":2009}. Values from 1900 to current year"
          },
          basementTypes: {
            type: "array",
            items: {
              type: "string",
              enum: ["finished", "unFinished"]
            },
            description: "Basement types: finished, unFinished"
          },
          amenities: {
            type: "array",
            items: {
              type: "string",
              enum: ["mustHaveAC", "mustHavePool", "onWaterfront"]
            },
            description: "Property amenities: must have A/C, must have pool, on waterfront"
          },
          views: {
            type: "array",
            items: {
              type: "string",
              enum: ["city", "mountain", "park", "water"]
            },
            description: "Property views: city, mountain, park, water"
          },
          timeOnZillow: {
            type: "string",
            enum: ["1d", "1w", "2w", "1m", "2m", "6m", "12m", "24m", "36m"],
            description: "Time on Zillow filter. Options: 1d (1 day), 1w (1 week), 2w (1 weeks), 1m (1 month), 2m (2 months), 6m (6 months), 12m (12 months), 24m (24 months), 36m (36 months)"
          },
          keywords: {
            type: "string",
            description: "Keywords: Backyard, fireplace, horses, MLS#, etc."
          }
        },
        required: ["location"],
        additionalProperties: false
      },
      strict: false
    }
  },
  {
    type: "function",
    function: {
      name: "get_property_details",
      description: "Get detailed information about a specific property using Zillow Property ID (ZPID). Returns comprehensive property data including price, features, history, and location details.",
      parameters: {
        type: "object",
        properties: {
          zpid: {
            type: "string",
            description: "Zillow Property ID (ZPID) - a unique identifier for the property. Can be found in Zillow URLs or from rental search results."
          }
        },
        required: ["zpid"],
        additionalProperties: false
      },
      strict: false
    }
  },
  {
    type: "function",
    function: {
      name: "search_spotify",
      description: "Search for music content on Spotify including tracks, albums, artists, playlists, podcasts, and more. Returns detailed music information with previews and metadata.",
      parameters: {
        type: "object",
        properties: {
          q: {
            type: "string",
            description: "Search query for music content (e.g., 'The Beatles', 'Bohemian Rhapsody', 'jazz playlist')"
          },
          type: {
            type: "string",
            enum: ["multi", "albums", "artists", "episodes", "genres", "playlists", "podcasts", "tracks", "users"],
            description: "Type of content to search for. 'multi' searches all types. Default is 'multi'."
          },
          offset: {
            type: "number",
            description: "The index of the first result to return. Default is 0."
          },
          limit: {
            type: "number",
            description: "The maximum number of results to return. Default is 10."
          },
          numberOfTopResults: {
            type: "number",
            description: "Number of top results to return. Default is 5."
          },
          gl: {
            type: "string",
            description: "Country code for localized results (e.g., 'US', 'GB', 'DE'). Default is 'US'."
          }
        },
        required: ["q"],
        additionalProperties: false
      },
      strict: false
    }
  },
  {
    type: "function",
    function: {
      name: "get_spotify_albums",
      description: "Get detailed information about specific Spotify albums using their album IDs. Returns comprehensive album data including tracks, artists, release info, and metadata.",
      parameters: {
        type: "object",
        properties: {
          ids: {
            type: "string",
            description: "Album IDs (you can use commas to separate multiple IDs). Example: '3IBcaUcj5M2A6lTeffJzdv' or '3IBcaUcj5M2A6lTeffJzdv,4aawyAB9vmqN3uQ7FjRGTy'"
          }
        },
        required: ["ids"],
        additionalProperties: false
      },
      strict: false
    }
  },
  {
    type: "function",
    function: {
      name: "get_spotify_artists",
      description: "Get detailed information about specific Spotify artists using their artist IDs. Returns comprehensive artist data including follower counts, genres, popularity, and metadata.",
      parameters: {
        type: "object",
        properties: {
          ids: {
            type: "string",
            description: "Artist IDs (you can use commas to separate multiple IDs). Example: '4Z8W4fKeB5YxbusRsdQVPb' or '4Z8W4fKeB5YxbusRsdQVPb,06HL4z0CvFAxyc27GXpf02'"
          }
        },
        required: ["ids"],
        additionalProperties: false
      },
      strict: false
    }
  },
  {
    type: "function",
    function: {
      name: "get_spotify_artist_overview",
      description: "Get comprehensive overview information about a specific Spotify artist including their top tracks, albums, related artists, and detailed profile information.",
      parameters: {
        type: "object",
        properties: {
          id: {
            type: "string",
            description: "Spotify artist ID. Example: '4Z8W4fKeB5YxbusRsdQVPb'"
          },
          gl: {
            type: "string",
            description: "Country code for localized results (e.g., 'US', 'GB', 'DE'). Default is 'US'."
          }
        },
        required: ["id"],
        additionalProperties: false
      },
      strict: false
    }
  },
  {
    type: "function",
    function: {
      name: "get_spotify_related_artists",
      description: "Get artists related to a specific Spotify artist. Returns a list of similar artists based on musical style and listener preferences.",
      parameters: {
        type: "object",
        properties: {
          id: {
            type: "string",
            description: "Spotify artist ID. Example: '4Z8W4fKeB5YxbusRsdQVPb'"
          }
        },
        required: ["id"],
        additionalProperties: false
      },
      strict: false
    }
  },
  {
    type: "function",
    function: {
      name: "get_spotify_artist_albums",
      description: "Get albums for a specific Spotify artist with pagination support. Returns a list of albums by the artist including singles, albums, and compilations.",
      parameters: {
        type: "object",
        properties: {
          id: {
            type: "string",
            description: "Spotify artist ID. Example: '4Z8W4fKeB5YxbusRsdQVPb'"
          },
          offset: {
            type: "number",
            description: "The index of the first album to return. Default is 0."
          },
          limit: {
            type: "number",
            description: "The maximum number of albums to return. Default is 100."
          }
        },
        required: ["id"],
        additionalProperties: false
      },
      strict: false
    }
  }
];

