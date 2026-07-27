function setPlantilla(){
  const tipo = $('#tipoMensaje').value;
  $('#mensajeTipo').value = plantillas[tipo] || '';
  ensureEncuestaPlaceholder_();
  $('#linksPublicos').value = (presetsLinks[tipo] || '').trim();
  actualizarPreviewLinks();

  // ✅ Cambio único: WhatsApp Manual también aparece para “Paciente Ausente”.
  // ✅ Derivación mantiene su bloque propio solo para “Derivación por WhatsApp”.
  const showDerivacion = (tipo === 'derivacion_whatsapp');
  const showWhatsappManual = (tipo === 'derivacion_whatsapp' || tipo === 'ausente');

  const bd = document.getElementById('bloqueDerivacion');
  const wm = document.getElementById('whatsappManualCard');

  if(bd) bd.style.display = showDerivacion ? '' : 'none';

  if(!showDerivacion){
    const d = document.getElementById('derivador'); if(d) d.value='';
    const i = document.getElementById('indicacion'); if(i) i.value='';
  }

  if(wm){
    if(showWhatsappManual){
      wm.style.setProperty('display', 'block', 'important');
      wm.classList.add('manual-visible');
      // No se llama refreshManualPreview aquí porque esta función corre antes
      // de inicializar las constantes del bloque manual. Así no se rompe la BD.
    } else {
      wm.style.setProperty('display', 'none', 'important');
      wm.classList.remove('manual-visible');
    }
  }
}
setPlantilla();
$('#tipoMensaje').addEventListener('change', setPlantilla);
setupEncuestaUI_();

function normalizarLinkPublico(s){
  const url = String(s||'').trim();
  if(!url) return '';
  const mFile = url.match(/drive\.google\.com\/file\/d\/([^/]+)/i);
  if(mFile) return `https://drive.google.com/uc?export=download&id=${mFile[1]}`;
  const mOpen = url.match(/drive\.google\.com\/open\?id=([^&]+)/i);
  if(mOpen) return `https://drive.google.com/uc?export=download&id=${mOpen[1]}`;
  const mUc = url.match(/drive\.google\.com\/uc\?id=([^&]+)/i);
  if(mUc) return `https://drive.google.com/uc?export=download&id=${mUc[1]}`;
  return url;
}
function obtenerLinksPublicos(){
  const raw = ($('#linksPublicos').value||'').trim();
  if(!raw) return [];
  return raw.split(/\r?\n/).map(s=>s.trim()).filter(Boolean).map(normalizarLinkPublico);
}
function actualizarPreviewLinks(){
  const links = obtenerLinksPublicos();
  const box = $('#linksPreview');
  if(!links.length){ box.hidden = true; box.innerHTML=''; return; }
  box.hidden = false;
  box.innerHTML = '<b>Enlaces activos:</b><br>' + links.map((l,i)=>`${i+1}. ${l}`).join('<br>');
}
$('#linksPublicos').addEventListener('input', actualizarPreviewLinks);

function escapeHtml(str){ return String(str).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[m])); }
function normalizeDocumentoRut(value){
  return String(value || '').replace(/\./g,'').replace(/\s+/g,'').trim().toUpperCase();
}
function extraerDatosPaciente(nombreOriginal){
  const raw = String(nombreOriginal || '').replace(/\s+/g,' ').trim();
  if(!raw) return { nombre:'', sexo:'', edad:'' };
  let match = raw.match(/\((H|M),\s*(\d{1,3})\)\s*$/i);
  if(match){
    const sexo = String(match[1] || '').toUpperCase();
    const edadNum = parseInt(match[2], 10);
    const edad = (!isNaN(edadNum) && edadNum >= 0 && edadNum <= 120) ? String(edadNum) : '';
    const nombre = raw.replace(/\((H|M),\s*(\d{1,3})\)\s*$/i, '').trim();
    return { nombre, sexo, edad };
  }
  match = raw.match(/(?:\(|-|,|\s)\s*(\d{1,3})\s*(?:años?)?\)?\s*$/i);
  if(match){
    const edadNum = parseInt(match[1], 10);
    if(!isNaN(edadNum) && edadNum >= 0 && edadNum <= 120){
      const nombre = raw.replace(/(?:\(|-|,|\s)\s*(\d{1,3})\s*(?:años?)?\)?\s*$/i, '').trim();
      return { nombre, sexo:'', edad:String(edadNum) };
    }
  }
  return { nombre: raw, sexo:'', edad:'' };
}

function formatPacienteDisplay(r){
  const nombre = String(r?.paciente || '').trim();
  const sexo = String(r?.sexo || '').trim().toUpperCase();
  const edad = String(r?.edad || '').trim();
  if(sexo && edad) return `${nombre} (${sexo}, ${edad})`;
  if(edad) return `${nombre} (${edad})`;
  return nombre;
}

