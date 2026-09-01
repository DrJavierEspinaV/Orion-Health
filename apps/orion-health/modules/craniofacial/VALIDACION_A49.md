# Validación técnica A49

Estado: borrador; no desplegado.

- Verde: aceptado.
- Ámbar: estimado o aceptado con observación.
- Rojo: coordenada fijada sin aceptación; disponible sólo para cálculo exploratorio y sensibilidad.
- Gris: punto sin marcar.
- La exclusión sigue siendo un estado separado y suspende las medidas que dependen de la referencia.
- El recorrido principal confirma el estado seleccionado y avanza al siguiente landmark.
- Guardar estudio admite estados incompletos y rojos; imprimir y exportar un análisis clínico final exige que todos los puntos estén aceptados.
- Estudios A48 mantienen sus valores `INCLUDE`, `INCLUDE_ESTIMATED` y `EXCLUDE` al importarse.
- Las funciones geométricas, métricas, F1, diagnóstico y sensibilidad comparadas son idénticas byte por byte a A48.

Las pruebas automatizadas no constituyen validación clínica. La prueba real en navegador y la revisión clínica siguen pendientes.
