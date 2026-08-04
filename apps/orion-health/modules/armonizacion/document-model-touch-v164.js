(()=>{
  'use strict';

  const VERSION='1.6.4';
  const PROCEDURE_KEY='orion_aesthetic_procedure_v145';
  const CONTEXT_KEY='orion_aesthetic_clinical_context_v147';
  const SETTINGS_KEY='orion_aesthetic_v160_settings';
  const MODEL_KEY='orion_aesthetic_model_v164';
  const $=id=>document.getElementById(id);

  const MODELS={
    woman:{
      label:'Mujer',
      source:()=>window.ORION_ANATOMY_ATLAS_FEMALE||$('atlasImage')?.src||'',
      thumb:'url("https://images.pexels.com/photos/36763373/pexels-photo-36763373.jpeg?auto=compress&cs=tinysrgb&w=220")'
    },
    man:{
      label:'Hombre',
      source:()=> 'https://images.pexels.com/photos/32758452/pexels-photo-32758452.jpeg?auto=compress&cs=tinysrgb&w=1200',
      thumb:'url("https://images.pexels.com/photos/32758452/pexels-photo-32758452.jpeg?auto=compress&cs=tinysrgb&w=220")'
    }
  };

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

  const HISTORY={
    allergy:'Alergia al producto, anestésico o excipiente',
    infection:'Infección, lesión cutánea o inflamación activa',
    pregnancy:'Embarazo o lactancia',
    neuromuscular:'Enfermedad neuromuscular',
    anticoagulant:'Anticoagulantes, antiagregantes o tendencia hemorrágica',
    autoimmune:'Enfermedad autoinmune o inmunosupresión',
    priorEvent:'Complicación estética previa',
    surgeryScar:'Cirugía, implante, relleno previo o cicatriz relevante'
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
  function selectedModel(){return sessionStorage.getItem(MODEL_KEY)==='man'?'man':'woman';}

  function setModel(model,notify=true){
    const resolved=MODELS[model]?model:'woman';
    const image=$('atlasImage');
    if(!image)return;

    sessionStorage.setItem(MODEL_KEY,resolved);
    document.documentElement.dataset.oaModel=resolved;
    image.src=MODELS[resolved].source();
    image.alt=`Modelo anatómico facial ${MODELS[resolved].label.toLowerCase()}`;
    image.style.objectPosition='center top';

    document.querySelectorAll('[data-oa-v164-model]').forEach(button=>{
      const active=button.dataset.oaV164Model===resolved;
      button.classList.toggle('active',active);
      button.setAttribute('aria-pressed',String(active));
    });

    const finalImage=document.querySelector('#oaV160FinalAtlas img');
    if(finalImage)finalImage.src=image.src;

    if(notify){
      const toast=$('toast');
      if(toast){
        toast.textContent=`Modelo ${MODELS[resolved].label} activado.`;
        toast.classList.add('show');
        clearTimeout(setModel.toastTimer);
        setModel.toastTimer=setTimeout(()=>toast.classList.remove('show'),1800);
      }
    }
  }

  function ensureModelSelector(){
    if($('oaV164ModelSwitch'))return;
    const zonebar=document.querySelector('.oa-mobile-zonebar');
    const mapHead=document.querySelector('.oa-map-head');
    const anchor=zonebar||mapHead;
    if(!anchor)return;

    const section=document.createElement('section');
    section.id='oaV164ModelSwitch';
    section.className='oa-v164-model-switch';
    section.style.setProperty('--oa-v164-woman-thumb',MODELS.woman.thumb);
    section.style.setProperty('--oa-v164-man-thumb',MODELS.man.thumb);
    section.innerHTML=`
      <span>Modelo anatómico</span>
      <div class="oa-v164-model-buttons" role="group" aria-label="Seleccionar modelo anatómico">
        <button type="button" class="oa-v164-model-button" data-model="woman" data-oa-v164-model="woman">Mujer</button>
        <button type="button" class="oa-v164-model-button" data-model="man" data-oa-v164-model="man">Hombre</button>
      </div>`;

    const note=document.createElement('div');
    note.className='oa-v164-model-note';
    note.textContent='El cambio de modelo conserva los puntos. Ajusta su ubicación a la anatomía individual antes de registrar.';
    anchor.insertAdjacentElement('afterend',note);
    anchor.insertAdjacentElement('afterend',section);

    section.querySelectorAll('[data-oa-v164-model]').forEach(button=>{
      button.addEventListener('click',()=>setModel(button.dataset.oaV164Model));
    });
    setModel(selectedModel(),false);
  }

  function enableFullTouchScroll(){
    document.documentElement.classList.add('oa-v164-touch');
    const targets=[$('atlasShell'),$('atlasTransform'),$('zoneLabelLayer'),$('pointLayer')].filter(Boolean);
    targets.forEach(node=>{
      node.style.setProperty('touch-action','pan-y pinch-zoom','important');
      node.style.setProperty('overscroll-behavior-y','auto','important');
    });
    document.querySelectorAll('.oa-point').forEach(point=>point.style.setProperty('touch-action','pan-y','important'));
  }

  function administeredPoints(state){return (state.points||[]).filter(point=>num(point.administered)>0);}
  function concentration(state){return Math.max(0,num(state.vial?.units))/Math.max(.001,num(state.vial?.dilution));}
  function zoneIndex(state,point){return (state.points||[]).filter(item=>item.zone===point.zone).findIndex(item=>item.id===point.id)+1;}
  function lateralityLabel(value){return{symmetric:'Simétrica',right:'Predominio derecho',left:'Predominio izquierdo',custom:'Personalizada'}[value]||'No especificada';}

  function interventionRisks(kind){
    if(kind==='toxin')return{
      consent:['Dolor, edema, hematoma o sensibilidad local.','Respuesta insuficiente, asimétrica o necesidad de control.','Debilidad temporal de músculos adyacentes, ptosis o modificación transitoria de la expresión.','De manera infrecuente pueden existir síntomas sistémicos que requieren evaluación urgente.'],
      after:['No frotar ni masajear las zonas tratadas durante el periodo indicado por el profesional.','Seguir las instrucciones entregadas sobre ejercicio, calor, cosméticos y otros procedimientos.','Consultar ante debilidad inesperada, alteración visual o dificultad para hablar, deglutir o respirar.']
    };
    if(kind==='hyaluronic'||kind==='combined')return{
      consent:['Dolor, edema, hematoma, sensibilidad, asimetría o irregularidad.','Nódulos, inflamación persistente, infección, migración o necesidad de corrección.','La inyección intravascular accidental puede ocasionar necrosis, alteración visual u otras complicaciones graves.'],
      after:['No comprimir ni manipular la zona salvo indicación profesional.','Contactar de inmediato ante dolor intenso, palidez, piel fría, coloración reticulada, ampollas o cambios visuales.','Los síntomas neurológicos o visuales requieren atención urgente.']
    };
    return{
      consent:['Dolor, edema, hematoma, enrojecimiento, asimetría o respuesta insuficiente.','Infección, inflamación, irregularidad o necesidad de procedimientos adicionales.','Las complicaciones específicas dependen del producto, plano, técnica y zona.'],
      after:['Mantener la zona limpia y seguir las instrucciones específicas.','Consultar ante dolor intenso, inflamación progresiva, secreción, fiebre o cambios inesperados.']
    };
  }

  function riskLevel(ctx){
    const h=ctx.history||{};
    let score={toxin:0,hyaluronic:2,caha:2,plla:2,skinbooster:1,threads:2,prp:1,combined:2,other:1}[ctx.intervention]??1;
    if(h.allergy)score+=3;
    if(h.infection)score+=3;
    if(h.pregnancy)score+=2;
    if(h.neuromuscular)score+=ctx.intervention==='toxin'?3:2;
    if(h.anticoagulant)score+=1;
    if(h.autoimmune)score+=1;
    if(h.priorEvent)score+=2;
    if(h.surgeryScar)score+=1;
    return score>=4?{className:'high',label:'Alto'}:score>=2?{className:'',label:'Moderado'}:{className:'low',label:'Bajo'};
  }

  function selectedHistory(ctx){
    const marked=Object.entries(HISTORY).filter(([key])=>ctx.history?.[key]).map(([,label])=>label);
    if(ctx.historyNotes)marked.push(`Otros: ${ctx.historyNotes}`);
    return marked;
  }

  function item(label,value,wide=false){return`<div class="oa-v164-item${wide?' wide':''}"><span>${esc(label)}</span><strong>${esc(text(value))}</strong></div>`;}
  function list(items){return`<ul class="oa-v164-list">${items.map(value=>`<li>${esc(value)}</li>`).join('')}</ul>`;}
  function header(title,subtitle,code){return`<header class="oa-v164-header"><img src="../../assets/brand/orion-health.png" alt="ORION Health"><div><h1>${esc(title)}</h1><p>${esc(subtitle)}</p></div><div class="oa-v164-code">${esc(code)}<br>V${VERSION}</div></header>`;}
  function footer(page,total){return`<footer class="oa-v164-footer"><span>ORION Health · Documento clínico</span><span>Página ${page} de ${total}</span></footer>`;}
  function page(title,subtitle,code,content,pageNumber,total){return`<section class="oa-v164-page">${header(title,subtitle,code)}${content}${footer(pageNumber,total)}</section>`;}
  function chunk(listValue,size){const result=[];for(let index=0;index<listValue.length;index+=size)result.push(listValue.slice(index,index+size));return result.length?result:[[]];}

  function mapMarkup(state,points){
    const source=$('atlasImage')?.src||MODELS[selectedModel()].source();
    return`<div class="oa-v164-atlas"><img src="${esc(source)}" alt="Mapa final ${MODELS[selectedModel()].label}">${points.map(point=>`<span class="oa-v164-map-point" style="left:${num(point.x)}%;top:${num(point.y)}%"><b>${zoneIndex(state,point)}</b><small>${fmt(point.administered,1)} U</small></span>`).join('')}</div>`;
  }

  function pointRows(state,points,conc){
    return points.map(point=>`<tr><td>${esc(ZONES[point.zone]||point.zone)}</td><td>${zoneIndex(state,point)}</td><td>${esc(point.label||'Punto')}</td><td>${fmt(point.administered,2)} U</td><td>${fmt(conc?num(point.administered)/conc:0,3)} mL</td><td>${esc(point.comment||'')}</td></tr>`).join('');
  }

  function buildLetterReport(){
    const state=procedure();
    const ctx=context();
    const currentSettings=settings();
    const points=administeredPoints(state);
    const conc=concentration(state);
    const administered=points.reduce((sum,point)=>sum+num(point.administered),0);
    const volume=conc?administered/conc:0;
    const remaining=Math.max(0,num(state.vial?.units)-administered);
    const patient=state.patient||{};
    const kind=ctx.intervention||'toxin';
    const risks=interventionRisks(kind);
    const histories=selectedHistory(ctx);
    const risk=riskLevel(ctx);
    const groups=chunk(points,16);
    const totalPages=4+groups.length;
    let pageNumber=1;
    const pages=[];

    const registration=`
      <h2 class="oa-v164-title">Registro clínico del procedimiento</h2>
      <div class="oa-v164-grid">
        ${item('Paciente',patient.name)}${item('RUN / RUT',patient.id)}${item('Fecha',patient.date)}
        ${item('Intervención',INTERVENTIONS[kind]||kind)}${item('Modelo anatómico',MODELS[selectedModel()].label)}${item('Lateralidad',lateralityLabel(currentSettings.laterality))}
        ${item('Indicación / objetivo',ctx.indication,true)}${item('Zonas tratadas',ctx.zones,true)}
        ${item('Técnica / plano',ctx.technique)}${item('Producto / material',ctx.productDetail||state.vial?.product)}${item('Cantidad administrada',ctx.quantity?`${ctx.quantity} ${ctx.unit||''}`:`${fmt(administered,2)} U`)}
        ${item('Comentario técnico',ctx.procedureNotes,true)}${item('Asimetría / lateralidad',currentSettings.lateralityNotes,true)}
      </div>
      <h3 class="oa-v164-subtitle">Producto, vial y cálculo</h3>
      <div class="oa-v164-grid">
        ${item('Producto',state.vial?.product)}${item('Lote',state.vial?.batch)}${item('Vial',state.vial?.units?`${fmt(state.vial.units,1)} U`:'No registrado')}
        ${item('Dilución',state.vial?.dilution?`${fmt(state.vial.dilution,2)} mL`:'No registrada')}${item('Concentración',conc?`${fmt(conc,2)} U/mL`:'No calculada')}${item('Remanente teórico',`${fmt(remaining,2)} U`)}
      </div>
      <h3 class="oa-v164-subtitle">Antecedentes y nivel de precaución</h3>
      <div class="oa-v164-alert ${risk.className}"><strong>Nivel ${risk.label}.</strong> Clasificación documental orientativa; requiere criterio profesional.</div>
      ${list(histories.length?histories:['Sin antecedentes marcados.'])}
      <h3 class="oa-v164-subtitle">Resumen de administración</h3>
      <div class="oa-v164-grid">${item('Puntos administrados',points.length)}${item('Total administrado',`${fmt(administered,2)} U`)}${item('Volumen administrado',`${fmt(volume,3)} mL`)}</div>`;
    pages.push(page('ORION Armonización Orofacial','Informe clínico integrado','ORH-AO-INF-002',registration,pageNumber++,totalPages));

    const mapContent=`
      <h2 class="oa-v164-title">Mapa final y resumen del procedimiento</h2>
      <p class="oa-v164-text">El mapa muestra únicamente los puntos con administración confirmada y su ubicación final.</p>
      <div class="oa-v164-map-layout">
        ${mapMarkup(state,points)}
        <div class="oa-v164-map-summary">
          ${item('Modelo',MODELS[selectedModel()].label)}${item('Puntos',points.length)}
          ${item('Total',`${fmt(administered,2)} U`)}${item('Volumen',`${fmt(volume,3)} mL`)}
          ${item('Concentración',`${fmt(conc,2)} U/mL`)}${item('Lateralidad',lateralityLabel(currentSettings.laterality))}
          ${item('Observación',currentSettings.lateralityNotes,true)}
        </div>
      </div>`;
    pages.push(page('ORION Armonización Orofacial','Mapa clínico final','ORH-AO-MAP-002',mapContent,pageNumber++,totalPages));

    groups.forEach((group,index)=>{
      const tableContent=`
        <h2 class="oa-v164-title">Registro de puntos administrados${groups.length>1?` · Parte ${index+1}`:''}</h2>
        ${group.length?`<table class="oa-v164-table"><thead><tr><th style="width:18%">Zona</th><th style="width:7%">N°</th><th style="width:22%">Etiqueta</th><th style="width:13%">Administrado</th><th style="width:13%">Volumen</th><th>Comentario</th></tr></thead><tbody>${pointRows(state,group,conc)}</tbody></table>`:'<p class="oa-v164-text">No existen puntos administrados confirmados.</p>'}
        <div class="oa-v164-grid" style="margin-top:4mm">${item('Total de puntos',points.length)}${item('Total administrado',`${fmt(administered,2)} U`)}${item('Volumen total',`${fmt(volume,3)} mL`)}</div>`;
      pages.push(page('ORION Armonización Orofacial','Trazabilidad por punto','ORH-AO-REG-002',tableContent,pageNumber++,totalPages));
    });

    const consent=`
      <div class="oa-v164-draft">BORRADOR CLÍNICO: debe ser revisado, explicado y adaptado por el profesional antes de la firma.</div>
      <h2 class="oa-v164-title">Consentimiento informado específico</h2>
      <div class="oa-v164-grid two">${item('Paciente',patient.name)}${item('RUN / RUT',patient.id)}${item('Procedimiento',INTERVENTIONS[kind]||kind)}${item('Fecha',patient.date)}</div>
      <h3 class="oa-v164-subtitle">Objetivo y alcance</h3><p class="oa-v164-text">${esc(text(ctx.indication||'Objetivo clínico-estético explicado durante la evaluación.'))}</p>
      <h3 class="oa-v164-subtitle">Riesgos y efectos posibles</h3>${list(risks.consent)}
      <h3 class="oa-v164-subtitle">Alternativas y decisiones</h3><p class="oa-v164-text">Se explicó la alternativa de no realizar el procedimiento, otras opciones terapéuticas, la posibilidad de resultados parciales o asimétricos y la eventual necesidad de controles o correcciones.</p>
      <h3 class="oa-v164-subtitle">Declaración</h3><p class="oa-v164-text">Declaro haber informado mis antecedentes, haber podido formular preguntas y comprender que no se garantiza un resultado estético específico. Autorizo el procedimiento descrito después de recibir una explicación suficiente.</p>
      <div class="oa-v164-signatures"><div>Firma del paciente</div><div>Firma del profesional</div></div>`;
    pages.push(page('ORION Armonización Orofacial','Consentimiento informado','ORH-AO-CNS-002',consent,pageNumber++,totalPages));

    const aftercare=`
      <div class="oa-v164-draft">DOCUMENTO PARA REVISIÓN PROFESIONAL: adaptar a producto, zona, técnica y protocolo local.</div>
      <h2 class="oa-v164-title">Indicaciones posteriores al procedimiento</h2>
      <div class="oa-v164-grid two">${item('Paciente',patient.name)}${item('Procedimiento',INTERVENTIONS[kind]||kind)}${item('Fecha',patient.date)}${item('Contacto clínico',currentSettings.contact||'Equipo tratante')}</div>
      <h3 class="oa-v164-subtitle">Cuidados e indicaciones</h3>${list(risks.after)}
      <h3 class="oa-v164-subtitle">Evolución y control</h3>${list(['Puede existir sensibilidad, edema, hematoma o asimetría transitoria según el procedimiento.','Cumplir los controles y comunicaciones indicados por el profesional.'])}
      <div class="oa-v164-alert high"><strong>Señales de alarma:</strong> contactar al equipo tratante o acudir a urgencia ante dolor intenso o progresivo, alteración visual, cambios importantes de coloración, dificultad respiratoria, neurológica o cualquier síntoma inesperado relevante.</div>
      <h3 class="oa-v164-subtitle">Observaciones específicas</h3><p class="oa-v164-text">${esc(text(ctx.procedureNotes))}</p>
      <div class="oa-v164-signatures"><div>Recibí y comprendí las indicaciones</div><div>Firma / identificación profesional</div></div>`;
    pages.push(page('ORION Armonización Orofacial','Indicaciones posteriores','ORH-AO-IND-002',aftercare,pageNumber++,totalPages));

    let report=$('oaV164LetterReport');
    if(!report){report=document.createElement('main');report.id='oaV164LetterReport';document.body.append(report);}
    report.innerHTML=pages.join('');
    return report;
  }

  function waitForImages(root,timeout=2200){
    const images=Array.from(root.querySelectorAll('img'));
    return Promise.race([
      Promise.all(images.map(image=>image.complete?Promise.resolve():new Promise(resolve=>{
        image.addEventListener('load',resolve,{once:true});
        image.addEventListener('error',resolve,{once:true});
      }))),
      new Promise(resolve=>setTimeout(resolve,timeout))
    ]);
  }

  async function printLetterReport(){
    const state=procedure();
    const points=administeredPoints(state);
    if(!points.length&&!window.confirm('No existen puntos administrados confirmados. ¿Generar igualmente el informe?'))return;
    const report=buildLetterReport();
    document.body.classList.remove('oa-v162-print-final','oa-v160-print-associated');
    document.body.classList.add('oa-v164-print-letter');
    await waitForImages(report);
    setTimeout(()=>window.print(),80);
  }

  function replacePrintButton(id,label){
    const original=$(id);
    if(!original||original.dataset.oaV164Bound==='1')return;
    const button=original.cloneNode(true);
    button.dataset.oaV164Bound='1';
    button.dataset.oaV162Bound='1';
    button.dataset.oaV153PrintBound='1';
    button.textContent=label;
    button.title='Genera un documento clínico real en tamaño carta; no captura la pantalla.';
    original.replaceWith(button);
    button.addEventListener('click',event=>{
      event.preventDefault();
      event.stopImmediatePropagation();
      printLetterReport();
    },true);
  }

  function updateIdentity(){
    document.documentElement.classList.add('oa-v164-touch');
    document.documentElement.dataset.orionAestheticsVersion=VERSION;
    document.title=`ORION Armonización Orofacial V${VERSION}`;
    document.querySelectorAll('.oa-version').forEach(node=>{node.textContent=`V${VERSION}`;});
  }

  function bind(){
    updateIdentity();
    ensureModelSelector();
    enableFullTouchScroll();
    replacePrintButton('btnPrintTop','Informe clínico / PDF');
    replacePrintButton('btnPrint','Generar informe clínico / PDF');
  }

  function boot(){
    if(!$('atlasShell')||!$('atlasImage')||!document.querySelector('.oa-general-summary')){
      setTimeout(boot,100);
      return;
    }
    bind();
    window.addEventListener('afterprint',()=>document.body.classList.remove('oa-v164-print-letter'));
    const layer=$('pointLayer');
    if(layer)new MutationObserver(()=>requestAnimationFrame(enableFullTouchScroll)).observe(layer,{childList:true});
    new MutationObserver(()=>requestAnimationFrame(bind)).observe(document.body,{subtree:true,childList:true});
  }

  boot();
})();
