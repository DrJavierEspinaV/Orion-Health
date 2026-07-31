(()=>{
  'use strict';

  const DRAFT_KEY='orion_armonizacion_draft_v1';
  const $=id=>document.getElementById(id);
  const $$=selector=>Array.from(document.querySelectorAll(selector));
  const PROCEDURE_LABELS={
    toxina:'Toxina botulínica',
    relleno:'Ácido hialurónico / relleno',
    bioestimulador:'Bioestimulación',
    prp:'PRP / PRF',
    combinado:'Procedimiento combinado',
    otro:'Otro procedimiento estético'
  };
  const RISK_LABELS={
    embarazo:'Embarazo o lactancia',neuromuscular:'Enfermedad neuromuscular',sangrado:'Trastorno de coagulación',
    anticoagulante:'Anticoagulantes / antiagregantes',autoinmune:'Enfermedad autoinmune activa',
    inmunosupresion:'Inmunosupresión',infeccion:'Infección, herpes o inflamación activa',
    anafilaxia:'Anafilaxia o reacción grave previa',relleno_desconocido:'Relleno previo desconocido o permanente',
    dental_reciente:'Infección o procedimiento dental reciente',cicatrizacion:'Cicatrización patológica',
    expectativa:'Expectativa difícil o desproporcionada'
  };

  const fieldIds=[
    'p_nombre','p_rut','p_edad','p_telefono','motivo','alergias','antecedentes','procedimiento','producto','material','registro',
    'lote','vencimiento','proveedor','fechaProcedimiento','toxDiluyente','toxReconstitucion','toxFechaReconstitucion',
    'toxUnidades','toxZonas','toxMapa','fillVolumen','fillZona','fillPlano','fillTecnica','fillDispositivo','fillCalibre',
    'fillMapa','otroNombre','otroCantidad','otroDetalle','profesional','registroProfesional','controlFecha','indicaciones',
    'observaciones','emergencyNotes'
  ];
  const readinessIds=['hialuronidasa','protocoloVascular','derivacionUrgente'];

  function localDateTimeValue(date=new Date()){
    const pad=n=>String(n).padStart(2,'0');
    return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }
  if(!$('fechaProcedimiento').value)$('fechaProcedimiento').value=localDateTimeValue();

  function selectedValues(containerSelector){
    return $$(`${containerSelector} input[type="checkbox"]:checked`).map(input=>input.value);
  }
  function procedure(){return $('procedimiento').value;}
  function setStatus(element,text,kind='neutral'){
    element.textContent=text;
    element.className=`status ${kind}`;
  }

  function updatePatientStatus(){
    const complete=$('p_nombre').value.trim()&&$('p_rut').value.trim()&&$('p_edad').value.trim();
    setStatus($('patientStatus'),complete?'Paciente identificado':'Datos pendientes',complete?'ok':'neutral');
  }

  function showProcedurePanel(key){
    $('panelToxina').classList.toggle('hidden',key!=='toxina'&&key!=='combinado');
    $('panelRelleno').classList.toggle('hidden',key!=='relleno'&&key!=='combinado');
    $('panelGeneral').classList.toggle('hidden',!['bioestimulador','prp','combinado','otro'].includes(key));
    $$('#procedurePicker button').forEach(button=>button.classList.toggle('active',button.dataset.procedure===key));
    setStatus($('procedureStatus'),key?PROCEDURE_LABELS[key]:'Sin seleccionar',key?'ok':'neutral');
  }

  function evaluateRisk(){
    const key=procedure();
    const selected=selectedValues('#riskChecks');
    const critical=[];
    const review=[];

    if(!key)review.push('Seleccionar el procedimiento antes de cerrar la evaluación.');
    if(selected.includes('infeccion'))critical.push('Infección, herpes o inflamación activa: posponer y reevaluar el área antes de inyectar.');
    if(selected.includes('anafilaxia'))critical.push('Antecedente de reacción grave: verificar producto, excipientes y plan de respuesta antes de continuar.');
    if(selected.includes('embarazo'))critical.push('Embarazo o lactancia: no continuar automáticamente; revisar seguridad específica del producto y conducta clínica.');
    if((key==='toxina'||key==='combinado')&&selected.includes('neuromuscular'))critical.push('Enfermedad neuromuscular con toxina botulínica: requiere evaluación clínica específica.');
    if((key==='relleno'||key==='combinado')&&selected.includes('relleno_desconocido'))critical.push('Relleno previo desconocido o permanente: precisar material, zona y plano antes de una nueva intervención.');
    if((key==='relleno'||key==='combinado')&&!$('protocoloVascular').checked)critical.push('Protocolo de complicación vascular no confirmado.');
    if((key==='relleno'||key==='combinado')&&!$('derivacionUrgente').checked)critical.push('Ruta de derivación urgente no confirmada.');
    if((key==='relleno'||key==='combinado')&&!$('hialuronidasa').checked)review.push('Confirmar disponibilidad y vigencia de hialuronidasa cuando el material sea ácido hialurónico.');

    if(selected.includes('sangrado'))review.push('Cuantificar riesgo hemorrágico y adaptar técnica.');
    if(selected.includes('anticoagulante'))review.push('Registrar fármaco, dosis e indicación; no suspender sin coordinación con el tratante.');
    if(selected.includes('autoinmune'))review.push('Revisar actividad de enfermedad, tratamiento actual y estabilidad clínica.');
    if(selected.includes('inmunosupresion'))review.push('Valorar riesgo infeccioso y capacidad de cicatrización.');
    if(selected.includes('dental_reciente'))review.push('Relacionar fecha y condición odontogénica con el procedimiento estético planificado.');
    if(selected.includes('cicatrizacion'))review.push('Registrar antecedente de queloide o cicatrización patológica.');
    if(selected.includes('expectativa'))review.push('Reformular objetivos y documentar expectativas antes del consentimiento.');

    const panel=$('riskPanel');
    const list=$('riskList');
    list.innerHTML='';
    [...critical,...review].forEach(text=>{const li=document.createElement('li');li.textContent=text;list.appendChild(li);});

    let kind='ok';
    let badge='Sin alertas seleccionadas';
    let intro='No se identificaron alertas en los campos seleccionados. Mantener evaluación clínica y revisión del producto.';
    if(review.length){kind='warn';badge='Revisión dirigida';intro='Existen antecedentes que requieren verificación y registro antes de finalizar.';}
    if(critical.length){kind='danger';badge='No continuar automáticamente';intro='Se identificaron condiciones críticas o elementos de preparación incompletos.';}
    panel.className=`risk-panel ${kind}`;
    panel.querySelector('p').textContent=intro;
    setStatus($('riskBadge'),badge,kind);
    return {kind,critical,review,selected};
  }

  function productSummary(){
    const key=procedure();
    const common=[
      `Procedimiento: ${PROCEDURE_LABELS[key]||'No seleccionado'}`,
      `Producto / marca: ${$('producto').value.trim()||'No registrado'}`,
      `Principio activo / material: ${$('material').value.trim()||'No registrado'}`,
      `Registro sanitario / referencia: ${$('registro').value.trim()||'No registrado'}`,
      `Lote: ${$('lote').value.trim()||'No registrado'}`,
      `Vencimiento: ${$('vencimiento').value||'No registrado'}`,
      `Proveedor: ${$('proveedor').value.trim()||'No registrado'}`,
      `Fecha/hora: ${$('fechaProcedimiento').value||'No registrada'}`
    ];
    if(key==='toxina'||key==='combinado'){
      common.push('', 'TOXINA BOTULÍNICA',
        `Diluyente: ${$('toxDiluyente').value.trim()||'No registrado'}`,
        `Reconstitución: ${$('toxReconstitucion').value.trim()||'No registrada'} · ${$('toxFechaReconstitucion').value||'sin fecha/hora'}`,
        `Unidades totales del producto: ${$('toxUnidades').value||'No registradas'}`,
        `Zonas / músculos: ${$('toxZonas').value.trim()||'No registrados'}`,
        `Mapa de puntos: ${$('toxMapa').value.trim()||'No registrado'}`,
        'Nota: las unidades corresponden exclusivamente al producto identificado; no se realizó conversión entre marcas.'
      );
    }
    if(key==='relleno'||key==='combinado'){
      common.push('', 'RELLENO / ÁCIDO HIALURÓNICO',
        `Volumen total: ${$('fillVolumen').value?$('fillVolumen').value+' mL':'No registrado'}`,
        `Zona: ${$('fillZona').value.trim()||'No registrada'}`,
        `Plano: ${$('fillPlano').value.trim()||'No registrado'}`,
        `Técnica: ${$('fillTecnica').value.trim()||'No registrada'}`,
        `Dispositivo: ${$('fillDispositivo').value||'No registrado'} ${$('fillCalibre').value.trim()||''}`.trim(),
        `Distribución / mapa: ${$('fillMapa').value.trim()||'No registrado'}`,
        `Preparación de seguridad: hialuronidasa ${$('hialuronidasa').checked?'confirmada':'no confirmada'}; protocolo vascular ${$('protocoloVascular').checked?'confirmado':'no confirmado'}; derivación urgente ${$('derivacionUrgente').checked?'confirmada':'no confirmada'}.`
      );
    }
    if(['bioestimulador','prp','combinado','otro'].includes(key)){
      common.push('', 'DETALLE ADICIONAL',
        `Tratamiento: ${$('otroNombre').value.trim()||'No registrado'}`,
        `Cantidad / sesiones: ${$('otroCantidad').value.trim()||'No registrada'}`,
        `Técnica / zonas: ${$('otroDetalle').value.trim()||'No registradas'}`
      );
    }
    return common.join('\n');
  }

  function consentSummary(){
    const values=selectedValues('#consentChecks');
    const total=$$('#consentChecks input[type="checkbox"]').length;
    const photoClinical=values.includes('foto_clinica')?'Autorizada':'No registrada';
    const photoDiffusion=values.includes('foto_difusion')?'Autorizada mediante selección específica':'No autorizada / no registrada';
    return `Ítems confirmados: ${values.length} de ${total}.\nFotografía clínica: ${photoClinical}.\nDifusión: ${photoDiffusion}.\nProfesional: ${$('profesional').value.trim()||'No registrado'}.\nRegistro profesional: ${$('registroProfesional').value.trim()||'No registrado'}.`;
  }

  function postCareText(key){
    const contact='Ante cualquier empeoramiento, comuníquese con el profesional tratante. Si presenta dificultad para respirar o tragar, alteración visual, síntomas neurológicos o compromiso general, busque atención de urgencia inmediata.';
    const toxin=`INDICACIONES POSTERIORES — TOXINA BOTULÍNICA\n• No frotar ni manipular intensamente las zonas tratadas durante las primeras horas, salvo instrucción profesional.\n• Puede aparecer dolor local, enrojecimiento, edema leve o equimosis.\n• El efecto se instala progresivamente; la evaluación definitiva y cualquier retoque deben realizarse en el control indicado.\n• No aplicar otros tratamientos sobre el área sin informar al profesional.\n• Consultar ante asimetría marcada, ptosis, diplopía, debilidad fuera del área tratada, disfonía, disfagia o dificultad respiratoria.\n\n${contact}`;
    const filler=`INDICACIONES POSTERIORES — RELLENO / ÁCIDO HIALURÓNICO\n• Es esperable edema, sensibilidad o equimosis durante los primeros días.\n• Aplicar frío local suave si fue indicado; no comprimir ni masajear el producto salvo instrucción profesional.\n• Mantener higiene de la zona y evitar procedimientos adicionales, calor intenso o presión directa durante el período indicado por el profesional y el producto utilizado.\n• Consultar de inmediato ante dolor inusual o creciente, piel blanca/gris/azulada, patrón reticulado, frialdad, ampollas, alteración visual, cefalea intensa o síntomas neurológicos.\n\n${contact}`;
    const bio=`INDICACIONES POSTERIORES — BIOESTIMULACIÓN\n• Seguir el protocolo específico del producto identificado en la ficha.\n• Edema, sensibilidad o equimosis leves pueden ocurrir; no manipular la zona fuera de las indicaciones entregadas.\n• Consultar ante inflamación progresiva, dolor creciente, secreción, fiebre, nódulos persistentes o cambios de coloración.\n\n${contact}`;
    const prp=`INDICACIONES POSTERIORES — PRP / PRF\n• Mantener la zona limpia y evitar manipulación intensa durante el período indicado.\n• Puede existir eritema, sensibilidad o equimosis transitoria.\n• Consultar ante dolor progresivo, secreción, fiebre, inflamación marcada o reacción inesperada.\n\n${contact}`;
    if(key==='toxina')return toxin;
    if(key==='relleno')return filler;
    if(key==='bioestimulador')return bio;
    if(key==='prp')return prp;
    if(key==='combinado')return `${toxin}\n\n${filler}\n\nINDICACIONES ADICIONALES\n• Se realizó un procedimiento combinado; prevalecen también las instrucciones específicas de cada producto registrado.`;
    return `INDICACIONES POSTERIORES — PROCEDIMIENTO ESTÉTICO\n• Cumplir las instrucciones específicas del producto, la técnica y la zona tratada.\n• No manipular intensamente el área ni realizar procedimientos adicionales sin autorización profesional.\n• Consultar ante dolor progresivo, infección, cambio de coloración, alteración visual, síntomas neurológicos o compromiso general.\n\n${contact}`;
  }

  function riskSummary(result=evaluateRisk()){
    const selectedText=result.selected.length?result.selected.map(value=>RISK_LABELS[value]||value).join('; '):'Ningún antecedente marcado';
    const lines=[`Nivel ORION: ${$('riskBadge').textContent}.`,`Antecedentes seleccionados: ${selectedText}.`];
    if(result.critical.length)lines.push('Alertas críticas:',...result.critical.map(text=>`• ${text}`));
    if(result.review.length)lines.push('Revisión dirigida:',...result.review.map(text=>`• ${text}`));
    return lines.join('\n');
  }

  function updateOutput(){
    const result=evaluateRisk();
    const key=procedure();
    $('outFecha').textContent=new Date().toLocaleString('es-CL');
    $('outNombre').textContent=$('p_nombre').value.trim()||'—';
    $('outRut').textContent=$('p_rut').value.trim()||'—';
    $('outEdad').textContent=$('p_edad').value?`${$('p_edad').value} años`:'—';
    $('outProcedimiento').textContent=PROCEDURE_LABELS[key]||'—';
    $('outRiesgo').textContent=riskSummary(result);
    $('outProducto').textContent=productSummary();
    $('outConsentimiento').textContent=consentSummary();
    $('outIndicaciones').textContent=$('indicaciones').value.trim()||'Pendiente';
    $('outObservaciones').textContent=[
      $('motivo').value.trim()?`Motivo / expectativa: ${$('motivo').value.trim()}`:'',
      $('alergias').value.trim()?`Alergias: ${$('alergias').value.trim()}`:'',
      $('antecedentes').value.trim()?`Antecedentes: ${$('antecedentes').value.trim()}`:'',
      $('observaciones').value.trim()?`Observaciones: ${$('observaciones').value.trim()}`:'',
      $('controlFecha').value?`Control programado: ${$('controlFecha').value}`:''
    ].filter(Boolean).join('\n')||'Sin observaciones';
    $('outProfesional').textContent=$('profesional').value.trim()||'Firma profesional';
    updatePatientStatus();
  }

  function generate(){
    if(!procedure()){
      alert('Selecciona primero el procedimiento.');
      return;
    }
    $('indicaciones').value=postCareText(procedure());
    updateOutput();
  }

  function collectDraft(){
    const fields={};
    fieldIds.forEach(id=>{const node=$(id);if(node)fields[id]=node.value;});
    const checks={};
    $$('.check-grid input[type="checkbox"], .readiness input[type="checkbox"]').forEach(node=>{checks[node.id||`${node.closest('[id]')?.id}:${node.value}`]=node.checked;});
    return {version:1,ts:Date.now(),fields,checks};
  }

  function applyDraft(data){
    if(!data?.fields)return false;
    Object.entries(data.fields).forEach(([id,value])=>{if($(id))$(id).value=value;});
    Object.entries(data.checks||{}).forEach(([key,checked])=>{
      let node=$(key);
      if(!node&&key.includes(':')){
        const [container,value]=key.split(':');
        node=document.querySelector(`#${container} input[value="${CSS.escape(value)}"]`);
      }
      if(node)node.checked=!!checked;
    });
    showProcedurePanel(procedure());
    updateOutput();
    return true;
  }

  function saveDraft(){
    try{sessionStorage.setItem(DRAFT_KEY,JSON.stringify(collectDraft()));alert('Borrador guardado durante esta sesión.');}
    catch(error){console.error(error);alert('No fue posible guardar el borrador.');}
  }
  function restoreDraft(){
    try{
      const raw=sessionStorage.getItem(DRAFT_KEY);
      if(!raw||!applyDraft(JSON.parse(raw)))alert('No existe un borrador disponible en esta sesión.');
    }catch(error){console.error(error);alert('El borrador no pudo recuperarse.');}
  }
  function clearForm(){
    if(!confirm('¿Limpiar toda la ficha estética actual?'))return;
    fieldIds.forEach(id=>{const node=$(id);if(node)node.value='';});
    $$('.check-grid input[type="checkbox"], .readiness input[type="checkbox"]').forEach(node=>node.checked=false);
    $('profesional').value='Dra. Pía Coronado Madariaga';
    $('fechaProcedimiento').value=localDateTimeValue();
    showProcedurePanel('');
    sessionStorage.removeItem(DRAFT_KEY);
    updateOutput();
  }

  async function copySummary(){
    updateOutput();
    const text=[
      'ORION ARMONIZACIÓN OROFACIAL',
      `Paciente: ${$('outNombre').textContent}`,
      `RUN/RUT: ${$('outRut').textContent}`,
      `Procedimiento: ${$('outProcedimiento').textContent}`,
      '',$('outRiesgo').textContent,'', $('outProducto').textContent,'', $('outConsentimiento').textContent,'', $('outIndicaciones').textContent,'', $('outObservaciones').textContent
    ].join('\n');
    try{await navigator.clipboard.writeText(text);alert('Resumen copiado.');}
    catch(_){const area=document.createElement('textarea');area.value=text;document.body.appendChild(area);area.select();document.execCommand('copy');area.remove();alert('Resumen copiado.');}
  }

  function registerEmergency(){
    const signs=selectedValues('#emergencyChecks');
    const notes=$('emergencyNotes').value.trim();
    if(!signs.length&&!notes)return;
    const labels={dolor_inusual:'Dolor inusual/desproporcionado',coloracion:'Cambio de coloración o livedo',visual:'Alteración visual',neurologico:'Síntomas neurológicos',respiratorio:'Disfagia/disnea/disfonía',debilidad:'Debilidad generalizada'};
    const entry=`ALERTA CLÍNICA ${new Date().toLocaleString('es-CL')}\nSignos: ${signs.map(value=>labels[value]).join('; ')||'No especificados'}\nAcciones / derivación: ${notes||'No registradas'}`;
    $('observaciones').value=[$('observaciones').value.trim(),entry].filter(Boolean).join('\n\n');
    $$('#emergencyChecks input').forEach(node=>node.checked=false);
    $('emergencyNotes').value='';
    updateOutput();
  }

  $$('#procedurePicker button').forEach(button=>button.addEventListener('click',()=>{
    $('procedimiento').value=button.dataset.procedure;
    showProcedurePanel(button.dataset.procedure);
    if(!$('indicaciones').value.trim())$('indicaciones').value=postCareText(button.dataset.procedure);
    updateOutput();
  }));
  fieldIds.forEach(id=>$(id)?.addEventListener('input',updateOutput));
  $$('#riskChecks input, #consentChecks input, .readiness input').forEach(node=>node.addEventListener('change',updateOutput));
  $('fillDispositivo').addEventListener('change',updateOutput);
  $('btnGenerate').addEventListener('click',generate);
  $('btnSave').addEventListener('click',saveDraft);
  $('btnRestore').addEventListener('click',restoreDraft);
  $('btnClear').addEventListener('click',clearForm);
  $('btnPrint').addEventListener('click',()=>{updateOutput();window.print();});
  $('btnCopy').addEventListener('click',copySummary);
  $('btnEmergency').addEventListener('click',()=>$('emergencyDialog').showModal());
  $('btnEmergencySave').addEventListener('click',registerEmergency);

  showProcedurePanel('');
  updateOutput();
  window.ORION_ARMONIZACION={version:'1.0.0',evaluateRisk,updateOutput,collectDraft};
})();
