function renderFranjaPacienteCard(info, visibleInList){
  const card = document.getElementById('franjaPacienteCard');
  if(!card) return;

  if(!info || !info.row){
    card.hidden = false;
    card.innerHTML = `
      <div class="auto-slot-top">
        <div>
          <div class="auto-slot-kicker">⏱ Paciente según hora actual</div>
          <div class="auto-slot-name">Sin pacientes para hoy</div>
          <div class="auto-slot-meta">No hay citas cargadas para la fecha actual.</div>
        </div>
        <span class="auto-slot-badge">${escapeHtml(formatTime(new Date()))}</span>
      </div>`;
    return;
  }

  const r = info.row;
  const distanciaTxt = info.distanceMin == null
    ? ''
    : (info.label === 'Franja actual'
        ? ` · hace ${info.distanceMin} min aprox.`
        : ` · en ${info.distanceMin} min aprox.`);

  card.hidden = false;
  card.innerHTML = `
    <div class="auto-slot-top">
      <div>
        <div class="auto-slot-kicker">⏱ Paciente según hora actual</div>
        <div class="auto-slot-name">${escapeHtml(formatPacienteDisplay(r) || 'Sin nombre')}</div>
        <div class="auto-slot-meta">
          ${escapeHtml(info.label)}${distanciaTxt}<br>
          Hora cita: <b>${escapeHtml(r.horaFmt || '—')}</b> · Fecha: ${escapeHtml(r.fechaFmt || '—')} · RUN: ${escapeHtml(r.rut || '—')}
        </div>
      </div>
      <span class="auto-slot-badge">Ahora ${escapeHtml(info.horaActual)}</span>
    </div>
    <div class="auto-slot-actions">
      <button class="btn auto-slot-btn primary" id="franjaScrollBtn" type="button" ${visibleInList ? '' : 'disabled'}>🎯 Ir al paciente</button>
      <button class="btn auto-slot-btn" id="franjaRefreshBtn" type="button">Actualizar ahora</button>
    </div>`;

  document.getElementById('franjaScrollBtn')?.addEventListener('click', () => scrollToFranjaPaciente());
  document.getElementById('franjaRefreshBtn')?.addEventListener('click', () => {
    autoScrollFranjaPending = true;
    render();
  });
}
function renderDocumentoStatus(){
  const nameEl = document.getElementById('documentoStatusName');
  const metaEl = document.getElementById('documentoStatusMeta');
  const badgeEl = document.getElementById('documentoStatusBadge');
  if(!nameEl || !metaEl || !badgeEl) return;
  const activeRow = DATA.find(r => normalizeDocumentoRut(r.rut) === activeDocumentoRut);
  if(!activeRow){
    nameEl.textContent = 'Sin paciente activo';
    metaEl.textContent = 'Marca UDC en un paciente para enviarlo al documento clínico.';
    badgeEl.textContent = 'Sin enviar';
    badgeEl.classList.remove('active');
    return;
  }
  nameEl.textContent = activeRow.paciente || 'Paciente sin nombre';
  const metaParts = [];
  if(activeRow.rut) metaParts.push(`RUN/RUT: ${activeRow.rut}`);
  if(activeRow.edad) metaParts.push(`Edad: ${activeRow.edad}`);
  if(activeRow.fechaFmt) metaParts.push(`Fecha: ${activeRow.fechaFmt}`);
  metaEl.textContent = metaParts.join(' · ') || 'Paciente enviado al documento clínico.';
  badgeEl.textContent = 'Paciente enviado a documento';
  badgeEl.classList.add('active');
}

function jsonpFetch_(baseUrl, params) {
  return new Promise((resolve, reject) => {
    try {
      const cbName = 'orionCb_' + Math.random().toString(36).slice(2);
      params = params || {};
      params.callback = cbName;

      const qs = Object.keys(params)
        .map(k => encodeURIComponent(k) + '=' + encodeURIComponent(String(params[k])))
        .join('&');

      const url = baseUrl + (baseUrl.includes('?') ? '&' : '?') + qs;

      let done = false;
      window[cbName] = (data) => {
        done = true;
        try { resolve(data); } finally { cleanup(); }
      };

      const s = document.createElement('script');
      s.src = url;
      s.async = true;

      const t = setTimeout(() => {
        if (done) return;
        cleanup();
        reject(new Error('Timeout JSONP (15s)'));
      }, 15000);

      function cleanup() {
        try { clearTimeout(t); } catch(e) {}
        try { delete window[cbName]; } catch(e) { window[cbName] = undefined; }
        try { s.remove(); } catch(e) {}
      }

      s.onerror = () => {
        if (done) return;
        cleanup();
        reject(new Error('Error cargando script JSONP'));
      };

      document.body.appendChild(s);
    } catch (e) {
      reject(e);
    }
  });
}

