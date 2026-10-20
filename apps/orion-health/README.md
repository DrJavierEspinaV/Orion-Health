# ORION Dental App V1.4.5 — ORION Health OS

Plataforma clínica modular desarrollada por ORION Health SpA.

## Arquitectura vigente

- `modules/comunicaciones/` — Comunicaciones Clínicas V5.7.16.
- `modules/insumos/` — Insumos V4.5.4.
- `modules/cmf/` — Clínico CMF V4.3.43.
- `modules/endodoncia/` — Endodoncia V4.6.3.
- `modules/ortodoncia/` — Ortodoncia V1.2.1.
- `modules/odontopediatria/` — Odontopediatría V1.5.2.
- `modules/armonizacion/` — Armonización Orofacial V2.1.0.

Cada módulo posee una ruta estable `modules/<modulo>/index.html`; las versiones no forman parte del nombre de las carpetas.

## Comunicaciones Clínicas V5.7.16

- Vista previa de enlaces en texto seguro.
- WhatsApp no aparece como enviado por el mero hecho de abrir la conversación.
- Bitácora temporal con confirmación manual, registro de respuesta y corrección, exportable a CSV.
- Las promociones solo generan enlaces para pacientes cuyo origen de datos declara consentimiento promocional afirmativo explícito. Sin ese dato quedan bloqueadas; la agenda clínica actual no aporta el campo.
- Lista clínica: nombre prioritario; teléfono, WhatsApp reducido, seguimiento y botón «Acciones» en banda compacta. UDC permanece visible y diferenciado junto al nombre. «Acciones» contiene únicamente retrasos de llegada/atención y ETA. Barra de bitácora plegada.
- Acceso recuperable sin repetir clave mediante sesión autorizada o gestor seguro del navegador (cuando es compatible y previamente autorizado); nunca token público.
- La bitácora local **no** equivale a auditoría clínica permanente ni se sincroniza aún con Google Drive.

## Página continua y rendimiento

- Un solo desplazamiento vertical en el portal.
- Altura automática de los módulos mediante `ResizeObserver` y `MutationObserver`.
- Menú lateral visible en escritorio.
- Comunicaciones restaura la agenda desde caché de sesión y actualiza Drive en segundo plano.
- XLSX se carga bajo demanda.
- Service worker V1.4.5 con soporte offline para el núcleo y los siete módulos.

## ORION Insumos

- Catálogo Maestro ORION con 538 insumos activos.
- Los 538 registros están cargados físicamente en `ORION_DB_SAP / INSUMOS`.
- Copia operativa integrada y caché local por 24 horas.
- Drive solo reemplaza el catálogo cuando entrega al menos 500 registros válidos.
- Importación Excel relegada a administración avanzada.

## Auditoría clínica y catálogo farmacológico

- Plantillas principales de CMF y Endodoncia revisadas para el piloto.
- Se eliminan combinaciones automáticas indiscriminadas de AINE, antibiótico y corticoide en las plantillas predeterminadas.
- Se restringen antibióticos a indicaciones clínicas concretas.
- Se incorporan límites de dosis y controles pediátricos.
- El modo `Por Fármacos / Familias` está activo nuevamente en CMF y Endodoncia.
- El profesional puede construir una receta seleccionando Analgesia, Antibióticos y Corticoides/Otros.
- Cada cambio en el catálogo invalida la confirmación previa y exige una nueva revisión clínica antes de emitir.
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
- Navegación de los siete módulos.
- Catálogo persistente, catálogo farmacológico restaurado, controles clínicos, página continua y recursos PWA.
- GitHub Actions ejecuta las pruebas antes de fusionar.

## Limitaciones conocidas

- Google Apps Script continúa usando JSONP heredado.
- Algunas funciones de Excel y PDF dependen todavía de CDN.
- V1.4.5 es una versión de piloto personal, no una plataforma clínica multiusuario certificada.

## Estado

**FINAL PILOTO — uso profesional personal y supervisado.** No equivale a certificación regulatoria ni autoriza uso autónomo por terceros.
