import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

const loader = read('apps/orion-health/modules/armonizacion/v12.html');
const enhancement = read('apps/orion-health/modules/armonizacion/enhancement-v12.js');
const styles = read('apps/orion-health/modules/armonizacion/enhancement-v12.css');
const portal = read('apps/orion-health/script-1.js');
const worker = read('apps/orion-health/service-worker.js');
const version = JSON.parse(read('apps/orion-health/VERSION.json'));

test('portal abre la capa V1.2 de Armonización', () => {
  assert.match(portal, /modules\/armonizacion\/v12\.html/);
  assert.match(loader, /enhancement-v12\.js/);
  assert.match(loader, /index\.html\?base=1/);
});

test('V1.2 incorpora modelos, líneas y estudio por zona', () => {
  assert.match(enhancement, /v12Woman/);
  assert.match(enhancement, /v12Man/);
  assert.match(enhancement, /Activas \+ pasivas/);
  assert.match(enhancement, /Estudio clínico de la zona/);
  assert.match(enhancement, /ORION_AESTHETIC_V12/);
  assert.match(styles, /data-v12-lines/);
});

test('PWA y metadatos registran R9 y V1.2', () => {
  assert.match(worker, /orion-dental-app-v1\.4\.4-r9/);
  assert.match(worker, /enhancement-v12\.js/);
  assert.equal(version.version, '1.4.4-r9-final-piloto');
  assert.equal(version.modules.armonizacion_orofacial, '1.2.0-piloto');
});
