# ORION Dental App — Homologación visual de los siete módulos · UI4

**Objeto:** completar la integración estética del portal ORION Dental App con ORION Health OS.
**Limitación:** la homologación visual no equivale a migración de backend, Shared Core, historia clínica ni cumplimiento clínico total.

## Fuente canónica

Referencia consultada: `DrJavierEspinaV/ORION-App-Clinica`, rama `agent/v3.12-shared-core`.
Tokens canónicos: `#1F3F5B` (primario), `#17324D` (profundo), `#8C8C8C` (gris corporativo), `#FFFFFF` (superficie), `#F3F3F3` (fondo), `#D9DEE3` (borde) y tipografía Montserrat.

## Estado de las siete áreas

| Etapa | Módulo | CSS | Protección |
| --- | --- | --- | --- |
| 1 | Portal | `assets/shared/portal-health-os-bridge-v1.css` | Siete rutas originales y enlace externo |
| 2 | Comunicaciones | `modules/comunicaciones/health-os-comunicaciones-v1.css` | Plantillas, agenda, conexión y mensajes |
| 3 | Clínico CMF | `modules/cmf/health-os-cmf-v1.css` | Formato Statement, firmas, recetas |
| 4 | Insumos | `modules/insumos/health-os-insumos-v1.css` | Catálogo maestro, operaciones, exportación |
| 4 | Endodoncia | `modules/endodoncia/health-os-endodoncia-v1.css` | Dosis, indicaciones, formato de impresión |
| 4 | Ortodoncia | `assets/shared/health-os-messaging-v1.css` | Datos, filtros, consentimientos, mensajería |
| 4 | Odontopediatría | `assets/shared/health-os-messaging-v1.css` | Seguimiento, indicadores, consentimiento |
| 4 | Armonización Orofacial | `modules/armonizacion/health-os-armonizacion-v1.css` | Atlas, puntos, motores, tratamiento e informes |

Las siete áreas clínicas del portal están cubiertas por cuatro etapas. Ortodoncia y Odontopediatría comparten estilos y muestran el logo ORION oficial agregado en su loader, sin cambio de lógica.

## Regla de no regresión

El CSS nuevo solo se ejecuta bajo `@media screen`.
Los formatos para imprimir, tamaños Statement, firmas, folios, documentos clínicos y corrección de dosis no se modifican.
Para Armonización, quedan explícitamente excluidas posiciones de puntos, atlas, mapas, marcadores y colores clínicos de sus estados.

No se modifica el almacenamiento ni se sincroniza automáticamente ninguna ficha con el desarrollo React Health OS. Las dependencias existentes con Apps Script no se sustituyen en esta etapa.

## Proceso de entrega

1. Verificar loading de CSS por módulo, identidad corporativa e integridad de controles.
2. Ejecutar pruebas estáticas y regresiones existentes, con Playwright en escritorio y móvil.
3. Revisar cualquier fallo y corregir la causa sin deshabilitar verificaciones clínicas.
4. Fusionar `main` únicamente con CI verde.
5. Confirmar presencia de todos los CSS y actualización del service worker `health-os-ui4`.
6. Verificar publicación GitHub Pages por separado. Mantener respaldo de datos locales antes de reinstalar la PWA.

## Trabajo pendiente después de la homologación visual

La convergencia tecnológica requiere migrar a componentes React del `OrionShell`,
autenticación/roles compartidos, contextos longitudinales de pacientes,
servicios clínicos y financieros, catálogos maestros, persistencia y auditoría.
Ese trabajo no puede considerarse concluido solo por igualar los estilos.
