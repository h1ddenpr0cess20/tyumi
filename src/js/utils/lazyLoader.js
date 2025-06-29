/**
 * Lazy loading utilities for optional modules to reduce initial page weight.
 */

window.lazyModulesLoaded = window.lazyModulesLoaded || {};

function loadScriptOnce(src, flag) {
  return new Promise((resolve, reject) => {
    if (window.lazyModulesLoaded[flag]) return resolve();
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => {
      window.lazyModulesLoaded[flag] = true;
      resolve();
    };
    script.onerror = err => reject(err);
    document.head.appendChild(script);
  });
}

window.loadGalleryModule = function() {
  return loadScriptOnce('/src/js/components/gallery.js', 'gallery');
};

window.loadHistoryModule = function() {
  return loadScriptOnce('/src/js/services/history.js', 'history');
};

window.loadTtsModule = function() {
  return loadScriptOnce('/src/js/services/tts.js', 'tts');
};

window.loadLocationModule = function() {
  return loadScriptOnce('/src/js/services/location.js', 'location');
};

window.isMobileDevice = function() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
         window.innerWidth <= 768;
};

window.loadMobileHandling = function() {
  return loadScriptOnce('/src/js/utils/mobileHandling.js', 'mobileHandling');
};

window.loadMobileCss = function() {
  if (window.lazyModulesLoaded.mobileCss) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'src/css/components/layout/mobile.css';
  document.head.appendChild(link);
  window.lazyModulesLoaded.mobileCss = true;
};

window.loadMarkedLibrary = function() {
  return loadScriptOnce('/src/js/lib/marked.min.js', 'marked').then(() => {
    if (typeof window.initializeMarked === 'function') {
      window.initializeMarked();
    }
  });
};
