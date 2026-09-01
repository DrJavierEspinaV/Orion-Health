# Avance 48 — seguimiento de cambios sin guardar

## Hallazgo reproducido

Tras guardar un estudio, colocar o arrastrar un landmark, colocar un marcador de calibración o recalcular la escala podía modificar el estudio sin activar su indicador de cambios pendientes. El aviso de salida dependía de ese indicador; por ello era posible salir sin advertencia y perder la última edición no guardada.

El control se ejecutaba en un listener tardío de `pointerdown`: al llegar a él, el modo de colocación o calibración ya había sido desactivado. El arrastre comenzaba con propagación detenida, y el cálculo de calibración no pasaba por ese listener.

## Corrección acotada

Se registra la modificación justo donde se escriben las coordenadas o la calibración, antes de redibujar. Se elimina el listener tardío. Se conserva el sistema de revisiones de A47, que evita considerar guardadas las ediciones hechas mientras termina una exportación.

No se cambian fórmulas, tablas de corrección, construcción de F1 ni estilos del visor. Tampoco se añade guardado automático: el operador debe guardar o exportar su estudio.

## Pruebas

- Auditoría de A47: cuatro fallos reproducidos y dos controles correctos.
- A48: seis pruebas de interacción aprobadas, incluidas las cuatro regresiones. Se comprueba también que desplazar la imagen no simula una edición clínica y seleccionar un punto congelado no altera sus coordenadas.
- 17 pruebas de ciclo de estudio aprobadas: carga, recorrido de los 28 puntos, aceptación, guardado/exportación parcial, reapertura y rechazo transaccional de entradas inválidas.
- 7 pruebas del portal aprobadas: rutas y guardas de navegación.
- Nueve scripts inline con sintaxis comprobada; estilos y funciones geométricas comparados con A47 sin cambios.

Total: 30 comprobaciones focalizadas aprobadas. Son pruebas de Node con eventos y DOM simulados, no pruebas E2E en navegador ni validación clínica. Los tests de interacción usan únicamente coordenadas sintéticas. No se publican radiografías, datos de pacientes ni fixtures clínicos privados.

Para repetir las seis regresiones desde esta carpeta:

```sh
node verify-interaction.cjs index.html
```

## Pendiente antes de publicar

En navegador de escritorio y móvil: abrir una imagen de prueba desidentificada, colocar puntos, guardar, mover un punto, intentar salir y confirmar que aparece el aviso; cancelar la salida, guardar nuevamente y reabrir para comprobar la edición. Repetir con calibración y exportación JSON.

La integración continúa en la PR #19 en borrador. No se fusiona ni despliega con este avance. Las limitaciones metodológicas y de cálculo incompleto documentadas en A47 se conservan.
