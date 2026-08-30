# ORION Dental App V1.4.5 — revisión del 30 de agosto de 2026

## Alcance solicitado

- Comunicaciones 5.7.8 conserva el estado recibido de Excel o Drive: `Citado` ya no se transforma en `Ausente`. Se normalizan encabezados, no los valores; los campos vacíos permiten buscar otro encabezado compatible. Los valores desconocidos se muestran literalmente y escapados.
- CMF 4.3.41 ubica `Generar Interconsulta` junto a `Cerrar`, fuera del área desplazable, en móvil y escritorio.
- Una fuente activa de plantillas (`cmf-clinical-v145.js`) reemplaza las tres definiciones que competían mediante listeners. Se conservan las pautas especiales ya corregidas y la preoperatoria anterior.
- Postoperatorios adultos: paracetamol **500 mg** c/6 h durante 48 h; ketoprofeno inmediato **50 mg** c/6 h o ibuprofeno **400 mg** c/6 h, en plantillas alternativas. Después se reduce a uso según dolor y duración indicada. No se combina ketoprofeno con ibuprofeno. El intervalo c/6 h no se aplica a corticoides, antibióticos ni todos los fármacos del catálogo.
- Pediatría: paracetamol, ibuprofeno, pauta postoperatoria combinada, amoxicilina cuando está indicada y cuidados sin medicación. Selección obligatoria de concentración, mg y ml por toma, máximos diarios y recálculo al cambiar edad/peso/concentración. Volúmenes redondeados hacia abajo a 0,1 ml. La pauta calculada queda editable y cada cambio de parámetros la regenera.
- TTM: distinguir dolor muscular, dolor articular y coadyuvante muscular opcional. Reposo mandibular relativo, dieta blanda, uso de ambos lados según tolerancia; sin asignar automáticamente un lado contralateral. Calor tibio protegido para dolor muscular; frío protegido según tolerancia en componente articular agudo.
- Pericoronaritis: manejo local prioritario, analgesia, cuidados y opción antimicrobiana independiente para compromiso sistémico, propagación o persistencia pese a medidas locales. No se añade antibiótico a la pauta localizada.
- Terceros molares: advertencia de posible alveolitis y solicitud de control anticipado; las señales de compromiso de vía aérea indican urgencia.
- `Control clínico CMF · CMF-2026.07.26-V1` y su casilla quedan **suspendidos por solicitud expresa del usuario**. No se marca una confirmación ficticia. Se mantiene el registro de salida, el folio, la firma y la invalidación por cambios de contenido. La auditoría y confirmación de Endodoncia no se modifican.

## Criterios clínicos y límites

Estas son plantillas para un profesional que debe adaptarlas al paciente; no constituyen una validación clínica externa, una certificación ni un sistema de prescripción autónoma. No se cambió el resto del catálogo farmacológico histórico: esta revisión no lo declara validado.

La extensión de analgesia fija a 48 horas responde a la preferencia del clínico; se mantiene dentro de las dosis y frecuencias de las fuentes. Se elige paracetamol 500 mg para no convertir una pauta de 1 g en 4 g/día por un cambio mecánico del intervalo. Individualizar en bajo peso, enfermedad renal/hepática, deshidratación, riesgo gastrointestinal/cardiovascular, embarazo y medicación concomitante.

El cálculo pediátrico usa topes conservadores propios del piloto: paracetamol 15 mg/kg c/6 h, máximo 750 mg/toma y 3 g/día; ibuprofeno 10 mg/kg c/8 h, máximo 400 mg/toma y 1,2 g/día. Excluye cálculo automático en menores de 3 meses y de ibuprofeno en menores de 6 meses. Amoxicilina 22,5 mg/kg/toma c/12 h, máximo 875 mg/toma; control a las 48–72 horas para definir continuación. No sustituye la revisión de alergias o función renal.

