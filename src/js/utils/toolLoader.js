/**
 * Dynamically load tool implementation scripts on demand
 */

window.toolScriptsLoaded = false;

window.loadToolScripts = function() {
  if (window.toolScriptsLoaded) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const scriptPaths = [
      '/src/js/services/tools/finance.js',
      '/src/js/services/tools/images.js',
      '/src/js/services/tools/utilities.js',
      '/src/js/services/tools/search.js',
      '/src/js/services/tools/food.js',
      '/src/js/services/tools/social.js',
      '/src/js/services/tools/entertainment.js',
      '/src/js/services/tools/jobs.js',
      '/src/js/services/tools/realestate.js',
      '/src/js/services/tools/tools.js'
    ];

    let loaded = 0;

    const onLoad = () => {
      loaded += 1;
      if (loaded === scriptPaths.length) {
        window.toolScriptsLoaded = true;
        resolve();
      }
    };

    const onError = (err) => {
      console.error('Failed to load tool script:', err);
      reject(err);
    };

    scriptPaths.forEach(src => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = onLoad;
      script.onerror = onError;
      document.head.appendChild(script);
    });
  });
};
