# ORION Craniofacial Analysis — Avance 52

Evolución clínica sobre el diseño aprobado: incorpora semáforo explícito, un único control de estado + siguiente y un escenario rojo fijado sin aceptación para análisis de sensibilidad. Conserva geometría, fórmulas y compatibilidad con estudios A48. Integración aún en borrador, sin publicación.

Inicio limpio y propuesta de integración al portal ORION Health. Fecha: 31 de agosto de 2026.

Estado: prototipo en validación, preparado para una rama y PR en borrador. No representa una publicación ni una validación clínica. La base visual es Avance 46; no se rediseña el visor aprobado.

## Alcance

- Octavo módulo del selector del portal, sin cambiar las siete rutas existentes.
- `index.html` es autocontenido y también puede abrirse por separado. `?embed=1` elimina la cabecera duplicada únicamente cuando está dentro del iframe del portal.
- Inicio sin imagen, paciente, calibración ni coordenadas precargadas. Los 28 landmarks comienzan sin marcar; no se generan posiciones estimadas automáticamente.
- Carga de PNG, JPEG o WebP y apertura de estudios portátiles ORION que contengan su propia imagen.
- Recorrido Aceptar + siguiente, con selección libre de puntos. Un punto sin coordenadas no puede aceptarse.
- Guardado local y exportación JSON, incluso para estudios incompletos. Al abrir un JSON, se valida y decodifica la imagen antes de sustituir el estudio activo.
- Aviso antes de abandonar un estudio con cambios sin guardar. Los cambios realizados mientras termina un guardado siguen pendientes de guardar.
- El paciente activo del portal se ofrece para asociación explícita, mediante mensajes de la ventana y origen esperados. No se copia automáticamente. Se debe confirmar la edad correspondiente al estudio; el sexo no se importa.

## Geometría y límites

Las fórmulas y tablas correctivas de A46 se conservan. Se añaden comprobaciones de disponibilidad y geometría degenerada. La prueba con el estudio de compatibilidad completo no detectó cambios en las salidas del motor.

Esta primera versión limpia suspende el análisis hasta colocar los 28 puntos, sin referencias excluidas y con geometría no degenerada. No es todavía un cálculo progresivo por dependencias de cada línea. La aceptación, calibración y selección de F1 siguen siendo decisiones separadas; disponer de cálculos no implica validación clínica.

F1 mantiene la construcción teórica corregida existente en A46, anclada en FM, y la distinción respecto de las líneas faciales reales. No se modifica aquí su definición clínica. Persisten los pendientes metodológicos anteriores.

No hay lector DICOM. Los estudios JSON sin imagen, los snapshots de análisis y los formatos desconocidos se rechazan; nunca deben reutilizar silenciosamente la radiografía abierta.

## Datos y respaldo

El código publicado no contiene la radiografía ni las coordenadas del caso utilizado para pruebas privadas. Los logos de la interfaz se conservan.

Guardar utiliza IndexedDB en este navegador y origen. Exportar estudio JSON incluye la imagen y los datos del estudio: es el archivo para continuar en otro equipo y debe custodiarse como información clínica. Cambiar de archivo local a la app web no traslada la base local automáticamente: exporte e importe el estudio JSON.

No se envían estudios a GitHub o Drive ni se incorpora sincronización clínica automática. Un repositorio público y GitHub Pages no son un sistema de almacenamiento clínico privado ni un mecanismo de autenticación de pacientes. No deben añadirse imágenes clínicas, JSON de estudios o datos identificables al repositorio.

## Verificación realizada

- Once scripts inline: comprobación de sintaxis con Node.
- 17 pruebas de ciclo de estudio en Node, con decodificación real de PNG mediante sharp: inicio vacío, carga, secuencia completa, persistencia parcial, importaciones inválidas sin pérdida del estudio, cancelación, cambios durante exportación y compatibilidad geométrica.
- 20 pruebas específicas A52 del modelo de estados, acción única, persistencia, bloqueo de salida final y regresión byte a byte de fórmulas.
- 7 pruebas del portal con dobles DOM: rutas anteriores, altura del módulo y protección de navegación/mensajes.
- 6 pruebas de interacción de coordenadas y cambios sin guardar.
- Inspección estática de privacidad: sin imagen, identificador ni coordenadas del caso anterior.

El archivo `verification49.json` reúne los resultados. No se publican los fixtures clínicos usados en la prueba privada de compatibilidad.

La aprobación visual del usuario corresponde al editor A47/A48. A52 conserva sus estilos y añade sólo señales clínicas discretas. No se ejecutó validación clínica ni una revisión A52 integrada en navegador. No fusionar ni publicar antes de completar esa revisión.

## Revisión antes de publicar

1. Abrir el módulo en escritorio y móvil: comprobar inicio vacío, visor amplio y controles accesibles sin superposición.
2. Cargar una imagen de prueba desidentificada. Colocar varios puntos, aceptar y avanzar, volver a otro punto y corregirlo.
3. Completar la ficha después de cargar la imagen. Guardar un estudio incompleto y volver a abrirlo; confirmar identidad, coordenadas, escala y vista.
4. Exportar JSON, abrirlo en otro contexto y comprobar continuidad. Cancelar un reemplazo y una navegación con cambios pendientes.
5. Completar y revisar los 28 puntos. Comprobar F1, ángulos, capas e impresión con una referencia clínica validada.
6. Dentro del portal: confirmar asociación explícita del paciente, vuelta al selector y funcionamiento de los siete módulos anteriores. Probar también actualización de caché.
7. Obtener autorización para fusionar la PR y desplegar. El flujo de Pages existente publica desde `main`; la rama de revisión no se activa en la app por sí sola.

## Ajuste A52 — transición visual

Al completar la coordenada 28, la primera vista calculada conserva sólo la arquitectura craneal y sagital principal, F1 y los puntos. Las medidas, referencias derivadas, capas dentales y nombres masivos permanecen disponibles mediante los controles de capas y el preset **Todo**. Un estudio importado conserva exactamente sus capas guardadas.

## Ajuste A52 — F1 asistida y semáforo visible

Los estudios nuevos parten en F1 automática y requieren edad y sexo completos antes de activarla. Las bases manuales 85°/90° permanecen disponibles. La regla operativa no cambia y su corte cronológico sigue marcado como pendiente de validación. Un semáforo compacto, fuera de la radiografía, resume aceptados exactos, estimados/observados, fijados sin aceptar, pendientes y excluidos.


## Ajuste A52 - trazado sutil, C3/C2 continuo y JSON seguro

- Los radios visibles de landmarks se reducen sin alterar coordenadas ni áreas de interacción.
- Los trazos principales conservan jerarquía cromática con 62% de su grosor anterior.
- C3/C2 conserva su medida decimal y aplica la regla documentada de 0,25° por cada 2% fuera de 81% ±2%.
- El JSON se serializa y verifica en memoria antes de guardarse. En Android se prioriza el compartido nativo de archivo; la importación verifica bytes y distingue un estudio portátil de un informe de análisis.
