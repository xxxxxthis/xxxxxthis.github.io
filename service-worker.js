const CACHE="pepe-restaurant-v1.4.2";
const ASSETS=["./","index.html","style.css","config.js","script.js","staff.json","announcements.json","manifest.json","favicon.svg","icon-180.svg","request.html","request.js","approval.html","approval.js"];
self.addEventListener("install",e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS))));
self.addEventListener("activate",e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))));
self.addEventListener("fetch",e=>{
  e.respondWith(fetch(e.request).catch(()=>caches.match(e.request)));
});