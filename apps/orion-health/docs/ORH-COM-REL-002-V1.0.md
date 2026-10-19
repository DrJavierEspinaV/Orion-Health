# ORION Comunicaciones — Bitácora de sesión V1.0

**Código:** ORH-COM-REL-002-V1.0 · **Fecha:** 2026-10-18 · **Carácter:** función operativa local, no auditoría clínica permanente

## Implementación

- Añade a Comunicaciones una barra de seguimiento y controles por fila de paciente con RUN y fecha de atención.
- Eventos diferenciados: `enlace_seleccionado`, `envio_confirmado_manual`, `respuesta_registrada_manual` y `correccion_manual`.
- Los estados **envío confirmado** y **respuesta registrada** requieren una acción consciente del profesional y diálogo de confirmación.
- Pulsar WhatsApp solo anota **enlace seleccionado; envío sin verificar**.
- Conserva los registros en `sessionStorage` por un máximo de 12 horas de inactividad lógica y 500 eventos.
- Exportación manual a CSV, codificación UTF-8 con BOM y protección contra fórmulas de hoja de cálculo.
- No envía WhatsApp, no infiere recepción ni registra mensajes, teléfonos o diagnósticos en la bitácora.
- Sin cambios al backend de Drive, control de autenticación, historia clínica, farmacología ni los demás módulos.
- Se actualizó el caché PWA a `health-os-ui12-comms-audit`.

## Advertencia clínica y técnica

La bitácora está **acotada a la sesión del navegador**; al cerrar pestaña, caducar sesión o limpiar datos, los eventos pueden perderse. Exportar CSV no equivale a vincular esos registros a la ficha clínica ni verifica quién pulsó cada botón. `origin: operador_orion` describe el origen manual, **no es identidad verificada**. No utilizar el CSV como constancia irrefutable de entrega. Los CSV contienen RUN y fechas y deben guardarse en una ubicación autorizada con medidas de seguridad.

## Próximo backend para registro clínico persistente

Diseñar un endpoint autenticado `POST /communications/events` o acción Apps Script equivalente con:
1. Identidad Google verificada en servidor y autorización profesional por rol.
2. Consentimiento documentado para comunicaciones y distinción de finalidad clínica/comercial.
3. Clave idempotente, fecha de servidor, versión del protocolo, acción y vínculo estable paciente/cita.
4. Almacenamiento inmutable o append-only, permisos limitados y auditoría de accesos.
5. Gestión de errores, reintentos y cola local temporal sin confirmar envíos por anticipado.
6. Aviso de privacidad, retención y eliminación conforme a política institucional chilena.
7. Sólo marcar **entregado** si hay evento explícito verificable del proveedor; ante WhatsApp manual, conservar el estado **declarado por operador**.

**No se activa automáticamente la escritura en Drive ni una integración API no verificada.**

## Pruebas exigidas

- `npm run check:orion`.
- `npm run test:unit`.
- `npm run test:e2e` — desktop, 390 px, y prueba de confirmaciones y corrección.
- Ciclo PWA offline, carga del módulo y ausencia de impacto en impresión y CMF.
