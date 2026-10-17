# ORH-UX-MAN-001-V2.0 — Plan Maestro de Homologación Visual y UX

**Proyecto:** ORION Dental App / ORION Health OS  
**Fecha de línea base:** 2026-10-17  
**Objetivo:** optimización estética, dinámica y funcional de lo **ya existente**. Siete módulos.  
**Repositorio de implementación:** `DrJavierEspinaV/Orion-Health`  
**Referencia estética:** `DrJavierEspinaV/ORION-App-Clinica`, rama `agent/v3.12-shared-core`.

## Decisiones rectoras

1. **No se rediseña el motor clínico.** Fichas, fármacos, dosis, formularios, permisos, estructura de mensajes, catálogo, cálculos y herramientas impresas quedan intactos.
2. **La matriz editorial ORION no cambia.** Logos oficiales, firmas, folios, tamaño Statement, encabezados, pies y plantillas mantienen sus reglas. Toda la capa nueva de UX es **pantalla**, no `@media print`.
3. **El diseño se consume desde una única fuente.** Colores `#1F3F5B`, `#17324D`, `#8C8C8C`, `#F3F3F3`, `#FFFFFF`, `#D9DEE3`. Estado correcto `#12805C`, atención `#C06A16`, peligro `#C93C4D`.
4. **Integración aditiva y reversible** mediante `orion-ux-v2`. No se elimina masivamente el CSS heredado, pues mantiene comportamientos que se deben preservar.
5. **Sin falsas confirmaciones.** No introducir «Guardado», «Enviado» ni estados de éxito sin respuesta real de la operación.
6. **Sin contraseñas incrustadas**, bypass de permisos ni borrado de almacenamiento del paciente para instalar nuevas interfaces.
7. **Cambios versionados y comprobados**: Playwright escritorio/móvil, QA de impresión, CSS cargados, actualización offline PWA.

## Arquitectura visual implementada

| Componente | Ubicación | Contrato |
|---|---|---|
| Tokens canónicos | `assets/shared/health-os-design-tokens-v2.css` | Variables CSS; sin reglas clínicas |
| Controles compartidos | `assets/shared/health-os-ui-components-v2.css` | Foco, estado deshabilitado, transiciones reducidas, controles táctiles |
| Portal | `assets/shared/portal-ux-v2.css` | Jerarquía visual de las siete rutas y acceso externo |
| Adaptación módulos | `assets/shared/health-os-ux-modules-v2.css` | Refinamiento por tipo, sin alterar motores o impresión |
| Carga | `modules/*/loader.js`, `modules/armonizacion/index.html` | `html.orion-ux-v2[data-orion-module]` opt-in |
| Protección | `tests/orion-ux-v2-visual-contract.spec.mjs` | Cinco viewports, siete módulos, impresión, recursos y manifiesto |
| PWA | `service-worker.js` | Nueva caché tras instalar correctamente CSS esenciales |

## Backlog UX completo — secuencia técnica

| ID | Componente | Estado de este entregable |
|---|---|---|
| UX-00 | Línea base y pruebas visuales | Pruebas multi-viewport, capturas en CI y regresiones existentes |
| UX-01 | Tokens y componentes opt-in | Implementados |
| UX-02 | Centro de aplicaciones | Refinamiento de tarjetas, semántica externa y teclado |
| UX-03 | Portal y contexto | Foco y superficie de acciones optimizados sin alterar sesión |
| UX-04 | Comunicaciones | Diseño adaptativo del panel y foco visual; autenticación intacta |
| UX-05 | CMF | Refinamiento de tabs, campos y marco de vista previa |
| UX-06 | Endodoncia | Estilo consistente de edición sin modificar recetas |
| UX-07 | Insumos | Jerarquía del catálogo, alineación numérica y legibilidad de tabla |
| UX-08 | Ortodoncia/Odontopediatría | Pulido compartido de filtros, acciones y resultados |
| UX-09 | Armonización | Componentes de navegación/mapa sin tocar geometría ni atlas |
| UX-10 | Microinteracciones | Foco visible, transiciones de 160 ms, modo movimiento reducido |
| UX-11 | Responsive/accesibilidad | Contrato táctil y controles 320–1366 px |
| UX-12 | PWA/editorial | Descripción de siete módulos y CSS esenciales cacheados |
| UX-13 | Consolidación CSS | Introducida fuente V2 central; retirar duplicados solo tras demostrar paridad con capturas |

**Nota UX-13:** la eliminación destructiva de reglas heredadas no forma parte del contrato actual. No se dará por consolidada una familia de reglas hasta que una prueba visual antes/después permita retirarla sin regresión. Centralizar los valores canónicos permite la reducción gradual posterior con riesgo controlado.

## Registro de validación

- **CI obligatorio:** `node tools/orion-static-check.mjs`, pruebas unitarias/funcionales y Playwright en Chromium desktop/móvil.
- **Vistas:** portal a 320, 390, 768, 1024 y 1366 px; entrada a siete módulos; captura de portal y módulos.
- **Impresión:** conservar `#printSheet`, `#printSheet2` y los estilos de impresión, folio, firma y Statement.
- **Seguridad clínica:** ningún acceso extra a Drive sin autenticación.
- **PWA:** comprobar carga de CSS V2, recuperación y versionado.
- Si una prueba crítica falla, corregir y volver a ejecutar; **no fusionar una compilación fallida**.

## Riesgos de mantenimiento pendientes para revisiones posteriores

El portal y sus módulos disponen de adaptadores CSS heredados y dinámicos. Se han localizado numerosas reglas `!important` y estilos antiguos dentro de archivos fuente posteriormente corregidos por loaders. Son deuda técnica de presentación, no evidencia de un defecto clínico. Se prioriza compatibilidad funcional antes de eliminaciones masivas.

## Criterio de aceptación

La versión se considera liberable cuando CI está verde, siete módulos cargan con las cuatro capas CSS de V2 según corresponda, no se introducen desbordes nuevos, el acceso externo sigue diferenciado, la matriz de documentos no se altera y la instalación PWA conserva estilos sin borrar datos.
