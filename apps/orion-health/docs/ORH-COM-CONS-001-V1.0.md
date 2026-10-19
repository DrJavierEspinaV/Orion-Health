# ORION Comunicaciones — Registro de consentimientos por finalidad

**ID:** ORH-COM-CONS-001-V1.0  
**Fecha:** 2026-10-19  
**Estado:** backend preparado y no desplegado.

## Estructura creada en ORION_DB_SAP

Se creó y verificó la pestaña vacía **COMMS_CONSENTIMIENTOS**. Conserva intactos `DB`, `RAW_SAP`, `VIEW`, `PARAMS`, `INSUMOS`, `LOG_DESCARTES` y `COMMS_EVENTOS`.

Cabecera contractual A1:L1: `CONSENT_ID`, `RUN_PACIENTE`, `CANAL`, `FINALIDAD`, `EVENTO`, `FECHA_SERVIDOR_UTC`, `VIGENTE_DESDE_UTC`, `ORIGEN`, `EVIDENCIA_ID`, `USUARIO_ID`, `REFERENCIA_EVENTO`, `VERSION_ESQUEMA`.

No se insertaron consentimientos ni datos clínicos. El diseño de tabla usa el encabezado institucional ORION. La hoja no constituye una base legal por sí sola: su seguridad dependerá de la configuración de acceso, respaldo y servidor.

## Contrato servidor `comms-consent-resolver.gs`

Función `orionResolveCommsConsentSecure_(run, canal, finalidad, actor)`:

- Requiere identidad de actor verificada **desde backend** y permiso explícito de lectura/escritura de comunicaciones.
- Valida RUN y dígito verificador; canal `WHATSAPP` y finalidad `COMERCIAL` o `CLINICA`.
- Rechaza el esquema si alguna columna fue modificada.
- Busca la última decisión efectiva en historial por paciente + canal + finalidad.
- Devuelve `VERIFICADO` exclusivamente si el evento `OTORGADO` tiene vigencia presente, evidencia identificable, origen institucional válido y operador.
- Devuelve `REVOCADO` al encontrar revocación posterior; `CORREGIDO` invalida autorizaciones previas hasta nueva autorización.
- Ausencia, datos insuficientes, vigencia futura o ambigüedad => `NO_VERIFICADO`.
- No tiene `doPost`, `doGet`, claves incrustadas ni conexión pública.
- Depende de la función `orionNormalizeRun_` incluida en `comms-events-secure.gs`; ambos archivos deben instalarse juntos en el mismo proyecto Apps Script autenticado.

## Restricciones de producción

El consentimiento solo será verificable cuando exista evidencia válida y un backend que impida escritura directa no autorizada. Un identificador de evidencia sin comprobación del archivo original NO equivale a consentimiento legalmente acreditado. Nunca aceptar `actor` ni el estado de consentimiento desde parámetros JSONP públicos.

La V5.7.11 contiene únicamente un **filtro de interfaz** basado en datos de la fuente. NO está conectada aún a este resolver. Antes de habilitar campañas o sincronización permanente:

1. Implementar un dispatcher autenticado, con permisos diferenciados y protección CSRF.
2. Auditar concesiones y revocaciones y validar la evidencia a través de un repositorio con acceso restringido.
3. Resolver consentimiento en servidor durante cada acción promocional, nunca confiar en el valor del navegador.
4. Conectar las operaciones a `COMMS_EVENTOS` con trazabilidad y claves idempotentes.
5. Pruebas end-to-end sin datos reales y verificación de despliegue Pages/Apps Script.

**No se autoriza envío promocional automático ni se habilitan contactos reales con esta entrega.**
