# ORION Dental App V1.3.0 — Final Piloto

**Fecha de liberación:** 26-07-2026  
**Commit de integración:** `e2c9e8c873f58e492a9fb94c40ac658eebfd63c1`  
**Estado:** Final Piloto — uso profesional personal y supervisado

## Alcance liberado

- Portal clínico con seis módulos integrados.
- ORION Comunicaciones Clínicas V5.7.2.
- ORION Insumos V4.5.3 con 538 registros sincronizados en Drive.
- ORION Clínico CMF V4.3.25.
- ORION Endodoncia V4.6.1.
- ORION Ortodoncia V1.2.
- ORION Odontopediatría V1.5.1.
- Página continua, altura automática y diseño móvil.
- PWA instalable y caché offline del núcleo.
- Pruebas automatizadas en escritorio y emulación Pixel 7.
- Auditoría de plantillas principales CMF y Endodoncia.
- Confirmación profesional obligatoria antes de emitir documentos farmacológicos.
- Credenciales excluidas de URL y del código cliente vigente.

## Resultado de validación

El workflow `ORION Dental App Final Pilot` terminó correctamente antes de la integración a `main`.

## Limitación controlada

La rotación del secreto del WebApp de Google Apps Script debe verificarse directamente dentro del proyecto servidor. El valor de reemplazo fue preparado en `ORION_DB_SAP / PARAMS`; la aplicación cliente no distribuye ninguna clave predeterminada.

## Dirección estable prevista

`https://drjavierespinav.github.io/Orion-Health/apps/orion-health/`
