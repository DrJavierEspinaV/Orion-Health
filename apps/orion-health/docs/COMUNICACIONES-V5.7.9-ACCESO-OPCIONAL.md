# ORION Comunicaciones 5.7.9 — Acceso opcional a Drive

**Fecha:** 2026-10-17

## Objetivo

Eliminar el cuadro **“Conectar base clínica / Clave de acceso ORION”** que aparecía automáticamente al abrir Comunicaciones y bloqueaba la experiencia de uso.

## Comportamiento

- Con la sesión sin token, ORION Comunicaciones carga su interfaz sin mostrar el modal.
- Se puede visualizar la interfaz y usar herramientas locales que no requieren consultas al servidor.
- El estado muestra **“Sin conexión a Drive”** y el botón **“Conectar base clínica”** queda disponible para solicitud expresa del usuario.
- La clave solo se ingresa al pulsar el botón; continúa almacenándose exclusivamente en `sessionStorage` para la sesión y nunca en GitHub, URL ni `localStorage`.
- Si existe un token de sesión válido, se mantiene la conexión automática, como en las versiones previas.
- Cancelar y Cerrar acceso mantienen el modal cerrado; no fuerzan un inicio de sesión nuevo.
- Una petición protegida de listar/consultar pacientes en Google Sheets sigue exigiendo autenticación del servidor mediante el token.

## Seguridad y alcance

**No se ha desactivado el control de acceso a datos clínicos.** Para quitar la clave también de la conexión real a Drive se necesita un mecanismo de autorización alternativo, por ejemplo identidad Google autorizada y backend que verifique permisos por usuario (sin exponer credenciales en JavaScript público). Quitar el token de las solicitudes JSONP actuales permitiría acceso anónimo si el servidor aceptara esas peticiones.

No se modifican historia clínica, contenido farmacológico, emisión de documentos, paciente activo, firmas, orígenes de datos ni integración de otros módulos. No se guardan ni redistribuyen credenciales. Se modifica `session-config.js`, la versión del cargador de Comunicaciones y el caché PWA.

## Criterios de aceptación

- Inicio sin ventana modal obligatoria (escritorio y móvil).
- Las herramientas locales del módulo siguen visibles sin token.
- La conexión protegida sigue pidiendo autorización únicamente tras una acción deliberada.
- Cancelar y Cerrar acceso no reabren el modal.
- Sin nuevos secretos incrustados ni cambios en la protección del backend.
- GitHub Actions estático, unitario, Playwright escritorio/móvil completan correctamente.
