# ORION Comunicaciones · Agenda y filtros V5.7.16

**Documento:** ORH-COM-UX-008-V1.0 · **Fecha:** 2026-10-20

## Objetivo operativo

Mejorar la orientación del profesional al buscar entre citas sin agregar botones a las filas de pacientes.

- Contador discreto de resultados: todas las citas cuando no hay filtros, y «X de Y citas» al filtrar.
- «Limpiar filtros» aparece solo cuando está activo al menos uno: nombre/RUN, estado o intervalo de fechas.
- Un clic restablece simultáneamente los filtros y coloca el foco en la búsqueda.
- Un resultado vacío se explica en lenguaje claro, separando la **agenda sin citas cargadas** de la **búsqueda sin coincidencias**.
- La retroalimentación se genera con la misma matriz `DATA` y las mismas citas `filtered` de `render()`; no se envían nuevas consultas ni se altera la agenda.
- Se conserva UDC visible junto al nombre, WhatsApp pequeño, controles de retraso dentro de «Acciones» y bitácora plegada.

## Restricciones

Sin modificaciones a la importación, consentimiento, mensajes, ficha clínica, credenciales, Apps Script, Google Sheets ni lógica de UDC.

## Aceptación

Pruebas Playwright en 1440 y 390 px con citas ficticias: contador exacto, búsqueda con cero resultados, fechas + estado combinados, limpiar todos los filtros, y ausencia de desbordamiento.

No asumir que Github Pages esté actualizado hasta que el despliegue y el equipo de destino sean verificados.