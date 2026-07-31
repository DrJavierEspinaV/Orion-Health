(()=>{
  'use strict';

  const DRAFT_KEY='orion_armonizacion_draft_v11';
  const $=id=>document.getElementById(id);
  const $$=selector=>Array.from(document.querySelectorAll(selector));
  const SVG_NS='http://www.w3.org/2000/svg';
  const PROCEDURE_LABELS={
    toxina:'Toxina botulínica',relleno:'Ácido hialurónico / relleno',bioestimulador:'Bioestimulación',
    prp:'PRP / PRF',combinado:'Procedimiento combinado',otro:'Otro procedimiento estético'
  };
  const RISK_LABELS={
    embarazo:'Embarazo o lactancia',neuromuscular:'Enfermedad neuromuscular',sangrado:'Trastorno de coagulación',
    anticoagulante:'Anticoagulantes / antiagregantes',autoinmune:'Enfermedad autoinmune activa',
    inmunosupresion:'Inmunosupresión',infeccion:'Infección, herpes o inflamación activa',
    anafilaxia:'Anafilaxia o reacción grave previa',relleno_desconocido:'Relleno previo desconocido o permanente',
    dental_reciente:'Infección o procedimiento dental reciente',cicatrizacion:'Cicatrización patológica',
    expectativa:'Expectativa difícil o desproporcionada'
  };
  const ZONES={
    frente:{label:'Frente',center:[210,116],help:'Planificación frontal. La referencia debe corresponder al producto, anatomía, fuerza muscular y protocolo profesional.',presets:[[165,108,'F1'],[188,104,'F2'],[210,102,'F3'],[232,104,'F4'],[255,108,'F5']]},
    glabela:{label:'Glabela',center:[210,180],help:'Registrar corrugadores y prócer por punto. No aplicar equivalencias entre productos.',presets:[[180,184,'G1'],[195,170,'G2'],[210,186,'G3'],[225,170,'G4'],[240,184,'G5']]},
    periocular_d:{label:'Periocular derecho',center:[105,220],help:'Registrar puntos laterales derechos de forma individual.',presets:[[92,204,'PD1'],[84,220,'PD2'],[92,237,'PD3']]},
    periocular_i:{label:'Periocular izquierdo',center:[315,220],help:'Registrar puntos laterales izquierdos de forma individual.',presets:[[328,204,'PI1'],[336,220,'PI2'],[328,237,'PI3']]},
    nariz:{label:'Nariz / bunny lines',center:[210,274],help:'Uso y referencia configurados por la profesional según producto y evaluación anatómica.',presets:[[193,266,'N1'],[227,266,'N2']]},
    sonrisa:{label:'Sonrisa gingival / perioral',center:[210,350],help:'Registrar lado, objetivo y punto exacto. Referencia profesional obligatoria.',presets:[[188,344,'S1'],[232,344,'S2']]},
    dao_d:{label:'DAO derecho',center:[160,390],help:'Registrar lado derecho y objetivo funcional o estético.',presets:[[160,390,'DD1']]},
    dao_i:{label:'DAO izquierdo',center:[260,390],help:'Registrar lado izquierdo y objetivo funcional o estético.',presets:[[260,390,'DI1']]},
    menton:{label:'Mentón',center:[210,430],help:'Registrar distribución sobre mentoniano según evaluación clínica.',presets:[[198,428,'M1'],[222,428,'M2']]},
    masetero_d:{label:'Masetero derecho',center:[110,350],help:'Registrar puntos, profundidad, objetivo y referencia profesional del lado derecho.',presets:[[105,328,'MD1'],[110,354,'MD2'],[115,380,'MD3']]},
    masetero_i:{label:'Masetero izquierdo',center:[310,350],help:'Registrar puntos, profundidad, objetivo y referencia profesional del lado izquierdo.',presets:[[315,328,'MI1'],[310,354,'MI2'],[305,380,'MI3']]},
    platisma:{label:'Platisma / cuello',center:[210,510],help:'Registrar patrón, bandas y puntos planificados. Referencia profesional obligatoria.',presets:[[170,500,'P1'],[190,510,'P2'],[210,516,'P3'],[230,510,'P4'],[250,500,'P5']]}
  };

  const state={points:[],selectedZone:null,selectedPointId:null,zoneRefs:{},emergency:null};
  const fieldIds=[
    'p_nombre','p_rut','p_edad','p_telefono','motivo','alergias','antecedentes','procedimiento','producto','material','registro',
    'lote','vencimiento','proveedor','fechaProcedimiento','toxProfile','toxVialUnits','toxDilutionMl','toxDiluent','toxGraduationMl',
    'toxReconstitutedAt','toxReconstitutionNote','fillVolumen','fillZona','fillPlano','fillTecnica','fillDispositivo','fillCalibre',
    'fillMapa','otroNombre','otroCantidad','otroDetalle','profesional','registroProfesional','controlFecha','indicaciones','observaciones',
    'emergencyTime','emergencyNotes'
  ];

  function localDateTimeValue(date=new Date()){
    const pad=n=>String(n).padStart(2,'0');
    return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }
  if(!$('fechaProcedimiento').value)$('fechaProcedimiento').value=localDateTimeValue();
  if(!$('toxReconstitutedAt').value)$('toxReconstitutedAt').value=localDateTimeValue();

  function number(value){const parsed=Number.parseFloat(value);return Number.isFinite(parsed)?parsed:0;}
  function format(value,decimals=2){return Number.isFinite(value)?value.toLocaleString('es-CL',{minimumFractionDigits:0,maximumFractionDigits:decimals}):'—';}
  function selectedValues(containerSelector){return $$(`${containerSelector} input[type="checkbox"]:checked`).map(input=>input.value);}
  function procedure(){return $('procedimiento').value;}
  function setStatus(element,text,kind='neutral'){element.textContent=text;element.className=`status ${kind}`;}
  function uid(){return `pt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,7)}`;}

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
    evaluateRisk();
    if(key&&!$('indicaciones').value.trim())$('indicaciones').value=postCareText(key);
    updateAll();
  }

  function evaluateRisk(){
    const key=procedure();
    const selected=selectedValues('#riskChecks');
    const critical=[];const review=[];
    if(!key)review.push('Seleccionar el procedimiento antes de cerrar la evaluación.');
    if(selected.includes('infeccion'))critical.push('Infección, herpes o inflamación activa: posponer y reevaluar antes de inyectar.');
    if(selected.includes('anafilaxia'))critical.push('Antecedente de reacción grave: verificar producto, excipientes y plan de respuesta.');
    if(selected.includes('embarazo'))critical.push('Embarazo o lactancia: revisar seguridad específica y conducta clínica antes de continuar.');
    if((key==='toxina'||key==='combinado')&&selected.includes('neuromuscular'))critical.push('Enfermedad neuromuscular con toxina: requiere evaluación específica.');
    if((key==='relleno'||key==='combinado')&&selected.includes('relleno_desconocido'))critical.push('Relleno previo desconocido o permanente: precisar producto, zona y plano.');
    if((key==='relleno'||key==='combinado')&&!$('protocoloVascular').checked)critical.push('Protocolo de complicación vascular no confirmado.');
    if((key==='relleno'||key==='combinado')&&!$('derivacionUrgente').checked)critical.push('Ruta de derivación urgente no confirmada.');
    if((key==='relleno'||key==='combinado')&&!$('hialuronidasa').checked)review.push('Confirmar disponibilidad y vigencia de hialuronidasa cuando corresponda.');
    if(selected.includes('sangrado'))review.push('Cuantificar riesgo hemorrágico y adaptar técnica.');
    if(selected.includes('anticoagulante'))review.push('Registrar fármaco, dosis e indicación; no suspender sin coordinación con tratante.');
    if(selected.includes('autoinmune'))review.push('Revisar actividad de enfermedad y tratamiento actual.');
    if(selected.includes('inmunosupresion'))review.push('Valorar riesgo infeccioso y capacidad de cicatrización.');
    if(selected.includes('dental_reciente'))review.push('Relacionar fecha y condición odontogénica con el procedimiento.');
    if(selected.includes('cicatrizacion'))review.push('Registrar antecedente de queloide o cicatrización patológica.');
    if(selected.includes('expectativa'))review.push('Reformular objetivos y documentar expectativas.');

    const list=$('riskList');list.innerHTML='';
    [...critical,...review].forEach(text=>{const li=document.createElement('li');li.textContent=text;list.appendChild(li);});
    let kind='ok',badge='Sin alertas seleccionadas',intro='No se identificaron alertas en los campos marcados. Mantener evaluación clínica y revisión del producto.';
    if(review.length){kind='warn';badge='Revisión dirigida';intro='Existen antecedentes que requieren verificación y registro antes de finalizar.';}
    if(critical.length){kind='danger';badge='No continuar automáticamente';intro='Se identificaron condiciones críticas o elementos de preparación incompletos.';}
    $('riskPanel').className=`risk-panel ${kind}`;$('riskPanel').querySelector('p').textContent=intro;setStatus($('riskBadge'),badge,kind);
    return {kind,critical,review,selected};
  }

  function calculation(){
    const vial=number($('toxVialUnits').value);const dilution=number($('toxDilutionMl').value);const graduation=number($('toxGraduationMl').value);
    const concentration=vial>0&&dilution>0?vial/dilution:0;
    const planned=state.points.reduce((sum,p)=>sum+number(p.planned),0);
    const administered=state.points.reduce((sum,p)=>sum+number(p.administered),0);
    const remaining=Math.max(0,vial-administered);
    return {
      vial,dilution,graduation,concentration,planned,administered,remaining,
      perPointOne:concentration*.1,perPointZeroFive:concentration*.05,perGraduation:concentration*graduation,
      mlPerUnit:concentration>0?1/concentration:0,plannedMl:concentration>0?planned/concentration:0,administeredMl:concentration>0?administered/concentration:0
    };
  }

  function updateCalculation(){
    const c=calculation();const ready=c.vial>0&&c.dilution>0;
    $('metricConcentration').textContent=ready?format(c.concentration,3):'—';
    $('metricPointOne').textContent=ready?format(c.perPointOne,3):'—';
    $('metricPointZeroFive').textContent=ready?format(c.perPointZeroFive,3):'—';
    $('metricGraduation').textContent=ready?format(c.perGraduation,3):'—';
    $('metricMlPerUnit').textContent=ready?format(c.mlPerUnit,4):'—';
    $('metricRemaining').textContent=ready?format(c.remaining,2):'—';
    if(!ready){setStatus($('calcStatus'),'Cálculo pendiente','neutral');$('calculationNote').textContent='Ingresa unidades del vial y volumen de diluyente.';}
    else if(c.administered>c.vial){setStatus($('calcStatus'),'Administrado supera vial','danger');$('calculationNote').textContent='Revisar unidades administradas: el total supera las unidades declaradas del vial.';}
    else{setStatus($('calcStatus'),'Concentración calculada','ok');$('calculationNote').textContent=`${format(c.concentration,3)} U/mL · ${format(c.perGraduation,3)} U por cada graduación seleccionada. Total administrado: ${format(c.administered,2)} U.`;}
    updatePointEditorVolumes();
  }

  function volumeForUnits(units){const c=calculation();return c.concentration>0?number(units)/c.concentration:null;}

  function selectZone(zoneKey){
    if(!ZONES[zoneKey])return;
    state.selectedZone=zoneKey;state.selectedPointId=null;
    $$('.face-zone').forEach(node=>node.classList.toggle('active',node.dataset.zone===zoneKey));
    $('zoneName').textContent=ZONES[zoneKey].label;$('zoneHelp').textContent=ZONES[zoneKey].help;
    const ref=state.zoneRefs[zoneKey]||{};$('zoneRefMin').value=ref.min??'';$('zoneRefMax').value=ref.max??'';
    $('pointEditor').classList.add('hidden');
    renderMap();renderZoneSummary();renderTable();
  }

  function svgCoordinates(event){
    const svg=$('faceMap');const point=svg.createSVGPoint();point.x=event.clientX;point.y=event.clientY;
    const matrix=svg.getScreenCTM();if(!matrix)return ZONES[state.selectedZone]?.center||[210,280];
    const local=point.matrixTransform(matrix.inverse());return [Math.max(65,Math.min(355,local.x)),Math.max(55,Math.min(540,local.y))];
  }

  function addPoint(zoneKey,x,y,label=''){
    if(!ZONES[zoneKey])return;
    const count=state.points.filter(p=>p.zone===zoneKey).length+1;
    const point={id:uid(),zone:zoneKey,x:Number(x),y:Number(y),label:label||`${ZONES[zoneKey].label} ${count}`,planned:0,administered:0,state:'planned'};
    state.points.push(point);selectPoint(point.id);updateAll();
  }

  function selectPoint(id){
    const point=state.points.find(item=>item.id===id);if(!point)return;
    state.selectedZone=point.zone;state.selectedPointId=id;
    $$('.face-zone').forEach(node=>node.classList.toggle('active',node.dataset.zone===point.zone));
    $('zoneName').textContent=ZONES[point.zone].label;$('zoneHelp').textContent=ZONES[point.zone].help;
    const ref=state.zoneRefs[point.zone]||{};$('zoneRefMin').value=ref.min??'';$('zoneRefMax').value=ref.max??'';
    $('pointEditor').classList.remove('hidden');
    $('pointLabel').value=point.label;$('pointState').value=point.state;$('pointPlanned').value=point.planned||'';$('pointAdministered').value=point.administered||'';
    renderMap();renderZoneSummary();renderTable();updatePointEditorVolumes();
  }

  function currentPoint(){return state.points.find(item=>item.id===state.selectedPointId)||null;}
  function updateCurrentPoint(){
    const point=currentPoint();if(!point)return;
    point.label=$('pointLabel').value.trim()||point.label;point.state=$('pointState').value;
    point.planned=Math.max(0,number($('pointPlanned').value));point.administered=Math.max(0,number($('pointAdministered').value));
    if(point.administered>0&&point.state==='planned')point.state='administered';
    updateAll();
  }
  function updatePointEditorVolumes(){
    const point=currentPoint();if(!point){$('pointPlannedMl').textContent='—';$('pointAdministeredMl').textContent='—';return;}
    const planned=volumeForUnits(point.planned);const administered=volumeForUnits(point.administered);
    $('pointPlannedMl').textContent=planned===null?'—':`${format(planned,4)} mL`;
    $('pointAdministeredMl').textContent=administered===null?'—':`${format(administered,4)} mL`;
  }

  function renderMap(){
    const layer=$('pointLayer');layer.innerHTML='';
    state.points.forEach((point,index)=>{
      const g=document.createElementNS(SVG_NS,'g');g.classList.add('map-point',point.state);if(point.id===state.selectedPointId)g.classList.add('selected');g.dataset.pointId=point.id;
      const circle=document.createElementNS(SVG_NS,'circle');circle.setAttribute('cx',point.x);circle.setAttribute('cy',point.y);circle.setAttribute('r','10');
      const text=document.createElementNS(SVG_NS,'text');text.setAttribute('x',point.x);text.setAttribute('y',point.y+.5);text.textContent=String(index+1);
      g.append(circle,text);g.addEventListener('click',event=>{event.stopPropagation();selectPoint(point.id);});layer.appendChild(g);
    });
  }

  function renderZoneSummary(){
    const zone=state.selectedZone;if(!zone){$('zonePlannedTotal').textContent='0 U';$('zoneAdminTotal').textContent='0 U';$('zonePointCount').textContent='0';setStatus($('zoneStatus'),'Sin referencia','neutral');return;}
    const points=state.points.filter(p=>p.zone===zone);const planned=points.reduce((sum,p)=>sum+number(p.planned),0);const admin=points.reduce((sum,p)=>sum+number(p.administered),0);const ref=state.zoneRefs[zone];
    $('zonePlannedTotal').textContent=`${format(planned,2)} U`;$('zoneAdminTotal').textContent=`${format(admin,2)} U`;$('zonePointCount').textContent=String(points.length);
    if(!ref||!Number.isFinite(ref.min)||!Number.isFinite(ref.max)){setStatus($('zoneStatus'),'Sin referencia','neutral');}
    else if(planned<ref.min||planned>ref.max){setStatus($('zoneStatus'),`Fuera de ${format(ref.min)}–${format(ref.max)} U`,'warn');}
    else{setStatus($('zoneStatus'),`Dentro de ${format(ref.min)}–${format(ref.max)} U`,'ok');}
  }

  function renderTable(){
    const tbody=$('pointsTableBody');tbody.innerHTML='';const c=calculation();
    if(!state.points.length){tbody.innerHTML='<tr><td colspan="6" class="empty-cell">Aún no se han agregado puntos.</td></tr>';}
    state.points.forEach(point=>{
      const tr=document.createElement('tr');tr.dataset.pointId=point.id;if(point.id===state.selectedPointId)tr.classList.add('active');
      const ml=c.concentration>0?`${format(point.administered/c.concentration,4)} mL`:'—';
      tr.innerHTML=`<td>${ZONES[point.zone]?.label||point.zone}</td><td>${escapeHtml(point.label)}</td><td>${format(point.planned,2)} U</td><td>${format(point.administered,2)} U</td><td>${ml}</td><td>${point.state==='administered'?'Administrado':point.state==='omitted'?'Omitido':'Planificado'}</td>`;
      tr.addEventListener('click',()=>selectPoint(point.id));tbody.appendChild(tr);
    });
    $('pointTotals').textContent=`${state.points.length} puntos · ${format(c.planned,2)} U planificadas · ${format(c.administered,2)} U administradas`;
  }

  function escapeHtml(value){return String(value??'').replace(/[&<>'"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));}

  function applyZoneReference(){
    const zone=state.selectedZone;if(!zone)return;
    const min=number($('zoneRefMin').value),max=number($('zoneRefMax').value);
    if(max<=0||max<min){setStatus($('zoneStatus'),'Referencia inválida','danger');return;}
    state.zoneRefs[zone]={min,max,source:'Configurada por profesional'};renderZoneSummary();updateOutput();
  }

  function addPresetPoints(){
    const zone=state.selectedZone;if(!zone)return;
    const existing=state.points.filter(p=>p.zone===zone).length;
    if(existing&&!confirm('La zona ya contiene puntos. ¿Agregar también el mapa base?'))return;
    ZONES[zone].presets.forEach(([x,y,label])=>state.points.push({id:uid(),zone,x,y,label,planned:0,administered:0,state:'planned'}));
    const last=state.points[state.points.length-1];if(last)selectPoint(last.id);updateAll();
  }

  function riskSummary(result=evaluateRisk()){
    const selectedText=result.selected.length?result.selected.map(value=>RISK_LABELS[value]||value).join('; '):'Ningún antecedente marcado';
    const lines=[`Nivel ORION: ${$('riskBadge').textContent}.`,`Antecedentes seleccionados: ${selectedText}.`];
    if($('alergias').value.trim())lines.push(`Alergias/reacciones: ${$('alergias').value.trim()}`);
    if($('antecedentes').value.trim())lines.push(`Antecedentes/medicamentos: ${$('antecedentes').value.trim()}`);
    if(result.critical.length)lines.push('Alertas críticas:',...result.critical.map(text=>`• ${text}`));
    if(result.review.length)lines.push('Revisión dirigida:',...result.review.map(text=>`• ${text}`));
    return lines.join('\n');
  }

  function productSummary(){
    const key=procedure();const common=[
      `Procedimiento: ${PROCEDURE_LABELS[key]||'No seleccionado'}`,
      `Producto / marca: ${$('producto').value.trim()||'No registrado'}`,
      `Principio activo / material: ${$('material').value.trim()||'No registrado'}`,
      `Registro sanitario / referencia: ${$('registro').value.trim()||'No registrado'}`,
      `Lote: ${$('lote').value.trim()||'No registrado'}`,
      `Vencimiento: ${$('vencimiento').value||'No registrado'}`,
      `Proveedor: ${$('proveedor').value.trim()||'No registrado'}`,
      `Fecha/hora: ${$('fechaProcedimiento').value||'No registrada'}`
    ];
    if(key==='relleno'||key==='combinado')common.push('', 'RELLENO / ÁCIDO HIALURÓNICO',
      `Volumen total: ${$('fillVolumen').value?$('fillVolumen').value+' mL':'No registrado'}`,
      `Zona: ${$('fillZona').value.trim()||'No registrada'}`,`Plano: ${$('fillPlano').value.trim()||'No registrado'}`,
      `Técnica: ${$('fillTecnica').value.trim()||'No registrada'}`,`Dispositivo: ${$('fillDispositivo').value||'No registrado'} ${$('fillCalibre').value.trim()||''}`.trim(),
      `Distribución / mapa: ${$('fillMapa').value.trim()||'No registrado'}`,
      `Preparación de seguridad: hialuronidasa ${$('hialuronidasa').checked?'confirmada':'no confirmada'}; protocolo vascular ${$('protocoloVascular').checked?'confirmado':'no confirmado'}; derivación urgente ${$('derivacionUrgente').checked?'confirmada':'no confirmada'}.`
    );
    if(['bioestimulador','prp','combinado','otro'].includes(key))common.push('', 'DETALLE ADICIONAL',
      `Tratamiento: ${$('otroNombre').value.trim()||'No registrado'}`,`Cantidad / sesiones: ${$('otroCantidad').value.trim()||'No registrada'}`,`Técnica / zonas: ${$('otroDetalle').value.trim()||'No registradas'}`
    );
    return common.join('\n');
  }

  function toxinCalculationSummary(){
    const c=calculation();if(!c.vial||!c.dilution)return 'Cálculo pendiente: registrar unidades del vial y volumen de diluyente.';
    const refs=Object.entries(state.zoneRefs).map(([zone,ref])=>`${ZONES[zone]?.label||zone}: ${format(ref.min)}–${format(ref.max)} U (referencia configurada por profesional)`).join('\n');
    return [
      `Perfil: ${$('toxProfile').selectedOptions[0]?.textContent||'Manual'}`,
      `Diluyente: ${$('toxDiluent').value.trim()||'No registrado'}`,
      `Vial: ${format(c.vial,2)} U · Dilución: ${format(c.dilution,3)} mL`,
      `Concentración: ${format(c.concentration,3)} U/mL`,
      `0,10 mL = ${format(c.perPointOne,3)} U · 0,05 mL = ${format(c.perPointZeroFive,3)} U`,
      `Graduación seleccionada (${format(c.graduation,3)} mL) = ${format(c.perGraduation,3)} U`,
      `Volumen por 1 U = ${format(c.mlPerUnit,4)} mL`,
      `Total planificado: ${format(c.planned,2)} U (${format(c.plannedMl,4)} mL)`,
      `Total administrado: ${format(c.administered,2)} U (${format(c.administeredMl,4)} mL)`,
      `Remanente matemático: ${format(c.remaining,2)} U`,
      `Reconstitución: ${$('toxReconstitutedAt').value||'No registrada'} · ${$('toxReconstitutionNote').value.trim()||'Sin observación'}`,
      refs?`Referencias por zona:\n${refs}`:'Referencias por zona: no configuradas.',
      'Advertencia: cálculo matemático vinculado exclusivamente al producto declarado; no implica equivalencia con otras marcas ni selección automática de dosis.'
    ].join('\n');
  }

  function consentSummary(){
    const values=selectedValues('#consentChecks');const total=$$('#consentChecks input[type="checkbox"]').length;
    return `Ítems confirmados: ${values.length} de ${total}.\nFotografía para documento clínico: ${values.includes('foto_clinica')?'Autorizada':'No registrada'}.\nDifusión: ${values.includes('foto_difusion')?'Autorizada mediante selección independiente':'No autorizada / no registrada'}.\nProfesional: ${$('profesional').value.trim()||'No registrado'}.\nRegistro profesional: ${$('registroProfesional').value.trim()||'No registrado'}.\nControl: ${$('controlFecha').value||'No programado'}.`;
  }

  function postCareText(key){
    const urgent='Ante dificultad para respirar o tragar, alteración visual, síntomas neurológicos o compromiso general, buscar atención de urgencia inmediata.';
    const toxin=`INDICACIONES POSTERIORES — TOXINA BOTULÍNICA\n• No frotar ni manipular intensamente las zonas tratadas durante las primeras horas, salvo instrucción profesional.\n• Puede aparecer dolor local, enrojecimiento, edema leve o equimosis.\n• El efecto se instala progresivamente; la evaluación definitiva y cualquier retoque se realizan en el control indicado.\n• Consultar ante asimetría marcada, ptosis, diplopía, debilidad fuera del área tratada, disfonía, disfagia o dificultad respiratoria.\n\n${urgent}`;
    const filler=`INDICACIONES POSTERIORES — RELLENO / ÁCIDO HIALURÓNICO\n• Es esperable edema, sensibilidad o equimosis durante los primeros días.\n• Aplicar frío local suave si fue indicado; no comprimir ni masajear el producto salvo instrucción profesional.\n• Consultar de inmediato ante dolor inusual o creciente, piel blanca/gris/azulada, patrón reticulado, frialdad, ampollas, alteración visual, cefalea intensa o síntomas neurológicos.\n\n${urgent}`;
    const general=`INDICACIONES POSTERIORES — PROCEDIMIENTO ESTÉTICO\n• Cumplir las instrucciones específicas del producto, la técnica y la zona tratada.\n• No manipular intensamente el área ni realizar otros procedimientos sin autorización profesional.\n• Consultar ante dolor progresivo, infección, cambio de coloración, alteración visual, síntomas neurológicos o compromiso general.\n\n${urgent}`;
    if(key==='toxina')return toxin;if(key==='relleno')return filler;if(key==='combinado')return `${toxin}\n\n${filler}`;return general;
  }

  function renderPrintMap(){
    const target=$('printFaceMap');const source=$('faceMap');target.innerHTML=source.innerHTML;
    target.querySelectorAll('.face-zone').forEach(zone=>zone.classList.remove('active'));
    target.querySelectorAll('.map-point').forEach(point=>point.classList.remove('selected'));
  }

  function renderOutputPoints(){
    const tbody=$('outPointsBody');tbody.innerHTML='';const c=calculation();
    state.points.forEach(point=>{
      const tr=document.createElement('tr');const ml=c.concentration>0?`${format(point.administered/c.concentration,4)} mL`:'—';
      tr.innerHTML=`<td>${ZONES[point.zone]?.label||point.zone}</td><td>${escapeHtml(point.label)}</td><td>${format(point.planned,2)} U</td><td>${format(point.administered,2)} U</td><td>${ml}</td>`;tbody.appendChild(tr);
    });
  }

  function updateOutput(){
    const key=procedure();const risk=evaluateRisk();
    $('outFecha').textContent=new Date().toLocaleString('es-CL');$('outNombre').textContent=$('p_nombre').value.trim()||'—';$('outRut').textContent=$('p_rut').value.trim()||'—';$('outEdad').textContent=$('p_edad').value?`${$('p_edad').value} años`:'—';$('outTelefono').textContent=$('p_telefono').value.trim()||'—';$('outMotivo').textContent=$('motivo').value.trim()||'—';
    $('outRisk').textContent=riskSummary(risk);$('outProcedure').textContent=productSummary();$('outConsent').textContent=consentSummary();$('outCare').textContent=$('indicaciones').value.trim()||'Sin indicaciones registradas.';
    const observations=[$('observaciones').value.trim(),state.emergency?`ALERTA CLÍNICA\nInicio: ${state.emergency.time||'No registrado'}\n${state.emergency.notes||'Sin detalle'}`:''].filter(Boolean).join('\n\n');$('outObservations').textContent=observations||'Sin observaciones registradas.';$('outProfessional').textContent=$('profesional').value.trim()||'Profesional tratante';
    const toxinVisible=key==='toxina'||key==='combinado';$('outToxinCalculationSection').classList.toggle('hidden',!toxinVisible);$('outPointsSection').classList.toggle('hidden',!toxinVisible||!state.points.length);
    if(toxinVisible){$('outToxinCalculation').textContent=toxinCalculationSummary();renderPrintMap();renderOutputPoints();}
  }

  function updateAll(){updatePatientStatus();updateCalculation();renderMap();renderZoneSummary();renderTable();updateOutput();}

  function serialize(){
    const fields={};fieldIds.forEach(id=>{const element=$(id);if(element)fields[id]=element.value;});
    const checks={};$$('input[type="checkbox"]').forEach(input=>checks[input.id||`${input.closest('[id]')?.id||'check'}:${input.value}`]=input.checked);
    return {version:11,fields,checks,points:state.points,selectedZone:state.selectedZone,zoneRefs:state.zoneRefs,emergency:state.emergency,ts:Date.now()};
  }

  function saveDraft(){sessionStorage.setItem(DRAFT_KEY,JSON.stringify(serialize()));setStatus($('procedureStatus'),'Borrador guardado','ok');}
  function restoreDraft(){
    try{
      const saved=JSON.parse(sessionStorage.getItem(DRAFT_KEY)||'null');if(!saved)return alert('No existe un borrador de esta sesión.');
      Object.entries(saved.fields||{}).forEach(([id,value])=>{if($(id))$(id).value=value;});
      $$('input[type="checkbox"]').forEach(input=>{const key=input.id||`${input.closest('[id]')?.id||'check'}:${input.value}`;if(Object.prototype.hasOwnProperty.call(saved.checks||{},key))input.checked=!!saved.checks[key];});
      state.points=Array.isArray(saved.points)?saved.points:[];state.selectedZone=saved.selectedZone&&ZONES[saved.selectedZone]?saved.selectedZone:null;state.selectedPointId=null;state.zoneRefs=saved.zoneRefs||{};state.emergency=saved.emergency||null;
      showProcedurePanel(procedure());if(state.selectedZone)selectZone(state.selectedZone);updateAll();
    }catch(error){console.error(error);alert('No fue posible recuperar el borrador.');}
  }

  function clearAll(){
    if(!confirm('¿Limpiar los datos, cálculos y puntos de esta sesión?'))return;
    fieldIds.forEach(id=>{const el=$(id);if(!el)return;if(['profesional'].includes(id))return;el.value='';});
    $$('input[type="checkbox"]').forEach(input=>input.checked=false);state.points=[];state.selectedZone=null;state.selectedPointId=null;state.zoneRefs={};state.emergency=null;$('procedimiento').value='';$('profesional').value='Dra. Pía Coronado Madariaga';$('fechaProcedimiento').value=localDateTimeValue();$('toxReconstitutedAt').value=localDateTimeValue();sessionStorage.removeItem(DRAFT_KEY);showProcedurePanel('');updateAll();
  }

  function documentText(){
    return [
      'ORION ARMONIZACIÓN OROFACIAL — DOCUMENTO CLÍNICO V1.1',
      `Paciente: ${$('outNombre').textContent} · RUN/RUT: ${$('outRut').textContent} · Edad: ${$('outEdad').textContent}`,
      `Objetivo: ${$('outMotivo').textContent}`,'',
      'EVALUACIÓN DE SEGURIDAD',$('outRisk').textContent,'','PRODUCTO Y PROCEDIMIENTO',$('outProcedure').textContent,
      (procedure()==='toxina'||procedure()==='combinado')?'\nCÁLCULO DE RECONSTITUCIÓN\n'+$('outToxinCalculation').textContent:'',
      state.points.length?'\nPUNTOS\n'+state.points.map(point=>`${ZONES[point.zone]?.label||point.zone} · ${point.label} · plan ${format(point.planned)} U · administrado ${format(point.administered)} U`).join('\n'):'',
      '\nCONSENTIMIENTO',$('outConsent').textContent,'','INDICACIONES',$('outCare').textContent,'','OBSERVACIONES',$('outObservations').textContent
    ].filter(Boolean).join('\n');
  }

  $$('#procedurePicker button').forEach(button=>button.addEventListener('click',()=>{$('procedimiento').value=button.dataset.procedure;showProcedurePanel(button.dataset.procedure);}));
  $$('#riskChecks input, #consentChecks input, .readiness input').forEach(input=>input.addEventListener('change',updateAll));
  ['p_nombre','p_rut','p_edad'].forEach(id=>$(id)?.addEventListener('input',updatePatientStatus));
  fieldIds.forEach(id=>$(id)?.addEventListener('input',updateAll));
  ['toxGraduationMl','toxProfile','fillDispositivo'].forEach(id=>$(id)?.addEventListener('change',updateAll));

  $$('.face-zone').forEach(zone=>{
    const select=event=>{event.preventDefault();const key=zone.dataset.zone;if(state.selectedZone===key&&event.type==='click'){const [x,y]=svgCoordinates(event);addPoint(key,x,y);}else selectZone(key);};
    zone.addEventListener('click',select);zone.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();selectZone(zone.dataset.zone);}});
  });
  $('faceMap').addEventListener('click',event=>{if(event.target.closest('.face-zone,.map-point'))return;if(!state.selectedZone)return;const [x,y]=svgCoordinates(event);addPoint(state.selectedZone,x,y);});
  $('btnApplyReference').addEventListener('click',applyZoneReference);$('btnAddPresetPoints').addEventListener('click',addPresetPoints);
  $('btnClearPoints').addEventListener('click',()=>{if(state.points.length&&confirm('¿Eliminar todos los puntos del mapa?')){state.points=[];state.selectedPointId=null;$('pointEditor').classList.add('hidden');updateAll();}});
  ['pointLabel','pointPlanned','pointAdministered'].forEach(id=>$(id).addEventListener('input',updateCurrentPoint));$('pointState').addEventListener('change',updateCurrentPoint);
  $('btnDeletePoint').addEventListener('click',()=>{if(!state.selectedPointId)return;state.points=state.points.filter(point=>point.id!==state.selectedPointId);state.selectedPointId=null;$('pointEditor').classList.add('hidden');updateAll();});
  $('btnGenerate').addEventListener('click',()=>{if(!$('indicaciones').value.trim())$('indicaciones').value=postCareText(procedure());updateAll();$('printSheet').scrollIntoView({behavior:'smooth',block:'start'});});
  $('btnSave').addEventListener('click',saveDraft);$('btnRestore').addEventListener('click',restoreDraft);$('btnClear').addEventListener('click',clearAll);
  $('btnPrint').addEventListener('click',()=>{updateAll();window.print();});
  $('btnCopy').addEventListener('click',async()=>{updateAll();try{await navigator.clipboard.writeText(documentText());const old=$('btnCopy').textContent;$('btnCopy').textContent='Resumen copiado';setTimeout(()=>$('btnCopy').textContent=old,1500);}catch(_){alert('No fue posible copiar automáticamente.');}});
  $('btnEmergency').addEventListener('click',()=>{$('emergencyTime').value=localDateTimeValue();$('emergencyDialog').showModal();});
  $('btnSaveEmergency').addEventListener('click',()=>{state.emergency={time:$('emergencyTime').value,notes:$('emergencyNotes').value.trim()};updateOutput();});

  window.ORION_AESTHETIC_V11={version:'1.1.0',calculation,selectZone,addPoint,getState:()=>typeof structuredClone==='function'?structuredClone(state):JSON.parse(JSON.stringify(state))};
  showProcedurePanel('');updateAll();
})();
