# ORION Dental App® · Comunicaciones Clínicas V5.7.18

**Identificador:** ORH-COM-UX-010-V1.0  
**Fecha:** 20-10-2026  
**Objetivo:** ordenar visualmente el panel de comunicaciones manteniendo las funciones clínicas y el patrón corporativo ORION.

## Matriz visual obligatoria

La interfaz del módulo Comunicaciones pertenece a **ORION Dental App®** y utiliza los tokens compartidos de **ORION Health OS V2**: azul institucional `#1F3F5B`, fondo claro, superficies blancas, bordes grises, tipografía Montserrat y controles accesibles. No se introduce un sistema de diseño independiente.

### Orden operativo del panel de comunicaciones

1. **Tipo de comunicación** y **Mensaje base editable** permanecen disponibles sin desplegar controles secundarios.
2. **Encuesta clínica opcional** permanece en un desplegable cerrado por defecto; los elementos originales de encuesta, selección, modo, texto y botón de inserción se conservan sin recrear sus listeners. El encabezado indica cuando la encuesta está marcada.
3. **Adjuntos y enlaces** permanece en otro desplegable; se conservan la lista pública normalizada, la validación y la previsualización de recursos sin modificar sus destinos.
4. **Copiar mensaje** y **Actualizar lista** conservan sus eventos.
5. El módulo **WhatsApp manual** aparece solo cuando la plantilla original lo permita; la URL completa ya no ocupa espacio permanente. «Ver enlace generado» la revela cuando el operador la necesita. Si falla la copia automática, se abre la vista de respaldo. La URL se inserta como texto literal, no HTML interpretado.

### Continuidad clínica

- Importación de agenda SAP desde Excel **manual**. No se conecta ni sincroniza SAP automáticamente.
- UDC visible junto al nombre del paciente.
- «Acciones» del paciente reservado a retrasos de llegada/atención y ETA.
- WhatsApp compacto; no se declara enviado por haber abierto el enlace.
- El historial temporal, los filtros, el consentimiento y los estados se conservan.

## Interoperabilidad futura: ORION Health Clinical SO

**Conexión planificada, no implementada ni desplegada.**

Comunicaciones deberá seguir desacoplada de la fuente de citas y del motor clínico. La integración futura utilizará un adaptador autorizado que traduzca los datos interoperables: identificador estable del paciente, identificador de cita, origen SAP/Dentalink/Clinical SO, fecha/hora, profesional, centro, estados permitidos y versión del esquema. Las comunicaciones y eventos utilizarán identificadores y referencias, no copias innecesarias del contenido clínico.

Antes de conectar será necesario definir consentimiento, permisos por rol, auditoría, retención, revisión de conflictos y autenticación institucional. No compartir información sensible ni habilitar escrituras bidireccionales sin pruebas y aprobación expresa. **Esta fase solo modifica presentación; no introduce API ni nuevo almacenamiento.**

## Pruebas de aceptación

Pruebas Playwright en 1440 y 390 px para sección de mensajes, encuesta plegada y funcional, enlaces y adjuntos a demanda, WhatsApp manual conservado y vista previa con texto seguro. Regresiones de agenda, SAP, UDC, consentimiento y PWA obligatorias antes de fusionar.

**Estado de despliegue:** la incorporación al repositorio principal no equivale a publicación comprobada en el dispositivo final.
