const CACHE_NAME='orion-armonizacion-v1.5.1';
const SHELL=[
  './',
  './index.html',
  './registro-v145.html',
  './registro-v145.css',
  './registro-v145.js',
  './anatomy-calibration-v146.css',
  './anatomy-presets-v146.js',
  './workflow-v147.css',
  './workflow-v147.js',
  './map-dynamic-v148.css',
  './map-dynamic-v148.js',
  './map-inline-v149.css',
  './map-inline-v149.js',
  './map-viewport-v150.css',
  './map-viewport-v150.js',
  './standalone-v151.js',
  './manifest.webmanifest',
  './anatomy-atlas-female-v145-r17-01.js',
  './anatomy-atlas-female-v145-r17-02.js',
  './anatomy-atlas-female-v145-r17-03.js',
  './anatomy-atlas-female-v145-r17-04.js',
  '../../assets/brand/orion-health.png',
  '../../assets/icons/icon-192.png',
  '../../assets/icons/icon-512.png'
];

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate',event=>{
  event.waitUntil(
    caches.keys().then(keys=>Promise.all(
      keys.filter(key=>key.startsWith('orion-armonizacion-')&&key!==CACHE_NAME).map(key=>caches.delete(key))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET')return;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin)return;

  if(request.mode==='navigate'){
    event.respondWith(
      fetch(request,{cache:'no-store'}).then(response=>{
        if(response&&response.ok){
          const copy=response.clone();
          caches.open(CACHE_NAME).then(cache=>cache.put('./index.html',copy)).catch(()=>{});
        }
        return response;
      }).catch(()=>caches.match('./index.html'))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(cached=>{
      const update=fetch(request).then(response=>{
        if(response&&response.ok){
          const copy=response.clone();
          caches.open(CACHE_NAME).then(cache=>cache.put(request,copy)).catch(()=>{});
        }
        return response;
      }).catch(()=>cached);
      return cached||update;
    })
  );
});
