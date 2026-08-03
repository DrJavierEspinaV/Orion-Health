(()=>{
  'use strict';

  const $=id=>document.getElementById(id);
  const CONTEXT_KEY='orion_aesthetic_clinical_context_v147';
  const PROCEDURE_KEY='orion_aesthetic_procedure_v145';
  const FIRST_KEY='orion_aesthetic_workflow_v147_seen';

  const TYPES={
    toxin:{label:'Toxina botulínica tipo A',baseline:0,unit:'U',note:'La calculadora de vial permanece activa para concentración, unidades y volumen.'},
    hyaluronic:{label:'Relleno con ácido hialurónico',baseline:2,unit:'mL',note:'Requiere evaluación vascular, trazabilidad del producto y plan de respuesta ante oclusión.'},
    caha:{label:'Bioestimulador · hidroxiapatita de calcio',baseline:2,unit:'mL',note:'Registrar plano, dilución, técnica, volumen y zonas tratadas.'},
    plla:{label:'Bioestimulador · ácido poli-L-láctico',baseline:2,unit:'mL',note:'Registrar reconstitución, plano, técnica y distribución por zona.'},
    skinbooster:{label:'Skinbooster / mesoterapia',baseline:1,unit:'mL',note:'Registrar producto, lote, volumen y patrón de distribución.'},
    threads:{label:'Hilos tensores o bioestimuladores',baseline:2,unit:'hilos',note:'Registrar tipo, cantidad, vectores, plano y zonas de entrada/salida.'},
    prp:{label:'Plasma rico en plaquetas / autólogo',baseline:1,unit:'mL',note:'Registrar obtención, preparación, volumen y áreas tratadas.'},
    combined:{label:'Procedimiento combinado',baseline:2,unit:'mixto',note:'Documentar cada producto, secuencia, plano y volumen o unidades por separado.'},
    other:{label:'Otro procedimiento estético',baseline:1,unit:'cantidad',note:'Completar descripción, producto, técnica, cantidad y riesgos específicos.'}
  };

  const HISTORY=[
    ['allergy','Alergia conocida al producto, anestésico o excipiente'],
    ['infection','Infección activa, lesión cutánea o inflamación en la zona'],
    ['pregnancy','Embarazo o lactancia'],
    ['neuromuscular','Enfermedad neuromuscular o alteración de la transmisión neuromuscular'],
    ['anticoagulant','Anticoagulantes, antiagregantes o tendencia hemorrágica'],
    ['autoimmune','Enfermedad autoinmune, inmunosupresión o terapia inmunomoduladora'],
    ['priorEvent','Complicación previa por toxina, relleno u otro procedimiento estético'],
    ['surgeryScar','Cirugía, implante, relleno previo o cicatriz relevante en la zona']
  ];

  const defaultContext=()=>({
    intervention:'toxin',indication:'',zones:'',technique:'',productDetail:'',quantity:'',unit:'U',
    history:Object.fromEntries(HISTORY.map(([key])=>[key,false])),historyNotes:'',procedureNotes:''
  });

  let context=loadContext();
  let addingPoint=false;
  let dragInstalled=false;

  function loadContext(){
    try{return {...defaultContext(),...JSON.parse(sessionStorage.getItem(CONTEXT_KEY)||'{}')};}
    catch(_){return defaultContext();}
  }

  function saveContext(){
    try{sessionStorage.setItem(CONTEXT_KEY,JSON.stringify(context));}catch(_){}
  }

  function procedureState(){
    try{return JSON.parse(sessionStorage.getItem(PROCEDURE_KEY)||'null');}
    catch(_){return null;}
  }

  function writeProcedureState(state){
    try{sessionStorage.setItem(PROCEDURE_KEY,JSON.stringify(state));return true;}catch(_){return false;}
  }

  function dispatch(el,type='input'){
    if(!el)return;
    el.dispatchEvent(new Event(type,{bubbles:true}));
  }

  function esc(value){
    return String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  }

  function setMobileTab(tab,scroll=true){
    document.body.dataset.mobileTab=tab;
    document.querySelectorAll('[data-mobile-tab]').forEach(button=>button.classList.toggle('active',button.dataset.mobileTab===tab));
    if(scroll)window.scrollTo({top:0,behavior:'smooth'});
  }

  function reorderTabs(){
    const nav=document.querySelector('.oa-mobile-tabs');
    if(!nav)return;
    const buttons=Object.fromEntries(Array.from(nav.querySelectorAll('[data-mobile-tab]')).map(button=>[button.dataset.mobileTab,button]));
    const labels={record:'Registro',map:'Mapa',summary:'Resumen'};
    ['record','map','summary'].forEach(tab=>{
      const button=buttons[tab];
      if(!button)return;
      button.textContent=labels[tab];
      button.onclick=()=>setMobileTab(tab);
      nav.append(button);
    });
    if(!sessionStorage.getItem(FIRST_KEY)){
      sessionStorage.setItem(FIRST_KEY,'1');
      setMobileTab('record',false);
    }
  }

  function buildClinicalContext(){
    const record=document.querySelector('.oa-record-panel');
    const procedureHead=record?.querySelector('.oa-procedure-head');
    if(!record||!procedureHead||$('oaClinicalContext'))return;

    const card=document.createElement('section');
    card.id='oaClinicalContext';
    card.className='oa-card oa-clinical-context';
    card.innerHTML=`
      <div class="oa-section-title">Tipo de intervención y evaluación preprocedimiento</div>
      <div class="oa-context-grid">
        <label>Tipo de intervención
          <select id="oaIntervention">${Object.entries(TYPES).map(([key,item])=>`<option value="${key}">${item.label}</option>`).join('')}</select>
        </label>
        <label>Indicación / objetivo
          <input id="oaIndication" placeholder="Motivo clínico-estético y objetivo acordado">
        </label>
        <label>Zonas a tratar
          <input id="oaZones" placeholder="Ej.: glabela, frente, periocular">
        </label>
        <label>Técnica / plano
          <input id="oaTechnique" placeholder="Técnica, plano, aguja o cánula">
        </label>
        <label>Producto / material complementario
          <input id="oaProductDetail" placeholder="Marca, presentación o material">
        </label>
        <label>Cantidad prevista
          <div style="display:grid;grid-template-columns:1fr 92px;gap:7px"><input id="oaQuantity" type="number" min="0" step="0.01" inputmode="decimal" placeholder="0"><select id="oaUnit"><option>U</option><option>mL</option><option>hilos</option><option>jeringas</option><option>otro</option></select></div>
        </label>
        <label class="wide">Comentario técnico del procedimiento
          <textarea id="oaProcedureNotes" rows="2" placeholder="Plan, secuencia, lateralidad, asimetrías y observaciones"></textarea>
        </label>
      </div>
      <div class="oa-section-title" style="margin-top:14px">Antecedentes mórbidos y factores de precaución</div>
      <div class="oa-history-grid">${HISTORY.map(([key,label])=>`<label class="oa-history-check"><input type="checkbox" id="oaHistory_${key}"><span>${label}</span></label>`).join('')}</div>
      <label class="oa-history-notes">Otros antecedentes relevantes
        <textarea id="oaHistoryNotes" rows="3" placeholder="Medicamentos, alergias, enfermedades, procedimientos previos y antecedentes pertinentes"></textarea>
      </label>
      <div class="oa-risk-panel">
        <div class="oa-risk-head"><strong>Riesgo / nivel de precaución documental</strong><span class="oa-risk-badge low" id="oaRiskBadge">Bajo</span></div>
        <p class="oa-risk-text" id="oaRiskText"></p>
        <ul class="oa-risk-alerts" id="oaRiskAlerts"></ul>
      </div>`;

    procedureHead.insertAdjacentElement('afterend',card);
    hydrateContext();
    bindContext();
    updateProcedureMode();
    updateRisk();
  }

  function hydrateContext(){
    $('oaIntervention').value=context.intervention;
    $('oaIndication').value=context.indication;
    $('oaZones').value=context.zones;
    $('oaTechnique').value=context.technique;
    $('oaProductDetail').value=context.productDetail;
    $('oaQuantity').value=context.quantity;
    $('oaUnit').value=context.unit;
    $('oaProcedureNotes').value=context.procedureNotes;
    $('oaHistoryNotes').value=context.historyNotes;
    HISTORY.forEach(([key])=>{const input=$(`oaHistory_${key}`);if(input)input.checked=!!context.history?.[key];});
  }

  function bindContext(){
    const textMap={oaIndication:'indication',oaZones:'zones',oaTechnique:'technique',oaProductDetail:'productDetail',oaQuantity:'quantity',oaUnit:'unit',oaProcedureNotes:'procedureNotes',oaHistoryNotes:'historyNotes'};
    Object.entries(textMap).forEach(([id,key])=>{
      const element=$(id);
      if(!element)return;
      const event=element.tagName==='SELECT'?'change':'input';
      element.addEventListener(event,()=>{
        context[key]=element.value;
        saveContext();
        updateRisk();
        refreshSummary();
      });
    });
    $('oaIntervention').addEventListener('change',event=>{
      context.intervention=event.target.value;
      context.unit=TYPES[context.intervention]?.unit||'cantidad';
      $('oaUnit').value=['U','mL','hilos'].includes(context.unit)?context.unit:'otro';
      saveContext();
      updateProcedureMode();
      updateRisk();
      refreshSummary();
    });
    HISTORY.forEach(([key])=>{
      $(`oaHistory_${key}`)?.addEventListener('change',event=>{
        context.history={...context.history,[key]:event.target.checked};
        saveContext();
        updateRisk();
        refreshSummary();
      });
    });
  }

  function updateProcedureMode(){
    const type=TYPES[context.intervention]||TYPES.other;
    document.body.dataset.procedureKind=context.intervention;
    const title=document.querySelector('.oa-title strong');
    const subtitle=document.querySelector('.oa-title span');
    if(title)title.textContent='Registro de armonización orofacial';
    if(subtitle)subtitle.textContent='Toxina, rellenos, bioestimulación y otros procedimientos';
    const calc=document.querySelector('.oa-calculator');
    if(calc){
      const section=calc.querySelector('.oa-section-title');
      if(section)section.textContent=context.intervention==='toxin'?'Calculadora del vial':'Producto y trazabilidad';
      calc.querySelector('.oa-calc-results')?.toggleAttribute('hidden',context.intervention!=='toxin');
      const note=calc.querySelector('.oa-safety-note');
      if(note)note.textContent=type.note;
    }
  }

  function riskResult(){
    const type=TYPES[context.intervention]||TYPES.other;
    const h=context.history||{};
    let score=type.baseline;
    const alerts=[];
    if(h.allergy){score+=3;alerts.push('Verificar alergia o hipersensibilidad antes de utilizar el producto o anestésico.');}
    if(h.infection){score+=3;alerts.push('La infección o inflamación activa requiere reevaluar la oportunidad del procedimiento.');}
    if(h.pregnancy){score+=2;alerts.push('Embarazo o lactancia: confirmar indicación, evidencia disponible y conducta institucional.');}
    if(h.neuromuscular){score+=context.intervention==='toxin'?3:2;alerts.push('Antecedente neuromuscular: requiere evaluación específica y revisión de medicamentos.');}
    if(h.anticoagulant){score+=1;alerts.push('Registrar anticoagulación o antiagregación y el riesgo de hematoma; no suspender medicación sin indicación del tratante.');}
    if(h.autoimmune){score+=1;alerts.push('Documentar estabilidad de enfermedad autoinmune o inmunosupresión y tratamientos vigentes.');}
    if(h.priorEvent){score+=2;alerts.push('Complicación estética previa: documentar producto, zona, evolución y resolución.');}
    if(h.surgeryScar){score+=1;alerts.push('Cirugía, relleno previo o cicatriz pueden modificar planos y anatomía local.');}
    if(context.intervention==='hyaluronic'||context.intervention==='combined')alerts.push('Confirmar protocolo, insumos y ruta de respuesta ante compromiso vascular.');
    const level=score>=4?'high':score>=2?'moderate':'low';
    const label={low:'Bajo',moderate:'Moderado',high:'Alto'}[level];
    const text={
      low:'Precauciones habituales, consentimiento específico, técnica aséptica y documentación del producto.',
      moderate:'Se identificaron factores o un procedimiento que requieren verificación adicional, consentimiento reforzado y plan de contingencia.',
      high:'Existen factores que justifican reevaluar la indicación, obtener antecedentes adicionales o diferir el procedimiento según criterio clínico.'
    }[level];
    return{score,level,label,text,alerts};
  }

  function updateRisk(){
    const result=riskResult();
    const badge=$('oaRiskBadge');
    if(badge){badge.className=`oa-risk-badge ${result.level}`;badge.textContent=result.label;}
    if($('oaRiskText'))$('oaRiskText').textContent=result.text+' Esta clasificación es orientativa y no corresponde a una escala clínica validada.';
    if($('oaRiskAlerts'))$('oaRiskAlerts').innerHTML=result.alerts.length?result.alerts.map(item=>`<li>${esc(item)}</li>`).join(''):'<li>Sin alertas adicionales registradas.</li>';
  }

  function buildMapTools(){
    const zonebar=document.querySelector('.oa-mobile-zonebar');
    const mapPanel=document.querySelector('.oa-map-panel');
    if(!zonebar||!mapPanel||$('oaMapMobileTools'))return;
    const tools=document.createElement('div');
    tools.id='oaMapMobileTools';
    tools.className='oa-map-mobile-tools';
    tools.innerHTML='<button type="button" class="add" id="oaAddPointMobile">＋ Agregar punto</button><button type="button" class="traffic" id="oaTrafficButton">● Semáforo</button>';
    zonebar.insertAdjacentElement('afterend',tools);

    const traffic=document.createElement('div');
    traffic.id='oaTrafficPopover';
    traffic.className='oa-traffic-popover';
    traffic.innerHTML=`<div class="oa-traffic-title"><strong>Semáforo del registro</strong><button type="button" id="oaTrafficClose">×</button></div><div class="oa-traffic-list">
      <div class="oa-traffic-item"><i class="oa-traffic-dot suggested"></i>Sugerido, sin registro</div>
      <div class="oa-traffic-item"><i class="oa-traffic-dot planned"></i>Planificado</div>
      <div class="oa-traffic-item"><i class="oa-traffic-dot administered"></i>Administrado</div>
      <div class="oa-traffic-item"><i class="oa-traffic-dot omitted"></i>Omitido</div>
      <div class="oa-traffic-item"><i class="oa-traffic-dot selected"></i>Punto seleccionado</div>
    </div>`;
    mapPanel.append(traffic);

    const banner=document.createElement('div');
    banner.id='oaAddModeBanner';
    banner.className='oa-add-mode-banner';
    banner.textContent='Toca la ubicación anatómica donde deseas crear el nuevo punto.';
    document.body.append(banner);

    $('oaAddPointMobile').onclick=startAddPoint;
    $('oaTrafficButton').onclick=()=>traffic.classList.toggle('open');
    $('oaTrafficClose').onclick=()=>traffic.classList.remove('open');
  }

  function startAddPoint(){
    addingPoint=true;
    $('btnAddPoint')?.click();
    $('oaAddModeBanner')?.classList.add('show');
    $('oaPointSheet')?.classList.remove('open');
    setMobileTab('map',false);
  }

  function buildPointSheet(){
    if($('oaPointSheet'))return;
    const sheet=document.createElement('aside');
    sheet.id='oaPointSheet';
    sheet.className='oa-point-sheet';
    sheet.innerHTML=`
      <div class="oa-point-sheet-head"><div><strong id="oaQuickTitle">Punto seleccionado</strong><span id="oaQuickZone">Registra planificación y administración</span></div><button type="button" id="oaQuickClose">×</button></div>
      <div class="oa-point-sheet-grid">
        <label>Etiqueta<input id="oaQuickLabel"></label>
        <label>Planificado<input id="oaQuickPlan" type="number" min="0" step="0.1" inputmode="decimal"></label>
        <label>Administrado<input id="oaQuickAdmin" type="number" min="0" step="0.1" inputmode="decimal"></label>
        <label>Estado<select id="oaQuickStatus"><option value="suggested">Sugerido</option><option value="planned">Planificado</option><option value="administered">Administrado</option><option value="omitted">Omitido</option></select></label>
        <label>Comentario<input id="oaQuickComment" placeholder="Opcional"></label>
      </div>
      <div class="oa-point-sheet-actions"><button type="button" class="save" id="oaQuickSave">Guardar punto</button><button type="button" class="delete" id="oaQuickDelete">Eliminar punto</button></div>
      <div class="oa-point-sheet-foot"><button type="button" id="oaQuickMarkAdmin">Copiar plan a administrado</button><button type="button" id="oaQuickAdd">Agregar otro punto en el mapa</button></div>`;
    document.body.append(sheet);
    $('oaQuickClose').onclick=()=>sheet.classList.remove('open');
    $('oaQuickSave').onclick=saveQuickPoint;
    $('oaQuickDelete').onclick=()=>{$('btnDeletePoint')?.click();sheet.classList.remove('open');};
    $('oaQuickMarkAdmin').onclick=()=>{$('oaQuickAdmin').value=$('oaQuickPlan').value;$('oaQuickStatus').value='administered';saveQuickPoint();};
    $('oaQuickAdd').onclick=startAddPoint;
  }

  function openQuickPoint(){
    const original=$('pointFields');
    if(!original||original.hidden)return;
    $('oaQuickLabel').value=$('pointLabel')?.value||'';
    $('oaQuickPlan').value=$('pointPlanned')?.value||'';
    $('oaQuickAdmin').value=$('pointAdmin')?.value||'';
    $('oaQuickStatus').value=$('pointStatus')?.value||'suggested';
    $('oaQuickComment').value=$('pointComment')?.value||'';
    $('oaQuickTitle').textContent=$('pointLabel')?.value||'Punto seleccionado';
    $('oaQuickZone').textContent=$('zoneSelect')?.selectedOptions?.[0]?.textContent||'Zona de tratamiento';
    $('oaPointSheet').classList.add('open');
    setMobileTab('map',false);
  }

  function saveQuickPoint(){
    const pairs=[['pointLabel','oaQuickLabel','input'],['pointPlanned','oaQuickPlan','input'],['pointAdmin','oaQuickAdmin','input'],['pointStatus','oaQuickStatus','change'],['pointComment','oaQuickComment','input']];
    pairs.forEach(([originalId,quickId,event])=>{
      const original=$(originalId),quick=$(quickId);
      if(!original||!quick)return;
      original.value=quick.value;
      dispatch(original,event);
    });
    $('oaPointSheet').classList.remove('open');
    refreshSummary();
  }

  function installPointInteractions(){
    const layer=$('pointLayer');
    if(!layer||layer.dataset.v147Bound==='1')return;
    layer.dataset.v147Bound='1';
    const observer=new MutationObserver(bindPointButtons);
    observer.observe(layer,{childList:true});
    bindPointButtons();

    const atlas=$('atlasShell');
    atlas?.addEventListener('click',()=>{
      if(!addingPoint)return;
      setTimeout(()=>{
        addingPoint=false;
        $('oaAddModeBanner')?.classList.remove('show');
        openQuickPoint();
      },100);
    });
  }

  function bindPointButtons(){
    const layer=$('pointLayer');
    if(!layer)return;
    Array.from(layer.querySelectorAll('.oa-point')).forEach((button,index)=>{
      if(button.dataset.v147Bound==='1')return;
      button.dataset.v147Bound='1';
      const originalClick=button.onclick;
      button.onpointerdown=event=>{
        event.preventDefault();
        event.stopPropagation();
        const startX=event.clientX,startY=event.clientY;
        let moved=false;
        button.setPointerCapture?.(event.pointerId);
        const move=moveEvent=>{
          if(Math.hypot(moveEvent.clientX-startX,moveEvent.clientY-startY)>4)moved=true;
          if(!moved)return;
          const rect=layer.getBoundingClientRect();
          const x=Math.max(1.5,Math.min(98.5,(moveEvent.clientX-rect.left)/rect.width*100));
          const y=Math.max(1.5,Math.min(98.5,(moveEvent.clientY-rect.top)/rect.height*100));
          button.style.left=`${x}%`;
          button.style.top=`${y}%`;
          button.dataset.pendingX=String(x);
          button.dataset.pendingY=String(y);
        };
        const up=upEvent=>{
          button.releasePointerCapture?.(upEvent.pointerId);
          button.removeEventListener('pointermove',move);
          button.removeEventListener('pointerup',up);
          button.removeEventListener('pointercancel',up);
          if(moved){
            const state=procedureState();
            if(state?.points?.[index]){
              state.points[index].x=Number(button.dataset.pendingX);
              state.points[index].y=Number(button.dataset.pendingY);
              state.mobileTab='map';
              writeProcedureState(state);
              location.reload();
            }
            return;
          }
          originalClick?.call(button,new MouseEvent('click',{bubbles:false,cancelable:true,view:window}));
          setTimeout(openQuickPoint,20);
        };
        button.addEventListener('pointermove',move);
        button.addEventListener('pointerup',up);
        button.addEventListener('pointercancel',up);
      };
      button.onclick=event=>{event.preventDefault();event.stopPropagation();};
    });
  }

  function buildSummaryRecord(){
    const record=document.querySelector('.oa-record-panel');
    const table=record?.querySelector('.oa-table-card');
    if(!record||!table||$('oaSummaryRecord'))return;
    const card=document.createElement('section');
    card.id='oaSummaryRecord';
    card.className='oa-card oa-summary-record oa-mobile-summary';
    card.innerHTML='<div class="oa-section-title">Resumen del registro clínico</div><div class="oa-summary-record-grid" id="oaSummaryRecordGrid"></div><div class="oa-summary-history"><strong>Antecedentes y alertas registradas</strong><p id="oaSummaryHistory">Sin antecedentes seleccionados.</p></div>';
    table.insertAdjacentElement('beforebegin',card);
    refreshSummary();
  }

  function refreshSummary(){
    const grid=$('oaSummaryRecordGrid');
    if(!grid)return;
    const type=TYPES[context.intervention]||TYPES.other;
    const risk=riskResult();
    const patientName=$('patientName')?.value||'Sin paciente';
    const patientId=$('patientId')?.value||'—';
    const date=$('procedureDate')?.value||'—';
    const product=$('productName')?.value||context.productDetail||'—';
    const batch=$('batchNumber')?.value||'—';
    const items=[
      ['Paciente',patientName],['RUN / RUT',patientId],['Fecha',date],
      ['Intervención',type.label],['Indicación',context.indication||'—'],['Zonas',context.zones||'—'],
      ['Riesgo / precaución',risk.label],['Producto / material',product],['Lote',batch],
      ['Técnica / plano',context.technique||'—'],['Cantidad prevista',context.quantity?`${context.quantity} ${context.unit}`:'—'],['Comentario técnico',context.procedureNotes||'—','wide']
    ];
    grid.innerHTML=items.map(([label,value,wide])=>`<div class="oa-summary-record-item ${wide||''}"><span>${esc(label)}</span><strong>${esc(value)}</strong></div>`).join('');
    const selected=HISTORY.filter(([key])=>context.history?.[key]).map(([,label])=>label);
    const text=[selected.length?selected.join(' · '):'Sin factores marcados.',context.historyNotes||'',risk.alerts.join(' ')].filter(Boolean).join(' ');
    $('oaSummaryHistory').textContent=text;
  }

  function observeSummarySources(){
    ['patientName','patientId','procedureDate','productName','batchNumber','vialUnits','dilutionMl'].forEach(id=>{
      $(id)?.addEventListener('input',refreshSummary);
      $(id)?.addEventListener('change',refreshSummary);
    });
    const table=$('pointsTableBody');
    if(table)new MutationObserver(refreshSummary).observe(table,{childList:true,subtree:true});
  }

  function boot(){
    if(!$('pointLayer')||!document.querySelector('.oa-record-panel')){setTimeout(boot,100);return;}
    reorderTabs();
    buildClinicalContext();
    buildMapTools();
    buildPointSheet();
    installPointInteractions();
    buildSummaryRecord();
    observeSummarySources();
    refreshSummary();
  }

  boot();
})();
