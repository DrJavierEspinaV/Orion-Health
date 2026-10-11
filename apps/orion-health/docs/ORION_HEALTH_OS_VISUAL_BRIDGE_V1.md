# ORION Dental App — Puente visual hacia ORION Health OS · Etapa 1

**Estado:** propuesta de homologación visual del portal, no fusión tecnológica ni certificación clínica.

## Referencia maestra

- Plataforma destino: `DrJavierEspinaV/ORION-App-Clinica`.
- Rama de referencia inspeccionada: `agent/v3.12-shared-core`.
- Identidad: `src/data/brandRegistry.js`, `src/index.css`, `tailwind.config.js`.
- Shell de navegación: `src/components/dashboard/OrionShell.jsx`.

| Token común | Valor |
| --- | --- |
| Azul corporativo | `#1F3F5B` |
| Azul profundo | `#17324D` |
| Gris de marca | `#8C8C8C` |
| Superficie | `#FFFFFF` |
| Fondo | `#F3F3F3` |
| Tipografía | Montserrat |

## Cambio en la etapa 1

1. Modernizar sólo el selector de entrada a Dental App siguiendo la superficie, tipografía y tarjetas del sistema principal.
2. Presentar ocho accesos en cuatro columnas por dos filas a ancho de escritorio: **siete módulos internos**, más **un enlace externo provisional**.
3. Poner el acceso a Apps Script junto a Comunicaciones para señalar su relación funcional. No convertirlo en una nueva especialidad ni en una ruta interna.
4. Conservar la marca gráfica oficial de ORION Health, los nombres y rutas actuales, el paciente activo de sesión y la navegación hacia cada módulo.
5. Mantener la hoja del puente encapsulada en `body.orion-portal.route-selector-mode`: no afecta las pantallas de módulos ni el trabajo documental.
6. Evitar que un enlace externo se registre como botón de carga de iframe.

## Reglas para próximas etapas

- La plataforma objetivo es **un solo ORION Health OS con núcleo compartido**, no dos productos que deban sostener un diseño divergente.
- El CSS de esta etapa es transitorio. Las pantallas operativas deben migrar a componentes, permisos y navegación canónicos de Health OS.
- La herramienta Google Apps Script continúa externa hasta disponer de una especificación funcional verificada para su sustitución nativa.
- No transferir información de pacientes hacia enlaces externos ni asumir intercambio clínico entre el portal legado y el nuevo OS.
- Antes de liberar una migración clínica: verificar sesión, roles, integración de paciente longitudinal, persistencia, registros, trazabilidad y catálogo maestro.

## Lista de aceptación visual y funcional

- Desktop amplio: cuatro columnas, dos filas, sin tarjeta huérfana.
- Pantalla intermedia: dos columnas.
- Móvil: una columna desplazable, sin recorte por altura fija.
- Los siete módulos originales mantienen `data-app` y sus rutas.
- El enlace externo abre en otra pestaña con `noopener noreferrer`.
- Los estilos no modifican el área interna de atención cuando el módulo está seleccionado.
- Pruebas de interfaz y PWA pendientes en navegador real antes de la fusión.

**Nota:** este documento no afirma que el despliegue público haya sido actualizado.
