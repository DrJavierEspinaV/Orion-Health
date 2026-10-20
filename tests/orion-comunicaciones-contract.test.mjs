import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const read = (p) => readFileSync(join(root, 'apps/orion-health', p), 'utf8');

test('Comunicaciones: conexión protegida voluntaria', () => {
  const config = read('assets/shared/session-config.js');
  const loader = read('modules/comunicaciones/loader.js');
  assert.match(loader, /session-config\.js\?v=5\.7\.12/);
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

test('Comunicaciones: bitácora temporal protegida y enlazada al módulo activo', () => {
  const js = read('modules/comunicaciones/audit-session-v1.js');
  const loader = read('modules/comunicaciones/loader.js');
  const sw = read('service-worker.js');
  assert.match(loader, /audit-session-v1\.js\?v=1\.4/);
  assert.match(loader, /audit-session-v1\.css\?v=1\.4/);
  assert.match(js, /sessionStorage\.setItem/);
  assert.match(js, /confirm\('¿Confirmas que enviaste/);
  assert.match(js, /respuesta_registrada_manual/);
  assert.match(js, /correccion_manual/);
  assert.match(js, /textContent = shortLabels/);
  assert.doesNotMatch(js, /localStorage\.setItem|fetch\(|XMLHttpRequest|\.send\(/);
  assert.match(sw, /modules\/comunicaciones\/audit-session-v1\.js/);
  assert.match(sw, /modules\/comunicaciones\/audit-session-v1\.css/);
});

test('Comunicaciones: campañas restringidas por consentimiento promocional explícito', () => {
  const src = read('modules/comunicaciones/source.html');
  const patients = read('modules/comunicaciones/script-1-part-5.js');
  const listing = read('modules/comunicaciones/script-1-part-6.js');
  const manual = read('modules/comunicaciones/script-1-part-7.js');
  for (const code of [src, patients]) {
    assert.match(code, /consentimientoPromociones/);
    assert.match(code, /Consentimiento Promociones/);
  }
  for (const code of [src, listing]) {
    assert.match(code, /promocionBloqueada/);
    assert.match(code, /Promoción bloqueada: consentimiento no registrado/);
  }
  for (const code of [src, manual]) {
    assert.match(code, /El contacto manual carece de consentimiento promocional registrado/);
    assert.match(code, /event\.preventDefault\(\)/);
    assert.match(code, /manualOpenEl\.removeAttribute\('href'\)/);
  }
  assert.match(src, /addEventListener\('change', render\)/);
  assert.match(read('modules/comunicaciones/script-1-part-2.js'), /addEventListener\('change', render\)/);
});

test('Comunicaciones V5.7.12: lista compacta y acciones de seguimiento plegables', () => {
  const css = read('modules/comunicaciones/audit-session-v1.css');
  const audit = read('modules/comunicaciones/audit-session-v1.js');
  const loader = read('modules/comunicaciones/loader.js');
  assert.match(css, /max-width:120px !important/);
  assert.match(css, /grid-template-columns:repeat\(6,minmax\(0,1fr\)\)/);
  assert.match(css, /min-height:28px !important/);
  assert.match(audit, /document\.createElement\('details'\)/);
  assert.match(audit, /Opciones de seguimiento/);
  assert.match(audit, /actions\.append\(sent, response, undo\)/);
  assert.match(loader, /audit-session-v1\.css\?v=1\.4/);
  assert.match(loader, /audit-session-v1\.js\?v=1\.4/);
});

test('Drive: recuperación optativa sin contraseña pública ni almacenamiento local permanente', () => {
  const code = read('assets/shared/session-config.js');
  assert.match(code, /mediation:'silent'/);
  assert.match(code, /navigator\.credentials\.get/);
  assert.match(code, /navigator\.credentials\.store/);
  assert.match(code, /orionDriveRememberBrowser/);
  assert.match(code, /restoreBrowserManager\(e\)/);
  assert.match(code, /if\(active\)/);
  assert.match(code, /preventSilentAccess/);
  assert.doesNotMatch(code, /localStorage\.setItem|const\s+TOKEN\s*=\s*['"][^'"]+['"]/);
});

test('Comunicaciones V5.7.13: ningún estilo original agranda el botón de WhatsApp', () => {
  const responsive = read('modules/comunicaciones/responsive-fixes.css');
  const mobile = read('modules/comunicaciones/mobile-v142.css');
  const source = read('modules/comunicaciones/source.html');
  const audit = read('modules/comunicaciones/audit-session-v1.js');
  const loader = read('modules/comunicaciones/loader.js');
  assert.doesNotMatch(responsive, /\.btn\.whatsapp\.wa-action\{width:100% !important/);
  assert.doesNotMatch(mobile, /\.btn\.whatsapp\.wa-action\{width:100%!important/);
  assert.match(source, /max-width:112px !important/);
  assert.match(audit, /function enforceWhatsAppCompact/);
  assert.match(audit, /action\.style\.setProperty\(key, values\[key\], 'important'\)/);
  assert.match(audit, /document\.createElement\('details'\)/);
  assert.match(audit, /orion-audit-toolbar-toggle/);
  assert.match(loader, /responsive-fixes\.css\?v=1\.4\.6/);
  assert.match(loader, /mobile-v142\.css\?v=1\.4\.6/);
});

test('Comunicaciones V5.7.14: acciones clínicas agrupadas y sin pérdida de nodos', () => {
  const js=read('modules/comunicaciones/audit-session-v1.js');
  const css=read('modules/comunicaciones/audit-session-v1.css');
  const loader=read('modules/comunicaciones/loader.js');
  assert.match(js, /function compactClinicalRow\(row\)/);
  assert.match(js, /const openClinicalTools = new Set\(\)/);
  assert.match(js, /details\.append\(summary, controls\)/);
  assert.match(js, /line\.insertBefore\(phone, line\.firstChild\)/);
  assert.match(js, /'Opciones de retraso de llegada, retraso de atención y ETA'/);
  assert.match(js, /compactClinicalRow\(row\);\s*enforceWhatsAppCompact\(row\)/);
  assert.match(css, /orion-clinical-tools/);
  assert.match(css, /orion-patient-phone/);
  assert.match(loader, /audit-session-v1\.js\?v=1\.4/);
  assert.match(loader, /audit-session-v1\.css\?v=1\.4/);
});

test('Comunicaciones V5.7.15: UDC se mantiene visible al lado del nombre', () => {
  const js=read('modules/comunicaciones/audit-session-v1.js');
  const css=read('modules/comunicaciones/audit-session-v1.css');
  const loader=read('modules/comunicaciones/loader.js');
  assert.match(js, /const udc = controls\?\.querySelector\('\.udc-wrap'\)/);
  assert.match(js, /heading\.append\(name, udc\)/);
  assert.match(js, /udc\.classList\.add\('orion-udc-visible'\)/);
  assert.match(js, /details\.append\(summary, controls\)/);
  assert.doesNotMatch(js, /summary\.setAttribute\('aria-label', 'Opciones clínicas: UDC y retrasos'\)/);
  assert.match(css, /orion-patient-heading/);
  assert.match(css, /orion-udc-visible/);
  assert.match(loader, /audit-session-v1\.js\?v=1\.4/);
  assert.match(loader, /audit-session-v1\.css\?v=1\.4/);
});
