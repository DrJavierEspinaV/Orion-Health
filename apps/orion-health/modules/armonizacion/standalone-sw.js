const CACHE_NAME='orion-armonizacion-v1.8.0';
const SHELL=[
  './','./index.html','./registro-v145.html','./registro-v145.css','./registro-v145.js',
  './performance-v163.css','./performance-v163.js','./anatomy-calibration-v146.css','./anatomy-presets-v146.js',
  './workflow-v147.css','./workflow-v147.js','./map-dynamic-v148.css','./map-dynamic-v148.js',
  './map-inline-v149.css','./map-inline-v149.js','./map-viewport-v150.css','./map-viewport-v150.js',
  './standalone-v151.js','./ui-optimization-v153.css','./ui-optimization-v153.js',
  './administration-only-v154.css','./administration-only-v154.js','./clinical-closure-v160.css','./clinical-closure-v160.js',
  './mobile-administration-v161.css','./mobile-administration-v161.js','./final-report-v162.css','./final-report-v162.js',
  './document-model-touch-v164.css','./document-model-touch-v164.js','./model-key-compat-v165.js',
  './document-letter-atlas-v165.css','./document-letter-atlas-v165.js','./single-atlas-v1611.css','./single-atlas-v1611.js',
  './filler-engine-v170.css','./filler-engine-v170-r1.css','./filler-engine-v170.js',
  './caha-engine-v180.css','./caha-engine-v180-r1.css','./caha-engine-v180.js','./manifest.webmanifest',
  './anatomy-atlas-female-v145-r17-01.js','./anatomy-atlas-female-v145-r17-02.js',
  './anatomy-atlas-female-v145-r17-03.js','./anatomy-atlas-female-v145-r17-04.js',
  '../../assets/brand/orion-health.png','../../assets/icons/icon-192.png','../../assets/icons/icon-512.png'
];
async function cacheShell(){const cache=await caches.open(CACHE_NAME);await Promise.allSettled(SHELL.map(async path=>{const request=new Request(path,{cache:'reload'});const response=await fetch(request);if(!response.ok)throw new Error(`${path}: HTTP ${response.status}`);await cache.put(request,response);}));}
self.addEventListener('install',event=>{event.waitUntil(cacheShell());self.skipWaiting();});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('orion-armonizacion-')&&key!==CACHE_NAME).map(key=>caches.delete(key)))));self.clients.claim();});
self.addEventListener('message',event=>{if(event.data&&event.data.type==='SKIP_WAITING')self.skipWaiting();});
self.addEventListener('fetch',event=>{const request=event.request;if(request.method!=='GET')return;const url=new URL(request.url);if(url.origin!==self.location.origin)return;if(request.mode==='navigate'||url.pathname.endsWith('/modules/armonizacion/index.html')){event.respondWith(fetch(request,{cache:'no-store'}).then(response=>{if(response&&response.ok){const copy=response.clone();caches.open(CACHE_NAME).then(cache=>cache.put(request,copy)).catch(()=>{});}return response;}).catch(async()=>(await caches.match(request))||(await caches.match('./index.html'))||Response.error()));return;}event.respondWith(fetch(request,{cache:'no-store'}).then(response=>{if(response&&response.ok){const copy=response.clone();caches.open(CACHE_NAME).then(cache=>cache.put(request,copy)).catch(()=>{});}return response;}).catch(()=>caches.match(request)));});