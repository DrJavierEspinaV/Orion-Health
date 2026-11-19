# ORION Comunicaciones — acceso Google sin clave ORION

**Estado:** cliente OAuth implementado en GitHub. Activación pendiente de configuración Google Cloud por titular y prueba real con cuenta autorizada.

## Objetivo

Leer la pestaña `DB` del libro ORION_DB_SAP mediante la API oficial de Google Sheets y la identidad Google autorizada, sin escribir la clave heredada del Apps Script. La aplicación sigue siendo estática en GitHub Pages. **No** se elimina la protección del Web App Apps Script existente ni se altera la importación SAP por Apps Script.

## Arquitectura

1. SAP se exporta a Excel y se deposita en la carpeta SAP de Drive.
2. El Apps Script existente procesa el Excel y actualiza la hoja ORION_DB_SAP.
3. ORION Comunicaciones obtiene, mediante Google Identity Services, un token OAuth de corta duración y permiso `spreadsheets.readonly` solicitado al usuario.
4. Google Sheets API autoriza la lectura según permisos reales sobre el libro y entrega valores de `DB` por HTTPS, mediante el encabezado Authorization.
5. ORION convierte esas filas con su preparador clínico existente y muestra fecha/cantidad de la última lectura. **No** se presenta como sincronización SAP en tiempo real.

## Configuración obligatoria antes del primer uso

La conexión no se activa por colocar código en GitHub. El titular debe:

1. Crear o seleccionar un proyecto en Google Cloud bajo su cuenta autorizada.
2. Habilitar **Google Sheets API**.
3. Configurar la pantalla de consentimiento OAuth y autorizar su cuenta (si el proyecto está en modo pruebas).
4. Crear un **ID de cliente OAuth tipo Aplicación web**, con origen JavaScript autorizado exacto `https://drjavierespinav.github.io` (y otros orígenes solo si realmente se usan).
5. Abrir ORION Comunicaciones → **Acceso con cuenta Google** → Configuración e ingresar solamente el Client ID público y el ID del libro de Google Sheets. No ingresar una contraseña, un token ni un client secret.
6. Pulsar **Acceder con Google**, aprobar lectura y verificar registros. En posteriores sesiones puede ser necesario volver a elegir la cuenta por política de Google/navegador; nunca se solicita clave ORION.

El ID del libro se obtiene de la URL de ORION_DB_SAP o de la consola de Sheets. Permisos de lectura sobre el libro son obligatorios.

## Seguridad

- Token OAuth solo en memoria JavaScript; no se guarda en GitHub, URL, localStorage ni sessionStorage.
- Client ID e ID de hoja (no son credenciales secretas) se guardan en la configuración local del navegador.
- Las filas obtenidas por Google no se guardan en el caché persistente de ORION; se eliminan posibles cachés anteriores al activar esa fuente.
- Peticiones solo al dominio oficial `sheets.googleapis.com` mediante encabezado Bearer; no se usa JSONP con token Google.
- El alcance es lectura: sin permisos de edición de agenda.
- La conexión heredada con token sigue disponible exclusivamente como alternativa manual avanzada, sin sustituir sus controles servidor.

## Verificaciones antes de considerar implantado

- Leer con cuenta autorizada y comprobar cantidad, fechas, búsqueda y pacientes.
- Probar cuenta Google sin permisos y confirmar acceso denegado.
- Confirmar que no se expone ningún secreto ni token en URLs ni almacenamiento.
- Probar renovación de sesión y visualización en Android/Chrome y escritorio.
- Comprobar que importar SAP por Apps Script y el botón WhatsApp funcionan igual.
- Verificar que ninguna fuente se declara actualizada sin respuesta correcta de Google.

## Límites pendientes

No se ha cambiado ni desplegado el Web App Apps Script heredado; la nueva vía lee directamente la hoja usando la autorización de Google. La configuración OAuth del proyecto Google Cloud no se puede completar desde un commit de GitHub. La prueba real en el navegador del usuario sigue pendiente.
