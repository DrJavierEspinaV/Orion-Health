(() => {
  'use strict';
  const STORAGE_KEY = 'orion_documento_paciente_activo_v1';
  const STORAGE_TTL_MS = 2 * 60 * 60 * 1000;
  const EVENT_SYNC = 'ORION_DOCUMENTO_PACIENTE_SYNC';
  const EVENT_GET = 'ORION_GET_DOCUMENTO_PACIENTE';
  const EVENT_SYNC_LEGACY = 'ORION_RECETA_PACIENTE_SYNC';
  const EVENT_GET_LEGACY = 'ORION_GET_RECETA_PACIENTE';

  const ui = {
    nombre: document.getElementById('p_nombre'),
    rut: document.getElementById('p_rut'),
    edad: document.getElementById('p_edad')
  };

  const normalize = (payload) => {
    if (!payload || typeof payload !== 'object') return null;
    const clean = {
      nombre: String(payload.nombre || payload.nombreCompleto || payload.paciente || '').replace(/\s+/g, ' ').trim(),
      rut: String(payload.rut || payload.run || '').replace(/\s+/g, '').trim().toUpperCase(),
      edad: String(payload.edad || '').trim()
    };
    return (clean.nombre || clean.rut || clean.edad) ? clean : null;
  };

  const targetOrigin = () => location.origin && location.origin !== 'null' ? location.origin : '*';
  const trustedParentMessage = (event) => {
    if (!window.parent || window.parent === window || event.source !== window.parent) return false;
    return targetOrigin() === '*' || event.origin === location.origin;
  };

  function save(payload) {
    const p = normalize(payload);
    if (!p) return;
    const envelope = { version: 1, payload: p, ts: Date.now(), source: 'documento-clinico' };
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(envelope)); } catch (_) {}
  }

  function read() {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      const envelope = parsed && parsed.payload ? parsed : { payload: parsed, ts: Date.now() };
      if (envelope.ts && Date.now() - envelope.ts > STORAGE_TTL_MS) {
        sessionStorage.removeItem(STORAGE_KEY);
        return null;
      }
      return normalize(envelope.payload);
    } catch (_) { return null; }
  }

  function apply(payload) {
    const p = normalize(payload);
    if (!p) return;
    if (ui.nombre) ui.nombre.value = p.nombre;
    if (ui.rut) ui.rut.value = p.rut;
    if (ui.edad) ui.edad.value = p.edad;
    save(p);
    try {
      ui.nombre?.dispatchEvent(new Event('input', { bubbles: true }));
      ui.rut?.dispatchEvent(new Event('input', { bubbles: true }));
      ui.edad?.dispatchEvent(new Event('input', { bubbles: true }));
    } catch (_) {}
    document.documentElement.dataset.orionPacienteActivo = 'true';
  }

  function request() {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: EVENT_GET }, targetOrigin());
      window.parent.postMessage({ type: EVENT_GET_LEGACY }, targetOrigin());
      return;
    }
    const stored = read();
    if (stored) apply(stored);
  }

  window.addEventListener('message', (event) => {
    if (!trustedParentMessage(event)) return;
    const msg = event.data || {};
    if (msg.type === EVENT_SYNC || msg.type === EVENT_SYNC_LEGACY) apply(msg.payload);
  });

  const start = () => { const stored = read(); if (stored) apply(stored); setTimeout(request, 180); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();

  window.ORION_PATIENT_BRIDGE = { apply, read, request };
})();