function prepRowFromDb_(obj) {
  const r = obj || {};
  const fechaRaw = r['FECHA'] ?? r['Fecha'] ?? r['fecha'] ?? '';
  const horaRaw  = r['HORA']  ?? r['Hora']  ?? r['hora']  ?? '';
  const fh = formatFechaHora(fechaRaw, horaRaw);

  const pacienteRaw = String(r['PACIENTE'] ?? r['Paciente'] ?? r['paciente'] ?? '').trim();
  const edadSeparada = String(r['EDAD'] ?? r['Edad'] ?? r['edad'] ?? '').trim();
  const datosPaciente = extraerDatosPaciente(pacienteRaw);
  const edadFinal = edadSeparada || datosPaciente.edad || '';

  return {
    paciente: datosPaciente.nombre,
    sexo: datosPaciente.sexo,
    edad: edadFinal,
    rut: String(r['RUN'] ?? r['RUT'] ?? r['Rut'] ?? r['run'] ?? '').trim(),
    telefono: cleanPhone(r['TELEFONO'] ?? r['Teléfono'] ?? r['Telefono'] ?? r['telefono'] ?? ''),
    estado: String(r['STATUS'] ?? r['Status'] ?? r['estado'] ?? '').trim(),
    motivo: (String(r['MOTIVO'] ?? r['Motivo'] ?? r['motivo'] ?? 'SIN REGISTRO').trim() || 'SIN REGISTRO'),
    fechaFmt: fh.fechaFmt,
    horaFmt: fh.horaFmt,
    datetimeFmt: fh.datetimeFmt,
    compDate: fh.compDate,
    linksRow: []
  };
}

async function pingDb_() {
  const url = (document.getElementById('dbWebappUrl')?.value || '').trim();
  const tok = (document.getElementById('dbToken')?.value || '').trim();
  const sh  = (document.getElementById('dbSheet')?.value || 'DB').trim();
  const st = document.getElementById('dbStatus');
  if (!url) return alert('Falta la URL del WebApp.');
  if (!tok) return alert('Falta el token.');
  if (st) st.textContent = 'Probando…';
  try {
    const data = await jsonpFetch_(url, { action:'ping', token: tok, sheet: sh });
    if (data && data.ok) {
      if (st) st.textContent = '✅ Conexión OK: ' + (data.ts || '');
    } else {
      if (st) st.textContent = '⚠️ Respuesta: ' + JSON.stringify(data);
    }
  } catch (e) {
    if (st) st.textContent = '❌ Error: ' + (e && e.message ? e.message : e);
  }
}

async function loadDb_() {
  const url = (document.getElementById('dbWebappUrl')?.value || '').trim();
  const tok = (document.getElementById('dbToken')?.value || '').trim();
  const sh  = (document.getElementById('dbSheet')?.value || 'DB').trim();
  const st = document.getElementById('dbStatus');
  if (!url) return alert('Falta la URL del WebApp.');
  if (!tok) return alert('Falta el token.');
  if (st) st.textContent = 'Cargando BD…';
  try {
    const data = await jsonpFetch_(url, { action:'list', token: tok, sheet: sh });
    if (!data || !data.ok) {
      if (st) st.textContent = '❌ No se pudo leer BD: ' + (data && data.error ? data.error : 'Respuesta inválida');
      return;
    }
    const rows = Array.isArray(data.rows) ? data.rows : [];
    restoredFromCache = false;
    DATA = rows.map(prepRowFromDb_);
    poblarEstadosUnicos();
    applyTodayFilter();
    autoScrollFranjaPending = true;
    if (st) st.textContent = '✅ BD cargada: ' + DATA.length + ' filas (' + sh + ').';
    render();
    saveCacheState();
  } catch (e) {
    if (st) st.textContent = '❌ Error: ' + (e && e.message ? e.message : e);
  }
}

function mapLower(obj){ const m={}; for(const k in obj){ m[String(k).trim().toLowerCase()] = obj[k]; } return m; }
function extractUrlsFromCell(val){
  if(val == null) return [];
  const s = String(val);
  const pieces = s.split(/[\s,\n\r]+/);
  const re = /^(https?:\/\/[^\s]+)$/i;
  return pieces.filter(x => re.test(x));
}
