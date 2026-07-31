# ORION Dental App V1.4.4-r4

## Ajustes CMF documentales

- La botonera **Imprimir / PDF Statement / WhatsApp / Copiar Texto** queda en flujo normal en móvil y con una capa inferior a los paneles clínicos.
- Los drawers de **Interconsulta** y **Exámenes** se abren siempre desde su parte superior.
- Al generar una interconsulta, la navegación vuelve al inicio del documento correspondiente.
- **PDF Statement** usa directamente `html2pdf` en formato 5,5 × 8,5 pulgadas, manteniendo la autorización clínica, el folio y el registro de salida.
- Si el motor PDF externo no está disponible, se conserva el respaldo mediante impresión del navegador.

## Alcance protegido

No se modifican plantillas clínicas, dosis, contenido documental, firma, auditoría, NPS ni estructura de impresión.
