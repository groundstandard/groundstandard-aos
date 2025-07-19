// Add cache-busting headers and clear stale data
if ('serviceWorker' in navigator) {
  // Unregister any existing service workers
  navigator.serviceWorker.getRegistrations().then(function(registrations) {
    for(let registration of registrations) {
      registration.unregister();
    }
  });
}

// Clear cache on app load
const clearCache = () => {
  if ('caches' in window) {
    caches.keys().then(function(names) {
      for (let name of names) {
        caches.delete(name);
      }
    });
  }
};

// Clear cache if app version has changed
const APP_VERSION = '1.0.0';
const lastVersion = localStorage.getItem('app_version');
if (lastVersion !== APP_VERSION) {
  clearCache();
  localStorage.setItem('app_version', APP_VERSION);
}