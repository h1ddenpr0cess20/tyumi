/**
 * Finance-related tool implementations (stocks, crypto)
 */

// Ensure the toolImplementations object exists
window.toolImplementations = window.toolImplementations || {};

/**
 * Fetch a URL with retry logic
 * @param {string} url - The URL to fetch
 * @param {number} maxRetries - Maximum number of retry attempts
 * @returns {Promise<any>} - The response
 */
async function fetchWithRetry(url, maxRetries = 3) {
  let lastError;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      return await response.json();
    } catch (error) {
      lastError = error;
      console.warn(`Fetch attempt ${attempt + 1}/${maxRetries} failed: ${error.message}`);
      // Wait before retrying (exponential backoff)
      const delay = Math.min(1000 * Math.pow(2, attempt), 8000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw lastError;
}

/**
 * Get stock price data
 * @param {Object} args - Arguments for the tool
 * @returns {Promise<Object>} - The result
 */
async function getStockPrice(args) {
  try {
    const symbol = args.symbol.toUpperCase();
    const dataType = args.dataType || 'quote';
    if (window.VERBOSE_LOGGING) console.info(`Fetching stock price for ${symbol} (${dataType})`);
    
    // Get AlphaVantage API key from tool API keys
    const apiKey = window.getToolApiKey ? window.getToolApiKey('alphavantage') : null;
    
    if (!apiKey) {
      throw new Error('AlphaVantage API key not configured. Please add your AlphaVantage API key in the Tools settings.');
    }
    
    let endpoint;
    switch (dataType) {
      case 'daily':
        endpoint = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${apiKey}`;
        break;
      case 'weekly':
        endpoint = `https://www.alphavantage.co/query?function=TIME_SERIES_WEEKLY&symbol=${symbol}&apikey=${apiKey}`;
        break;
      case 'monthly':
        endpoint = `https://www.alphavantage.co/query?function=TIME_SERIES_MONTHLY&symbol=${symbol}&apikey=${apiKey}`;
        break;
      case 'quote':
      default:
        endpoint = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`;
        break;
    }
    
    const response = await fetch(endpoint);
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    
    const data = await response.json();
    
    // Check for error messages in the response
    if (data && data['Error Message']) {
      throw new Error(data['Error Message']);
    }
    
    if (data && data['Note'] && data['Note'].includes('API call frequency')) {
      console.warn('API rate limit reached');
      return {
        symbol: symbol,
        data: null,
        error: 'API rate limit reached. Please try again later.',
        timestamp: new Date().toISOString()
      };
    }
    
    return {
      symbol: symbol,
      dataType: dataType,
      data: data,
      timestamp: new Date().toISOString(),
      error: null
    };
  } catch (error) {
    console.error('Error fetching stock price data:', error);
    return {
      symbol: args.symbol,
      dataType: args.dataType || 'quote',
      data: null,
      error: error.message || 'Unknown error fetching stock price data',
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Get cryptocurrency prices
 * @param {Object} args - Arguments for the tool
 * @returns {Promise<Object>} - The result
 */
async function getCryptoPrices(args) {
  const currency = args.currency;
  const to = (args.to || 'USD').toUpperCase();
  if (window.VERBOSE_LOGGING) console.info(`Fetching ${to} conversion rate for: ${currency}`);
  try {
    const url = `https://api.coinbase.com/v2/exchange-rates?currency=${encodeURIComponent(currency)}`;
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' }
    });
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    const data = await response.json();
    const rate = data && data.data && data.data.rates && data.data.rates[to] ? data.data.rates[to] : null;
    if (!rate) {
      throw new Error(`${to} rate not found in response`);
    }
    if (window.VERBOSE_LOGGING) console.info(`Successfully retrieved ${to} rate for ${currency}`);
    return {
      currency: currency,
      to: to,
      rate: rate,
      fetched_at: new Date().toISOString(),
      error: null
    };
  } catch (error) {
    if (window.VERBOSE_LOGGING) console.error(`Error fetching ${to} rate: ${error.message}`);
    return {
      currency: currency,
      to: to,
      rate: null,
      fetched_at: new Date().toISOString(),
      error: error.message || `Failed to fetch ${to} rate`
    };
  }
}

// Register the tool implementations
window.toolImplementations.stock_prices = getStockPrice;
window.toolImplementations.crypto_prices = getCryptoPrices;
