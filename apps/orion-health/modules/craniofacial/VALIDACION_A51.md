# Validación A51 — F1 asistida y semáforo visible

- Alcance: selección asistida de F1, requisito de demografía completa y presentación del estado clínico.
- La regla operativa ya codificada (≤12: 85°; después F: 85° / M: 90°) no cambia.
- Estudios nuevos: modo `AUTO`.
- Estudios importados: se conserva exactamente `f1_mode`, incluido el valor vacío heredado.
- F1 automática exige edad y sexo; los modos manuales 85°/90° no los exigen.
- El visor distingue base, correctivo y F1 final.
- El semáforo se muestra fuera del SVG y no agrega rótulos a la radiografía.
- Los landmarks fijados sin aceptación permanecen rojos y bloquean el cierre clínico.
- Las fórmulas geométricas y cefalométricas de A50 permanecen byte a byte.
