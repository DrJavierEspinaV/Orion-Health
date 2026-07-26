# ORION Dental App

Plataforma clínica modular desarrollada por ORION Health SpA.

## Arquitectura vigente

- `modules/comunicaciones/` — Comunicaciones Clínicas V5.7.
- `modules/insumos/` — Insumos V4.4.1.
- `modules/cmf/` — Clínico CMF V4.3.24.
- `modules/endodoncia/` — Endodoncia V4.6.
- `modules/ortodoncia/` — Ortodoncia V1.2.
- `modules/odontopediatria/` — Odontopediatría V1.5.1.

Cada módulo posee una ruta estable `modules/<modulo>/index.html`; las versiones ya no forman parte del nombre de las carpetas.

## Seguridad aplicada al piloto

- Los tokens no se incorporan al repositorio; se ingresan por sesión.
- El paciente activo utiliza `sessionStorage`, con caducidad y contrato común.
- El portal verifica origen y ventana emisora en la comunicación entre iframes.
- La firma manuscrita no se publica como recurso estático de los módulos nuevos.
- La plantilla CMF para hipertensión fue corregida para evitar la pauta heredada de meloxicam 30 mg/día.

## Insumos

El importador Excel continúa operativo. La normalización del catálogo institucional se realizará como una fase de datos separada, para evitar fusionar automáticamente códigos repetidos o fuentes no validadas.

## Limitaciones conocidas

- Google Apps Script continúa integrado mediante JSONP heredado.
- Tailwind, XLSX y html2pdf dependen todavía de CDN.
- Las plantillas farmacológicas y documentales requieren auditoría clínica integral antes de uso comercial o multiusuario.

## Estado

**PILOTO CONTROLADO.** La reorganización no equivale a certificación clínica, de seguridad ni regulatoria.
