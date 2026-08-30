function prepRow(r){
  const low = mapLower(r);
  const pacienteRaw = r['Paciente/edad/sexo'] || r['Paciente'] || r['paciente'] || low['paciente/edad/sexo'] || '';
  const edadSeparada = String(r['Edad'] ?? r['EDAD'] ?? r['edad'] ?? low['edad'] ?? '').trim();
  const datosPaciente = extraerDatosPaciente(String(pacienteRaw || '').trim());
  const paciente = datosPaciente.nombre;
  const edad = edadSeparada || datosPaciente.edad || '';
  const sexo = datosPaciente.sexo || '';

  const rut = r['Nº documento'] ?? r['N° Documento'] ?? r['N° documento'] ?? r['Nº Documento'] ??
              r['RUN'] ?? r['run'] ?? r['Rut'] ?? r['RUT'] ??
              low['nº documento'] ?? low['n° documento'] ?? low['numero documento'] ?? '';
  const telefonoRaw = r['WhatsApp'] ?? r['whatsapp'] ?? r['Teléfono'] ?? r['telefono'] ?? r['Telefono'] ??
                      r['Celular'] ?? r['celular'] ?? r['Fono'] ?? r['fono'] ?? '';
  const telefono = cleanPhone(telefonoRaw);
  const estado = window.ORION_APPOINTMENT_STATUS.fromRow(r);
  let motivo = r['Txt.tp.planificación'] ?? r['txt.tp.planificación'] ?? r['Motivo consulta'] ?? r['motivo consulta'] ?? '';
  motivo = String(motivo||'').trim() || 'SIN REGISTRO';
  const fechaRaw = r['fecha'] ?? r['Fecha'] ?? r['FECHA'] ?? '';
  const horaRaw  = r['hora']  ?? r['Hora']  ?? r['HORA']  ?? '';
  const {fechaFmt, horaFmt, datetimeFmt, compDate} = formatFechaHora(fechaRaw, horaRaw);

  let linksRow = [];
  const candidateCols = ['Enlace','ENLACE','Link','LINK','URL','Urls','Archivos','Adjuntos','Links','link','url','urls','adjuntos','archivos'];
  for(const key in r){
    const label = String(key||'');
    if(candidateCols.includes(label)){ linksRow = linksRow.concat(extractUrlsFromCell(r[key])); }
  }
  if(linksRow.length === 0){ for(const key in r){ linksRow = linksRow.concat(extractUrlsFromCell(r[key])); } }
  linksRow = linksRow.map(normalizarLinkPublico).filter(Boolean);

  return { paciente, sexo, edad, rut, telefono, estado: String(estado).trim(), motivo, fechaFmt, horaFmt, datetimeFmt, compDate, linksRow };
}
async function onExcel(e){
  const file = e.target.files[0]; if(!file) return;
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, {type:'array'});
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, {defval:""});
  restoredFromCache = false;
  DATA = rows.map(prepRow);
  poblarEstadosUnicos();
  applyTodayFilter();
  autoScrollFranjaPending = true;
  alert(`✅ Excel cargado: ${DATA.length} filas. Se usarán enlaces por paciente si están en el Excel.`);
  render();
  saveCacheState();
}

function statusPill(estado){
  const category=window.ORION_APPOINTMENT_STATUS.category(estado);
  return `<span class="pill ${category}">${escapeHtml(estado||'Sin estado')}</span>`;
}
function poblarEstadosUnicos(){
  const sel = $('#showFilter');
  const current = sel.value;
  const valores = Array.from(new Set(DATA.map(r => (r.estado||'').toString().trim()).filter(Boolean))).sort((a,b)=>a.localeCompare(b,'es'));
  sel.innerHTML = `<option value="__todos__">Todos los estados</option>` + valores.map(v=>`<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`).join('');
  if([...sel.options].some(o=>o.value===current)){ sel.value = current; }
}


