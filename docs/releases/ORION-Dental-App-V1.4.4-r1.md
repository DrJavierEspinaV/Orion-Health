# ORION Dental App V1.4.4-r1

## Motivo del hotfix

La caché PWA V1.4.4 incluía tres rutas de recursos que no existían. Al fallar `cache.addAll`, Android conservaba la versión anterior, por lo que seguían apareciendo controles laterales cortados y no se activaban las correcciones móviles de CMF.

## Correcciones

- Elimina las tres referencias inexistentes del service worker.
- Fuerza una caché nueva `orion-dental-app-v1.4.4-r1`.
- Mantiene Tipo de Receta y los modos dentro del ancho útil del teléfono.
- Conserva scroll táctil desde el centro del catálogo de Exámenes.
- Mantiene Orden Laboratorio y Orden Imágenes bajo la búsqueda.
- Prepara la firma como PNG desde la carga, conservando la referencia SVG institucional.
- No modifica recetas, indicaciones, dosis, NPS, confirmación profesional, auditoría ni formato Statement.
