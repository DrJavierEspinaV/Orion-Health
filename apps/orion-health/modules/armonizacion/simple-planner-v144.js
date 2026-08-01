(()=>{
  'use strict';

  const $=id=>document.getElementById(id);
  const API=window.ORION_AESTHETIC_V11||window.ORION_AESTHETIC_V12;
  if(!API)return;

  const CONFIG={
    frente:{
      label:'Líneas horizontales de la frente',
      zones:['frente'],points:5,prefix:'F',
      coords:{frente:[[225,120],[265,110],[300,105],[335,110],[375,120]]},
      objective:'Suavización de líneas frontales según evaluación dinámica, posición de cejas y reserva muscular.'
    },
    glabela:{
      label:'Entrecejo / glabela',
      zones:['glabela'],points:5,prefix:'G',
      coords:{glabela:[[260,225],[280,210],[300,230],[320,210],[340,225]]},
      objective:'Tratamiento del patrón glabelar según actividad de corrugadores, prócer y equilibrio frontal.'
    },
    periocular:{
      label:'Patas de gallo / periocular',
      zones:['periocular_d','periocular_i'],points:3,prefix:'P',lateral:true,
      coords:{
        periocular_d:[[160,285],[145,305],[160,325]],
        periocular_i:[[440,285],[455,305],[440,325]]
      },
      objective:'Suavización periocular conservadora, respetando función orbicular, simetría y reborde orbitario.'
    },
    nariz:{
      label:'Bunny lines / nariz',
      zones:['nariz'],points:2,prefix:'N',
      coords:{nariz:[[275,365],[325,365]]},
      objective:'Tratamiento de líneas nasales dinámicas cuando la indicación clínica sea visible y reproducible.'
    },
    sonrisa:{
      label:'Sonrisa gingival / perioral',
      zones:['sonrisa'],points:2,prefix:'S',
      coords:{sonrisa:[[270,455],[330,455]]},
      objective:'Modulación perioral según exposición gingival, movilidad labial, simetría y competencia oral.'
    },
    dao:{
      label:'Descenso comisural / DAO',
      zones:['dao_d','dao_i'],points:1,prefix:'D',lateral:true,
      coords:{dao_d:[[240,520]],dao_i:[[360,520]]},
      objective:'Modulación del descenso comisural según actividad del DAO, lateralidad y balance con mentón.'
    },
    menton:{
      label:'Mentón hiperactivo / piel de naranja',
      zones:['menton'],points:2,prefix:'M',
      coords:{menton:[[280,595],[320,595]]},
      objective:'Tratamiento de hiperactividad mentoniana según competencia labial y balance del tercio inferior.'
    },
    masetero:{
      label:'Maseteros / bruxismo / hipertrofia',
      zones:['masetero_d','masetero_i'],points:3,prefix:'MA',lateral:true,
      coords:{
        masetero_d:[[145,420],[150,455],[155,490]],
        masetero_i:[[455,420],[450,455],[445,490]]
      },
      objective:'Plan funcional o estético masetérico según hipertrofia, dolor, apretamiento y asimetría.'
    },
    platisma:{
      label:'Bandas platismales / cuello',
      zones:['platisma'],points:5,prefix:'PL',
      coords:{platisma:[[240,665],[270,690],[300,700],[330,690],[360,665]]},
      objective:'Planificación de bandas platismales según patrón dinámico, deglución, voz y contorno cervical.'
    }
  };

  const ZONE_LABELS={
    frente:'Frente',glabela:'Glabela',periocular_d:'Periocular derecho',periocular_i:'Periocular izquierdo',
    nariz:'Nariz',sonrisa:'Sonrisa / perioral',dao_d:'DAO derecho',dao_i:'DAO izquierdo',menton:'Mentón',
    masetero_d:'Masetero derecho',masetero_i:'Masetero izquierdo',platisma:'Platisma'
  };

  function num(value){const n=Number.parseFloat(value);return Number.isFinite(n)?n:0;}
  function fmt(value,decimals=2){return Number(value||0).toLocaleString('es-CL',{maximumFractionDigits:decimals});}
  function dispatch(el,type='input'){el?.dispatchEvent(new Event(type,{bubbles:true}));}
  function getPoints(){try{return API.getState?.().points||[];}catch(_){return[];}}

  function setCurrentPoint({label,planned,administered,state}){
    const labelInput=$('pointLabel');
    const plannedInput=$('pointPlanned');
    const adminInput=$('pointAdministered');
    const stateInput=$('pointState');
    if(!plannedInput||!adminInput||!stateInput)return;
    if(labelInput)labelInput.value=label;
    plannedInput.value=String(planned);
    adminInput.value=String(administered);
    stateInput.value=state;
    dispatch(plannedInput,'input');
    dispatch(stateInput,'change');
  }

  function coordinatesFor(config,zone,count){
    const source=config.coords?.[zone]||[[300,380]];
    if(count<=source.length)return source.slice(0,count);
    const result=source.slice();
    const base=source[source.length-1]||[300,380];
    while(result.length<count){
      const index=result.length-source.length+1;
      result.push([base[0]+((index%2)?8:-8)*Math.ceil(index/2),base[1]+6*index]);
    }
    return result;
  }

  function resolvedZones(config){
    if(!config.lateral)return config.zones;
    const side=$('v144Coverage')?.value||'bilateral';
    if(side==='derecha')return [config.zones[0]];
    if(side==='izquierda')return [config.zones[1]];
    return config.zones;
  }

  function updatePreview(){
    const config=CONFIG[$('v144Indication')?.value]||CONFIG.glabela;
    const zones=resolvedZones(config);
    const pointsPerZone=Math.max(1,Math.min(12,Math.round(num($('v144Points')?.value)||config.points)));
    const unitsPerZone=Math.max(0,num($('v144UnitsZone')?.value));
    const totalPoints=zones.length*pointsPerZone;
    const totalUnits=zones.length*unitsPerZone;
    const unitsPerPoint=pointsPerZone?unitsPerZone/pointsPerZone:0;
    if($('v144PreviewZones'))$('v144PreviewZones').textContent=String(zones.length);
    if($('v144PreviewPoints'))$('v144PreviewPoints').textContent=String(totalPoints);
    if($('v144PreviewDose'))$('v144PreviewDose').textContent=unitsPerZone>0?`${fmt(totalUnits,2)} U · ${fmt(unitsPerPoint,2)} U/punto`:'Definir unidades';
    const coverage=$('v144Coverage');
    if(coverage){
      coverage.disabled=!config.lateral;
      if(!config.lateral)coverage.value='unica';
      else if(coverage.value==='unica')coverage.value='bilateral';
    }
    const indication=$('v14Indication');
    if(indication&&!indication.dataset.v144Touched)indication.value=config.objective;
  }

  function refreshV14View(lastZone){
    const zoneNode=document.querySelector(`.g-zone[data-zone="${lastZone}"]`);
    zoneNode?.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,view:window}));
    dispatch($('v14Dilution'),'input');
    syncTableAndTotals();
  }

  function syncTableAndTotals(){
    const points=getPoints();
    const calculation=API.calculation?.()||{};
    const concentration=num(calculation.concentration);
    const tbody=$('v14TableBody');
    if(tbody){
      if(!points.length){
        tbody.innerHTML='<tr><td colspan="7" style="text-align:center;color:#627d98;padding:18px">Aún no hay puntos registrados. Usa el planificador simplificado para crear el plan.</td></tr>';
      }else{
        tbody.innerHTML=points.map((point,index)=>{
          const planned=num(point.planned);
          const administered=num(point.administered);
          const volume=concentration>0?administered/concentration:0;
          const state=point.state==='administered'?'Administrado':point.state==='omitted'?'Omitido':'Planificado';
          return `<tr><td data-label="Zona">${ZONE_LABELS[point.zone]||point.zone||'—'}</td><td data-label="Punto">${index+1}</td><td data-label="Etiqueta">${point.label||'—'}</td><td data-label="Plan">${fmt(planned,2)} U</td><td data-label="Administrado">${fmt(administered,2)} U</td><td data-label="Volumen real">${fmt(volume,3)} mL</td><td data-label="Estado">${state}</td></tr>`;
        }).join('');
      }
    }
    const planned=points.reduce((sum,p)=>sum+num(p.planned),0);
    const administered=points.reduce((sum,p)=>sum+num(p.administered),0);
    const administeredMl=concentration>0?administered/concentration:0;
    const zones=new Set(points.map(p=>p.zone).filter(Boolean)).size;
    const pairs={
      v14ZonesUsed:String(zones),v14ZonesUsed2:String(zones),v14TotalPoints:String(points.length),
      v14SummaryPlan:`${fmt(planned,2)} U`,v14MiniPlan:`${fmt(planned,2)} U`,
      v14SummaryAdmin:`${fmt(administered,2)} U`,v14MiniAdmin:`${fmt(administered,2)} U`,
      v14SummaryVol:`${fmt(administeredMl,3)} mL`,v14MiniVol:`${fmt(administeredMl,3)} mL`
    };
    Object.entries(pairs).forEach(([id,text])=>{if($(id))$(id).textContent=text;});
  }

  function addClinicalPlan(mode){
    const feedback=$('v144Feedback');
    const config=CONFIG[$('v144Indication')?.value]||CONFIG.glabela;
    const zones=resolvedZones(config);
    const pointsPerZone=Math.max(1,Math.min(12,Math.round(num($('v144Points')?.value)||config.points)));
    const unitsPerZone=Math.max(0,num($('v144UnitsZone')?.value));
    if(unitsPerZone<=0){
      feedback.textContent='Define las unidades totales por zona antes de agregar el plan.';
      feedback.className='v144-feedback error';
      $('v144UnitsZone')?.focus();
      return;
    }
    const unitsPerPoint=unitsPerZone/pointsPerZone;
    let sequence=1;
    let lastZone=zones[0];
    zones.forEach(zone=>{
      API.selectZone?.(zone);
      const coordinates=coordinatesFor(config,zone,pointsPerZone);
      coordinates.forEach(([x,y],index)=>{
        const side=zone.endsWith('_d')?'D':zone.endsWith('_i')?'I':'';
        const label=`${config.prefix}${side}-${String(index+1).padStart(2,'0')}`;
        API.addPoint?.(zone,x,y,label);
        setCurrentPoint({
          label,
          planned:unitsPerPoint,
          administered:mode==='administered'?unitsPerPoint:0,
          state:mode==='administered'?'administered':'planned'
        });
        sequence+=1;
      });
      lastZone=zone;
    });
    refreshV14View(lastZone);
    const total=unitsPerZone*zones.length;
    feedback.textContent=mode==='administered'
      ?`Administración registrada: ${zones.length} zona(s), ${zones.length*pointsPerZone} puntos y ${fmt(total,2)} U.`
      :`Plan agregado: ${zones.length} zona(s), ${zones.length*pointsPerZone} puntos y ${fmt(total,2)} U planificadas.`;
    feedback.className='v144-feedback';
    document.querySelector('.v14-table-card')?.scrollIntoView({behavior:'smooth',block:'start'});
  }

  function buildPlanner(){
    const center=document.querySelector('.v14-center');
    if(!center||$('v144Planner'))return;

    const right=document.querySelector('.v14-right');
    const rightCards=right?Array.from(right.children):[];
    const calculator=rightCards.find(node=>node.classList?.contains('v14-card'));
    if(calculator){calculator.classList.add('v144-calculator-card');center.prepend(calculator);}

    const planner=document.createElement('section');
    planner.id='v144Planner';
    planner.className='v144-planner';
    planner.innerHTML=`
      <div class="v144-planner-head">
        <div><h3>Planificación rápida por indicación</h3><p>Selecciona el objetivo, define las unidades totales por zona y ORION distribuye los puntos. Las unidades no se prescriben automáticamente.</p></div>
        <span class="v144-step-badge">Flujo simplificado</span>
      </div>
      <div class="v144-planner-grid">
        <div class="v144-field"><label for="v144Indication">Indicación clínica</label><select id="v144Indication">${Object.entries(CONFIG).map(([key,item])=>`<option value="${key}">${item.label}</option>`).join('')}</select></div>
        <div class="v144-field"><label for="v144Coverage">Cobertura</label><select id="v144Coverage"><option value="bilateral">Bilateral</option><option value="derecha">Solo derecha</option><option value="izquierda">Solo izquierda</option><option value="unica">Zona única</option></select></div>
        <div class="v144-field"><label for="v144Points">Puntos por zona</label><input id="v144Points" type="number" min="1" max="12" step="1" value="5"></div>
        <div class="v144-field"><label for="v144UnitsZone">U totales por zona/lado</label><input id="v144UnitsZone" type="number" min="0" step="0.1" inputmode="decimal" placeholder="Definir"></div>
      </div>
      <div class="v144-plan-preview">
        <div class="v144-preview-item"><span>Zonas</span><strong id="v144PreviewZones">1</strong></div>
        <div class="v144-preview-item"><span>Puntos totales</span><strong id="v144PreviewPoints">5</strong></div>
        <div class="v144-preview-item"><span>Distribución</span><strong id="v144PreviewDose">Definir unidades</strong></div>
      </div>
      <div class="v144-actions">
        <button type="button" class="v144-plan-btn" id="v144AddPlanned">Agregar como planificado</button>
        <button type="button" class="v144-admin-btn" id="v144AddAdministered">Registrar como administrado</button>
      </div>
      <p class="v144-helper"><strong>Criterio:</strong> ORION automatiza la distribución documental; la indicación, las unidades y cualquier modificación permanecen bajo decisión profesional.</p>
      <div class="v144-feedback" id="v144Feedback" aria-live="polite"></div>`;

    const calculatorCard=center.querySelector('.v144-calculator-card');
    calculatorCard?.insertAdjacentElement('afterend',planner);

    $('v144Indication')?.addEventListener('change',()=>{
      const config=CONFIG[$('v144Indication').value];
      $('v144Points').value=String(config.points);
      $('v144UnitsZone').value='';
      updatePreview();
      API.selectZone?.(config.zones[0]);
      const group=document.querySelector(`.g-zone[data-zone="${config.zones[0]}"]`);
      group?.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,view:window}));
    });
    ['v144Coverage','v144Points','v144UnitsZone'].forEach(id=>$(id)?.addEventListener('input',updatePreview));
    $('v144Coverage')?.addEventListener('change',updatePreview);
    $('v144AddPlanned')?.addEventListener('click',()=>addClinicalPlan('planned'));
    $('v144AddAdministered')?.addEventListener('click',()=>addClinicalPlan('administered'));
    $('v14Indication')?.addEventListener('input',event=>{event.currentTarget.dataset.v144Touched='true';});
    updatePreview();
  }

  function buildOptionalMap(){
    const center=document.querySelector('.v14-center');
    const stage=center?.querySelector('.v14-portrait-stage');
    const tools=center?.querySelector('.v14-center-tools');
    if(!center||!stage||!tools||stage.closest('.v144-map-card'))return;
    const card=document.createElement('section');
    card.className='v144-map-card';
    card.innerHTML=`<button type="button" class="v144-map-toggle" aria-expanded="false"><span><strong>Mapa anatómico opcional</strong><span>Úsalo solo para revisar o ajustar visualmente la distribución.</span></span><b>⌄</b></button><div class="v144-map-body"><div class="v144-map-options"><button type="button" data-model="woman">Modelo mujer</button><button type="button" data-model="man">Modelo hombre</button><button type="button" data-study="both">Activas + pasivas</button></div></div>`;
    const body=card.querySelector('.v144-map-body');
    stage.parentNode.insertBefore(card,stage);
    body.append(stage,tools);
    card.querySelector('.v144-map-toggle').addEventListener('click',event=>{
      const open=card.classList.toggle('open');
      event.currentTarget.setAttribute('aria-expanded',String(open));
    });
    card.querySelector('[data-model="woman"]')?.addEventListener('click',()=>$('v14Model_woman')?.click());
    card.querySelector('[data-model="man"]')?.addEventListener('click',()=>$('v14Model_man')?.click());
    card.querySelector('[data-study="both"]')?.addEventListener('click',()=>$('v14Study_both')?.click());
  }

  function collapseClinicalAssistant(){
    const right=document.querySelector('.v14-right');
    if(!right)return;
    const assistant=Array.from(right.children).find(node=>node.classList?.contains('v14-card')&&node.querySelector('.v14-zone-header'));
    if(!assistant||assistant.classList.contains('v144-clinical-optional'))return;
    const heading=assistant.querySelector('h3');
    if(!heading)return;
    assistant.classList.add('v144-clinical-optional');
    const body=document.createElement('div');
    body.className='v144-clinical-body';
    while(heading.nextSibling)body.append(heading.nextSibling);
    const toggle=document.createElement('button');
    toggle.type='button';
    toggle.className='v144-clinical-toggle';
    toggle.setAttribute('aria-expanded','false');
    toggle.innerHTML='<span><strong>Evaluación clínica detallada</strong><br><small>Hallazgos, cautelas, referencias y notas de la zona</small></span><b>⌄</b>';
    heading.replaceWith(toggle);
    assistant.append(body);
    toggle.addEventListener('click',()=>{
      const open=assistant.classList.toggle('open');
      toggle.setAttribute('aria-expanded',String(open));
    });
  }

  function addMapOptionsStyle(){
    if($('v144InlineStyle'))return;
    const style=document.createElement('style');
    style.id='v144InlineStyle';
    style.textContent=`.v144-map-options{display:flex;gap:7px;flex-wrap:wrap;max-width:540px;margin:0 auto 8px}.v144-map-options button{border:1px solid #cbd9e8;background:#fff;color:#214a73;border-radius:9px;padding:8px 10px;font-size:11px;font-weight:800;cursor:pointer}`;
    document.head.append(style);
  }

  function boot(){
    if(!$('v14Mount')||!document.querySelector('.v14-center')){setTimeout(boot,120);return;}
    document.documentElement.classList.add('v144-simple-flow');
    buildPlanner();
    buildOptionalMap();
    collapseClinicalAssistant();
    addMapOptionsStyle();
    syncTableAndTotals();
  }

  boot();
})();
