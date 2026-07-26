(() => {
  'use strict';
  const fields = document.querySelectorAll('[data-orion-session-key]');
  fields.forEach((field) => {
    const key = field.dataset.orionSessionKey;
    if (!key) return;
    try { if (!field.value) field.value = sessionStorage.getItem(key) || ''; } catch (_) {}
    field.addEventListener('input', () => {
      try { sessionStorage.setItem(key, field.value || ''); } catch (_) {}
    });
  });
})();
