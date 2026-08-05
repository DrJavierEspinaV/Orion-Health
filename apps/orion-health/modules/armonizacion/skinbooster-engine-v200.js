(()=>{
  'use strict';

  const VERSION='2.0.0';
  const STORE_KEY='orion_aesthetic_skinbooster_v200';
  const PROCEDURE_KEY='orion_aesthetic_procedure_v145';
  const CONTEXT_KEY='orion_aesthetic_clinical_context_v147';
  const SETTINGS_KEY='orion_aesthetic_v160_settings';
  const $=id=>document.getElementById(id);
  const uid=()=>`s${Date.now().toString(36)}${Math.random().toString(36).slice(2,7)}`;
  const num=value=>{const parsed=Number.parseFloat(String(value??'').replace(',','.'));return Number.isFinite(parsed)?parsed:0;};
  const fmt=(value,decimals=2)=>num(value).toLocaleString('es-CL',{minimumFractionDigits:decimals,maximumFractionDigits:decimals});
  const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const clean=value=>String(value??'').trim();

  const TYPE_LABELS={micro:'Microdepósito',sequence:'Secuencia',area:'Área'};
  const CATEGORIES={ha:'Ácido hialurónico para calidad cutánea',pn:'Polinucleótidos / PDRN',complex:'Complejo multicomponente',other:'Otro producto inyectable'};
  const ZONES=['Frente','Glabela','Sien','Región periocular','Mejilla','Pómulo / malar','Nariz','Perioral','Mentón','Mandíbula','Cuello','Escote','Dorso de manos','Otra zona'];
  const PLANES=['Intradérmico superficial','Intradérmico medio','Intradérmico profundo','Subdérmico','Otro / no especificado'];
  const PATTERNS=['Punto a punto','Microdepósitos seriados','Cuadrícula','Abanico','Lineal','Distribución homogénea por área','Otro patrón'];

  let state=loadState();
  let mounted=false;
  let pendingSequence=null;
  let applyingTab=false;

  function defaultState(){
    return{
      tool:'select',selectedId:null,
      product:{
        brand:'',category:'ha',composition:'',presentation:'',lot:'',expiry:'',availableMl:'',sessionNumber:'1',plannedSessions:'',
        objective:'',anesthesia:'',device:'Aguja',defaultGauge:'',defaultLength:'',previousTreatments:'',operatorNotes:''
      },
      safety:{
        productVerified:false,compositionReviewed:false,skinBaseline:false,infectionExcluded:false,historyReviewed:false,
        consentReviewed:false,asepsisConfirmed:false,vascularPlan:false,referralRoute:false,aftercareExplained:false
      },
      items:[]
    };
  }

  function loadJSON(key,fallback){try{return JSON.parse(sessionStorage.getItem(key)||'null')??fallback;}catch(_){return fallback;}}
  function saveJSON(key,value){try{sessionStorage.setItem(key,JSON.stringify(value));return true;}catch(_){return false;}}
  function loadState(){
    const base=defaultState(),saved=loadJSON(STORE_KEY,null);
    return saved&&Array.isArray(saved.items)?{...base,...saved,product:{...base.product,...saved.product},safety:{...base.safety,...saved.safety}}:base;
  }
  function saveState(){saveJSON(STORE_KEY,state);syncContextQuantity();renderSummary();updateMetrics();}
  function procedure(){return loadJSON(PROCEDURE_KEY,{patient:{},vial:{},points:[]});}
  function context(){return loadJSON(CONTEXT_KEY,{});}
  function isSkinMode(){return $('oaIntervention')?.value==='skinbooster'||document.body.dataset.procedureKind==='skinbooster';}
  function selected(){return state.items.find(item=>item.id===state.selectedId)||null;}
  function confirmedItems(){return state.items.filter(item=>item.confirmed&&num(item.totalVolume)>0&&num(item.pointCount)>0);}
  function totalVolume(){return confirmedItems().reduce((sum,item)=>sum+num(item.totalVolume),0);}
  function totalPoints(){return confirmedItems().reduce((sum,item)=>sum+Math.max(1,Math.round(num(item.pointCount))),0);}
  function volumePerPoint(item){const count=Math.max(1,Math.round(num(item.pointCount)));return num(item.totalVolume)/count;}
  function remainingVolume(){return Math.max(0,num(state.product.availableMl)-totalVolume());}

  function toast(message){
    const node=$('toast');if(!node)return;
    node.textContent=message;node.classList.add('show');clearTimeout(toast.timer);
    toast.timer=setTimeout(()=>node.classList.remove('show'),2300);
  }
  function setMobileTab(tab){
    if(applyingTab)return;applyingTab=true;document.body.dataset.mobileTab=tab;
    document.querySelectorAll('[data-mobile-tab]').forEach(button=>button.classList.toggle('active',button.dataset.mobileTab===tab));
    requestAnimationFrame(()=>{applyingTab=false;});
  }
  function safetyCheck(key,label){return `<label class="oa-skin-check"><input type="checkbox" id="oaSkinSafety_${key}"><span>${label}</span></label>`;}

  function ensureRecordCard(){
    if($('oaSkinRecordCard'))return;
    const contextCard=$('oaClinicalContext');if(!contextCard)return;
    const card=document.createElement('section');
    card.id='oaSkinRecordCard';card.className='oa-card oa-skin-record oa-skin-only';
    card.innerHTML=`
      <div class="oa-section-title">Skinbooster / mesoterapia · producto y sesión</div>
      <div class="oa-skin-grid">
        <label>Producto / marca<input id="oaSkinBrand" placeholder="Marca comercial y línea"></label>
        <label>Categoría<select id="oaSkinCategory">${Object.entries(CATEGORIES).map(([value,label])=>`<option value="${value}">${label}</option>`).join('')}</select></label>
        <label>Composición declarada<input id="oaSkinComposition" placeholder="Componentes y concentración según envase"></label>
        <label>Presentación<input id="oaSkinPresentation" placeholder="Ej.: jeringa o vial"></label>
        <label>Lote<input id="oaSkinLot" placeholder="Lote"></label>
        <label>Vencimiento<input id="oaSkinExpiry" type="date"></label>
        <label>Volumen disponible (mL)<input id="oaSkinAvailable" type="number" min="0" step="0.01" inputmode="decimal"></label>
        <label>Sesión<input id="oaSkinSession" type="number" min="1" step="1" inputmode="numeric"></label>
        <label>Sesiones planificadas<input id="oaSkinPlanned" type="number" min="1" step="1" inputmode="numeric" placeholder="Opcional"></label>
        <label>Objetivo clínico<input id="oaSkinObjective" placeholder="Hidratación, textura u objetivo acordado"></label>
        <label>Anestesia / preparación<input id="oaSkinAnesthesia" placeholder="Antisepsia, anestesia u otros"></label>
        <label>Dispositivo principal<select id="oaSkinDevice"><option>Aguja</option><option>Multinyector</option><option>Cánula</option><option>Otro</option></select></label>
        <label>Calibre habitual<input id="oaSkinGauge" placeholder="Registrar calibre utilizado"></label>
        <label>Longitud habitual<input id="oaSkinLength" placeholder="Registrar longitud utilizada"></label>
        <label>Tratamientos previos<input id="oaSkinPrevious" placeholder="Producto, fecha, zona o desconocido"></label>
        <label class="wide">Observaciones generales<textarea id="oaSkinNotes" rows="2" placeholder="Calidad cutánea basal, patrón previsto, asimetrías y observaciones"></textarea></label>
      </div>
      <div class="oa-skin-metrics">
        <div><span>Volumen confirmado</span><strong id="oaSkinMappedVolume">0,00 mL</strong></div>
        <div><span>Puntos confirmados</span><strong id="oaSkinMappedPoints">0</strong></div>
        <div><span>Volumen disponible</span><strong id="oaSkinAvailableMetric">0,00 mL</strong></div>
        <div><span>Volumen remanente</span><strong id="oaSkinRemaining">0,00 mL</strong></div>
      </div>
      <p class="oa-skin-note">ORION registra el patrón decidido por el profesional. No propone dosis por punto, separación, profundidad ni número de sesiones.</p>
      <div class="oa-section-title" style="margin-top:14px">Lista de verificación antes de administrar</div>
      <div class="oa-skin-safety">
        ${safetyCheck('productVerified','Producto, lote, vencimiento e integridad verificados')}
        ${safetyCheck('compositionReviewed','Composición, indicación y fabricante revisados')}
        ${safetyCheck('skinBaseline','Estado cutáneo y fotografías basales registradas cuando corresponde')}
        ${safetyCheck('infectionExcluded','Sin infección, inflamación o lesión activa en la zona')}
        ${safetyCheck('historyReviewed','Alergias, medicamentos y procedimientos previos revisados')}
        ${safetyCheck('consentReviewed','Consentimiento específico revisado')}
        ${safetyCheck('asepsisConfirmed','Antisepsia, instrumental y material verificados')}
        ${safetyCheck('vascularPlan','Plan ante compromiso vascular o reacción adversa disponible')}
        ${safetyCheck('referralRoute','Ruta de evaluación o derivación urgente conocida')}
        ${safetyCheck('aftercareExplained','Cuidados, contacto y señales de alarma explicados')}
      </div>
      <div class="oa-skin-alert"><strong>Alerta clínica:</strong> confirmar que el producto sea apto para inyección y documentar su indicación real. Dolor inusual, blanqueamiento, cambios de coloración, alteraciones visuales o síntomas neurológicos requieren detener la administración y activar evaluación urgente.</div>`;
    contextCard.insertAdjacentElement('afterend',card);hydrateRecord();bindRecord();
  }

  function hydrateRecord(){
    const map={oaSkinBrand:'brand',oaSkinCategory:'category',oaSkinComposition:'composition',oaSkinPresentation:'presentation',oaSkinLot:'lot',oaSkinExpiry:'expiry',oaSkinAvailable:'availableMl',oaSkinSession:'sessionNumber',oaSkinPlanned:'plannedSessions',oaSkinObjective:'objective',oaSkinAnesthesia:'anesthesia',oaSkinDevice:'device',oaSkinGauge:'defaultGauge',oaSkinLength:'defaultLength',oaSkinPrevious:'previousTreatments',oaSkinNotes:'operatorNotes'};
    Object.entries(map).forEach(([id,key])=>{if($(id))$(id).value=state.product[key]??'';});
    Object.entries(state.safety).forEach(([key,value])=>{const input=$(`oaSkinSafety_${key}`);if(input)input.checked=!!value;});
    updateMetrics();
  }
  function bindRecord(){
    const card=$('oaSkinRecordCard');if(!card||card.dataset.bound)return;card.dataset.bound='1';
    const map={oaSkinBrand:'brand',oaSkinCategory:'category',oaSkinComposition:'composition',oaSkinPresentation:'presentation',oaSkinLot:'lot',oaSkinExpiry:'expiry',oaSkinAvailable:'availableMl',oaSkinSession:'sessionNumber',oaSkinPlanned:'plannedSessions',oaSkinObjective:'objective',oaSkinAnesthesia:'anesthesia',oaSkinDevice:'device',oaSkinGauge:'defaultGauge',oaSkinLength:'defaultLength',oaSkinPrevious:'previousTreatments',oaSkinNotes:'operatorNotes'};
    Object.entries(map).forEach(([id,key])=>{const input=$(id);if(!input)return;const handler=()=>{state.product[key]=input.value;saveState();};input.addEventListener('input',handler);input.addEventListener('change',handler);});
    Object.keys(state.safety).forEach(key=>$(`oaSkinSafety_${key}`)?.addEventListener('change',event=>{state.safety[key]=event.target.checked;saveState();}));
  }
  function updateMetrics(){
    if($('oaSkinMappedVolume'))$('oaSkinMappedVolume').textContent=`${fmt(totalVolume())} mL`;
    if($('oaSkinMappedPoints'))$('oaSkinMappedPoints').textContent=String(totalPoints());
    if($('oaSkinAvailableMetric'))$('oaSkinAvailableMetric').textContent=`${fmt(state.product.availableMl)} mL`;
    if($('oaSkinRemaining'))$('oaSkinRemaining').textContent=`${fmt(remainingVolume())} mL`;
  }

  function ensureMapUI(){
    const atlasShell=$('atlasShell'),atlasTransform=$('atlasTransform');if(!atlasShell||!atlasTransform)return;
    if(!$('oaSkinToolbar')){
      const toolbar=document.createElement('div');toolbar.id='oaSkinToolbar';toolbar.className='oa-skin-toolbar oa-skin-only';
      toolbar.innerHTML='<button type="button" data-skin-tool="select">Seleccionar</button><button type="button" data-skin-tool="micro">＋ Microdepósito</button><button type="button" data-skin-tool="sequence">↗ Secuencia</button><button type="button" data-skin-tool="area">◯ Área</button>';
      const anchor=document.querySelector('.oa-mobile-zonebar')||document.querySelector('.oa-map-head');anchor?.insertAdjacentElement('afterend',toolbar);
      const help=document.createElement('p');help.id='oaSkinToolHelp';help.className='oa-skin-help oa-skin-only';toolbar.insertAdjacentElement('afterend',help);
      toolbar.querySelectorAll('[data-skin-tool]').forEach(button=>button.addEventListener('click',()=>setTool(button.dataset.skinTool)));
    }
    if(!$('oaSkinEditor')){const editor=document.createElement('section');editor.id='oaSkinEditor';editor.className='oa-skin-editor oa-skin-only';editor.hidden=true;atlasShell.insertAdjacentElement('beforebegin',editor);}
    if(!$('oaSkinLayer')){const layer=document.createElement('div');layer.id='oaSkinLayer';layer.className='oa-skin-only';atlasTransform.append(layer);}
    if(!atlasShell.dataset.oaSkinBound){atlasShell.dataset.oaSkinBound='1';atlasShell.addEventListener('click',handleAtlasClick,true);}
  }
  function setTool(tool){
    state.tool=['select','micro','sequence','area'].includes(tool)?tool:'select';if(state.tool!=='sequence')pendingSequence=null;
    document.querySelectorAll('[data-skin-tool]').forEach(button=>button.classList.toggle('active',button.dataset.skinTool===state.tool));
    const help=$('oaSkinToolHelp');if(help)help.textContent={select:'Toca un elemento para editarlo.',micro:'Toca el atlas para registrar un microdepósito.',sequence:'Toca el inicio y luego el final de una secuencia de puntos.',area:'Toca el centro del área tratada y completa cantidad de puntos y volumen.'}[state.tool];
    saveJSON(STORE_KEY,state);
  }
  function coordinates(event){const layer=$('oaSkinLayer'),rect=layer.getBoundingClientRect();return{x:Math.max(1,Math.min(99,(event.clientX-rect.left)/rect.width*100)),y:Math.max(1,Math.min(99,(event.clientY-rect.top)/rect.height*100))};}
  function handleAtlasClick(event){
    if(!isSkinMode()||event.target.closest('.oa-skin-object')||state.tool==='select')return;
    event.preventDefault();event.stopImmediatePropagation();const point=coordinates(event);
    if(state.tool==='micro')createItem({type:'micro',x:point.x,y:point.y});
    else if(state.tool==='area')createItem({type:'area',x:point.x,y:point.y,width:20,height:13});
    else if(state.tool==='sequence'){
      if(!pendingSequence){pendingSequence=point;toast('Inicio de la secuencia registrado. Toca el punto final.');return;}
      createItem({type:'sequence',x1:pendingSequence.x,y1:pendingSequence.y,x2:point.x,y2:point.y});pendingSequence=null;
    }
  }
  function createItem(geometry){
    const type=geometry.type,count=type==='micro'?1:0;
    const item={id:uid(),type,label:`${TYPE_LABELS[type]} ${state.items.filter(entry=>entry.type===type).length+1}`,zone:'',side:'central',totalVolume:'',pointCount:count,plane:'Intradérmico medio',depth:'',instrument:state.product.device||'Aguja',gauge:state.product.defaultGauge||'',length:state.product.defaultLength||'',pattern:type==='micro'?'Punto a punto':type==='sequence'?'Microdepósitos seriados':'Distribución homogénea por área',comment:'',confirmed:false,...geometry};
    state.items.push(item);state.selectedId=item.id;state.tool='select';saveState();renderAll();showEditor(item);toast(`${TYPE_LABELS[type]} creado.`);
  }
  function renderObjects(){
    const layer=$('oaSkinLayer');if(!layer)return;layer.innerHTML='';
    state.items.forEach(item=>{
      const node=document.createElement('button');node.type='button';node.className=`oa-skin-object ${item.type}${item.id===state.selectedId?' selected':''}${item.confirmed?' confirmed':''}`;node.dataset.id=item.id;node.title=`${item.label}${item.totalVolume?` · ${item.totalVolume} mL`:''}`;
      if(item.type==='micro'){node.style.left=`${item.x}%`;node.style.top=`${item.y}%`;node.dataset.volume=item.totalVolume?`${fmt(item.totalVolume)} mL`:'0 mL';}
      else if(item.type==='area'){node.style.left=`${item.x}%`;node.style.top=`${item.y}%`;node.style.width=`${item.width||20}%`;node.style.height=`${item.height||13}%`;}
      else{const dx=item.x2-item.x1,dy=item.y2-item.y1,width=Math.hypot(dx,dy),angle=Math.atan2(dy,dx)*180/Math.PI;node.style.left=`${item.x1}%`;node.style.top=`${item.y1}%`;node.style.width=`${width}%`;node.style.transform=`rotate(${angle}deg)`;}
      node.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();state.selectedId=item.id;saveJSON(STORE_KEY,state);renderObjects();showEditor(item);setMobileTab('map');});layer.append(node);
    });
  }
  function showEditor(item=selected()){
    const editor=$('oaSkinEditor');if(!editor)return;if(!item){editor.hidden=true;editor.innerHTML='';return;}editor.hidden=false;
    editor.innerHTML=`
      <div class="oa-skin-editor-head"><div><h3>${esc(item.label)}</h3><p>${TYPE_LABELS[item.type]} · distribución y volumen</p></div><span class="oa-skin-status${item.confirmed?' confirmed':''}">${item.confirmed?'Confirmado':'Borrador'}</span></div>
      <div class="oa-skin-editor-grid">
        <label>Etiqueta<input id="oaSkinItemLabel" value="${esc(item.label)}"></label>
        <label>Zona<select id="oaSkinItemZone"><option value="">Seleccionar</option>${ZONES.map(zone=>`<option${item.zone===zone?' selected':''}>${zone}</option>`).join('')}</select></label>
        <label>Lateralidad<select id="oaSkinItemSide"><option value="central"${item.side==='central'?' selected':''}>Central / bilateral</option><option value="right"${item.side==='right'?' selected':''}>Derecha</option><option value="left"${item.side==='left'?' selected':''}>Izquierda</option></select></label>
        <label>Volumen total (mL)<input id="oaSkinItemVolume" type="number" min="0" step="0.01" inputmode="decimal" value="${esc(item.totalVolume)}"></label>
        <label>Número de puntos<input id="oaSkinItemCount" type="number" min="1" step="1" inputmode="numeric" value="${Math.max(1,Math.round(num(item.pointCount)||1))}" ${item.type==='micro'?'readonly':''}></label>
        <label>Plano<select id="oaSkinItemPlane">${PLANES.map(value=>`<option${item.plane===value?' selected':''}>${value}</option>`).join('')}</select></label>
        <label>Profundidad registrada<input id="oaSkinItemDepth" value="${esc(item.depth)}" placeholder="Según técnica y producto"></label>
        <label>Instrumento<select id="oaSkinItemInstrument"><option${item.instrument==='Aguja'?' selected':''}>Aguja</option><option${item.instrument==='Multinyector'?' selected':''}>Multinyector</option><option${item.instrument==='Cánula'?' selected':''}>Cánula</option><option${item.instrument==='Otro'?' selected':''}>Otro</option></select></label>
        <label>Calibre<input id="oaSkinItemGauge" value="${esc(item.gauge)}"></label>
        <label>Longitud<input id="oaSkinItemLength" value="${esc(item.length)}"></label>
        <label>Patrón<select id="oaSkinItemPattern">${PATTERNS.map(value=>`<option${item.pattern===value?' selected':''}>${value}</option>`).join('')}</select></label>
        ${item.type==='area'?`<label>Ancho del área (%)<input id="oaSkinItemWidth" type="number" min="4" max="70" step="1" value="${num(item.width)||20}"></label><label>Alto del área (%)<input id="oaSkinItemHeight" type="number" min="4" max="70" step="1" value="${num(item.height)||13}"></label>`:''}
        <label class="wide">Comentario / observación<textarea id="oaSkinItemComment" rows="2">${esc(item.comment)}</textarea></label>
      </div>
      <div class="oa-skin-item-metrics"><div><span>Volumen estimado por punto</span><strong>${fmt(volumePerPoint(item),3)} mL</strong></div><div><span>Puntos registrados</span><strong>${Math.max(1,Math.round(num(item.pointCount)||1))}</strong></div></div>
      <div class="oa-skin-editor-actions"><button type="button" id="oaSkinSaveItem">Guardar cambios</button><button type="button" class="confirm" id="oaSkinConfirmItem">${item.confirmed?'Reabrir elemento':'Confirmar administración'}</button><button type="button" class="delete" id="oaSkinDeleteItem">Eliminar</button></div>`;
    $('oaSkinSaveItem').onclick=()=>saveEditor(false);$('oaSkinConfirmItem').onclick=()=>saveEditor(true);$('oaSkinDeleteItem').onclick=deleteSelected;
  }
  function saveEditor(toggleConfirm){
    const item=selected();if(!item)return;
    item.label=clean($('oaSkinItemLabel')?.value)||item.label;item.zone=$('oaSkinItemZone')?.value||'';item.side=$('oaSkinItemSide')?.value||'central';item.totalVolume=Math.max(0,num($('oaSkinItemVolume')?.value));item.pointCount=item.type==='micro'?1:Math.max(1,Math.round(num($('oaSkinItemCount')?.value)||1));item.plane=$('oaSkinItemPlane')?.value||'';item.depth=clean($('oaSkinItemDepth')?.value);item.instrument=$('oaSkinItemInstrument')?.value||'';item.gauge=clean($('oaSkinItemGauge')?.value);item.length=clean($('oaSkinItemLength')?.value);item.pattern=$('oaSkinItemPattern')?.value||'';item.comment=clean($('oaSkinItemComment')?.value);
    if(item.type==='area'){item.width=Math.max(4,Math.min(70,num($('oaSkinItemWidth')?.value)||20));item.height=Math.max(4,Math.min(70,num($('oaSkinItemHeight')?.value)||13));}
    if(toggleConfirm){
      if(!item.confirmed&&item.totalVolume<=0){window.alert('Ingresa un volumen administrado mayor que cero antes de confirmar.');return;}
      if(!item.confirmed&&!item.zone){window.alert('Selecciona la zona anatómica antes de confirmar.');return;}
      if(!item.confirmed&&item.pointCount<=0){window.alert('Registra el número de puntos antes de confirmar.');return;}
      item.confirmed=!item.confirmed;item.confirmedAt=item.confirmed?new Date().toISOString():'';
    }
    saveState();renderAll();showEditor(item);toast(item.confirmed?'Administración confirmada.':'Cambios guardados.');
  }
  function deleteSelected(){const item=selected();if(!item)return;if(!window.confirm(`¿Eliminar ${item.label}?`))return;state.items=state.items.filter(entry=>entry.id!==item.id);state.selectedId=null;saveState();renderAll();showEditor(null);}

  function ensureSummary(){
    if($('oaSkinSummary'))return;const record=document.querySelector('.oa-record-panel');if(!record)return;
    const card=document.createElement('section');card.id='oaSkinSummary';card.className='oa-card oa-skin-summary oa-skin-only oa-mobile-summary';card.innerHTML='<div class="oa-section-title">Resumen de Skinbooster / mesoterapia</div><div id="oaSkinSummaryContent"></div>';record.append(card);
  }
  function sideLabel(value){return{right:'Derecha',left:'Izquierda',central:'Central / bilateral'}[value]||value;}
  function renderSummary(){
    const content=$('oaSkinSummaryContent');if(!content)return;const confirmed=confirmedItems();
    const rows=confirmed.map(item=>`<tr><td>${TYPE_LABELS[item.type]}</td><td>${esc(item.zone||'—')}</td><td>${esc(sideLabel(item.side))}</td><td>${item.pointCount}</td><td>${fmt(item.totalVolume)} mL</td><td>${fmt(volumePerPoint(item),3)} mL</td><td>${esc(item.plane||'—')}</td><td>${esc(item.pattern||'—')}</td></tr>`).join('');
    const excess=num(state.product.availableMl)>0&&totalVolume()>num(state.product.availableMl)?'<div class="oa-skin-overage">El volumen confirmado supera el volumen disponible registrado. Revisar antes de cerrar el informe.</div>':'';
    content.innerHTML=`<div class="oa-skin-summary-grid"><div><span>Elementos confirmados</span><strong>${confirmed.length}</strong></div><div><span>Puntos confirmados</span><strong>${totalPoints()}</strong></div><div><span>Volumen administrado</span><strong>${fmt(totalVolume())} mL</strong></div><div><span>Volumen remanente</span><strong>${fmt(remainingVolume())} mL</strong></div></div>${excess}<div class="oa-skin-table-wrap"><table class="oa-skin-table"><thead><tr><th>Tipo</th><th>Zona</th><th>Lado</th><th>Puntos</th><th>Volumen</th><th>Por punto</th><th>Plano</th><th>Patrón</th></tr></thead><tbody>${rows||'<tr><td colspan="8">Aún no existen elementos confirmados.</td></tr>'}</tbody></table></div>`;
  }
  function syncContextQuantity(){
    if(!isSkinMode())return;const quantity=$('oaQuantity'),unit=$('oaUnit');
    if(quantity){quantity.value=String(totalVolume());quantity.readOnly=true;quantity.dispatchEvent(new Event('input',{bubbles:true}));}
    if(unit){unit.value='mL';unit.dispatchEvent(new Event('change',{bubbles:true}));}
  }
  function applyMode(){
    const active=isSkinMode();document.documentElement.classList.toggle('oa-skin-mode',active);
    if(active){ensureRecordCard();ensureMapUI();ensureSummary();setTool(state.tool);renderAll();syncContextQuantity();const subtitle=document.querySelector('.oa-title span');if(subtitle)subtitle.textContent='Motor de Skinbooster / mesoterapia · microdepósitos y áreas';const mapText=document.querySelector('.oa-map-head span');if(mapText)mapText.textContent='Registra microdepósitos, secuencias o áreas con volumen total, cantidad de puntos, plano, profundidad e instrumental.';}
    else{const quantity=$('oaQuantity');if(quantity)quantity.readOnly=false;pendingSequence=null;}
  }
  function renderAll(){renderObjects();renderSummary();setTool(state.tool);updateMetrics();}

  function item(label,value,wide=false){return `<div class="item${wide?' wide':''}"><span>${esc(label)}</span><strong>${esc(clean(value)||'No registrado')}</strong></div>`;}
  function page(title,subtitle,code,body,pageNumber,total){return `<section class="page"><header><img src="../../assets/brand/orion-health.png" alt="ORION Health"><div><h1>${esc(title)}</h1><p>${esc(subtitle)}</p></div><aside>${esc(code)}<br>V${VERSION}</aside></header>${body}<footer><span>ORION Health · Documento clínico</span><span>Página ${pageNumber} de ${total}</span></footer></section>`;}
  function safetyLabel(key){return{productVerified:'Producto, lote y vencimiento verificados',compositionReviewed:'Composición e indicación revisadas',skinBaseline:'Estado cutáneo basal registrado',infectionExcluded:'Infección o inflamación activa excluida',historyReviewed:'Antecedentes y medicamentos revisados',consentReviewed:'Consentimiento revisado',asepsisConfirmed:'Antisepsia e instrumental verificados',vascularPlan:'Plan ante eventos adversos disponible',referralRoute:'Ruta de derivación operativa',aftercareExplained:'Cuidados y alarmas explicados'}[key]||key;}
  function reportStyle(){return `@page{size:Letter portrait;margin:0}*{box-sizing:border-box}body{margin:0;background:#dfe6ed;font-family:Arial,sans-serif;color:#19344c}.page{position:relative;width:215.9mm;min-height:279.4mm;margin:10px auto;padding:16mm 15mm 18mm;background:#fff;page-break-after:always;overflow:hidden}header{display:grid;grid-template-columns:34mm 1fr 34mm;gap:8mm;align-items:center;padding-bottom:6mm;border-bottom:1.5px solid #17847b}header img{width:28mm;max-height:18mm;object-fit:contain}header h1{margin:0;color:#176c66;font-size:18px}header p{margin:2px 0 0;color:#617d79;font-size:10px}header aside{text-align:right;color:#657a77;font-size:9px;line-height:1.45}h2{margin:7mm 0 3mm;color:#176c66;font-size:16px}h3{margin:5mm 0 2mm;color:#17847b;font-size:12px}p,li{font-size:10px;line-height:1.48}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:3mm}.item{padding:3mm;border:1px solid #d7e5e3;border-radius:2mm;background:#f8fbfb}.item.wide{grid-column:1/-1}.item span{display:block;color:#6e8582;font-size:8px}.item strong{display:block;margin-top:1mm;color:#31504c;font-size:10px;white-space:pre-wrap}.alert{padding:4mm;border:1px solid #e5b6b6;border-radius:2mm;background:#fff3f3;color:#743232}.checklist{display:grid;grid-template-columns:1fr 1fr;gap:2mm}.check{padding:3mm;border:1px solid #dce9e7;border-radius:2mm;background:#f8fbfb;font-size:9px}.check.yes::before{content:'✓ ';color:#21844b;font-weight:bold}.check.no::before{content:'○ ';color:#9a5a22;font-weight:bold}.map-layout{display:grid;grid-template-columns:115mm 1fr;gap:8mm;align-items:start}.atlas{position:relative;width:115mm;height:170mm;overflow:hidden;border:1px solid #cddedb;border-radius:3mm;background:#f2f7f6}.atlas img{width:100%;height:100%;object-fit:cover;object-position:center top}.micro,.area,.sequence{position:absolute}.micro{width:5mm;height:5mm;transform:translate(-50%,-50%);border:1.2mm solid #fff;border-radius:50%;background:#1b9a8f;box-shadow:0 0 0 .7mm #12675f}.micro b{position:absolute;left:50%;top:5.5mm;transform:translateX(-50%);min-width:14mm;padding:1mm;border-radius:1.5mm;background:#fff;color:#176c66;font-size:7px;text-align:center}.area{transform:translate(-50%,-50%);border:1mm dashed #1b9a8f;border-radius:50%;background:rgba(27,154,143,.15)}.sequence{height:1.8mm;transform-origin:0 50%;border-radius:2mm;background:repeating-linear-gradient(90deg,#17847b 0 4mm,#82cec7 4mm 7mm);box-shadow:0 0 0 .5mm #fff}table{width:100%;border-collapse:collapse;font-size:8.5px}th,td{padding:2.2mm;border-bottom:1px solid #dce8e6;text-align:left;vertical-align:top}th{background:#eef8f7;color:#286e68}.draft{padding:3mm;border:1px solid #efcf88;background:#fff7df;color:#72530a;font-size:9px}.signatures{display:grid;grid-template-columns:1fr 1fr;gap:20mm;margin-top:25mm}.signatures div{padding-top:3mm;border-top:1px solid #5f716e;text-align:center;font-size:9px}footer{position:absolute;left:15mm;right:15mm;bottom:8mm;display:flex;justify-content:space-between;border-top:1px solid #dde8e6;padding-top:2mm;color:#6d807d;font-size:8px}@media print{body{background:#fff}.page{margin:0;box-shadow:none}}`;}
  function reportMapMarkup(items){const source=$('atlasImage')?.src||'';return `<div class="atlas"><img src="${esc(source)}" alt="Atlas clínico">${items.map(entry=>{if(entry.type==='micro')return `<span class="micro" style="left:${entry.x}%;top:${entry.y}%"><b>${fmt(entry.totalVolume)} mL</b></span>`;if(entry.type==='area')return `<span class="area" style="left:${entry.x}%;top:${entry.y}%;width:${entry.width||20}%;height:${entry.height||13}%"></span>`;const dx=entry.x2-entry.x1,dy=entry.y2-entry.y1,width=Math.hypot(dx,dy),angle=Math.atan2(dy,dx)*180/Math.PI;return `<span class="sequence" style="left:${entry.x1}%;top:${entry.y1}%;width:${width}%;transform:rotate(${angle}deg)"></span>`;}).join('')}</div>`;}
  function buildReport(){
    const proc=procedure(),ctx=context(),patient=proc.patient||{},items=confirmedItems();if(!items.length){window.alert('Confirma al menos un microdepósito, secuencia o área antes de generar el informe.');return;}
    const product=state.product,pages=[],totalPages=5;let pageNumber=1;
    const checklist=Object.entries(state.safety).map(([key,value])=>`<div class="check ${value?'yes':'no'}">${esc(safetyLabel(key))}</div>`).join('');
    const registration=`<h2>Registro clínico y trazabilidad</h2><div class="grid">${item('Paciente',patient.name)}${item('RUN / RUT',patient.id)}${item('Fecha',patient.date)}${item('Procedimiento','Skinbooster / mesoterapia')}${item('Categoría',CATEGORIES[product.category]||product.category)}${item('Sesión',`${product.sessionNumber||'—'} de ${product.plannedSessions||'—'}`)}${item('Indicación / objetivo',ctx.indication||product.objective,true)}${item('Zonas',ctx.zones,true)}${item('Técnica / plano general',ctx.technique,true)}${item('Producto / marca',product.brand)}${item('Composición',product.composition)}${item('Presentación',product.presentation)}${item('Lote',product.lot)}${item('Vencimiento',product.expiry)}${item('Volumen disponible',`${fmt(product.availableMl)} mL`)}${item('Anestesia / preparación',product.anesthesia)}${item('Dispositivo',product.device)}${item('Calibre / longitud',`${product.defaultGauge||'—'} / ${product.defaultLength||'—'}`)}${item('Tratamientos previos',product.previousTreatments,true)}${item('Observaciones',product.operatorNotes,true)}</div><h3>Verificación de seguridad</h3><div class="checklist">${checklist}</div><div class="alert"><strong>Nota documental:</strong> ORION registra el producto y patrón indicado por el profesional; no prescribe dosis por punto, profundidad, separación ni número de sesiones.</div>`;
    pages.push(page('ORION Armonización Orofacial','Skinbooster / mesoterapia · registro','ORH-AO-SKN-REG-001',registration,pageNumber++,totalPages));
    const map=`<h2>Mapa final del procedimiento</h2><p>Microdepósitos, secuencias y áreas con administración confirmada.</p><div class="map-layout">${reportMapMarkup(items)}<div>${item('Elementos',items.length)}${item('Puntos',totalPoints())}${item('Volumen administrado',`${fmt(totalVolume())} mL`)}${item('Volumen remanente',`${fmt(remainingVolume())} mL`)}${item('Producto',product.brand)}${item('Lote',product.lot)}</div></div>`;
    pages.push(page('ORION Armonización Orofacial','Mapa de Skinbooster / mesoterapia','ORH-AO-SKN-MAP-001',map,pageNumber++,totalPages));
    const rows=items.map(entry=>`<tr><td>${TYPE_LABELS[entry.type]}</td><td>${esc(entry.zone)}</td><td>${esc(sideLabel(entry.side))}</td><td>${entry.pointCount}</td><td>${fmt(entry.totalVolume)} mL</td><td>${fmt(volumePerPoint(entry),3)} mL</td><td>${esc(entry.instrument)} ${esc(entry.gauge)} ${esc(entry.length)}</td><td>${esc(entry.plane)}</td><td>${esc(entry.depth)}</td><td>${esc(entry.pattern)}</td><td>${esc(entry.comment)}</td></tr>`).join('');
    const trace=`<h2>Trazabilidad de administración</h2><table><thead><tr><th>Tipo</th><th>Zona</th><th>Lado</th><th>Puntos</th><th>Volumen</th><th>Por punto</th><th>Instrumento</th><th>Plano</th><th>Profundidad</th><th>Patrón</th><th>Comentario</th></tr></thead><tbody>${rows}</tbody></table><div class="grid" style="margin-top:5mm">${item('Puntos totales',totalPoints())}${item('Volumen total',`${fmt(totalVolume())} mL`)}${item('Remanente',`${fmt(remainingVolume())} mL`)}</div>`;
    pages.push(page('ORION Armonización Orofacial','Trazabilidad por elemento','ORH-AO-SKN-TRA-001',trace,pageNumber++,totalPages));
    const consent=`<div class="draft">BORRADOR CLÍNICO: revisar, explicar y adaptar al producto utilizado antes de la firma.</div><h2>Consentimiento informado específico</h2><div class="grid">${item('Paciente',patient.name)}${item('RUN / RUT',patient.id)}${item('Fecha',patient.date)}${item('Procedimiento','Skinbooster / mesoterapia')}${item('Producto',product.brand)}${item('Categoría',CATEGORIES[product.category]||product.category)}</div><h3>Objetivo y alternativas</h3><p>${esc(clean(ctx.indication)||clean(product.objective)||'Mejoramiento de calidad cutánea según evaluación y objetivo acordado.')}</p><p>Se explicó la alternativa de no realizar el procedimiento y otras opciones terapéuticas.</p><h3>Riesgos y eventos posibles</h3><ul><li>Dolor, eritema, edema, equimosis, sensibilidad, pápulas transitorias o asimetría.</li><li>Infección, reacción inflamatoria o alérgica, pigmentación, nódulos, irregularidad o necesidad de tratamiento adicional.</li><li>Compromiso vascular accidental, lesión tisular o alteraciones visuales, aunque sean infrecuentes.</li><li>Resultado parcial, variable o necesidad de sesiones posteriores.</li></ul><p>Declaro haber informado mis antecedentes, haber podido formular preguntas y comprender la información recibida.</p><div class="signatures"><div>Firma del paciente</div><div>Firma del profesional</div></div>`;
    pages.push(page('ORION Armonización Orofacial','Consentimiento informado · Skinbooster','ORH-AO-SKN-CNS-001',consent,pageNumber++,totalPages));
    const contact=loadJSON(SETTINGS_KEY,{}).contact||'Equipo tratante';
    const aftercare=`<div class="draft">DOCUMENTO PARA REVISIÓN PROFESIONAL: adaptar al producto, zona y protocolo institucional.</div><h2>Indicaciones posteriores</h2><div class="grid">${item('Paciente',patient.name)}${item('Fecha',patient.date)}${item('Procedimiento','Skinbooster / mesoterapia')}${item('Producto',product.brand)}${item('Contacto clínico',contact)}${item('Sesión',product.sessionNumber)}</div><h3>Cuidados</h3><ul><li>Seguir las indicaciones específicas sobre higiene, cosméticos, ejercicio, calor, exposición solar y manipulación de la zona.</li><li>No masajear ni aplicar productos no indicados.</li><li>Asistir a los controles programados y comunicar cualquier evolución inesperada.</li></ul><h3>Señales de alarma</h3><div class="alert">Contactar inmediatamente al equipo tratante o acudir a evaluación urgente ante dolor intenso o progresivo, palidez, piel fría, cambios importantes de coloración, ampollas, alteraciones visuales, debilidad, dificultad para hablar u otros síntomas neurológicos.</div><h3>Observaciones específicas</h3><p>${esc(clean(ctx.procedureNotes)||clean(product.operatorNotes)||'Sin observaciones adicionales.')}</p><div class="signatures"><div>Recibí y comprendí las indicaciones</div><div>Firma / identificación profesional</div></div>`;
    pages.push(page('ORION Armonización Orofacial','Indicaciones posteriores · Skinbooster','ORH-AO-SKN-IND-001',aftercare,pageNumber++,totalPages));
    const popup=window.open('','_blank');if(!popup){window.alert('Permite ventanas emergentes para generar el informe.');return;}
    popup.document.open();popup.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Informe Skinbooster</title><style>${reportStyle()}</style></head><body>${pages.join('')}<script>window.addEventListener('load',()=>setTimeout(()=>window.print(),500));<\/script></body></html>`);popup.document.close();
  }
  function interceptReportButtons(){document.addEventListener('click',event=>{if(!isSkinMode())return;const button=event.target.closest('button');if(!button)return;const id=button.id||'',label=button.textContent||'';if(!['btnPrint','btnPrintTop'].includes(id)&&!/informe.*pdf|imprimir.*pdf|exportar.*pdf/i.test(label))return;event.preventDefault();event.stopImmediatePropagation();buildReport();},true);}
  function observeMode(){$('oaIntervention')?.addEventListener('change',()=>setTimeout(applyMode,0));new MutationObserver(()=>{if(document.body.dataset.procedureKind==='skinbooster')applyMode();}).observe(document.body,{attributes:true,attributeFilter:['data-procedure-kind']});}
  function boot(){
    if(mounted)return;if(!$('atlasShell')||!$('oaIntervention')){setTimeout(boot,100);return;}
    mounted=true;document.documentElement.dataset.orionAestheticsVersion=VERSION;document.querySelectorAll('.oa-version').forEach(node=>node.textContent=`V${VERSION}`);
    ensureRecordCard();ensureMapUI();ensureSummary();observeMode();interceptReportButtons();applyMode();renderAll();
  }
  boot();
})();
