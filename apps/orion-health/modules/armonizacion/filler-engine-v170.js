(()=>{
  'use strict';

  const VERSION='1.7.0';
  const STORE_KEY='orion_aesthetic_filler_v170';
  const PROCEDURE_KEY='orion_aesthetic_procedure_v145';
  const CONTEXT_KEY='orion_aesthetic_clinical_context_v147';
  const $=id=>document.getElementById(id);
  const uid=()=>`f${Date.now().toString(36)}${Math.random().toString(36).slice(2,7)}`;
  const num=value=>{const parsed=Number.parseFloat(String(value??'').replace(',','.'));return Number.isFinite(parsed)?parsed:0;};
  const fmt=(value,decimals=2)=>num(value).toLocaleString('es-CL',{minimumFractionDigits:decimals,maximumFractionDigits:decimals});
  const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const text=value=>String(value??'').trim();

  const TYPE_LABELS={deposit:'Depósito',path:'Trayecto',area:'Área'};
  const ZONES=['Frente','Glabela','Nariz','Región infraorbitaria','Pómulo / malar','Surco nasogeniano','Labio superior','Labio inferior','Comisuras','Líneas de marioneta','Mentón','Mandíbula','Prejowl','Sien','Otra zona'];
  const PLANES=['Intradérmico','Subdérmico','Subcutáneo','Supraperióstico','Plano profundo','No especificado'];
  const TECHNIQUES=['Bolo / depósito','Retroinyección lineal','Abanico','Mallado','Punto seriado','Microdepósitos','Otra técnica'];

  let state=loadState();
  let mounted=false;
  let pendingPath=null;
  let applyingTab=false;

  function defaultState(){
    return{
      tool:'select',
      selectedId:null,
      product:{brand:'',presentation:'',lot:'',expiry:'',availableMl:'',syringes:'1',anesthesia:'',previousFillers:'',operatorNotes:''},
      safety:{skinBaseline:false,capillaryBaseline:false,productVerified:false,consentReviewed:false,emergencyPlan:false,hyaluronidaseAvailable:false,referralRoute:false,patientContact:false},
      items:[]
    };
  }

  function loadJSON(key,fallback){try{return JSON.parse(sessionStorage.getItem(key)||'null')??fallback;}catch(_){return fallback;}}
  function saveJSON(key,value){try{sessionStorage.setItem(key,JSON.stringify(value));return true;}catch(_){return false;}}
  function loadState(){
    const saved=loadJSON(STORE_KEY,null);
    return saved&&Array.isArray(saved.items)?{...defaultState(),...saved,product:{...defaultState().product,...saved.product},safety:{...defaultState().safety,...saved.safety}}:defaultState();
  }
  function saveState(){saveJSON(STORE_KEY,state);syncContextQuantity();renderSummary();}
  function procedure(){return loadJSON(PROCEDURE_KEY,{patient:{},vial:{},points:[]});}
  function context(){return loadJSON(CONTEXT_KEY,{});}
  function isFillerMode(){return $('oaIntervention')?.value==='hyaluronic'||document.body.dataset.procedureKind==='hyaluronic';}
  function confirmedItems(){return state.items.filter(item=>item.confirmed&&num(item.volume)>0);}
  function totalVolume(){return confirmedItems().reduce((sum,item)=>sum+num(item.volume),0);}
  function selected(){return state.items.find(item=>item.id===state.selectedId)||null;}

  function toast(message){
    const node=$('toast');
    if(!node)return;
    node.textContent=message;
    node.classList.add('show');
    clearTimeout(toast.timer);
    toast.timer=setTimeout(()=>node.classList.remove('show'),2200);
  }

  function setMobileTab(tab){
    if(applyingTab)return;
    applyingTab=true;
    document.body.dataset.mobileTab=tab;
    document.querySelectorAll('[data-mobile-tab]').forEach(button=>button.classList.toggle('active',button.dataset.mobileTab===tab));
    requestAnimationFrame(()=>{applyingTab=false;});
  }

  function ensureRecordCard(){
    if($('oaFillerRecordCard'))return;
    const contextCard=$('oaClinicalContext');
    if(!contextCard)return;
    const card=document.createElement('section');
    card.id='oaFillerRecordCard';
    card.className='oa-card oa-filler-record-card oa-filler-only';
    card.innerHTML=`
      <div class="oa-section-title">Ácido hialurónico · producto y trazabilidad</div>
      <div class="oa-filler-grid">
        <label>Producto / marca<input id="oaFillerBrand" placeholder="Marca comercial y línea"></label>
        <label>Presentación<input id="oaFillerPresentation" placeholder="Ej.: 1 mL, concentración o formulación"></label>
        <label>Lote<input id="oaFillerLot" placeholder="Lote"></label>
        <label>Vencimiento<input id="oaFillerExpiry" type="date"></label>
        <label>Volumen disponible (mL)<input id="oaFillerAvailable" type="number" min="0" step="0.01" inputmode="decimal"></label>
        <label>Número de jeringas<input id="oaFillerSyringes" type="number" min="0" step="1" inputmode="numeric"></label>
        <label>Anestesia / preparación<input id="oaFillerAnesthesia" placeholder="Anestesia, antisepsia u otros"></label>
        <label>Rellenos o procedimientos previos<input id="oaFillerPrevious" placeholder="Producto, fecha, zona o desconocido"></label>
        <label class="wide">Observaciones generales<textarea id="oaFillerOperatorNotes" rows="2" placeholder="Asimetrías, cicatrices, implantes, secuencia o antecedentes locales"></textarea></label>
      </div>
      <div class="oa-section-title" style="margin-top:14px">Lista de verificación antes de administrar</div>
      <div class="oa-filler-safety">
        ${safetyCheck('skinBaseline','Evaluación cutánea y coloración basal registradas')}
        ${safetyCheck('capillaryBaseline','Perfusión / relleno capilar basal revisados cuando corresponde')}
        ${safetyCheck('productVerified','Producto, lote, vencimiento e integridad verificados')}
        ${safetyCheck('consentReviewed','Consentimiento específico revisado con el paciente')}
        ${safetyCheck('emergencyPlan','Plan actualizado ante compromiso vascular disponible')}
        ${safetyCheck('hyaluronidaseAvailable','Insumos de contingencia disponibles según protocolo local')}
        ${safetyCheck('referralRoute','Ruta de derivación urgente conocida y operativa')}
        ${safetyCheck('patientContact','Contacto posterior y señales de alarma explicados')}
      </div>
      <div class="oa-filler-alert"><strong>Alerta clínica:</strong> dolor inusual, blanqueamiento, alteración de coloración, cambios visuales o síntomas neurológicos requieren detener la administración y activar evaluación urgente según el protocolo institucional.</div>`;
    contextCard.insertAdjacentElement('afterend',card);
    hydrateRecord();
    bindRecord();
  }

  function safetyCheck(key,label){return `<label class="oa-filler-check"><input type="checkbox" id="oaFillerSafety_${key}"><span>${label}</span></label>`;}

  function hydrateRecord(){
    const map={oaFillerBrand:'brand',oaFillerPresentation:'presentation',oaFillerLot:'lot',oaFillerExpiry:'expiry',oaFillerAvailable:'availableMl',oaFillerSyringes:'syringes',oaFillerAnesthesia:'anesthesia',oaFillerPrevious:'previousFillers',oaFillerOperatorNotes:'operatorNotes'};
    Object.entries(map).forEach(([id,key])=>{if($(id))$(id).value=state.product[key]??'';});
    Object.entries(state.safety).forEach(([key,value])=>{const input=$(`oaFillerSafety_${key}`);if(input)input.checked=!!value;});
  }

  function bindRecord(){
    const map={oaFillerBrand:'brand',oaFillerPresentation:'presentation',oaFillerLot:'lot',oaFillerExpiry:'expiry',oaFillerAvailable:'availableMl',oaFillerSyringes:'syringes',oaFillerAnesthesia:'anesthesia',oaFillerPrevious:'previousFillers',oaFillerOperatorNotes:'operatorNotes'};
    Object.entries(map).forEach(([id,key])=>{
      const input=$(id);if(!input)return;
      input.addEventListener('input',()=>{state.product[key]=input.value;saveState();});
      input.addEventListener('change',()=>{state.product[key]=input.value;saveState();});
    });
    Object.keys(state.safety).forEach(key=>{
      $(`oaFillerSafety_${key}`)?.addEventListener('change',event=>{state.safety[key]=event.target.checked;saveState();});
    });
  }

  function ensureMapUI(){
    const mapPanel=document.querySelector('.oa-map-panel');
    const atlasShell=$('atlasShell');
    const atlasTransform=$('atlasTransform');
    if(!mapPanel||!atlasShell||!atlasTransform)return;

    if(!$('oaFillerToolbar')){
      const toolbar=document.createElement('div');
      toolbar.id='oaFillerToolbar';
      toolbar.className='oa-filler-toolbar oa-filler-only';
      toolbar.innerHTML=`
        <button type="button" data-filler-tool="select">Seleccionar</button>
        <button type="button" data-filler-tool="deposit">＋ Depósito</button>
        <button type="button" data-filler-tool="path">↗ Trayecto</button>
        <button type="button" data-filler-tool="area">◯ Área</button>`;
      const anchor=document.querySelector('.oa-mobile-zonebar')||document.querySelector('.oa-map-head');
      anchor?.insertAdjacentElement('afterend',toolbar);
      const help=document.createElement('p');
      help.id='oaFillerToolHelp';
      help.className='oa-filler-toolbar-help oa-filler-only';
      toolbar.insertAdjacentElement('afterend',help);
      toolbar.querySelectorAll('[data-filler-tool]').forEach(button=>button.addEventListener('click',()=>setTool(button.dataset.fillerTool)));
    }

    if(!$('oaFillerEditor')){
      const editor=document.createElement('section');
      editor.id='oaFillerEditor';
      editor.className='oa-filler-editor oa-filler-only';
      editor.hidden=true;
      atlasShell.insertAdjacentElement('beforebegin',editor);
    }

    if(!$('oaFillerLayer')){
      const layer=document.createElement('div');
      layer.id='oaFillerLayer';
      layer.className='oa-filler-only';
      atlasTransform.append(layer);
    }

    if(!atlasShell.dataset.oaFillerBound){
      atlasShell.dataset.oaFillerBound='1';
      atlasShell.addEventListener('click',handleAtlasClick,true);
    }
  }

  function setTool(tool){
    state.tool=['select','deposit','path','area'].includes(tool)?tool:'select';
    if(state.tool!=='path')pendingPath=null;
    document.querySelectorAll('[data-filler-tool]').forEach(button=>button.classList.toggle('active',button.dataset.fillerTool===state.tool));
    const help=$('oaFillerToolHelp');
    if(help){
      help.textContent={select:'Toca un elemento para editarlo.',deposit:'Toca el atlas para registrar un depósito localizado.',path:'Toca el inicio y luego el final del trayecto.',area:'Toca el centro de la región tratada; el tamaño puede ajustarse en el editor.'}[state.tool];
    }
    saveState();
  }

  function coordinates(event){
    const layer=$('oaFillerLayer');
    const rect=layer.getBoundingClientRect();
    return{x:Math.max(1,Math.min(99,(event.clientX-rect.left)/rect.width*100)),y:Math.max(1,Math.min(99,(event.clientY-rect.top)/rect.height*100))};
  }

  function handleAtlasClick(event){
    if(!isFillerMode()||event.target.closest('.oa-filler-object'))return;
    if(state.tool==='select')return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const point=coordinates(event);
    if(state.tool==='deposit'){
      createItem({type:'deposit',x:point.x,y:point.y});
    }else if(state.tool==='area'){
      createItem({type:'area',x:point.x,y:point.y,width:18,height:12});
    }else if(state.tool==='path'){
      if(!pendingPath){pendingPath=point;toast('Inicio del trayecto registrado. Toca el punto final.');return;}
      createItem({type:'path',x1:pendingPath.x,y1:pendingPath.y,x2:point.x,y2:point.y});
      pendingPath=null;
    }
  }

  function createItem(geometry){
    const type=geometry.type;
    const item={
      id:uid(),type,label:`${TYPE_LABELS[type]} ${state.items.filter(entry=>entry.type===type).length+1}`,
      zone:'',side:'central',volume:'',instrument:type==='path'?'Cánula':'Aguja',gauge:'',length:'',technique:type==='deposit'?'Bolo / depósito':type==='path'?'Retroinyección lineal':'Abanico',
      plane:'No especificado',anesthesia:'',comment:'',confirmed:false,...geometry
    };
    state.items.push(item);
    state.selectedId=item.id;
    state.tool='select';
    saveState();
    renderAll();
    showEditor(item);
    toast(`${TYPE_LABELS[type]} creado.`);
  }

  function renderObjects(){
    const layer=$('oaFillerLayer');
    if(!layer)return;
    layer.innerHTML='';
    state.items.forEach(item=>{
      const node=document.createElement('button');
      node.type='button';
      node.className=`oa-filler-object ${item.type}${item.id===state.selectedId?' selected':''}${item.confirmed?' confirmed':''}`;
      node.dataset.id=item.id;
      node.title=`${item.label}${item.volume?` · ${item.volume} mL`:''}`;
      if(item.type==='deposit'){
        node.style.left=`${item.x}%`;node.style.top=`${item.y}%`;node.dataset.volume=item.volume?`${fmt(item.volume)} mL`:'0 mL';
      }else if(item.type==='area'){
        node.style.left=`${item.x}%`;node.style.top=`${item.y}%`;node.style.width=`${item.width||18}%`;node.style.height=`${item.height||12}%`;
      }else{
        const dx=item.x2-item.x1,dy=item.y2-item.y1;
        const width=Math.hypot(dx,dy);
        const angle=Math.atan2(dy,dx)*180/Math.PI;
        node.style.left=`${item.x1}%`;node.style.top=`${item.y1}%`;node.style.width=`${width}%`;node.style.transform=`rotate(${angle}deg)`;
      }
      node.addEventListener('click',event=>{
        event.preventDefault();event.stopPropagation();
        state.selectedId=item.id;saveState();renderObjects();showEditor(item);setMobileTab('map');
      });
      layer.append(node);
    });
  }

  function showEditor(item=selected()){
    const editor=$('oaFillerEditor');
    if(!editor)return;
    if(!item){editor.hidden=true;editor.innerHTML='';return;}
    editor.hidden=false;
    editor.innerHTML=`
      <div class="oa-filler-editor-head"><div><h3>${esc(item.label)}</h3><p>${TYPE_LABELS[item.type]} · registro en mL</p></div><span class="oa-filler-status${item.confirmed?' confirmed':''}">${item.confirmed?'Confirmado':'Borrador'}</span></div>
      <div class="oa-filler-editor-grid">
        <label>Etiqueta<input id="oaFillerItemLabel" value="${esc(item.label)}"></label>
        <label>Zona<select id="oaFillerItemZone"><option value="">Seleccionar</option>${ZONES.map(zone=>`<option${item.zone===zone?' selected':''}>${zone}</option>`).join('')}</select></label>
        <label>Lateralidad<select id="oaFillerItemSide"><option value="central"${item.side==='central'?' selected':''}>Central / bilateral</option><option value="right"${item.side==='right'?' selected':''}>Derecha</option><option value="left"${item.side==='left'?' selected':''}>Izquierda</option></select></label>
        <label>Volumen administrado (mL)<input id="oaFillerItemVolume" type="number" min="0" step="0.01" inputmode="decimal" value="${esc(item.volume)}"></label>
        <label>Instrumento<select id="oaFillerItemInstrument"><option${item.instrument==='Aguja'?' selected':''}>Aguja</option><option${item.instrument==='Cánula'?' selected':''}>Cánula</option><option${item.instrument==='Otro'?' selected':''}>Otro</option></select></label>
        <label>Calibre<input id="oaFillerItemGauge" value="${esc(item.gauge)}" placeholder="Ej.: 27G"></label>
        <label>Longitud<input id="oaFillerItemLength" value="${esc(item.length)}" placeholder="Ej.: 38 mm"></label>
        <label>Plano<select id="oaFillerItemPlane">${PLANES.map(value=>`<option${item.plane===value?' selected':''}>${value}</option>`).join('')}</select></label>
        <label>Técnica<select id="oaFillerItemTechnique">${TECHNIQUES.map(value=>`<option${item.technique===value?' selected':''}>${value}</option>`).join('')}</select></label>
        <label>Anestesia / preparación<input id="oaFillerItemAnesthesia" value="${esc(item.anesthesia)}"></label>
        ${item.type==='area'?`<label>Ancho del área (%)<input id="oaFillerItemWidth" type="number" min="4" max="60" step="1" value="${num(item.width)||18}"></label><label>Alto del área (%)<input id="oaFillerItemHeight" type="number" min="4" max="60" step="1" value="${num(item.height)||12}"></label>`:''}
        <label class="wide">Comentario / observación<textarea id="oaFillerItemComment" rows="2">${esc(item.comment)}</textarea></label>
      </div>
      <div class="oa-filler-editor-actions">
        <button type="button" id="oaFillerSaveItem">Guardar cambios</button>
        <button type="button" class="confirm" id="oaFillerConfirmItem">${item.confirmed?'Reabrir elemento':'Confirmar administración'}</button>
        <button type="button" class="delete" id="oaFillerDeleteItem">Eliminar</button>
      </div>`;
    $('oaFillerSaveItem').onclick=()=>saveEditor(false);
    $('oaFillerConfirmItem').onclick=()=>saveEditor(true);
    $('oaFillerDeleteItem').onclick=deleteSelected;
  }

  function saveEditor(toggleConfirm){
    const item=selected();if(!item)return;
    item.label=text($('oaFillerItemLabel')?.value)||item.label;
    item.zone=$('oaFillerItemZone')?.value||'';
    item.side=$('oaFillerItemSide')?.value||'central';
    item.volume=Math.max(0,num($('oaFillerItemVolume')?.value));
    item.instrument=$('oaFillerItemInstrument')?.value||'';
    item.gauge=text($('oaFillerItemGauge')?.value);
    item.length=text($('oaFillerItemLength')?.value);
    item.plane=$('oaFillerItemPlane')?.value||'';
    item.technique=$('oaFillerItemTechnique')?.value||'';
    item.anesthesia=text($('oaFillerItemAnesthesia')?.value);
    item.comment=text($('oaFillerItemComment')?.value);
    if(item.type==='area'){
      item.width=Math.max(4,Math.min(60,num($('oaFillerItemWidth')?.value)||18));
      item.height=Math.max(4,Math.min(60,num($('oaFillerItemHeight')?.value)||12));
    }
    if(toggleConfirm){
      if(!item.confirmed&&item.volume<=0){window.alert('Ingresa un volumen administrado mayor que cero antes de confirmar.');return;}
      if(!item.confirmed&&!item.zone){window.alert('Selecciona la zona anatómica antes de confirmar.');return;}
      item.confirmed=!item.confirmed;
      item.confirmedAt=item.confirmed?new Date().toISOString():'';
    }
    saveState();renderAll();showEditor(item);
    toast(item.confirmed?'Administración confirmada.':'Cambios guardados.');
  }

  function deleteSelected(){
    const item=selected();if(!item)return;
    if(!window.confirm(`¿Eliminar ${item.label}?`))return;
    state.items=state.items.filter(entry=>entry.id!==item.id);
    state.selectedId=null;
    saveState();renderAll();showEditor(null);
  }

  function ensureSummary(){
    if($('oaFillerSummary'))return;
    const record=document.querySelector('.oa-record-panel');
    if(!record)return;
    const card=document.createElement('section');
    card.id='oaFillerSummary';
    card.className='oa-card oa-filler-summary oa-filler-only oa-mobile-summary';
    card.innerHTML='<div class="oa-section-title">Resumen de ácido hialurónico</div><div id="oaFillerSummaryContent"></div>';
    record.append(card);
  }

  function renderSummary(){
    const content=$('oaFillerSummaryContent');if(!content)return;
    const confirmed=confirmedItems();
    const deposits=confirmed.filter(item=>item.type==='deposit').length;
    const paths=confirmed.filter(item=>item.type==='path').length;
    const areas=confirmed.filter(item=>item.type==='area').length;
    const rows=confirmed.map(item=>`<tr><td>${TYPE_LABELS[item.type]}</td><td>${esc(item.zone||'—')}</td><td>${esc(sideLabel(item.side))}</td><td>${fmt(item.volume)} mL</td><td>${esc(item.plane||'—')}</td><td>${esc(item.technique||'—')}</td></tr>`).join('');
    content.innerHTML=`
      <div class="oa-filler-summary-grid">
        <div><span>Elementos confirmados</span><strong>${confirmed.length}</strong></div>
        <div><span>Depósitos / trayectos / áreas</span><strong>${deposits} / ${paths} / ${areas}</strong></div>
        <div><span>Volumen administrado</span><strong>${fmt(totalVolume())} mL</strong></div>
        <div><span>Volumen disponible</span><strong>${state.product.availableMl?`${fmt(state.product.availableMl)} mL`:'—'}</strong></div>
      </div>
      <div class="oa-filler-table-wrap"><table class="oa-filler-table"><thead><tr><th>Tipo</th><th>Zona</th><th>Lado</th><th>Volumen</th><th>Plano</th><th>Técnica</th></tr></thead><tbody>${rows||'<tr><td colspan="6">Aún no existen elementos confirmados.</td></tr>'}</tbody></table></div>`;
  }

  function sideLabel(value){return{right:'Derecha',left:'Izquierda',central:'Central / bilateral'}[value]||value;}

  function syncContextQuantity(){
    if(!isFillerMode())return;
    const quantity=$('oaQuantity');
    const unit=$('oaUnit');
    if(quantity){quantity.value=String(totalVolume());quantity.readOnly=true;quantity.dispatchEvent(new Event('input',{bubbles:true}));}
    if(unit){unit.value='mL';unit.dispatchEvent(new Event('change',{bubbles:true}));}
  }

  function applyMode(){
    const filler=isFillerMode();
    document.documentElement.classList.toggle('oa-filler-mode',filler);
    if(filler){
      ensureRecordCard();ensureMapUI();ensureSummary();setTool(state.tool);renderAll();syncContextQuantity();
      const subtitle=document.querySelector('.oa-title span');
      if(subtitle)subtitle.textContent='Motor de ácido hialurónico · depósitos, trayectos y áreas';
      const mapText=document.querySelector('.oa-map-head span');
      if(mapText)mapText.textContent='Registra depósitos, trayectos o áreas; cada elemento debe documentar volumen, plano, técnica y lateralidad.';
    }else{
      const quantity=$('oaQuantity');if(quantity)quantity.readOnly=false;
      pendingPath=null;
    }
  }

  function renderAll(){renderObjects();renderSummary();setTool(state.tool);}

  function reportStyle(){return `
    @page{size:Letter portrait;margin:0}*{box-sizing:border-box}body{margin:0;background:#dfe6ed;font-family:Arial,sans-serif;color:#19344c}
    .page{position:relative;width:215.9mm;min-height:279.4mm;margin:10px auto;padding:16mm 15mm 18mm;background:#fff;page-break-after:always;overflow:hidden}
    header{display:grid;grid-template-columns:34mm 1fr 34mm;gap:8mm;align-items:center;padding-bottom:6mm;border-bottom:1.5px solid #234f73}header img{width:28mm;max-height:18mm;object-fit:contain}header h1{margin:0;color:#153e62;font-size:18px}header p{margin:2px 0 0;color:#668096;font-size:10px}header aside{text-align:right;color:#647b8f;font-size:9px;line-height:1.45}
    h2{margin:7mm 0 3mm;color:#153e62;font-size:16px}h3{margin:5mm 0 2mm;color:#315d7e;font-size:12px}p,li{font-size:10px;line-height:1.48}.lead{color:#60788e}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:3mm}.item{padding:3mm;border:1px solid #d8e2ea;border-radius:2mm;background:#f8fafc}.item.wide{grid-column:1/-1}.item span{display:block;color:#6a8092;font-size:8px}.item strong{display:block;margin-top:1mm;color:#173b5b;font-size:10px;white-space:pre-wrap}.alert{padding:4mm;border:1px solid #e9bcbc;border-radius:2mm;background:#fff4f4;color:#7a3030}.checklist{display:grid;grid-template-columns:1fr 1fr;gap:2mm}.check{padding:3mm;border:1px solid #dce5ec;border-radius:2mm;background:#f8fafc;font-size:9px}.check.yes::before{content:'✓ ';color:#21844b;font-weight:bold}.check.no::before{content:'○ ';color:#9a5a22;font-weight:bold}
    .map-layout{display:grid;grid-template-columns:115mm 1fr;gap:8mm;align-items:start}.atlas{position:relative;width:115mm;height:170mm;overflow:hidden;border:1px solid #cbd8e2;border-radius:3mm;background:#f4f1ed}.atlas img{width:100%;height:100%;object-fit:cover;object-position:center top}.deposit,.area,.path{position:absolute}.deposit{width:5mm;height:5mm;transform:translate(-50%,-50%);border:1.2mm solid #fff;border-radius:50%;background:#2b9b58;box-shadow:0 0 0 .7mm #126b38}.deposit b{position:absolute;left:50%;top:5.5mm;transform:translateX(-50%);min-width:14mm;padding:1mm;border-radius:1.5mm;background:#fff;color:#24563a;font-size:7px;text-align:center}.area{transform:translate(-50%,-50%);border:1mm dashed #27864b;border-radius:50%;background:rgba(47,160,89,.18)}.path{height:1.8mm;transform-origin:0 50%;border-radius:2mm;background:#27864b;box-shadow:0 0 0 .5mm #fff}
    table{width:100%;border-collapse:collapse;font-size:8.5px}th,td{padding:2.2mm;border-bottom:1px solid #dce5ec;text-align:left;vertical-align:top}th{background:#edf4f8;color:#315b79}.draft{padding:3mm;border:1px solid #efcf88;background:#fff7df;color:#72530a;font-size:9px}.signatures{display:grid;grid-template-columns:1fr 1fr;gap:20mm;margin-top:25mm}.signatures div{padding-top:3mm;border-top:1px solid #42647e;text-align:center;font-size:9px}footer{position:absolute;left:15mm;right:15mm;bottom:8mm;display:flex;justify-content:space-between;border-top:1px solid #d7e1e9;padding-top:2mm;color:#6b8092;font-size:8px}
    @media print{body{background:#fff}.page{margin:0;box-shadow:none}}
  `;}

  function item(label,value,wide=false){return `<div class="item${wide?' wide':''}"><span>${esc(label)}</span><strong>${esc(text(value)||'No registrado')}</strong></div>`;}
  function page(title,subtitle,code,body,pageNumber,total){return `<section class="page"><header><img src="../../assets/brand/orion-health.png"><div><h1>${esc(title)}</h1><p>${esc(subtitle)}</p></div><aside>${esc(code)}<br>V${VERSION}</aside></header>${body}<footer><span>ORION Health · Documento clínico</span><span>Página ${pageNumber} de ${total}</span></footer></section>`;}

  function reportMapMarkup(items){
    const source=$('atlasImage')?.src||'';
    return `<div class="atlas"><img src="${esc(source)}" alt="Atlas clínico">${items.map(item=>{
      if(item.type==='deposit')return `<span class="deposit" style="left:${item.x}%;top:${item.y}%"><b>${fmt(item.volume)} mL</b></span>`;
      if(item.type==='area')return `<span class="area" style="left:${item.x}%;top:${item.y}%;width:${item.width||18}%;height:${item.height||12}%"></span>`;
      const dx=item.x2-item.x1,dy=item.y2-item.y1,width=Math.hypot(dx,dy),angle=Math.atan2(dy,dx)*180/Math.PI;
      return `<span class="path" style="left:${item.x1}%;top:${item.y1}%;width:${width}%;transform:rotate(${angle}deg)"></span>`;
    }).join('')}</div>`;
  }

  function buildFillerReport(){
    const stateProcedure=procedure();
    const ctx=context();
    const patient=stateProcedure.patient||{};
    const items=confirmedItems();
    if(!items.length){window.alert('Confirma al menos un depósito, trayecto o área antes de generar el informe.');return;}
    const total=totalVolume();
    const pages=[];
    const totalPages=5;
    let pageNumber=1;
    const checklist=Object.entries(state.safety).map(([key,value])=>`<div class="check ${value?'yes':'no'}">${esc(safetyLabel(key))}</div>`).join('');

    const registration=`<h2>Registro clínico del procedimiento</h2><div class="grid">
      ${item('Paciente',patient.name)}${item('RUN / RUT',patient.id)}${item('Fecha',patient.date)}
      ${item('Procedimiento','Relleno con ácido hialurónico')}${item('Volumen administrado',`${fmt(total)} mL`)}${item('Zonas',ctx.zones)}
      ${item('Indicación / objetivo',ctx.indication,true)}${item('Técnica / plano general',ctx.technique,true)}${item('Comentario técnico',ctx.procedureNotes,true)}
      ${item('Producto / marca',state.product.brand)}${item('Presentación',state.product.presentation)}${item('Lote',state.product.lot)}
      ${item('Vencimiento',state.product.expiry)}${item('Volumen disponible',state.product.availableMl?`${fmt(state.product.availableMl)} mL`:'')}${item('Jeringas',state.product.syringes)}
      ${item('Anestesia / preparación',state.product.anesthesia,true)}${item('Rellenos previos',state.product.previousFillers,true)}${item('Observaciones',state.product.operatorNotes,true)}
    </div><h3>Verificación de seguridad</h3><div class="checklist">${checklist}</div><div class="alert"><strong>Advertencia:</strong> el riesgo de inyección intravascular exige reconocimiento inmediato de dolor inusual, blanqueamiento, cambios de coloración, alteraciones visuales o síntomas neurológicos y activación del protocolo local.</div>`;
    pages.push(page('ORION Armonización Orofacial','Ácido hialurónico · registro clínico','ORH-AO-AH-REG-001',registration,pageNumber++,totalPages));

    const map=`<h2>Mapa final del procedimiento</h2><p class="lead">Depósitos, trayectos y áreas con administración confirmada.</p><div class="map-layout">${reportMapMarkup(items)}<div>${item('Elementos',items.length)}${item('Volumen total',`${fmt(total)} mL`)}${item('Producto',state.product.brand)}${item('Lote',state.product.lot)}${item('Vencimiento',state.product.expiry)}${item('Observaciones',state.product.operatorNotes,true)}</div></div>`;
    pages.push(page('ORION Armonización Orofacial','Mapa de relleno con ácido hialurónico','ORH-AO-AH-MAP-001',map,pageNumber++,totalPages));

    const rows=items.map(entry=>`<tr><td>${TYPE_LABELS[entry.type]}</td><td>${esc(entry.zone)}</td><td>${esc(sideLabel(entry.side))}</td><td>${fmt(entry.volume)} mL</td><td>${esc(entry.instrument)} ${esc(entry.gauge)} ${esc(entry.length)}</td><td>${esc(entry.plane)}</td><td>${esc(entry.technique)}</td><td>${esc(entry.comment)}</td></tr>`).join('');
    const trace=`<h2>Trazabilidad de la administración</h2><table><thead><tr><th>Tipo</th><th>Zona</th><th>Lado</th><th>Volumen</th><th>Instrumento</th><th>Plano</th><th>Técnica</th><th>Comentario</th></tr></thead><tbody>${rows}</tbody></table><div class="grid" style="margin-top:5mm">${item('Total administrado',`${fmt(total)} mL`)}${item('Producto',state.product.brand)}${item('Lote',state.product.lot)}</div>`;
    pages.push(page('ORION Armonización Orofacial','Trazabilidad por depósito, trayecto y área','ORH-AO-AH-TRA-001',trace,pageNumber++,totalPages));

    const consent=`<div class="draft">BORRADOR CLÍNICO: revisar, explicar y adaptar antes de la firma.</div><h2>Consentimiento informado específico</h2><div class="grid">${item('Paciente',patient.name)}${item('RUN / RUT',patient.id)}${item('Fecha',patient.date)}${item('Procedimiento','Relleno con ácido hialurónico')}${item('Producto',state.product.brand)}${item('Volumen',`${fmt(total)} mL`)}</div><h3>Objetivo y alternativas</h3><p>${esc(text(ctx.indication)||'Objetivo clínico-estético explicado durante la evaluación.')}</p><p>Se explicó la alternativa de no realizar el procedimiento y otras opciones terapéuticas.</p><h3>Riesgos y eventos posibles</h3><ul><li>Dolor, edema, hematoma, sensibilidad, asimetría o irregularidad.</li><li>Nódulos, inflamación persistente, infección, migración o necesidad de corrección.</li><li>Inyección intravascular accidental con isquemia, necrosis, alteraciones visuales, ceguera o accidente cerebrovascular.</li><li>Resultados parciales, asimétricos o necesidad de controles y procedimientos adicionales.</li></ul><p>Declaro haber informado mis antecedentes, haber podido formular preguntas y comprender la información recibida.</p><div class="signatures"><div>Firma del paciente</div><div>Firma del profesional</div></div>`;
    pages.push(page('ORION Armonización Orofacial','Consentimiento informado · ácido hialurónico','ORH-AO-AH-CNS-001',consent,pageNumber++,totalPages));

    const aftercare=`<div class="draft">DOCUMENTO PARA REVISIÓN PROFESIONAL: adaptar a producto, zona, técnica y protocolo institucional.</div><h2>Indicaciones posteriores</h2><div class="grid">${item('Paciente',patient.name)}${item('Fecha',patient.date)}${item('Procedimiento','Relleno con ácido hialurónico')}${item('Producto',state.product.brand)}${item('Contacto clínico',loadJSON('orion_aesthetic_v160_settings',{}).contact)}${item('Volumen',`${fmt(total)} mL`)}</div><h3>Cuidados</h3><ul><li>No comprimir, masajear ni manipular la zona salvo indicación profesional.</li><li>Seguir las instrucciones específicas sobre ejercicio, calor, cosméticos y otros procedimientos.</li><li>Asistir a los controles indicados y comunicar cualquier evolución inesperada.</li></ul><h3>Señales de alarma</h3><div class="alert">Contactar inmediatamente al equipo tratante o acudir a evaluación urgente ante dolor intenso o creciente, palidez o blanqueamiento, piel fría, coloración gris-azulada o reticulada, ampollas, alteraciones visuales, debilidad, dificultad para hablar u otros síntomas neurológicos.</div><h3>Observaciones específicas</h3><p>${esc(text(ctx.procedureNotes)||'Sin observaciones adicionales.')}</p><div class="signatures"><div>Recibí y comprendí las indicaciones</div><div>Firma / identificación profesional</div></div>`;
    pages.push(page('ORION Armonización Orofacial','Indicaciones posteriores · ácido hialurónico','ORH-AO-AH-IND-001',aftercare,pageNumber++,totalPages));

    const popup=window.open('','_blank');
    if(!popup){window.alert('Permite ventanas emergentes para generar el informe.');return;}
    popup.document.open();
    popup.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Informe ácido hialurónico</title><style>${reportStyle()}</style></head><body>${pages.join('')}<script>window.addEventListener('load',()=>setTimeout(()=>window.print(),500));<\/script></body></html>`);
    popup.document.close();
  }

  function safetyLabel(key){return{
    skinBaseline:'Evaluación cutánea basal registrada',capillaryBaseline:'Perfusión basal revisada',productVerified:'Producto y lote verificados',consentReviewed:'Consentimiento revisado',emergencyPlan:'Plan de respuesta disponible',hyaluronidaseAvailable:'Insumos de contingencia disponibles',referralRoute:'Ruta de derivación operativa',patientContact:'Contacto y señales de alarma explicados'
  }[key]||key;}

  function interceptReportButtons(){
    document.addEventListener('click',event=>{
      if(!isFillerMode())return;
      const button=event.target.closest('button');
      if(!button)return;
      const id=button.id||'';
      const label=button.textContent||'';
      if(!['btnPrint','btnPrintTop'].includes(id)&&!/informe.*pdf|imprimir.*pdf|exportar.*pdf/i.test(label))return;
      event.preventDefault();event.stopImmediatePropagation();
      buildFillerReport();
    },true);
  }

  function observeMode(){
    $('oaIntervention')?.addEventListener('change',()=>setTimeout(applyMode,0));
    new MutationObserver(()=>{if(document.body.dataset.procedureKind==='hyaluronic')applyMode();}).observe(document.body,{attributes:true,attributeFilter:['data-procedure-kind']});
  }

  function boot(){
    if(mounted)return;
    if(!$('atlasShell')||!$('oaIntervention')){setTimeout(boot,100);return;}
    mounted=true;
    document.documentElement.dataset.orionAestheticsVersion=VERSION;
    document.querySelectorAll('.oa-version').forEach(node=>node.textContent=`V${VERSION}`);
    ensureRecordCard();ensureMapUI();ensureSummary();bindRecord();observeMode();interceptReportButtons();applyMode();renderAll();
  }

  boot();
})();
