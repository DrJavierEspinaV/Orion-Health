# ORION Dental App V1.3 — Final Piloto

Plataforma clínica modular desarrollada por ORION Health SpA.

## Arquitectura vigente

- `modules/comunicaciones/` — Comunicaciones Clínicas V5.7.2.
- `modules/insumos/` — Insumos V4.5.3.
- `modules/cmf/` — Clínico CMF V4.3.25.
- `modules/endodoncia/` — Endodoncia V4.6.1.
- `modules/ortodoncia/` — Ortodoncia V1.2.
- `modules/odontopediatria/` — Odontopediatría V1.5.1.

Cada módulo posee una ruta estable `modules/<modulo>/index.html`; las versiones no forman parte del nombre de las carpetas.

## Página continua y rendimiento

- Un solo desplazamiento vertical en el portal.
- Altura automática de los módulos mediante `ResizeObserver` y `MutationObserver`.
- Menú lateral visible en escritorio.
- Comunicaciones restaura la agenda desde caché de sesión y actualiza Drive en segundo plano.
- XLSX se carga bajo demanda.
- Service worker V1.3 con soporte offline para el núcleo y los seis módulos.

## ORION Insumos

- Catálogo Maestro ORION con 538 insumos activos.
- Los 538 registros están cargados físicamente en `ORION_DB_SAP / INSUMOS`.
- Copia operativa integrada y caché local por 24 horas.
- Drive solo reemplaza el catálogo cuando entrega al menos 500 registros válidos.
- Importación Excel relegada a administración avanzada.

## Auditoría clínica

- Plantillas principales de CMF y Endodoncia revisadas para el piloto.
- Se eliminan combinaciones automáticas de AINE, antibiótico y corticoide.
- Se restringen antibióticos a indicaciones clínicas concretas.
- Se incorporan límites de dosis y controles pediátricos.
- El catálogo libre `Por Fármacos / Familias` queda deshabilitado.
- Imprimir, PDF, copiar o enviar exige confirmación profesional.
- Registros de auditoría disponibles en `docs/`.

## Seguridad del piloto

- La clave ya no se admite por URL ni por fragmento hash.
- Se ingresa mediante un cuadro protegido y se conserva solo en `sessionStorage`.
- El paciente activo usa almacenamiento de sesión con caducidad.
- El portal verifica origen y ventana emisora entre iframes.
- La firma manuscrita no se publica como recurso estático.

## Validación automatizada

- Verificación estática de arquitectura, versión, manifiesto, catálogo y controles clínicos.
- Pruebas Playwright en escritorio y emulación Pixel 7.
- Navegación de los seis módulos.
- Catálogo persistente, controles clínicos, página continua y recursos PWA.
- GitHub Actions ejecuta las pruebas antes de fusionar.

## Limitaciones conocidas

- Google Apps Script continúa usando JSONP heredado.
- La rotación efectiva del secreto servidor requiere acceso al proyecto de Apps Script; no puede realizarse desde el repositorio.
- Algunas funciones de Excel y PDF dependen todavía de CDN.
- V1.3 es una versión final del piloto personal, no una plataforma clínica multiusuario certificada.

## Estado

**FINAL PILOTO — uso profesional personal y supervisado.** No equivale a certificación regulatoria ni autoriza uso autónomo por terceros.
