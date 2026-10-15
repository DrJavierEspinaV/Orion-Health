# Incidente ORION Dental App — Portada sin maquetación (PWA)
**Fecha:** 2026-10-15  
**Estado:** Corrección del mecanismo de caché; la causa exacta en el equipo del usuario requiere consola de red si persiste.

## Evidencia visible

Una captura de la PWA instalada mostró la cabecera azul extendida, botones apilados como HTML elemental y la zona del módulo visible al mismo tiempo que el selector de rutas. Eso indica pérdida parcial de reglas CSS del portal Health OS, **no evidencia por sí solo pérdida de fichas ni datos**.

En `index.html`, los CSS se solicitan como `styles-1.css?v=1.4.5`, `portal-route-selector-v144r6.css?v=1.4.5` y `portal-health-os-bridge-v1.css?v=1`. El service worker precargaba los mismos recursos sin parámetros (`./styles-1.css`, etc.). Su ruta de contingencia buscaba coincidencia exacta (`caches.match(request)`), de modo que ante errores de red o temporalmente sin conexión podía no encontrar los CSS precargados. Adicionalmente, `Promise.allSettled` permitía que un worker nuevo se activara sin haber descargado un CSS esencial.

Esta es una **vulnerabilidad de infraestructura confirmada por revisión de código**, no una atribución exclusiva del incidente del equipo; tampoco se verificó el estado HTTP de GitHub Pages durante la captura.

## Cambios

1. `ESSENTIAL_SHELL`: CSS estructurales de portada, HTML y controlador JS deben descargarse para completar instalación.
2. `cacheShell` mantiene la precarga secundaria tolerante a fallos, pero lanza error si falta un recurso esencial.
3. `skipWaiting` solo se ejecuta tras instalar con éxito el shell crítico; las cachés antiguas no se eliminan si el nuevo worker falla en instalar.
4. `cachedVersion` usa `ignoreSearch:true` en recursos estáticos para que archivos precargados sin `?v` respondan a solicitudes con versión cuando no haya red.
5. Respuestas HTTP fallidas también pueden utilizar el CSS cacheado.
6. Las escrituras en caché durante `networkFirst` se esperan antes de resolver la respuesta, evitando guardados incompletos.
7. Nueva caché `orion-dental-app-v1.4.5-health-os-ui7-css-recovery` para forzar actualización y descartar registros anteriores una vez activa la versión verificada.

## No cambia

- El HTML de la portada, la hoja de estilo Health OS ni los logos.
- El contexto activo de paciente (sessionStorage), datos, fichas, exportaciones, recetas, procedimientos y documentos clínicos.
- Rutas de módulos, tratamientos, firmas o generación de PDF.

## Pruebas

- Comprobación del diseño Health OS en escritorio.
- Instalación y control efectivo del service worker.
- Desconexión de red y recarga de portada.
- Recuperación de CSS precargado al solicitar versiones de query no vistas antes.
- Conservar todas las pruebas funcionales y clínicas existentes.

## Diagnóstico en el equipo si persiste

En la PWA de Chrome/Edge: cerrar la ventana, abrir el URL de GitHub Pages con conexión, presionar Ctrl+Shift+R y reabrir la PWA. **No borrar «almacenamiento del sitio», datos de aplicación ni sesiones clínicas** sin respaldo. Si el problema persiste, inspeccionar en DevTools > Network si los CSS devuelven errores y en Application > Service Workers el estado/controlador y la versión de caché, preservando información sensible.
