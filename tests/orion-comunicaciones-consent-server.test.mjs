import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const base = readFileSync('apps/orion-health/integrations/apps-script/comms-events-secure.gs', 'utf8');
const consentCode = readFileSync('apps/orion-health/integrations/apps-script/comms-consent-resolver.gs', 'utf8');
const HEADERS = [
  'CONSENT_ID','RUN_PACIENTE','CANAL','FINALIDAD','EVENTO',
  'FECHA_SERVIDOR_UTC','VIGENTE_DESDE_UTC','ORIGEN','EVIDENCIA_ID',
  'USUARIO_ID','REFERENCIA_EVENTO','VERSION_ESQUEMA'
];
const actor = { userId: 'operator.test@orion.invalid', canReadCommunications: true };
function fixture() {
  const rows = [HEADERS.slice()];
  const sheet = {
    getLastRow: () => rows.length,
    getRange: (row, col, height, width) => ({
      getValues: () => rows.slice(row - 1, row - 1 + height)
        .map(r => r.slice(col - 1, col - 1 + width))
    })
  };
  const sandbox = {
    PropertiesService: {getScriptProperties:()=>({getProperty:()=> 'SYNTHETIC_DB'})},
    SpreadsheetApp: {openById:()=>({getSheetByName: name=>name==='COMMS_CONSENTIMIENTOS' ? sheet : null})}
  };
  runInNewContext(base + '\n' + consentCode, sandbox);
  return { rows, sandbox };
}
function row(eventType, overrides={}) {
  return Object.assign([
    'consent-sintetico', '12.345.678-5', 'WHATSAPP', 'COMERCIAL',
    eventType, '2026-10-19T11:00:00.000Z', '2026-01-01T00:00:00.000Z',
    'CONSENTIMIENTO_FIRMADO', 'evidence-12345',
    'operator.test@orion.invalid', 'request-12345', '1.0'
  ], overrides);
}
test('Contrato de consentimientos no ofrece endpoint público ni contiene secretos', () => {
  assert.doesNotMatch(consentCode, /function\s+doPost\s*\(|function\s+doGet\s*\(/);
  assert.doesNotMatch(consentCode, /script\.google\.com\/macros|SYNTHETIC_DB|sk-proj-/);
});
test('Consultas privadas: rechaza actor sin autorización e identidad inválida', () => {
  const {sandbox} = fixture();
  assert.throws(()=>sandbox.orionResolveCommsConsentSecure_('12.345.678-5','WHATSAPP','COMERCIAL',{}),/No autorizado/);
  assert.throws(()=>sandbox.orionResolveCommsConsentSecure_('12.345.678-5','WHATSAPP','COMERCIAL',{...actor,userId:'  '}),/Identidad del profesional/);
  assert.throws(()=>sandbox.orionResolveCommsConsentSecure_('12.345.678-5','EMAIL','COMERCIAL',actor),/Canal no permitido/);
  assert.throws(()=>sandbox.orionResolveCommsConsentSecure_('12.345.678-5','WHATSAPP','INDEFINIDA',actor),/Finalidad no permitida/);
});
test('Sin evidencia explícita o con cabecera alterada no se concede permiso', () => {
  const {rows,sandbox}=fixture();
  const resolve = ()=>sandbox.orionResolveCommsConsentSecure_('12345678-5','WHATSAPP','COMERCIAL',actor);
  assert.equal(resolve(),'NO_VERIFICADO');
  rows.push(row('OTORGADO',{8:''}));
  assert.equal(resolve(),'NO_VERIFICADO');
  rows[0][8]='EVIDENCIA_COLUMNA_DESPLAZADA';
  assert.throws(resolve,/Esquema COMMS_CONSENTIMIENTOS incompatible/);
});
test('Consentimiento correcto es específico de canal y finalidad, con evidencia', () => {
  const {rows,sandbox}=fixture();
  rows.push(row('OTORGADO'));
  const resolve=(purpose)=>sandbox.orionResolveCommsConsentSecure_('12.345.678-5','WHATSAPP',purpose,actor);
  assert.equal(resolve('COMERCIAL'),'VERIFICADO');
  assert.equal(resolve('CLINICA'),'NO_VERIFICADO');
  rows.push(row('OTORGADO',{7:'IMPORTACION_MANUAL'}));
  assert.equal(resolve('COMERCIAL'),'VERIFICADO'); // Se conserva el último consentimiento válido anterior.
});
test('Revocación y corrección prevalecen sobre una autorización anterior', () => {
  const {rows,sandbox}=fixture();
  const resolve=()=>sandbox.orionResolveCommsConsentSecure_('12.345.678-5','WHATSAPP','COMERCIAL',actor);
  rows.push(row('OTORGADO'));
  assert.equal(resolve(),'VERIFICADO');
  rows.push(row('REVOCADO',{8:''}));
  assert.equal(resolve(),'REVOCADO');
  rows.push(row('OTORGADO',{8:''}));
  assert.equal(resolve(),'REVOCADO');
  rows.push(row('OTORGADO'));
  assert.equal(resolve(),'VERIFICADO'); // Nuevo consentimiento respaldado por evidencia.
  rows.push(row('CORREGIDO'));
  assert.equal(resolve(),'NO_VERIFICADO');
});
test('Consentimiento con fecha efectiva futura no autoriza campañas hoy', () => {
  const {rows,sandbox}=fixture();
  rows.push(row('OTORGADO',{6:'2100-01-01T00:00:00.000Z'}));
  assert.equal(sandbox.orionResolveCommsConsentSecure_('12.345.678-5','WHATSAPP','COMERCIAL',actor),'NO_VERIFICADO');
});
