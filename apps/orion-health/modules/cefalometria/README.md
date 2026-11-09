# ORION Delaire A76

Especificación operativa 1.0. Software para comprobación manual y digital.

## Abrir

Abra index.html con Chrome, Edge o Firefox. No requiere clave. Mantenga Manual_ORION_Delaire_A76.html en la misma carpeta para el enlace del manual. El código completo está incluido en el HTML.

1. Registre edad, sexo y base F1; revise maduración y Na prima.
2. Cargue y calibre la telerradiografía; marque y valide puntos, incluidos Br y Cp.
3. En Comprobación manual ingrese los valores del papel. No se generan coordenadas a partir de medidas aisladas.
4. Compare manual, digital y diferencia. Elija F1 operativa real o compensada.
5. Guarde un archivo ORION completo con imagen y medidas. Exporte también auditoría JSON o comparación CSV cuando corresponda.

## Documentación

Manual editable Word, PDF para imprimir, manual HTML, decisiones en metodo_A76.json e informe técnico Verificacion_Tecnica_A76.json. El manual distingue referencias publicadas, apuntes personales, acuerdos ORION y pendientes de contraste. La tabla de altura no debe citarse como una tabla oficial verificada de Delaire.

## Pruebas reproducibles

Requiere Node.js y Playwright. Instale Playwright y su Chromium en su entorno de desarrollo. Ejecute desde esta carpeta:

```sh
APP_HTML=index.html node tests/verify-a76.cjs
```

APP_HTML permite indicar otra ruta al HTML. CHROMIUM_EXECUTABLE_PATH permite usar un Chromium instalado. Las pruebas generan archivos sintéticos en output; no cargan datos de pacientes. Resultado A76: 36 comprobaciones automáticas y revisión visual de documentos y panel.

## Alcance

Pruebas técnicas con datos sintéticos; concordancia clínica pendiente. Las referencias teóricas y discrepancias no prescriben movimientos quirúrgicos. El ejemplo numérico no contiene identidad personal. No subir telerradiografías ni estudios clínicos a repositorios públicos.
