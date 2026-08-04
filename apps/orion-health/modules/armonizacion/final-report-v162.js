(()=>{
  'use strict';

  const VERSION='1.6.2';
  const PROCEDURE_KEY='orion_aesthetic_procedure_v145';
  const CONTEXT_KEY='orion_aesthetic_clinical_context_v147';
  const SETTINGS_KEY='orion_aesthetic_v160_settings';
  const LOCK_KEY='orion_aesthetic_v160_lock';
  const MULTI_KEY='orion_aesthetic_multi_selection_v148';
  const $=id=>document.getElementById(id);

  const ZONES={
    forehead:'Frente',glabella:'Glabela / corrugadores',periocular_r:'Periocular derecho',periocular_l:'Periocular izquierdo',
    bunny:'Bunny lines / nasal',smile:'Sonrisa gingival / perioral',dao_r:'DAO derecho',dao_l:'DAO izquierdo',
    menton:'Mentón',masseter_r:'Masetero derecho',masseter_l:'Masetero izquierdo',platysma:'Platisma'
  };

  const INTERVENTIONS={
    toxin:'Toxina botulínica tipo A',
    hyaluronic:'Relleno con ácido hialurónico',
    caha:'Bioestimulador - hidroxiapatita de calcio',
    plla:'Bioestimulador - ácido poli-L-láctico',
    skinbooster:'Skinbooster / mesoterapia',
    threads:'Hilos tensores o bioestimuladores',
    prp:'Plasma rico en plaquetas / autólogo',
    combined:'Procedimiento combinado',
    other:'Otro procedimiento estético'
  };

  const HISTORY={
    allergy:'Alergia conocida al producto, anestésico o excipiente',
    infection:'Infección activa, lesión cutánea o inflamación en la zona',
    pregnancy:'Embarazo o lactancia',
    neuromuscular:'Enfermedad neuromuscular o alteración de la transmisión neuromuscular',
    anticoagulant:'Anticoagulantes, antiagregantes o tendencia hemorrágica',
    autoimmune:'Enfermedad autoinmune, inmunosupresión o terapia inmunomoduladora',
    priorEvent:'Complicación previa por toxina, relleno u otro procedimiento estético',
    surgeryScar:'Cirugía, implante, relleno previo o cicatriz relevante en la zona'
  };

  const num=value=>{
    const parsed=Number.parseFloat(String(value??'').replace(',','.'));
    return Number.isFinite(parsed)?parsed:0;
  };
  const fmt=(value,decimals=1)=>num(value).toLocaleString('es-CL',{minimumFractionDigits:decimals,maximumFractionDigits:decimals});
  const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const text=value=>String(value??'').trim()||'No registrado';

  function loadJSON(key,fallback){
    try{return JSON.parse(sessionStorage.getItem(key)||'null')??fallback;}
    catch(_){return fallback;}
  }

  function procedure(){return loadJSON(PROCEDURE_KEY,{patient:{},vial:{},points:[]});}
  function context(){return loadJSON(CONTEXT_KEY,{});}
  function settings(){return {...{laterality:'symmetric',lateralityNotes:'',contact:''},...loadJSON(SETTINGS_KEY,{})};}
  function lockState(){return {...{closed:false,closedAt:''},...loadJSON(LOCK_KEY,{})};}

  function administeredPoints(state=procedure()){
    return (state.points||[]).filter(point=>num(point.administered)>0);
  }

  function concentration(state=procedure()){
    const units=Math.max(0,num(state.vial?.units));
    const dilution=Math.max(.001,num(state.vial?.dilution));
    return units/dilution;
  }

  function totals(state=procedure()){
    const points=administeredPoints(state);
    const administered=points.reduce((sum,point)=>sum+num(point.administered),0);
    const conc=concentration(state);
    return{
      points,
      administered,
      volume:conc?administered/conc:0,
      concentration:conc,
      remaining:Math.max(0,num(state.vial?.units)-administered)
    };
  }

  function zoneIndex(state,point){
    return (state.points||[]).filter(item=>item.zone===point.zone).findIndex(item=>item.id===point.id)+1;
  }

  function lateralityLabel(value){
    return{
      symmetric:'Simétrica',
      right:'Predominio derecho',
      left:'Predominio izquierdo',
      custom:'Personalizada'
    }[value]||'No especificada';
  }

  function riskResult(ctx=context()){
    const baseline={toxin:0,hyaluronic:2,caha:2,plla:2,skinbooster:1,threads:2,prp:1,combined:2,other:1}[ctx.intervention]??1;
    const h=ctx.history||{};
    let score=baseline;
    const alerts=[];
    if(h.allergy){score+=3;alerts.push('Verificar alergia o hipersensibilidad antes de utilizar el producto o anestésico.');}
    if(h.infection){score+=3;alerts.push('La infección o inflamación activa requiere reevaluar la oportunidad del procedimiento.');}
    if(h.pregnancy){score+=2;alerts.push('Embarazo o lactancia: confirmar indicación, evidencia disponible y conducta institucional.');}
    if(h.neuromuscular){score+=ctx.intervention==='toxin'?3:2;alerts.push('Antecedente neuromuscular: requiere evaluación específica y revisión de medicamentos.');}
    if(h.anticoagulant){score+=1;alerts.push('Registrar anticoagulación o antiagregación y riesgo de hematoma.');}
    if(h.autoimmune){score+=1;alerts.push('Documentar estabilidad de enfermedad autoinmune o inmunosupresión y tratamientos vigentes.');}
    if(h.priorEvent){score+=2;alerts.push('Complicación estética previa: documentar producto, zona, evolución y resolución.');}
    if(h.surgeryScar){score+=1;alerts.push('Cirugía, relleno previo o cicatriz pueden modificar planos y anatomía local.');}
    if(ctx.intervention==='hyaluronic'||ctx.intervention==='combined')alerts.push('Confirmar protocolo, insumos y ruta de respuesta ante compromiso vascular.');
    const level=score>=4?'high':score>=2?'moderate':'low';
    return{
      score,
      level,
      label:{low:'Bajo',moderate:'Moderado',high:'Alto'}[level],
      text:{
        low:'Precauciones habituales, consentimiento específico, técnica aséptica y documentación del producto.',
        moderate:'Se identificaron factores que requieren verificación adicional, consentimiento reforzado y plan de contingencia.',
        high:'Existen factores que justifican reevaluar la indicación, obtener antecedentes adicionales o diferir el procedimiento.'
      }[level],
      alerts
    };
  }

  function riskLists(kind){
    if(kind==='toxin')return{
      common:[
        'Dolor, enrojecimiento, edema o hematoma en los sitios de inyección.',
        'Cefalea, sensibilidad o respuesta temporal insuficiente o asimétrica.',
        'Debilidad temporal de músculos adyacentes, caída de ceja o párpado y alteración transitoria de la expresión.'
      ],
      serious:['Debilidad muscular generalizada, dificultad para hablar, deglutir o respirar requieren evaluación urgente.'],
      after:[
        'No frotar ni masajear las zonas tratadas durante el periodo indicado por el profesional.',
        'Seguir las indicaciones específicas sobre ejercicio, exposición al calor, cosméticos y otros procedimientos.',
        'Solicitar evaluación ante debilidad inesperada, alteración visual, dificultad para deglutir, hablar o respirar.'
      ]
    };
    if(kind==='hyaluronic'||kind==='combined')return{
      common:[
        'Dolor, sensibilidad, edema, hematoma, prurito o enrojecimiento.',
        'Asimetría, irregularidad, sobrecorrección, migración, nódulos, granulomas o infección.'
      ],
      serious:['La inyección intravascular puede producir compromiso del flujo sanguíneo, necrosis, alteración visual, ceguera o accidente cerebrovascular.'],
      after:[
        'No manipular ni comprimir la zona salvo indicación específica del profesional.',
        'Contactar inmediatamente ante dolor intenso o creciente, palidez, coloración reticulada, frialdad, ampollas o cambios cutáneos progresivos.',
        'La alteración visual, debilidad, dificultad para hablar o síntomas neurológicos requieren atención de urgencia inmediata.'
      ]
    };
    return{
      common:[
        'Dolor, edema, enrojecimiento, hematoma, sensibilidad, asimetría o respuesta insuficiente.',
        'Infección, inflamación persistente, irregularidad o necesidad de procedimientos adicionales.'
      ],
      serious:['Las complicaciones específicas dependen del producto, el plano, la técnica y la zona tratada.'],
      after:[
        'Mantener la zona limpia y seguir las indicaciones específicas entregadas por el profesional.',
        'Consultar ante dolor intenso, inflamación progresiva, secreción, fiebre, cambio de color o síntomas inesperados.'
      ]
    };
  }

  function pageHeader(title,subtitle,code){
    return`<header class="oa-v162-header">
      <img src="../../assets/brand/orion-health.png" alt="ORION Health">
      <div><h1>${esc(title)}</h1><p>${esc(subtitle)}</p></div>
      <div class="oa-v162-doc-code">${esc(code)}<br>V${VERSION}</div>
    </header>`;
  }

  function footer(page,total){
    return`<footer class="oa-v162-footer"><span>ORION Health - Registro clínico documental</span><span>Página ${page} de ${total}</span></footer>`;
  }

  function item(label,value,wide=false){
    return`<div class="oa-v162-item${wide?' wide':''}"><span>${esc(label)}</span><strong>${esc(text(value))}</strong></div>`;
  }

  function pageShell(title,subtitle,code,content,page,total,extraClass=''){
    return`<section class="oa-v162-page ${extraClass}">${pageHeader(title,subtitle,code)}${content}${footer(page,total)}</section>`;
  }

  function chunk(list,size){
    const result=[];
    for(let index=0;index<list.length;index+=size)result.push(list.slice(index,index+size));
    return result.length?result:[[]];
  }

  function selectedHistory(ctx){
    const marked=Object.entries(HISTORY).filter(([key])=>ctx.history?.[key]).map(([,label])=>label);
    if(ctx.historyNotes)marked.push(`Otros: ${ctx.historyNotes}`);
    return marked;
  }

  function mapMarkup(state,points){
    const source=$('atlasImage')?.src||'';
    const pointMarkup=points.map(point=>`<span class="oa-v162-map-point" style="left:${num(point.x)}%;top:${num(point.y)}%"><b>${zoneIndex(state,point)}</b><small>${fmt(point.administered,1)} U</small></span>`).join('');
    return`<div class="oa-v162-atlas"><img src="${esc(source)}" alt="Mapa anatómico final">${pointMarkup}</div>`;
  }

  function pointRows(state,points,totalData){
    return points.map(point=>{
      const volume=totalData.concentration?num(point.administered)/totalData.concentration:0;
      return`<tr>
        <td>${esc(ZONES[point.zone]||point.zone)}</td>
        <td>${zoneIndex(state,point)}</td>
        <td>${esc(point.label||'Punto')}</td>
        <td>${fmt(point.administered,2)} U</td>
        <td>${fmt(volume,3)} mL</td>
        <td>${esc(point.comment||'')}</td>
      </tr>`;
    }).join('');
  }

  function buildReport(){
    const state=procedure();
    const ctx=context();
    const currentSettings=settings();
    const currentLock=lockState();
    const totalData=totals(state);
    const points=totalData.points;
    const patient=state.patient||{};
    const kind=ctx.intervention||'toxin';
    const risks=riskLists(kind);
    const risk=riskResult(ctx);
    const histories=selectedHistory(ctx);
    const pointChunks=chunk(points,18);
    const totalPages=4+pointChunks.length;
    let pageNumber=1;
    const pages=[];

    const registration=`
      <h2 class="oa-v162-title">Registro clínico del procedimiento</h2>
      <div class="oa-v162-grid">
        ${item('Paciente',patient.name)}
        ${item('RUN / RUT',patient.id)}
        ${item('Fecha',patient.date)}
        ${item('Intervención',INTERVENTIONS[kind]||kind)}
        ${item('Indicación / objetivo',ctx.indication,true)}
        ${item('Zonas tratadas',ctx.zones,true)}
        ${item('Técnica / plano',ctx.technique)}
        ${item('Producto / material',ctx.productDetail||state.vial?.product)}
        ${item('Cantidad administrada global',ctx.quantity?`${ctx.quantity} ${ctx.unit||''}`:'Calculada desde puntos')}
        ${item('Comentario técnico',ctx.procedureNotes,true)}
      </div>
      <h3 class="oa-v162-subtitle">Producto, vial y trazabilidad</h3>
      <div class="oa-v162-grid">
        ${item('Producto',state.vial?.product)}
        ${item('Lote',state.vial?.batch)}
        ${item('Vial / presentación',state.vial?.units?`${fmt(state.vial.units,1)} U`:'No registrado')}
        ${item('Dilución',state.vial?.dilution?`${fmt(state.vial.dilution,2)} mL`:'No registrada')}
        ${item('Concentración',totalData.concentration?`${fmt(totalData.concentration,2)} U/mL`:'No calculada')}
        ${item('Remanente teórico',`${fmt(totalData.remaining,2)} U`)}
      </div>
      <h3 class="oa-v162-subtitle">Antecedentes y precaución documental</h3>
      <div class="oa-v162-alert ${risk.level}"><strong>Nivel ${risk.label}.</strong> ${esc(risk.text)}</div>
      <ul class="oa-v162-list">${(histories.length?histories:['Sin antecedentes marcados.']).map(value=>`<li>${esc(value)}</li>`).join('')}</ul>
      ${risk.alerts.length?`<div class="oa-v162-alert"><strong>Alertas registradas</strong><ul class="oa-v162-list">${risk.alerts.map(value=>`<li>${esc(value)}</li>`).join('')}</ul></div>`:''}
      <h3 class="oa-v162-subtitle">Resumen de administración</h3>
      <div class="oa-v162-grid">
        ${item('Puntos administrados',points.length)}
        ${item('Total administrado',`${fmt(totalData.administered,2)} U`)}
        ${item('Volumen administrado',`${fmt(totalData.volume,3)} mL`)}
        ${item('Lateralidad',lateralityLabel(currentSettings.laterality))}
        ${item('Descripción de asimetría',currentSettings.lateralityNotes,true)}
        ${item('Estado del procedimiento',currentLock.closed?`Cerrado ${currentLock.closedAt||''}`:'Abierto')}
      </div>`;
    pages.push(pageShell('ORION Armonización Orofacial','Informe clínico integrado','ORH-AO-INF-001',registration,pageNumber++,totalPages));

    const mapPage=`
      <h2 class="oa-v162-title">Resumen gráfico del procedimiento</h2>
      <p class="oa-v162-text">El mapa representa únicamente los puntos con administración confirmada y su ubicación final dentro de la sesión.</p>
      <div class="oa-v162-map-wrap">
        ${mapMarkup(state,points)}
        <div class="oa-v162-map-summary">
          ${item('Puntos administrados',points.length)}
          ${item('Total administrado',`${fmt(totalData.administered,2)} U`)}
          ${item('Volumen total',`${fmt(totalData.volume,3)} mL`)}
          ${item('Concentración',`${fmt(totalData.concentration,2)} U/mL`)}
          ${item('Lateralidad',lateralityLabel(currentSettings.laterality))}
          ${item('Observación',currentSettings.lateralityNotes)}
        </div>
      </div>`;
    pages.push(pageShell('ORION Armonización Orofacial','Mapa final y resumen de administración','ORH-AO-MAP-001',mapPage,pageNumber++,totalPages));

    pointChunks.forEach((group,index)=>{
      const table=`
        <h2 class="oa-v162-title">Registro de puntos administrados${pointChunks.length>1?` - Parte ${index+1}`:''}</h2>
        ${group.length?`<table class="oa-v162-table"><thead><tr><th style="width:18%">Zona</th><th style="width:7%">N°</th><th style="width:22%">Etiqueta</th><th style="width:12%">Administrado</th><th style="width:12%">Volumen</th><th>Comentario</th></tr></thead><tbody>${pointRows(state,group,totalData)}</tbody></table>`:'<p class="oa-v162-text">No existen puntos administrados confirmados.</p>'}
        <div class="oa-v162-grid" style="margin-top:4mm">
          ${item('Total puntos',points.length)}
          ${item('Total administrado',`${fmt(totalData.administered,2)} U`)}
          ${item('Volumen total',`${fmt(totalData.volume,3)} mL`)}
        </div>`;
      pages.push(pageShell('ORION Armonización Orofacial','Detalle de administración por punto','ORH-AO-REG-001',table,pageNumber++,totalPages));
    });

    const consent=`
      <div class="oa-v162-draft">BORRADOR CLÍNICO: debe ser revisado, explicado y adaptado por el profesional antes de la firma.</div>
      <h2 class="oa-v162-title">Consentimiento informado específico</h2>
      <div class="oa-v162-grid two">
        ${item('Paciente',patient.name)}
        ${item('RUN / RUT',patient.id)}
        ${item('Procedimiento',INTERVENTIONS[kind]||kind)}
        ${item('Fecha',patient.date)}
      </div>
      <h3 class="oa-v162-subtitle">Objetivo y alcance</h3>
      <p class="oa-v162-text">${esc(text(ctx.indication||'Objetivo clínico-estético explicado y acordado durante la evaluación.'))}</p>
      <h3 class="oa-v162-subtitle">Riesgos y efectos posibles</h3>
      <ul class="oa-v162-list">${[...risks.common,...risks.serious].map(value=>`<li>${esc(value)}</li>`).join('')}</ul>
      <h3 class="oa-v162-subtitle">Alternativas y decisiones</h3>
      <p class="oa-v162-text">Se explicaron la alternativa de no realizar el procedimiento, otras opciones terapéuticas, la posibilidad de resultados parciales o asimétricos y la eventual necesidad de controles o correcciones.</p>
      <h3 class="oa-v162-subtitle">Declaración</h3>
      <p class="oa-v162-text">Declaro haber informado mis antecedentes, haber podido formular preguntas y comprender que no se garantiza un resultado estético específico. Autorizo el procedimiento descrito después de recibir una explicación suficiente de sus objetivos, alternativas y riesgos.</p>
      <div class="oa-v162-signatures"><div>Firma del paciente</div><div>Firma del profesional</div></div>`;
    pages.push(pageShell('ORION Armonización Orofacial','Consentimiento informado','ORH-AO-CNS-001',consent,pageNumber++,totalPages));

    const aftercare=`
      <div class="oa-v162-draft">BORRADOR PARA REVISIÓN PROFESIONAL: adaptar a producto, zona, técnica y protocolo local.</div>
      <h2 class="oa-v162-title">Indicaciones posteriores al procedimiento</h2>
      <div class="oa-v162-grid two">
        ${item('Paciente',patient.name)}
        ${item('Procedimiento',INTERVENTIONS[kind]||kind)}
        ${item('Fecha',patient.date)}
        ${item('Contacto clínico',currentSettings.contact||'Equipo tratante')}
      </div>
      <h3 class="oa-v162-subtitle">Cuidados</h3>
      <ul class="oa-v162-list">${risks.after.map(value=>`<li>${esc(value)}</li>`).join('')}</ul>
      <h3 class="oa-v162-subtitle">Evolución esperable</h3>
      <ul class="oa-v162-list">${risks.common.map(value=>`<li>${esc(value)}</li>`).join('')}</ul>
      <h3 class="oa-v162-subtitle">Señales de alarma</h3>
      <ul class="oa-v162-list">${risks.serious.map(value=>`<li>${esc(value)}</li>`).join('')}</ul>
      <div class="oa-v162-alert high"><strong>Conducta:</strong> ante una señal de alarma, contactar al equipo tratante o acudir a un servicio de urgencia según la gravedad.</div>
      <h3 class="oa-v162-subtitle">Observaciones específicas</h3>
      <p class="oa-v162-text">${esc(text(ctx.procedureNotes))}</p>
      <div class="oa-v162-signatures"><div>Recibí y comprendí las indicaciones</div><div>Firma / identificación profesional</div></div>`;
    pages.push(pageShell('ORION Armonización Orofacial','Indicaciones posteriores','ORH-AO-IND-001',aftercare,pageNumber++,totalPages));

    let report=$('oaV162FinalReport');
    if(!report){
      report=document.createElement('main');
      report.id='oaV162FinalReport';
      document.body.append(report);
    }
    report.innerHTML=pages.join('');
    return{points,totalData};
  }

  function selectedIds(state=procedure()){
    let ids=loadJSON(MULTI_KEY,[]);
    if(!Array.isArray(ids))ids=[];
    const valid=new Set((state.points||[]).map(point=>point.id));
    ids=ids.filter(id=>valid.has(id));
    if(!ids.length&&state.selectedPointId&&valid.has(state.selectedPointId))ids=[state.selectedPointId];
    return ids;
  }

  function hasPendingAdministration(){
    const input=$('oaV161Admin');
    if(!input||num(input.value)<=0)return false;
    const state=procedure();
    const ids=selectedIds(state);
    if(!ids.length)return false;
    const mode=loadJSON('orion_aesthetic_v160_settings',{}).distributionMode||'perPoint';
    const expected=mode==='total'?num(input.value)/ids.length:num(input.value);
    return ids.some(id=>Math.abs(num(state.points.find(point=>point.id===id)?.administered)-expected)>.0001);
  }

  function printFinalReport(){
    if(hasPendingAdministration()){
      window.alert('Existe una cantidad escrita que todavía no ha sido confirmada. Pulsa “Revisar y guardar”, confirma la administración y luego genera el informe final.');
      return;
    }
    const state=procedure();
    const points=administeredPoints(state);
    if(!points.length&&!window.confirm('No existen puntos administrados confirmados. ¿Generar igualmente el informe?'))return;
    document.body.classList.add('oa-v162-building-report');
    buildReport();
    document.body.classList.remove('oa-v162-building-report');
    document.body.classList.add('oa-v162-print-final');
    setTimeout(()=>window.print(),80);
  }

  function replacePrintButton(id,label){
    const original=$(id);
    if(!original||original.dataset.oaV162Bound==='1')return;
    const button=original.cloneNode(true);
    button.dataset.oaV162Bound='1';
    button.dataset.oaV153PrintBound='1';
    button.textContent=label;
    button.title='Genera un PDF tamaño carta con registro, mapa final, tabla, consentimiento e indicaciones.';
    original.replaceWith(button);
    button.addEventListener('click',event=>{
      event.preventDefault();
      event.stopImmediatePropagation();
      printFinalReport();
    },true);
  }

  function clarifyAdministrationButtons(){
    const apply=$('oaApplySelection');
    if(apply){
      apply.textContent='Editar administración';
      apply.title='Abre o recupera el formulario de los puntos seleccionados. No guarda datos.';
      apply.setAttribute('aria-label','Editar administración de la selección');
    }
    const save=$('oaV161Save');
    if(save){
      save.textContent='Revisar y guardar';
      save.title='Abre la confirmación y, al aceptar, incorpora la administración al resumen y al informe final.';
    }
    const note=document.querySelector('.oa-v161-map-note');
    if(note)note.innerHTML='<strong>Editar administración</strong> solo abre el formulario. <strong>Revisar y guardar</strong> confirma y registra la administración para el resumen y el informe final.';
  }

  function ensureReportNote(){
    const documents=$('oaV160Documents');
    if(documents&&!$('oaV162ReportNote')){
      const note=document.createElement('p');
      note.id='oaV162ReportNote';
      note.className='oa-v162-report-note';
      note.innerHTML='<strong>Informe final integrado:</strong> el botón de PDF genera un documento tamaño carta con registro clínico, mapa final, tabla de administración, consentimiento e indicaciones posteriores.';
      documents.append(note);
    }
  }

  function updateIdentity(){
    document.documentElement.dataset.orionAestheticsVersion=VERSION;
    document.documentElement.classList.add('oa-v162');
    document.title=`ORION Armonización Orofacial V${VERSION}`;
    document.querySelectorAll('.oa-version').forEach(node=>{node.textContent=`V${VERSION}`;});
  }

  function bind(){
    updateIdentity();
    clarifyAdministrationButtons();
    ensureReportNote();
    replacePrintButton('btnPrintTop','Informe final / PDF');
    replacePrintButton('btnPrint','Generar informe final / PDF');
  }

  function boot(){
    if(!$('atlasShell')||!document.querySelector('.oa-general-summary')){
      setTimeout(boot,100);
      return;
    }
    bind();
    window.addEventListener('afterprint',()=>document.body.classList.remove('oa-v162-print-final'));
    new MutationObserver(()=>requestAnimationFrame(bind)).observe(document.body,{subtree:true,childList:true});
  }

  boot();
})();
