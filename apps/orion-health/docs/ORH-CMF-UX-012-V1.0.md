# ORION Dental App® — Rediseño estético y funcional ORION Clínico CMF

**Control:** ORH-CMF-UX-012-V1.0 · **Versión del módulo:** 4.3.44 · **Fecha:** 20-10-2026  
**Clasificación:** Prototipo operativo de interfaz; sin modificación del motor clínico.

## Interpretación del boceto aportado

El diseño tiene tres zonas claramente separadas, con prioridad de lectura 1 → 2 → 3:

| Zona | Función | Distribución escritorio | Móvil |
|---|---|---|---|
| 1. Datos del paciente | Nombre, RUN, edad, peso | Horizontal y ancho completo | Una columna / campos adaptativos |
| 2. Tipo de receta/documento | Documentos, fecha, reposo, plantillas adultas/pediátricas, diagnóstico, fármacos | Mitad izquierda | Segunda sección |
| 3. Receta e indicaciones | Editor de receta, selección PRE/POST, diagnóstico alternativo, editor de indicaciones | Mitad derecha | Tercera sección |

**Identidad gráfica:** archivo oficial `assets/brand/maxilofacial-pro-plus.svg`, proporcionado por el usuario. Se presenta más grande en la esquina superior izquierda del encabezado. Una segunda proyección semitransparente se extiende desde la misma esquina tras el formulario de edición. Ni el formulario, ni sus datos, ni los botones quedan interceptados por la marca de agua.

## Qué se modificó exactamente

1. `modules/cmf/source.html`: se asignaron identificadores a las tarjetas existentes y se separó la parte de edición a su propia tarjeta, manteniendo los mismos campos, IDs y acciones.
2. `modules/cmf/cmf-workflow-123-v1.css`: estilos exclusivos de pantalla con colores, tipografía y superficies ORION Health OS V2; composición a dos columnas desde 1081 px y vertical en pantallas más estrechas.
3. `modules/cmf/loader.js`: incorpora nueva capa CSS y versión 4.3.44. No altera las sustituciones de firma, imágenes de documentos, receta ni contenidos clínicos.
4. `VERSION.json`, `service-worker.js`, pruebas de regresión y documentación: versionado coherente y renovación de caché PWA.

## Limitaciones y protecciones

- La marca de agua **es solo decorativa en pantalla**: no se superpone en las hojas imprimibles ni modifica PDF, firma, folio, pie, márgenes o formato Statement 5,5 × 8,5 pulgadas.
- Sin cambio de fármacos, dosis, diagnósticos, indicaciones, plantillas, algoritmos, validaciones clínicas, interconsultas ni autenticación.
- No se generan documentos clínicos con datos reales durante las pruebas; el preview utiliza pacientes ficticios.
- La interoperabilidad futura con ORION Health Clinical SO sigue planificada por separado. No forma parte del presente rediseño.

## Criterios de aceptación

- La marca oficial se reconoce en el extremo superior izquierdo y como fondo tenue.
- En escritorio: 1 ocupa el ancho completo; 2 y 3 están a la misma altura en dos columnas.
- En móvil: 1, 2 y 3 aparecen sucesivamente sin desbordamiento horizontal.
- Los campos `p_nombre`, `p_rut`, `p_edad`, `p_peso`, `tplAdulto`, `tplPedia`, `receta`, `indicaciones` funcionan con los mismos identificadores.
- La vista previa y las seis hojas documentales permanecen separadas de los estilos de edición.
- Pruebas estáticas, unitarias, funcionales y móviles aprobadas antes de fusionar.

**La aprobación en GitHub no reemplaza la revisión visual final en el monitor del profesional.**
