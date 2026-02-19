// Kill all service workers immediately
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then(function(registrations) {
    registrations.forEach(function(reg) {
      reg.unregister();
      console.log("Unregistered service worker:", reg.scope);
    });
  });
  
  // Clear all caches
  if ("caches" in window) {
    caches.keys().then(function(names) {
      names.forEach(function(name) {
        caches.delete(name);
        console.log("Deleted cache:", name);
      });
    });
  }
}
console.log("Service worker kill script executed");
