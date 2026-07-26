# ORION Dental App

Plataforma clínica modular desarrollada por ORION Health SpA.

## Arquitectura vigente

- `modules/comunicaciones/` — Comunicaciones Clínicas V5.7.1.
- `modules/insumos/` — Insumos V4.5.1.
- `modules/cmf/` — Clínico CMF V4.3.24.
- `modules/endodoncia/` — Endodoncia V4.6.
- `modules/ortodoncia/` — Ortodoncia V1.2.
- `modules/odontopediatria/` — Odontopediatría V1.5.1.

Cada módulo posee una ruta estable `modules/<modulo>/index.html`; las versiones no forman parte del nombre de las carpetas.

## Rendimiento V1.2.5

- Comunicaciones restaura inmediatamente la agenda guardada durante la sesión.
- La actualización desde Drive ocurre en segundo plano.
- La vigencia de la caché de agenda se amplía a cuatro horas dentro de la sesión.
- La librería XLSX deja de bloquear el inicio y se carga únicamente cuando se selecciona un Excel.
- El service worker aplica caché inmediata con actualización silenciosa para los recursos internos.

## ORION Insumos

- Catálogo Maestro ORION con 538 insumos activos.
- Catálogo incorporado automáticamente; no requiere seleccionar Excel.
- Caché local por 24 horas.
- Drive solo puede reemplazar el catálogo cuando entrega al menos 500 registros válidos.
- Una base parcial o vacía es descartada automáticamente.
- La importación Excel queda disponible en `Administración avanzada del catálogo`.

## Seguridad aplicada al piloto

- Los tokens no se incorporan al repositorio; se ingresan por sesión.
- El paciente activo utiliza `sessionStorage`, con caducidad y contrato común.
- El portal verifica origen y ventana emisora en la comunicación entre iframes.
- La firma manuscrita no se publica como recurso estático.
- La plantilla CMF para hipertensión fue corregida para evitar la pauta heredada de meloxicam 30 mg/día.

## Limitaciones conocidas

- Google Apps Script continúa integrado mediante JSONP heredado.
- Algunas funciones de Excel y PDF dependen todavía de CDN.
- Las plantillas farmacológicas y documentales requieren auditoría clínica integral antes de uso comercial o multiusuario.
- La sincronización viva del catálogo se habilitará cuando `ORION_DB_SAP / INSUMOS` contenga el catálogo completo validado.

## Estado

**PILOTO CONTROLADO.** La reorganización no equivale a certificación clínica, de seguridad ni regulatoria.
