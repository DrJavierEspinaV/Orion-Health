# ORION Dental App® · Rediseño de la pantalla Comunicaciones V5.7.19

**Identificador:** ORH-COM-UX-011-V1.0 · **Fecha:** 20-10-2026

## Corrección requerida

Las versiones anteriores incorporaron estilos y pequeños controles, pero no ofrecieron un cambio suficientemente claro de distribución. Esta actualización define **un único criterio visual de composición** sobre el CSS final del módulo, sin añadir widgets ni secciones clínicas.

### Escritorio (ventana desde 1260 px)

- Pantalla en dos columnas: **40 % editor / 60 % agenda**, con separación uniforme de 18–26 px.
- El editor mantiene tipo de comunicación, mensaje base, encuesta opcional, adjuntos plegables y WhatsApp manual.
- La agenda tiene prioridad espacial; conserva importación manual SAP, búsqueda, estado, fechas, UDC, retrasos, WhatsApp, bitácora y lista clínica.
- Encabezados de ambas zonas con la misma tipografía, barras azules discretas y jerarquías ORION Health OS V2.
- Lista de pacientes con espaciados de lectura regulares y botón WhatsApp limitado a 112 px.

### Pantallas estrechas (menos de 1260 px)

- Disposición de una columna: **Agenda primero, editor después**, fuente avanzada al final.
- No se ocultan UDC ni las columnas/datos clínicos. La tarjeta del paciente preserva el patrón móvil vigente.
- La carga SAP manual permanece en el inicio de la agenda. Ningún intento de sincronización automática.

### Límites técnicos

- No se altera DOM clínico, caché de pacientes, datos de SAP, origen de agenda, registro de comunicaciones, autenticación, plantillas ni eventos de UDC/WhatsApp.
- Se actualiza únicamente `panel-ux-v1.css` como última hoja del módulo, la referencia `?v=1.1`, VERSION.json y la caché PWA.
- No se implementa ahora ORION Health Clinical SO. La interoperabilidad futura sigue prevista, desacoplada del editor.

### Criterios de aceptación

- Pruebas Playwright de geometría de paneles en 1600, 1440, 1100 y 390 px.
- Agenda 56–65 % del ancho útil cuando hay dos columnas; bajo 1260 px agenda situada antes del editor.
- UDC visible; «Acciones» permanece reservado a retrasos/ETA; botón WhatsApp nunca se expande al ancho de la fila.
- Importador SAP visible y seguro, sin solicitar contraseña ni sincronizar automáticamente.
- Aprobación funcional CI completa antes de fusionar.

**Verificación pendiente:** comprobar visualmente la versión publicada en el navegador del operador. Una PR fusionada no confirma por sí sola que el dispositivo haya actualizado su service worker.
