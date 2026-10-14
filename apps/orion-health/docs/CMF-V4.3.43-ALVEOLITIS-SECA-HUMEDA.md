# ORION Clínico CMF V4.3.43 — Indicaciones para alveolitis seca y húmeda/supurativa

**Fecha:** 14 de octubre de 2026  
**Objetivo:** sumar dos indicaciones postoperatorias editables en el selector `Indicaciones (Elige una y/o Edita)` del módulo CMF activo.

## Implementación

| Clave | Etiqueta en interfaz | Uso |
| --- | --- | --- |
| `ind_alveolitis_seca` | Alveolitis seca — cuidados y control del dolor | Medidas de autocuidado y control luego de evaluación por osteítis alveolar |
| `ind_alveolitis_humeda` | Alveolitis húmeda / supurativa — cuidados y alertas de infección | Vigilancia de supuración y necesidad de descartar infección postexodoncia |

Ambas opciones insertan texto en `#indicaciones` usando el botón **Insertar indicaciones**. Se comportan como `ind_pericoronaritis`: no añaden instrucciones PRE-quirúrgicas y no modifican el contenido de `#receta`. Los textos pueden ser editados por el profesional antes de impresión o exportación.

La clasificación «húmeda / supurativa» es terminología descriptiva usada en parte de la literatura; **no se equipara automáticamente a un diagnóstico de infección sistémica ni justifica antibioticoterapia por sí sola**. En los cuadros con exudado o pus se debe reconsiderar el diagnóstico diferencial de infección del sitio quirúrgico, restos retenidos u otra complicación.

## Criterio clínico

### Alveolitis seca
- Revisión odontológica, manejo del dolor, irrigación con suero fisiológico por profesional y apósito apropiado si corresponde.
- Higiene suave, enjuagues salinos suaves a partir de las primeras 24 horas si el profesional lo indica, evitar tabaco y manipulación del alvéolo.
- Sin antibióticos de rutina: reservados para infección que se extiende, manifestaciones sistémicas o situaciones clínicas de mayor riesgo.
- Control cercano y evaluación urgente ante signos de alarma.

### Alveolitis húmeda / supurativa
- Exudado, inflamación o coágulo alterado requieren evaluación clínica prioritaria.
- Priorizar medidas locales (limpieza, irrigación o drenaje según hallazgos) y analgesia indicada.
- No antibióticos automáticos por mal olor o exudado aislados. El profesional valora indicación ante extensión, fiebre, inmunosupresión u otros factores de riesgo.
- Alertas explícitas por compromiso de la vía aérea o extensión cervical.

## Integridad del software

- Se editan únicamente: `assets/shared/cmf-clinical-v145.js`, `modules/cmf/source.html`, metadatos de versión y caché PWA.
- **No** se alteran cálculos pediátricos, pautas analgésicas, dosis, firma, folio ni tamaño Statement.
- Versión CMF: **4.3.43**. Caché PWA: `orion-dental-app-v1.4.5-health-os-ui6-cmf-alveolitis`.
- Pruebas automatizadas: selector, comportamiento directo, ausencia de receta automática, vista de indicaciones e impresión, móvil/escritorio, regresión del botón PRE/POST.

## Fuentes de revisión

- Scottish Dental Clinical Effectiveness Programme (SDCEP), *Management of Acute Dental Problems — Alveolar osteitis (dry socket)*: https://www.acutedentalproblems.sdcep.org.uk/guidance/management-of-oral-conditions/common-oral-conditions/alveolar-osteitis-dry-socket/
- SDCEP, *Drug Prescribing for Dentistry — Bacterial infections*: https://www.sdcepdentalprescribing.nhs.scot/guidance/bacterial-infections/
- Cochrane, *What treatments can be used to prevent and treat alveolar osteitis (dry socket)*: https://www.cochrane.org/es/evidence/CD006968_what-treatments-can-be-used-prevent-and-treat-alveolar-osteitis-dry-socket
- Mayo Clinic, *Alveolitis seca: diagnóstico y tratamiento*: https://www.mayoclinic.org/es/diseases-conditions/dry-socket/diagnosis-treatment/drc-20354382

**Documento de apoyo para profesional sanitario.** Las indicaciones son editables y no sustituyen la evaluación clínica individual ni las guías locales vigentes.
