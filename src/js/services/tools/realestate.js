/**
 * Real estate and rental property tool implementations
 */

// Ensure the toolImplementations object exists
window.toolImplementations = window.toolImplementations || {};

/**
 * Search for rental properties using the Zillow API
 * @param {Object} args - Arguments for the tool
 * @returns {Promise<Object>} - The result
 */
async function searchRentalProperties(args) {
  const location = args.location || 'New York, NY';
  const page = args.page || 1;
  const sortBy = args.sortBy || 'relevance';
  const price = args.price;
  const bedrooms = args.bedrooms;
  const minBathrooms = args.minBathrooms;
  const homeTypes = args.homeTypes;
  const moveInDate = args.moveInDate;
  const rentalAmenities = args.rentalAmenities;
  const popularFilters = args.popularFilters;
  const homeSize = args.homeSize;
  const lotSize = args.lotSize;
  const yearBuilt = args.yearBuilt;
  const basementTypes = args.basementTypes;
  const amenities = args.amenities;
  const views = args.views;
  const timeOnZillow = args.timeOnZillow;
  const keywords = args.keywords;

  if (window.VERBOSE_LOGGING) console.info(`Searching rental properties for: "${location}", page: ${page}, sortBy: ${sortBy}`);

  try {
    // Build the request body
    const requestBody = {
      location: location,
      page: page,
      sortBy: sortBy
    };

    // Add optional parameters if provided
    if (price) requestBody.price = price;
    if (bedrooms) requestBody.bedrooms = bedrooms;
    if (minBathrooms !== undefined) requestBody.minBathrooms = minBathrooms;
    if (homeTypes) requestBody.homeTypes = homeTypes;
    if (moveInDate) requestBody.moveInDate = moveInDate;
    if (rentalAmenities) requestBody.rentalAmenities = rentalAmenities;
    if (popularFilters) requestBody.popularFilters = popularFilters;
    if (homeSize) requestBody.homeSize = homeSize;
    if (lotSize) requestBody.lotSize = lotSize;
    if (yearBuilt) requestBody.yearBuilt = yearBuilt;
    if (basementTypes) requestBody.basementTypes = basementTypes;
    if (amenities) requestBody.amenities = amenities;
    if (views) requestBody.views = views;
    if (timeOnZillow) requestBody.timeOnZillow = timeOnZillow;
    if (keywords) requestBody.keywords = keywords;

    // Create a tracked controller for this request
    const controller = window.createNetworkController ? window.createNetworkController() : new AbortController();

    // Get RapidAPI key from tool API keys
    const rapidApiKey = window.getToolApiKey ? window.getToolApiKey('rapidapi') : null;

    if (!rapidApiKey) {
      return {
        location: location,
        notice: 'RapidAPI key not configured. Please subscribe to the Zillow API at https://rapidapi.com/Glavier/api/zillow-com4 and add your RapidAPI key in the Tools settings.',
        timestamp: new Date().toISOString()
      };
    }

    try {
      const response = await fetch('https://zillow-com4.p.rapidapi.com/v2/properties/search-for-rent', {
        method: 'POST',
        headers: {
          'x-rapidapi-key': rapidApiKey,
          'x-rapidapi-host': 'zillow-com4.p.rapidapi.com',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody),
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
        location: location,
        page: page,
        sortBy: sortBy,
        properties: data.props || data.results || data,
        count: Array.isArray(data.props) ? data.props.length : Array.isArray(data.results) ? data.results.length : 0,
        totalResults: data.totalResultCount || data.totalCount || 'unknown',
        timestamp: new Date().toISOString(),
        params: {
          page,
          sortBy,
          price,
          bedrooms,
          minBathrooms,
          homeTypes,
          moveInDate,
          rentalAmenities,
          popularFilters,
          homeSize,
          lotSize,
          yearBuilt,
          basementTypes,
          amenities,
          views,
          timeOnZillow,
          keywords
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
    console.error('Error searching rental properties:', error);
    return {
      location: location,
      page: page,
      error: error.message || 'Unknown error searching rental properties',
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Get detailed information about a specific property using Zillow Property ID (ZPID)
 * @param {Object} args - Arguments for the tool
 * @returns {Promise<Object>} - The result
 */
async function getPropertyDetails(args) {
  const zpid = args.zpid;

  if (window.VERBOSE_LOGGING) console.info(`Getting property details for ZPID: ${zpid}`);

  try {
    if (!zpid) {
      return {
        zpid: zpid,
        error: 'Property ID (zpid) is required',
        timestamp: new Date().toISOString()
      };
    }

    // Create a tracked controller for this request
    const controller = window.createNetworkController ? window.createNetworkController() : new AbortController();

    // Get RapidAPI key from tool API keys
    const rapidApiKey = window.getToolApiKey ? window.getToolApiKey('rapidapi') : null;

    if (!rapidApiKey) {
      return {
        zpid: zpid,
        notice: 'RapidAPI key not configured. Please subscribe to the Zillow API at https://rapidapi.com/Glavier/api/zillow-com4 and add your RapidAPI key in the Tools settings.',
        timestamp: new Date().toISOString()
      };
    }

    try {
      const response = await fetch(`https://zillow-com4.p.rapidapi.com/v2/properties/detail?zpid=${zpid}`, {
        method: 'GET',
        headers: {
          'x-rapidapi-key': rapidApiKey,
          'x-rapidapi-host': 'zillow-com4.p.rapidapi.com'
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
        zpid: zpid,
        property: data.data || data,
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
    console.error('Error getting property details:', error);
    return {
      zpid: zpid,
      error: error.message || 'Unknown error getting property details',
      timestamp: new Date().toISOString()
    };
  }
}

// Register the tool implementations
window.toolImplementations.search_rental_properties = searchRentalProperties;
window.toolImplementations.get_property_details = getPropertyDetails;
