const CACHE="pepe-restaurant-v1.3.4";
const ASSETS=["./","index.html","style.css","config.js","script.js","staff.json","announcements.json","manifest.json","favicon.svg","icon-180.svg"];
self.addEventListener("install",e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS))));
self.addEventListener("activate",e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))));
self.addEventListener("fetch",e=>{
  e.respondWith(fetch(e.request).catch(()=>caches.match(e.request)));
});