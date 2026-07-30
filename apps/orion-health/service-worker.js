const CACHE_NAME='orion-dental-app-v1.4.4-r2';
const APP_SCOPE='./';
const SHELL=[
  './','./index.html','./styles-1.css','./layout-fixes.css','./script-1.js','./manifest.webmanifest','./VERSION.json',
  './data/catalogo-insumos.json',
  './assets/brand/orion-health.png','./assets/brand/orion-comunicaciones.png','./assets/brand/maxilofacial-pro-plus.svg','./assets/brand/firma-javier-espina-navy.svg',
  './assets/icons/icon-192.png','./assets/icons/icon-512.png',
  './assets/shared/orion-identity-system-v140.css','./assets/shared/orion-mobile-v141.css','./assets/shared/clinical-mobile-actions-cmf-v141.css','./assets/shared/clinical-mobile-cmf-v142.css','./assets/shared/clinical-mobile-cmf-v142.js','./assets/shared/patient-bridge.js','./assets/shared/session-config.js','./assets/shared/communications-priority-layout.js',
  './assets/shared/clinical-nps-cmf-v136.js','./assets/shared/clinical-audit-cmf.js','./assets/shared/clinical-audit-endo.js','./assets/shared/clinical-components-restore.js','./assets/shared/clinical-templates-cmf-v132.js','./assets/shared/clinical-prescription-auth-cmf-v139.js','./assets/shared/clinical-prescription-share-cmf-v139.js','./assets/shared/clinical-output-cmf-v134.js','./assets/shared/clinical-preview-cmf-v135.js','./assets/shared/clinical-mobile-docs-cmf-v141.js',
  './modules/comunicaciones/index.html','./modules/comunicaciones/loader.js','./modules/comunicaciones/responsive-fixes.css','./modules/comunicaciones/mobile-v142.css','./modules/comunicaciones/source.html',
  './modules/insumos/index.html','./modules/insumos/loader.js','./modules/insumos/source.html',
  './modules/cmf/index.html','./modules/cmf/loader.js','./modules/cmf/source.html',
  './modules/endodoncia/index.html','./modules/endodoncia/loader.js',
  './modules/endodoncia/source/source-001.part','./modules/endodoncia/source/source-002.part','./modules/endodoncia/source/source-003.part','./modules/endodoncia/source/source-004.part',
  './modules/ortodoncia/index.html','./modules/ortodoncia/loader.js','./modules/ortodoncia/source/source-001.part','./modules/ortodoncia/source/source-002.part',
  './modules/odontopediatria/index.html','./modules/odontopediatria/loader.js','./modules/odontopediatria/source/source-001.part','./modules/odontopediatria/source/source-002.part','./modules/odontopediatria/source/source-003.part','./modules/odontopediatria/source/source-004.part'
];

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE_NAME).map(key=>caches.delete(key)))));
  self.clients.claim();
});

self.addEventListener('message',event=>{
  if(event.data&&event.data.type==='SKIP_WAITING')self.skipWaiting();
});

self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET')return;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin)return;

  if(request.mode==='navigate'){
    event.respondWith(
      fetch(request).then(response=>{
        const copy=response.clone();
        caches.open(CACHE_NAME).then(cache=>cache.put(request,copy)).catch(()=>{});
        return response;
      }).catch(()=>caches.match(request).then(cached=>cached||caches.match(APP_SCOPE+'index.html')))
    );
    return;
  }

  if(/\.(?:js|css|part|json|html|svg)$/.test(url.pathname)){
    event.respondWith(
      caches.match(request).then(cached=>{
        const update=fetch(request).then(response=>{
          if(response&&response.ok){const copy=response.clone();caches.open(CACHE_NAME).then(cache=>cache.put(request,copy)).catch(()=>{});}
          return response;
        }).catch(()=>cached);
        return cached||update;
      })
    );
    return;
  }

  event.respondWith(caches.match(request).then(cached=>cached||fetch(request).then(response=>{
    if(response&&response.ok){const copy=response.clone();caches.open(CACHE_NAME).then(cache=>cache.put(request,copy)).catch(()=>{});}
    return response;
  })));
});