function reviveCacheRows(rows){
  return (Array.isArray(rows) ? rows : []).map(r => {
    const item = Object.assign({}, r || {});
    if(item.compDate && !(item.compDate instanceof Date)){
      const revived = parseMaybeDate(item.compDate);
      item.compDate = revived || null;
    }
    return item;
  });
}

function saveCacheState(){
  try{
    const payload = {
      ts: Date.now(),
      data: DATA,
      activeDocumentoRut,
      retrasosWhatsapp: Array.from(retrasoWhatsappKeys.entries()),
      retrasosMinutos: Array.from(retrasoMinutosKeys.entries()),
      autoTodayFilterActive,
      q: document.getElementById('q')?.value || '',
      showFilter: document.getElementById('showFilter')?.value || '__todos__',
      fFechaFrom: document.getElementById('fFechaFrom')?.value || '',
      fFechaTo: document.getElementById('fFechaTo')?.value || ''
    };
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  }catch(e){}
}

function restoreCacheState(){
  try{
    const raw = sessionStorage.getItem(CACHE_KEY);
    if(!raw) return false;
    const cache = JSON.parse(raw);
    if(!cache || !Array.isArray(cache.data) || !cache.ts) return false;
    if(Date.now() - cache.ts > CACHE_TTL_MS) return false;

    DATA = reviveCacheRows(cache.data);
    activeDocumentoRut = cache.activeDocumentoRut || '';
    const retrasosCache = Array.isArray(cache.retrasosWhatsapp) ? cache.retrasosWhatsapp : [];
    retrasoWhatsappKeys = new Map(retrasosCache.map(item => {
      if(Array.isArray(item)) return [String(item[0] || ''), String(item[1] || 'atencion')];
      return [String(item || ''), 'atencion'];
    }).filter(item => item[0]));
    const retrasosMinutosCache = Array.isArray(cache.retrasosMinutos) ? cache.retrasosMinutos : [];
    retrasoMinutosKeys = new Map(retrasosMinutosCache.map(item => {
      if(Array.isArray(item)) return [String(item[0] || ''), String(item[1] || '')];
      return ['', ''];
    }).filter(item => item[0]));
    autoTodayFilterActive = !!cache.autoTodayFilterActive;
    restoredFromCache = true;

    const qEl = document.getElementById('q');
    const fromEl = document.getElementById('fFechaFrom');
    const toEl = document.getElementById('fFechaTo');
    const showEl = document.getElementById('showFilter');
    const st = document.getElementById('dbStatus');

    if(qEl) qEl.value = cache.q || '';
    if(fromEl) fromEl.value = cache.fFechaFrom || '';
    if(toEl) toEl.value = cache.fFechaTo || '';

    poblarEstadosUnicos();
    if(showEl && [...showEl.options].some(o => o.value === (cache.showFilter || '__todos__'))){
      showEl.value = cache.showFilter || '__todos__';
    }
    if(st) st.textContent = '✅ BD restaurada desde caché local (vigente 10 min).';
    return true;
  }catch(e){
    return false;
  }
}


function buildDocumentoPayload(r){
  return {
    nombre: String(r?.paciente || r?.nombre || r?.nombreCompleto || '').trim(),
    rut: String(r?.rut || r?.run || '').trim(),
    edad: String(r?.edad || '').trim()
  };
}

function hasPortalParent(){
  return !!(window.parent && window.parent !== window);
}

function isStandaloneDisplay(){
  try {
    return !!(
      (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
      window.navigator.standalone === true
    );
  } catch (error) {
    return false;
  }
}

function portalTargetOrigin(){
  return location.origin && location.origin !== 'null' ? location.origin : '*';
}

function persistDocumentoPaciente(payload){
  try {
    const envelope = { version:1, payload:buildDocumentoPayload(payload), ts:Date.now(), source:'comunicaciones' };
    sessionStorage.setItem(DOCUMENTO_STORAGE_KEY, JSON.stringify(envelope));
  } catch (error) {
    console.warn('No se pudo guardar temporalmente el paciente activo:', error);
  }
}

function clearStoredDocumentoPaciente(){
  try { sessionStorage.removeItem(DOCUMENTO_STORAGE_KEY); } catch (error) {}
}

function navigateToStandaloneReceta(){
  const shouldNavigate = !hasPortalParent() || isStandaloneDisplay();
  if (!shouldNavigate) return;
  try {
    const targetUrl = new URL(MOBILE_RECETA_URL, window.location.href).href;
    if (targetUrl && targetUrl !== window.location.href) window.location.href = targetUrl;
  } catch (error) { console.warn('No se pudo navegar al documento clínico:', error); }
}

