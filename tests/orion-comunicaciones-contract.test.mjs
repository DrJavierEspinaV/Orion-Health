import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const read = (p) => readFileSync(join(root, 'apps/orion-health', p), 'utf8');

test('Comunicaciones: conexión protegida voluntaria', () => {
  const config = read('assets/shared/session-config.js');
  const loader = read('modules/comunicaciones/loader.js');
  assert.match(loader, /session-config\.js\?v=5\.7\.9/);
  assert.match(loader, /id="dbToken" type="password"|type="password" id="dbToken"/);
  assert.match(loader, /if\(!url \|\| !tok\) return;/);
  assert.match(loader, /\.replace\(\/localStorage\/g,'sessionStorage'\)/);
  assert.doesNotMatch(loader, /ODP-KIDS-2026|sk-proj-|AIza[0-9A-Za-z_-]{20}/);
  assert.match(config, /sessionStorage/);
});

test('Comunicaciones: estilo canónico institucional', () => {
  const loader = read('modules/comunicaciones/loader.js');
  assert.match(loader, /health-os-design-tokens-v2\.css/);
  assert.match(loader, /health-os-ui-components-v2\.css/);
  assert.match(loader, /health-os-ux-modules-v2\.css/);
  assert.match(loader, /data(?:set)?\.orionModule='comunicaciones'/);
});

test('Comunicaciones: la fuente y el cargador permanecen disponibles', () => {
  assert.match(read('modules/comunicaciones/index.html'), /loader\.js/);
  assert.match(read('modules/comunicaciones/source.html'), /<html/i);
});

test('No convertir datos clínicos protegidos en acceso anónimo', () => {
  const loader = read('modules/comunicaciones/loader.js');
  assert.match(loader, /const tok = .*dbToken/);
  assert.match(loader, /if\(!url \|\| !tok\) return;/);
});

test('Comunicaciones: los enlaces editables se muestran como texto, no HTML', () => {
  for (const path of ['modules/comunicaciones/source.html', 'modules/comunicaciones/script-1-part-2.js']) {
    const content = read(path);
    assert.match(content, /function actualizarPreviewLinks\(\)/);
    assert.match(content, /box\.replaceChildren\(\)/);
    assert.match(content, /line\.textContent = /);
    assert.doesNotMatch(content, /box\.innerHTML = '<b>Enlaces activos:/);
  }
});

test('WhatsApp: abrir un enlace no equivale a mensaje enviado', () => {
  for (const path of ['modules/comunicaciones/source.html', 'modules/comunicaciones/script-1-part-6.js']) {
    const code = read(path);
    assert.match(code, /El envío debe confirmarse en WhatsApp/);
    assert.doesNotMatch(code, /btn\.textContent='Enviado'/);
    assert.doesNotMatch(code, /btn\.textContent = 'Enviando…'/);
  }
});
