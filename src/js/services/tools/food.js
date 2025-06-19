/**
 * Food and recipe-related tool implementations
 */

// Ensure the toolImplementations object exists
window.toolImplementations = window.toolImplementations || {};

/**
 * Search for recipes using the Tasty API
 * @param {Object} args - Arguments for the tool
 * @returns {Promise<Object>} - The result
 */
async function searchRecipes(args) {
  try {
    const query = args.query || args.q || '';
    const from = args.from || 0;
    const size = Math.min(args.size || 10, 40); // Limit to 40 results max
    
    if (window.VERBOSE_LOGGING) console.info(`Searching for recipes: ${query}`);
    
    // Get RapidAPI key from tool API keys
    const apiKey = window.getToolApiKey ? window.getToolApiKey('rapidapi') : null;
    
    if (!apiKey) {
      return {
        query: query,
        notice: 'RapidAPI key not configured and/or service not set up. Please subscribe to the free plan at https://rapidapi.com/apidojo/api/tasty and/or add your RapidAPI key in the Tools settings.',
        timestamp: new Date().toISOString()
      };
    }
    
    const url = `https://tasty.p.rapidapi.com/recipes/list?from=${from}&size=${size}&q=${encodeURIComponent(query)}`;
    const options = {
      method: 'GET',
      headers: {
        'x-rapidapi-key': apiKey,
        'x-rapidapi-host': 'tasty.p.rapidapi.com'
      }
    };
    
    const response = await fetch(url, options);
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    
    // Check for API errors
    if (data.error) {
      throw new Error(data.error);
    }
    
    // Process the results to extract useful information
    const recipes = data.results || [];
    const processedRecipes = recipes.map(recipe => ({
      id: recipe.id,
      name: recipe.name,
      description: recipe.description,
      thumbnail_url: recipe.thumbnail_url,
      video_url: recipe.video_url,
      cook_time_minutes: recipe.cook_time_minutes,
      prep_time_minutes: recipe.prep_time_minutes,
      total_time_minutes: recipe.total_time_minutes,
      servings: recipe.num_servings,
      difficulty: recipe.difficulty,
      tags: recipe.tags ? recipe.tags.map(tag => tag.name) : [],
      nutrition: recipe.nutrition,
      instructions: recipe.instructions ? recipe.instructions.map(inst => inst.display_text) : [],
      ingredients: recipe.sections ? recipe.sections.flatMap(section => 
        section.components ? section.components.map(comp => comp.raw_text) : []
      ) : []
    }));
    
    if (window.VERBOSE_LOGGING) console.info(`Found ${processedRecipes.length} recipes for "${query}"`);
    
    return {
      query: query,
      from: from,
      size: size,
      count: processedRecipes.length,
      total_count: data.count || processedRecipes.length,
      recipes: processedRecipes,
      timestamp: new Date().toISOString(),
      error: null
    };
    
  } catch (error) {
    console.error('Error searching for recipes:', error);
    return {
      query: args.query || args.q || '',
      from: args.from || 0,
      size: args.size || 10,
      recipes: [],
      count: 0,
      error: error.message || 'Unknown error occurred while searching for recipes',
      timestamp: new Date().toISOString()
    };
  }
}


// Register the tool implementations
window.toolImplementations.search_recipes = searchRecipes;
