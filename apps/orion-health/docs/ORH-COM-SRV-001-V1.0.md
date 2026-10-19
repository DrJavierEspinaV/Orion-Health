# ORION Comunicaciones · contrato del registro persistente

**ID:** ORH-COM-SRV-001-V1.0 · **Fecha:** 2026-10-18

## Preparación de datos validada

Se creó en la hoja ORION_DB_SAP una nueva pestaña **COMMS_EVENTOS**, sin modificar las seis pestañas previas. Contiene solo encabezados, filtro y formato institucional. Se ha verificado el contenido de A1:L1; no hay eventos clínicos escritos.

Esquema en orden: EVENT_ID, FECHA_SERVIDOR_UTC, RUN_PACIENTE, CITA_ID, CANAL, TIPO_EVENTO, ORIGEN_CONFIRMACION, USUARIO_ID, CONSENTIMIENTO_CANAL, MENSAJE_HASH_SHA256, REFERENCIA_EVENTO, VERSION_ESQUEMA.

**No guardar la ID del libro, credenciales ni tokens en GitHub.** El servidor deberá obtener la ID mediante Script Properties.

## Servicio incluido

`integrations/apps-script/comms-events-secure.gs` incluye la función privada `orionAppendCommsEventSecure_`, que:

- exige un **actor previamente autenticado por el servidor** con `canWriteCommunications=true`;
- valida RUN y dígito verificador, cita, canal, tipo, clave idempotente y hash opcional;
- toma identidad profesional y consentimiento exclusivamente de `actor`, no del navegador;
- escribe con fecha de servidor bajo `LockService`, realizando control de duplicados;
- no registra número telefónico, nombre ni texto completo del mensaje;
- no contiene `doPost`, `doGet` ni endpoint público y por tanto **no está activo para clientes**.

El backend existente tendrá que construir `actor` a partir de una autorización real de Google Workspace o un servicio equivalente. **Nunca** aceptar `actor` de un cuerpo JSON, parámetro URL ni formulario público.

## Integración pendiente, no activada

1. Incorporar el archivo al proyecto Apps Script real tras identificar su repositorio y sus mecanismos existentes de autorización.
2. Configurar `ORION_DB_SPREADSHEET_ID` mediante Script Properties del servidor (no en código fuente).
3. Conectar el dispatcher servidor autenticado y validar autorización por rol y paciente.
4. Implementar el cliente con reintentos e ID idempotente, pero **sin declarar entrega ni éxito antes de la respuesta del servidor**.
5. Probar sólo con RUN sintéticos en ambiente de prueba, verificando errores, aislamiento multiusuario y auditoría.
6. Mantener el registro de sesión actual como contingencia, con aviso claro si no se sincroniza.

El servicio NO entrega, agenda ni responde WhatsApp por sí mismo. La tabla Sheets tampoco puede considerarse inmutable o regulatoriamente certificada sin controles adicionales de acceso, retención, auditoría administrativa y copia de seguridad.
