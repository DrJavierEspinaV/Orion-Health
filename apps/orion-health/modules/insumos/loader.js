(async()=>{
  'use strict';

  const MODULE_VERSION = '4.5.1';
  const CATALOG_URL = '../../data/catalogo-insumos.json?v=1.1';
  const SOURCE_URL = './source.html';
  const CACHE_KEY = 'orion_insumos_catalogo_v2';
  const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
  const MIN_VALID_ITEMS = 500;
  const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzGEsLJQMTkzq4G7XhEleNVfWhji2QlY_e75jruADK2NAwrv6uXoDSJP8PqXPAjfzAY/exec';

  const normalizeText = value => String(value ?? '').trim();

  function readCache(){
    try{
      const saved = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
      if(!saved || !Array.isArray(saved.items) || saved.items.length < MIN_VALID_ITEMS) return null;
      if(Date.now() - Number(saved.savedAt || 0) > CACHE_TTL_MS) return null;
      return saved;
    }catch(_){ return null; }
  }

  function saveCache(catalog){
    try{
      if(!catalog || !Array.isArray(catalog.items) || catalog.items.length < MIN_VALID_ITEMS) return;
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        version: catalog.version || '1.0',
        updated: catalog.updated || new Date().toISOString(),
        source: catalog.source || 'ORION',
        count: catalog.items.length,
        items: catalog.items,
        savedAt: Date.now()
      }));
    }catch(_){ }
  }

  async function decodePackagedCatalog(meta){
    if(!meta || meta.encoding !== 'gzip+base64' || !meta.data) throw new Error('Formato de catálogo inválido');
    if(typeof DecompressionStream === 'undefined') throw new Error('El navegador no admite descompresión del catálogo');
    const binary = atob(meta.data);
    const bytes = Uint8Array.from(binary, ch => ch.charCodeAt(0));
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
    const decoded = JSON.parse(await new Response(stream).text());
    if(!decoded || !Array.isArray(decoded.items) || decoded.items.length < MIN_VALID_ITEMS) throw new Error('Catálogo maestro incompleto');
    return {
      version: decoded.version || meta.version || '1.0',
      updated: decoded.updated || meta.updated || '',
      source: 'Catálogo Maestro ORION',
      items: decoded.items
    };
  }

  function jsonpFetch(url, params, timeoutMs=1800){
    return new Promise((resolve, reject)=>{
      const callback = '__orionInsumos_' + Date.now() + '_' + Math.floor(Math.random()*100000);
      const script = document.createElement('script');
      const timer = setTimeout(()=>finish(new Error('Tiempo de espera agotado')), timeoutMs);
      const finish = (error, data)=>{
        clearTimeout(timer);
        try{ delete window[callback]; }catch(_){ window[callback] = undefined; }
        script.remove();
        error ? reject(error) : resolve(data);
      };
      window[callback] = data => finish(null, data);
      script.onerror = () => finish(new Error('No fue posible consultar Drive'));
      const query = new URLSearchParams({...params, callback}).toString();
      script.src = url + (url.includes('?') ? '&' : '?') + query;
      document.head.appendChild(script);
    });
  }

  function getValue(row, names){
    const entries = Object.entries(row || {});
    for(const name of names){
      const target = name.toLowerCase();
      const found = entries.find(([key]) => String(key).trim().toLowerCase() === target);
      if(found) return found[1];
    }
    return '';
  }

  async function tryDriveCatalog(){
    let token = '';
    try{ token = sessionStorage.getItem('orion_comunicaciones_token') || ''; }catch(_){ }
    if(!token) return null;
    try{
      const data = await jsonpFetch(APPS_SCRIPT_URL, {action:'list', token, sheet:'INSUMOS'});
      const rows = data && data.ok && Array.isArray(data.rows) ? data.rows : [];
      if(rows.length < MIN_VALID_ITEMS) return null;
      const items = rows.map(row => [
        normalizeText(getValue(row, ['CODIGO_SAP','CODIGO','SAP'])),
        normalizeText(getValue(row, ['TIPO','CATEGORIA'])),
        normalizeText(getValue(row, ['DESCRIPCION','DESCRIPCIÓN','INSUMO','NOMBRE_INSUMO'])),
        normalizeText(getValue(row, ['PROVEEDOR'])),
        getValue(row, ['COSTO_NETO','COSTO','VALOR_NETO']) || null
      ]).filter(item => item[0] && item[2]);
      if(items.length < MIN_VALID_ITEMS) return null;
      return {version:'Drive', updated:new Date().toISOString(), source:'ORION_DB_SAP · INSUMOS', items};
    }catch(_){ return null; }
  }

  async function loadCatalog(){
    const cached = readCache();
    if(cached){
      tryDriveCatalog().then(fresh => { if(fresh) saveCache(fresh); });
      return cached;
    }

    const packagedPromise = fetch(CATALOG_URL, {cache:'no-store'})
      .then(response => { if(!response.ok) throw new Error('HTTP ' + response.status); return response.json(); })
      .then(decodePackagedCatalog);

    const drivePromise = tryDriveCatalog();
    const driveFirst = await Promise.race([
      drivePromise,
      new Promise(resolve => setTimeout(()=>resolve(null), 1200))
    ]);
    if(driveFirst){ saveCache(driveFirst); return driveFirst; }

    const packaged = await packagedPromise;
    saveCache(packaged);
    drivePromise.then(fresh => { if(fresh) saveCache(fresh); });
    return packaged;
  }

  function toModuleItems(catalog){
    return catalog.items.map(item => ({
      codigo: normalizeText(item[0]),
      tipo: normalizeText(item[1]),
      nombre_insumo: normalizeText(item[2]),
      proveedor: normalizeText(item[3]),
      costo_neto: item[4] ?? '',
      unidad: ''
    })).filter(item => item.codigo && item.nombre_insumo);
  }

  function injectModuleEnhancements(html, catalog){
    const items = toModuleItems(catalog);
    const catalogLiteral = JSON.stringify(items).replace(/</g, '\\u003c');
    const metaLiteral = JSON.stringify({
      count: items.length,
      version: catalog.version || '1.0',
      updated: catalog.updated || '',
      source: catalog.source || 'Catálogo Maestro ORION'
    }).replace(/</g, '\\u003c');

    let h = html
      .replace(/src="orion-logo\.png"/g,'src="../../assets/brand/orion-health.png"')
      .replace(/src="logo_orion_health_spa_oficial_azul\.png"/g,'src="../../assets/brand/orion-health.png"')
      .replace(/Orion Comunicaciones — Solicitud de Insumos \(Interno\) v4\.4\.1/g,'ORION Insumos — Catálogo persistente v' + MODULE_VERSION)
      .replace(/Orion Comunicaciones - Insumos ® — v4\.4\.1/g,'ORION Insumos® — v' + MODULE_VERSION)
      .replace(/<div class="badge">v4\.4\.1<\/div>/g,'<div class="badge">v' + MODULE_VERSION + '</div>')
      .replace(/let CODES = \[[\s\S]*?\n\s*\];/, 'let CODES = ' + catalogLiteral + ';')
      .replace(
        /if \(typeof XLSX === "undefined"\)\{[\s\S]*?return;\s*\}/,
        'if (typeof XLSX === "undefined"){ errStatus("Catálogo disponible. La importación y exportación Excel requieren conexión a la librería XLSX."); }'
      );

    const styles = `
<style id="orionInsumosPersistentStyle">
  #orionCatalogCard{margin:0 0 16px;padding:14px 16px;border:1px solid #bae6fd;border-radius:16px;background:linear-gradient(135deg,#ecfeff,#f8fafc);display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}
  #orionCatalogCard strong{color:#0c4a6e}.orion-catalog-meta{font-size:12px;color:#475569;margin-top:4px}.orion-catalog-badge{padding:7px 12px;border-radius:999px;background:#0f766e;color:#fff;font-size:12px;font-weight:800}
  details#orionCatalogAdmin{width:100%;margin-top:8px;border:1px dashed #cbd5e1;border-radius:12px;padding:8px 10px;background:#f8fafc}
  details#orionCatalogAdmin summary{cursor:pointer;font-size:12px;font-weight:800;color:#475569}
  @media(max-width:700px){#orionCatalogCard{align-items:flex-start}.orion-catalog-badge{width:100%;text-align:center}}
</style>`;
    h = h.replace('</head>', styles + '</head>');

    const enhancementScript = `
<script>
window.addEventListener('DOMContentLoaded', function(){
  const meta = ${metaLiteral};
  const status = document.getElementById('jsStatus');
  if(status){
    const card = document.createElement('div');
    card.id = 'orionCatalogCard';
    const updated = meta.updated ? String(meta.updated).slice(0,10) : 'sin fecha';
    card.innerHTML = '<div><strong>Catálogo Maestro ORION disponible</strong><div class="orion-catalog-meta">Fuente: ' + meta.source + ' · Versión ' + meta.version + ' · Actualizado ' + updated + '</div></div><span class="orion-catalog-badge">' + meta.count + ' insumos</span>';
    status.insertAdjacentElement('afterend', card);
    status.textContent = 'Listo. El catálogo se cargó automáticamente; no necesitas importar Excel.';
  }

  const fileInput = document.getElementById('fileInput');
  const importBtn = document.getElementById('importBtn');
  const importInfo = document.getElementById('importInfo');
  const legacyBox = fileInput && fileInput.parentElement;
  if(legacyBox && importBtn){
    const details = document.createElement('details');
    details.id = 'orionCatalogAdmin';
    const summary = document.createElement('summary');
    summary.textContent = 'Administración avanzada del catálogo';
    details.appendChild(summary);
    legacyBox.parentNode.insertBefore(details, legacyBox);
    details.appendChild(legacyBox);
    if(importInfo) importInfo.textContent = 'Use esta opción solo para una actualización administrativa excepcional.';
  }

  const search = document.getElementById('search');
  if(search) search.placeholder = 'Buscar entre ' + meta.count + ' insumos por nombre, código, tipo o proveedor…';
}, {once:true});
</script>`;
    h = h.replace('</body>', enhancementScript + '</body>');
    return h;
  }

  try{
    const [source, catalog] = await Promise.all([
      fetch(SOURCE_URL,{cache:'no-store'}).then(response=>{ if(!response.ok) throw new Error('HTTP ' + response.status); return response.text(); }),
      loadCatalog()
    ]);
    const html = injectModuleEnhancements(source, catalog);
    document.open();
    document.write(html);
    document.close();
  }catch(error){
    document.body.innerHTML = '<main style="font-family:Segoe UI,Arial;padding:28px"><h1>ORION Insumos</h1><p>No se pudo cargar el catálogo persistente.</p><p style="color:#64748b">' + String(error && error.message ? error.message : error) + '</p></main>';
    console.error(error);
  }
})();
