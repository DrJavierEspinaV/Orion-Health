# ORION Comunicaciones Clínicas — Cierre operacional y plan de estabilización
**Código:** ORH-COM-MAN-001-V1.0 · **Fecha:** 2026-10-17 · **Alcance:** ORION Health OS

## Estado comprobado en repositorio
- Módulo: `apps/orion-health/modules/comunicaciones/`; cargador `loader.js` y fuente `source.html`.
- Versión expuesta en cargador: **5.7.9**.
- UI canónica: Montserrat; azul #1F3F5B, gris #8C8C8C, fondo #F3F3F3; tokens Health OS V2.
- Acceso a base de Drive opcional al abrir; consulta protegida sigue exigiendo token de sesión.
- El repositorio también contiene módulos CMF, Insumos, Endodoncia, Ortodoncia, Odontopediatría y Armonización.
- Esta rama añade pruebas contractuales, **no cambia datos, reglas clínicas ni credenciales**.

## Modelo de producto
1. **Identidad y pacientes:** identificador estable; nunca depender exclusivamente de nombre. Acceso por rol.
2. **Agenda/controles:** fecha real, motivo, profesional, estado de atención y próxima cita.
3. **Comunicaciones:** plantillas aprobadas, canal, destinatario, vista previa, consentimiento y registro de resultado real (no confundir enlace abierto con mensaje enviado).
4. **Seguimiento:** pendiente / programado / realizado / no contactado / descartado; bitácora de eventos y responsable.
5. **Finanzas:** presupuesto, abonos, saldo, método y conciliación; evitar presentar proyecciones como ingresos cobrados.
6. **Odontopediatría:** reusar RUN, TRATAMIENTO_KIDS y FINANZAS_KIDS solo por adaptador explícito de datos; no fusionar físicamente tablas sin migración validada.
7. **Analítica:** citas próximas/vencidas, respuesta, conversión, presupuestos aceptados, cobros efectivos y brecha de ingresos.
8. **Auditoría:** usuario, fecha, acción, antes/después, resultado y origen.

## Condiciones de liberación
| Dominio | Criterio verificable |
| --- | --- |
| Seguridad | Sin token/API key en repositorio, URL ni almacenamiento persistente; autorización efectiva del backend |
| Privacidad | Mínimo dato necesario; consentimiento y permisos para mensajería; acceso clínico por rol |
| Integridad | No duplicación por reintentos; trazabilidad y conciliación de estados |
| Comunicaciones | Resultado explícito confirmado por proveedor o registrado manualmente, nunca asumido |
| UI | Desktop y móvil, contraste, foco visible, sin desplazamiento lateral |
| PWA | Caché coherente, actualización segura y recuperación offline donde corresponda |
| Pruebas | Static check, unitarias y Playwright verdes antes de fusionar |
| Producción | Validar despliegue y acceso real con cuentas autorizadas, sin usar datos sensibles en pruebas |

## Secuencia de ejecución autónoma
- **Etapa A — Contratos:** asegurar compatibilidad del módulo e invariantes con pruebas automatizadas (iniciada en esta rama).
- **Etapa B — Flujos:** end-to-end de conectar, listar, buscar, agendar, generar mensaje y documentar envío.
- **Etapa C — Persistencia:** eliminar estados incongruentes entre base, caché, agenda y finanzas; probar reintentos y errores.
- **Etapa D — Seguridad:** migrar, cuando exista backend listo, de token manual a identidad Google verificada del lado servidor.
- **Etapa E — Valor económico:** pipeline de presupuestos, oportunidades, recordatorios consentidos y tablero de conversión.
- **Etapa F — Release:** completar CI, hacer despliegue controlado y verificar navegador real, móvil y recuperación ante fallos.

## Límites operativos
Esta documentación y la prueba incluida **no prueban que el despliegue web, Apps Script, la base clínica ni la entrega de mensajes estén funcionando**. Estas comprobaciones deben hacerse por separado. No dar por terminada la puesta en producción solo por fusionar el código.

## Referencias internas
- `docs/COMUNICACIONES-V5.7.9-ACCESO-OPCIONAL.md`
- `docs/ORION_HEALTH_OS_VISUAL_BRIDGE_V2_COMUNICACIONES.md`
- `tests/orion-comunicaciones-contract.test.mjs`
