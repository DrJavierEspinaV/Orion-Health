(()=>{
  'use strict';

  const VERSION='1.6.5';
  const PROCEDURE_KEY='orion_aesthetic_procedure_v145';
  const CONTEXT_KEY='orion_aesthetic_clinical_context_v147';
  const SETTINGS_KEY='orion_aesthetic_v160_settings';
  const MODEL_KEY='orion_aesthetic_model_v165';
  const SHARED_ATLAS='https://images.pexels.com/photos/32758452/pexels-photo-32758452.jpeg?auto=compress&cs=tinysrgb&w=1200';
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
  const HISTORY={
    allergy:'Alergia al producto, anestésico o excipiente',infection:'Infección, lesión cutánea o inflamación activa',
    pregnancy:'Embarazo o lactancia',neuromuscular:'Enfermedad neuromuscular',
    anticoagulant:'Anticoagulantes, antiagregantes o tendencia hemorrágica',autoimmune:'Enfermedad autoinmune o inmunosupresión',
    priorEvent:'Complicación estética previa',surgeryScar:'Cirugía, implante, relleno previo o cicatriz relevante'
  };

  const num=value=>{const n=Number.parseFloat(String(value??'').replace(',','.'));return Number.isFinite(n)?n:0;};
  const fmt=(value,decimals=1)=>num(value).toLocaleString('es-CL',{minimumFractionDigits:decimals,maximumFractionDigits:decimals});
  const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const text=value=>String(value??'').trim()||'No registrado';
  const load=(key,fallback)=>{try{return JSON.parse(sessionStorage.getItem(key)||'null')??fallback;}catch(_){return fallback;}};
  const model=()=>sessionStorage.getItem(MODEL_KEY)==='man'?'man':'woman';
  const modelLabel=()=>model()==='man'?'Hombre':'Mujer';

  function setModel(next,notify=true){
    const selected=next==='man'?'man':'woman';
    sessionStorage.setItem(MODEL_KEY,selected);
    document.documentElement.dataset.oaModelV165=selected;
    document.documentElement.dataset.oaModel=selected;
    const image=$('atlasImage');
    if(image){
      image.src=SHARED_ATLAS;
      image.alt=`Atlas anatómico facial · modelo ${selected==='man'?'masculino':'femenino'}`;
      image.style.objectFit='cover';
      image.style.objectPosition='center top';
    }
    document.querySelectorAll('[data-oa-v164-model]').forEach(button=>{
      const active=button.dataset.oaV164Model===selected;
      button.classList.toggle('active',active);
      button.setAttribute('aria-pressed',String(active));
    });
    if(notify&&$('toast')){
      $('toast').textContent=`Modelo ${selected==='man'?'Hombre':'Mujer'} activado. Los puntos se mantienen y deben ajustarse a la anatomía individual.`;
      $('toast').classList.add('show');
      clearTimeout(setModel.timer);
      setModel.timer=setTimeout(()=>$('toast')?.classList.remove('show'),2300);
    }
  }

  function interceptModelButtons(){
    document.addEventListener('click',event=>{
      const button=event.target.closest('[data-oa-v164-model]');
      if(!button)return;
      event.preventDefault();
      event.stopImmediatePropagation();
      setModel(button.dataset.oaV164Model,true);
    },true);
    setModel(model(),false);
  }

  function procedure(){return load(PROCEDURE_KEY,{patient:{},vial:{},points:[]});}
  function context(){return load(CONTEXT_KEY,{});}
  function settings(){return {...{laterality:'symmetric',lateralityNotes:'',contact:''},...load(SETTINGS_KEY,{})};}
  function administered(state){return (state.points||[]).filter(point=>num(point.administered)>0);}
  function concentration(state){return Math.max(0,num(state.vial?.units))/Math.max(.001,num(state.vial?.dilution));}
  function zoneIndex(state,point){return (state.points||[]).filter(item=>item.zone===point.zone).findIndex(item=>item.id===point.id)+1;}
  function laterality(value){return{symmetric:'Simétrica',right:'Predominio derecho',left:'Predominio izquierdo',custom:'Personalizada'}[value]||'No especificada';}
  function selectedHistory(ctx){const values=Object.entries(HISTORY).filter(([key])=>ctx.history?.[key]).map(([,label])=>label);if(ctx.historyNotes)values.push(`Otros: ${ctx.historyNotes}`);return values;}
  function riskItems(kind){
    if(kind==='toxin')return{
      consent:['Dolor, edema, hematoma o sensibilidad local.','Respuesta insuficiente, asimétrica o necesidad de control.','Debilidad temporal de músculos adyacentes, ptosis o modificación transitoria de la expresión.','Síntomas sistémicos infrecuentes que requieren evaluación urgente.'],
      after:['No frotar ni masajear las zonas tratadas durante el periodo indicado.','Seguir las instrucciones sobre ejercicio, calor, cosméticos y otros procedimientos.','Consultar ante debilidad inesperada, alteración visual o dificultad para hablar, deglutir o respirar.']
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

  function item(label,value,wide=false){return `<div class="item${wide?' wide':''}"><span>${esc(label)}</span><strong>${esc(text(value))}</strong></div>`;}
  function list(values){return `<ul>${values.map(value=>`<li>${esc(value)}</li>`).join('')}</ul>`;}
  function page(title,subtitle,code,body,pageNumber,total){
    return `<section class="page"><header><img src="../../assets/brand/orion-health.png" alt="ORION Health"><div><h1>${esc(title)}</h1><p>${esc(subtitle)}</p></div><aside>${esc(code)}<br>V${VERSION}</aside></header>${body}<footer><span>ORION Health · Documento clínico</span><span>Página ${pageNumber} de ${total}</span></footer></section>`;
  }
  function chunk(values,size){const result=[];for(let i=0;i<values.length;i+=size)result.push(values.slice(i,i+size));return result.length?result:[[]];}

  function reportHTML(){
    const state=procedure();
    const ctx=context();
    const cfg=settings();
    const points=administered(state);
    const conc=concentration(state);
    const totalUnits=points.reduce((sum,point)=>sum+num(point.administered),0);
    const totalVolume=conc?totalUnits/conc:0;
    const patient=state.patient||{};
    const kind=ctx.intervention||'toxin';
    const risks=riskItems(kind);
    const groups=chunk(points,16);
    const totalPages=4+groups.length;
    let pageNumber=1;
    const pages=[];

    const registration=`<h2>Registro clínico del procedimiento</h2><div class="grid">
      ${item('Paciente',patient.name)}${item('RUN / RUT',patient.id)}${item('Fecha',patient.date)}
      ${item('Intervención',INTERVENTIONS[kind]||kind)}${item('Modelo anatómico',modelLabel())}${item('Lateralidad',laterality(cfg.laterality))}
      ${item('Indicación / objetivo',ctx.indication,true)}${item('Zonas tratadas',ctx.zones,true)}
      ${item('Técnica / plano',ctx.technique)}${item('Producto / material',ctx.productDetail||state.vial?.product)}${item('Cantidad administrada',`${fmt(totalUnits,2)} U`)}
      ${item('Comentario técnico',ctx.procedureNotes,true)}${item('Asimetría / lateralidad',cfg.lateralityNotes,true)}</div>
      <h3>Producto, vial y cálculo</h3><div class="grid">
      ${item('Producto',state.vial?.product)}${item('Lote',state.vial?.batch)}${item('Vial',state.vial?.units?`${fmt(state.vial.units,1)} U`:'No registrado')}
      ${item('Dilución',state.vial?.dilution?`${fmt(state.vial.dilution,2)} mL`:'No registrada')}${item('Concentración',conc?`${fmt(conc,2)} U/mL`:'No calculada')}${item('Remanente teórico',`${fmt(Math.max(0,num(state.vial?.units)-totalUnits),2)} U`)}</div>
      <h3>Antecedentes y precaución documental</h3>${list(selectedHistory(ctx).length?selectedHistory(ctx):['Sin antecedentes marcados.'])}
      <h3>Resumen de administración</h3><div class="grid">${item('Puntos administrados',points.length)}${item('Total administrado',`${fmt(totalUnits,2)} U`)}${item('Volumen administrado',`${fmt(totalVolume,3)} mL`)}</div>`;
    pages.push(page('ORION Armonización Orofacial','Informe clínico integrado','ORH-AO-INF-003',registration,pageNumber++,totalPages));

    const mapPoints=points.map(point=>`<span style="left:${num(point.x)}%;top:${num(point.y)}%"><b>${zoneIndex(state,point)}</b><small>${fmt(point.administered,1)} U</small></span>`).join('');
    const mapBody=`<h2>Mapa final del procedimiento</h2><p class="lead">Representa únicamente los puntos con administración confirmada.</p><div class="map-layout"><div class="atlas ${model()}"><img src="${esc(SHARED_ATLAS)}" alt="Atlas ${esc(modelLabel())}">${mapPoints}</div><div class="map-summary">${item('Modelo',modelLabel())}${item('Puntos',points.length)}${item('Total',`${fmt(totalUnits,2)} U`)}${item('Volumen',`${fmt(totalVolume,3)} mL`)}${item('Concentración',`${fmt(conc,2)} U/mL`)}${item('Lateralidad',laterality(cfg.laterality))}${item('Observación',cfg.lateralityNotes,true)}</div></div>`;
    pages.push(page('ORION Armonización Orofacial','Mapa clínico final','ORH-AO-MAP-003',mapBody,pageNumber++,totalPages));

    groups.forEach((group,index)=>{
      const rows=group.map(point=>`<tr><td>${esc(ZONES[point.zone]||point.zone)}</td><td>${zoneIndex(state,point)}</td><td>${esc(point.label||'Punto')}</td><td>${fmt(point.administered,2)} U</td><td>${fmt(conc?num(point.administered)/conc:0,3)} mL</td><td>${esc(point.comment||'')}</td></tr>`).join('');
      const body=`<h2>Registro de puntos administrados${groups.length>1?` · Parte ${index+1}`:''}</h2>${group.length?`<table><thead><tr><th>Zona</th><th>N°</th><th>Etiqueta</th><th>Administrado</th><th>Volumen</th><th>Comentario</th></tr></thead><tbody>${rows}</tbody></table>`:'<p>No existen puntos administrados confirmados.</p>'}<div class="grid totals">${item('Total de puntos',points.length)}${item('Total administrado',`${fmt(totalUnits,2)} U`)}${item('Volumen total',`${fmt(totalVolume,3)} mL`)}</div>`;
      pages.push(page('ORION Armonización Orofacial','Trazabilidad por punto','ORH-AO-REG-003',body,pageNumber++,totalPages));
    });

    const consent=`<div class="draft">BORRADOR CLÍNICO: revisar, explicar y adaptar antes de la firma.</div><h2>Consentimiento informado específico</h2><div class="grid two">${item('Paciente',patient.name)}${item('RUN / RUT',patient.id)}${item('Procedimiento',INTERVENTIONS[kind]||kind)}${item('Fecha',patient.date)}</div><h3>Objetivo y alcance</h3><p>${esc(text(ctx.indication||'Objetivo clínico-estético explicado durante la evaluación.'))}</p><h3>Riesgos y efectos posibles</h3>${list(risks.consent)}<h3>Alternativas y declaración</h3><p>Se explicó la alternativa de no realizar el procedimiento, otras opciones terapéuticas y la posibilidad de resultados parciales, asimétricos o de requerir controles. Declaro haber informado mis antecedentes, haber podido formular preguntas y comprender la información recibida.</p><div class="signatures"><div>Firma del paciente</div><div>Firma del profesional</div></div>`;
    pages.push(page('ORION Armonización Orofacial','Consentimiento informado','ORH-AO-CNS-003',consent,pageNumber++,totalPages));

    const aftercare=`<div class="draft">DOCUMENTO PARA REVISIÓN PROFESIONAL: adaptar a producto, zona, técnica y protocolo local.</div><h2>Indicaciones posteriores</h2><div class="grid two">${item('Paciente',patient.name)}${item('Procedimiento',INTERVENTIONS[kind]||kind)}${item('Fecha',patient.date)}${item('Contacto clínico',cfg.contact||'Equipo tratante')}</div><h3>Cuidados e indicaciones</h3>${list(risks.after)}<h3>Señales de alarma</h3><p class="alert">Contactar al equipo tratante o acudir a urgencia ante dolor intenso o progresivo, alteración visual, cambios importantes de coloración, dificultad respiratoria o neurológica, o cualquier síntoma inesperado relevante.</p><h3>Observaciones específicas</h3><p>${esc(text(ctx.procedureNotes))}</p><div class="signatures"><div>Recibí y comprendí las indicaciones</div><div>Firma / identificación profesional</div></div>`;
    pages.push(page('ORION Armonización Orofacial','Indicaciones posteriores','ORH-AO-IND-003',aftercare,pageNumber++,totalPages));

    const css=`@page{size:Letter portrait;margin:0}*{box-sizing:border-box}html,body{margin:0;padding:0;background:#fff;color:#18364f;font-family:Arial,Helvetica,sans-serif;font-size:9.5pt;line-height:1.34}.page{position:relative;width:215.9mm;height:279.4mm;padding:12mm 13mm 15mm;page-break-after:always;overflow:hidden;background:#fff}.page:last-child{page-break-after:auto}.page>header{display:grid;grid-template-columns:22mm 1fr 34mm;gap:5mm;align-items:center;padding-bottom:4mm;border-bottom:1.2pt solid #123f6b}.page>header img{width:20mm;height:20mm;object-fit:contain}.page>header h1{margin:0;color:#0d3158;font-size:14pt}.page>header p{margin:1mm 0 0;color:#5d7186;font-size:8.5pt}.page>header aside{text-align:right;color:#45627d;font-size:7.5pt;font-weight:700}.page>footer{position:absolute;left:13mm;right:13mm;bottom:6mm;display:flex;justify-content:space-between;border-top:.5pt solid #c8d4df;padding-top:2mm;color:#60768c;font-size:7pt}h2{margin:6mm 0 3mm;color:#113f6d;font-size:13pt}h3{margin:4mm 0 2mm;color:#214f79;font-size:10pt}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:2.5mm}.grid.two{grid-template-columns:1fr 1fr}.item{min-height:15mm;padding:2.5mm;border:.6pt solid #d6e1eb;border-radius:2.5mm;background:#f9fbfd}.item.wide{grid-column:1/-1}.item span{display:block;margin-bottom:1mm;color:#687f94;font-size:7pt;font-weight:700;text-transform:uppercase}.item strong{display:block;color:#173a5f;font-size:8.7pt}.lead{color:#60768c}.map-layout{display:grid;grid-template-columns:112mm 1fr;gap:7mm;align-items:start}.atlas{position:relative;width:112mm;height:168mm;overflow:hidden;border:.7pt solid #c7d5e2;border-radius:3mm;background:#f2ece7}.atlas img{width:100%;height:100%;object-fit:cover;object-position:center top}.atlas.woman img{filter:brightness(1.05) saturate(.94) contrast(.98)}.atlas.man img{filter:brightness(.98) saturate(1.04) contrast(1.05)}.atlas span{position:absolute;transform:translate(-50%,-50%);display:grid;place-items:center;width:7mm;height:7mm;border:1.2pt solid #159d66;border-radius:50%;background:#fff;color:#0d4b76;font-size:6.5pt;font-weight:800}.atlas span small{position:absolute;top:7.2mm;white-space:nowrap;padding:.4mm 1mm;border-radius:1mm;background:#fff;color:#244d72;font-size:5.5pt}.map-summary{display:grid;gap:2.5mm}.map-summary .item{min-height:13mm}table{width:100%;border-collapse:collapse;table-layout:fixed;font-size:7.3pt}th,td{padding:2mm;border:.5pt solid #cfdbe6;vertical-align:top;overflow-wrap:anywhere}th{background:#eaf2f9;color:#143e66;text-align:left}.totals{margin-top:4mm}.draft{padding:2.5mm;border:.7pt solid #e3b14a;background:#fff8e8;color:#735a23;font-size:8pt;font-weight:700}.alert{padding:3mm;border-left:2mm solid #c94444;background:#fff0f0}.signatures{display:grid;grid-template-columns:1fr 1fr;gap:14mm;margin-top:20mm}.signatures div{padding-top:3mm;border-top:.6pt solid #7890a6;text-align:center;color:#405e78}ul{margin:1mm 0 0;padding-left:5mm}li{margin-bottom:1.5mm}@media screen{body{background:#dfe6ed;padding:10mm}.page{margin:0 auto 8mm;box-shadow:0 3mm 12mm rgba(15,41,66,.18)}}`;

    return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ORION · Informe clínico</title><style>${css}</style></head><body>${pages.join('')}</body></html>`;
  }

  function openLetterReport(){
    const state=procedure();
    if(!administered(state).length&&!window.confirm('No existen puntos administrados confirmados. ¿Generar igualmente el informe?'))return;
    const popup=window.open('','_blank');
    if(!popup){window.alert('El navegador bloqueó la ventana del informe. Habilita ventanas emergentes para generar el PDF.');return;}
    popup.document.open();
    popup.document.write(reportHTML());
    popup.document.close();
    const print=()=>{try{popup.focus();popup.print();}catch(error){console.error(error);}};
    if(popup.document.readyState==='complete')setTimeout(print,500);
    else popup.addEventListener('load',()=>setTimeout(print,500),{once:true});
  }

  function replacePrintButton(id,label){
    const original=$(id);
    if(!original||original.dataset.oaV165Bound==='1')return;
    const button=original.cloneNode(true);
    button.dataset.oaV165Bound='1';
    button.textContent=label;
    button.title='Abre un documento clínico tamaño carta independiente de la pantalla.';
    original.replaceWith(button);
    button.addEventListener('click',event=>{event.preventDefault();event.stopImmediatePropagation();openLetterReport();},true);
  }

  function ensureNote(){
    const documents=$('oaV160Documents');
    if(documents&&!$('oaV165OutputNote')){
      const note=document.createElement('p');
      note.id='oaV165OutputNote';
      note.className='oa-v165-output-note';
      note.innerHTML='<strong>PDF carta real:</strong> se abre un documento independiente con registro, mapa, tabla, consentimiento e indicaciones. No captura la pantalla del teléfono.';
      documents.append(note);
    }
  }

  function bind(){
    document.documentElement.dataset.orionAestheticsVersion=VERSION;
    document.title=`ORION Armonización Orofacial V${VERSION}`;
    document.querySelectorAll('.oa-version').forEach(node=>{node.textContent=`V${VERSION}`;});
    replacePrintButton('btnPrintTop','Informe clínico / PDF');
    replacePrintButton('btnPrint','Generar informe clínico / PDF');
    ensureNote();
  }

  function boot(){
    if(!$('atlasImage')||!$('pointLayer')){setTimeout(boot,100);return;}
    interceptModelButtons();
    bind();
    new MutationObserver(()=>requestAnimationFrame(bind)).observe(document.body,{subtree:true,childList:true});
  }

  boot();
})();
