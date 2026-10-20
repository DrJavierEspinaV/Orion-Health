# ORION Comunicaciones V5.7.15 — UDC visible y agenda legible

**Código:** ORH-COM-UX-007-V1.0 · **Fecha:** 2026-10-20

## Criterio visual acordado

- **UDC siempre visible junto al nombre del paciente**, en una etiqueta de alto contraste azul ORION, con casilla marcada o desmarcada a la vista. Nunca se esconde dentro de Acciones.
- La fila da prioridad al nombre y a la casilla UDC; debajo permanecen teléfono, WhatsApp compacto, Acciones y bitácora `⋯` cuando existe.
- «Acciones» incluye **solo retraso de llegada, retraso de atención y ETA**; se mantiene plegado por defecto y conserva su estado al reconstruirse la fila.
- Los datos RUN, fecha, hora, estado y motivo permanecen visibles. Se aumenta moderadamente el espacio vertical, tamaño de nombre y separación, sin volver a las tarjetas gigantes.
- Las filas sin teléfono muestran una sola indicación («Sin teléfono»), no una repetición.
- La función original UDC permanece enlazada a la ficha/documento clínico; no se reemplaza la casilla por una copia sin eventos.

## Controles y seguridad

Sin cambios en Excel/Drive, claves, Apps Script, identificación, datos médicos, mensajes, consentimiento, ni estados de cita.

## Verificación

Pruebas Playwright en escritorio (1440 px) y móvil (390 px), que exigen UDC visible **con Acciones cerrado y abierto**, ausente del interior del desplegable, preservación del listener original de UDC, retrasos/ETA accesibles y WhatsApp no gigante.

**La verificación final en el equipo real debe realizarse después del despliegue de GitHub Pages.**
