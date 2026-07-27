# Auditoría clínica — ORION Clínico CMF V1.3

**Código de control:** `CMF-2026.07.26-V1`  
**Estado:** Final Piloto — uso profesional supervisado  
**Responsable clínico de liberación:** Dr. Javier Espina Videla

## Alcance

Se revisaron las plantillas farmacológicas adultas y pediátricas accesibles desde el selector principal. El modo libre `Por Fármacos / Familias` se deshabilita en la V1.3 porque su catálogo heredado requiere una auditoría individual de cada componente antes de reactivarlo.

## Cambios críticos

- Se elimina la combinación automática de analgésico, AINE, antibiótico y corticoide.
- Se elimina la profilaxis antibiótica automática por diabetes.
- Se elimina meloxicam automático en HTA y la pauta heredada de 30 mg/día.
- Los antibióticos quedan condicionados a una indicación infecciosa concreta y al tratamiento odontológico definitivo.
- Se incorpora reevaluación a 3 días y suspensión 24 horas después de resolver signos y síntomas sistémicos.
- Clindamicina deja de ser alternativa automática por el riesgo de infección por *C. difficile*.
- Las dosis pediátricas incorporan peso válido, edad, dosis máxima por toma y límite diario.
- Ibuprofeno pediátrico no se genera con edad menor de 6 meses o no confirmada.
- Se agrega una confirmación clínica obligatoria antes de imprimir, generar PDF, copiar o enviar.

## Referencias primarias utilizadas

- American Dental Association. *Evidence-based clinical practice guideline on pharmacologic management of acute dental pain in adolescents, adults, and older adults* (2024).
- American Dental Association. *Antibiotics for Dental Pain and Swelling* y guías clínicas de uso de antibióticos.
- American Academy of Pediatric Dentistry. *Useful Medications for Oral Conditions* (Reference Manual 2025–2026).
- DailyMed / U.S. National Library of Medicine. Información oficial de meloxicam: dosis máxima adulta 15 mg/día.

## Regla de uso

Las plantillas son ayudas editables. Antes de emitir se debe confirmar diagnóstico, alergias, embarazo/lactancia, función renal y hepática, HTA, diabetes, anticoagulantes/antiagregantes, interacciones, edad, peso, presentación disponible y dosis máxima.

## Pendiente para V2.0

Auditoría individual y reactivación controlada del catálogo libre de fármacos, con reglas de interacción, contraindicación, trazabilidad y aprobación por versión.
