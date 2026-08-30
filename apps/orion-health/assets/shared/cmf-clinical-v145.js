/* ORION CMF: fuente única de plantillas y cálculo. Bases y límites en docs/CMF-V1.4.5.md. */
(()=>{
  'use strict';
  const adult = {
    embarazo: `PARACETAMOL 500–1.000 mg
Cada 8 horas solo si es necesario.
Máximo: 3.000 mg/día, considerando todas las fuentes de paracetamol.

Embarazo/lactancia:
• confirmar edad gestacional y antecedentes obstétricos;
• no agregar antibiótico de rutina;
• amoxicilina solo cuando exista una indicación infecciosa concreta y ausencia de alergia;
• evitar AINE, especialmente desde las 20 semanas de gestación, salvo indicación médica específica.`,
    diabetico: `PARACETAMOL 1 g
1 comprimido cada 8 horas por 48–72 horas; luego solo si es necesario.
Máximo: 3.000 mg/día.

Paciente con diabetes:
• verificar glicemia, función renal, cicatrización y tratamiento habitual;
• no indicar profilaxis antibiótica automática solo por el diagnóstico de diabetes;
• si existe infección con compromiso sistémico, utilizar la pauta específica e indicar control estrecho.`,
    hipertenso: `PARACETAMOL 1 g
1 comprimido cada 8 horas por 48–72 horas; luego solo si es necesario.
Máximo: 3.000 mg/día.

Paciente con HTA:
• comprobar control tensional y tratamiento habitual;
• evitar AINE si la HTA está descompensada, existe nefropatía o hay interacción relevante;
• no incorporar meloxicam de forma automática;
• individualizar toda pauta antiinflamatoria y usar la menor dosis eficaz por el menor tiempo posible.`,
    alergia_penicilina: `INFECCIÓN ODONTOGÉNICA CON COMPROMISO SISTÉMICO — ALERGIA A PENICILINA
Usar únicamente cuando exista indicación de antibiótico y junto con el tratamiento odontológico definitivo.

AZITROMICINA 500 mg
Día 1: 1 comprimido.
Días 2 a 5: 250 mg cada 24 horas.

Reevaluar clínicamente dentro de 3 días. Suspender 24 horas después de la resolución completa de los signos y síntomas sistémicos.

Clindamicina no queda como alternativa automática por su mayor riesgo de infección por C. difficile. Individualizar cuando no exista una opción más segura.`,
    Post_Qx1: `PARACETAMOL 500 mg
1 comprimido por vía oral cada 6 horas durante las primeras 48 horas; después, cada 6 horas solo si hay dolor, hasta completar 5 días.
Máximo de esta pauta: 2.000 mg/día. No superar 3.000 mg/día sumando otros productos.

KETOPROFENO 50 mg — liberación inmediata
1 cápsula por vía oral cada 6 horas durante 48 horas; después, cada 8 horas solo si hay dolor, hasta completar 3 días.
Tomar con alimentos. Máximo: 200 mg/día. No combinar con otro AINE.

DEXAMETASONA 8 mg — solo si fue indicada por el clínico
Dosis única perioperatoria; confirmar vía y momento. No repetir cada 6 horas.

Control: ____________________ a las __________ horas.`,
    Post_Qx2: `IBUPROFENO 400 mg
1 comprimido por vía oral cada 6 horas durante las primeras 48 horas; luego cada 8 horas solo si hay dolor, hasta completar 3 días.
Máximo inicial: 1.600 mg/día, bajo prescripción. Tomar con alimentos. No combinar con otro AINE.

PARACETAMOL 500 mg
1 comprimido por vía oral cada 6 horas durante 48 horas; luego cada 6 horas solo si hay dolor, hasta completar 5 días.
Puede tomarse junto con ibuprofeno. Máximo de esta pauta: 2.000 mg/día; máximo total de todas las fuentes: 3.000 mg/día.

CLORHEXIDINA 0,12% — solo si fue indicada
15 ml durante 30 segundos cada 12 horas por 7 días. No ingerir. Tras extracción, iniciar después de 24 horas con enjuague suave.

Control: ____________________ a las __________ horas.`,
    post_sin_aine: `PARACETAMOL 500 mg
1 comprimido por vía oral cada 6 horas durante 48 horas; luego cada 6 horas solo si hay dolor, hasta completar 5 días.
Máximo de esta pauta: 2.000 mg/día. No superar 3.000 mg/día sumando otros productos. Ajustar si hay hepatopatía, bajo peso o consumo de alcohol.
Si el dolor no se controla, consultar; no aumentar la dosis por cuenta propia.`,
    PRE_QX: `PARACETAMOL 1 g
1 comprimido cada 8 horas; comenzar 24 horas antes.
Máximo: 3 g/día.

KETOPROFENO 50 mg
1 cápsula cada 8 horas; comenzar 24 horas antes.
No combinar con otro AINE.

DEXAMETASONA 8 mg
Dosis única 1 hora antes, solo si fue indicada por el clínico.

Confirmar contraindicaciones antes de usar.`,
    ttm_mialgia: `TTM — DOLOR MUSCULAR / MIALGIA AGUDA
IBUPROFENO 400 mg
1 comprimido por vía oral cada 8 horas con alimentos por 3 días; después, reevaluar.
Máximo: 1.200 mg/día. No combinar con otro AINE. No usar ante contraindicación renal, digestiva, cardiovascular, alergia a AINE o embarazo sin evaluación específica.

Aplicar las indicaciones de autocuidado TTM. No añadir relajante muscular de rutina. Control en 7 días o antes si empeora.`,
    ttm_articular: `TTM — DOLOR ARTICULAR AGUDO
IBUPROFENO 400 mg
1 comprimido por vía oral cada 8 horas con alimentos por 3 días; luego reevaluación clínica.
Máximo: 1.200 mg/día. No combinar con otro AINE. Revisar contraindicaciones.

Reposo mandibular relativo y dieta blanda. El relajante muscular no se indica automáticamente para dolor exclusivamente articular.
Control en 7 días; anticipar si aparece bloqueo o limitación progresiva.`,
    ttm_relajante: `CICLOBENZAPRINA 5 mg — coadyuvante opcional, solo adulto
Propuesta individualizable para espasmo muscular asociado a TTM: 1 comprimido por vía oral por la noche durante 5 noches; reevaluar antes de prolongar.
Uso en TTM fuera de la indicación específica de ficha técnica; no es tratamiento de rutina ni pauta para dolor crónico.
Puede causar somnolencia: no conducir, operar maquinaria, beber alcohol ni combinar con otros sedantes.
No usar con IMAO o durante los 14 días posteriores, arritmias, trastornos de conducción, insuficiencia cardíaca, infarto reciente o hipertiroidismo.
Revisar interacciones con antidepresivos y tramadol (síndrome serotoninérgico), glaucoma, retención urinaria, hepatopatía, edad avanzada y embarazo/lactancia.
No aumentar la dosis por cuenta propia.`,
    pericoronaritis: `PERICORONARITIS LOCALIZADA — SIN COMPROMISO SISTÉMICO
IBUPROFENO 400 mg
1 comprimido por vía oral cada 8 horas con alimentos por 48 horas; luego reevaluar. Máximo: 1.200 mg/día. No combinar con otro AINE; revisar contraindicaciones.

Priorizar irrigación/aseo profesional y tratamiento de la causa. No se agrega antibiótico de rutina.
Control en 48–72 horas; antes si empeora. Añadir las indicaciones de pericoronaritis.`,
    pericoronaritis_atb: `PERICORONARITIS — ANTIBIÓTICO SOLO CON INDICACIÓN CLÍNICA
AMOXICILINA 500 mg
1 cápsula por vía oral cada 8 horas por 3 días. Reevaluar a las 48–72 horas para decidir suspensión, ajuste o continuación.
Solo ante compromiso sistémico, propagación de infección o inflamación persistente pese a medidas locales; es una alternativa a metronidazol, no una asociación automática.
No usar si hay alergia a penicilinas; ajustar según función renal. Registrar diagnóstico e indicación. No reemplaza el aseo/tratamiento local.
No agregar otro antibiótico sin reevaluación. Disfagia, disnea o extensión cervical: urgencia.`,
  };

  const instructions={
    ind_ttm: `CUIDADOS PARA DISFUNCIÓN TEMPOROMANDIBULAR
• Reposo mandibular relativo: alimentos blandos, bocados pequeños; evitar chicle, alimentos duros, apretar los dientes y aperturas amplias.
• En reposo: labios suaves y dientes separados, sin apretar. No inmovilizar la mandíbula.
• No forzar la masticación exclusivamente por el lado contrario: usar ambos lados según tolerancia, sin provocar dolor. Si ambos duelen, reducir la consistencia y consultar.
• Dolor muscular: calor húmedo tibio 10–15 minutos, 2–3 veces al día, con protección de la piel. Suspender si aumenta el dolor; no dormir con la fuente de calor.
• Si predomina inflamación articular aguda, puede usarse frío protegido 5–10 minutos según tolerancia; no aplicar hielo directo.
• Ejercicios suaves solo según indicación, sin forzar ni provocar dolor.
• Control en 7 días o antes ante bloqueo, dolor creciente o menor apertura. Fiebre, hinchazón progresiva o dificultad para tragar/respirar requieren evaluación urgente.`,
    ind_pericoronaritis: `CUIDADOS PARA PERICORONARITIS
• Aseo e irrigación profesional y planificación del tratamiento definitivo del molar.
• Higiene suave alrededor del diente con cepillo pequeño; no introducir objetos bajo la encía.
• Dieta blanda e hidratación. Enjuagues suaves de agua tibia con sal si se toleran.
• Clorhexidina 0,12% solo si se indicó: 15 ml durante 30 segundos cada 12 horas por 7 días; escupir, no ingerir. No usar si no puede enjuagar y escupir con seguridad.
• Analgesia según receta. No automedicarse con antibióticos ni prolongarlos sin control.
• Control en 48–72 horas; adelantar ante fiebre, dolor creciente o menor apertura.
• Dificultad para tragar saliva, respirar o hinchazón hacia cuello/piso de boca: acudir inmediatamente a urgencias.`,
    ind_pedia: `CUIDADOS POSTOPERATORIOS PEDIÁTRICOS
• Un adulto debe supervisar los medicamentos y anotar hora y cantidad; medir con jeringa oral, nunca con cuchara doméstica.
• Confirmar en el frasco la concentración indicada en la receta; no intercambiar presentaciones manteniendo los mismos ml.
• Mientras dure la anestesia, evitar morder labio, mejilla o lengua; supervisar y evitar alimentos calientes.
• Dieta blanda, líquidos y reposo relativo 24–48 horas; no manipular la herida ni enjuagar vigorosamente el primer día.
• Higiene suave. No indicar colutorios si no sabe escupir con seguridad.
• Sangrado persistente, fiebre, aumento del dolor o hinchazón, rechazo de líquidos o poca orina: control anticipado. Dificultad para respirar o tragar: urgencias.
• Control según procedimiento y pauta del cirujano.`,
  };
  const alveolitis=`\n\n⚠️ Posible alveolitis: dolor intenso que aparece o aumenta entre el 2.º y 5.º día, puede irradiarse al oído y acompañarse de mal sabor u olor. Puede ocurrir sin fiebre. Solicitar control anticipado el mismo día; no esperar al control programado ni aumentar medicamentos por cuenta propia. No introducir sustancias en el alvéolo. Dificultad para respirar o tragar saliva: urgencias.`;
  const concentrations={apap:[120,160,250],ibu:[100,200],amoxi:[250,400,500]};
  const number=value=>String(value??'').trim()===''?NaN:Number(value);
  const fmt=n=>Number(n.toFixed(2)).toLocaleString('es-CL',{maximumFractionDigits:2});
  function pediatric(key,input={}){
    if(key==='pedia_cuidados')return {text:'Sin medicación automática. Insertar las indicaciones de cuidados pediátricos.',doses:[]};
    const kg=number(input.kg),age=number(input.age);
    if(!(kg>0&&kg<=150&&age>=0.25&&age<18))return {error:'Confirma edad (en años, mínimo 3 meses y menor de 18 años) y peso (kg) válidos. En menores de 3 meses, individualizar sin cálculo automático.'};
    const keys=key==='pedia_postqx'?['apap','ibu']:key==='pedia_dolor'?['apap']:key==='pedia_ibu'?['ibu']:key==='pedia_amoxi'?['amoxi']:[];
    if(!keys.length)return {error:'Selecciona una plantilla pediátrica.'};
    if(keys.includes('ibu')&&age<0.5)return {error:'Ibuprofeno: no se calcula en menores de 6 meses. Selecciona paracetamol o individualiza.'};
    const doses=[];
    for(const drug of keys){
      const concentration=number(input[drug]);
      if(!concentrations[drug].includes(concentration))return {error:'Selecciona y confirma la concentración del frasco para cada medicamento.'};
      const interval=drug==='apap'?6:drug==='ibu'?8:12;
      const target=drug==='apap'?Math.min(kg*15,750):drug==='ibu'?Math.min(kg*10,400):Math.min(kg*22.5,875);
      // Redondear hacia abajo a 0,1 ml: nunca exceder el límite por redondeo.
      const ml=Math.floor((target*5/concentration+1e-9)*10)/10;
      const mg=ml*concentration/5;
      if(ml<=0)return {error:'Volumen demasiado pequeño para esta concentración; individualizar.'};
      doses.push({drug,concentration,interval,ml,mg,dailyMg:mg*24/interval});
    }
    const text=doses.map(d=>{
      const name={apap:'PARACETAMOL',ibu:'IBUPROFENO',amoxi:'AMOXICILINA'}[d.drug];
      let instructions=d.drug==='amoxi'?'por 3 días; reevaluación obligatoria a las 48–72 horas para decidir continuación o ajuste.':key==='pedia_postqx'?'durante las primeras 24–48 horas según indicación; después solo si hay dolor, máximo 3 días sin control.':'solo si hay dolor, máximo 3 días sin control.';
      const limit=d.drug==='apap'?'Tope de esta plantilla: 60 mg/kg/día y 3.000 mg/día, el menor. No duplicar con otros productos que contengan paracetamol.':d.drug==='ibu'?'Tope de esta plantilla: 30 mg/kg/día y 1.200 mg/día, el menor. Evitar con deshidratación, nefropatía, sangrado digestivo o alergia a AINE.':'Tope: 875 mg por toma (45 mg/kg/día hasta dosis adulta). Solo con indicación infecciosa; no usar con alergia a penicilinas. Revisar función renal.';
      return `${name} suspensión ${d.concentration} mg/5 ml\n${fmt(d.ml)} ml (${fmt(d.mg)} mg) por vía oral cada ${d.interval} horas ${instructions}\nTotal si recibe todas las tomas: ${fmt(d.dailyMg)} mg/día.\n${limit}`;
    }).join('\n\n');
    return {doses,text:`PESO: ${fmt(kg)} kg · EDAD: ${fmt(age)} años\n\n${text}\n\nAgitar el frasco; medir con jeringa oral. Confirmar presentación, alergias y medicación concomitante.${key==='pedia_postqx'?' No añadir dosis intermedias ni alternar por cuenta propia.':''}`};
  }
  globalThis.ORION_CMF_CLINICAL={version:'1.4.5',adult,instructions,alveolitis,pediatric,concentrations};
})();
