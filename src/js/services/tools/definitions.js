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
  },
  {
    type: "function",
    function: {
      name: "stock_prices",
      description: "Fetches real-time and historical stock price data for a specified ticker symbol.",
      parameters: {
        type: "object",
        properties: {
          symbol: {
            type: "string",
            description: "The stock ticker symbol (e.g., AAPL, MSFT, GOOGL)"
          },
          dataType: {
            type: "string",
            enum: ["quote", "daily", "weekly", "monthly"],
            description: "The type of data to retrieve (quote for real-time, or historical time series)"
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
  }
];

// The getToolsDescription function has been moved to tools.js for dynamic tool management
