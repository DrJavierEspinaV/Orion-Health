function postToPortal(message){
  try { if (hasPortalParent()) window.parent.postMessage(message, portalTargetOrigin()); }
  catch (error) { console.warn('No fue posible comunicarse con el Portal ORION:', error); }
}

function syncDocumentoPaciente(r){
  const payload = buildDocumentoPayload(r);
  persistDocumentoPaciente(payload);
  postToPortal({ type: DOCUMENTO_EVENT_SET, payload });
  postToPortal({ type: LEGACY_EVENT_SET, payload });
  postToPortal({ type: DOCUMENTO_EVENT_NAV, appKey: 'cmf' });
  navigateToStandaloneReceta();
}

function clearDocumentoPaciente(){
  clearStoredDocumentoPaciente();
  postToPortal({ type: DOCUMENTO_EVENT_CLEAR });
  postToPortal({ type: LEGACY_EVENT_CLEAR });
}

function cleanPhone(t){
  let s = String(t||'').replace(/[^0-9]/g,'');
  if(!s) return '';
  s = s.replace(/^0+/, '');
  if (s.startsWith('56') && s.length >= 3 && s[2] === '0') s = '56' + s.slice(3);
  if (!s.startsWith('56') && s.length === 9 && s[0] === '9') s = '56' + s;
  if (!s.startsWith('56') && s.length >= 8 && s.length <= 10) s = '56' + s;
  if (s.startsWith('560') && s.length === 12) s = '56' + s.slice(3);
  return s;
}
function excelSerialToDate(n){
  const d = new Date(1899, 11, 30);
  const days = Math.floor(n);
  const frac = n - days;
  d.setDate(d.getDate() + days);
  const totalSeconds = Math.round(frac * 86400);
  const hh = Math.floor(totalSeconds / 3600);
  const mm = Math.floor((totalSeconds % 3600) / 60);
  const ss = totalSeconds % 60;
  d.setHours(hh, mm, ss, 0);
  return d;
}
function parseMaybeDate(v){
  if(v == null || v === '') return null;
  if(typeof v === 'number') return excelSerialToDate(v);
  if(v instanceof Date) return v;
  const s = String(v).trim();
  const iso = Date.parse(s);
  if(!isNaN(iso)) return new Date(iso);
  const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})(?:\s+(\d{1,2}):(\d{2}))?$/);
  if(m){
    const d = parseInt(m[1],10), M=parseInt(m[2],10)-1, y=parseInt(m[3].length===2?('20'+m[3]):m[3],10);
    const hh=parseInt(m[4]||'0',10), mm=parseInt(m[5]||'0',10);
    return new Date(y,M,d,hh,mm,0);
  }
  return null;
}
function formatDate(d){ const pad=n=>String(n).padStart(2,'0'); return `${pad(d.getDate())}-${pad(d.getMonth()+1)}-${d.getFullYear()}`; }
function formatTime(d){ const pad=n=>String(n).padStart(2,'0'); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; }

/* ✅ FIX HORA: ISO con Z se lee en UTC para NO restar zona horaria */
function formatFechaHora(fecha, hora){
  let dFecha = parseMaybeDate(fecha);
  let dHora = null;

  if(typeof hora === 'number' && hora > 0 && hora < 1){
    const secs = Math.round(hora * 86400);
    const hh = Math.floor(secs/3600), mm = Math.floor((secs%3600)/60);
    dHora = {hh, mm};
  } else if(typeof hora === 'string' && hora.trim()){
    const hs = hora.trim();

    // Caso ISO DateTime: "1899-12-30T08:00:00.000Z" -> usar UTC
    if(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(hs)){
      const dh = new Date(hs);
      if(!isNaN(dh.getTime())){
        dHora = { hh: dh.getUTCHours(), mm: dh.getUTCMinutes() };
      }
    }

    // Caso "08:00" / "08:00:00"
    if(!dHora){
      const m = hs.match(/^(\d{1,2}):(\d{2})/);
      if(m){ dHora = {hh:parseInt(m[1],10), mm:parseInt(m[2],10)}; }
    }
  }

  let full = null;
  if(dFecha){
    full = new Date(dFecha);
    if(dHora){ full.setHours(dHora.hh||0, dHora.mm||0, 0, 0); }
  }
  const fechaFmt = dFecha ? formatDate(dFecha) : '';
  const horaFmt = full ? formatTime(full) : (dHora? `${String(dHora.hh).padStart(2,'0')}:${String(dHora.mm).padStart(2,'0')}` : '');
  const datetimeFmt = full ? `${formatDate(full)} ${formatTime(full)}` : (fechaFmt || '') + (horaFmt? ` ${horaFmt}`:'');
  return {fechaFmt, horaFmt, datetimeFmt, compDate: full || dFecha || null};
}

