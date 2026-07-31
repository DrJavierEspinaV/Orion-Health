(()=>{
  'use strict';

  const API=window.ORION_AESTHETIC_V11;
  if(!API){console.error('ORION V1.2: no se encontró la base V1.1');return;}

  const KEY='orion_armonizacion_enhancement_v12';
  const $=id=>document.getElementById(id);
  const $$=selector=>Array.from(document.querySelectorAll(selector));
  const modelLabels={woman:'Mujer',man:'Hombre'};
  const lineLabels={both:'Activas + pasivas',active:'Activas',passive:'Pasivas'};
  const state={model:'woman',lineMode:'both',selectedZone:null,studies:{}};

  const zones={
    frente:{label:'Frente',woman:'En mujer suele buscarse suavizar la contracción manteniendo naturalidad de la cola de la ceja y evitando pesadez.',man:'En hombre suele privilegiarse un aplanamiento controlado y una ceja más horizontal, evitando alterar el carácter facial.',active:'Evaluar líneas horizontales durante elevación máxima y compensación glabelar.',passive:'Evaluar huellas en reposo, calidad de piel y posición basal de las cejas.'},
    glabela:{label:'Glabela',woman:'Analizar corrugadores y prócer buscando suavizar la expresión sin comprometer el balance con la frente.',man:'Considerar mayor masa muscular y una relajación que disminuya severidad sin borrar identidad.',active:'Registrar patrón de contracción, dominancia lateral y profundidad dinámica.',passive:'Registrar surcos persistentes y quiebre central en reposo.'},
    periocular_d:{label:'Periocular derecho',woman:'Buscar suavización lateral conservando una sonrisa fresca y simétrica.',man:'Planificar de forma conservadora para mantener naturalidad de la expresión.',active:'Evaluar abanico durante sonrisa amplia y cierre palpebral.',passive:'Valorar líneas residuales, soporte cutáneo y asimetría basal.'},
    periocular_i:{label:'Periocular izquierdo',woman:'Comparar con lado derecho y registrar dominancia de sonrisa.',man:'Comparar con lado derecho y conservar simetría funcional.',active:'Evaluar abanico durante sonrisa amplia y cierre palpebral.',passive:'Valorar líneas residuales, soporte cutáneo y asimetría basal.'},
    nariz:{label:'Nariz / bunny lines',woman:'Relacionar la contracción nasal con sonrisa gingival y armonía del tercio medio.',man:'Registrar compensación nasal evitando modificar en exceso la mímica.',active:'Observar líneas laterales al sonreír o fruncir la nariz.',passive:'Registrar pliegues persistentes en reposo.'},
    sonrisa:{label:'Sonrisa gingival / perioral',woman:'Analizar exposición gingival, elevación del labio y longitud labial en reposo.',man:'Analizar elevación labial, exposición dental y asimetría de sonrisa.',active:'Registrar exposición gingival y tracción dinámica por lado.',passive:'Registrar sello labial, soporte y posición en reposo.'},
    dao_d:{label:'DAO derecho',woman:'Revisar descenso comisural derecho y balance con mentón y sonrisa.',man:'Revisar descenso comisural y tono perioral derecho.',active:'Analizar descenso dinámico de la comisura.',passive:'Analizar pliegue comisural y soporte del tercio inferior.'},
    dao_i:{label:'DAO izquierdo',woman:'Revisar descenso comisural izquierdo y compensación contralateral.',man:'Revisar descenso comisural y tono perioral izquierdo.',active:'Analizar descenso dinámico de la comisura.',passive:'Analizar pliegue comisural y soporte del tercio inferior.'},
    menton:{label:'Mentón',woman:'Registrar contracción del mentoniano, hoyuelos y competencia labial.',man:'Registrar mentoniano, eversión labial y participación del tercio inferior.',active:'Evaluar actividad durante sello labial, habla y máxima contracción.',passive:'Evaluar textura persistente, pliegues y forma en reposo.'},
    masetero_d:{label:'Masetero derecho',woman:'Valorar volumen, afinamiento buscado y componente funcional cuando corresponda.',man:'Valorar hipertrofia respetando una mandíbula estructurada y la función.',active:'Palpar contracción máxima, dolor y predominio lateral.',passive:'Valorar contorno basal y ángulo mandibular en reposo.'},
    masetero_i:{label:'Masetero izquierdo',woman:'Comparar volumen con lado derecho y documentar asimetría.',man:'Comparar hipertrofia con lado derecho y documentar predominio.',active:'Palpar contracción máxima, dolor y predominio lateral.',passive:'Valorar contorno basal y ángulo mandibular en reposo.'},
    platisma:{label:'Platisma / cuello',woman:'Analizar bandas, transición mentocervical y predominio dinámico.',man:'Analizar bandas y su efecto sobre el contorno cervical.',active:'Solicitar activación cervical y registrar bandas predominantes.',passive:'Registrar laxitud y bandas visibles en reposo.'}
  };

  function modelSvg(){
    return `
      <defs>
        <linearGradient id="v12SkinWoman" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#faeee7"/><stop offset="100%" stop-color="#ead5c9"/></linearGradient>
        <linearGradient id="v12SkinMan" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#ecdccf"/><stop offset="100%" stop-color="#d7c1b4"/></linearGradient>
      </defs>
      <g id="v12Woman" class="v12-face-figure active">
        <path d="M210 38C133 38 88 101 86 198c-2 105 38 229 124 304 86-75 126-199 124-304-2-97-47-160-124-160z" fill="url(#v12SkinWoman)" stroke="#ae8c7b" stroke-width="2"/>
        <path d="M120 145c19-67 54-105 90-117 36 12 71 50 90 117" fill="none" stroke="#70544e" stroke-width="20" stroke-linecap="round" opacity=".92"/>
        <path d="M126 190q32-24 66-4M228 186q34-20 66 4" fill="none" stroke="#80665b" stroke-width="4" stroke-linecap="round"/>
        <path d="M126 218q31-19 62 0-31 25-62 0M232 218q31-19 62 0-31 25-62 0" fill="#fff" stroke="#8b7064" stroke-width="1.8"/>
        <circle cx="158" cy="218" r="8" fill="#4d3c39"/><circle cx="262" cy="218" r="8" fill="#4d3c39"/>
        <path d="M210 225c-7 47-10 74-24 96 15 11 33 11 48 0-14-22-17-49-24-96" fill="none" stroke="#98786a" stroke-width="2"/>
        <path d="M160 368q50-30 100 0-50 38-100 0" fill="none" stroke="#b56c69" stroke-width="3"/>
        <path d="M120 322q18 100 90 160 72-60 90-160" fill="none" stroke="#b5907f" stroke-width="1.5"/>
        <g class="v12-expression-passive" fill="none" stroke="#6d8192" stroke-width="1.4" opacity=".7"><path d="M165 115h90"/><path d="M145 196q18-12 38-10"/><path d="M237 186q20-2 38 10"/><path d="M120 222q-22 8-33 25"/><path d="M300 222q22 8 33 25"/><path d="M184 340q13 8 26 7M210 347q13 1 26-7"/></g>
        <g class="v12-expression-active" fill="none" stroke="#3f5669" stroke-width="2" stroke-dasharray="5 5"><path d="M158 99h104"/><path d="M184 173q9-17 26-17M210 156q17 0 26 17"/><path d="M210 158v37"/><path d="M115 208q-25 14-32 43M305 208q25 14 32 43"/><path d="M178 335q16 14 32 14M210 349q16 0 32-14"/></g>
      </g>
      <g id="v12Man" class="v12-face-figure">
        <path d="M210 34C128 34 82 101 82 202c0 110 42 233 128 305 86-72 128-195 128-305 0-101-46-168-128-168z" fill="url(#v12SkinMan)" stroke="#9e7c6e" stroke-width="2"/>
        <path d="M116 138c18-57 53-96 94-117 41 21 76 60 94 117" fill="none" stroke="#51403b" stroke-width="24" stroke-linecap="round"/>
        <path d="M122 187q35-25 72-5M226 182q37-20 72 5" fill="none" stroke="#5a4741" stroke-width="7" stroke-linecap="round"/>
        <path d="M123 220q34-20 66 0-32 25-66 0M231 220q32-20 66 0-34 25-66 0" fill="#fff" stroke="#80655b" stroke-width="1.9"/>
        <circle cx="158" cy="220" r="9" fill="#392d2a"/><circle cx="262" cy="220" r="9" fill="#392d2a"/>
        <path d="M210 226c-8 49-11 76-25 99 16 11 34 11 50 0-14-23-17-50-25-99" fill="none" stroke="#8d6e61" stroke-width="2.2"/>
        <path d="M160 374q50-25 100 0-50 31-100 0" fill="none" stroke="#8c5955" stroke-width="3"/>
        <path d="M112 317q17 107 98 169 81-62 98-169" fill="none" stroke="#a58173" stroke-width="1.8"/>
        <g class="v12-expression-passive" fill="none" stroke="#6d8192" stroke-width="1.5" opacity=".72"><path d="M158 119h104"/><path d="M140 197q21-14 43-12"/><path d="M237 185q22-2 43 12"/><path d="M116 224q-24 8-37 27"/><path d="M304 224q24 8 37 27"/><path d="M184 344q13 8 26 8M210 352q13 0 26-8"/></g>
        <g class="v12-expression-active" fill="none" stroke="#3f5669" stroke-width="2.2" stroke-dasharray="5 5"><path d="M153 103h114"/><path d="M181 171q10-18 29-18M210 153q19 0 29 18"/><path d="M210 155v42"/><path d="M110 209q-28 15-36 46M310 209q28 15 36 46"/><path d="M176 339q17 15 34 15M210 354q17 0 34-15"/></g>
      </g>
      <g class="v12-zone-layer">
        <g class="face-zone" data-zone="frente" tabindex="0"><rect x="122" y="74" width="176" height="78" rx="34"/><text x="210" y="117">Frente</text></g>
        <g class="face-zone" data-zone="glabela" tabindex="0"><ellipse cx="210" cy="180" rx="42" ry="32"/><text x="210" y="184">Glabela</text></g>
        <g class="face-zone" data-zone="periocular_d" tabindex="0"><ellipse cx="106" cy="220" rx="42" ry="45"/><text x="106" y="224">Perioc. D</text></g>
        <g class="face-zone" data-zone="periocular_i" tabindex="0"><ellipse cx="314" cy="220" rx="42" ry="45"/><text x="314" y="224">Perioc. I</text></g>
        <g class="face-zone" data-zone="nariz" tabindex="0"><ellipse cx="210" cy="274" rx="36" ry="52"/><text x="210" y="278">Nariz</text></g>
        <g class="face-zone" data-zone="sonrisa" tabindex="0"><rect x="166" y="326" width="88" height="48" rx="22"/><text x="210" y="354">Sonrisa</text></g>
        <g class="face-zone" data-zone="dao_d" tabindex="0"><ellipse cx="160" cy="390" rx="30" ry="32"/><text x="160" y="394">DAO D</text></g>
        <g class="face-zone" data-zone="dao_i" tabindex="0"><ellipse cx="260" cy="390" rx="30" ry="32"/><text x="260" y="394">DAO I</text></g>
        <g class="face-zone" data-zone="menton" tabindex="0"><ellipse cx="210" cy="430" rx="42" ry="36"/><text x="210" y="434">Mentón</text></g>
        <g class="face-zone" data-zone="masetero_d" tabindex="0"><ellipse cx="110" cy="350" rx="38" ry="70"/><text x="110" y="354">Maset. D</text></g>
        <g class="face-zone" data-zone="masetero_i" tabindex="0"><ellipse cx="310" cy="350" rx="38" ry="70"/><text x="310" y="354">Maset. I</text></g>
        <g class="face-zone" data-zone="platisma" tabindex="0"><rect x="145" y="476" width="130" height="70" rx="28"/><text x="210" y="514">Platisma</text></g>
      </g>
      <g id="pointLayer"></g>`;
  }

  function field(label,id,control){return `<label class="field">${label}${control.replace('{id}',id)}</label>`;}

  function installPatientStudy(){
    const firstGrid=document.querySelector('main > section.card .grid.grid-4');
    if(!firstGrid||$('v12PatientSex'))return;
    const wrap=document.createElement('div');
    wrap.className='grid grid-4 span-4 v12-study-grid';
    wrap.innerHTML=
      field('Paciente / referencia facial','v12PatientSex','<select id="{id}"><option value="mujer">Mujer</option><option value="hombre">Hombre</option><option value="otro">Otro / no especificado</option></select>')+
      field('Patrón facial','v12FacialPattern','<select id="{id}"><option value="equilibrado">Equilibrado</option><option value="tercio_superior">Predominio tercio superior</option><option value="tercio_medio">Predominio tercio medio</option><option value="tercio_inferior">Predominio tercio inferior</option><option value="maseterico">Masetérico / cuadrado</option><option value="alargado">Alargado</option></select>')+
      field('Dinámica predominante','v12DynamicStudy','<select id="{id}"><option value="mixta">Mixta</option><option value="activa">Líneas activas</option><option value="pasiva">Líneas pasivas</option></select>')+
      field('Expresión / tono muscular','v12MuscleTone','<select id="{id}"><option value="moderado">Moderado</option><option value="leve">Leve</option><option value="alto">Alto</option><option value="asimetrico">Asimétrico</option></select>');
    firstGrid.appendChild(wrap);
  }

  function installToolbarAndMap(){
    const map=$('faceMap');
    if(!map||$('v12FaceToolbar'))return;
    const toolbar=document.createElement('div');
    toolbar.id='v12FaceToolbar';toolbar.className='v12-face-toolbar';
    toolbar.innerHTML=`<div class="v12-toolbar-group"><span class="v12-toolbar-label">Modelo facial</span><button type="button" class="v12-seg active" data-model="woman">Mujer</button><button type="button" class="v12-seg" data-model="man">Hombre</button></div><div class="v12-toolbar-group"><span class="v12-toolbar-label">Líneas visibles</span><button type="button" class="v12-seg active" data-lines="both">Activas + pasivas</button><button type="button" class="v12-seg" data-lines="active">Activas</button><button type="button" class="v12-seg" data-lines="passive">Pasivas</button></div>`;
    const note=document.createElement('p');note.id='v12ModelNote';note.className='v12-model-note';
    map.parentNode.insertBefore(toolbar,map);
    map.parentNode.insertBefore(note,map);
    map.innerHTML=modelSvg();
    document.body.dataset.v12Lines='both';

    toolbar.querySelectorAll('[data-model]').forEach(button=>button.addEventListener('click',()=>setModel(button.dataset.model)));
    toolbar.querySelectorAll('[data-lines]').forEach(button=>button.addEventListener('click',()=>setLineMode(button.dataset.lines)));
    bindZones();
  }

  function installZoneStudy(){
    const editor=document.querySelector('.zone-editor-card');
    if(!editor||$('v12ZoneStudy'))return;
    const study=document.createElement('div');study.id='v12ZoneStudy';study.className='v12-zone-study';
    study.innerHTML=`<h5>Estudio clínico de la zona</h5><p class="v12-zone-context" id="v12ZoneContext">Selecciona una zona para cargar su análisis.</p><div class="grid grid-2"><label class="field">Tipo de línea principal<select id="v12ZoneLine"><option value="mixta">Mixta</option><option value="activa">Activa</option><option value="pasiva">Pasiva</option></select></label><label class="field">Simetría / lateralidad<select id="v12ZoneSymmetry"><option value="simetrica">Simétrica</option><option value="derecha_predomina">Predomina derecha</option><option value="izquierda_predomina">Predomina izquierda</option><option value="asimetrica">Asimétrica</option></select></label><label class="field span-2">Hallazgos y análisis<textarea id="v12ZoneFinding" rows="3" placeholder="Líneas, patrón de contracción, piel, volumen y asimetrías"></textarea></label><label class="field span-2">Indicación, objetivo y comentario técnico<textarea id="v12ZoneIndication" rows="3" placeholder="Qué se busca tratar y con qué criterio facial"></textarea></label></div><button type="button" class="v12-save-zone" id="v12SaveZone">Guardar estudio de zona</button><pre class="v12-zone-preview" id="v12ZonePreview">Sin estudio registrado.</pre>`;
    editor.appendChild(study);
    $('v12SaveZone').addEventListener('click',saveZoneStudy);
  }

  function installOutput(){
    const summary=document.querySelector('#printSheet .summary-grid');
    if(summary&&!$('v12OutProfile')){
      const p=document.createElement('p');p.className='v12-output-profile';p.innerHTML='<b>Estudio facial:</b> <span id="v12OutProfile">—</span>';summary.appendChild(p);
    }
    const pointsSection=$('outPointsSection');
    if(pointsSection&&!$('v12OutStudySection')){
      const section=document.createElement('div');section.id='v12OutStudySection';section.className='output-section hidden';section.innerHTML='<h3>Estudio facial por zona</h3><pre id="v12OutStudy">—</pre>';
      pointsSection.parentNode.insertBefore(section,pointsSection);
    }
  }

  function bindZones(){
    $$('#faceMap .face-zone').forEach(zone=>{
      const activate=event=>{
        event.preventDefault();event.stopPropagation();
        const key=zone.dataset.zone;
        if(state.selectedZone===key&&event.type==='click'){
          const point=$('faceMap').createSVGPoint();point.x=event.clientX;point.y=event.clientY;
          const svgPoint=point.matrixTransform($('faceMap').getScreenCTM().inverse());
          API.addPoint(key,svgPoint.x,svgPoint.y);
        }else{
          state.selectedZone=key;API.selectZone(key);setTimeout(loadZoneStudy,0);
        }
        updateContext();setTimeout(updateOutput,20);
      };
      zone.addEventListener('click',activate);
      zone.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){activate(event);}});
    });
  }

  function setModel(model){
    state.model=model;
    $$('.v12-face-figure').forEach(group=>group.classList.toggle('active',group.id===(model==='woman'?'v12Woman':'v12Man')));
    $$('[data-model]').forEach(button=>button.classList.toggle('active',button.dataset.model===model));
    updateContext();updateOutput();forceBaseRender();
  }

  function setLineMode(mode){
    state.lineMode=mode;document.body.dataset.v12Lines=mode;
    $$('[data-lines]').forEach(button=>button.classList.toggle('active',button.dataset.lines===mode));
    updateContext();updateOutput();forceBaseRender();
  }

  function forceBaseRender(){
    const target=$('motivo');if(target)target.dispatchEvent(new Event('input',{bubbles:true}));
  }

  function contextFor(key){
    const zone=zones[key];if(!zone)return 'Selecciona una zona para cargar su análisis.';
    const modelText=state.model==='woman'?zone.woman:zone.man;
    const lines=state.lineMode==='active'?zone.active:state.lineMode==='passive'?zone.passive:`${zone.active} ${zone.passive}`;
    return `${zone.label}. ${modelText} ${lines}`;
  }

  function updateContext(){
    const zone=zones[state.selectedZone];
    const note=$('v12ModelNote');
    if(note)note.textContent=`Modelo ${modelLabels[state.model]} · visualización ${lineLabels[state.lineMode]}. Las líneas son una guía clínica tenue y no reemplazan la evaluación dinámica real.`;
    const context=$('v12ZoneContext');if(context)context.textContent=contextFor(state.selectedZone);
    if(zone&&$('zoneHelp'))$('zoneHelp').textContent=contextFor(state.selectedZone);
    updateZonePreview();
  }

  function saveZoneStudy(){
    const key=state.selectedZone;if(!key)return;
    state.studies[key]={
      line:$('v12ZoneLine').value,
      symmetry:$('v12ZoneSymmetry').value,
      finding:$('v12ZoneFinding').value.trim(),
      indication:$('v12ZoneIndication').value.trim()
    };
    updateZonePreview();updateOutput();
  }

  function loadZoneStudy(){
    const data=state.studies[state.selectedZone]||{};
    $('v12ZoneLine').value=data.line||$('v12DynamicStudy')?.value||'mixta';
    $('v12ZoneSymmetry').value=data.symmetry||'simetrica';
    $('v12ZoneFinding').value=data.finding||'';
    $('v12ZoneIndication').value=data.indication||'';
    updateContext();
  }

  function pointsForZone(key){
    try{return API.getState().points.filter(point=>point.zone===key);}catch(_){return [];}
  }

  function zoneText(key){
    const zone=zones[key],data=state.studies[key]||{},points=pointsForZone(key);
    const planned=points.reduce((sum,p)=>sum+(Number(p.planned)||0),0);
    const administered=points.reduce((sum,p)=>sum+(Number(p.administered)||0),0);
    const min=$('zoneRefMin')?.value||'—',max=$('zoneRefMax')?.value||'—';
    return [`${zone.label} · Modelo ${modelLabels[state.model]} · ${lineLabels[state.lineMode]}.`,`Referencia visible: ${min} a ${max} U.`,`Línea: ${data.line||'mixta'} · Simetría: ${data.symmetry||'simétrica'}.`,`Puntos: ${points.length} · Plan ${planned} U · Administrado ${administered} U.`,data.finding?`Hallazgos: ${data.finding}`:'Sin hallazgos escritos.',data.indication?`Objetivo: ${data.indication}`:'Sin objetivo escrito.'].join('\n');
  }

  function updateZonePreview(){
    const preview=$('v12ZonePreview');if(!preview)return;
    preview.textContent=state.selectedZone?zoneText(state.selectedZone):'Sin estudio registrado.';
  }

  function profileText(){
    return `Paciente/referencia: ${$('v12PatientSex')?.value||'no especificado'} · Modelo visual: ${modelLabels[state.model]} · Patrón: ${$('v12FacialPattern')?.value||'no registrado'} · Dinámica: ${$('v12DynamicStudy')?.value||'no registrada'} · Tono: ${$('v12MuscleTone')?.value||'no registrado'} · Líneas del mapa: ${lineLabels[state.lineMode]}.`;
  }

  function updateOutput(){
    if($('v12OutProfile'))$('v12OutProfile').textContent=profileText();
    const keys=Object.keys(state.studies);
    if($('v12OutStudy'))$('v12OutStudy').textContent=keys.length?keys.map(zoneText).join('\n\n'):'Sin estudio de zona registrado.';
    $('v12OutStudySection')?.classList.toggle('hidden',!keys.length);
  }

  function collect(){
    return {model:state.model,lineMode:state.lineMode,selectedZone:state.selectedZone,studies:state.studies,fields:{patientSex:$('v12PatientSex')?.value||'',facialPattern:$('v12FacialPattern')?.value||'',dynamicStudy:$('v12DynamicStudy')?.value||'',muscleTone:$('v12MuscleTone')?.value||''}};
  }

  function save(){sessionStorage.setItem(KEY,JSON.stringify(collect()));}
  function restore(){
    try{
      const data=JSON.parse(sessionStorage.getItem(KEY)||'null');if(!data)return;
      state.model=data.model||'woman';state.lineMode=data.lineMode||'both';state.selectedZone=data.selectedZone||null;state.studies=data.studies||{};
      if(data.fields){if($('v12PatientSex'))$('v12PatientSex').value=data.fields.patientSex||'mujer';if($('v12FacialPattern'))$('v12FacialPattern').value=data.fields.facialPattern||'equilibrado';if($('v12DynamicStudy'))$('v12DynamicStudy').value=data.fields.dynamicStudy||'mixta';if($('v12MuscleTone'))$('v12MuscleTone').value=data.fields.muscleTone||'moderado';}
      setModel(state.model);setLineMode(state.lineMode);
      if(state.selectedZone){API.selectZone(state.selectedZone);loadZoneStudy();}
      updateOutput();
    }catch(error){console.warn('No fue posible recuperar estudio facial V1.2',error);}
  }

  function bindPersistence(){
    ['v12PatientSex','v12FacialPattern','v12DynamicStudy','v12MuscleTone','v12ZoneLine','v12ZoneSymmetry','v12ZoneFinding','v12ZoneIndication'].forEach(id=>$(id)?.addEventListener('input',()=>{updateContext();updateOutput();}));
    $('btnSave')?.addEventListener('click',save);
    $('btnRestore')?.addEventListener('click',()=>setTimeout(restore,20));
    $('btnClear')?.addEventListener('click',()=>setTimeout(()=>{if(!$('p_nombre')?.value&&!$('procedimiento')?.value){sessionStorage.removeItem(KEY);state.model='woman';state.lineMode='both';state.selectedZone=null;state.studies={};setModel('woman');setLineMode('both');updateOutput();}},30));
    ['pointPlanned','pointAdministered','pointState','pointLabel','zoneRefMin','zoneRefMax'].forEach(id=>$(id)?.addEventListener('input',()=>setTimeout(()=>{updateZonePreview();updateOutput();},10)));
    const body=$('pointsTableBody');if(body)new MutationObserver(()=>{updateZonePreview();updateOutput();}).observe(body,{childList:true,subtree:true,characterData:true});
  }

  function init(){
    document.body.dataset.v12Lines='both';
    const headerText=document.querySelector('.module-header > div > p:last-child');if(headerText)headerText.textContent='Evaluación, cálculo de reconstitución, estudio facial inteligente, mapa de punción y documento clínico.';
    installPatientStudy();installToolbarAndMap();installZoneStudy();installOutput();bindPersistence();restore();updateContext();updateOutput();
    window.ORION_AESTHETIC_V12={version:'1.2.0',getStudy:collect,setModel,setLineMode};
  }

  init();
})();
