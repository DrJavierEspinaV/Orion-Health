(async()=>{
  try{
    let h=await fetch('./source.html',{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('HTTP '+r.status);return r.text()});
    h=h
      .replace(/src="orion-logo\.png"/g,'src="../../assets/brand/orion-comunicaciones.png"')
      .replace(/src="logo_orion_health_spa_oficial_azul\.png"/g,'src="../../assets/brand/orion-health.png"')
      .replace(/href="\.\.\/\.\.\/icons\/icon-192\.png"/g,'href="../../assets/icons/icon-192.png"')
      .replace(/value="ORION-CLINICA-2026"/g,'value="" placeholder="Clave del piloto" autocomplete="off" data-orion-session-key="orion_comunicaciones_token"')
      .replace(/type="text" id="dbToken"/g,'type="password" id="dbToken"')
      .replace(/id="dbToken" type="text"/g,'id="dbToken" type="password"')
      .replace(/localStorage/g,'sessionStorage')
      .replace(/\.\.\/\.\.\/sw\.js/g,'../../service-worker.js')
      .replace(/<script[^>]+xlsx@0\.18\.5[^>]*><\/script>/i,'')
      .replace(/const CACHE_TTL_MS = 10 \* 60 \* 1000;/,'const CACHE_TTL_MS = 4 * 60 * 60 * 1000;')
      .replace(
        /const url = \(document\.getElementById\('dbWebappUrl'\)\?\.value \|\| ''\)\.trim\(\);\s*if\(!url\) return;\s*loadDb_\(\);/,
        "const url = (document.getElementById('dbWebappUrl')?.value || '').trim(); const tok = (document.getElementById('dbToken')?.value || '').trim(); if(!url || !tok) return; loadDb_();"
      )
      .replace(
        /\/\* ✅ Auto-carga BD al abrir \+ caché 10 min \*\/[\s\S]*?\}, 350\);/,
        `/* ✅ Inicio rápido: caché inmediata + actualización silenciosa */
const cacheRestoredOnStart = restoreCacheState();
render();

setTimeout(()=>{
  try{
    const url = (document.getElementById('dbWebappUrl')?.value || '').trim();
    const tok = (document.getElementById('dbToken')?.value || '').trim();
    if(!url || !tok) return;
    const st = document.getElementById('dbStatus');
    if(cacheRestoredOnStart && st) st.textContent = '✅ Agenda disponible desde caché. Actualizando Drive en segundo plano…';
    loadDb_();
  }catch(e){}
}, cacheRestoredOnStart ? 1400 : 220);`
      )
      .replace('</head>','<link rel="stylesheet" href="./responsive-fixes.css?v=1.2.5"></head>')
      .replace('</body>',`<script>
(function(){
  const XLSX_URL='https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
  let xlsxPromise=null;
  function ensureXlsx(){
    if(window.XLSX) return Promise.resolve(window.XLSX);
    if(xlsxPromise) return xlsxPromise;
    xlsxPromise=new Promise((resolve,reject)=>{
      const s=document.createElement('script');
      s.src=XLSX_URL;
      s.async=true;
      s.onload=()=>resolve(window.XLSX);
      s.onerror=()=>reject(new Error('No fue posible cargar la librería Excel.'));
      document.head.appendChild(s);
    });
    return xlsxPromise;
  }
  document.addEventListener('pointerdown',event=>{
    if(event.target && event.target.id==='file') ensureXlsx().catch(()=>{});
  },true);
  document.addEventListener('change',async event=>{
    const input=event.target;
    if(!input || input.id!=='file' || !input.files || !input.files.length || window.XLSX) return;
    event.stopImmediatePropagation();
    try{
      await ensureXlsx();
      input.dispatchEvent(new Event('change',{bubbles:true}));
    }catch(error){
      alert('No fue posible habilitar la importación Excel. La base de Drive continúa disponible.');
      console.error(error);
    }
  },true);
})();
</script><script src="../../assets/shared/session-config.js?v=1.2.5"></script></body>`);
    document.open();document.write(h);document.close();
  }catch(e){document.body.textContent='No se pudo cargar ORION Comunicaciones Clínicas.';console.error(e)}
})();
