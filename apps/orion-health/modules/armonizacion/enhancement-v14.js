(()=>{
  'use strict';
  const API=window.ORION_AESTHETIC_V11||window.ORION_AESTHETIC_V12;
  if(!API){console.error('ORION V1.4: no se encontró la API base');return;}
  const $=id=>document.getElementById(id);
  const STORE='orion_armonizacion_v14';
  const PHOTOS={
    woman:'https://images.pexels.com/photos/14599151/pexels-photo-14599151.jpeg?auto=compress&cs=tinysrgb&w=1200',
    man:'https://images.pexels.com/photos/14599188/pexels-photo-14599188.jpeg?auto=compress&cs=tinysrgb&w=1200'
  };
  const state={model:'woman',study:'both',zone:'glabela',zoom:100,selectedPoint:null};
  const ZONES={
    frente:{label:'Frente',abbr:'F',center:[300,140],shape:'<rect x="190" y="78" width="220" height="96" rx="34"/>',needs:['Líneas horizontales dinámicas','Compensación frontal por glabela','Suavización superior sin caída de ceja'],evaluate:['Actividad del frontal en reposo y contracción','Posición basal y reserva de ceja','Asimetrías o compensación unilateral'],caution:['Cautela en ceja baja o dermatochalasis','Evitar sobrerrelajación lateral'],women:['Suavizar manteniendo feminidad y arco natural de ceja.'],men:['Suavizar sin redondear de más la ceja ni aplanar toda la frente.']},
    glabela:{label:'Glabela',abbr:'G',center:[300,222],shape:'<ellipse cx="300" cy="222" rx="56" ry="34"/>',needs:['Entrecejo marcado','Hipertonía corrugador/prócer','Severidad o gesto de enfado'],evaluate:['Patrón de corrugadores, prócer y depresor superciliar','Línea dinámica y estática en reposo','Interacción con frente y cejas'],caution:['Riesgo de ptosis si el patrón no se analiza bien','Evitar desplazar el equilibrio frontal'],women:['Buscar suavización manteniendo naturalidad y evitando depresión de ceja.'],men:['Suavizar sin feminizar ni borrar por completo el gesto masculino.']},
    periocular_d:{label:'Periocular D',abbr:'PD',center:[185,300],shape:'<ellipse cx="185" cy="300" rx="60" ry="54"/>',needs:['Patas de gallo','Arrugas al sonreír','Hipertonía orbicular lateral'],evaluate:['Extensión de líneas al sonreír y en reposo','Calidad cutánea y lateralidad','Posible ojo seco o debilidad orbicular'],caution:['Precaución si existe sequedad ocular o laxitud palpebral','No acercarse excesivamente al reborde orbitario'],women:['Suavizar arrugas manteniendo una mirada fresca y natural.'],men:['Suavizar con criterio conservador, evitando endurecer o vaciar la mirada.']},
    periocular_i:{label:'Periocular I',abbr:'PI',center:[415,300],shape:'<ellipse cx="415" cy="300" rx="60" ry="54"/>',needs:['Patas de gallo','Arrugas al sonreír','Hipertonía orbicular lateral'],evaluate:['Extensión de líneas al sonreír y en reposo','Calidad cutánea y lateralidad','Comparar simetría con lado opuesto'],caution:['Precaución si existe sequedad ocular o laxitud palpebral','No acercarse excesivamente al reborde orbitario'],women:['Suavizar arrugas manteniendo una mirada fresca y natural.'],men:['Suavizar con criterio conservador, evitando endurecer o vaciar la mirada.']},
    nariz:{label:'Nariz',abbr:'N',center:[300,374],shape:'<ellipse cx="300" cy="370" rx="44" ry="74"/>',needs:['Bunny lines','Hipermovilidad nasal','Sinergia nasal con sonrisa'],evaluate:['Arrugas dorsales nasales en expresión','Movilidad al sonreír','Relación con elevadores labiales'],caution:['No sobretratar si la mímica nasal es mínima','Relacionar con sonrisa gingival'],women:['Suavizar las bunny lines sin alterar la expresividad nasal.'],men:['Corregir solo si la indicación es clara y visible dinámicamente.']},
    sonrisa:{label:'Sonrisa / Perioral',abbr:'SP',center:[300,468],shape:'<ellipse cx="300" cy="470" rx="92" ry="44"/>',needs:['Sonrisa gingival','Líneas periorales dinámicas','Hipermovilidad del labio superior'],evaluate:['Exposición gingival al sonreír','Longitud labial en reposo','Competencia oral y simetría'],caution:['Evitar incompetencia oral o alteración del habla','Distinguir si el problema es dentolabial, esquelético o muscular'],women:['Tratar según exposición gingival, manteniendo naturalidad labial.'],men:['Ser más conservador cuando la sonrisa ya es corta o el labio es fino.']},
    dao_d:{label:'DAO D',abbr:'DD',center:[240,528],shape:'<ellipse cx="240" cy="528" rx="42" ry="36"/>',needs:['Comisura descendida','Expresión triste','Hipertonía de DAO'],evaluate:['Descenso comisural en reposo y sonrisa','Relación con marioneta y mentón','Lateralidad'],caution:['Evitar sobrerrelajación o asimetría perioral'],women:['Elevar la comisura sin rigidez ni artificio.'],men:['Suavizar el descenso comisural respetando la expresión basal.']},
    dao_i:{label:'DAO I',abbr:'DI',center:[360,528],shape:'<ellipse cx="360" cy="528" rx="42" ry="36"/>',needs:['Comisura descendida','Expresión triste','Hipertonía de DAO'],evaluate:['Descenso comisural en reposo y sonrisa','Relación con marioneta y mentón','Comparar con lado opuesto'],caution:['Evitar sobrerrelajación o asimetría perioral'],women:['Elevar la comisura sin rigidez ni artificio.'],men:['Suavizar el descenso comisural respetando la expresión basal.']},
    menton:{label:'Mentón',abbr:'M',center:[300,594],shape:'<ellipse cx="300" cy="594" rx="68" ry="46"/>',needs:['Piel de naranja','Hipertonía mentalis','Incompetencia labial funcional leve'],evaluate:['Actividad del mentalis','Pits cutáneos, eversión labial y mentón corto','Balance con DAO y perioral'],caution:['No indicar si el problema principal es estructural y requiere volumen o cirugía'],women:['Suavizar el mentalis y la piel de naranja sin perder naturalidad.'],men:['Disminuir la hiperactividad manteniendo soporte y carácter del mentón.']},
    masetero_d:{label:'Masetero D',abbr:'MD',center:[150,448],shape:'<ellipse cx="152" cy="450" rx="60" ry="98"/>',needs:['Hipertrofia masetérica','Bruxismo / apretamiento','Dolor miofascial','Afinamiento de tercio inferior'],evaluate:['Volumen muscular en reposo y al apretar','Síntomas funcionales','Asimetría mandibular'],caution:['Informar posible fatiga masticatoria transitoria','Diferenciar glándula parótida de músculo'],women:['Si el objetivo es afinamiento, documentar forma mandibular y simetría.'],men:['Si el objetivo es funcional, priorizar hipertrofia, dolor y bruxismo antes que afinamiento.']},
    masetero_i:{label:'Masetero I',abbr:'MI',center:[450,448],shape:'<ellipse cx="448" cy="450" rx="60" ry="98"/>',needs:['Hipertrofia masetérica','Bruxismo / apretamiento','Dolor miofascial','Afinamiento de tercio inferior'],evaluate:['Volumen muscular en reposo y al apretar','Síntomas funcionales','Comparar lateralidad'],caution:['Informar posible fatiga masticatoria transitoria','Diferenciar glándula parótida de músculo'],women:['Si el objetivo es afinamiento, documentar forma mandibular y simetría.'],men:['Si el objetivo es funcional, priorizar hipertrofia, dolor y bruxismo antes que afinamiento.']},
    platisma:{label:'Platisma',abbr:'P',center:[300,700],shape:'<rect x="214" y="640" width="172" height="104" rx="30"/>',needs:['Bandas platismales','Descenso de tercio inferior','Marcación cervical dinámica'],evaluate:['Bandas en contracción','Interacción con contorno mandibular y DAO','Calidad cutánea cervical'],caution:['Precaución por disfagia, voz o debilidad cervical si la indicación es inadecuada'],women:['Suavizar bandas y contribuir al contorno cervicomandibular.'],men:['Suavizar bandas con criterio conservador y registro funcional.']}
  };

  function saveLocal(){try{sessionStorage.setItem(STORE,JSON.stringify(state));}catch(_){}}
  function loadLocal(){try{Object.assign(state,JSON.parse(sessionStorage.getItem(STORE)||'{}'));}catch(_){}}
  function dispatch(el,type='input'){el&&el.dispatchEvent(new Event(type,{bubbles:true}));}
  function setLegacy(id,val,type='input'){const el=$(id);if(!el)return;el.value=val;dispatch(el,type);}
  function clickIf(id){const el=$(id);if(el)el.click();}
  function getCalc(){try{return API.calculation?API.calculation():{};}catch(_){return {};}}
  function getPoints(){try{return(API.getState&&API.getState().points)||[];}catch(_){return[];}}
  function fmt(n,d=2){const num=Number(n);return Number.isFinite(num)?num.toFixed(d).replace(/\.00$/,'').replace(/(\.\d*[1-9])0+$/,'$1'):'0';}
  function volumeFromUnits(units){const c=getCalc();const perUnit=Number(c.volumePerUnit||0);return perUnit?Number(units||0)*perUnit:0;}

  function ensureBase(){
    setLegacy('procedimiento','toxina','change');
    document.querySelector('#procedurePicker [data-procedure="toxina"]')?.click();
  }

  function buildSvgZones(){
    return Object.entries(ZONES).map(([key,z])=>{
      const count=getPoints().filter(p=>String(p.zone)===key).length;
      return `<g class="g-zone ${state.zone===key?'active':''}" data-zone="${key}">${z.shape.replace(/^(<\w+)/,'$1 class="v14-zone-shape"')}
        <g class="v14-zone-label"><rect x="${z.center[0]-44}" y="${z.center[1]-11}" width="88" height="22"></rect><text x="${z.center[0]}" y="${z.center[1]+1}">${z.label}</text></g>
        <circle class="v14-count" cx="${z.center[0]+40}" cy="${z.center[1]-7}" r="12"></circle><text class="v14-count-text" x="${z.center[0]+40}" y="${z.center[1]-6}">${count}</text>
      </g>`;
    }).join('');
  }

  function pointStatusClass(status){if(status==='administrado')return'administered';if(status==='omitido')return'omitted';return'planned';}
  function renderPointsSvg(){
    return getPoints().map((p,idx)=>{
      const x=Number(p.x||ZONES[p.zone]?.center?.[0]||300);
      const y=Number(p.y||ZONES[p.zone]?.center?.[1]||300);
      const cls=pointStatusClass(p.status||'planificado');
      const sel=state.selectedPoint===idx?' selected':'';
      return `<circle class="v14-point ${cls}${sel}" data-point="${idx}" cx="${x}" cy="${y}" r="6"></circle>`;
    }).join('');
  }

  function setPortrait(){const portrait=$('v14Portrait');if(portrait)portrait.style.backgroundImage=`url('${PHOTOS[state.model]}')`;}
  function setStudyButtons(){['both','active','passive'].forEach(k=>$('v14Study_'+k)?.classList.toggle('active',state.study===k));}
  function setModelButtons(){['woman','man'].forEach(k=>$('v14Model_'+k)?.classList.toggle('active',state.model===k));}

  function syncCalculationFields(){
    setLegacy('producto',$('v14Product')?.value||'Botox®');
    setLegacy('toxVialUnits',$('v14Vial')?.value||'100');
    setLegacy('toxDilutionMl',$('v14Dilution')?.value||'2.5');
    setLegacy('toxDiluent',$('v14Diluent')?.value||'Cloruro de sodio 0,9%');
  }

  function syncZoneFields(){
    setLegacy('zoneRefMin',$('v14RefMin')?.value||'');
    setLegacy('zoneRefMax',$('v14RefMax')?.value||'');
    setLegacy('zoneFinding',$('v14Finding')?.value||'');
    setLegacy('zoneIndication',$('v14Indication')?.value||'');
    setLegacy('zoneLineMode',$('v14LineType')?.value||'mixta','change');
    setLegacy('zoneSymmetry',$('v14Symmetry')?.value||'simetrica','change');
  }

  function zoneTemplate(){
    const z=ZONES[state.zone];
    $('v14ZoneName').value=z.label;
    $('v14StudyValue').value=state.study==='both'?'Activas + pasivas':state.study==='active'?'Solo activas':'Solo pasivas';
    $('v14WomenBullets').innerHTML=z.women.map(x=>`<li>${x}</li>`).join('');
    $('v14MenBullets').innerHTML=z.men.map(x=>`<li>${x}</li>`).join('');
    $('v14Needs').innerHTML=z.needs.map(x=>`<span class="v14-chip">${x}</span>`).join('');
    $('v14Evaluate').innerHTML=z.evaluate.map(x=>`<li>${x}</li>`).join('');
    $('v14Caution').innerHTML=z.caution.map(x=>`<li>${x}</li>`).join('');
    $('v14Finding').value=z.evaluate.join('. ')+'.';
    $('v14Indication').value=z.needs[0]||'';
    syncZoneFields();
  }

  function renderCalc(){
    syncCalculationFields();
    const c=getCalc();
    const totalUnits=Number(c.totalUnits||$('v14Vial')?.value||100);
    const concentration=Number(c.concentration||totalUnits/Number($('v14Dilution')?.value||2.5));
    const unitsPer01=concentration*.1;
    const unitsPer005=concentration*.05;
    const volumePerUnit=concentration?1/concentration:0;
    const pts=getPoints();
    const totalPlan=pts.reduce((a,p)=>a+Number(p.planned||0),0);
    const totalAdm=pts.reduce((a,p)=>a+Number(p.administered||0),0);
    const totalVol=pts.reduce((a,p)=>a+Number(p.administered||0)*volumePerUnit,0);
    $('v14MetricConcentration').textContent=`${fmt(concentration,1)} U/mL`;
    $('v14Metric01').textContent=`${fmt(unitsPer01,1)} U`;
    $('v14Metric005').textContent=`${fmt(unitsPer005,1)} U`;
    $('v14MetricPer1').textContent=`${fmt(volumePerUnit,3)} mL`;
    $('v14TotalUnits').textContent=`${fmt(totalUnits,0)} U`;
    $('v14Planned').textContent=`${fmt(totalPlan,0)} U`;
    $('v14Admin').textContent=`${fmt(totalAdm,0)} U`;
    $('v14Remaining').textContent=`${fmt(totalUnits-totalAdm,0)} U`;
    $('v14PlannedVol').textContent=`${fmt(totalPlan*volumePerUnit,3)} mL`;
    $('v14AdminVol').textContent=`${fmt(totalVol,3)} mL`;
    $('v14SummaryPlan').textContent=`${fmt(totalPlan,0)} U`;
    $('v14SummaryAdmin').textContent=`${fmt(totalAdm,0)} U`;
    $('v14SummaryVol').textContent=`${fmt(totalVol,2)} mL`;
    $('v14ZonesUsed').textContent=String(new Set(pts.map(p=>p.zone).filter(Boolean)).size);
    $('v14TotalPoints').textContent=String(pts.length);
    $('v14MiniPlan').textContent=$('v14SummaryPlan').textContent;
    $('v14MiniAdmin').textContent=$('v14SummaryAdmin').textContent;
    $('v14MiniVol').textContent=$('v14SummaryVol').textContent;
    $('v14ZonesUsed2').textContent=$('v14ZonesUsed').textContent;
  }

  function renderTable(){
    const body=$('v14TableBody');
    const pts=getPoints();
    if(!pts.length){body.innerHTML='<tr><td colspan="7" style="text-align:center;color:#627d98;padding:18px">Aún no hay puntos registrados. Selecciona una zona y agrega el primer punto.</td></tr>';return;}
    body.innerHTML=pts.map((p,idx)=>{
      const zone=ZONES[p.zone]?.label||p.zone||'—';
      const label=p.label||`${ZONES[p.zone]?.abbr||'P'}-${idx+1}`;
      const plan=Number(p.planned||0);
      const adm=Number(p.administered||0);
      const vol=volumeFromUnits(adm);
      return `<tr><td data-label="Zona">${zone}</td><td data-label="Punto">${idx+1}</td><td data-label="Etiqueta">${label}</td><td data-label="Plan">${fmt(plan,0)} U</td><td data-label="Administrado">${fmt(adm,0)} U</td><td data-label="Volumen real">${fmt(vol,3)} mL</td><td data-label="Estado">${p.status||'planificado'}</td></tr>`;
    }).join('');
  }

  function addPoint(){
    const z=ZONES[state.zone];
    if(!z)return;
    try{
      API.selectZone?.(state.zone);
      const next=getPoints().filter(p=>p.zone===state.zone).length+1;
      API.addPoint?.(state.zone,z.center[0],z.center[1],`${z.abbr}-${String(next).padStart(2,'0')}`);
    }catch(error){console.warn('No fue posible agregar punto',error);}
    renderAll();
  }

  function bind(){
    ['woman','man'].forEach(k=>$('v14Model_'+k)?.addEventListener('click',()=>{state.model=k;setPortrait();setModelButtons();saveLocal();}));
    ['both','active','passive'].forEach(k=>$('v14Study_'+k)?.addEventListener('click',()=>{state.study=k;setStudyButtons();$('v14LineBadge').textContent=state.study==='both'?'Activas + pasivas':state.study==='active'?'Solo activas':'Solo pasivas';zoneTemplate();saveLocal();}));
    $('v14ZoomIn')?.addEventListener('click',()=>{state.zoom=Math.min(130,state.zoom+10);$('v14PortraitStage').style.transform=`scale(${state.zoom/100})`; $('v14ZoomValue').textContent=`${state.zoom}%`;});
    $('v14ZoomOut')?.addEventListener('click',()=>{state.zoom=Math.max(80,state.zoom-10);$('v14PortraitStage').style.transform=`scale(${state.zoom/100})`; $('v14ZoomValue').textContent=`${state.zoom}%`;});
    $('v14CenterBtn')?.addEventListener('click',()=>{state.zoom=100;$('v14PortraitStage').style.transform='scale(1)';$('v14ZoomValue').textContent='100%';});
    $('v14CenterBtn2')?.addEventListener('click',()=>$('v14CenterBtn')?.click());
    $('v14ClearMap')?.addEventListener('click',()=>{clickIf('btnClearPoints');setTimeout(renderAll,100);});
    $('v14ClearMap2')?.addEventListener('click',()=>{clickIf('btnClearPoints');setTimeout(renderAll,100);});
    $('v14PresetBtn')?.addEventListener('click',()=>{clickIf('btnAddPresetPoints');setTimeout(renderAll,100);});
    $('v14PresetBtn2')?.addEventListener('click',()=>{clickIf('btnAddPresetPoints');setTimeout(renderAll,100);});
    $('v14AddPoint')?.addEventListener('click',addPoint);
    $('v14Print')?.addEventListener('click',()=>clickIf('btnPrint'));
    $('v14PDF')?.addEventListener('click',()=>clickIf('btnPrint'));
    $('v14Copy')?.addEventListener('click',()=>clickIf('btnCopy'));
    $('v14Ready')?.addEventListener('click',()=>clickIf('btnGenerate'));
    ['v14Product','v14Vial','v14Diluent','v14Dilution'].forEach(id=>$(id)?.addEventListener('input',()=>{renderCalc();saveLocal();}));
    ['v14RefMin','v14RefMax','v14Finding','v14Indication','v14LineType','v14Symmetry'].forEach(id=>$(id)?.addEventListener('input',()=>{syncZoneFields();saveLocal();}));
    $('v14SaveZone')?.addEventListener('click',()=>{syncZoneFields();saveLocal();const p=$('v14SavedText');if(p){p.textContent='Estudio de zona guardado en esta sesión.';setTimeout(()=>p.textContent='La información registrada en este módulo es de carácter clínico y documental.',1800);}});
    $('v14Svg')?.addEventListener('click',ev=>{
      const zone=ev.target.closest('.g-zone')?.dataset.zone;
      const point=ev.target.closest('.v14-point')?.dataset.point;
      if(point!=null){state.selectedPoint=Number(point);renderMap();return;}
      if(zone){state.zone=zone;state.selectedPoint=null;API.selectZone?.(zone);zoneTemplate();renderMap();saveLocal();}
    });
  }

  function renderMap(){const svg=$('v14Svg');if(svg)svg.innerHTML=`<g>${buildSvgZones()}</g><g>${renderPointsSvg()}</g>`;}
  function renderAll(){setPortrait();setModelButtons();setStudyButtons();renderMap();renderCalc();renderTable();zoneTemplate();}

  function mount(){
    ensureBase();
    const panel=$('panelToxina');
    if(!panel)return;
    panel.querySelectorAll(':scope > *').forEach(el=>el.classList.add('v14-hidden-legacy'));
    let mount=$('v14Mount');
    if(!mount){mount=document.createElement('div');mount.id='v14Mount';panel.prepend(mount);}
    mount.innerHTML=`
      <div class="v14-shell">
        <aside class="v14-left">
          <section class="v14-card v14-side-card"><h3 class="v14-side-title">Modelo</h3><div class="v14-model-list">
            <button type="button" class="v14-model-btn" id="v14Model_woman"><span class="v14-model-thumb" style="background-image:url('${PHOTOS.woman}')"></span><span class="v14-model-text"><strong>Mujer</strong><span>Líneas de expresión tenues</span></span></button>
            <button type="button" class="v14-model-btn" id="v14Model_man"><span class="v14-model-thumb" style="background-image:url('${PHOTOS.man}')"></span><span class="v14-model-text"><strong>Hombre</strong><span>Patrones dinámicos y funcionales</span></span></button>
          </div></section>
          <section class="v14-card v14-side-card"><h3 class="v14-side-title">Expresión / estudio</h3><div class="v14-study-list">
            <button type="button" class="v14-study-btn" id="v14Study_both"><span class="v14-study-icon">◎</span>Activas + pasivas</button>
            <button type="button" class="v14-study-btn" id="v14Study_active"><span class="v14-study-icon">A</span>Solo activas</button>
            <button type="button" class="v14-study-btn" id="v14Study_passive"><span class="v14-study-icon">P</span>Solo pasivas</button>
          </div></section>
          <section class="v14-card v14-side-card"><h3 class="v14-side-title">Estado de puntos</h3><div class="v14-legend-list">
            <div class="v14-legend-item"><span class="v14-dot planned"></span>Planificado</div><div class="v14-legend-item"><span class="v14-dot admin"></span>Administrado</div><div class="v14-legend-item"><span class="v14-dot omitted"></span>Omitido</div><div class="v14-legend-item"><span class="v14-dot selected"></span>Seleccionado</div>
          </div></section>
          <section class="v14-card v14-side-card"><h3 class="v14-side-title">Herramientas</h3><div class="v14-tool-list">
            <button type="button" class="v14-tool-btn" id="v14PresetBtn">Cargar mapa base</button>
            <button type="button" class="v14-tool-btn" id="v14ClearMap">Limpiar mapa</button>
            <button type="button" class="v14-tool-btn" id="v14CenterBtn">Centrar rostro</button>
          </div></section>
        </aside>
        <section class="v14-center v14-card">
          <div class="v14-top-row"><div class="v14-top-note"><strong>Modelo clínico · estudio dinámico</strong><span id="v14LineBadge">Activas + pasivas</span>. La UI por sector se organiza según indicación y necesidad terapéutica: líneas dinámicas, hipertonía, bruxismo/hipertrofia, sonrisa gingival, descenso comisural y bandas platismales.</div><div class="v14-mini-help"><strong>Cómo usar</strong><br>Toca una zona para revisar la orientación clínica y luego agrega puntos al mapa.</div></div>
          <div class="v14-portrait-stage"><div class="v14-portrait" id="v14Portrait"></div><div id="v14PortraitStage" style="transform-origin:center top;transition:.16s ease;"><svg class="v14-map-svg" viewBox="0 0 600 760" id="v14Svg"></svg></div></div>
          <div class="v14-center-tools"><div class="v14-tool-inline"><button type="button" class="v14-inline-btn" id="v14PresetBtn2">Mostrar músculos</button><button type="button" class="v14-inline-btn" id="v14ClearMap2">Limpiar puntos</button><button type="button" class="v14-inline-btn" id="v14CenterBtn2">Centrar rostro</button></div><div class="v14-zoom"><button type="button" id="v14ZoomOut">−</button><span id="v14ZoomValue">100%</span><button type="button" id="v14ZoomIn">+</button></div></div>
          <section class="v14-card v14-table-card"><div class="v14-table-head">Plan de puntos</div><table class="v14-table"><thead><tr><th>Zona</th><th>Punto</th><th>Etiqueta</th><th>Plan</th><th>Administrado</th><th>Volumen real</th><th>Estado</th></tr></thead><tbody id="v14TableBody"></tbody></table><div class="v14-totals"><div class="v14-metric"><span>Zonas usadas</span><strong id="v14ZonesUsed">0</strong></div><div class="v14-metric"><span>Puntos planificados</span><strong id="v14TotalPoints">0</strong></div><div class="v14-metric"><span>Unidades planificadas</span><strong id="v14SummaryPlan">0 U</strong></div><div class="v14-metric"><span>Unidades administradas</span><strong id="v14SummaryAdmin">0 U</strong></div><div class="v14-metric"><span>Volumen administrado</span><strong id="v14SummaryVol">0 mL</strong></div></div></section>
        </section>
        <aside class="v14-right">
          <section class="v14-card"><h3 class="v14-section-title">Cálculo de toxina</h3><div class="v14-field-grid"><div class="v14-field"><label>Producto</label><select id="v14Product"><option>Botox®</option><option>Xeomin®</option><option>Dysport®</option><option>Nabota®</option></select></div><div class="v14-field"><label>Vial (U)</label><select id="v14Vial"><option value="50">50 U</option><option value="100" selected>100 U</option><option value="200">200 U</option></select></div><div class="v14-field"><label>Diluyente</label><select id="v14Diluent"><option>Cloruro de sodio 0,9%</option><option>Otro</option></select></div><div class="v14-field"><label>Volumen (mL)</label><input id="v14Dilution" type="number" min="0" step="0.01" value="2.5"></div></div><div class="v14-metrics-grid"><div class="v14-metric"><span>Concentración</span><strong id="v14MetricConcentration">40,0 U/mL</strong></div><div class="v14-metric"><span>U por 0,1 mL</span><strong id="v14Metric01">4,0 U</strong></div><div class="v14-metric"><span>U por 0,05 mL</span><strong id="v14Metric005">2,0 U</strong></div><div class="v14-metric"><span>Vol. por 1 U</span><strong id="v14MetricPer1">0,025 mL</strong></div></div><div class="v14-subtitle">Resumen del vial</div><div class="v14-summary-grid"><div><span>Unidades totales</span><strong id="v14TotalUnits">100 U</strong></div><div><span>Planificadas</span><strong id="v14Planned">0 U</strong></div><div><span>Administradas</span><strong id="v14Admin">0 U</strong></div><div><span>Remanente teórico</span><strong id="v14Remaining">100 U</strong></div></div><div class="v14-subtitle">Volumen</div><div class="v14-summary-grid"><div><span>Planificado</span><strong id="v14PlannedVol">0 mL</strong></div><div><span>Administrado</span><strong id="v14AdminVol">0 mL</strong></div></div></section>
          <section class="v14-card"><h3 class="v14-section-title">Asistente clínico de zona</h3><div class="v14-zone-header"><div class="v14-field"><label>Zona seleccionada</label><input id="v14ZoneName" readonly></div><div class="v14-field"><label>Líneas evaluadas</label><input id="v14StudyValue" readonly></div><button type="button" class="v14-secondary">Ver guía rápida</button></div><div class="v14-tab-bar"><span class="active">Orientación clínica</span><span>Necesidad terapéutica</span><span>Evaluación</span><span>Notas</span></div><div class="v14-guidance"><div class="v14-guidance-box"><h4>Mujer</h4><ul id="v14WomenBullets"></ul></div><div class="v14-guidance-box"><h4>Hombre</h4><ul id="v14MenBullets"></ul></div></div><div class="v14-subtitle">Necesidad terapéutica frecuente</div><div class="v14-chip-row" id="v14Needs"></div><div class="v14-clinical-grid"><div class="v14-field"><label>Tipo de línea principal</label><select id="v14LineType"><option value="mixta">Mixta</option><option value="activa">Activa</option><option value="pasiva">Pasiva</option></select></div><div class="v14-field"><label>Simetría / lateralidad</label><select id="v14Symmetry"><option value="simetrica">Simétrica</option><option value="derecha_predomina">Predomina derecha</option><option value="izquierda_predomina">Predomina izquierda</option><option value="asimetrica">Asimétrica</option></select></div><div class="v14-field"><label>Hallazgos y análisis</label><textarea id="v14Finding"></textarea></div><div class="v14-field"><label>Objetivo / indicación</label><textarea id="v14Indication"></textarea></div></div><div class="v14-clinical-grid"><div class="v14-card v14-mini-card"><h3 class="v14-section-title" style="margin-bottom:8px">Qué evaluar</h3><ul class="v14-bullets" id="v14Evaluate"></ul></div><div class="v14-card v14-mini-card"><h3 class="v14-section-title" style="margin-bottom:8px">Cautelas clínicas</h3><ul class="v14-bullets" id="v14Caution"></ul></div></div><div class="v14-clinical-grid"><div class="v14-field"><label>Referencia mínima</label><input id="v14RefMin" type="number" min="0" step="0.1" value="6"></div><div class="v14-field"><label>Referencia máxima</label><input id="v14RefMax" type="number" min="0" step="0.1" value="12"></div></div><div class="v14-action"><div style="display:flex;gap:10px;flex-wrap:wrap"><button type="button" class="v14-primary" id="v14SaveZone">Guardar estudio de zona</button><button type="button" class="v14-secondary" id="v14AddPoint">Agregar punto en la zona</button></div><div class="v14-muted" id="v14SavedText">La información registrada en este módulo es de carácter clínico y documental.</div></div></section>
          <div class="v14-bottom-grid"><section class="v14-card v14-mini-card"><h3 class="v14-section-title">Resumen general</h3><div class="v14-clinical-grid"><div class="v14-metric"><span>Total planificado</span><strong id="v14MiniPlan">0 U</strong><small>Zonas con referencia: <span id="v14ZonesUsed2">0</span></small></div><div class="v14-metric"><span>Total administrado</span><strong id="v14MiniAdmin">0 U</strong><small>Volumen administrado: <span id="v14MiniVol">0 mL</span></small></div></div></section><section class="v14-card v14-mini-card"><h3 class="v14-section-title">Documento</h3><div class="v14-document-actions"><button type="button" id="v14Print">Vista previa / Imprimir</button><button type="button" id="v14PDF">Exportar PDF</button><button type="button" id="v14Copy">Copiar resumen</button><button type="button" id="v14Ready">Documento listo para generar</button></div></section></div>
        </aside>
      </div>`;
    bind();
    renderAll();
  }

  loadLocal();
  const boot=()=>{if($('panelToxina'))mount();else setTimeout(boot,200);};
  boot();
})();
