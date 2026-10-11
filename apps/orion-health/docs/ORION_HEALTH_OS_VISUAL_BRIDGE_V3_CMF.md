# ORION Dental App → ORION Health OS · Etapa 3 (Clínico CMF)

**Objeto:** homologación estética del espacio de trabajo de **ORION Clínico CMF / Maxilofacial PRO+**.
**Alcance aprobado:** estilos exclusivamente en pantalla. Sin cambio funcional ni de contenido clínico.

## Sistema de diseño canónico

Fuente consultada: `DrJavierEspinaV/ORION-App-Clinica`, referencia `agent/v3.12-shared-core`,
`ORION DENTAL APP/src/index.css`, `tailwind.config.js` y `OrionShell.jsx`.

| Componente | Regla |
| --- | --- |
| Azul ORION | `#1F3F5B` |
| Azul profundo | `#17324D` |
| Fondo app | `#F3F3F3` |
| Paneles | `#FFFFFF` |
| Líneas | `#D9DEE3` |
| Fuente UI | Montserrat |
| Tarjetas UI | 16 px de radio, sombra muy suave |
| Formularios | Bordes 10 px, foco visible, tipografía funcional |

## Elementos homologados

1. Header operativo, manteniendo el logo oficial `maxilofacial-pro-plus.svg`.
2. Espacio de trabajo, tarjetas, etiquetas, formulario de paciente y selectores clínicos.
3. Pestañas de edición y vista previa, con estado activo contrastado.
4. Acciones documentales y acceso a certificado, biopsia, exámenes e interconsulta.
5. Drawers de exámenes/interconsulta sin alterar ubicación ni eventos.
6. Cabecera del marco de vista previa, sin tocar las páginas del documento.
7. Adaptación a pantalla estrecha en dos pestañas, con formularios y botones legibles.

## Protección documental — regla no negociable

La hoja `health-os-cmf-v1.css` utiliza exclusivamente reglas `@media screen`.
No debe alterar ningún selector de documentos: `.page`, `#printSheet`, `#printSheet2`,
`#printDoc`, `#printExamLab`, `#printExamImg`, `#printInter`, firmas
o `[id^=fixedFoot]`.

Se preservan la impresión Statement 5,5 × 8,5 pulgadas, márgenes, firmas, logos,
folios, códigos, auditoría y contenido del motor de prescripción. No se modifica
`source.html` ni las dependencias de dosis, indicaciones, documentos y exportación.

## Arquitectura y despliegue

- `modules/cmf/loader.js` carga la hoja visual **después** de estilos móviles existentes.
- `service-worker.js` cambia caché a `health-os-ui3` y precarga el CSS nuevo.
- No se reescriben los archivos de Comunicaciones ni su estética homologada en etapa 2.
- Tests: validación de componentes en escritorio, móvil, aislamiento con Comunicaciones y prueba de impresión.

## Próximo incremento recomendado

Una vez aprobada la etapa visual CMF, consolidar componentes CSS/React canónicos
de Health OS (formularios, botones, navegación y tarjetas) para evitar una tercera
familia de reglas visuales independientes. Migrar las funciones a Shared Core solo
tras especificar contexto de paciente, permisos, persistencia, trazabilidad y
pruebas de regresión clínica.
