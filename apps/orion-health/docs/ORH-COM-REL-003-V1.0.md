# ORION Comunicaciones V5.7.11 — Separación clínica y promocional

**ID:** ORH-COM-REL-003-V1.0  
**Fecha:** 19-10-2026  
**Estado:** candidato en CI antes de integración.

## Objetivo

Evitar que la base de agenda o una lista Excel sin consentimiento específico habilite automáticamente enlaces WhatsApp de carácter promocional, sin interrumpir el funcionamiento de recordatorios, comunicaciones clínicas ni alertas de retraso.

## Comportamiento

- **Tipo de mensaje: Promoción Clínica:** solo se genera enlace de WhatsApp cuando `consentimientoPromociones === true` en el registro cargado.
- El campo se interpreta desde `Consentimiento Promociones` / `Consentimiento promociones` / `Consentimiento Marketing`. Solo `Sí`, `Si`, `true`, `1`, `Autorizado` o `Verificado` son afirmativos. Desconocido, vacío, revocado o ambiguo = bloqueado.
- Para pacientes sin autorización, se muestra **«Promoción bloqueada: consentimiento no registrado»**, y no existe enlace compartible en la fila ni en la exportación de enlaces.
- Los cambios de plantilla regeneran inmediatamente la lista. Evita mostrar una URL comercial previa al cambiar de modo.
- El contacto manual queda deshabilitado para promoción, porque no está vinculado a un registro de autorización.
- La nueva versión conserva el diseño ORION Health OS y refresca la caché PWA `health-os-ui13-comms-consent`.

## Situación real de ORION_DB_SAP

En el esquema actual de la pestaña `DB` solo se observan `KEY, FECHA, HORA, STATUS, MOTIVO, PACIENTE, TELEFONO, RUN, MEDICO, CENTRO, N_CITACION, ORIGEN, TS_IMPORT`; **no existe columna de consentimiento promocional**. Por tanto, **la agenda existente se bloquea para campañas** salvo que más adelante se integre una fuente de consentimiento específica y válida.

## Límites y próximos requisitos

- La verificación de un campo en navegador es una **protección operativa en UI**, no constituye verificación jurídica, prueba criptográfica ni autorización de mensajería mediante API.
- Ningún vínculo de WhatsApp acredita entrega. El usuario debe confirmar manualmente los envíos realizados desde la aplicación.
- No se envía publicidad ni se procesan datos reales durante estas pruebas.
- Próximamente: consentimiento con origen, finalidad, fecha/hora, titular, evidencia y revocación; verificación de permisos en servidor; segmentación autorizada; reporte de conversión económica con minimización de datos.

## Pruebas

`npm run check:orion`, `npm run test:unit`, `npm run test:e2e`. Incluye escenarios de bloqueo, autorización explícita, rechazo de valores ambiguos, cambio de plantillas y seguridad del enlace manual.
