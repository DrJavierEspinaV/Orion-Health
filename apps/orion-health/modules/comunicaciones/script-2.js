(function(){
  if(!('serviceWorker' in navigator)) return;
  const isLocalhost = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  const isHttps = location.protocol === 'https:';
  if(!isHttps && !isLocalhost) return;

  window.addEventListener('load', () => {
    // ../../service-worker.js apunta a la raíz del repo (p.ej. /orion-portal/sw.js)
    navigator.serviceWorker.register('../../service-worker.js').catch(()=>{});
  });
})();
