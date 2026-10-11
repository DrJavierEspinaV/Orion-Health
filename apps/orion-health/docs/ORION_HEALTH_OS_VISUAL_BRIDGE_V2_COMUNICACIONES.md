# ORION Dental App → ORION Health OS · Etapa 2 (Comunicaciones)

**Estado:** homologación de presentación mediante CSS de transición; no es una migración del modelo de datos ni del backend.

## Fuente de verdad
- UI canónica: `DrJavierEspinaV/ORION-App-Clinica`, referencia inspeccionada `agent/v3.12-shared-core`.
- Shell canónico: `ORION DENTAL APP/src/components/dashboard/OrionShell.jsx`.
- Paleta / tipografía: `ORION DENTAL APP/tailwind.config.js`, `src/index.css`.
- Portal legado homologado en PR #21: `assets/shared/portal-health-os-bridge-v1.css`.

## Matriz de homologación

| Elemento | Solución temporal en Comunicaciones | Futuro componente Health OS |
| --- | --- | --- |
| Encabezado institucional | Marca oficial compacta, tipografía Montserrat, jerarquía primaria | OrionShell + OrionBrand |
| Superficie | Fondo #F3F3F3, paneles blancos, borde #D9DEE3 | Tarjetas del sistema compartido |
| Tipografía | Montserrat, texto clínico de 11 a 18px sin reducir con zoom global | Escala tipográfica del OS |
| Mensajes | Editor y acciones visibles, mismo orden y comportamiento | Módulo Comunicaciones nativo |
| Pacientes y agenda | Búsqueda y filtros prioritarios, lista responsive, estados sin reinterpretación | Paciente longitudinal + Agenda |
| Paciente activo | Conserva el contrato ORION de contexto documental | Shared Core de pacientes |
| Fuente de datos | Panel plegable, estados reales de conexión visibles | Integración autenticada del backend |
| Responsive | Desktop 44/56, tablet en una columna, móvil con lista convertida en fichas | Layout canónico del OS |

## Integridad funcional

Se preservan `#q`, `#showFilter`, `#export`, `#fFechaFrom`, `#fFechaTo`, `#list`,
`#mensajeTipo`, `#generar`, `#copiarMensaje`, `#documentoStatus`,
`#orionPatientPriorityControls` y `#orionDataSourcePanel`.

La capa es exclusivamente visual, se carga al final de los estilos del módulo mediante `loader.js` y no modifica `source.html`, el catálogo de plantillas, la clasificación de estados, el intercambio de paciente ni la configuración de conectividad. No transmite información a Health OS.

## Criterios de aceptación

1. CSS carga exclusivamente en Comunicaciones; no contamina CMF.
2. Logos oficiales sin deformación, cabecera compacta.
3. Pantalla ancha: mensajes a la izquierda y pacientes/agenda a la derecha con mayor espacio.
4. Pantalla móvil: pacientes primero, mensajes después, fuente plegable al final.
5. Navegación, filtrado, plantillas, sesión, estados y exportación iguales a la versión previa.
6. PWA incluye el CSS y cambia nombre de caché a `health-os-ui2`.
7. Verificación de pruebas estáticas, unitarias y Playwright antes de publicar.

## Próxima etapa

Consolidar estos estilos en una librería de componentes compartidos del Health OS,
migrando primero lógica de navegación/paciente a Shared Core. No copiar datos reales entre sistemas
ni reemplazar persistencia antes de validar autenticación, autorizaciones, trazabilidad y pruebas clínicas.
