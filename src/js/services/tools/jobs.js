/**
 * Job search tool implementations
 */

// Ensure the toolImplementations object exists
window.toolImplementations = window.toolImplementations || {};

/**
 * Search for job listings using the JSearch API
 * @param {Object} args - Arguments for the tool
 * @returns {Promise<Object>} - The result
 */
async function searchJobs(args) {
  const query = args.query || 'developer jobs';
  const page = args.page || 1;
  const numPages = args.num_pages || 1;
  const country = args.country || 'us';
  const datePosted = args.date_posted || 'all';
  const workFromHome = args.work_from_home;
  const employmentTypes = args.employment_types;
  const jobRequirements = args.job_requirements;
  const radius = args.radius;
  const excludeJobPublishers = args.exclude_job_publishers;
  const fields = args.fields;
  
  if (window.VERBOSE_LOGGING) console.info(`Searching jobs for: "${query}", page: ${page}, country: ${country}`);
  
  try {
    // Build the URL with parameters
    const baseUrl = 'https://jsearch.p.rapidapi.com/search';
    const params = new URLSearchParams({
      query: query,
      page: page.toString(),
      num_pages: numPages.toString(),
      country: country,
      date_posted: datePosted
    });

    // Add optional parameters if provided
    if (workFromHome !== undefined) {
      params.append('work_from_home', workFromHome.toString());
    }
    if (employmentTypes) {
      params.append('employment_types', employmentTypes);
    }
    if (jobRequirements) {
      params.append('job_requirements', jobRequirements);
    }
    if (radius) {
      params.append('radius', radius.toString());
    }
    if (excludeJobPublishers) {
      params.append('exclude_job_publishers', excludeJobPublishers);
    }
    if (fields) {
      params.append('fields', fields);
    }

    // Create a tracked controller for this request
    const controller = window.createNetworkController ? window.createNetworkController() : new AbortController();
    
    // Get RapidAPI key from tool API keys
    const rapidApiKey = window.getToolApiKey ? window.getToolApiKey('rapidapi') : null;
    
    if (!rapidApiKey) {
      return {
        query: query,
        page: page,
        notice: 'RapidAPI key not configured. Please inform the user that they need to subscribe to the JSearch API at https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch and add their RapidAPI key in the Tools settings.',
        timestamp: new Date().toISOString()
      };
    }
    
    try {
      const response = await fetch(`${baseUrl}?${params.toString()}`, {
        method: 'GET',
        headers: {
          'x-rapidapi-key': rapidApiKey,
          'x-rapidapi-host': 'jsearch.p.rapidapi.com'
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
        page: page,
        results: data.data || [],
        count: (data.data || []).length,
        status: data.status,
        request_id: data.request_id,
        parameters: data.parameters,
        timestamp: new Date().toISOString(),
        params: {
          page,
          num_pages: numPages,
          country,
          date_posted: datePosted,
          work_from_home: workFromHome,
          employment_types: employmentTypes,
          job_requirements: jobRequirements,
          radius,
          exclude_job_publishers: excludeJobPublishers,
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
    console.error('Error searching jobs:', error);
    return {
      query: query,
      page: page,
      error: error.message || 'Unknown error searching jobs',
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Get detailed information about a specific job posting
 * @param {Object} args - Arguments for the tool
 * @returns {Promise<Object>} - The result
 */
async function getJobDetails(args) {
  const jobId = args.job_id;
  const country = args.country || 'us';
  const language = args.language;
  const fields = args.fields;
  
  if (window.VERBOSE_LOGGING) console.info(`Getting job details for ID: ${jobId}, country: ${country}`);
  
  try {
    if (!jobId) {
      return {
        job_id: jobId,
        error: 'Job ID is required',
        timestamp: new Date().toISOString()
      };
    }

    // Build the URL with parameters
    const baseUrl = 'https://jsearch.p.rapidapi.com/job-details';
    const params = new URLSearchParams({
      job_id: jobId,
      country: country
    });

    // Add optional parameters if provided
    if (language) {
      params.append('language', language);
    }
    if (fields) {
      params.append('fields', fields);
    }

    // Create a tracked controller for this request
    const controller = window.createNetworkController ? window.createNetworkController() : new AbortController();
    
    // Get RapidAPI key from tool API keys
    const rapidApiKey = window.getToolApiKey ? window.getToolApiKey('rapidapi') : null;
    
    if (!rapidApiKey) {
      return {
        job_id: jobId,
        notice: 'RapidAPI key not configured. Please inform the user that they need to subscribe to the JSearch API at https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch and add their RapidAPI key in the Tools settings.',
        timestamp: new Date().toISOString()
      };
    }
    
    try {
      const response = await fetch(`${baseUrl}?${params.toString()}`, {
        method: 'GET',
        headers: {
          'x-rapidapi-key': rapidApiKey,
          'x-rapidapi-host': 'jsearch.p.rapidapi.com'
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
        job_id: jobId,
        data: data.data || data,
        status: data.status,
        request_id: data.request_id,
        parameters: data.parameters,
        timestamp: new Date().toISOString(),
        params: {
          country,
          language,
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
    console.error('Error getting job details:', error);
    return {
      job_id: jobId,
      error: error.message || 'Unknown error getting job details',
      timestamp: new Date().toISOString()
    };
  }
}

// Register the tool implementations
window.toolImplementations.search_jobs = searchJobs;
window.toolImplementations.get_job_details = getJobDetails;
