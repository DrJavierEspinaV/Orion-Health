import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const source = readFileSync('apps/orion-health/integrations/apps-script/comms-events-secure.gs', 'utf8');

function harness() {
  const rows = [['EVENT_ID','FECHA_SERVIDOR_UTC','RUN_PACIENTE','CITA_ID','CANAL','TIPO_EVENTO','ORIGEN_CONFIRMACION','USUARIO_ID','CONSENTIMIENTO_CANAL','MENSAJE_HASH_SHA256','REFERENCIA_EVENTO','VERSION_ESQUEMA']];
  let count = 0;
  const sheet = {
    getLastRow: () => rows.length,
    getRange: (row,col,numRows,numCols) => ({
      getValues: () => rows.slice(row - 1, row - 1 + numRows).map(r => r.slice(col - 1, col - 1 + numCols))
    }),
    appendRow: r => rows.push(r)
  };
  const ctx = {
    PropertiesService: {getScriptProperties: () => ({getProperty: () => 'TEST_DATABASE'})},
    SpreadsheetApp: {openById: () => ({getSheetByName: n => n === 'COMMS_EVENTOS' ? sheet : null}), flush: () => {}},
    LockService: {getScriptLock: () => ({waitLock: () => {}, releaseLock: () => {}})},
    Utilities: {getUuid: () => 'fake-event-' + ++count}
  };
  runInNewContext(source,ctx);
  return {ctx,rows};
}
const actor = {userId:'test.operator@orion.invalid',canWriteCommunications:true,consentStatus:'VERIFICADO'};
const event = {run:'12.345.678-5',appointmentId:'cita-001',channel:'WHATSAPP',type:'enlace_seleccionado',requestId:'request-001'};

test('Servidor: no existe endpoint público de escritura en el fragmento', () => {
  assert.doesNotMatch(source, /function\s+doPost\s*\(|function\s+doGet\s*\(/);
  assert.doesNotMatch(source, /script\.google\.com\/macros|ORION_DB_SPREADSHEET_ID\s*=\s*['"]/);
});

test('Servidor: exige rol, RUN válido y tipo de evento permitido', () => {
  const {ctx,rows} = harness();
  assert.throws(() => ctx.orionAppendCommsEventSecure_(event,{}),/No autorizado/);
  assert.throws(() => ctx.orionAppendCommsEventSecure_({...event,run:'12345678-9'},actor),/Dígito verificador/);
  assert.throws(() => ctx.orionAppendCommsEventSecure_({...event,type:'entregado_automatico'},actor),/Tipo de evento/);
  assert.equal(rows.length,1);
});

test('Servidor: idempotencia y registro mínimo, sin teléfono ni mensaje', () => {
  const {ctx,rows} = harness();
  const first = ctx.orionAppendCommsEventSecure_(event,actor);
  assert.equal(first.duplicate,false);
  assert.equal(rows.length,2);
  assert.equal(rows[1][2],'12345678-5');
  assert.equal(rows[1][6],'OPERADOR_MANUAL');
  assert.equal(rows[1][7],'test.operator@orion.invalid');
  assert.equal(rows[1][10],'request-001');
  assert.equal(rows[1].length,12);
  const second = ctx.orionAppendCommsEventSecure_(event,actor);
  assert.equal(second.duplicate,true);
  assert.equal(second.eventId,first.eventId);
  assert.equal(rows.length,2);
});
