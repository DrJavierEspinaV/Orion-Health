(()=>{
  'use strict';

  const VERSION='1.8.0';
  const STORE_KEY='orion_aesthetic_caha_v180';
  const PROCEDURE_KEY='orion_aesthetic_procedure_v145';
  const CONTEXT_KEY='orion_aesthetic_clinical_context_v147';
  const SETTINGS_KEY='orion_aesthetic_v160_settings';
  const $=id=>document.getElementById(id);
  const uid=()=>`c${Date.now().toString(36)}${Math.random().toString(36).slice(2,7)}`;
  const num=value=>{const parsed=Number.parseFloat(String(value??'').replace(',','.'));return Number.isFinite(parsed)?parsed:0;};
  const fmt=(value,decimals=2)=>num(value).toLocaleString('es-CL',{minimumFractionDigits:decimals,maximumFractionDigits:decimals});
  const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const clean=value=>String(value??'').trim();

  const TYPE_LABELS={deposit:'Depósito',vector:'Vector',area:'Área'};
  const GOALS={support:'Soporte / contorno',mixed:'Soporte y bioestimulación',biostimulation:'Bioestimulación / calidad cutánea',other:'Otro objetivo'};
  const ZONES=['Sien','Pómulo / malar','Región submalar','Surco nasogeniano','Comisuras','Líneas de marioneta','Mentón','Mandíbula','Prejowl','Cuello','Escote','Dorso de manos','Brazo','Abdomen','Muslo','Glúteo','Otra zona'];
  const PLANES=['Supraperióstico','Subdérmico','Subcutáneo','Unión dermis-subcutáneo','Plano profundo','Otro / no especificado'];
  const TECHNIQUES=['Bolo / depósito','Retroinyección lineal','Abanico','Mallado','Vectores cruzados','Depósito seriado','Otra técnica'];

  let state=loadState();
  let mounted=false;
  let pendingVector=null;
  let applyingTab=false;

  function defaultState(){
    return{
      tool:'select',selectedId:null,
      preparation:{
        brand:'',presentation:'',lot:'',expiry:'',goal:'biostimulation',sessionNumber:'1',plannedSessions:'',
        productMl:'',diluentType:'Suero fisiológico',diluentMl:'',lidocaineIntegral:'unknown',preparedAt:'',mixingPasses:'',
        previousCaha:'',operatorNotes:''
      },
      safety:{
        productVerified:false,goalConfirmed:false,ratioConfirmed:false,homogeneousMix:false,remixPlan:false,
        consentReviewed:false,asepsisConfirmed:false,emergencyPlan:false,referralRoute:false,patientContact:false
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
  function saveState(){saveJSON(STORE_KEY,state);syncContextQuantity();renderSummary();}
  function procedure(){return loadJSON(PROCEDURE_KEY,{patient:{},vial:{},points:[]});}
  function context(){return loadJSON(CONTEXT_KEY,{});}
  function isCahaMode(){return $('oaIntervention')?.value==='caha'||document.body.dataset.procedureKind==='caha';}
  function selected(){return state.items.find(item=>item.id===state.selectedId)||null;}
  function confirmedItems(){return state.items.filter(item=>item.confirmed&&num(item.mixtureVolume)>0);}
  function productMl(){return Math.max(0,num(state.preparation.productMl));}
  function diluentMl(){return Math.max(0,num(state.preparation.diluentMl));}
  function finalMl(){return productMl()+diluentMl();}
  function ratioLabel(){
    const product=productMl(),diluent=diluentMl();
    if(!product)return 'No calculada';
    return `1:${fmt(diluent/product,2)}`;
  }
  function totalMixture(){return confirmedItems().reduce((sum,item)=>sum+num(item.mixtureVolume),0);}
  function productEquivalent(item){const final=finalMl();return final?num(item.mixtureVolume)*(productMl()/final):0;}
  function totalProductEquivalent(){return confirmedItems().reduce((sum,item)=>sum+productEquivalent(item),0);}

  function toast(message){
    const node=$('toast');if(!node)return;
    node.textContent=message;node.classList.add('show');
    clearTimeout(toast.timer);toast.timer=setTimeout(()=>node.classList.remove('show'),2300);
  }

  function setMobileTab(tab){
    if(applyingTab)return;
    applyingTab=true;
    document.body.dataset.mobileTab=tab;
    document.querySelectorAll('[data-mobile-tab]').forEach(button=>button.classList.toggle('active',button.dataset.mobileTab===tab));
    requestAnimationFrame(()=>{applyingTab=false;});
  }

  function safetyCheck(key,label){return `<label class="oa-caha-check"><input type="checkbox" id="oaCahaSafety_${key}"><span>${label}</span></label>`;}

  function ensureRecordCard(){
    if($('oaCahaRecordCard'))return;
    const contextCard=$('oaClinicalContext');if(!contextCard)return;
    const card=document.createElement('section');
    card.id='oaCahaRecordCard';
    card.className='oa-card oa-caha-record-card oa-caha-only';
    card.innerHTML=`
      <div class="oa-section-title">Hidroxiapatita de calcio · preparación y trazabilidad</div>
      <div class="oa-caha-grid">
        <label>Producto / marca<input id="oaCahaBrand" placeholder="Marca comercial y línea"></label>
        <label>Presentación<input id="oaCahaPresentation" placeholder="Ej.: 1,5 mL o presentación disponible"></label>
        <label>Lote<input id="oaCahaLot" placeholder="Lote"></label>
        <label>Vencimiento<input id="oaCahaExpiry" type="date"></label>
        <label>Objetivo terapéutico<select id="oaCahaGoal">${Object.entries(GOALS).map(([value,label])=>`<option value="${value}">${label}</option>`).join('')}</select></label>
        <label>Número de sesión<input id="oaCahaSessionNumber" type="number" min="1" step="1" inputmode="numeric"></label>
        <label>Sesiones planificadas<input id="oaCahaPlannedSessions" type="number" min="1" step="1" inputmode="numeric" placeholder="Opcional"></label>
        <label>CaHA utilizada en la mezcla (mL)<input id="oaCahaProductMl" type="number" min="0" step="0.01" inputmode="decimal"></label>
        <label>Diluyente<input id="oaCahaDiluentType" placeholder="Registrar solución utilizada"></label>
        <label>Volumen de diluyente (mL)<input id="oaCahaDiluentMl" type="number" min="0" step="0.01" inputmode="decimal"></label>
        <label>Lidocaína integral<select id="oaCahaLidocaineIntegral"><option value="unknown">No registrado</option><option value="yes">Sí</option><option value="no">No</option></select></label>
        <label>Hora de preparación<input id="oaCahaPreparedAt" type="time"></label>
        <label>Número de pases de mezcla<input id="oaCahaMixingPasses" type="number" min="0" step="1" inputmode="numeric"></label>
        <label>CaHA o rellenos previos<input id="oaCahaPrevious" placeholder="Producto, fecha, zona o desconocido"></label>
        <label class="wide">Observaciones de preparación y plan<textarea id="oaCahaOperatorNotes" rows="2" placeholder="Objetivo, asimetrías, zonas, secuencia, mezcla y observaciones"></textarea></label>
      </div>
      <div class="oa-caha-calculation">
        <div><span>Relación CaHA:diluyente</span><strong id="oaCahaRatio">No calculada</strong></div>
        <div><span>Volumen final preparado</span><strong id="oaCahaFinalVolume">0,00 mL</strong></div>
        <div><span>Volumen confirmado en mapa</span><strong id="oaCahaMappedVolume">0,00 mL</strong></div>
        <div><span>Equivalente estimado de CaHA</span><strong id="oaCahaEquivalent">0,00 mL</strong></div>
      </div>
      <p class="oa-caha-calculation-note">Los cálculos documentan la mezcla registrada por el clínico. ORION no recomienda una relación, dosis, plano ni técnica.</p>
      <div class="oa-section-title" style="margin-top:14px">Lista de verificación antes de administrar</div>
      <div class="oa-caha-safety">
        ${safetyCheck('productVerified','Producto, lote, vencimiento e integridad verificados')}
        ${safetyCheck('goalConfirmed','Objetivo, zona y plano confirmados')}
        ${safetyCheck('ratioConfirmed','Relación de mezcla y volumen final revisados')}
        ${safetyCheck('homogeneousMix','Homogeneidad de la preparación comprobada')}
        ${safetyCheck('remixPlan','Conducta de homogeneización durante la sesión definida')}
        ${safetyCheck('consentReviewed','Consentimiento específico revisado')}
        ${safetyCheck('asepsisConfirmed','Antisepsia, instrumental y material verificados')}
        ${safetyCheck('emergencyPlan','Plan de contingencia disponible')}
        ${safetyCheck('referralRoute','Ruta de derivación urgente conocida')}
        ${safetyCheck('patientContact','Contacto posterior y señales de alarma explicados')}
      </div>
      <div class="oa-caha-alert"><strong>Control clínico:</strong> registrar el producto real, el objetivo, la mezcla final, el plano y la técnica. La bioestimulación con CaHA diluida o hiperdiluida puede corresponder a un uso fuera de indicación según producto y jurisdicción; debe documentarse conforme al criterio profesional y normativa local.</div>`;
    contextCard.insertAdjacentElement('afterend',card);
    hydrateRecord();bindRecord();
  }

  function hydrateRecord(){
    const map={
      oaCahaBrand:'brand',oaCahaPresentation:'presentation',oaCahaLot:'lot',oaCahaExpiry:'expiry',oaCahaGoal:'goal',
      oaCahaSessionNumber:'sessionNumber',oaCahaPlannedSessions:'plannedSessions',oaCahaProductMl:'productMl',
      oaCahaDiluentType:'diluentType',oaCahaDiluentMl:'diluentMl',oaCahaLidocaineIntegral:'lidocaineIntegral',
      oaCahaPreparedAt:'preparedAt',oaCahaMixingPasses:'mixingPasses',oaCahaPrevious:'previousCaha',oaCahaOperatorNotes:'operatorNotes'
    };
    Object.entries(map).forEach(([id,key])=>{if($(id))$(id).value=state.preparation[key]??'';});
    Object.entries(state.safety).forEach(([key,value])=>{const input=$(`oaCahaSafety_${key}`);if(input)input.checked=!!value;});
    updateCalculations();
  }

  function bindRecord(){
    if($('oaCahaRecordCard')?.dataset.bound)return;
    $('oaCahaRecordCard').dataset.bound='1';
    const map={
      oaCahaBrand:'brand',oaCahaPresentation:'presentation',oaCahaLot:'lot',oaCahaExpiry:'expiry',oaCahaGoal:'goal',
      oaCahaSessionNumber:'sessionNumber',oaCahaPlannedSessions:'plannedSessions',oaCahaProductMl:'productMl',
      oaCahaDiluentType:'diluentType',oaCahaDiluentMl:'diluentMl',oaCahaLidocaineIntegral:'lidocaineIntegral',
      oaCahaPreparedAt:'preparedAt',oaCahaMixingPasses:'mixingPasses',oaCahaPrevious:'previousCaha',oaCahaOperatorNotes:'operatorNotes'
    };
    Object.entries(map).forEach(([id,key])=>{
      const input=$(id);if(!input)return;
      const handler=()=>{state.preparation[key]=input.value;saveState();updateCalculations();};
      input.addEventListener('input',handler);input.addEventListener('change',handler);
    });
    Object.keys(state.safety).forEach(key=>{
      $(`oaCahaSafety_${key}`)?.addEventListener('change',event=>{state.safety[key]=event.target.checked;saveState();});
    });
  }

  function updateCalculations(){
    if($('oaCahaRatio'))$('oaCahaRatio').textContent=ratioLabel();
    if($('oaCahaFinalVolume'))$('oaCahaFinalVolume').textContent=`${fmt(finalMl())} mL`;
    if($('oaCahaMappedVolume'))$('oaCahaMappedVolume').textContent=`${fmt(totalMixture())} mL`;
    if($('oaCahaEquivalent'))$('oaCahaEquivalent').textContent=`${fmt(totalProductEquivalent())} mL`;
  }

  function ensureMapUI(){
    const atlasShell=$('atlasShell'),atlasTransform=$('atlasTransform');
    if(!atlasShell||!atlasTransform)return;
    if(!$('oaCahaToolbar')){
      const toolbar=document.createElement('div');
      toolbar.id='oaCahaToolbar';toolbar.className='oa-caha-toolbar oa-caha-only';
      toolbar.innerHTML=`
        <button type="button" data-caha-tool="select">Seleccionar</button>
        <button type="button" data-caha-tool="deposit">＋ Depósito</button>
        <button type="button" data-caha-tool="vector">↗ Vector</button>
        <button type="button" data-caha-tool="area">◯ Área</button>`;
      const anchor=document.querySelector('.oa-mobile-zonebar')||document.querySelector('.oa-map-head');
      anchor?.insertAdjacentElement('afterend',toolbar);
      const help=document.createElement('p');help.id='oaCahaToolHelp';help.className='oa-caha-help oa-caha-only';
      toolbar.insertAdjacentElement('afterend',help);
      toolbar.querySelectorAll('[data-caha-tool]').forEach(button=>button.addEventListener('click',()=>setTool(button.dataset.cahaTool)));
    }
    if(!$('oaCahaEditor')){
      const editor=document.createElement('section');editor.id='oaCahaEditor';editor.className='oa-caha-editor oa-caha-only';editor.hidden=true;
      atlasShell.insertAdjacentElement('beforebegin',editor);
    }
    if(!$('oaCahaLayer')){
      const layer=document.createElement('div');layer.id='oaCahaLayer';layer.className='oa-caha-only';atlasTransform.append(layer);
    }
    if(!atlasShell.dataset.oaCahaBound){atlasShell.dataset.oaCahaBound='1';atlasShell.addEventListener('click',handleAtlasClick,true);}
  }

  function setTool(tool){
    state.tool=['select','deposit','vector','area'].includes(tool)?tool:'select';
    if(state.tool!=='vector')pendingVector=null;
    document.querySelectorAll('[data-caha-tool]').forEach(button=>button.classList.toggle('active',button.dataset.cahaTool===state.tool));
    const help=$('oaCahaToolHelp');
    if(help)help.textContent={
      select:'Toca un elemento para editarlo.',
      deposit:'Toca el atlas para registrar un depósito localizado.',
      vector:'Toca el inicio y luego el final del vector.',
      area:'Toca el centro de la región tratada; ajusta su tamaño en el editor.'
    }[state.tool];
    saveState();
  }

  function coordinates(event){
    const layer=$('oaCahaLayer'),rect=layer.getBoundingClientRect();
    return{x:Math.max(1,Math.min(99,(event.clientX-rect.left)/rect.width*100)),y:Math.max(1,Math.min(99,(event.clientY-rect.top)/rect.height*100))};
  }

  function handleAtlasClick(event){
    if(!isCahaMode()||event.target.closest('.oa-caha-object')||state.tool==='select')return;
    event.preventDefault();event.stopImmediatePropagation();
    const point=coordinates(event);
    if(state.tool==='deposit')createItem({type:'deposit',x:point.x,y:point.y});
    else if(state.tool==='area')createItem({type:'area',x:point.x,y:point.y,width:20,height:13});
    else if(state.tool==='vector'){
      if(!pendingVector){pendingVector=point;toast('Inicio del vector registrado. Toca el punto final.');return;}
      createItem({type:'vector',x1:pendingVector.x,y1:pendingVector.y,x2:point.x,y2:point.y});pendingVector=null;
    }
  }

  function createItem(geometry){
    const type=geometry.type;
    const item={
      id:uid(),type,label:`${TYPE_LABELS[type]} ${state.items.filter(entry=>entry.type===type).length+1}`,
      zone:'',side:'central',mixtureVolume:'',instrument:type==='deposit'?'Aguja':'Cánula',gauge:'',length:'',
      plane:'Otro / no especificado',technique:type==='deposit'?'Bolo / depósito':type==='vector'?'Retroinyección lineal':'Abanico',
      entryPoint:'',comment:'',confirmed:false,...geometry
    };
    state.items.push(item);state.selectedId=item.id;state.tool='select';saveState();renderAll();showEditor(item);toast(`${TYPE_LABELS[type]} creado.`);
  }

  function renderObjects(){
    const layer=$('oaCahaLayer');if(!layer)return;layer.innerHTML='';
    state.items.forEach(item=>{
      const node=document.createElement('button');node.type='button';
      node.className=`oa-caha-object ${item.type}${item.id===state.selectedId?' selected':''}${item.confirmed?' confirmed':''}`;
      node.dataset.id=item.id;node.title=`${item.label}${item.mixtureVolume?` · ${item.mixtureVolume} mL`:''}`;
      if(item.type==='deposit'){
        node.style.left=`${item.x}%`;node.style.top=`${item.y}%`;node.dataset.volume=item.mixtureVolume?`${fmt(item.mixtureVolume)} mL`:'0 mL';
      }else if(item.type==='area'){
        node.style.left=`${item.x}%`;node.style.top=`${item.y}%`;node.style.width=`${item.width||20}%`;node.style.height=`${item.height||13}%`;
      }else{
        const dx=item.x2-item.x1,dy=item.y2-item.y1,width=Math.hypot(dx,dy),angle=Math.atan2(dy,dx)*180/Math.PI;
        node.style.left=`${item.x1}%`;node.style.top=`${item.y1}%`;node.style.width=`${width}%`;node.style.transform=`rotate(${angle}deg)`;
      }
      node.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();state.selectedId=item.id;saveState();renderObjects();showEditor(item);setMobileTab('map');});
      layer.append(node);
    });
  }

  function showEditor(item=selected()){
    const editor=$('oaCahaEditor');if(!editor)return;
    if(!item){editor.hidden=true;editor.innerHTML='';return;}
    editor.hidden=false;
    editor.innerHTML=`
      <div class="oa-caha-editor-head"><div><h3>${esc(item.label)}</h3><p>${TYPE_LABELS[item.type]} · mezcla administrada en mL</p></div><span class="oa-caha-status${item.confirmed?' confirmed':''}">${item.confirmed?'Confirmado':'Borrador'}</span></div>
      <div class="oa-caha-editor-grid">
        <label>Etiqueta<input id="oaCahaItemLabel" value="${esc(item.label)}"></label>
        <label>Zona<select id="oaCahaItemZone"><option value="">Seleccionar</option>${ZONES.map(zone=>`<option${item.zone===zone?' selected':''}>${zone}</option>`).join('')}</select></label>
        <label>Lateralidad<select id="oaCahaItemSide"><option value="central"${item.side==='central'?' selected':''}>Central / bilateral</option><option value="right"${item.side==='right'?' selected':''}>Derecha</option><option value="left"${item.side==='left'?' selected':''}>Izquierda</option></select></label>
        <label>Volumen de mezcla administrado (mL)<input id="oaCahaItemVolume" type="number" min="0" step="0.01" inputmode="decimal" value="${esc(item.mixtureVolume)}"></label>
        <label>Instrumento<select id="oaCahaItemInstrument"><option${item.instrument==='Aguja'?' selected':''}>Aguja</option><option${item.instrument==='Cánula'?' selected':''}>Cánula</option><option${item.instrument==='Otro'?' selected':''}>Otro</option></select></label>
        <label>Calibre<input id="oaCahaItemGauge" value="${esc(item.gauge)}" placeholder="Ej.: 22G"></label>
        <label>Longitud<input id="oaCahaItemLength" value="${esc(item.length)}" placeholder="Ej.: 50 mm"></label>
        <label>Plano<select id="oaCahaItemPlane">${PLANES.map(value=>`<option${item.plane===value?' selected':''}>${value}</option>`).join('')}</select></label>
        <label>Técnica<select id="oaCahaItemTechnique">${TECHNIQUES.map(value=>`<option${item.technique===value?' selected':''}>${value}</option>`).join('')}</select></label>
        <label>Punto de entrada<input id="oaCahaItemEntry" value="${esc(item.entryPoint)}" placeholder="Descripción anatómica"></label>
        ${item.type==='area'?`<label>Ancho del área (%)<input id="oaCahaItemWidth" type="number" min="4" max="70" step="1" value="${num(item.width)||20}"></label><label>Alto del área (%)<input id="oaCahaItemHeight" type="number" min="4" max="70" step="1" value="${num(item.height)||13}"></label>`:''}
        <label class="wide">Comentario / observación<textarea id="oaCahaItemComment" rows="2">${esc(item.comment)}</textarea></label>
      </div>
      <div class="oa-caha-item-metrics"><span>Equivalente estimado de CaHA</span><strong>${fmt(productEquivalent(item))} mL</strong></div>
      <div class="oa-caha-editor-actions">
        <button type="button" id="oaCahaSaveItem">Guardar cambios</button>
        <button type="button" class="confirm" id="oaCahaConfirmItem">${item.confirmed?'Reabrir elemento':'Confirmar administración'}</button>
        <button type="button" class="delete" id="oaCahaDeleteItem">Eliminar</button>
      </div>`;
    $('oaCahaSaveItem').onclick=()=>saveEditor(false);
    $('oaCahaConfirmItem').onclick=()=>saveEditor(true);
    $('oaCahaDeleteItem').onclick=deleteSelected;
  }

  function saveEditor(toggleConfirm){
    const item=selected();if(!item)return;
    item.label=clean($('oaCahaItemLabel')?.value)||item.label;
    item.zone=$('oaCahaItemZone')?.value||'';item.side=$('oaCahaItemSide')?.value||'central';
    item.mixtureVolume=Math.max(0,num($('oaCahaItemVolume')?.value));item.instrument=$('oaCahaItemInstrument')?.value||'';
    item.gauge=clean($('oaCahaItemGauge')?.value);item.length=clean($('oaCahaItemLength')?.value);
    item.plane=$('oaCahaItemPlane')?.value||'';item.technique=$('oaCahaItemTechnique')?.value||'';
    item.entryPoint=clean($('oaCahaItemEntry')?.value);item.comment=clean($('oaCahaItemComment')?.value);
    if(item.type==='area'){
      item.width=Math.max(4,Math.min(70,num($('oaCahaItemWidth')?.value)||20));
      item.height=Math.max(4,Math.min(70,num($('oaCahaItemHeight')?.value)||13));
    }
    if(toggleConfirm){
      if(!item.confirmed&&item.mixtureVolume<=0){window.alert('Ingresa un volumen administrado mayor que cero antes de confirmar.');return;}
      if(!item.confirmed&&!item.zone){window.alert('Selecciona la zona anatómica antes de confirmar.');return;}
      if(!item.confirmed&&finalMl()<=0){window.alert('Registra el volumen de CaHA y el diluyente antes de confirmar la administración.');return;}
      item.confirmed=!item.confirmed;item.confirmedAt=item.confirmed?new Date().toISOString():'';
    }
    saveState();updateCalculations();renderAll();showEditor(item);toast(item.confirmed?'Administración confirmada.':'Cambios guardados.');
  }

  function deleteSelected(){
    const item=selected();if(!item)return;
    if(!window.confirm(`¿Eliminar ${item.label}?`))return;
    state.items=state.items.filter(entry=>entry.id!==item.id);state.selectedId=null;saveState();renderAll();showEditor(null);
  }

  function ensureSummary(){
    if($('oaCahaSummary'))return;
    const record=document.querySelector('.oa-record-panel');if(!record)return;
    const card=document.createElement('section');card.id='oaCahaSummary';card.className='oa-card oa-caha-summary oa-caha-only oa-mobile-summary';
    card.innerHTML='<div class="oa-section-title">Resumen de hidroxiapatita de calcio</div><div id="oaCahaSummaryContent"></div>';
    record.append(card);
  }

  function sideLabel(value){return{right:'Derecha',left:'Izquierda',central:'Central / bilateral'}[value]||value;}
  function renderSummary(){
    const content=$('oaCahaSummaryContent');if(!content)return;
    const confirmed=confirmedItems();
    const rows=confirmed.map(item=>`<tr><td>${TYPE_LABELS[item.type]}</td><td>${esc(item.zone||'—')}</td><td>${esc(sideLabel(item.side))}</td><td>${fmt(item.mixtureVolume)} mL</td><td>${fmt(productEquivalent(item))} mL</td><td>${esc(item.plane||'—')}</td><td>${esc(item.technique||'—')}</td></tr>`).join('');
    content.innerHTML=`
      <div class="oa-caha-summary-grid">
        <div><span>Elementos confirmados</span><strong>${confirmed.length}</strong></div>
        <div><span>Mezcla administrada</span><strong>${fmt(totalMixture())} mL</strong></div>
        <div><span>Equivalente estimado de CaHA</span><strong>${fmt(totalProductEquivalent())} mL</strong></div>
        <div><span>Relación registrada</span><strong>${ratioLabel()}</strong></div>
      </div>
      <div class="oa-caha-table-wrap"><table class="oa-caha-table"><thead><tr><th>Tipo</th><th>Zona</th><th>Lado</th><th>Mezcla</th><th>CaHA eq.</th><th>Plano</th><th>Técnica</th></tr></thead><tbody>${rows||'<tr><td colspan="7">Aún no existen elementos confirmados.</td></tr>'}</tbody></table></div>`;
    updateCalculations();
  }

  function syncContextQuantity(){
    if(!isCahaMode())return;
    const quantity=$('oaQuantity'),unit=$('oaUnit');
    if(quantity){quantity.value=String(totalMixture());quantity.readOnly=true;quantity.dispatchEvent(new Event('input',{bubbles:true}));}
    if(unit){unit.value='mL';unit.dispatchEvent(new Event('change',{bubbles:true}));}
  }

  function applyMode(){
    const active=isCahaMode();document.documentElement.classList.toggle('oa-caha-mode',active);
    if(active){
      ensureRecordCard();ensureMapUI();ensureSummary();setTool(state.tool);renderAll();syncContextQuantity();
      const subtitle=document.querySelector('.oa-title span');if(subtitle)subtitle.textContent='Motor de hidroxiapatita de calcio · preparación, vectores y áreas';
      const mapText=document.querySelector('.oa-map-head span');if(mapText)mapText.textContent='Registra depósitos, vectores o áreas y documenta mezcla administrada, plano, técnica y lateralidad.';
    }else{
      const quantity=$('oaQuantity');if(quantity)quantity.readOnly=false;pendingVector=null;
    }
  }

  function renderAll(){renderObjects();renderSummary();setTool(state.tool);}

  function item(label,value,wide=false){return `<div class="item${wide?' wide':''}"><span>${esc(label)}</span><strong>${esc(clean(value)||'No registrado')}</strong></div>`;}
  function page(title,subtitle,code,body,pageNumber,total){return `<section class="page"><header><img src="../../assets/brand/orion-health.png" alt="ORION Health"><div><h1>${esc(title)}</h1><p>${esc(subtitle)}</p></div><aside>${esc(code)}<br>V${VERSION}</aside></header>${body}<footer><span>ORION Health · Documento clínico</span><span>Página ${pageNumber} de ${total}</span></footer></section>`;}
  function safetyLabel(key){return{
    productVerified:'Producto, lote y vencimiento verificados',goalConfirmed:'Objetivo, zona y plano confirmados',ratioConfirmed:'Relación y volumen final revisados',
    homogeneousMix:'Homogeneidad comprobada',remixPlan:'Conducta de homogeneización definida',consentReviewed:'Consentimiento revisado',
    asepsisConfirmed:'Antisepsia e instrumental verificados',emergencyPlan:'Plan de contingencia disponible',referralRoute:'Ruta de derivación operativa',patientContact:'Contacto y alarmas explicados'
  }[key]||key;}

  function reportStyle(){return `
    @page{size:Letter portrait;margin:0}*{box-sizing:border-box}body{margin:0;background:#dfe6ed;font-family:Arial,sans-serif;color:#19344c}.page{position:relative;width:215.9mm;min-height:279.4mm;margin:10px auto;padding:16mm 15mm 18mm;background:#fff;page-break-after:always;overflow:hidden}header{display:grid;grid-template-columns:34mm 1fr 34mm;gap:8mm;align-items:center;padding-bottom:6mm;border-bottom:1.5px solid #8a6a24}header img{width:28mm;max-height:18mm;object-fit:contain}header h1{margin:0;color:#684e16;font-size:18px}header p{margin:2px 0 0;color:#7c735f;font-size:10px}header aside{text-align:right;color:#756d5c;font-size:9px;line-height:1.45}h2{margin:7mm 0 3mm;color:#684e16;font-size:16px}h3{margin:5mm 0 2mm;color:#81652b;font-size:12px}p,li{font-size:10px;line-height:1.48}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:3mm}.item{padding:3mm;border:1px solid #e3dccd;border-radius:2mm;background:#fbfaf6}.item.wide{grid-column:1/-1}.item span{display:block;color:#837865;font-size:8px}.item strong{display:block;margin-top:1mm;color:#4f4227;font-size:10px;white-space:pre-wrap}.alert{padding:4mm;border:1px solid #e7c5a4;border-radius:2mm;background:#fff7ed;color:#744725}.checklist{display:grid;grid-template-columns:1fr 1fr;gap:2mm}.check{padding:3mm;border:1px solid #e4ddcf;border-radius:2mm;background:#fbfaf6;font-size:9px}.check.yes::before{content:'✓ ';color:#21844b;font-weight:bold}.check.no::before{content:'○ ';color:#9a5a22;font-weight:bold}.map-layout{display:grid;grid-template-columns:115mm 1fr;gap:8mm;align-items:start}.atlas{position:relative;width:115mm;height:170mm;overflow:hidden;border:1px solid #d7cebd;border-radius:3mm;background:#f4f1ed}.atlas img{width:100%;height:100%;object-fit:cover;object-position:center top}.deposit,.area,.vector{position:absolute}.deposit{width:5mm;height:5mm;transform:translate(-50%,-50%);border:1.2mm solid #fff;border-radius:50%;background:#b1821f;box-shadow:0 0 0 .7mm #75520d}.deposit b{position:absolute;left:50%;top:5.5mm;transform:translateX(-50%);min-width:14mm;padding:1mm;border-radius:1.5mm;background:#fff;color:#684e16;font-size:7px;text-align:center}.area{transform:translate(-50%,-50%);border:1mm dashed #b1821f;border-radius:50%;background:rgba(201,160,65,.18)}.vector{height:1.8mm;transform-origin:0 50%;border-radius:2mm;background:#9a6f18;box-shadow:0 0 0 .5mm #fff}table{width:100%;border-collapse:collapse;font-size:8.5px}th,td{padding:2.2mm;border-bottom:1px solid #e5dfd3;text-align:left;vertical-align:top}th{background:#f5f0e6;color:#6b5424}.draft{padding:3mm;border:1px solid #efcf88;background:#fff7df;color:#72530a;font-size:9px}.signatures{display:grid;grid-template-columns:1fr 1fr;gap:20mm;margin-top:25mm}.signatures div{padding-top:3mm;border-top:1px solid #6f6248;text-align:center;font-size:9px}footer{position:absolute;left:15mm;right:15mm;bottom:8mm;display:flex;justify-content:space-between;border-top:1px solid #e2dccf;padding-top:2mm;color:#796f5f;font-size:8px}@media print{body{background:#fff}.page{margin:0;box-shadow:none}}
  `;}

  function reportMapMarkup(items){
    const source=$('atlasImage')?.src||'';
    return `<div class="atlas"><img src="${esc(source)}" alt="Atlas clínico">${items.map(entry=>{
      if(entry.type==='deposit')return `<span class="deposit" style="left:${entry.x}%;top:${entry.y}%"><b>${fmt(entry.mixtureVolume)} mL</b></span>`;
      if(entry.type==='area')return `<span class="area" style="left:${entry.x}%;top:${entry.y}%;width:${entry.width||20}%;height:${entry.height||13}%"></span>`;
      const dx=entry.x2-entry.x1,dy=entry.y2-entry.y1,width=Math.hypot(dx,dy),angle=Math.atan2(dy,dx)*180/Math.PI;
      return `<span class="vector" style="left:${entry.x1}%;top:${entry.y1}%;width:${width}%;transform:rotate(${angle}deg)"></span>`;
    }).join('')}</div>`;
  }

  function buildReport(){
    const proc=procedure(),ctx=context(),patient=proc.patient||{},items=confirmedItems();
    if(!items.length){window.alert('Confirma al menos un depósito, vector o área antes de generar el informe.');return;}
    const prep=state.preparation,total=totalMixture(),equivalent=totalProductEquivalent(),pages=[],totalPages=5;
    let pageNumber=1;
    const checklist=Object.entries(state.safety).map(([key,value])=>`<div class="check ${value?'yes':'no'}">${esc(safetyLabel(key))}</div>`).join('');
    const registration=`<h2>Registro clínico y preparación</h2><div class="grid">
      ${item('Paciente',patient.name)}${item('RUN / RUT',patient.id)}${item('Fecha',patient.date)}
      ${item('Procedimiento','Hidroxiapatita de calcio')}${item('Objetivo',GOALS[prep.goal]||prep.goal)}${item('Sesión',`${prep.sessionNumber||'—'} de ${prep.plannedSessions||'—'}`)}
      ${item('Indicación / objetivo',ctx.indication,true)}${item('Zonas',ctx.zones,true)}${item('Técnica / plano general',ctx.technique,true)}
      ${item('Producto / marca',prep.brand)}${item('Presentación',prep.presentation)}${item('Lote',prep.lot)}${item('Vencimiento',prep.expiry)}
      ${item('CaHA en mezcla',`${fmt(productMl())} mL`)}${item('Diluyente',prep.diluentType)}${item('Diluyente',`${fmt(diluentMl())} mL`)}
      ${item('Relación registrada',ratioLabel())}${item('Volumen final',`${fmt(finalMl())} mL`)}${item('Preparación',prep.preparedAt)}
      ${item('Pases de mezcla',prep.mixingPasses)}${item('Lidocaína integral',prep.lidocaineIntegral==='yes'?'Sí':prep.lidocaineIntegral==='no'?'No':'No registrado')}${item('CaHA / rellenos previos',prep.previousCaha,true)}
      ${item('Observaciones',prep.operatorNotes,true)}
    </div><h3>Verificación de seguridad</h3><div class="checklist">${checklist}</div><div class="alert"><strong>Nota documental:</strong> ORION registra la preparación y administración indicada por el profesional; no prescribe dilución, dosis, plano ni técnica. Verificar indicaciones autorizadas y normativa local.</div>`;
    pages.push(page('ORION Armonización Orofacial','CaHA · registro y preparación','ORH-AO-CAHA-REG-001',registration,pageNumber++,totalPages));
    const map=`<h2>Mapa final del procedimiento</h2><p>Depósitos, vectores y áreas con administración confirmada.</p><div class="map-layout">${reportMapMarkup(items)}<div>${item('Elementos',items.length)}${item('Mezcla administrada',`${fmt(total)} mL`)}${item('CaHA equivalente',`${fmt(equivalent)} mL`)}${item('Relación',ratioLabel())}${item('Objetivo',GOALS[prep.goal]||prep.goal)}${item('Producto',prep.brand)}${item('Lote',prep.lot)}</div></div>`;
    pages.push(page('ORION Armonización Orofacial','Mapa de hidroxiapatita de calcio','ORH-AO-CAHA-MAP-001',map,pageNumber++,totalPages));
    const rows=items.map(entry=>`<tr><td>${TYPE_LABELS[entry.type]}</td><td>${esc(entry.zone)}</td><td>${esc(sideLabel(entry.side))}</td><td>${fmt(entry.mixtureVolume)} mL</td><td>${fmt(productEquivalent(entry))} mL</td><td>${esc(entry.instrument)} ${esc(entry.gauge)} ${esc(entry.length)}</td><td>${esc(entry.plane)}</td><td>${esc(entry.technique)}</td><td>${esc(entry.entryPoint)}</td><td>${esc(entry.comment)}</td></tr>`).join('');
    const trace=`<h2>Trazabilidad de administración</h2><table><thead><tr><th>Tipo</th><th>Zona</th><th>Lado</th><th>Mezcla</th><th>CaHA eq.</th><th>Instrumento</th><th>Plano</th><th>Técnica</th><th>Entrada</th><th>Comentario</th></tr></thead><tbody>${rows}</tbody></table><div class="grid" style="margin-top:5mm">${item('Mezcla total',`${fmt(total)} mL`)}${item('CaHA equivalente',`${fmt(equivalent)} mL`)}${item('Relación',ratioLabel())}</div>`;
    pages.push(page('ORION Armonización Orofacial','Trazabilidad por elemento','ORH-AO-CAHA-TRA-001',trace,pageNumber++,totalPages));
    const consent=`<div class="draft">BORRADOR CLÍNICO: revisar, explicar y adaptar antes de la firma.</div><h2>Consentimiento informado específico</h2><div class="grid">${item('Paciente',patient.name)}${item('RUN / RUT',patient.id)}${item('Fecha',patient.date)}${item('Procedimiento','Hidroxiapatita de calcio')}${item('Producto',prep.brand)}${item('Objetivo',GOALS[prep.goal]||prep.goal)}</div><h3>Objetivo y alternativas</h3><p>${esc(clean(ctx.indication)||'Objetivo clínico-estético explicado durante la evaluación.')}</p><p>Se explicó la alternativa de no realizar el procedimiento y otras opciones terapéuticas.</p><h3>Riesgos y eventos posibles</h3><ul><li>Dolor, edema, hematoma, sensibilidad, asimetría, irregularidad o induración.</li><li>Nódulos, inflamación persistente, infección, visibilidad o palpabilidad del producto y necesidad de corrección.</li><li>Compromiso vascular accidental, lesión tisular o eventos graves que requieren evaluación inmediata.</li><li>Resultados parciales, tardíos o necesidad de sesiones y controles adicionales.</li><li>El uso diluido o hiperdiluido para bioestimulación puede ser fuera de indicación según producto y jurisdicción.</li></ul><p>Declaro haber informado mis antecedentes, haber podido formular preguntas y comprender la información recibida.</p><div class="signatures"><div>Firma del paciente</div><div>Firma del profesional</div></div>`;
    pages.push(page('ORION Armonización Orofacial','Consentimiento informado · CaHA','ORH-AO-CAHA-CNS-001',consent,pageNumber++,totalPages));
    const contact=loadJSON(SETTINGS_KEY,{}).contact||'Equipo tratante';
    const aftercare=`<div class="draft">DOCUMENTO PARA REVISIÓN PROFESIONAL: adaptar a producto, zona, técnica y protocolo institucional.</div><h2>Indicaciones posteriores</h2><div class="grid">${item('Paciente',patient.name)}${item('Fecha',patient.date)}${item('Procedimiento','Hidroxiapatita de calcio')}${item('Producto',prep.brand)}${item('Contacto clínico',contact)}${item('Sesión',prep.sessionNumber)}</div><h3>Cuidados</h3><ul><li>Seguir las instrucciones específicas sobre manipulación, masaje, ejercicio, calor, cosméticos y otros procedimientos.</li><li>Asistir a los controles indicados y comunicar cualquier evolución inesperada.</li><li>No modificar tratamientos médicos habituales sin indicación del profesional tratante.</li></ul><h3>Señales de alarma</h3><div class="alert">Contactar inmediatamente al equipo tratante o acudir a evaluación urgente ante dolor intenso o progresivo, palidez, piel fría, cambios importantes de coloración, ampollas, alteraciones visuales, debilidad, dificultad para hablar u otros síntomas neurológicos.</div><h3>Observaciones específicas</h3><p>${esc(clean(ctx.procedureNotes)||clean(prep.operatorNotes)||'Sin observaciones adicionales.')}</p><div class="signatures"><div>Recibí y comprendí las indicaciones</div><div>Firma / identificación profesional</div></div>`;
    pages.push(page('ORION Armonización Orofacial','Indicaciones posteriores · CaHA','ORH-AO-CAHA-IND-001',aftercare,pageNumber++,totalPages));
    const popup=window.open('','_blank');if(!popup){window.alert('Permite ventanas emergentes para generar el informe.');return;}
    popup.document.open();popup.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Informe CaHA</title><style>${reportStyle()}</style></head><body>${pages.join('')}<script>window.addEventListener('load',()=>setTimeout(()=>window.print(),500));<\/script></body></html>`);popup.document.close();
  }

  function interceptReportButtons(){
    document.addEventListener('click',event=>{
      if(!isCahaMode())return;
      const button=event.target.closest('button');if(!button)return;
      const id=button.id||'',label=button.textContent||'';
      if(!['btnPrint','btnPrintTop'].includes(id)&&!/informe.*pdf|imprimir.*pdf|exportar.*pdf/i.test(label))return;
      event.preventDefault();event.stopImmediatePropagation();buildReport();
    },true);
  }

  function observeMode(){
    $('oaIntervention')?.addEventListener('change',()=>setTimeout(applyMode,0));
    new MutationObserver(()=>{if(document.body.dataset.procedureKind==='caha')applyMode();}).observe(document.body,{attributes:true,attributeFilter:['data-procedure-kind']});
  }

  function boot(){
    if(mounted)return;
    if(!$('atlasShell')||!$('oaIntervention')){setTimeout(boot,100);return;}
    mounted=true;document.documentElement.dataset.orionAestheticsVersion=VERSION;
    document.querySelectorAll('.oa-version').forEach(node=>node.textContent=`V${VERSION}`);
    ensureRecordCard();ensureMapUI();ensureSummary();observeMode();interceptReportButtons();applyMode();renderAll();
  }

  boot();
})();