Ciclobenzaprina: opción individualizable para adulto, no agregada automáticamente a la analgesia. La propuesta inicial de 5 mg nocturnos por 5 noches es una adaptación clínica conservadora, **no una pauta específica aprobada para TTM ni una recomendación universal**. Los ensayos de TTM con 10 mg nocturnos son pequeños y tienen resultados diferentes; la ficha técnica trata espasmo musculoesquelético agudo. Revisar contraindicación cardiovascular/IMAO, sedación, interacciones serotoninérgicas, edad avanzada y hepatopatía. La ficha y disponibilidad del producto concreto en Chile deben comprobarse antes de prescribir.

## Fuentes consultadas

- ADA, guía de dolor dental agudo: https://www.ada.org/resources/research/science/evidence-based-dental-research/pain-management-guideline
- ADA, analgesia oral e intervalos: https://www.ada.org/resources/ada-library/oral-health-topics/oral-analgesics-for-acute-dental-pain
- DailyMed, ketoprofeno de liberación inmediata: https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=d0f47ab6-29ff-df07-e053-2a95a90a2b51
- AAPD, medicamentos para condiciones orales: https://www.aapd.org/globalassets/media/policies_guidelines/r_usefulmeds.pdf
- NIDCR, TTM: https://www.nidcr.nih.gov/health-info/tmd
- UCLH, autocuidado TTM: https://www.uclh.nhs.uk/patients-and-visitors/patient-information-pages/temporomandibular-disorder
- DailyMed, ciclobenzaprina inmediata: https://dailymed.nlm.nih.gov/dailymed/lookup.cfm?setid=92f5c528-e1af-4268-9f5f-ae5558a5104c
- Ensayos clínicos TTM: https://pubmed.ncbi.nlm.nih.gov/11889661/ y https://pubmed.ncbi.nlm.nih.gov/24822235/
- SDCEP, condiciones periodontales agudas/pericoronaritis: https://www.sdcepdentalprescribing.nhs.scot/guidance/bacterial-infections/nug-and-pericoronitis/
- Guy's and St Thomas', alveolitis: https://www.guysandstthomas.nhs.uk/health-information/dental-surgery-and-recovery

## Verificación y continuidad

Pruebas unitarias cubren concentración, equivalencia mg/ml, topes, pesos extremos, datos incompletos, negación de estados y sintaxis de scripts. Pruebas de navegador cubren el recorrido de interconsulta, estados, filtros, recálculo pediátrico y nuevas indicaciones; las pruebas previas de firma/folio permanecen, sin exigir la casilla suspendida.

La caché del portal se actualiza a `orion-dental-app-v1.4.5`; Armonización 2.1.0 y los otros módulos conservan sus versiones. Los archivos de auditoría antiguos quedan en el historial/código, pero no se ejecutan en CMF. No se alteran datos de pacientes ni hojas de cálculo remotas. La corrección del estado se valida con datos sintéticos; falta contrastar con la planilla concreta del usuario.


### Resultado local y publicación

- Verificación estática aprobada.
- Cinco pruebas unitarias aprobadas.
- Diez pruebas focalizadas de navegador aprobadas (escritorio y Pixel 7): estados/adaptadores, filtros, interconsulta visible en pantalla incluso al desplazar, pediatría, indicaciones y conservación/invalidez del folio.
- La suite histórica completa no se declara aprobada: mantiene expectativas anteriores al selector inicial de módulos y tres pruebas de geometría móvil que también fallan con idénticos resultados sobre el commit base 8f49189, sin estos cambios. Se conserva esa limitación para una revisión separada.
- Publicación pendiente: el revisor automático bloqueó el push por requerir autorización explícita para exportar el código al repositorio GitHub. No se reintentó mediante otra herramienta ni se modificó main.

- Autorización recibida del usuario el 30 de agosto de 2026: subir estos cambios a `DrJavierEspinaV/Orion-Health` y publicarlos en la aplicación. Se reanuda la publicación del alcance revisado.
