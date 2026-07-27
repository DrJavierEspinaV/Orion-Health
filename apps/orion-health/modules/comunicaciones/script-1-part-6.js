function render(){
  const selEstado = $('#showFilter').value;
  const q = ($('#q').value||'').toLowerCase();

  const dfFrom = parseDateInput(document.getElementById('fFechaFrom')?.value || '');
  const dfTo   = parseDateInput(document.getElementById('fFechaTo')?.value   || '');

  const sorted = [...DATA].sort((a,b)=>{
    const adObj = a.compDate instanceof Date ? a.compDate : parseMaybeDate(a.compDate);
    const bdObj = b.compDate instanceof Date ? b.compDate : parseMaybeDate(b.compDate);
    const ad = adObj ? adObj.getTime() : 0;
    const bd = bdObj ? bdObj.getTime() : 0;
    return ad - bd;
  });

  const franjaInfo = getPacienteFranjaActual(sorted);
  const franjaKey = franjaInfo?.key || '';
  let franjaTargetCell = null;

  const filtered = sorted.filter(r=>{
    const matchQ = !q || (String(r.paciente).toLowerCase().includes(q) || String(r.rut).toLowerCase().includes(q));
    const matchEstado = selEstado === '__todos__' ? true : (String(r.estado||'').trim() === selEstado);

    let matchFecha = true;
    if(dfFrom || dfTo){
      const d = r.compDate || null;
      if(!d){ matchFecha = false; }
      else{
        if(dfFrom && d < new Date(dfFrom.getFullYear(),dfFrom.getMonth(),dfFrom.getDate(),0,0,0,0)) matchFecha = false;
        if(dfTo   && d > new Date(dfTo.getFullYear(),  dfTo.getMonth(),  dfTo.getDate(),  23,59,59,999)) matchFecha = false;
      }
    }

    return matchQ && matchEstado && matchFecha;
  });

  listEl.innerHTML = '';
  for(const r of filtered){
    const isAusente = /citado|ausent/i.test(String(r.estado||''));
    const estadoLabel = isAusente ? 'Ausente' : (r.estado || '—');
    const phone = r.telefono;
    const retrasoKey = getRetrasoRowKey(r);
    const retrasoTipo = retrasoWhatsappKeys.get(retrasoKey) || '';
    const retrasoMinutos = retrasoMinutosKeys.get(retrasoKey) || '';
    const isRetrasoLlegadaActive = retrasoTipo === 'llegada';
    const isRetrasoAtencionActive = retrasoTipo === 'atencion';
    const isRetrasoActive = !!retrasoTipo;
    const msg = buildMessage(r, estadoLabel, retrasoTipo, retrasoMinutos);
    const wa = phone ? buildWaUrl(phone, msg) : '';
    const rutKey = normalizeDocumentoRut(r.rut);
    const isUDCActive = !!rutKey && rutKey === activeDocumentoRut;
    const isFranjaActive = !!franjaKey && getRetrasoRowKey(r) === franjaKey;
    const waLabel = isRetrasoLlegadaActive ? 'Enviar llegada' : (isRetrasoAtencionActive ? 'Enviar atención' : 'WhatsApp');
    const waModeClass = isRetrasoLlegadaActive ? 'wa-retraso-llegada' : (isRetrasoAtencionActive ? 'wa-retraso-atencion' : '');

    const row = document.createElement('div');
    row.className = `row${isUDCActive ? ' udc-active' : ''}${isRetrasoActive ? ' retraso-active' : ''}${isRetrasoLlegadaActive ? ' retraso-llegada-active' : ''}${isFranjaActive ? ' franja-auto-active' : ''}`;
    row.innerHTML = `
      <div>
        <div class="paciente-top">
          <label class="udc-wrap ${isUDCActive ? 'active' : ''}" title="Usar en Documento Clínico">
            <input class="udc-check" type="checkbox" ${isUDCActive ? 'checked' : ''} ${rutKey ? '' : 'disabled'} />
            <span class="udc-label">UDC</span>
          </label>
          <label class="retraso-wrap retraso-llegada ${isRetrasoLlegadaActive ? 'active' : ''}" title="Enviar SOLO aviso por retraso en llegada al centro médico">
            <input class="retraso-check" data-retraso-tipo="llegada" type="checkbox" ${isRetrasoLlegadaActive ? 'checked' : ''} />
            <span class="retraso-label">RET. LLEGADA</span>
          </label>
          <label class="retraso-wrap retraso-atencion ${isRetrasoAtencionActive ? 'active' : ''}" title="Enviar SOLO aviso por retraso en la atención clínica">
            <input class="retraso-check" data-retraso-tipo="atencion" type="checkbox" ${isRetrasoAtencionActive ? 'checked' : ''} />
            <span class="retraso-label">RET. ATENCIÓN</span>
          </label>
          <label class="retraso-estimado-wrap ${isRetrasoActive ? 'active' : ''}" title="Tiempo estimado de retraso">
            <span class="retraso-estimado-label">⏱</span>
            <select class="retraso-minutos" ${isRetrasoActive ? '' : 'disabled'}>
              <option value="" ${!retrasoMinutos ? 'selected' : ''}>Sin ETA</option>
              <option value="10" ${retrasoMinutos === '10' ? 'selected' : ''}>+10 min</option>
              <option value="20" ${retrasoMinutos === '20' ? 'selected' : ''}>+20 min</option>
              <option value="30" ${retrasoMinutos === '30' ? 'selected' : ''}>+30 min</option>
            </select>
          </label>
        </div>
        <div class="paciente-nombre">${escapeHtml(formatPacienteDisplay(r)||'Sin nombre')}</div>
        <div class="muted">${phone? '+'+escapeHtml(phone):'Sin teléfono'}</div>
        <div class="wa-row-line">
          ${wa ? `<a class="btn whatsapp wa-action ${waModeClass}" target="_blank" rel="noopener" href="${wa}">${waLabel}</a>` : '<span class="muted">Sin número</span>'}
        </div>
      </div>
      <div>${r.rut ? escapeHtml(r.rut) : '—'}</div>
      <div>${escapeHtml(r.fechaFmt||'—')}</div>
      <div>${escapeHtml(r.horaFmt||'—')}</div>
      <div>${statusPill(r.estado)}</div>
      <div>${escapeHtml(r.motivo||'SIN REGISTRO')}</div>
    `;
    const btn = row.querySelector('a.btn.whatsapp');
    if (btn) {
      btn.addEventListener('click', () => {
        const tipoActual = retrasoWhatsappKeys.get(retrasoKey) || '';
        const minutosActuales = retrasoMinutosKeys.get(retrasoKey) || '';
        const freshMsg = buildMessage(r, estadoLabel, tipoActual, minutosActuales);
        const freshUrl = buildWaUrl(phone, freshMsg);
        btn.setAttribute('href', freshUrl);
        btn.textContent = 'Enviando…';
        setTimeout(()=>{ btn.textContent='Enviado'; btn.classList.add('sent'); }, 300);
        if(tipoActual){
          setTimeout(()=>{
            retrasoWhatsappKeys.delete(retrasoKey);
            retrasoMinutosKeys.delete(retrasoKey);
            render();
          }, 900);
        }
      });
    }

    row.querySelectorAll('.retraso-check').forEach((retrasoCheck) => {
      retrasoCheck.addEventListener('change', (event) => {
        const checked = !!event.target.checked;
        const tipoSeleccionado = String(event.target.dataset.retrasoTipo || '').trim();
        if (checked && tipoSeleccionado) retrasoWhatsappKeys.set(retrasoKey, tipoSeleccionado);
        else if (retrasoWhatsappKeys.get(retrasoKey) === tipoSeleccionado){
          retrasoWhatsappKeys.delete(retrasoKey);
          retrasoMinutosKeys.delete(retrasoKey);
        }
        render();
      });
    });

    const retrasoMinutosSelect = row.querySelector('.retraso-minutos');
    if (retrasoMinutosSelect) {
      retrasoMinutosSelect.addEventListener('change', (event) => {
        const valor = String(event.target.value || '').trim();
        if(valor) retrasoMinutosKeys.set(retrasoKey, valor);
        else retrasoMinutosKeys.delete(retrasoKey);
        render();
      });
    }

    const udcCheck = row.querySelector('.udc-check');
    if (udcCheck) {
      udcCheck.addEventListener('change', (event) => {
        const checked = !!event.target.checked;
        if (checked) {
          activeDocumentoRut = rutKey;
          syncDocumentoPaciente(r);
        } else {
          activeDocumentoRut = '';
          clearDocumentoPaciente();
        }
        render();
      });
    }

    if(isFranjaActive && !franjaTargetCell){
      franjaTargetCell = row.querySelector('div');
    }

    listEl.appendChild(row);
  }
  renderFranjaPacienteCard(franjaInfo, !!franjaTargetCell);
  renderDocumentoStatus();
  renderTodayLabel();
  if(autoScrollFranjaPending){
    autoScrollFranjaPending = false;
    if(franjaTargetCell){
      setTimeout(() => scrollToFranjaPaciente(), 90);
    }
  }
  saveCacheState();
}

