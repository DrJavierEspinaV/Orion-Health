(()=>{
  'use strict';

  const VERSION='1.6.0';
  const PROCEDURE_KEY='orion_aesthetic_procedure_v145';
  const CONTEXT_KEY='orion_aesthetic_clinical_context_v147';
  const MULTI_KEY='orion_aesthetic_multi_selection_v148';
  const SETTINGS_KEY='orion_aesthetic_v160_settings';
  const LOCK_KEY='orion_aesthetic_v160_lock';
  const HISTORY_KEY='orion_aesthetic_v160_history';
  const AUDIT_KEY='orion_aesthetic_v160_audit';
  const $=id=>document.getElementById(id);

  const ZONES={
    forehead:'Frente',glabella:'Glabela / corrugadores',periocular_r:'Periocular derecho',periocular_l:'Periocular izquierdo',
    bunny:'Bunny lines / nasal',smile:'Sonrisa gingival / perioral',dao_r:'DAO derecho',dao_l:'DAO izquierdo',
    menton:'Mentón',masseter_r:'Masetero derecho',masseter_l:'Masetero izquierdo',platysma:'Platisma'
  };
  const INTERVENTIONS={
    toxin:'Toxina botulínica tipo A',hyaluronic:'Relleno con ácido hialurónico',caha:'Hidroxiapatita de calcio',
    plla:'Ácido poli-L-láctico',skinbooster:'Skinbooster / mesoterapia',threads:'Hilos',prp:'PRP / autólogo',
    combined:'Procedimiento combinado',other:'Otro procedimiento estético'
  };

  const num=value=>{const parsed=Number.parseFloat(String(value??'').replace(',','.'));return Number.isFinite(parsed)?parsed:0;};
  const fmt=(value,decimals=1)=>num(value).toLocaleString('es-CL',{minimumFractionDigits:decimals,maximumFractionDigits:decimals});
  const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const now=()=>new Date().toISOString();
  let restoring=false;
  let lastSignature='';
  let lastSnapshot=null;
  let currentDocumentType='';

  function loadJSON(key,fallback){try{const value=JSON.parse(sessionStorage.getItem(key)||'null');return value??fallback;}catch(_){return fallback;}}
  function saveJSON(key,value){try{sessionStorage.setItem(key,JSON.stringify(value));return true;}catch(_){return false;}}
  function procedure(){return loadJSON(PROCEDURE_KEY,{points:[],vial:{units:0,dilution:1}});}
  function context(){return loadJSON(CONTEXT_KEY,{});}
  function settings(){return {...{distributionMode:'perPoint',laterality:'symmetric',lateralityNotes:'',contact:''},...loadJSON(SETTINGS_KEY,{})};}
  function lockState(){return {...{closed:false,closedAt:'',corrections:[]},...loadJSON(LOCK_KEY,{})};}

  function selectedIds(state=procedure()){
    let ids=[];
    try{ids=JSON.parse(sessionStorage.getItem(MULTI_KEY)||'[]');}catch(_){}
    if(!Array.isArray(ids))ids=[];
    const valid=new Set((state.points||[]).map(point=>point.id));
    ids=ids.filter(id=>valid.has(id));
    if(!ids.length&&state.selectedPointId&&valid.has(state.selectedPointId))ids=[state.selectedPointId];
    return ids;
  }

  function concentration(state=procedure()){
    const units=Math.max(0,num(state.vial?.units));
    const dilution=Math.max(.001,num(state.vial?.dilution));
    return units/dilution;
  }

  function administeredTotal(state=procedure()){
    return (state.points||[]).reduce((sum,point)=>sum+num(point.administered),0);
  }

  function addAudit(type,detail=''){
    const list=loadJSON(AUDIT_KEY,[]);
    list.push({at:now(),type,detail});
    saveJSON(AUDIT_KEY,list.slice(-80));
    renderAudit();
  }

  function snapshot(label='Cambio'){
    return {at:now(),label,procedure:loadJSON(PROCEDURE_KEY,null),context:loadJSON(CONTEXT_KEY,null),settings:loadJSON(SETTINGS_KEY,null)};
  }

  function pushHistory(label='Cambio'){
    if(restoring||lockState().closed)return;
    const history=loadJSON(HISTORY_KEY,[]);
    const shot=snapshot(label);
    const previous=history[history.length-1];
    const signature=JSON.stringify([shot.procedure,shot.context,shot.settings]);
    const previousSignature=previous?JSON.stringify([previous.procedure,previous.context,previous.settings]):'';
    if(signature!==previousSignature){history.push(shot);saveJSON(HISTORY_KEY,history.slice(-25));}
    updateUndoButtons();
  }

  function updateUndoButtons(){
    const count=loadJSON(HISTORY_KEY,[]).length;
    document.querySelectorAll('.oa-v160-undo').forEach(button=>{
      button.disabled=!count||lockState().closed;
      button.title=count?`Deshacer el último cambio (${count} disponible${count===1?'':'s'})`:'No hay cambios para deshacer';
    });
  }

  function undo(){
    if(lockState().closed)return;
    const history=loadJSON(HISTORY_KEY,[]);
    const shot=history.pop();
    if(!shot)return;
    restoring=true;
    if(shot.procedure)saveJSON(PROCEDURE_KEY,shot.procedure);
    if(shot.context)saveJSON(CONTEXT_KEY,shot.context);
    if(shot.settings)saveJSON(SETTINGS_KEY,shot.settings);
    saveJSON(HISTORY_KEY,history);
    addAudit('Deshacer',shot.label||'Cambio anterior');
    location.reload();
  }

  function monitorHistory(){
    lastSnapshot=snapshot('Estado anterior');
    lastSignature=JSON.stringify([lastSnapshot.procedure,lastSnapshot.context,lastSnapshot.settings]);
    setInterval(()=>{
      if(restoring||lockState().closed)return;
      const current=snapshot('Cambio automático');
      const signature=JSON.stringify([current.procedure,current.context,current.settings]);
      if(signature===lastSignature)return;
      const history=loadJSON(HISTORY_KEY,[]);
      if(lastSnapshot)history.push(lastSnapshot);
      saveJSON(HISTORY_KEY,history.slice(-25));
      lastSnapshot=current;
      lastSignature=signature;
      updateUndoButtons();
      renderFinalMap();
      renderClinicalEnhancements();
    },900);
  }

  function ensureUndoButtons(){
    const top=document.querySelector('.oa-top-actions');
    if(top&&!$('oaV160UndoTop')){
      const button=document.createElement('button');button.type='button';button.id='oaV160UndoTop';button.className='oa-icon-btn oa-v160-undo';button.textContent='Deshacer';button.onclick=undo;top.prepend(button);
    }
    const actions=document.querySelector('.oa-map-actions');
    if(actions&&!$('oaV160UndoMap')){
      const button=document.createElement('button');button.type='button';button.id='oaV160UndoMap';button.className='oa-v160-undo';button.textContent='↶ Deshacer';button.onclick=undo;actions.append(button);
    }
    updateUndoButtons();
  }

  function selectionProfile(ids,state=procedure()){
    const points=ids.map(id=>state.points.find(point=>point.id===id)).filter(Boolean);
    const right=points.filter(point=>/_r$/.test(point.zone)).length;
    const left=points.filter(point=>/_l$/.test(point.zone)).length;
    const central=points.length-right-left;
    return{points,right,left,central};
  }

  function calculateDistribution(){
    const state=procedure();
    const ids=selectedIds(state);
    const value=num($('oaV148Admin')?.value);
    const mode=settings().distributionMode;
    const count=Math.max(1,ids.length);
    const perPoint=mode==='total'?value/count:value;
    const total=mode==='total'?value:value*count;
    const conc=concentration(state);
    const volume=conc?total/conc:0;
    return{ids,count,value,mode,perPoint,total,volume,profile:selectionProfile(ids,state)};
  }

  function setDistributionMode(mode){
    const current=settings();current.distributionMode=mode;saveJSON(SETTINGS_KEY,current);
    document.querySelectorAll('[data-oa-v160-mode]').forEach(button=>button.classList.toggle('active',button.dataset.oaV160Mode===mode));
    const input=$('oaV148Admin');
    if(input){
      input.placeholder=mode==='total'?'Total a distribuir':'Cantidad por punto';
      const label=input.closest('label');
      const text=Array.from(label?.childNodes||[]).find(node=>node.nodeType===Node.TEXT_NODE&&node.textContent.trim());
      if(text)text.textContent=mode==='total'?'Administrado total':'Administrado por punto';
    }
    updateDistributionPreview();
  }

  function ensureDistributionControls(){
    const fields=document.querySelector('#oaPointSheetV148 .oa-v148-fields');
    if(!fields||$('oaV160Distribution'))return;
    const section=document.createElement('section');
    section.id='oaV160Distribution';section.className='oa-v160-distribution';
    section.innerHTML=`
      <div><strong>Forma de ingreso</strong><div class="oa-v160-mode-group" style="margin-top:7px"><button type="button" data-oa-v160-mode="perPoint">Cantidad por punto</button><button type="button" data-oa-v160-mode="total">Total a distribuir</button></div></div>
      <div class="oa-v160-live-preview"><div class="oa-v160-preview-metric"><span>Puntos</span><strong id="oaV160PreviewCount">0</strong></div><div class="oa-v160-preview-metric"><span>Por punto</span><strong id="oaV160PreviewPer">0 U</strong></div><div class="oa-v160-preview-metric"><span>Total / volumen</span><strong id="oaV160PreviewTotal">0 U</strong></div></div>
      <p class="oa-v160-distribution-help" id="oaV160DistributionHelp">En “Total a distribuir”, ORION divide el total en partes iguales. La vista previa debe confirmarse antes de guardar.</p>`;
    fields.prepend(section);
    section.querySelectorAll('[data-oa-v160-mode]').forEach(button=>button.onclick=()=>setDistributionMode(button.dataset.oaV160Mode));
    $('oaV148Admin')?.addEventListener('input',updateDistributionPreview);
    setDistributionMode(settings().distributionMode);
  }

  function updateDistributionPreview(){
    const data=calculateDistribution();
    if($('oaV160PreviewCount'))$('oaV160PreviewCount').textContent=String(data.ids.length);
    if($('oaV160PreviewPer'))$('oaV160PreviewPer').textContent=`${fmt(data.perPoint,2)} U`;
    if($('oaV160PreviewTotal'))$('oaV160PreviewTotal').textContent=`${fmt(data.total,2)} U · ${fmt(data.volume,3)} mL`;
    const help=$('oaV160DistributionHelp');
    if(help){
      const lateral=[];
      if(data.profile.right)lateral.push(`${data.profile.right} der.`);
      if(data.profile.left)lateral.push(`${data.profile.left} izq.`);
      if(data.profile.central)lateral.push(`${data.profile.central} central`);
      help.textContent=`${data.mode==='total'?'El total se distribuirá en partes iguales.':'La cantidad se aplicará a cada punto.'} Selección: ${lateral.join(' · ')||'sin puntos'}.`;
    }
  }

  function ensureModal(){
    if($('oaV160Modal'))return;
    const modal=document.createElement('div');modal.id='oaV160Modal';modal.className='oa-v160-modal';modal.hidden=true;
    modal.innerHTML='<section class="oa-v160-modal-card"><header class="oa-v160-modal-head"><div><h2 id="oaV160ModalTitle"></h2><p id="oaV160ModalSubtitle"></p></div><button type="button" class="oa-v160-modal-close" id="oaV160ModalClose">×</button></header><div class="oa-v160-modal-body" id="oaV160ModalBody"></div></section>';
    document.body.append(modal);
    $('oaV160ModalClose').onclick=closeModal;
    modal.addEventListener('click',event=>{if(event.target===modal)closeModal();});
  }

  function openModal(title,subtitle,body){
    ensureModal();setText($('oaV160ModalTitle'),title);setText($('oaV160ModalSubtitle'),subtitle);$('oaV160ModalBody').innerHTML=body;$('oaV160Modal').hidden=false;
  }
  function closeModal(){if($('oaV160Modal'))$('oaV160Modal').hidden=true;document.body.classList.remove('oa-v160-print-associated');currentDocumentType='';}
  function setText(node,text){if(node)node.textContent=text;}

  function confirmAdministration(){
    const data=calculateDistribution();
    if(!data.ids.length){window.alert('Selecciona al menos un punto.');return;}
    if(data.value<=0){window.alert('Ingresa una cantidad administrada mayor que cero.');$('oaV148Admin')?.focus();return;}
    const state=procedure();
    const labels=data.ids.map(id=>{
      const point=state.points.find(item=>item.id===id);return point?point.label:'';
    }).filter(Boolean);
    openModal('Confirmar administración','Revisa la distribución antes de modificar el registro.',`
      <div class="oa-v160-confirm-grid"><div><span>Puntos</span><strong>${data.count}</strong></div><div><span>Por punto</span><strong>${fmt(data.perPoint,2)} U</strong></div><div><span>Total</span><strong>${fmt(data.total,2)} U</strong></div><div><span>Volumen total</span><strong>${fmt(data.volume,3)} mL</strong></div></div>
      <div class="oa-v160-confirm-points">${esc(labels.join(' · '))}</div>
      <label class="oa-v160-confirm-check"><input type="checkbox" id="oaV160ConfirmAdmin"><span>Confirmo la selección, la cantidad por punto, el total y el volumen calculado.</span></label>
      <div class="oa-v160-modal-actions"><button type="button" class="secondary" id="oaV160CancelAdmin">Volver y modificar</button><button type="button" class="primary" id="oaV160AcceptAdmin">Confirmar y guardar</button></div>`);
    $('oaV160CancelAdmin').onclick=closeModal;
    $('oaV160AcceptAdmin').onclick=()=>{
      if(!$('oaV160ConfirmAdmin').checked){window.alert('Debes confirmar la revisión antes de guardar.');return;}
      pushHistory(`Administración de ${data.count} punto${data.count===1?'':'s'}`);
      const button=$('oaV148Save');
      const input=$('oaV148Admin');
      input.value=String(data.perPoint);
      input.dispatchEvent(new Event('input',{bubbles:true}));
      button.dataset.oaV160Confirmed='1';
      closeModal();
      setTimeout(()=>button.click(),0);
      setTimeout(()=>{
        const updated=procedure();
        const batchId=`adm-${Date.now()}`;
        updated.points.forEach(point=>{
          if(data.ids.includes(point.id))point.oaAdministration={batchId,mode:data.mode,total:data.total,perPoint:data.perPoint,laterality:settings().laterality,confirmedAt:now()};
        });
        saveJSON(PROCEDURE_KEY,updated);
        addAudit('Administración confirmada',`${data.count} punto(s), ${fmt(data.total,2)} U, ${fmt(data.volume,3)} mL`);
        renderFinalMap();
      },220);
    };
  }

  function interceptAdministrationSave(){
    const button=$('oaV148Save');
    if(!button||button.dataset.oaV160Bound)return;
    button.dataset.oaV160Bound='1';
    button.addEventListener('click',event=>{
      if(button.dataset.oaV160Confirmed==='1'){delete button.dataset.oaV160Confirmed;return;}
      event.preventDefault();event.stopImmediatePropagation();confirmAdministration();
    },true);
  }

  function ensureLaterality(){
    const contextCard=$('oaClinicalContext');
    const risk=contextCard?.querySelector('.oa-risk-panel');
    if(!contextCard||!risk||$('oaV160Laterality'))return;
    const section=document.createElement('section');section.id='oaV160Laterality';section.className='oa-v160-laterality';
    section.innerHTML='<div class="oa-section-title">Lateralidad y asimetría</div><div class="oa-v160-laterality-grid"><label>Relación entre lados<select id="oaV160LateralityMode"><option value="symmetric">Simétrica</option><option value="right">Predominio derecho</option><option value="left">Predominio izquierdo</option><option value="custom">Personalizada</option></select></label><label>Descripción<input id="oaV160LateralityNotes" placeholder="Asimetría dinámica, diferencia de fuerza o ajuste de cantidades"></label></div>';
    risk.insertAdjacentElement('beforebegin',section);
    const current=settings();$('oaV160LateralityMode').value=current.laterality;$('oaV160LateralityNotes').value=current.lateralityNotes;
    $('oaV160LateralityMode').onchange=event=>{const value=settings();value.laterality=event.target.value;saveJSON(SETTINGS_KEY,value);renderClinicalEnhancements();};
    $('oaV160LateralityNotes').oninput=event=>{const value=settings();value.lateralityNotes=event.target.value;saveJSON(SETTINGS_KEY,value);renderClinicalEnhancements();};
  }

  function zoneIndex(state,point){return state.points.filter(item=>item.zone===point.zone).findIndex(item=>item.id===point.id)+1;}

  function ensureFinalMap(){
    const table=document.querySelector('.oa-table-card');
    if(!table||$('oaV160FinalMap'))return;
    const card=document.createElement('section');card.id='oaV160FinalMap';card.className='oa-card oa-v160-final-map-card oa-mobile-summary';
    card.innerHTML='<div class="oa-v160-final-map-head"><div><div class="oa-section-title">Mapa final del procedimiento</div><p>Incluye únicamente los puntos con administración registrada.</p></div><strong id="oaV160FinalMapCount">0 puntos</strong></div><div class="oa-v160-final-atlas" id="oaV160FinalAtlas"></div><div class="oa-v160-final-map-summary" id="oaV160FinalMapSummary"></div>';
    table.insertAdjacentElement('beforebegin',card);renderFinalMap();
  }

  function renderFinalMap(){
    const atlas=$('oaV160FinalAtlas');if(!atlas)return;
    const state=procedure();const points=(state.points||[]).filter(point=>num(point.administered)>0);
    const source=$('atlasImage')?.src||'';
    if(!points.length){atlas.innerHTML='<div class="oa-v160-final-map-empty">Aún no existen puntos administrados.</div>';setText($('oaV160FinalMapCount'),'0 puntos');if($('oaV160FinalMapSummary'))$('oaV160FinalMapSummary').innerHTML='';return;}
    atlas.innerHTML=`<img src="${esc(source)}" alt="Mapa anatómico final">`+points.map(point=>`<span class="oa-v160-final-point" style="left:${num(point.x)}%;top:${num(point.y)}%"><b>${zoneIndex(state,point)}</b><small>${fmt(point.administered,1)} U</small></span>`).join('');
    const total=points.reduce((sum,point)=>sum+num(point.administered),0);const conc=concentration(state);const volume=conc?total/conc:0;
    setText($('oaV160FinalMapCount'),`${points.length} punto${points.length===1?'':'s'}`);
    $('oaV160FinalMapSummary').innerHTML=`<span>${fmt(total,1)} U administradas</span><span>${fmt(volume,3)} mL</span><span>${esc(lateralityLabel(settings().laterality))}</span>`;
  }

  function lateralityLabel(value){return{symmetric:'Simetría documentada',right:'Predominio derecho',left:'Predominio izquierdo',custom:'Distribución personalizada'}[value]||'Sin especificar';}

  function ensureDocumentsCard(){
    const summary=document.querySelector('.oa-general-summary');
    if(!summary||$('oaV160Documents'))return;
    const card=document.createElement('section');card.id='oaV160Documents';card.className='oa-card oa-v160-doc-card oa-mobile-summary';
    card.innerHTML='<div class="oa-section-title">Documentos asociados</div><div class="oa-v160-laterality-grid" style="margin-top:9px"><label>Contacto clínico para indicaciones<input id="oaV160Contact" placeholder="Teléfono, WhatsApp o correo"></label><div></div></div><div class="oa-v160-doc-actions"><button type="button" id="oaV160Consent">Vista previa de consentimiento</button><button type="button" class="primary" id="oaV160Aftercare">Indicaciones posteriores</button></div><p class="oa-v160-doc-note">Los documentos se generan como borradores clínicos y deben ser revisados por el profesional antes de entregarlos o firmarlos.</p>';
    summary.insertAdjacentElement('beforebegin',card);
    $('oaV160Contact').value=settings().contact;
    $('oaV160Contact').oninput=event=>{const value=settings();value.contact=event.target.value;saveJSON(SETTINGS_KEY,value);};
    $('oaV160Consent').onclick=()=>showAssociatedDocument('consent');
    $('oaV160Aftercare').onclick=()=>showAssociatedDocument('aftercare');
  }

  function riskLists(kind){
    if(kind==='toxin')return{
      common:['Dolor, enrojecimiento, edema o hematoma en los sitios de inyección.','Cefalea, sensibilidad o respuesta temporal insuficiente o asimétrica.','Debilidad temporal de músculos adyacentes, caída de ceja o párpado y alteración transitoria de la expresión.'],
      serious:['Debilidad muscular generalizada, dificultad para hablar, deglutir o respirar requieren evaluación urgente.'],
      after:['No frotar ni masajear las zonas tratadas durante el periodo indicado por el profesional.','Seguir las indicaciones específicas sobre ejercicio, exposición al calor, cosméticos y otros procedimientos.','Solicitar evaluación ante debilidad inesperada, alteración visual, dificultad para deglutir, hablar o respirar.']};
    if(kind==='hyaluronic'||kind==='combined')return{
      common:['Dolor, sensibilidad, edema, hematoma, prurito o enrojecimiento.','Asimetría, irregularidad, sobrecorrección, migración, nódulos, granulomas o infección.'],
      serious:['La inyección intravascular puede producir compromiso del flujo sanguíneo, necrosis, alteración visual, ceguera o accidente cerebrovascular.'],
      after:['No manipular ni comprimir la zona salvo indicación específica del profesional.','Contactar inmediatamente ante dolor intenso o creciente, palidez, coloración reticulada, frialdad, ampollas o cambios cutáneos progresivos.','La alteración visual, debilidad, dificultad para hablar o síntomas neurológicos requieren atención de urgencia inmediata.']};
    return{
      common:['Dolor, edema, enrojecimiento, hematoma, sensibilidad, asimetría o respuesta insuficiente.','Infección, inflamación persistente, irregularidad o necesidad de procedimientos adicionales.'],
      serious:['Las complicaciones específicas dependen del producto, el plano, la técnica y la zona tratada.'],
      after:['Mantener la zona limpia y seguir las indicaciones específicas entregadas por el profesional.','Consultar ante dolor intenso, inflamación progresiva, secreción, fiebre, cambio de color o síntomas inesperados.']};
  }

  function patientMeta(){return{name:$('patientName')?.value||'—',id:$('patientId')?.value||'—',date:$('procedureDate')?.value||'—'};}

  function showAssociatedDocument(type){
    const ctx=context();const state=procedure();const patient=patientMeta();const kind=ctx.intervention||'toxin';const risks=riskLists(kind);const title=type==='consent'?'Consentimiento informado específico':'Indicaciones posteriores al procedimiento';
    currentDocumentType=type;
    const body=type==='consent'?`
      <article class="oa-v160-document"><div class="draft">BORRADOR CLÍNICO. Debe ser revisado, adaptado y explicado por el profesional antes de la firma.</div><h1>${title}</h1><div class="meta"><div><strong>Paciente</strong><br>${esc(patient.name)}</div><div><strong>RUN/RUT</strong><br>${esc(patient.id)}</div><div><strong>Procedimiento</strong><br>${esc(INTERVENTIONS[kind]||kind)}</div><div><strong>Fecha</strong><br>${esc(patient.date)}</div></div><h2>Objetivo y alcance</h2><p>${esc(ctx.indication||'Objetivo clínico-estético explicado y acordado durante la evaluación.')}</p><h2>Riesgos y efectos posibles</h2><ul>${[...risks.common,...risks.serious].map(item=>`<li>${esc(item)}</li>`).join('')}</ul><h2>Alternativas y decisiones</h2><p>Se explicaron la alternativa de no realizar el procedimiento, otras opciones terapéuticas, la posibilidad de resultados parciales o asimétricos y la eventual necesidad de controles o correcciones.</p><h2>Declaración</h2><p>Declaro haber informado mis antecedentes, haber podido formular preguntas y comprender que no se garantiza un resultado estético específico.</p><div class="oa-v160-signatures"><div>Firma del paciente</div><div>Firma del profesional</div></div></article>`:
      `<article class="oa-v160-document"><div class="draft">BORRADOR PARA REVISIÓN PROFESIONAL. Adaptar a producto, zona y protocolo local.</div><h1>${title}</h1><div class="meta"><div><strong>Paciente</strong><br>${esc(patient.name)}</div><div><strong>Procedimiento</strong><br>${esc(INTERVENTIONS[kind]||kind)}</div><div><strong>Fecha</strong><br>${esc(patient.date)}</div><div><strong>Contacto</strong><br>${esc(settings().contact||'Equipo tratante')}</div></div><h2>Cuidados</h2><ul>${risks.after.map(item=>`<li>${esc(item)}</li>`).join('')}</ul><h2>Evolución esperable</h2><ul>${risks.common.map(item=>`<li>${esc(item)}</li>`).join('')}</ul><h2>Señales de alarma</h2><ul>${risks.serious.map(item=>`<li>${esc(item)}</li>`).join('')}</ul><p><strong>Ante una señal de alarma, contacte al equipo tratante o acuda a un servicio de urgencia según la gravedad.</strong></p></article>`;
    openModal(title,INTERVENTIONS[kind]||kind,body+'<div class="oa-v160-modal-actions"><button type="button" class="secondary" id="oaV160DocClose">Cerrar</button><button type="button" class="primary" id="oaV160DocPrint">Imprimir / PDF</button></div>');
    $('oaV160DocClose').onclick=closeModal;$('oaV160DocPrint').onclick=()=>{document.body.classList.add('oa-v160-print-associated');setTimeout(()=>window.print(),50);};
  }

  function ensureCloseCard(){
    const summary=document.querySelector('.oa-general-summary');if(!summary||$('oaV160CloseCard'))return;
    const card=document.createElement('section');card.id='oaV160CloseCard';card.className='oa-v160-close-card';
    card.innerHTML='<div class="oa-v160-close-head"><div><strong>Cierre del procedimiento</strong><p style="margin:4px 0 0;color:#6d8296;font-size:11px">Bloquea el registro y conserva la trazabilidad de correcciones.</p></div><span class="oa-v160-status" id="oaV160Status">En edición</span></div><div class="oa-v160-close-actions"><button type="button" class="oa-v160-close-procedure" id="oaV160CloseProcedure">Cerrar procedimiento</button><button type="button" class="oa-v160-correction" id="oaV160Correction">Registrar corrección</button></div><details class="oa-v160-audit"><summary>Auditoría de la sesión</summary><ol class="oa-v160-audit-list" id="oaV160AuditList"></ol></details>';
    const actions=summary.querySelector('.oa-final-actions');actions?.insertAdjacentElement('beforebegin',card);
    $('oaV160CloseProcedure').onclick=closeProcedure;$('oaV160Correction').onclick=startCorrection;
    applyLockState();renderAudit();
  }

  function ensureClosedBanner(){
    if($('oaV160ClosedBanner'))return;
    const banner=document.createElement('div');banner.id='oaV160ClosedBanner';banner.className='oa-v160-closed-banner';banner.hidden=true;banner.innerHTML='<span id="oaV160ClosedText">Procedimiento cerrado</span><button type="button" class="oa-v160-correction" id="oaV160BannerCorrection">Registrar corrección</button>';
    document.querySelector('.oa-topbar')?.insertAdjacentElement('afterend',banner);$('oaV160BannerCorrection').onclick=startCorrection;
  }

  function closeProcedure(){
    const state=procedure();const ctx=context();const patient=patientMeta();const total=administeredTotal(state);const hasTreatment=total>0||num(ctx.quantity)>0;
    const errors=[];if(!patient.name||patient.name==='—')errors.push('Paciente');if(!patient.date||patient.date==='—')errors.push('Fecha');if(!ctx.intervention)errors.push('Tipo de intervención');if(!hasTreatment)errors.push('Administración registrada');
    if(errors.length){window.alert(`Falta completar: ${errors.join(', ')}.`);return;}
    const conc=concentration(state);const volume=conc?total/conc:0;
    openModal('Cerrar procedimiento','Después del cierre, los campos quedarán bloqueados.',`<div class="oa-v160-confirm-grid"><div><span>Puntos administrados</span><strong>${state.points.filter(point=>num(point.administered)>0).length}</strong></div><div><span>Total</span><strong>${fmt(total,1)} U</strong></div><div><span>Volumen</span><strong>${fmt(volume,3)} mL</strong></div><div><span>Precaución</span><strong>${esc($('oaRiskBadge')?.textContent||'—')}</strong></div></div><label class="oa-v160-confirm-check"><input type="checkbox" id="oaV160CloseReview"><span>Revisé paciente, procedimiento, puntos, cantidades, lote, antecedentes y resumen.</span></label><label class="oa-v160-confirm-check"><input type="checkbox" id="oaV160CloseDocs"><span>Confirmo que el consentimiento y las indicaciones posteriores fueron revisados según corresponda.</span></label><div class="oa-v160-modal-actions"><button type="button" class="secondary" id="oaV160CloseCancel">Cancelar</button><button type="button" class="primary" id="oaV160CloseAccept">Cerrar y bloquear</button></div>`);
    $('oaV160CloseCancel').onclick=closeModal;$('oaV160CloseAccept').onclick=()=>{
      if(!$('oaV160CloseReview').checked||!$('oaV160CloseDocs').checked){window.alert('Confirma ambas revisiones antes de cerrar.');return;}
      const lock=lockState();lock.closed=true;lock.closedAt=now();saveJSON(LOCK_KEY,lock);addAudit('Procedimiento cerrado',`${fmt(total,1)} U administradas`);closeModal();applyLockState();
    };
  }

  function startCorrection(){
    const lock=lockState();if(!lock.closed)return;
    const reason=window.prompt('Motivo de la corrección:');if(!reason?.trim())return;
    lock.closed=false;lock.corrections=[...(lock.corrections||[]),{openedAt:now(),reason:reason.trim()}];saveJSON(LOCK_KEY,lock);addAudit('Corrección iniciada',reason.trim());applyLockState();
  }

  function applyLockState(){
    ensureClosedBanner();const lock=lockState();document.documentElement.classList.toggle('oa-v160-locked',lock.closed);
    const scope=document.querySelectorAll('.oa-map-panel input,.oa-map-panel select,.oa-map-panel textarea,.oa-map-panel button,.oa-record-panel input,.oa-record-panel select,.oa-record-panel textarea,.oa-record-panel button');
    const allowed=new Set(['btnPrint','btnPrintTop','btnNew','oaV160Correction','oaV160BannerCorrection','oaV160Consent','oaV160Aftercare']);
    scope.forEach(element=>{
      if(allowed.has(element.id)||element.closest('.oa-mobile-tabs'))return;
      if(lock.closed){if(!element.disabled)element.dataset.oaV160LockDisabled='1';element.disabled=true;}
      else if(element.dataset.oaV160LockDisabled==='1'){element.disabled=false;delete element.dataset.oaV160LockDisabled;}
    });
    const status=$('oaV160Status');if(status){status.textContent=lock.closed?'Cerrado':'En edición';status.classList.toggle('closed',lock.closed);}
    if($('oaV160CloseProcedure')){$('oaV160CloseProcedure').disabled=lock.closed;$('oaV160CloseProcedure').textContent=lock.closed?'Procedimiento cerrado':'Cerrar procedimiento';}
    if($('oaV160Correction'))$('oaV160Correction').disabled=!lock.closed;
    if($('oaV160ClosedBanner')){$('oaV160ClosedBanner').hidden=!lock.closed;setText($('oaV160ClosedText'),lock.closed?`Procedimiento cerrado · ${new Date(lock.closedAt).toLocaleString('es-CL')}`:'');}
    updateUndoButtons();
  }

  function renderAudit(){
    const list=$('oaV160AuditList');if(!list)return;const audit=loadJSON(AUDIT_KEY,[]).slice().reverse();list.innerHTML=audit.length?audit.map(item=>`<li><strong>${new Date(item.at).toLocaleString('es-CL')}</strong> · ${esc(item.type)}${item.detail?` — ${esc(item.detail)}`:''}</li>`).join(''):'<li>Sin eventos de auditoría.</li>';
  }

  function renderClinicalEnhancements(){
    const current=settings();if($('oaV160LateralityMode')&&$('oaV160LateralityMode').value!==current.laterality)$('oaV160LateralityMode').value=current.laterality;if($('oaV160LateralityNotes')&&$('oaV160LateralityNotes').value!==current.lateralityNotes)$('oaV160LateralityNotes').value=current.lateralityNotes;updateDistributionPreview();renderFinalMap();applyLockState();
  }

  function bindNewProcedure(){
    const button=$('btnNew');if(!button||button.dataset.oaV160Bound)return;button.dataset.oaV160Bound='1';button.addEventListener('click',()=>{[LOCK_KEY,HISTORY_KEY,AUDIT_KEY,SETTINGS_KEY].forEach(key=>sessionStorage.removeItem(key));},true);
  }

  function updateIdentity(){
    document.documentElement.classList.add('oa-v160');document.documentElement.dataset.orionAestheticsVersion=VERSION;document.title=`ORION Armonización Orofacial V${VERSION}`;document.querySelectorAll('.oa-version').forEach(node=>setText(node,`V${VERSION}`));
  }

  function boot(){
    if(!$('atlasShell')||!$('pointLayer')||!$('oaPointSheetV148')||!document.querySelector('.oa-general-summary')){setTimeout(boot,120);return;}
    updateIdentity();ensureUndoButtons();ensureDistributionControls();interceptAdministrationSave();ensureLaterality();ensureFinalMap();ensureDocumentsCard();ensureCloseCard();ensureClosedBanner();bindNewProcedure();renderClinicalEnhancements();monitorHistory();addAudit('Módulo iniciado',`V${VERSION}`);
    new MutationObserver(()=>requestAnimationFrame(()=>{ensureDistributionControls();interceptAdministrationSave();updateDistributionPreview();renderFinalMap();})).observe(document.body,{subtree:true,childList:true});
  }

  boot();
})();
