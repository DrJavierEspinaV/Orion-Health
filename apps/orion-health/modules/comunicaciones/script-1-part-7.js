async function copyLinks(){
  const rows = Array.from(listEl.children).filter(el => el.classList.contains('row'));
  const lines = [];
  for(const row of rows){
    const name  = row.querySelector('.paciente-nombre')?.textContent?.trim() || '';
    const rut   = row.children[1]?.textContent?.trim() || '';
    const fecha = row.children[2]?.textContent?.trim() || '';
    const hora  = row.children[3]?.textContent?.trim() || '';
    const estado= row.children[4]?.textContent?.trim() || '';
    const motivo= row.children[5]?.textContent?.trim() || '';
    const link  = row.querySelector('a.btn.whatsapp')?.href || '';
    lines.push(`${name} | ${rut} | ${fecha} ${hora} | ${estado} | ${motivo} | ${link}`);
  }
  try{ await navigator.clipboard.writeText(lines.join('\n')); alert('Lista copiada al portapapeles (con enlaces).'); }
  catch(e){ console.warn(e); alert('No se pudo copiar automáticamente. Selecciona y copia manualmente.'); }
}

/* ================== WHATSAPP MANUAL ================== */
const manualPhoneEl = document.getElementById('manualPhone');
const manualNameEl  = document.getElementById('manualName');
const manualCopyEl  = document.getElementById('manualCopy');
const manualOpenEl  = document.getElementById('manualOpen');
const manualPrevEl  = document.getElementById('manualPreview');
const manualHintEl  = document.getElementById('manualPhoneHint');

function normalizeManualPhone(){
  if(!manualPhoneEl) return '';
  const raw = manualPhoneEl.value || '';
  let s = raw.replace(/[^0-9]/g,'');
  if(!s){ if(manualHintEl) manualHintEl.textContent = ''; return ''; }
  s = s.replace(/^0+/, '');
  if (s.startsWith('56') && s.length >= 3 && s[2] === '0') s = '56' + s.slice(3);
  if (!s.startsWith('56') && s.length === 9 && s[0] === '9') s = '56' + s;
  if (!s.startsWith('56') && s.length >= 8 && s.length <= 10) s = '56' + s;
  if (s.startsWith('560') && s.length === 12) s = '56' + s.slice(3);
  if(manualHintEl) manualHintEl.textContent = `Se usará: +${s}`;
  return s;
}
function buildManualMessage(){
  const r = { paciente: (manualNameEl?.value||'').trim(), fechaFmt: '', datetimeFmt: '' };
  return buildMessage(r, '');
}
function getManualLink(){
  const phone = normalizeManualPhone();
  if(!phone) return '';
  const msg = buildManualMessage();
  return buildWaUrl(phone, msg);
}
function refreshManualPreview(){
  if(!manualPrevEl) return;
  const link = getManualLink();
  if(!link){ manualPrevEl.hidden = true; manualPrevEl.innerHTML=''; return; }
  manualPrevEl.hidden = false;
  manualPrevEl.innerHTML = `<b>Enlace:</b><br><span class="mono" style="word-break:break-all">${link}</span>`;
}
manualPhoneEl?.addEventListener('input', refreshManualPreview);
manualNameEl?.addEventListener('input', refreshManualPreview);

manualCopyEl?.addEventListener('click', async ()=>{
  const link = getManualLink();
  if(!link) return alert('Ingresa un número válido.');
  try{ await navigator.clipboard.writeText(link); alert('✅ Enlace copiado.'); }
  catch(e){ alert('No se pudo copiar automáticamente. Copia desde la vista previa.'); }
});

manualOpenEl?.addEventListener('click', ()=>{
  const link = getManualLink();
  if(!link) return alert('Ingresa un número válido.');
  manualOpenEl.setAttribute('href', link);
});

/* ================== EVENTOS GLOBALES ================== */
document.getElementById('file').addEventListener('change', onExcel);
document.getElementById('showFilter').addEventListener('change', render);
document.getElementById('q').addEventListener('input', render);
document.getElementById('export').addEventListener('click', copyLinks);
document.getElementById('copiarMensaje').addEventListener('click', ()=>{
  const m = ($('#mensajeTipo').value||'').trim();
  if(!m) return alert('Mensaje vacío.');
  navigator.clipboard.writeText(m).then(()=>alert('✅ Mensaje Copiado.'));
});
document.getElementById('generar').addEventListener('click', render);

document.getElementById('dbLoad')?.addEventListener('click', loadDb_);
document.getElementById('dbPing')?.addEventListener('click', pingDb_);

/* ====== Toggle estética Orion ====== */
const themeToggle = document.getElementById('toggleTheme');
function applyThemeFromStorage(){
  try{
    const v = localStorage.getItem('orion_theme') || 'off';
    if(v === 'on'){ document.body.classList.add('theme-orion'); if(themeToggle) themeToggle.checked = true; }
  } catch(e){}
}
applyThemeFromStorage();
themeToggle?.addEventListener('change', () => {
  const on = !!themeToggle.checked;
  if(on){ document.body.classList.add('theme-orion'); localStorage.setItem('orion_theme','on'); }
  else { document.body.classList.remove('theme-orion'); localStorage.setItem('orion_theme','off'); }
});

/* === FECHA FILTER: listeners === */
document.getElementById('fFechaFrom')?.addEventListener('change', ()=>{ clearDateFilterState(); render(); });
document.getElementById('fFechaTo')?.addEventListener('change', ()=>{ clearDateFilterState(); render(); });
document.getElementById('fFechaToday')?.addEventListener('click', ()=>{ applyTodayFilter(); render(); });
document.getElementById('fFechaClear')?.addEventListener('click', ()=>{
  const a=document.getElementById('fFechaFrom'); const b=document.getElementById('fFechaTo');
  if(a) a.value=''; if(b) b.value='';
  clearDateFilterState();
  render();
});

/* ✅ Auto-carga BD al abrir + caché 10 min */
const cacheRestoredOnStart = restoreCacheState();
render();


setTimeout(()=>{
  try{
    if(cacheRestoredOnStart && Array.isArray(DATA) && DATA.length){
      return;
    }
    const url = (document.getElementById('dbWebappUrl')?.value || '').trim();
    if(!url) return;
    loadDb_();
  }catch(e){}
}, 350);

setInterval(()=>{
  try{
    if(document.hidden || !Array.isArray(DATA) || !DATA.length) return;
    render();
  }catch(e){}
}, 60000);

