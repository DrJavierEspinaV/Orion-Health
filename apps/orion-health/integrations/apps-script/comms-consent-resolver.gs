/**
 * ORION Comunicaciones | Resolución de consentimiento V1.0.
 * Función interna de Apps Script: SIN doGet/doPost, SIN credenciales y SIN
 * sincronización pública. Requiere actor de confianza verificado EN SERVIDOR.
 * Depende de orionNormalizeRun_ del servicio de eventos.
 *
 * Fuente: COMMS_CONSENTIMIENTOS, 12 columnas (orden contractual).
 * Event sourcing: última revocación/corrección se respeta; una autorización
 * posterior solo vale con evidencia y origen válidos.
 */
var ORION_COMMS_CONSENT_HEADERS_ = [
  'CONSENT_ID', 'RUN_PACIENTE', 'CANAL', 'FINALIDAD',
  'EVENTO', 'FECHA_SERVIDOR_UTC', 'VIGENTE_DESDE_UTC', 'ORIGEN',
  'EVIDENCIA_ID', 'USUARIO_ID', 'REFERENCIA_EVENTO', 'VERSION_ESQUEMA'
];

function orionAssertConsentSheet_(sheet) {
  var fields = sheet.getRange(1, 1, 1, ORION_COMMS_CONSENT_HEADERS_.length).getValues()[0];
  for (var i = 0; i < ORION_COMMS_CONSENT_HEADERS_.length; i++) {
    if (String(fields[i] || '') !== ORION_COMMS_CONSENT_HEADERS_[i]) {
      throw new Error('Esquema COMMS_CONSENTIMIENTOS incompatible; consulta detenida');
    }
  }
}

/**
 * @param {string} rawRun RUN validado en servidor.
 * @param {string} channel Solo WHATSAPP en V1.
 * @param {string} purpose COMERCIAL o CLINICA, sin deducción por el texto.
 * @param {{userId:string, canReadCommunications?:boolean, canWriteCommunications?:boolean}} actor
 * @returns {'VERIFICADO'|'REVOCADO'|'NO_VERIFICADO'}
 */
function orionResolveCommsConsentSecure_(rawRun, channel, purpose, actor) {
  if (!actor || !actor.userId ||
      (actor.canReadCommunications !== true && actor.canWriteCommunications !== true)) {
    throw new Error('No autorizado para consultar consentimientos');
  }
  var run = orionNormalizeRun_(rawRun);
  var normalizedChannel = String(channel || '').trim().toUpperCase();
  var normalizedPurpose = String(purpose || '').trim().toUpperCase();
  if (normalizedChannel !== 'WHATSAPP') throw new Error('Canal no permitido');
  if (['COMERCIAL', 'CLINICA'].indexOf(normalizedPurpose) < 0) {
    throw new Error('Finalidad no permitida');
  }

  var dbId = PropertiesService.getScriptProperties().getProperty('ORION_DB_SPREADSHEET_ID');
  if (!dbId) throw new Error('Base de datos ORION no configurada');
  var sheet = SpreadsheetApp.openById(dbId).getSheetByName('COMMS_CONSENTIMIENTOS');
  if (!sheet) throw new Error('Esquema COMMS_CONSENTIMIENTOS no disponible');
  orionAssertConsentSheet_(sheet);
  var last = sheet.getLastRow();
  if (last < 2) return 'NO_VERIFICADO';

  var rows = sheet.getRange(2, 1, last - 1, 12).getValues();
  var now = Date.now();
  for (var i = rows.length - 1; i >= 0; i--) {
    var row = rows[i];
    if (String(row[1] || '').trim().toUpperCase() !== run) continue;
    if (String(row[2] || '').trim().toUpperCase() !== normalizedChannel) continue;
    if (String(row[3] || '').trim().toUpperCase() !== normalizedPurpose) continue;
    var eventType = String(row[4] || '').trim().toUpperCase();
    // Una revocación o corrección posterior prevalece siempre para proteger
    // al paciente, incluso si alguna fecha futura es errónea.
    if (eventType === 'REVOCADO') return 'REVOCADO';
    if (eventType === 'CORREGIDO') return 'NO_VERIFICADO';
    if (eventType !== 'OTORGADO') continue;

    var effectiveAt = Date.parse(String(row[6] || ''));
    if (!Number.isFinite(effectiveAt) || effectiveAt > now) continue;
    var evidence = String(row[8] || '').trim();
    var source = String(row[7] || '').trim().toUpperCase();
    var operator = String(row[9] || '').trim();
    // Sin evidencia, operador y fuente institucional no se presume permiso.
    if (!/^[A-Za-z0-9][A-Za-z0-9_.:-]{7,127}$/.test(evidence) ||
        ['FORMULARIO_AUTENTICADO', 'CONSENTIMIENTO_FIRMADO'].indexOf(source) < 0 ||
        !operator) continue;
    return 'VERIFICADO';
  }
  return 'NO_VERIFICADO';
}
