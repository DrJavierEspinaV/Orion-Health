# ORION Comunicaciones · Fuente manual SAP (V5.7.17)

**Documento:** ORH-COM-UX-009-V1.0 · **Fecha:** 20-10-2026

## Regla operativa confirmada

**SAP → exportación manual Excel (.xlsx/.xls) → operador selecciona archivo → ORION importa y presenta agenda → comunicación y seguimiento.**

ORION **no** tiene integración directa con SAP. No obtiene automáticamente nuevas citas, cambios de horarios, teléfonos, estados clínicos ni registros mediante una sincronización de SAP. Cada actualización requiere exportar e importar manualmente el archivo vigente.

### Comportamiento de la app

- El selector «Importar archivo SAP» queda visible en el panel de agenda, antes de la búsqueda.
- Tras importar, se presenta cantidad de registros y hora de carga. Es el momento de carga local, **no** la hora de actualización en SAP.
- La agenda temporal puede restaurarse desde la caché de sesión sin afirmar que represente una exportación nueva.
- La importación reemplaza el conjunto de citas visualizadas, de acuerdo con el procedimiento original; no combina automáticamente distintos archivos.
- Se elimina la llamada a Drive al abrir el módulo y se desactiva la recuperación automática de credenciales para este modo. Una conexión técnica histórica solo puede iniciarse por acción manual desde el panel avanzado.
- Las funcionalidades clínicas se mantienen: UDC, estados, retraso/ETA, plantillas, mensajes, WhatsApp manual, seguimiento local y filtros.
- No se guardan copias del fichero original ni se envía automáticamente su contenido al servidor; la información temporal de procedencia contiene solo clase de fuente, cantidad y hora.
- La implementación existente mantiene datos de agenda en **sessionStorage** durante su vida útil según la política previa. Se recomienda cerrar la sesión al finalizar el trabajo en dispositivos compartidos.

### Limitaciones

No existe una verificación criptográfica del origen o integridad del archivo SAP. La fecha mostrada indica **importación por el operador**, no certifica que SAP esté actualizado. La opción avanzada heredada de Drive no forma parte del circuito operativo manual; no se activa silenciosamente.

## Validación

Pruebas estáticas y de navegador con datos ficticios en escritorio y móvil: importador a la vista, contador y última carga, preservación de caché, sin llamada a Drive ni cuadro de clave al abrir incluso con un token heredado.

Sin cambios en autenticación real del servidor, sus datos o el sistema SAP.