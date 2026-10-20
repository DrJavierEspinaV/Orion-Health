# ORION Comunicaciones V5.7.13 — Ajuste visual solicitado

**Fecha:** 2026-10-20  
**Tipo:** corrección exclusivamente visual de la agenda y seguimiento.

## Hallazgo

Las hojas originales `responsive-fixes.css` y `mobile-v142.css` seguían forzando `width:100% !important` para `.btn.whatsapp.wa-action`. Este comportamiento podía imponerse en móviles y producir botones muy grandes que distorsionaban la tabla, según las capturas aportadas.

## Cambio

- El botón WhatsApp en la lista clínica tiene ancho máximo de 112 px y altura máxima de 34 px, conservando los colores de los tipos de alerta.
- Se elimina `width:100%` de las dos fuentes originales de estilos que causaban expansión.
- El controlador local de bitácora refuerza sobre el elemento la dimensión con propiedades `!important` para protegerse de reglas heredadas. No se modifican enlaces, números, mensajes ni acciones clínicas.
- La barra de seguimiento queda plegada por defecto, con estado y contadores visibles en el título; CSV y vaciado se encuentran disponibles al desplegarla.
- Continúa el menú `⋯` por paciente para la confirmación manual del envío, respuesta y corrección.
- Espaciado y distribución móvil compactados: identificación arriba, RUN/fecha/hora juntos y estado/motivo juntos.
- Cache PWA e identificadores de recursos cambiados para refrescar los estilos.

## Fuera de alcance

No se cambia autenticación, token de acceso, Apps Script, Google Sheets ni el tratamiento del consentimiento. El usuario pidió continuar con las mejoras visuales sin trabajar en contraseña. **Ninguna aplicación debe cargar fichas clínicas privadas anónimamente como atajo.**

## Aceptación

Pruebas de escritorio y móvil: WhatsApp 118 px de ancho y 36 px de alto como límites con margen de medición; prueba explícita inyectando un estilo antiguo de `height:600px !important` y `width:100% !important`, que debe quedar anulado. Menú de bitácora cerrado por defecto; controles siguen accesibles; el flujo original de WhatsApp permanece.

**No se declara que el despliegue público haya cambiado hasta verificar la publicación y la caché en el dispositivo real.**
