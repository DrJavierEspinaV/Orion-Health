# ORH-UX-REL-001-V2.0.2 — Cierre de homologación visual y funcional

**Fecha:** 2026-10-17  
**Proyecto:** ORION Dental App / ORION Health OS  
**Base:** ORH-UX-MAN-001-V2.0 (14 tareas UX-00 a UX-13)  
**Alcance:** estética, dinámica, funcionamiento de las interfaces y accesibilidad; no incluye nuevas funciones clínicas.

## Entregas integradas

| Fase | Resultado |
|---|---|
| A — Protección | Pruebas Playwright desktop/móvil, capturas de referencia en artefacto GitHub Actions, impresiones protegidas |
| B — Sistema visual | Tokens canónicos, componentes compartidos con opt-in, foco teclado, tipografía, estados sin cambio semántico |
| C — Portal | Siete tarjetas y acceso externo diferenciado, navegación, indicador de carga basado en iframe, barra de acciones sin cambio de rutas |
| D — Módulos clínicos | Comunicaciones, CMF y Endodoncia: legibilidad, foco contextual, edición y marco de vista previa |
| E — Especialidades | Insumos, Ortodoncia, Odontopediatría y Armonización: tablas, filtros, legibilidad móvil, paneles sin alterar motores anatómicos |
| F — Estabilidad | `prefers-reduced-motion`, tamaños táctiles y control de CSS PWA offline UI11, eliminación de un puente de estilos obsoleto |

## Componentes desplegados

- `health-os-design-tokens-v2.css`: fuente canónica de diseño.
- `health-os-ui-components-v2.css`: interacción y foco uniforme.
- `portal-ux-v2.css`: experiencia del portal, indicador de carga.
- `health-os-ux-modules-v2.css`: adaptador por especialidad para los siete módulos.
- `orion-ux-v2` en cada contexto de render.
- `VERSION.json`: `ux_version: 2.0.2`.
- `service-worker.js`: `health-os-ui11-ux-v2-modules`.

## Garantías

1. No se modificaron **algoritmos clínicos**, fármacos, dosis, diagnósticos, mensajes, estados, pacientes, cálculos, permisos de Drive, acceso al servidor ni catálogo maestro.
2. **No se alteraron** páginas imprimibles `.page`, `#print*`, firma, folios ni tamaños Statement. Las capas UX se aplican exclusivamente a pantalla.
3. **No se modificó** geometría del atlas, marcadores, posiciones anatómicas ni motores de Armonización.
4. Sin indicación falsa de guardado: la barra informa **solo de la apertura del iframe**.
5. `prefers-reduced-motion` desactiva animaciones decorativas cuando corresponde.
6. Ningún usuario necesita borrar datos clínicos locales para recibir los nuevos estilos.

## Deuda técnica controlada

La homologación visual está entregada, pero persisten adaptadores heredados con selectores `!important`. La consolidación se hace **de manera gradual** con evidencia de paridad, no eliminando indiscriminadamente reglas cuya dependencia todavía no se conoce. Ya se retiró de la carga del portal `portal-aesthetic-v144r7.css` (su contenido estaba sobreescrito por el puente actual), conservando el archivo fuente como historial.

## QA obligatorio de liberación

- `npm run check:orion` (contrato estático, PWA, siete módulos).
- `npm run test:unit` (regresiones clínicas).
- `npm run test:e2e` (Playwright desktop/móvil).
- Contrato 320/390/768/1024/1366 px, capturas de pantalla y módulo abierto/cambiado.
- Comprobación de CSS compartido en todos los módulos, funcionamiento offline y de vista previa.

**Estado final de implementación:** los cambios se consideran liberados solo tras CI verde y fusión de la PR correspondiente. Esta especificación no implica por sí sola que GitHub Pages esté actualizado en el dispositivo del usuario.
