ORDENAUTAS — PILOTO FAMILIAR V1.1
===================================

Contenido
---------
- index.html: prototipo funcional.
- manifest.webmanifest: configuración de instalación PWA.
- service-worker.js: funcionamiento básico sin conexión.
- icons/: iconos provisionales de la aplicación.
- PLAN_PILOTO_30_DIAS.md: protocolo para probar la app en casa.

PIN inicial de la Central de mando: 2026

Cómo probar en computador
-------------------------
1. Abre una terminal dentro de esta carpeta.
2. Ejecuta: python -m http.server 8080
3. Abre en Chrome: http://localhost:8080

Cómo instalar en Android
------------------------
La instalación PWA exige abrir la aplicación desde HTTPS o desde localhost.
La forma más simple será subir esta carpeta a GitHub Pages. Luego:
1. Abre la dirección en Chrome para Android.
2. Pulsa “Instalar” dentro de Ordenautas o usa el menú de Chrome.
3. La app aparecerá como un icono independiente.

Importante
----------
Los datos del piloto quedan guardados localmente en el navegador del dispositivo.
Usa “Exportar respaldo” desde la Central de mando al menos una vez por semana.
