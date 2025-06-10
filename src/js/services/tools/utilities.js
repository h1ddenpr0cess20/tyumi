/**
 * Utility tool implementations (weather, time, etc.)
 */

// Ensure the toolImplementations object exists
window.toolImplementations = window.toolImplementations || {};

/**
 * Get weather information from OpenWeatherMap API
 * @param {Object} args - Arguments for the tool
 * @returns {Promise<Object>} - The result
 */
async function getWeather(args) {
  if (window.VERBOSE_LOGGING) console.info(`Getting weather for location: ${args.location}`);
  
  // Default to fahrenheit if not specified
  const unit = args.unit || 'fahrenheit';
  const unitSystem = unit === 'celsius' ? 'metric' : 'imperial';
  const unitSymbol = unit === 'celsius' ? '°C' : '°F';
  
  try {
    // Retrieve API Key from storage
    const apiKey = window.getToolApiKey ? window.getToolApiKey('openweather') : null;
    if (!apiKey) {
      throw new Error('OpenWeather API key not configured. Please add your OpenWeather API key in the Tools settings.');
    }
    
    // First, get coordinates for the location using geocoding API
    // Create a tracked controller for this request
    const geoController = window.createNetworkController ? window.createNetworkController() : new AbortController();
    
    try {
      // Step 1: Get coordinates from location name
      const geoUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(args.location)}&limit=1&appid=${apiKey}`;
      
      const geoResponse = await fetch(geoUrl, {
        method: 'GET',
        signal: geoController.signal
      });
      
      // Remove from tracking
      if (window.removeNetworkController) {
        window.removeNetworkController(geoController);
      }
      
      if (!geoResponse.ok) {
        throw new Error(`Geocoding API error: ${geoResponse.status}`);
      }
      
      const geoData = await geoResponse.json();
      
      if (!geoData || geoData.length === 0) {
        throw new Error(`Location "${args.location}" not found`);
      }
      
      // Extract coordinates
      const { lat, lon, name, country } = geoData[0];
      const locationName = `${name}, ${country}`;
      
      if (window.VERBOSE_LOGGING) console.info(`Found coordinates for ${locationName}: lat=${lat}, lon=${lon}`);
      
      // Step 2: Get weather data using coordinates
      // Create a tracked controller for this request
      const weatherController = window.createNetworkController ? window.createNetworkController() : new AbortController();
      
      const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=${unitSystem}&appid=${apiKey}`;
      
      const response = await fetch(weatherUrl, {
        method: 'GET',
        signal: weatherController.signal
      });
      
      // Remove from tracking
      if (window.removeNetworkController) {
        window.removeNetworkController(weatherController);
      }
      
      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Format the weather data
      return {
        temperature: Math.round(data.main.temp),
        unit: unit,
        conditions: data.weather[0].description,
        location: `${data.name}, ${data.sys.country}`,
        humidity: data.main.humidity,
        feels_like: Math.round(data.main.feels_like),
        wind: {
          speed: data.wind.speed,
          unit: unitSystem === 'metric' ? 'm/s' : 'mph',
          direction: getWindDirection(data.wind.deg)
        },
        pressure: data.main.pressure,
        visibility: (data.visibility / 1000).toFixed(1) + ' km',
        sunrise: formatTime(data.sys.sunrise * 1000),
        sunset: formatTime(data.sys.sunset * 1000),
        forecast: `Current conditions are ${data.weather[0].description} with a temperature of ${Math.round(data.main.temp)}${unitSymbol}.`,
        timestamp: new Date().toISOString()
      };    } catch (error) {
      // Remove from tracking in case of error
      if (window.removeNetworkController) {
        window.removeNetworkController(weatherController);
      }
      
      // If aborted, don't retry
      if (error.name === 'AbortError' || window.shouldStopGeneration) {
        throw new Error('Request canceled');
      }
      
      throw error;
    }
  } catch (error) {
    console.error('Weather API error:', error);
    return {
      error: true,
      message: error.message || 'Failed to fetch weather data',
      location: args.location,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Format timestamp to readable time
 * @param {number} timestamp - Timestamp in milliseconds
 * @returns {string} - Formatted time string
 */
function formatTime(timestamp) {
  return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/**
 * Get wind direction from degree
 * @param {number} degree - Wind direction in degrees
 * @returns {string} - Cardinal direction
 */
function getWindDirection(degree) {
  const directions = ['North', 'NE', 'East', 'SE', 'South', 'SW', 'West', 'NW'];
  return directions[Math.round(degree / 45) % 8];
}

/**
 * Get current time (Commented out as it's now included in system prompts)
 * @param {Object} args - Arguments for the tool
 * @returns {Promise<Object>} - The result
 */
/*
async function getCurrentTime(args) {
  if (window.VERBOSE_LOGGING) console.info('Getting current time');
  const now = new Date();
  return { 
    date: now.toISOString().split('T')[0],
    time: now.toISOString(),
    formatted: now.toLocaleString(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  };
}
*/

// Register the tool implementations
window.toolImplementations.weather = getWeather;
// window.toolImplementations.get_current_time = getCurrentTime;
