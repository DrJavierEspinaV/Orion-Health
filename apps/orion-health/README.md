# ORION Dental App

Plataforma clínica modular desarrollada por ORION Health SpA.

## Estado vigente

- **Versión:** 1.2.4-piloto-insumos-persistentes
- **Fecha:** 26-07-2026
- **Estado:** PILOTO CONTROLADO

## Arquitectura vigente

- `modules/comunicaciones/` — Comunicaciones Clínicas V5.7.
- `modules/insumos/` — Insumos V4.5.0.
- `modules/cmf/` — Clínico CMF V4.3.24.
- `modules/endodoncia/` — Endodoncia V4.6.
- `modules/ortodoncia/` — Ortodoncia V1.2.
- `modules/odontopediatria/` — Odontopediatría V1.5.1.

Cada módulo posee una ruta estable `modules/<modulo>/index.html`; las versiones ya no forman parte del nombre de las carpetas.

## ORION Insumos 4.5.0

El módulo ya no exige cargar un archivo Excel en cada uso.

### Fuente operativa

- Catálogo Maestro ORION con 538 insumos consolidados.
- Archivo rector en Drive: `ORH-INS-CAT-001-V1.0 — Catálogo Maestro Insumos ORION`.
- Copia operativa comprimida dentro de `data/catalogo-insumos.json`.
- Caché local por 24 horas para apertura rápida.
- Consulta automática de la hoja `INSUMOS` de `ORION_DB_SAP` cuando el Apps Script la tenga disponible.
- Importación Excel conservada únicamente dentro de **Administración avanzada del catálogo**.

### Tolerancia a fallas

1. Catálogo en caché del navegador.
2. Hoja `INSUMOS` mediante Apps Script, cuando esté poblada.
3. Catálogo operativo incorporado en la aplicación.
4. Importación Excel administrativa como respaldo excepcional.

## Seguridad aplicada al piloto

- Los tokens no se incorporan al repositorio; se ingresan por sesión.
- El paciente activo utiliza `sessionStorage`, con caducidad y contrato común.
- El portal verifica origen y ventana emisora en la comunicación entre iframes.
- La firma manuscrita no se publica como recurso estático de los módulos nuevos.
- La plantilla CMF para hipertensión fue corregida para evitar la pauta heredada de meloxicam 30 mg/día.

## Limitaciones conocidas

- Google Apps Script continúa integrado mediante JSONP heredado.
- Tailwind, XLSX y html2pdf dependen todavía de CDN.
- Las plantillas farmacológicas y documentales requieren auditoría clínica integral antes de uso comercial o multiusuario.

## Estado

**PILOTO CONTROLADO.** La reorganización no equivale a certificación clínica, de seguridad ni regulatoria.
