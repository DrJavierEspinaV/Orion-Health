/* ORION Comunicaciones | Bitácora local de sesión V1.0
   No envía mensajes, no acredita entregas, no sincroniza con la ficha clínica.
   No guarda contenido de mensajes ni números de teléfono.
*/
(function () {
  'use strict';
  const STORAGE_KEY = 'orion_comunicaciones_bitacora_sesion_v1';
  const MAX_EVENTS = 500;
  const MAX_AGE_MS = 12 * 60 * 60 * 1000;
  const TYPES = new Set(['enlace_seleccionado', 'envio_confirmado_manual', 'respuesta_registrada_manual', 'correccion_manual']);
  let events = [];

  function readEvents() {
    try {
      const payload = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || 'null');
      if (!payload || !Number.isFinite(payload.updated) || Date.now() - payload.updated > MAX_AGE_MS ||
          !Array.isArray(payload.events)) return [];
      return payload.events.filter(function (e) {
        return e && TYPES.has(e.type) && typeof e.key === 'string' &&
          typeof e.at === 'string' && typeof e.run === 'string';
      }).slice(-MAX_EVENTS);
    } catch (_) { return []; }
  }
  function saveEvents() {
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, updated: Date.now(), events: events.slice(-MAX_EVENTS) })); }
    catch (_) { /* Si la sesión prohíbe almacenamiento, conservar solo en memoria */ }
  }
  function clean(s) { return String(s == null ? '' : s).replace(/\s+/g, ' ').trim(); }
  function identify(row) {
    const cells = row ? row.children : [];
    const run = clean(cells[1] && cells[1].textContent);
    const fecha = clean(cells[2] && cells[2].textContent);
    const hora = clean(cells[3] && cells[3].textContent);
    const nombre = clean(row && row.querySelector('.paciente-nombre') && row.querySelector('.paciente-nombre').textContent);
    // No guardar nombre ni teléfono. Si falta RUN, no generar una identidad clínica ambigua.
    if (!run || run === '—' || !fecha || fecha === '—') return null;
    return { key: [run.toUpperCase(), fecha, hora].join('|'), run: run, fecha: fecha, hora: hora };
  }
  function latest(info) {
    for (let i = events.length - 1; i >= 0; i -= 1) {
      const e = events[i];
      if (e.key === info.key) return e.type;
    }
    return '';
  }
  function stateLabel(type) {
    if (type === 'enlace_seleccionado') return 'Enlace seleccionado · envío sin verificar';
    if (type === 'envio_confirmado_manual') return 'Envío confirmado manualmente';
    if (type === 'respuesta_registrada_manual') return 'Respuesta registrada manualmente';
    if (type === 'correccion_manual') return 'Sin confirmación · corrección registrada';
    return 'Sin registro de comunicación';
  }
  function append(info, type) {
    if (!info || !TYPES.has(type)) return;
    events.push({
      at: new Date().toISOString(), key: info.key,
      run: info.run, fecha: info.fecha, hora: info.hora,
      type: type, origin: 'operador_orion'
    });
    events = events.slice(-MAX_EVENTS);
    saveEvents();
    refresh();
  }
  function makeButton(text, action, title) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'orion-audit-btn';
    button.textContent = text;
    if (title) button.title = title;
    button.addEventListener('click', action);
    return button;
  }
  function csvCell(value) {
    let v = String(value == null ? '' : value);
    // Neutraliza fórmulas de Excel y LibreOffice al abrir el CSV exportado.
    if (/^\s*[=+\-@]/.test(v)) v = "'" + v;
    return '"' + v.replace(/"/g, '""') + '"';
  }
  function exportCsv() {
    if (!events.length) { alert('No hay eventos de esta sesión para exportar.'); return; }
    const fields = ['at', 'run', 'fecha', 'hora', 'type', 'origin'];
    const lines = [fields.map(csvCell).join(';')].concat(events.map(function (e) {
      return fields.map(function (k) { return csvCell(e[k]); }).join(';');
    }));
    const blob = new Blob(['\uFEFF' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const href = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    link.download = 'ORION_Comunicaciones_Bitacora_Sesion.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function () { URL.revokeObjectURL(href); }, 1000);
  }
  function buildToolbar(list) {
    if (document.getElementById('orionAuditToolbar')) return;
    const toolbar = document.createElement('section');
    toolbar.id = 'orionAuditToolbar';
    toolbar.setAttribute('aria-label', 'Bitácora de comunicaciones');
    const heading = document.createElement('strong');
    heading.textContent = 'Seguimiento de comunicaciones';
    const desc = document.createElement('p');
    desc.textContent = 'Registro temporal de esta pestaña. No confirma entrega automática ni se sincroniza con Drive. Exporte el CSV antes de cerrar la sesión.';
    const status = document.createElement('span');
    status.id = 'orionAuditSummary';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    toolbar.append(heading, desc, status,
      makeButton('Exportar bitácora CSV', exportCsv),
      makeButton('Vaciar bitácora local', function () {
        if (!confirm('¿Vaciar el historial temporal de esta pestaña? Esta acción no modifica la ficha clínica.')) return;
        events = [];
        saveEvents();
        refresh();
      }));
    const table = list.closest('.table') || list;
    table.parentNode.insertBefore(toolbar, table);
    updateSummary();
  }
  function updateSummary() {
    const el = document.getElementById('orionAuditSummary');
    if (!el) return;
    const counts = { enlace_seleccionado: 0, envio_confirmado_manual: 0, respuesta_registrada_manual: 0 };
    const latestByKey = new Map();
    events.forEach(function (e) { latestByKey.set(e.key, e.type); });
    latestByKey.forEach(function (type) { if (Object.prototype.hasOwnProperty.call(counts, type)) counts[type] += 1; });
    el.textContent = 'Sin verificar: ' + counts.enlace_seleccionado +
      ' · Envíos confirmados manualmente: ' + counts.envio_confirmado_manual +
      ' · Respuestas registradas: ' + counts.respuesta_registrada_manual;
  }
  function enhance(row) {
    if (row.dataset.orionAuditEnhanced === '1') return;
    const wa = row.querySelector('a.wa-action');
    const line = row.querySelector('.wa-row-line');
    if (!wa || !line) return;
    row.dataset.orionAuditEnhanced = '1';
    const info = identify(row);
    if (!info) return; // Paciente sin identificación clínica suficiente.
    const status = document.createElement('span');
    status.className = 'orion-audit-status';
    status.setAttribute('aria-live', 'polite');
    const actions = document.createElement('div');
    actions.className = 'orion-audit-actions';
    function setState() {
      const type = latest(info);
      const shortLabels = {
        enlace_seleccionado: 'Abierto',
        envio_confirmado_manual: 'Envío manual',
        respuesta_registrada_manual: 'Respondió',
        correccion_manual: 'Corregido'
      };
      // Etiqueta corta en tabla; significado clínico completo en título accesible.
      status.textContent = shortLabels[type] || '';
      status.title = stateLabel(type);
      status.setAttribute('aria-label', stateLabel(type));
      status.hidden = !type;
      response.disabled = type !== 'envio_confirmado_manual' && type !== 'respuesta_registrada_manual';
      undo.disabled = !type || type === 'correccion_manual';
    }
    wa.addEventListener('click', function () {
      // Abrir un enlace no demuestra envío ni entrega. La acción solo acredita selección.
      append(info, 'enlace_seleccionado');
    });
    const sent = makeButton('Confirmé envío', function () {
      if (confirm('¿Confirmas que enviaste este mensaje desde WhatsApp? ORION no puede comprobarlo automáticamente.')) {
        append(info, 'envio_confirmado_manual');
      }
    }, 'Registro declarado por el profesional, no comprobante de WhatsApp');
    const response = makeButton('Registré respuesta', function () {
      if (confirm('¿Confirmas que recibiste una respuesta del paciente por un canal externo?')) {
        append(info, 'respuesta_registrada_manual');
      }
    });
    const undo = makeButton('Corregir', function () {
      if (confirm('¿Registrar corrección y dejar este contacto sin confirmación? Se conserva el historial de la sesión.')) {
        append(info, 'correccion_manual');
      }
    });
    actions.append(sent, response, undo);
    // Un menú plegado reemplaza los tres botones persistentes de cada paciente.
    // Se conservan eventos, confirmaciones y rectificaciones sin alargar las filas.
    const menu = document.createElement('details');
    menu.className = 'orion-audit-menu';
    const trigger = document.createElement('summary');
    trigger.textContent = '⋯';
    trigger.title = 'Opciones de seguimiento';
    trigger.setAttribute('aria-label', 'Opciones de seguimiento');
    menu.append(trigger, actions);
    line.append(status, menu);
    // Actualizar el estado del control aun cuando se reconstruye la lista.
    row.orionAuditUpdate = setState;
    setState();
  }
  function refresh() {
    const list = document.getElementById('list');
    if (!list) return;
    list.querySelectorAll('.row').forEach(enhance);
    list.querySelectorAll('.row').forEach(function (row) {
      if (typeof row.orionAuditUpdate === 'function') row.orionAuditUpdate();
    });
    updateSummary();
  }
  function init() {
    const list = document.getElementById('list');
    if (!list) return;
    events = readEvents();
    buildToolbar(list);
    refresh();
    const observer = new MutationObserver(refresh);
    // La fuente reconstruye #list; observar únicamente los hijos directos evita bucles.
    observer.observe(list, { childList: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