function parseDateInput(val){
  if(!val) return null;
  const [y,m,d] = val.split('-').map(n=>parseInt(n,10));
  if(!y||!m||!d) return null;
  return new Date(y, m-1, d, 0,0,0,0);
}

function formatInputDate(d){
  const pad=n=>String(n).padStart(2,'0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
}
function applyTodayFilter(){
  const today = new Date();
  const todayStr = formatInputDate(today);
  const fromEl = document.getElementById('fFechaFrom');
  const toEl = document.getElementById('fFechaTo');
  if(fromEl) fromEl.value = todayStr;
  if(toEl) toEl.value = todayStr;
  autoTodayFilterActive = true;
  renderTodayLabel();
}
function clearDateFilterState(){
  autoTodayFilterActive = false;
  renderTodayLabel();
}
function renderTodayLabel(){
  const chip = document.getElementById('filterTodayLabel');
  if(!chip) return;
  const fromVal = document.getElementById('fFechaFrom')?.value || '';
  const toVal = document.getElementById('fFechaTo')?.value || '';
  const todayStr = formatInputDate(new Date());
  const isToday = fromVal && toVal && fromVal === todayStr && toVal === todayStr;
  chip.hidden = !isToday;
}

function isSameLocalDate_(a, b){
  if(!(a instanceof Date) || isNaN(a.getTime())) return false;
  return a.getFullYear() === b.getFullYear() &&
         a.getMonth() === b.getMonth() &&
         a.getDate() === b.getDate();
}

function getPacienteFranjaActual(rows){
  const now = new Date();
  const hoy = (Array.isArray(rows) ? rows : [])
    .map(r => {
      const d = r.compDate instanceof Date ? r.compDate : parseMaybeDate(r.compDate);
      return { r, d };
    })
    .filter(x => x.d && !isNaN(x.d.getTime()) && isSameLocalDate_(x.d, now))
    .sort((a,b)=>a.d.getTime() - b.d.getTime());

  if(!hoy.length) return null;

  const nowMs = now.getTime();
  const pastWindowMs = AUTO_FRANJA_PASADA_MIN * 60 * 1000;
  const nextWindowMs = AUTO_FRANJA_PROXIMA_MIN * 60 * 1000;

  let anterior = null;
  let proxima = null;

  for(const item of hoy){
    const t = item.d.getTime();
    if(t <= nowMs) anterior = item;
    if(t > nowMs && !proxima) proxima = item;
  }

  let selected = null;
  let label = '';
  let distanceMin = null;

  if(anterior && (nowMs - anterior.d.getTime()) <= pastWindowMs){
    selected = anterior;
    label = 'Franja actual';
    distanceMin = Math.max(0, Math.round((nowMs - anterior.d.getTime()) / 60000));
  } else if(proxima && (proxima.d.getTime() - nowMs) <= nextWindowMs){
    selected = proxima;
    label = 'Próxima franja';
    distanceMin = Math.max(0, Math.round((proxima.d.getTime() - nowMs) / 60000));
  } else if(proxima){
    selected = proxima;
    label = 'Siguiente paciente de hoy';
    distanceMin = Math.max(0, Math.round((proxima.d.getTime() - nowMs) / 60000));
  } else {
    selected = anterior || hoy[hoy.length - 1];
    label = 'Última franja de hoy';
    distanceMin = anterior ? Math.max(0, Math.round((nowMs - anterior.d.getTime()) / 60000)) : null;
  }

  if(!selected) return null;

  return {
    row: selected.r,
    key: getRetrasoRowKey(selected.r),
    label,
    distanceMin,
    horaActual: formatTime(now),
    fechaActual: formatDate(now)
  };
}

function scrollToFranjaPaciente(){
  const target = document.querySelector('.row.franja-auto-active > div');
  if(!target) return false;
  target.scrollIntoView({ behavior:'smooth', block:'center' });
  return true;
}

