const CACHE_NAME='orion-dental-app-v1.4.6-a48';
const APP_SCOPE='./';
const SHELL=[
  './assets/shared/portal-craniofacial-a47.css','./modules/craniofacial/index.html',
  './assets/shared/clinical-output-fixes-cmf-v144r4.css','./assets/shared/clinical-output-fixes-cmf-v144r4.js',
  './assets/shared/appointment-status.js','./assets/shared/cmf-clinical-v145.js','./assets/shared/cmf-workflow-v145.css',
  './','./index.html','./styles-1.css','./layout-fixes.css','./script-1.js','./manifest.webmanifest','./VERSION.json',
  './assets/brand/orion-health.png','./assets/icons/icon-192.png','./assets/icons/icon-512.png',
  './assets/shared/orion-identity-system-v140.css','./assets/shared/orion-mobile-v141.css',
  './assets/shared/portal-route-selector-v144r6.css','./assets/shared/portal-aesthetic-v144r7.css',
  './assets/shared/portal-armonizacion-v152.js','./assets/shared/clinical-certificate-cmf-v144r6.css',
  './modules/armonizacion/index.html','./modules/armonizacion/registro-v145.html','./modules/armonizacion/registro-v145.css','./modules/armonizacion/registro-v145.js',
  './modules/armonizacion/performance-v163.css','./modules/armonizacion/performance-v163.js',
  './modules/armonizacion/anatomy-calibration-v146.css','./modules/armonizacion/anatomy-presets-v146.js',
  './modules/armonizacion/workflow-v147.css','./modules/armonizacion/workflow-v147.js',
  './modules/armonizacion/map-dynamic-v148.css','./modules/armonizacion/map-dynamic-v148.js',
  './modules/armonizacion/map-inline-v149.css','./modules/armonizacion/map-inline-v149.js',
  './modules/armonizacion/map-viewport-v150.css','./modules/armonizacion/map-viewport-v150.js',
  './modules/armonizacion/standalone-v151.js','./modules/armonizacion/ui-optimization-v153.css','./modules/armonizacion/ui-optimization-v153.js',
  './modules/armonizacion/administration-only-v154.css','./modules/armonizacion/administration-only-v154.js',
  './modules/armonizacion/clinical-closure-v160.css','./modules/armonizacion/clinical-closure-v160.js',
  './modules/armonizacion/mobile-administration-v161.css','./modules/armonizacion/mobile-administration-v161.js',
  './modules/armonizacion/final-report-v162.css','./modules/armonizacion/final-report-v162.js',
  './modules/armonizacion/document-model-touch-v164.css','./modules/armonizacion/document-model-touch-v164.js',
  './modules/armonizacion/model-key-compat-v165.js','./modules/armonizacion/document-letter-atlas-v165.css','./modules/armonizacion/document-letter-atlas-v165.js',
  './modules/armonizacion/single-atlas-v1611.css','./modules/armonizacion/single-atlas-v1611.js',
  './modules/armonizacion/filler-engine-v170.css','./modules/armonizacion/filler-engine-v170-r1.css','./modules/armonizacion/filler-engine-v170.js',
  './modules/armonizacion/caha-engine-v180.css','./modules/armonizacion/caha-engine-v180-r1.css','./modules/armonizacion/caha-engine-v180.js',
  './modules/armonizacion/plla-engine-v190.css','./modules/armonizacion/plla-engine-v190.js',
  './modules/armonizacion/skinbooster-engine-v200.css','./modules/armonizacion/skinbooster-engine-v200.js',
  './modules/armonizacion/threads-engine-v210.css','./modules/armonizacion/threads-engine-v210.js',
  './modules/armonizacion/manifest.webmanifest','./modules/armonizacion/standalone-sw.js',
  './modules/armonizacion/anatomy-atlas-female-v145-r17-01.js','./modules/armonizacion/anatomy-atlas-female-v145-r17-02.js',
  './modules/armonizacion/anatomy-atlas-female-v145-r17-03.js','./modules/armonizacion/anatomy-atlas-female-v145-r17-04.js'
];
async function cacheShell(){const cache=await caches.open(CACHE_NAME);await Promise.allSettled(SHELL.map(async path=>{const request=new Request(path,{cache:'reload'});const response=await fetch(request);if(!response.ok)throw new Error(`${path}: HTTP ${response.status}`);await cache.put(request,response);}));}
self.addEventListener('install',event=>{event.waitUntil(cacheShell());self.skipWaiting();});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('orion-dental-app-')&&key!==CACHE_NAME).map(key=>caches.delete(key)))));self.clients.claim();});
self.addEventListener('message',event=>{if(event.data&&event.data.type==='SKIP_WAITING')self.skipWaiting();});
async function networkFirst(request,fallback){try{const response=await fetch(request,{cache:'no-store'});if(response&&response.ok){const copy=response.clone();caches.open(CACHE_NAME).then(cache=>cache.put(request,copy)).catch(()=>{});}return response;}catch(_){return(await caches.match(request))||(fallback?await caches.match(fallback):null)||Response.error();}}
self.addEventListener('fetch',event=>{const request=event.request;if(request.method!=='GET')return;const url=new URL(request.url);if(url.origin!==self.location.origin)return;if(request.mode==='navigate'){event.respondWith(networkFirst(request,APP_SCOPE+'index.html'));return;}if(url.pathname.endsWith('/modules/armonizacion/index.html')){event.respondWith(networkFirst(request,APP_SCOPE+'modules/armonizacion/index.html'));return;}if(/\.(?:js|css|part|json|html|svg|webmanifest)$/.test(url.pathname)){event.respondWith(networkFirst(request));return;}event.respondWith(caches.match(request).then(cached=>cached||fetch(request).then(response=>{if(response&&response.ok){const copy=response.clone();caches.open(CACHE_NAME).then(cache=>cache.put(request,copy)).catch(()=>{});}return response;})));});
