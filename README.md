# ORION Health — Repositorio de aplicaciones

Este repositorio se organiza como un portal central con aplicaciones independientes.

## Estructura

```text
/
├── index.html
└── apps/
    ├── orion-health/
    └── ordenautas/
```

- `apps/orion-health/`: aplicación clínica ORION Health.
- `apps/ordenautas/`: ORDENAUTAS, actualmente en versión piloto familiar V1.6.

Las versiones se registran dentro de cada aplicación y no forman parte del nombre de su carpeta. De esta forma, las rutas permanecen estables al publicar nuevas versiones.

## Publicación

GitHub Pages sirve el portal desde la raíz del repositorio. Cada aplicación conserva sus propios archivos, manifiesto y service worker.