function getTextoRetrasoWhatsapp(r, tipoRetraso, minutosEstimados=''){
  const paciente = String(r?.paciente || '').trim();
  const saludo = paciente ? `Hola ${paciente},` : 'Hola,';
  const tipo = String(tipoRetraso || '').trim().toLowerCase();
  const minutos = String(minutosEstimados || '').trim();
  const fraseMinutos = minutos ? `, aproximadamente de ${minutos} minutos` : '';

  if(tipo === 'llegada'){
    return `${saludo} Le escribe el Dr. Javier Espina Videla de Cirugía Maxilofacial del CCMM IntegraMédica Tobalaba. Le aviso que vengo con retraso en mi llegada al Centro Médico, por lo que la Atención podría iniciar más tarde de lo programado${fraseMinutos}.

Le pido disculpas por la Espera y Agradezco su Paciencia y Comprensión.`;
  }

  if(tipo === 'atencion'){
    return `${saludo} Le escribe el Dr. Javier Espina Videla de Cirugía Maxilofacial del CCMM IntegraMédica Tobalaba. Estamos con retraso en la Atención Clínica${fraseMinutos}, pero seguimos avanzando con la Agenda.

Gracias por su Paciencia y Comprensión.`;
  }

  return '';
}

function getRetrasoRowKey(r){
  const rut = normalizeDocumentoRut(r?.rut);
  const phone = cleanPhone(r?.telefono);
  return [
    rut || phone || String(r?.paciente || '').trim(),
    String(r?.fechaFmt || '').trim(),
    String(r?.horaFmt || '').trim(),
    String(r?.motivo || '').trim()
  ].join('|');
}

function buildMessage(r, estadoLabel, tipoRetraso='', minutosEstimados=''){
  const avisoRetrasoExclusivo = getTextoRetrasoWhatsapp(r, tipoRetraso === true ? 'atencion' : tipoRetraso, minutosEstimados);
  if(avisoRetrasoExclusivo) return avisoRetrasoExclusivo;

  const tipo = $('#tipoMensaje').value;
  let base = ($('#mensajeTipo').value||'').trim();
  const fechaStr = r.datetimeFmt || r.fechaFmt || '';
  base = base
    .replace(/\{\{PACIENTE\}\}/g, r.paciente||'')
    .replace(/\{\{FECHA_HORA\}\}/g, fechaStr)
    .replace(/\{\{DERIVADOR\}\}/g, ($('#derivador')?.value||'').trim())
    .replace(/\{\{INDICACION\}\}/g, ($('#indicacion')?.value||'').trim());

  const linksGenerales = obtenerLinksPublicos();
  const rx = (document.getElementById('linkRx')?.value||'').trim();
  const ppto = (document.getElementById('linkPpto')?.value||'').trim();

  const partes = [];
  if(rx) partes.push('Radiografía:\n1. ' + normalizarLinkPublico(rx));
  if(ppto) partes.push('Presupuesto:\n1. ' + normalizarLinkPublico(ppto));

  const linksFila = (Array.isArray(r.linksRow) && r.linksRow.length) ? r.linksRow : [];
  const allLinks = linksFila.length ? linksFila : linksGenerales;
  if(allLinks.length) partes.push('Adjuntos:\n' + allLinks.map((l,i)=>`${i+1}. ${l}`).join('\n'));

  const adjStr = partes.length ? partes.join('\n\n') : '[sin adjuntos]';

  if(/\{\{ADJUNTOS\}\}/.test(base)){ base = base.replace(/\{\{ADJUNTOS\}\}/g, adjStr); }
  else{ base = `${base}\n\n${adjStr}`; }

  if(tipo === 'ausente'){ base = base.replace(/\{\{ESTADO\}\}/g, estadoLabel||''); }
  else{ base = base.replace(/\{\{ESTADO\}\}/g, ''); }

  base = applyEncuestaToMessage_(base);


  base = base.replace(/\n?\s*\{\{ENCUESTA\}\}\s*\n?/g, '\n');
  base = base.replace(/\n{3,}/g,'\n\n');

  return base.trim();
}

function buildWaUrl(phone, text){
  const encoded = encodeURIComponent(text);
  const waMe = `https://wa.me/${phone}?text=${encoded}`;
  const api = `https://api.whatsapp.com/send?phone=${phone}&text=${encoded}`;
  const isMobile = /Android|iPhone|iPad|iPod|Windows Phone/i.test(navigator.userAgent);
  return isMobile ? waMe : api;
}

