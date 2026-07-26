(() => {
  'use strict';

  const TOKEN_KEY = 'orion_comunicaciones_token';
  const HASH_KEYS = ['orion-token', 'orion_token', 'token'];
  const AUTOLOAD_DELAY_MS = 650;

  const safeSession = {
    get(key) {
      try { return sessionStorage.getItem(key) || ''; } catch (_) { return ''; }
    },
    set(key, value) {
      try { sessionStorage.setItem(key, value || ''); } catch (_) {}
    },
    remove(key) {
      try { sessionStorage.removeItem(key); } catch (_) {}
    }
  };

  function getTopWindow() {
    try {
      if (window.top && window.top.location.origin === window.location.origin) return window.top;
    } catch (_) {}
    return window;
  }

  function extractTokenFromHash() {
    const hostWindow = getTopWindow();
    let rawHash = '';
    try { rawHash = String(hostWindow.location.hash || '').replace(/^#/, ''); } catch (_) {}
    if (!rawHash) return '';

    const params = new URLSearchParams(rawHash);
    let token = '';
    for (const key of HASH_KEYS) {
      const value = params.get(key);
      if (value) {
        token = value.trim();
        params.delete(key);
        break;
      }
    }

    if (token) {
      try {
        const remaining = params.toString();
        const cleanUrl = `${hostWindow.location.pathname}${hostWindow.location.search}${remaining ? `#${remaining}` : ''}`;
        hostWindow.history.replaceState(null, '', cleanUrl);
      } catch (_) {}
    }
    return token;
  }

  function syncConfiguredFields() {
    document.querySelectorAll('[data-orion-session-key]').forEach((field) => {
      const key = field.dataset.orionSessionKey;
      if (!key) return;
      if (!field.value) field.value = safeSession.get(key);
      field.addEventListener('input', () => safeSession.set(key, field.value || ''));
    });
  }

  function injectStyles() {
    if (document.getElementById('orionDriveConnectStyles')) return;
    const style = document.createElement('style');
    style.id = 'orionDriveConnectStyles';
    style.textContent = `
      .orion-drive-card{margin:0 0 12px;padding:14px 16px;border:1px solid #bae6fd;border-radius:16px;background:linear-gradient(135deg,#eff6ff,#ecfeff);box-shadow:0 8px 20px rgba(14,116,144,.08)}
      .orion-drive-row{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}
      .orion-drive-title{font-weight:900;color:#0f3f5f;font-size:13px;text-transform:uppercase;letter-spacing:.25px}
      .orion-drive-text{margin-top:4px;color:#475569;font-size:12px;line-height:1.35}
      .orion-drive-badge{display:inline-flex;align-items:center;min-height:30px;padding:0 11px;border-radius:999px;background:#e2e8f0;color:#475569;font-size:11px;font-weight:900;white-space:nowrap}
      .orion-drive-badge.connecting{background:#fef3c7;color:#92400e}
      .orion-drive-badge.ready{background:#dcfce7;color:#166534}
      .orion-drive-badge.error{background:#fee2e2;color:#991b1b}
      .orion-drive-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}
      .orion-drive-btn{appearance:none;border:1px solid #bfd0df;background:#fff;color:#17324d;border-radius:12px;padding:8px 12px;font-size:12px;font-weight:800;cursor:pointer}
      .orion-drive-btn.primary{border-color:#0e7490;background:#0e7490;color:#fff}
      .orion-drive-modal{position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;padding:18px;background:rgba(2,6,23,.58);backdrop-filter:blur(6px)}
      .orion-drive-modal[hidden]{display:none!important}
      .orion-drive-dialog{width:min(460px,100%);border-radius:22px;background:#fff;padding:22px;box-shadow:0 24px 70px rgba(2,6,23,.32)}
      .orion-drive-dialog h2{margin:0;color:#17324d;font-size:22px}
      .orion-drive-dialog p{margin:8px 0 16px;color:#64748b;font-size:13px;line-height:1.45}
      .orion-drive-input{width:100%;border:1px solid #cbd5e1;border-radius:14px;padding:12px 14px;font:inherit}
      .orion-drive-error{min-height:18px;margin-top:7px;color:#b91c1c;font-size:12px;font-weight:700}
      .orion-drive-dialog-actions{display:flex;gap:10px;margin-top:12px}
      .orion-drive-dialog-actions button{flex:1}
      .bdDetails > summary .muted{font-weight:800!important}
      @media(max-width:640px){.orion-drive-dialog-actions{flex-direction:column}.orion-drive-dialog-actions button{width:100%}}
    `;
    document.head.appendChild(style);
  }

  function getElements() {
    return {
      tokenField: document.getElementById('dbToken'),
      urlField: document.getElementById('dbWebappUrl'),
      sheetField: document.getElementById('dbSheet'),
      loadButton: document.getElementById('dbLoad'),
      pingButton: document.getElementById('dbPing'),
      status: document.getElementById('dbStatus'),
      details: document.querySelector('.bdDetails'),
      card: document.querySelector('.bdCard')
    };
  }

  function setTechnicalPanelLabel(details) {
    if (!details) return;
    details.open = false;
    const label = details.querySelector('summary .muted');
    if (label) label.textContent = 'Configuración avanzada';
    details.querySelectorAll('#dbWebappUrl, #dbSheet').forEach((field) => {
      field.readOnly = true;
      field.setAttribute('aria-readonly', 'true');
    });
  }

  function createStatusCard(card) {
    if (!card) return null;
    let box = document.getElementById('orionDriveStatusCard');
    if (box) return box;

    box = document.createElement('div');
    box.id = 'orionDriveStatusCard';
    box.className = 'orion-drive-card';
    box.innerHTML = `
      <div class="orion-drive-row">
        <div>
          <div class="orion-drive-title">Base clínica en Drive</div>
          <div class="orion-drive-text" id="orionDriveStatusText">Preparando conexión…</div>
        </div>
        <span class="orion-drive-badge" id="orionDriveStatusBadge">Pendiente</span>
      </div>
      <div class="orion-drive-actions">
        <button class="orion-drive-btn primary" id="orionDriveReconnect" type="button">Conectar / recargar</button>
        <button class="orion-drive-btn" id="orionDriveChangeAccess" type="button">Cambiar acceso</button>
        <button class="orion-drive-btn" id="orionDriveForget" type="button">Olvidar acceso</button>
      </div>`;
    card.prepend(box);
    return box;
  }

  function createModal() {
    let modal = document.getElementById('orionDriveModal');
    if (modal) return modal;
    modal = document.createElement('div');
    modal.id = 'orionDriveModal';
    modal.className = 'orion-drive-modal';
    modal.hidden = true;
    modal.innerHTML = `
      <div class="orion-drive-dialog" role="dialog" aria-modal="true" aria-labelledby="orionDriveModalTitle">
        <h2 id="orionDriveModalTitle">Conectar base clínica</h2>
        <p>La dirección de Google Apps Script y la hoja <strong>DB</strong> ya están configuradas. Ingresa la clave de acceso del piloto una sola vez por sesión.</p>
        <label for="orionDriveTokenInput" style="display:block;font-size:12px;font-weight:800;color:#475569;margin-bottom:6px">Clave de acceso ORION</label>
        <input class="orion-drive-input" id="orionDriveTokenInput" type="password" autocomplete="off" placeholder="Clave del piloto">
        <div class="orion-drive-error" id="orionDriveModalError"></div>
        <div class="orion-drive-dialog-actions">
          <button class="orion-drive-btn primary" id="orionDriveConnectNow" type="button">Conectar ahora</button>
          <button class="orion-drive-btn" id="orionDriveCancel" type="button">Cancelar</button>
        </div>
      </div>`;
    document.body.appendChild(modal);
    return modal;
  }

  function setStatus(mode, message) {
    const badge = document.getElementById('orionDriveStatusBadge');
    const text = document.getElementById('orionDriveStatusText');
    if (badge) {
      badge.className = `orion-drive-badge${mode ? ` ${mode}` : ''}`;
      badge.textContent = mode === 'ready' ? 'Conectado' : mode === 'connecting' ? 'Conectando' : mode === 'error' ? 'Revisar acceso' : 'Pendiente';
    }
    if (text) text.textContent = message;
  }

  function openModal(prefill = '') {
    const modal = createModal();
    const input = document.getElementById('orionDriveTokenInput');
    const error = document.getElementById('orionDriveModalError');
    if (input) input.value = prefill || safeSession.get(TOKEN_KEY) || '';
    if (error) error.textContent = '';
    modal.hidden = false;
    setTimeout(() => input?.focus(), 30);
  }

  function closeModal() {
    const modal = document.getElementById('orionDriveModal');
    if (modal) modal.hidden = true;
  }

  function applyToken(token, tokenField) {
    const clean = String(token || '').trim();
    if (!clean) return false;
    safeSession.set(TOKEN_KEY, clean);
    if (tokenField) {
      tokenField.value = clean;
      tokenField.dispatchEvent(new Event('input', { bubbles: true }));
      tokenField.dispatchEvent(new Event('change', { bubbles: true }));
    }
    return true;
  }

  function connect(elements, options = {}) {
    const token = String(elements.tokenField?.value || safeSession.get(TOKEN_KEY) || '').trim();
    if (!token) {
      setStatus('error', 'Falta la clave de acceso. Pulsa “Conectar / recargar”.');
      openModal();
      return;
    }

    applyToken(token, elements.tokenField);
    setStatus('connecting', 'Conectando con la base clínica de Google Drive…');
    if (elements.status) elements.status.textContent = 'Conectando con Google Sheets…';

    if (options.pingFirst && elements.pingButton) elements.pingButton.click();
    window.setTimeout(() => elements.loadButton?.click(), options.pingFirst ? 450 : 80);
  }

  function observeConnection(elements) {
    if (!elements.status) return;
    const update = () => {
      const value = String(elements.status.textContent || '').trim();
      if (!value) return;
      if (/error|fall|invál|incorrect|deneg|token|permiso|no se pudo/i.test(value)) {
        setStatus('error', value);
      } else if (/cargad|conectad|ok|éxito|listo|paciente/i.test(value)) {
        setStatus('ready', value);
      } else if (/cargando|conectando|leyendo|consultando/i.test(value)) {
        setStatus('connecting', value);
      }
    };
    new MutationObserver(update).observe(elements.status, { childList: true, subtree: true, characterData: true });
    update();
  }

  function init() {
    injectStyles();
    syncConfiguredFields();

    const elements = getElements();
    if (!elements.tokenField || !elements.loadButton || !elements.card) return;

    setTechnicalPanelLabel(elements.details);
    createStatusCard(elements.card);
    createModal();
    observeConnection(elements);

    const hashToken = extractTokenFromHash();
    const savedToken = safeSession.get(TOKEN_KEY);
    const activeToken = hashToken || savedToken || String(elements.tokenField.value || '').trim();
    if (activeToken) applyToken(activeToken, elements.tokenField);

    document.getElementById('orionDriveReconnect')?.addEventListener('click', () => connect(elements, { pingFirst: true }));
    document.getElementById('orionDriveChangeAccess')?.addEventListener('click', () => openModal(elements.tokenField.value));
    document.getElementById('orionDriveForget')?.addEventListener('click', () => {
      safeSession.remove(TOKEN_KEY);
      elements.tokenField.value = '';
      if (elements.status) elements.status.textContent = '';
      setStatus('error', 'Acceso eliminado de esta sesión.');
      openModal();
    });
    document.getElementById('orionDriveConnectNow')?.addEventListener('click', () => {
      const input = document.getElementById('orionDriveTokenInput');
      const error = document.getElementById('orionDriveModalError');
      const token = String(input?.value || '').trim();
      if (!token) {
        if (error) error.textContent = 'Ingresa la clave de acceso del piloto.';
        return;
      }
      applyToken(token, elements.tokenField);
      closeModal();
      connect(elements, { pingFirst: true });
    });
    document.getElementById('orionDriveCancel')?.addEventListener('click', closeModal);
    document.getElementById('orionDriveTokenInput')?.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') document.getElementById('orionDriveConnectNow')?.click();
    });

    if (activeToken) {
      setStatus('connecting', 'Acceso reconocido. Cargando pacientes automáticamente…');
      window.setTimeout(() => connect(elements), AUTOLOAD_DELAY_MS);
    } else {
      setStatus('error', 'Primera conexión pendiente. Pulsa “Conectar / recargar”.');
      window.setTimeout(() => openModal(), 250);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
