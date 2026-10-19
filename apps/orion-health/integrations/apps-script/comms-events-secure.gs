/**
 * ORION Comunicaciones — servicio Apps Script, contrato de escritura V1.
 *
 * NO es un endpoint público ni contiene doPost/doGet.
 * Integre este servicio exclusivamente desde un dispatcher servidor que
 * haya verificado identidad Google y permisos. El objeto actor debe
 * construirse EN EL SERVIDOR: jamás aceptar actor desde el JSON del navegador.
 *
 * Propiedad de script requerida: ORION_DB_SPREADSHEET_ID.
 * Pestaña preexistente: COMMS_EVENTOS, cabecera exacta del esquema V1.
 */

function orionNormalizeRun_(value) {
  var run = String(value || '').toUpperCase().replace(/[.\s]/g, '');
  if (!/^\d{6,8}-[\dK]$/.test(run)) throw new Error('RUN inválido');
  var parts = run.split('-');
  var total = 0;
  var mult = 2;
  for (var i = parts[0].length - 1; i >= 0; i--) {
    total += Number(parts[0][i]) * mult;
    mult = mult === 7 ? 2 : mult + 1;
  }
  var valueDv = 11 - total % 11;
  var dv = valueDv === 11 ? '0' : valueDv === 10 ? 'K' : String(valueDv);
  if (parts[1] !== dv) throw new Error('Dígito verificador de RUN incorrecto');
  return run;
}

function orionSafeId_(value, label, minLen, maxLen) {
  var s = String(value || '').trim();
  if (s.length < minLen || s.length > maxLen || !/^[A-Za-z0-9][A-Za-z0-9_.:-]*$/.test(s)) {
    throw new Error(label + ' inválido');
  }
  return s;
}

// El orden de este esquema corresponde a COMMS_EVENTOS!A1:L1.
var ORION_COMMS_EVENT_HEADERS_ = [
  'EVENT_ID', 'FECHA_SERVIDOR_UTC', 'RUN_PACIENTE', 'CITA_ID',
  'CANAL', 'TIPO_EVENTO', 'ORIGEN_CONFIRMACION', 'USUARIO_ID',
  'CONSENTIMIENTO_CANAL', 'MENSAJE_HASH_SHA256', 'REFERENCIA_EVENTO',
  'VERSION_ESQUEMA'
];

function orionAssertCommsSchema_(sheet) {
  // Rechazo explícito antes de appendRow; nunca rellenar columnas desplazadas.
  var actual = sheet.getRange(1, 1, 1, ORION_COMMS_EVENT_HEADERS_.length).getValues()[0];
  for (var i = 0; i < ORION_COMMS_EVENT_HEADERS_.length; i++) {
    if (String(actual[i] || '') !== ORION_COMMS_EVENT_HEADERS_[i]) {
      throw new Error('Esquema COMMS_EVENTOS incompatible; escritura detenida');
    }
  }
}

function orionAssertCommsDuplicate_(previous, incoming) {
  // Idempotencia estricta: misma referencia + mismo evento y mismo profesional.
  // Nunca informar éxito para otra cita/paciente o un evento de diferente tipo.
  var indices = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  for (var i = 0; i < indices.length; i++) {
    var column = indices[i];
    if (String(previous[column] == null ? '' : previous[column]) !==
        String(incoming[column] == null ? '' : incoming[column])) {
      throw new Error('Referencia de evento reutilizada con contenido diferente');
    }
  }
}

/**
 * @param {{run:string, appointmentId:string, channel:string, type:string,
 *   requestId:string, messageSha256?:string}} event
 * @param {{userId:string, canWriteCommunications:boolean, consentStatus:string}} actor
 * @returns {{eventId:string, duplicate:boolean, serverTimestamp:string}}
 */
function orionAppendCommsEventSecure_(event, actor) {
  if (!actor || actor.canWriteCommunications !== true ||
      !actor.userId || typeof actor.userId !== 'string') {
    throw new Error('No autorizado para registrar comunicaciones');
  }
  if (!event || typeof event !== 'object') throw new Error('Evento inválido');

  var run = orionNormalizeRun_(event.run);
  var cita = orionSafeId_(event.appointmentId, 'CITA_ID', 1, 120);
  var requestId = orionSafeId_(event.requestId, 'REFERENCIA_EVENTO', 8, 128);
  var userId = String(actor.userId).trim();
  // Los identificadores del servidor tampoco pueden comenzar con un prefijo de fórmula.
  if (!/^[A-Za-z0-9][A-Za-z0-9@._+-]{2,127}$/.test(userId)) {
    throw new Error('Identidad del profesional inválida');
  }
  var channel = String(event.channel || '').toUpperCase();
  if (channel !== 'WHATSAPP') throw new Error('Canal no habilitado');

  var types = {
    enlace_seleccionado: true,
    envio_confirmado_manual: true,
    respuesta_registrada_manual: true,
    correccion_manual: true
  };
  var type = String(event.type || '');
  if (!Object.prototype.hasOwnProperty.call(types, type)) throw new Error('Tipo de evento no admitido');

  var consent = String(actor.consentStatus || 'NO_VERIFICADO').toUpperCase();
  if (['VERIFICADO', 'NO_VERIFICADO', 'REVOCADO'].indexOf(consent) < 0) {
    throw new Error('Estado de consentimiento inválido');
  }
  // No autorizar nuevos intentos salientes después de una revocación conocida.
  if (consent === 'REVOCADO' &&
      (type === 'enlace_seleccionado' || type === 'envio_confirmado_manual')) {
    throw new Error('Comunicaciones salientes bloqueadas por consentimiento revocado');
  }
  var hash = String(event.messageSha256 || '').toLowerCase();
  if (hash && !/^[a-f0-9]{64}$/.test(hash)) throw new Error('Hash de mensaje inválido');

  var sheetId = PropertiesService.getScriptProperties().getProperty('ORION_DB_SPREADSHEET_ID');
  if (!sheetId) throw new Error('Base de datos ORION no configurada');
  var sheet = SpreadsheetApp.openById(sheetId).getSheetByName('COMMS_EVENTOS');
  if (!sheet) throw new Error('Esquema COMMS_EVENTOS no disponible');

  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    // Todo control debe pasar con el bloqueo adquirido; no se escribe si el esquema cambia.
    orionAssertCommsSchema_(sheet);
    var row = [
      Utilities.getUuid(), new Date().toISOString(), run, cita, channel, type,
      'OPERADOR_MANUAL', userId, consent, hash, requestId, '1.0'
    ];
    // Referencia idempotente para impedir eventos duplicados por reintentos.
    var last = sheet.getLastRow();
    if (last >= 2) {
      var refs = sheet.getRange(2, 11, last - 1, 1).getValues();
      for (var i = refs.length - 1; i >= 0; i--) {
        if (String(refs[i][0]) === requestId) {
          var existing = sheet.getRange(i + 2, 1, 1, 12).getValues()[0];
          orionAssertCommsDuplicate_(existing, row);
          return {eventId: String(existing[0]), duplicate: true, serverTimestamp: String(existing[1])};
        }
      }
    }
    var eventId = row[0];
    var at = row[1];
    sheet.appendRow(row);
    SpreadsheetApp.flush();
    return {eventId: eventId, duplicate: false, serverTimestamp: at};
  } finally {
    lock.releaseLock();
  }
}
