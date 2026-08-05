(()=>{
  'use strict';

  const VERSION='1.9.0';
  const STORE_KEY='orion_aesthetic_plla_v190';
  const PROCEDURE_KEY='orion_aesthetic_procedure_v145';
  const CONTEXT_KEY='orion_aesthetic_clinical_context_v147';
  const SETTINGS_KEY='orion_aesthetic_v160_settings';
  const $=id=>document.getElementById(id);
  const uid=()=>`p${Date.now().toString(36)}${Math.random().toString(36).slice(2,7)}`;
  const num=value=>{const parsed=Number.parseFloat(String(value??'').replace(',','.'));return Number.isFinite(parsed)?parsed:0;};
  const fmt=(value,decimals=2)=>num(value).toLocaleString('es-CL',{minimumFractionDigits:decimals,maximumFractionDigits:decimals});
  const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const clean=value=>String(value??'').trim();

  const TYPE_LABELS={point:'Punto',vector:'Vector',area:'Área'};
  const GOALS={facial:'Corrección facial / volumen',quality:'Bioestimulación / calidad cutánea',body:'Tratamiento corporal',mixed:'Objetivo mixto',other:'Otro objetivo'};
  const ZONES=['Sien','Pómulo / malar','Región submalar','Surco nasogeniano','Comisuras','Líneas de marioneta','Mentón','Mandíbula','Prejowl','Cuello','Escote','Dorso de manos','Brazo','Abdomen','Muslo','Glúteo','Otra zona'];
  const PLANES=['Subdérmico','Subcutáneo superficial','Subcutáneo profundo','Supraperióstico','Plano profundo','Otro / no especificado'];
  const TECHNIQUES=['Retroinyección lineal','Abanico','Mallado','Vectores cruzados','Punto seriado','Depósito localizado','Otra técnica'];

  let state=loadState();
  let mounted=false;
  let pendingVector=null;
  let applyingTab=false;

  function defaultState(){
    return{
      tool:'select',selectedId:null,
      preparation:{
        brand:'',presentation:'',lot:'',expiry:'',goal:'quality',sessionNumber:'1',plannedSessions:'',vials:'1',
        sterileWaterMl:'',lidocaineMl:'',otherAdditiveMl:'',finalVolumeMl:'',reconstitutedAt:'',administeredAt:'',
        preparationMethod:'',mixingNotes:'',previousPlla:'',aftercarePlan:'',operatorNotes:''
      },
      safety:{
        productVerified:false,patientSelectionReviewed:false,skinStatusReviewed:false,scarHistoryReviewed:false,
        reconstitutionVerified:false,homogeneityVerified:false,consentReviewed:false,asepsisConfirmed:false,
        vascularPlan:false,referralRoute:false,aftercareExplained:false
      },
      items:[]
    };
  }

  function loadJSON(key,fallback){try{return JSON.parse(sessionStorage.getItem(key)||'null')??fallback;}catch(_){return fallback;}}
  function saveJSON(key,value){try{sessionStorage.setItem(key,JSON.stringify(value));return true;}catch(_){return false;}}
  function loadState(){
    const base=defaultState();
    const saved=loadJSON(STORE_KEY,null);
    return saved&&Array.isArray(saved.items)?{
      ...base,...saved,
      preparation:{...base.preparation,...saved.preparation},
      safety:{...base.safety,...saved.safety}
    }:base;
  }
  function saveState(){saveJSON(STORE_KEY,state);syncContextQuantity();renderSummary();updateCalculations();}
  function procedure(){return loadJSON(PROCEDURE_KEY,{patient:{},vial:{},points:[]});}
  function context(){return loadJSON(CONTEXT_KEY,{});}
  function isPllaMode(){return $('oaIntervention')?.value==='plla'||document.body.dataset.procedureKind==='plla';}
  function selected(){return state.items.find(item=>item.id===state.selectedId)||null;}
  function confirmedItems(){return state.items.filter(item=>item.confirmed&&num(item.suspensionVolume)>0);}
  function vialCount(){return Math.max(0,num(state.preparation.vials));}
  function calculatedLiquid(){return Math.max(0,num(state.preparation.sterileWaterMl))+Math.max(0,num(state.preparation.lidocaineMl))+Math.max(0,num(state.preparation.otherAdditiveMl));}
  function finalVolume(){return Math.max(0,num(state.preparation.finalVolumeMl))||calculatedLiquid();}
  function totalSuspension(){return confirmedItems().reduce((sum,item)=>sum+num(item.suspensionVolume),0);}
  function vialEquivalent(item){const final=finalVolume();return final?num(item.suspensionVolume)*(vialCount()/final):0;}
  function totalVialEquivalent(){return confirmedItems().reduce((sum,item)=>sum+vialEquivalent(item),0);}
  function remainingVolume(){return Math.max(0,finalVolume()-totalSuspension());}
  function elapsedLabel(){
    const start=state.preparation.reconstitutedAt,end=state.preparation.administeredAt;
    if(!start||!end)return 'No calculado';
    const delta=new Date(end)-new Date(start);
    if(!Number.isFinite(delta)||delta<0)return 'Fechas no válidas';
    const minutes=Math.round(delta/60000),hours=Math.floor(minutes/60),rest=minutes%60;
    return hours?`${hours} h ${rest} min`:`${rest} min`;
  }

  function toast(message){
    const node=$('toast');if(!node)return;
    node.textContent=message;node.classList.add('show');
    clearTimeout(toast.timer);toast.timer=setTimeout(()=>node.classList.remove('show'),2300);
  }
  function setMobileTab(tab){
    if(applyingTab)return;
    applyingTab=true;document.body.dataset.mobileTab=tab;
    document.querySelectorAll('[data-mobile-tab]').forEach(button=>button.classList.toggle('active',button.dataset.mobileTab===tab));
    requestAnimationFrame(()=>{applyingTab=false;});
  }
  function safetyCheck(key,label){return `<label class="oa-plla-check"><input type="checkbox" id="oaPllaSafety_${key}"><span>${label}</span></label>`;}

  function ensureRecordCard(){
    if($('oaPllaRecordCard'))return;
    const contextCard=$('oaClinicalContext');if(!contextCard)return;
    const card=document.createElement('section');
    card.id='oaPllaRecordCard';card.className='oa-card oa-plla-record-card oa-plla-only';
    card.innerHTML=`
      <div class="oa-section-title">Ácido poli-L-láctico · reconstitución y trazabilidad</div>
      <div class="oa-plla-grid">
        <label>Producto / marca<input id="oaPllaBrand" placeholder="Marca comercial y línea"></label>
        <label>Presentación<input id="oaPllaPresentation" placeholder="Contenido por vial / presentación"></label>
        <label>Lote<input id="oaPllaLot" placeholder="Lote"></label>
        <label>Vencimiento<input id="oaPllaExpiry" type="date"></label>
        <label>Objetivo terapéutico<select id="oaPllaGoal">${Object.entries(GOALS).map(([value,label])=>`<option value="${value}">${label}</option>`).join('')}</select></label>
        <label>Número de sesión<input id="oaPllaSessionNumber" type="number" min="1" step="1" inputmode="numeric"></label>
        <label>Sesiones planificadas<input id="oaPllaPlannedSessions" type="number" min="1" step="1" inputmode="numeric" placeholder="Opcional"></label>
        <label>Número de viales<input id="oaPllaVials" type="number" min="0" step="0.01" inputmode="decimal"></label>
        <label>Agua estéril registrada (mL)<input id="oaPllaSterileWater" type="number" min="0" step="0.01" inputmode="decimal"></label>
        <label>Lidocaína añadida (mL)<input id="oaPllaLidocaine" type="number" min="0" step="0.01" inputmode="decimal"></label>
        <label>Otro aditivo / diluyente (mL)<input id="oaPllaOtherAdditive" type="number" min="0" step="0.01" inputmode="decimal"></label>
        <label>Volumen final declarado (mL)<input id="oaPllaFinalVolume" type="number" min="0" step="0.01" inputmode="decimal" placeholder="Si difiere de la suma"></label>
        <label>Fecha y hora de reconstitución<input id="oaPllaReconstitutedAt" type="datetime-local"></label>
        <label>Fecha y hora de administración<input id="oaPllaAdministeredAt" type="datetime-local"></label>
        <label>Método de preparación<input id="oaPllaPreparationMethod" placeholder="Registrar método utilizado"></label>
        <label>PLLA o rellenos previos<input id="oaPllaPrevious" placeholder="Producto, fecha, zona o desconocido"></label>
        <label class="wide">Homogeneización / preparación<textarea id="oaPllaMixingNotes" rows="2" placeholder="Agitación, reposo, homogeneidad y observaciones reales"></textarea></label>
        <label class="wide">Plan de cuidados posteriores<textarea id="oaPllaAftercarePlan" rows="2" placeholder="Masaje u otras indicaciones individualizadas, si corresponden"></textarea></label>
        <label class="wide">Observaciones generales<textarea id="oaPllaOperatorNotes" rows="2" placeholder="Plan, asimetrías, zonas, secuencia y observaciones"></textarea></label>
      </div>
      <div class="oa-plla-calculation">
        <div><span>Volumen calculado por líquidos</span><strong id="oaPllaCalculatedLiquid">0,00 mL</strong></div>
        <div><span>Volumen final utilizado</span><strong id="oaPllaFinalVolumeDisplay">0,00 mL</strong></div>
        <div><span>Tiempo reconstitución–uso</span><strong id="oaPllaElapsed">No calculado</strong></div>
        <div><span>Suspensión confirmada</span><strong id="oaPllaMappedVolume">0,00 mL</strong></div>
        <div><span>Equivalente estimado de viales</span><strong id="oaPllaVialEquivalent">0,00</strong></div>
        <div><span>Volumen no distribuido</span><strong id="oaPllaRemaining">0,00 mL</strong></div>
      </div>
      <p class="oa-plla-calculation-note">Los cálculos documentan los valores ingresados. ORION no prescribe volumen de reconstitución, tiempo de reposo, dosis, plano, técnica ni número de sesiones.</p>
      <div class="oa-section-title" style="margin-top:14px">Lista de verificación antes de administrar</div>
      <div class="oa-plla-safety">
        ${safetyCheck('productVerified','Producto, lote, vencimiento e integridad verificados')}
        ${safetyCheck('patientSelectionReviewed','Selección del paciente e indicación revisadas')}
        ${safetyCheck('skinStatusReviewed','Piel, inflamación e infección local evaluadas')}
        ${safetyCheck('scarHistoryReviewed','Antecedentes de cicatriz hipertrófica o queloide revisados')}
        ${safetyCheck('reconstitutionVerified','Reconstitución y volumen final verificados según producto')}
        ${safetyCheck('homogeneityVerified','Homogeneidad de la suspensión comprobada')}
        ${safetyCheck('consentReviewed','Consentimiento específico revisado')}
        ${safetyCheck('asepsisConfirmed','Antisepsia, instrumental y material verificados')}
        ${safetyCheck('vascularPlan','Plan ante evento vascular o reacción adversa disponible')}
        ${safetyCheck('referralRoute','Ruta de derivación urgente conocida')}
        ${safetyCheck('aftercareExplained','Cuidados posteriores y señales de alarma explicados')}
      </div>
      <div class="oa-plla-alert"><strong>Control clínico:</strong> registrar el producto real y seguir sus instrucciones de uso. Las formulaciones, indicaciones autorizadas, reconstitución y zonas permitidas pueden variar entre productos y jurisdicciones.</div>`;
    contextCard.insertAdjacentElement('afterend',card);hydrateRecord();bindRecord();
  }

  function hydrateRecord(){
    const map={
      oaPllaBrand:'brand',oaPllaPresentation:'presentation',oaPllaLot:'lot',oaPllaExpiry:'expiry',oaPllaGoal:'goal',
      oaPllaSessionNumber:'sessionNumber',oaPllaPlannedSessions:'plannedSessions',oaPllaVials:'vials',
      oaPllaSterileWater:'sterileWaterMl',oaPllaLidocaine:'lidocaineMl',oaPllaOtherAdditive:'otherAdditiveMl',
      oaPllaFinalVolume:'finalVolumeMl',oaPllaReconstitutedAt:'reconstitutedAt',oaPllaAdministeredAt:'administeredAt',
      oaPllaPreparationMethod:'preparationMethod',oaPllaMixingNotes:'mixingNotes',oaPllaPrevious:'previousPlla',
      oaPllaAftercarePlan:'aftercarePlan',oaPllaOperatorNotes:'operatorNotes'
    };
    Object.entries(map).forEach(([id,key])=>{if($(id))$(id).value=state.preparation[key]??'';});
    Object.entries(state.safety).forEach(([key,value])=>{const input=$(`oaPllaSafety_${key}`);if(input)input.checked=!!value;});
    updateCalculations();
  }
  function bindRecord(){
    if($('oaPllaRecordCard')?.dataset.bound)return;$('oaPllaRecordCard').dataset.bound='1';
    const map={
      oaPllaBrand:'brand',oaPllaPresentation:'presentation',oaPllaLot:'lot',oaPllaExpiry:'expiry',oaPllaGoal:'goal',
      oaPllaSessionNumber:'sessionNumber',oaPllaPlannedSessions:'plannedSessions',oaPllaVials:'vials',
      oaPllaSterileWater:'sterileWaterMl',oaPllaLidocaine:'lidocaineMl',oaPllaOtherAdditive:'otherAdditiveMl',
      oaPllaFinalVolume:'finalVolumeMl',oaPllaReconstitutedAt:'reconstitutedAt',oaPllaAdministeredAt:'administeredAt',
      oaPllaPreparationMethod:'preparationMethod',oaPllaMixingNotes:'mixingNotes',oaPllaPrevious:'previousPlla',
      oaPllaAftercarePlan:'aftercarePlan',oaPllaOperatorNotes:'operatorNotes'
    };
    Object.entries(map).forEach(([id,key])=>{
      const input=$(id);if(!input)return;
      const handler=()=>{state.preparation[key]=input.value;saveState();};
      input.addEventListener('input',handler);input.addEventListener('change',handler);
    });
    Object.keys(state.safety).forEach(key=>$(`oaPllaSafety_${key}`)?.addEventListener('change',event=>{state.safety[key]=event.target.checked;saveState();}));
  }
  function updateCalculations(){
    if($('oaPllaCalculatedLiquid'))$('oaPllaCalculatedLiquid').textContent=`${fmt(calculatedLiquid())} mL`;
    if($('oaPllaFinalVolumeDisplay'))$('oaPllaFinalVolumeDisplay').textContent=`${fmt(finalVolume())} mL`;
    if($('oaPllaElapsed'))$('oaPllaElapsed').textContent=elapsedLabel();
    if($('oaPllaMappedVolume'))$('oaPllaMappedVolume').textContent=`${fmt(totalSuspension())} mL`;
    if($('oaPllaVialEquivalent'))$('oaPllaVialEquivalent').textContent=fmt(totalVialEquivalent());
    if($('oaPllaRemaining'))$('oaPllaRemaining').textContent=`${fmt(remainingVolume())} mL`;
  }

  function ensureMapUI(){
    const atlasShell=$('atlasShell'),atlasTransform=$('atlasTransform');if(!atlasShell||!atlasTransform)return;
    if(!$('oaPllaToolbar')){
      const toolbar=document.createElement('div');toolbar.id='oaPllaToolbar';toolbar.className='oa-plla-toolbar oa-plla-only';
      toolbar.innerHTML=`<button type="button" data-plla-tool="select">Seleccionar</button><button type="button" data-plla-tool="point">＋ Punto</button><button type="button" data-plla-tool="vector">↗ Vector</button><button type="button" data-plla-tool="area">◯ Área</button>`;
      const anchor=document.querySelector('.oa-mobile-zonebar')||document.querySelector('.oa-map-head');anchor?.insertAdjacentElement('afterend',toolbar);
      const help=document.createElement('p');help.id='oaPllaToolHelp';help.className='oa-plla-help oa-plla-only';toolbar.insertAdjacentElement('afterend',help);
      toolbar.querySelectorAll('[data-plla-tool]').forEach(button=>button.addEventListener('click',()=>setTool(button.dataset.pllaTool)));
    }
    if(!$('oaPllaEditor')){const editor=document.createElement('section');editor.id='oaPllaEditor';editor.className='oa-plla-editor oa-plla-only';editor.hidden=true;atlasShell.insertAdjacentElement('beforebegin',editor);}
    if(!$('oaPllaLayer')){const layer=document.createElement('div');layer.id='oaPllaLayer';layer.className='oa-plla-only';atlasTransform.append(layer);}
    if(!atlasShell.dataset.oaPllaBound){atlasShell.dataset.oaPllaBound='1';atlasShell.addEventListener('click',handleAtlasClick,true);}
  }
  function setTool(tool){
    state.tool=['select','point','vector','area'].includes(tool)?tool:'select';if(state.tool!=='vector')pendingVector=null;
    document.querySelectorAll('[data-plla-tool]').forEach(button=>button.classList.toggle('active',button.dataset.pllaTool===state.tool));
    const help=$('oaPllaToolHelp');if(help)help.textContent={select:'Toca un elemento para editarlo.',point:'Toca el atlas para registrar un punto o depósito documentado.',vector:'Toca el inicio y luego el final del vector.',area:'Toca el centro de la región tratada y ajusta su tamaño.'}[state.tool];
    saveState();
  }
  function coordinates(event){const layer=$('oaPllaLayer'),rect=layer.getBoundingClientRect();return{x:Math.max(1,Math.min(99,(event.clientX-rect.left)/rect.width*100)),y:Math.max(1,Math.min(99,(event.clientY-rect.top)/rect.height*100))};}
  function handleAtlasClick(event){
    if(!isPllaMode()||event.target.closest('.oa-plla-object')||state.tool==='select')return;
    event.preventDefault();event.stopImmediatePropagation();const point=coordinates(event);
    if(state.tool==='point')createItem({type:'point',x:point.x,y:point.y});
    else if(state.tool==='area')createItem({type:'area',x:point.x,y:point.y,width:20,height:13});
    else if(state.tool==='vector'){
      if(!pendingVector){pendingVector=point;toast('Inicio del vector registrado. Toca el punto final.');return;}
      createItem({type:'vector',x1:pendingVector.x,y1:pendingVector.y,x2:point.x,y2:point.y});pendingVector=null;
    }
  }
  function createItem(geometry){
    const type=geometry.type;
    const item={id:uid(),type,label:`${TYPE_LABELS[type]} ${state.items.filter(entry=>entry.type===type).length+1}`,zone:'',side:'central',suspensionVolume:'',instrument:type==='point'?'Aguja':'Cánula',gauge:'',length:'',plane:'Otro / no especificado',technique:type==='point'?'Punto seriado':type==='vector'?'Retroinyección lineal':'Abanico',entryPoint:'',comment:'',confirmed:false,...geometry};
    state.items.push(item);state.selectedId=item.id;state.tool='select';saveState();renderAll();showEditor(item);toast(`${TYPE_LABELS[type]} creado.`);
  }
  function renderObjects(){
    const layer=$('oaPllaLayer');if(!layer)return;layer.innerHTML='';
    state.items.forEach(item=>{
      const node=document.createElement('button');node.type='button';node.className=`oa-plla-object ${item.type}${item.id===state.selectedId?' selected':''}${item.confirmed?' confirmed':''}`;node.dataset.id=item.id;node.title=`${item.label}${item.suspensionVolume?` · ${item.suspensionVolume} mL`:''}`;
      if(item.type==='point'){node.style.left=`${item.x}%`;node.style.top=`${item.y}%`;node.dataset.volume=item.suspensionVolume?`${fmt(item.suspensionVolume)} mL`:'0 mL';}
      else if(item.type==='area'){node.style.left=`${item.x}%`;node.style.top=`${item.y}%`;node.style.width=`${item.width||20}%`;node.style.height=`${item.height||13}%`;}
      else{const dx=item.x2-item.x1,dy=item.y2-item.y1,width=Math.hypot(dx,dy),angle=Math.atan2(dy,dx)*180/Math.PI;node.style.left=`${item.x1}%`;node.style.top=`${item.y1}%`;node.style.width=`${width}%`;node.style.transform=`rotate(${angle}deg)`;}
      node.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();state.selectedId=item.id;saveState();renderObjects();showEditor(item);setMobileTab('map');});layer.append(node);
    });
  }
  function showEditor(item=selected()){
    const editor=$('oaPllaEditor');if(!editor)return;if(!item){editor.hidden=true;editor.innerHTML='';return;}
    editor.hidden=false;editor.innerHTML=`
      <div class="oa-plla-editor-head"><div><h3>${esc(item.label)}</h3><p>${TYPE_LABELS[item.type]} · suspensión administrada en mL</p></div><span class="oa-plla-status${item.confirmed?' confirmed':''}">${item.confirmed?'Confirmado':'Borrador'}</span></div>
      <div class="oa-plla-editor-grid">
        <label>Etiqueta<input id="oaPllaItemLabel" value="${esc(item.label)}"></label>
        <label>Zona<select id="oaPllaItemZone"><option value="">Seleccionar</option>${ZONES.map(zone=>`<option${item.zone===zone?' selected':''}>${zone}</option>`).join('')}</select></label>
        <label>Lateralidad<select id="oaPllaItemSide"><option value="central"${item.side==='central'?' selected':''}>Central / bilateral</option><option value="right"${item.side==='right'?' selected':''}>Derecha</option><option value="left"${item.side==='left'?' selected':''}>Izquierda</option></select></label>
        <label>Suspensión administrada (mL)<input id="oaPllaItemVolume" type="number" min="0" step="0.01" inputmode="decimal" value="${esc(item.suspensionVolume)}"></label>
        <label>Instrumento<select id="oaPllaItemInstrument"><option${item.instrument==='Aguja'?' selected':''}>Aguja</option><option${item.instrument==='Cánula'?' selected':''}>Cánula</option><option${item.instrument==='Otro'?' selected':''}>Otro</option></select></label>
        <label>Calibre<input id="oaPllaItemGauge" value="${esc(item.gauge)}" placeholder="Ej.: 25G"></label>
        <label>Longitud<input id="oaPllaItemLength" value="${esc(item.length)}" placeholder="Ej.: 50 mm"></label>
        <label>Plano<select id="oaPllaItemPlane">${PLANES.map(value=>`<option${item.plane===value?' selected':''}>${value}</option>`).join('')}</select></label>
        <label>Técnica<select id="oaPllaItemTechnique">${TECHNIQUES.map(value=>`<option${item.technique===value?' selected':''}>${value}</option>`).join('')}</select></label>
        <label>Punto de entrada<input id="oaPllaItemEntry" value="${esc(item.entryPoint)}" placeholder="Descripción anatómica"></label>
        ${item.type==='area'?`<label>Ancho del área (%)<input id="oaPllaItemWidth" type="number" min="4" max="70" step="1" value="${num(item.width)||20}"></label><label>Alto del área (%)<input id="oaPllaItemHeight" type="number" min="4" max="70" step="1" value="${num(item.height)||13}"></label>`:''}
        <label class="wide">Comentario / observación<textarea id="oaPllaItemComment" rows="2">${esc(item.comment)}</textarea></label>
      </div>
      <div class="oa-plla-item-metrics"><span>Equivalente estimado de viales</span><strong>${fmt(vialEquivalent(item))}</strong></div>
      <div class="oa-plla-editor-actions"><button type="button" id="oaPllaSaveItem">Guardar cambios</button><button type="button" class="confirm" id="oaPllaConfirmItem">${item.confirmed?'Reabrir elemento':'Confirmar administración'}</button><button type="button" class="delete" id="oaPllaDeleteItem">Eliminar</button></div>`;
    $('oaPllaSaveItem').onclick=()=>saveEditor(false);$('oaPllaConfirmItem').onclick=()=>saveEditor(true);$('oaPllaDeleteItem').onclick=deleteSelected;
  }
  function saveEditor(toggleConfirm){
    const item=selected();if(!item)return;
    item.label=clean($('oaPllaItemLabel')?.value)||item.label;item.zone=$('oaPllaItemZone')?.value||'';item.side=$('oaPllaItemSide')?.value||'central';item.suspensionVolume=Math.max(0,num($('oaPllaItemVolume')?.value));item.instrument=$('oaPllaItemInstrument')?.value||'';item.gauge=clean($('oaPllaItemGauge')?.value);item.length=clean($('oaPllaItemLength')?.value);item.plane=$('oaPllaItemPlane')?.value||'';item.technique=$('oaPllaItemTechnique')?.value||'';item.entryPoint=clean($('oaPllaItemEntry')?.value);item.comment=clean($('oaPllaItemComment')?.value);
    if(item.type==='area'){item.width=Math.max(4,Math.min(70,num($('oaPllaItemWidth')?.value)||20));item.height=Math.max(4,Math.min(70,num($('oaPllaItemHeight')?.value)||13));}
    if(toggleConfirm){
      if(!item.confirmed&&item.suspensionVolume<=0){window.alert('Ingresa un volumen administrado mayor que cero antes de confirmar.');return;}
      if(!item.confirmed&&!item.zone){window.alert('Selecciona la zona anatómica antes de confirmar.');return;}
      if(!item.confirmed&&finalVolume()<=0){window.alert('Registra el volumen final de la suspensión antes de confirmar.');return;}
      if(!item.confirmed&&vialCount()<=0){window.alert('Registra el número de viales preparados antes de confirmar.');return;}
      item.confirmed=!item.confirmed;item.confirmedAt=item.confirmed?new Date().toISOString():'';
    }
    saveState();renderAll();showEditor(item);toast(item.confirmed?'Administración confirmada.':'Cambios guardados.');
  }
  function deleteSelected(){const item=selected();if(!item)return;if(!window.confirm(`¿Eliminar ${item.label}?`))return;state.items=state.items.filter(entry=>entry.id!==item.id);state.selectedId=null;saveState();renderAll();showEditor(null);}

  function ensureSummary(){
    if($('oaPllaSummary'))return;const record=document.querySelector('.oa-record-panel');if(!record)return;
    const card=document.createElement('section');card.id='oaPllaSummary';card.className='oa-card oa-plla-summary oa-plla-only oa-mobile-summary';card.innerHTML='<div class="oa-section-title">Resumen de ácido poli-L-láctico</div><div id="oaPllaSummaryContent"></div>';record.append(card);
  }
  function sideLabel(value){return{right:'Derecha',left:'Izquierda',central:'Central / bilateral'}[value]||value;}
  function renderSummary(){
    const content=$('oaPllaSummaryContent');if(!content)return;const confirmed=confirmedItems();
    const rows=confirmed.map(item=>`<tr><td>${TYPE_LABELS[item.type]}</td><td>${esc(item.zone||'—')}</td><td>${esc(sideLabel(item.side))}</td><td>${fmt(item.suspensionVolume)} mL</td><td>${fmt(vialEquivalent(item))}</td><td>${esc(item.plane||'—')}</td><td>${esc(item.technique||'—')}</td></tr>`).join('');
    const excess=totalSuspension()>finalVolume()&&finalVolume()>0?'<div class="oa-plla-overage">El volumen confirmado supera el volumen final registrado. Revisar antes de cerrar el informe.</div>':'';
    content.innerHTML=`<div class="oa-plla-summary-grid"><div><span>Elementos confirmados</span><strong>${confirmed.length}</strong></div><div><span>Suspensión administrada</span><strong>${fmt(totalSuspension())} mL</strong></div><div><span>Equivalente estimado de viales</span><strong>${fmt(totalVialEquivalent())}</strong></div><div><span>Tiempo reconstitución–uso</span><strong>${elapsedLabel()}</strong></div></div>${excess}<div class="oa-plla-table-wrap"><table class="oa-plla-table"><thead><tr><th>Tipo</th><th>Zona</th><th>Lado</th><th>Suspensión</th><th>Viales eq.</th><th>Plano</th><th>Técnica</th></tr></thead><tbody>${rows||'<tr><td colspan="7">Aún no existen elementos confirmados.</td></tr>'}</tbody></table></div>`;
  }
  function syncContextQuantity(){
    if(!isPllaMode())return;const quantity=$('oaQuantity'),unit=$('oaUnit');
    if(quantity){quantity.value=String(totalSuspension());quantity.readOnly=true;quantity.dispatchEvent(new Event('input',{bubbles:true}));}
    if(unit){unit.value='mL';unit.dispatchEvent(new Event('change',{bubbles:true}));}
  }
  function applyMode(){
    const active=isPllaMode();document.documentElement.classList.toggle('oa-plla-mode',active);
    if(active){ensureRecordCard();ensureMapUI();ensureSummary();setTool(state.tool);renderAll();syncContextQuantity();const subtitle=document.querySelector('.oa-title span');if(subtitle)subtitle.textContent='Motor de ácido poli-L-láctico · reconstitución, vectores y áreas';const mapText=document.querySelector('.oa-map-head span');if(mapText)mapText.textContent='Registra puntos, vectores o áreas y documenta suspensión, plano, técnica, entrada y lateralidad.';}
    else{const quantity=$('oaQuantity');if(quantity)quantity.readOnly=false;pendingVector=null;}
  }
  function renderAll(){renderObjects();renderSummary();setTool(state.tool);updateCalculations();}

  function item(label,value,wide=false){return `<div class="item${wide?' wide':''}"><span>${esc(label)}</span><strong>${esc(clean(value)||'No registrado')}</strong></div>`;}
  function page(title,subtitle,code,body,pageNumber,total){return `<section class="page"><header><img src="../../assets/brand/orion-health.png" alt="ORION Health"><div><h1>${esc(title)}</h1><p>${esc(subtitle)}</p></div><aside>${esc(code)}<br>V${VERSION}</aside></header>${body}<footer><span>ORION Health · Documento clínico</span><span>Página ${pageNumber} de ${total}</span></footer></section>`;}
  function safetyLabel(key){return{productVerified:'Producto, lote y vencimiento verificados',patientSelectionReviewed:'Selección e indicación revisadas',skinStatusReviewed:'Estado cutáneo evaluado',scarHistoryReviewed:'Antecedentes cicatriciales revisados',reconstitutionVerified:'Reconstitución y volumen verificados',homogeneityVerified:'Homogeneidad comprobada',consentReviewed:'Consentimiento revisado',asepsisConfirmed:'Antisepsia e instrumental verificados',vascularPlan:'Plan de contingencia disponible',referralRoute:'Ruta de derivación operativa',aftercareExplained:'Cuidados y alarmas explicados'}[key]||key;}
  function reportStyle(){return `@page{size:Letter portrait;margin:0}*{box-sizing:border-box}body{margin:0;background:#dfe6ed;font-family:Arial,sans-serif;color:#19344c}.page{position:relative;width:215.9mm;min-height:279.4mm;margin:10px auto;padding:16mm 15mm 18mm;background:#fff;page-break-after:always;overflow:hidden}header{display:grid;grid-template-columns:34mm 1fr 34mm;gap:8mm;align-items:center;padding-bottom:6mm;border-bottom:1.5px solid #73559b}header img{width:28mm;max-height:18mm;object-fit:contain}header h1{margin:0;color:#563578;font-size:18px}header p{margin:2px 0 0;color:#746480;font-size:10px}header aside{text-align:right;color:#706579;font-size:9px;line-height:1.45}h2{margin:7mm 0 3mm;color:#563578;font-size:16px}h3{margin:5mm 0 2mm;color:#73559b;font-size:12px}p,li{font-size:10px;line-height:1.48}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:3mm}.item{padding:3mm;border:1px solid #ded6e6;border-radius:2mm;background:#fbf9fc}.item.wide{grid-column:1/-1}.item span{display:block;color:#82738c;font-size:8px}.item strong{display:block;margin-top:1mm;color:#44324f;font-size:10px;white-space:pre-wrap}.alert{padding:4mm;border:1px solid #e5b6b6;border-radius:2mm;background:#fff3f3;color:#743232}.checklist{display:grid;grid-template-columns:1fr 1fr;gap:2mm}.check{padding:3mm;border:1px solid #e2dae7;border-radius:2mm;background:#fbf9fc;font-size:9px}.check.yes::before{content:'✓ ';color:#21844b;font-weight:bold}.check.no::before{content:'○ ';color:#9a5a22;font-weight:bold}.map-layout{display:grid;grid-template-columns:115mm 1fr;gap:8mm;align-items:start}.atlas{position:relative;width:115mm;height:170mm;overflow:hidden;border:1px solid #d7cce0;border-radius:3mm;background:#f4f1f6}.atlas img{width:100%;height:100%;object-fit:cover;object-position:center top}.point,.area,.vector{position:absolute}.point{width:5mm;height:5mm;transform:translate(-50%,-50%);border:1.2mm solid #fff;border-radius:50%;background:#8052ad;box-shadow:0 0 0 .7mm #4f2b73}.point b{position:absolute;left:50%;top:5.5mm;transform:translateX(-50%);min-width:14mm;padding:1mm;border-radius:1.5mm;background:#fff;color:#563578;font-size:7px;text-align:center}.area{transform:translate(-50%,-50%);border:1mm dashed #8052ad;border-radius:50%;background:rgba(128,82,173,.16)}.vector{height:1.8mm;transform-origin:0 50%;border-radius:2mm;background:#6f439a;box-shadow:0 0 0 .5mm #fff}table{width:100%;border-collapse:collapse;font-size:8.5px}th,td{padding:2.2mm;border-bottom:1px solid #e4dce9;text-align:left;vertical-align:top}th{background:#f4eff7;color:#62427d}.draft{padding:3mm;border:1px solid #efcf88;background:#fff7df;color:#72530a;font-size:9px}.signatures{display:grid;grid-template-columns:1fr 1fr;gap:20mm;margin-top:25mm}.signatures div{padding-top:3mm;border-top:1px solid #66546f;text-align:center;font-size:9px}footer{position:absolute;left:15mm;right:15mm;bottom:8mm;display:flex;justify-content:space-between;border-top:1px solid #e1dae5;padding-top:2mm;color:#786d7e;font-size:8px}@media print{body{background:#fff}.page{margin:0;box-shadow:none}}`;}
  function reportMapMarkup(items){const source=$('atlasImage')?.src||'';return `<div class="atlas"><img src="${esc(source)}" alt="Atlas clínico">${items.map(entry=>{if(entry.type==='point')return `<span class="point" style="left:${entry.x}%;top:${entry.y}%"><b>${fmt(entry.suspensionVolume)} mL</b></span>`;if(entry.type==='area')return `<span class="area" style="left:${entry.x}%;top:${entry.y}%;width:${entry.width||20}%;height:${entry.height||13}%"></span>`;const dx=entry.x2-entry.x1,dy=entry.y2-entry.y1,width=Math.hypot(dx,dy),angle=Math.atan2(dy,dx)*180/Math.PI;return `<span class="vector" style="left:${entry.x1}%;top:${entry.y1}%;width:${width}%;transform:rotate(${angle}deg)"></span>`;}).join('')}</div>`;}
  function buildReport(){
    const proc=procedure(),ctx=context(),patient=proc.patient||{},items=confirmedItems();if(!items.length){window.alert('Confirma al menos un punto, vector o área antes de generar el informe.');return;}
    const prep=state.preparation,pages=[],totalPages=5;let pageNumber=1;
    const checklist=Object.entries(state.safety).map(([key,value])=>`<div class="check ${value?'yes':'no'}">${esc(safetyLabel(key))}</div>`).join('');
    const registration=`<h2>Registro clínico y reconstitución</h2><div class="grid">${item('Paciente',patient.name)}${item('RUN / RUT',patient.id)}${item('Fecha',patient.date)}${item('Procedimiento','Ácido poli-L-láctico')}${item('Objetivo',GOALS[prep.goal]||prep.goal)}${item('Sesión',`${prep.sessionNumber||'—'} de ${prep.plannedSessions||'—'}`)}${item('Indicación / objetivo',ctx.indication,true)}${item('Zonas',ctx.zones,true)}${item('Técnica / plano general',ctx.technique,true)}${item('Producto / marca',prep.brand)}${item('Presentación',prep.presentation)}${item('Lote',prep.lot)}${item('Vencimiento',prep.expiry)}${item('Viales preparados',prep.vials)}${item('Agua estéril',`${fmt(prep.sterileWaterMl)} mL`)}${item('Lidocaína',`${fmt(prep.lidocaineMl)} mL`)}${item('Otros aditivos',`${fmt(prep.otherAdditiveMl)} mL`)}${item('Volumen final',`${fmt(finalVolume())} mL`)}${item('Reconstituido',prep.reconstitutedAt)}${item('Administrado',prep.administeredAt)}${item('Tiempo reconstitución–uso',elapsedLabel())}${item('Método',prep.preparationMethod,true)}${item('Homogeneización',prep.mixingNotes,true)}${item('Antecedentes de PLLA',prep.previousPlla,true)}${item('Observaciones',prep.operatorNotes,true)}</div><h3>Verificación de seguridad</h3><div class="checklist">${checklist}</div><div class="alert"><strong>Nota documental:</strong> ORION registra la preparación y administración indicada por el profesional; no prescribe reconstitución, dosis, plano, técnica ni sesiones. Verificar instrucciones del producto y normativa local.</div>`;
    pages.push(page('ORION Armonización Orofacial','PLLA · registro y reconstitución','ORH-AO-PLLA-REG-001',registration,pageNumber++,totalPages));
    const map=`<h2>Mapa final del procedimiento</h2><p>Puntos, vectores y áreas con administración confirmada.</p><div class="map-layout">${reportMapMarkup(items)}<div>${item('Elementos',items.length)}${item('Suspensión administrada',`${fmt(totalSuspension())} mL`)}${item('Viales equivalentes',fmt(totalVialEquivalent()))}${item('Volumen final',`${fmt(finalVolume())} mL`)}${item('Objetivo',GOALS[prep.goal]||prep.goal)}${item('Producto',prep.brand)}${item('Lote',prep.lot)}</div></div>`;
    pages.push(page('ORION Armonización Orofacial','Mapa de ácido poli-L-láctico','ORH-AO-PLLA-MAP-001',map,pageNumber++,totalPages));
    const rows=items.map(entry=>`<tr><td>${TYPE_LABELS[entry.type]}</td><td>${esc(entry.zone)}</td><td>${esc(sideLabel(entry.side))}</td><td>${fmt(entry.suspensionVolume)} mL</td><td>${fmt(vialEquivalent(entry))}</td><td>${esc(entry.instrument)} ${esc(entry.gauge)} ${esc(entry.length)}</td><td>${esc(entry.plane)}</td><td>${esc(entry.technique)}</td><td>${esc(entry.entryPoint)}</td><td>${esc(entry.comment)}</td></tr>`).join('');
    pages.push(page('ORION Armonización Orofacial','Trazabilidad por elemento','ORH-AO-PLLA-TRA-001',`<h2>Trazabilidad de administración</h2><table><thead><tr><th>Tipo</th><th>Zona</th><th>Lado</th><th>Suspensión</th><th>Viales eq.</th><th>Instrumento</th><th>Plano</th><th>Técnica</th><th>Entrada</th><th>Comentario</th></tr></thead><tbody>${rows}</tbody></table><div class="grid" style="margin-top:5mm">${item('Suspensión total',`${fmt(totalSuspension())} mL`)}${item('Viales equivalentes',fmt(totalVialEquivalent()))}${item('Tiempo reconstitución–uso',elapsedLabel())}</div>`,pageNumber++,totalPages));
    const consent=`<div class="draft">BORRADOR CLÍNICO: revisar, explicar y adaptar antes de la firma.</div><h2>Consentimiento informado específico</h2><div class="grid">${item('Paciente',patient.name)}${item('RUN / RUT',patient.id)}${item('Fecha',patient.date)}${item('Procedimiento','Ácido poli-L-láctico')}${item('Producto',prep.brand)}${item('Objetivo',GOALS[prep.goal]||prep.goal)}</div><h3>Objetivo y alternativas</h3><p>${esc(clean(ctx.indication)||'Objetivo clínico-estético explicado durante la evaluación.')}</p><p>Se explicó la alternativa de no realizar el procedimiento y otras opciones terapéuticas.</p><h3>Riesgos y eventos posibles</h3><ul><li>Dolor, edema, hematoma, enrojecimiento, sensibilidad, prurito o inflamación.</li><li>Nódulos palpables o visibles, induración, granulomas, infección o reacción inflamatoria tardía.</li><li>Asimetría, irregularidad, resultado parcial, tardío o necesidad de sesiones adicionales.</li><li>Compromiso vascular accidental, lesión tisular u otros eventos graves que requieren evaluación inmediata.</li><li>Necesidad de controles, procedimientos correctivos o derivación.</li></ul><p>Declaro haber informado mis antecedentes, haber podido formular preguntas y comprender la información recibida.</p><div class="signatures"><div>Firma del paciente</div><div>Firma del profesional</div></div>`;
    pages.push(page('ORION Armonización Orofacial','Consentimiento informado · PLLA','ORH-AO-PLLA-CNS-001',consent,pageNumber++,totalPages));
    const contact=loadJSON(SETTINGS_KEY,{}).contact||'Equipo tratante';
    const aftercare=`<div class="draft">DOCUMENTO PARA REVISIÓN PROFESIONAL: adaptar a producto, zona, técnica y protocolo institucional.</div><h2>Indicaciones posteriores</h2><div class="grid">${item('Paciente',patient.name)}${item('Fecha',patient.date)}${item('Procedimiento','Ácido poli-L-láctico')}${item('Producto',prep.brand)}${item('Contacto clínico',contact)}${item('Sesión',prep.sessionNumber)}</div><h3>Plan indicado por el profesional</h3><p>${esc(clean(prep.aftercarePlan)||'Seguir las instrucciones individualizadas entregadas por el equipo tratante.')}</p><h3>Cuidados generales</h3><ul><li>No manipular intensamente la zona salvo que el profesional haya indicado una pauta específica.</li><li>Seguir las instrucciones sobre ejercicio, calor, cosméticos, masaje y otros procedimientos.</li><li>Asistir a los controles y comunicar cualquier evolución inesperada.</li></ul><h3>Señales de alarma</h3><div class="alert">Contactar inmediatamente al equipo tratante o acudir a evaluación urgente ante dolor intenso o progresivo, palidez, piel fría, cambios importantes de coloración, ampollas, alteraciones visuales, debilidad, dificultad para hablar, fiebre, secreción o inflamación progresiva.</div><h3>Observaciones específicas</h3><p>${esc(clean(ctx.procedureNotes)||clean(prep.operatorNotes)||'Sin observaciones adicionales.')}</p><div class="signatures"><div>Recibí y comprendí las indicaciones</div><div>Firma / identificación profesional</div></div>`;
    pages.push(page('ORION Armonización Orofacial','Indicaciones posteriores · PLLA','ORH-AO-PLLA-IND-001',aftercare,pageNumber++,totalPages));
    const popup=window.open('','_blank');if(!popup){window.alert('Permite ventanas emergentes para generar el informe.');return;}
    popup.document.open();popup.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Informe PLLA</title><style>${reportStyle()}</style></head><body>${pages.join('')}<script>window.addEventListener('load',()=>setTimeout(()=>window.print(),500));<\/script></body></html>`);popup.document.close();
  }
  function interceptReportButtons(){document.addEventListener('click',event=>{if(!isPllaMode())return;const button=event.target.closest('button');if(!button)return;const id=button.id||'',label=button.textContent||'';if(!['btnPrint','btnPrintTop'].includes(id)&&!/informe.*pdf|imprimir.*pdf|exportar.*pdf/i.test(label))return;event.preventDefault();event.stopImmediatePropagation();buildReport();},true);}
  function observeMode(){$('oaIntervention')?.addEventListener('change',()=>setTimeout(applyMode,0));new MutationObserver(()=>{if(document.body.dataset.procedureKind==='plla')applyMode();}).observe(document.body,{attributes:true,attributeFilter:['data-procedure-kind']});}
  function boot(){if(mounted)return;if(!$('atlasShell')||!$('oaIntervention')){setTimeout(boot,100);return;}mounted=true;document.documentElement.dataset.orionAestheticsVersion=VERSION;document.querySelectorAll('.oa-version').forEach(node=>node.textContent=`V${VERSION}`);ensureRecordCard();ensureMapUI();ensureSummary();observeMode();interceptReportButtons();applyMode();renderAll();}
  boot();
})();
