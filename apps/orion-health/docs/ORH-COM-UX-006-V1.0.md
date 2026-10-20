# ORION Comunicaciones — Agenda Prioritaria V5.7.14

**Documento:** ORH-COM-UX-006-V1.0 · **Fecha:** 2026-10-20

## Decisión de diseño

**La agenda de pacientes es el elemento protagonista.** El paciente debe identificarse rápidamente y sus datos se muestran sin controles extensos encima del nombre.

**Fila cerrada estándar:**
- Nombre clínico en primera línea, destacado en azul corporativo.
- Teléfono, WhatsApp compacto, botón **Acciones** y seguimiento opcional en una sola banda flexible.
- RUN, fecha, hora, estado y motivo siguen visibles en las columnas originales de escritorio o en tres franjas compactas de móvil.
- Acciones UDC, retraso de llegada, retraso en atención y ETA permanecen disponibles en el menú **Acciones**; están ocultas solo visualmente cuando no se usan.
- El menú de seguimiento `⋯` y la barra de bitácora temporal continúan con sus funciones existentes.

## Decisiones técnicas

- Los controles clínicos originales son **trasladados**, no recreados: permanecen los listeners y la lógica de selección/estado original.
- Si el profesional abre **Acciones**, el panel conserva su expansión a través de los rerenders que siguen a seleccionar UDC o un retraso.
- No hay nuevos campos clínicos, nuevas APIs, persistencia extra ni cambios de autenticación.
- El WhatsApp conserva los tipos de mensaje y las protecciones de consentimiento promocional de V5.7.11.
- Los datos faltantes no se ocultan ni se sustituyen por diagnósticos inventados.

## Criterios de aceptación

- Navegadores de escritorio (1440 px) y móviles (390 px).
- Controles ocultos cuando no están en uso, pero recuperables mediante teclado/tacto.
- El teléfono y el enlace WhatsApp comparten una misma banda cuando hay espacio; el móvil permite el salto de línea natural, sin desbordamiento lateral.
- WhatsApp con ancho máximo 112 px y altura máxima 34 px.
- El botón «Acciones» permite marcar UDC, demora de llegada, demora de atención y ETA sin perder sus listeners.
- El panel de mensajes, la importación, el contacto manual y la ficha clínica permanecen intactos.

## Aspectos fuera de alcance

No se elimina el control de acceso ni se desarrollan nuevas funciones financieras. Tampoco se habilitan campañas publicitarias sin consentimiento. La publicación real deberá verificarse en el dispositivo después de pasar CI.
