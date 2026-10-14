# ORION Clínico CMF 4.3.42 — actualización de prescripción (2026-10-14)

**Origen:** revisión directa de `assets/shared/cmf-clinical-v145.js` (plantillas activas), `modules/cmf/source.html` (interfaz) y pruebas funcionales del repositorio. No se utilizaron las plantillas históricas `clinical-templates-cmf-v132.js`, que permanecen fuera del flujo operativo.

## 1. Paracetamol postquirúrgico adulto

En `Post_Qx1`, `Post_Qx2` y `post_sin_aine`:
- Paracetamol 1 g por vía oral cada 8 h durante 48 h y luego cada 8 h según dolor, hasta 5 días.
- Máximo 3.000 mg/día incluyendo cualquier otro producto con paracetamol.
- Individualizar por bajo peso, hepatopatía, consumo de alcohol u otras contraindicaciones.
- NO se modifican dosis pediátricas, embarazo, diabetes, HTA ni pauta `PRE_QX`.
- No cambiar automáticamente ketoprofeno ni ibuprofeno.

## 2. Corticoide opcional y excluyente

En `Post_Qx1`, el profesional puede elegir:
- **Dexametasona 8 mg:** vía oral, dosis única perioperatoria (habitualmente 60–90 minutos antes).
- **Prednisona 40 mg:** 2 comprimidos de 20 mg, dosis única oral preoperatoria, alternativa a dexametasona. Individualizar: no es un esquema intercambiable automático.
- **Ninguno:** no prescribe corticoides.

Nunca asociar ambos corticosteroides automáticamente. La elección se expresa como una pauta editable, y debe cotejarse con el momento quirúrgico (si ya ocurrió, no reproducir una dosis preoperatoria como nueva toma), patología intercurrente, glucemia e interacciones. La evidencia quirúrgica tiene variaciones de droga, vía, dosis y duración.

## 3. Profilaxis antibiótica odontológica para endocarditis — separada

Nuevas plantillas de adulto:
- `profilaxis_ei_amoxicilina`: 2 g de amoxicilina VO, dosis **única** 30–60 min antes (4 cápsulas de 500 mg).
- `profilaxis_ei_azitromicina`: 500 mg de azitromicina VO, dosis **única** 30–60 min antes, alternativa en alergia a penicilinas si corresponde.
- `ind_profilaxis_ei`: indicaciones separadas de verificación, alergias, registro y prevención de antibioticoterapia innecesaria.

**Restricción crítica:** son opciones para pacientes con afecciones cardíacas de alto riesgo y procedimientos dentales indicados (manipulación gingival, periapical o perforación mucosa), no profilaxis quirúrgica rutinaria ni profilaxis de implantes. No agregar antibiótico en todas las exodoncias, ni continuarlo en el postoperatorio sin otra indicación. La American Heart Association (tarjeta 2024) excluye clindamicina de la profilaxis dental de endocarditis.

## Fuentes clínicas para contraste

- American Heart Association: *Prevention of Infective Endocarditis*, 2024, tarjeta oficial (español): https://cpr.heart.org/-/media/files/health-topics/infective-endocarditis/infective-endocarditis-wallet-card-spanish.pdf?la=en
- American Heart Association: *Infective Endocarditis*, revisión julio 2026: https://www.heart.org/en/health-topics/infective-endocarditis
- Shibl et al.: *Effectiveness of pre-operative oral corticosteroids following lower third molar extractions* (revisión: dexametasona oral 8 mg preoperatoria).
- Ensayo sobre prednisolona oral 40 mg preoperatoria en cirugía de tercer molar: https://pmc.ncbi.nlm.nih.gov/articles/PMC5036298/

**Importante:** el estudio específico referido evaluó **prednisolona**, no **prednisona**; pese a su equivalencia antiinflamatoria clínica aproximada, no debe presentarse como validación directa del régimen de prednisona. Requiere revisión profesional antes del uso rutinario.

## Aceptación de software

- Cambio exclusivo de plantillas activas CMF y selector; sin cambios en analgésicos o antibióticos pediátricos.
- Se conserva el texto editable, nota NPS, firma, folio, auditoría, tamaño Statement 5,5 × 8,5 y demás módulos.
- Versiones: CMF `4.3.42`, caché de portal `health-os-ui5-cmf-rx2`.
- Las pruebas automatizadas verifican 1 g c/8h, máximo diario, corticoides excluyentes, profilaxis de dosis única y carácter no rutinario.
