# ORION Comunicaciones V5.7.12 — Restitución de lista compacta

**Fecha:** 2026-10-19 · **Cambio solicitado:** corregir visualización de pacientes, reducir WhatsApp y evitar ingresar la clave en cada sesión.

## Alcance visual

- Se conserva la matriz visual corporativa ORION y las funcionalidades originales de lista, citas, retrasos, UDC, mensajería, seguimiento y exportación.
- El botón WhatsApp en cada paciente vuelve a un ancho reducido (máximo 120 px), altura cercana a 28 px, sin expansión al 100% en móvil.
- Se eliminan de la vista permanente tres botones grandes por paciente. La bitácora se opera mediante un discreto menú `⋯` cerrado por defecto; se despliega solo cuando el profesional lo solicita.
- El estado de seguimiento ocupa una etiqueta muy breve y accesible. El detalle completo permanece disponible en el título y el lector de pantalla.
- Se reduce el padding y la altura de tarjetas. En móvil, RUN, fecha, hora, estado y motivo se distribuyen en dos franjas debajo de la identificación, sin ocultar campos.
- No se modifica el origen de datos, el contenido del mensaje ni la confirmación manual de envío.

## Conexión sin introducir la clave repetidamente

- Si existe token autorizado en `sessionStorage`, ORION lo reutiliza y carga Drive automáticamente, como antes.
- Si no existe sesión, el módulo intenta recuperar **silenciosamente** una credencial de ORION que el usuario hubiese guardado de forma voluntaria en el gestor seguro de contraseñas del navegador mediante la API Credential Management.
- El único paso inicial en dispositivo compatible es ingresar la clave válida y marcar **«Recordar acceso con el gestor seguro del navegador»**. La credencial se solicita guardar **solo después** de una respuesta confirmada `✅ BD cargada: N filas` del servidor.
- Si el navegador no implementa esta API, no hay credencial almacenada o el usuario rechaza el guardado, no hay acceso a Drive sin autenticarse. El módulo permanece utilizable y no abre el cuadro de clave de forma automática.
- `Cerrar acceso` borra la sesión y pide al navegador impedir la reutilización silenciosa. El borrado definitivo de una credencial guardada depende del gestor de contraseñas del navegador.
- No se coloca token en el código ni en localStorage; no se anula ningún control del Apps Script.

## Límites reales

Esto **no es SSO Google implementado** ni elimina la autorización de servidor. El comportamiento depende del soporte de Credential Management en el navegador y sus políticas de seguridad. Para un inicio de sesión universal sin contraseña manual será necesaria una identidad de Google OAuth y un backend que acepte tokens verificados.

## QA

Contrato estático, pruebas unitarias y Playwright escritorio / móvil. Comparar tamaño real del WhatsApp, menú plegado, ausencia de desbordamiento horizontal y mantenimiento de acciones y CSV antes de fusionar.
