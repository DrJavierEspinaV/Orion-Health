(()=>{
  'use strict';
  const API=window.ORION_AESTHETIC_V11;
  if(!API){console.error('ORION V1.3: no se encontró la base V1.1');return;}
  const $=id=>document.getElementById(id);
  const $$=selector=>Array.from(document.querySelectorAll(selector));
  const STORE='orion_armonizacion_v13';
  const PHOTOS={
    woman:'https://images.pexels.com/photos/14599151/pexels-photo-14599151.jpeg?auto=compress&cs=tinysrgb&w=1100',
    man:'https://images.pexels.com/photos/14599188/pexels-photo-14599188.jpeg?auto=compress&cs=tinysrgb&w=1100'
  };
  const state={model:'woman',lineMode:'both',zone:'glabela',studies:{},selectedPoint:null};
  const ZONES={
    frente:{label:'Frente',center:[300,158],shape:'<rect x="205" y="105" width="190" height="92" rx="34"/>',woman:['Suavizar sin perder feminidad.','Evitar depresión de cejas.','Mantener elevación natural.'],man:['Suavizar sin aplanar completamente.','Conservar una ceja más horizontal.','Evitar feminización.']},
    glabela:{label:'Glabela',center:[300,233],shape:'<ellipse cx="300" cy="230" rx="48" ry="35"/>',woman:['Relajar el entrecejo.','Mantener expresión natural.','Equilibrar con la frente.'],man:['Disminuir severidad sin borrar identidad.','Considerar mayor potencia muscular.','Evitar arqueo excesivo.']},
    periocular_d:{label:'Periocular D',center:[188,292],shape:'<ellipse cx="185" cy="292" rx="62" ry="48"/>',woman:['Suavizar patas de gallo.','Mantener mirada fresca.','Evitar caída lateral.'],man:['Planificación conservadora.','Mantener naturalidad.','Comparar con lado opuesto.']},
    periocular_i:{label:'Periocular I',center:[412,292],shape:'<ellipse cx="415" cy="292" rx="62" ry="48"/>',woman:['Suavizar patas de gallo.','Mantener mirada fresca.','Comparar simetría.'],man:['Planificación conservadora.','Mantener naturalidad.','Comparar con lado opuesto.']},
    nariz:{label:'Nariz',center:[300,374],shape:'<ellipse cx="300" cy="365" rx="48" ry="72"/>',woman:['Relacionar con sonrisa gingival.','Evitar alterar la mímica nasal.'],man:['Registrar compensación nasal.','Usar criterio conservador.']},
    sonrisa:{label:'Sonrisa / Perioral',center:[300,478],shape:'<ellipse cx="300" cy="475" rx="92" ry="48"/>',woman:['Analizar exposición gingival.','Registrar longitud labial en reposo.'],man:['Analizar elevación labial.','Conservar naturalidad de sonrisa.']},
    dao_d:{label:'DAO D',center:[242,528],shape:'<ellipse cx="238" cy="525" rx="40" ry="42"/>',woman:['Revisar descenso comisural.','Equilibrar con mentón.'],man:['Revisar tono perioral.','Evitar sobrecorrección.']},
    dao_i:{label:'DAO I',center:[358,528],shape:'<ellipse cx="362" cy="525" rx="40" ry="42"/>',woman:['Revisar descenso comisural.','Comparar lateralidad.'],man:['Revisar tono perioral.','Comparar lateralidad.']},
    menton:{label:'Mentón',center:[300,585],shape:'<ellipse cx="300" cy="580" rx="68" ry="46"/>',woman:['Registrar hoyuelos y competencia labial.'],man:['Registrar mentoniano y eversión labial.']},
    masetero_d:{label:'Masetero D',center:[158,478],shape:'<ellipse cx="155" cy="470" rx="57" ry="105"/>',woman:['Valorar afinamiento y función.'],man:['Respetar estructura mandibular.','Valorar hipertrofia funcional.']},
    masetero_i:{label:'Masetero I',center:[442,478],shape:'<ellipse cx="445" cy="470" rx="57" ry="105"/>',woman:['Valorar afinamiento y asimetría.'],man:['Respetar estructura mandibular.','Comparar hipertrofia.']},
    platisma:{label:'Platisma',center:[300,690],shape:'<rect x="205" y="635" width="190" height="100" rx="38"/>',woman:['Analizar bandas y transición mentocervical.'],man:['Analizar bandas y contorno cervical.']}
  };
  const centers=Object.fromEntries(Object.entries(ZONES).map(([key,z])=>[key,z.center]));

  const dispatch=(el,type='input')=>el&&el.dispatchEvent(new Event(type,{bubbles:true}));
  const setLegacy=(id,value,type='input')=>{const el=$(id);if(!el)return;el.value=value;dispatch(el,type);};
  const fmt=(n,d=2)=>Number.isFinite(Number(n))?Number(n).toFixed(d).replace(/\.00$/,'').replace(/(\.\d*[1-9])0+$/,'$1'):'0';
  const calc=()=>API.calculation();
  const points=()=>{try{return API.getState().points||[];}catch(_){return [];}};

  function svgZones(){
    return Object.entries(ZONES).map(([key,z])=>`<g class="v13-zone-group" data-zone="${key}"><g class="v13-zone-shape">${z.shape}</g><g class="v13-zone-label"><rect x="${z.center[0]-42}" y="${z.center[1]-10}" width="84" height="20"></rect><text x="${z.center[0]}" y="${z.center[1]+1}">${z.label}</text></g></g>`).join('');
  }

  function build(){
    const panel=$('panelToxina');
    if(!panel||panel.classList.contains('v13-mounted'))return;
    panel.classList.add('v13-mounted');
    const legacy=document.createElement('div');legacy.className='v13-legacy';
    while(panel.firstChild)legacy.appendChild(panel.firstChild);
    panel.appendChild(legacy);
    const root=document.createElement('section');root.className='v13-dashboard';root.innerHTML=`
      <div class="v13-topbar"><div class="v13-title">ORION · Armonización Orofacial <small>V1.3</small></div><div class="v13-tabs"><button>Calculadora</button><button class="active">Mapa facial</button><button>Resumen</button></div></div>
      <div class="v13-workspace">
        <aside class="v13-card v13-sidebar">
          <div><div class="v13-side-title">Modelo</div><button class="v13-model-btn active" data-model="woman"><div class="v13-thumb" style="background-image:url('${PHOTOS.woman}')"></div>Mujer</button><button class="v13-model-btn" data-model="man"><div class="v13-thumb" style="background-image:url('${PHOTOS.man}')"></div>Hombre</button></div>
          <div><div class="v13-side-title">Expresión / estudio</div><button class="v13-study-btn active" data-lines="both">◉ Activas + pasivas</button><button class="v13-study-btn" data-lines="active">◉ Solo activas</button><button class="v13-study-btn" data-lines="passive">◉ Solo pasivas</button></div>
          <div><div class="v13-side-title">Estado de puntos</div><div class="v13-legend"><span><i class="v13-dot plan"></i> Planificado</span><span><i class="v13-dot admin"></i> Administrado</span><span><i class="v13-dot omit"></i> Omitido</span><span><i class="v13-dot sel"></i> Seleccionado</span></div><button class="v13-side-action" id="v13Clear">Limpiar mapa</button></div>
        </aside>
        <div class="v13-card v13-map-card"><div class="v13-map-note" id="v13MapNote">Modelo Mujer · visualización Activas + pasivas. Las líneas son una guía clínica tenue.</div><div class="v13-map-wrap"><svg class="v13-map-svg" id="v13Map" viewBox="0 0 600 760" preserveAspectRatio="xMidYMid meet"><rect width="600" height="760" fill="#fff"/><image class="v13-photo" id="v13Photo" href="${PHOTOS.woman}" x="0" y="0" width="600" height="760" preserveAspectRatio="xMidYMid slice"/><g id="v13Zones">${svgZones()}</g><g id="v13Points"></g></svg></div><div class="v13-map-tools"><button id="v13AddPoint">＋ Agregar punto</button><button id="v13BaseMap">Cargar mapa base</button><button id="v13Center">Centrar</button></div></div>
        <div class="v13-right">
          <section class="v13-card v13-panel"><h4>Cálculo de toxina</h4><div class="v13-grid"><label class="v13-field v13-span2">Producto / marca<input id="v13Product" placeholder="Producto declarado"></label><label class="v13-field">Vial (U)<input id="v13Vial" type="number" min="0" step="0.1"></label><label class="v13-field">Diluyente<input id="v13Diluent"></label><label class="v13-field">Volumen (mL)<input id="v13Dilution" type="number" min="0" step="0.01"></label><label class="v13-field">Graduación<select id="v13Grad"><option value="0.01">0,01 mL</option><option value="0.025">0,025 mL</option><option value="0.05">0,05 mL</option><option value="0.1">0,10 mL</option></select></label></div><div class="v13-metrics"><div class="v13-metric"><span>Concentración</span><strong id="v13Conc">—</strong></div><div class="v13-metric"><span>U / 0,10 mL</span><strong id="v13U01">—</strong></div><div class="v13-metric"><span>U / 0,05 mL</span><strong id="v13U005">—</strong></div><div class="v13-metric"><span>mL / 1 U</span><strong id="v13MlU">—</strong></div></div></section>
          <section class="v13-card v13-panel"><div class="v13-zone-head"><div><small>Zona seleccionada</small><strong id="v13ZoneTitle">Glabela</strong></div><span id="v13LineTitle">Activas + pasivas</span></div><div class="v13-orientation"><div><b>Mujer</b><ul id="v13WomanTips"></ul></div><div><b>Hombre</b><ul id="v13ManTips"></ul></div></div><div class="v13-grid"><label class="v13-field">Tipo de línea<select id="v13ZoneLine"><option value="mixta">Mixta</option><option value="activa">Activa</option><option value="pasiva">Pasiva</option></select></label><label class="v13-field">Simetría / lateralidad<select id="v13Sym"><option value="simetrica">Simétrica</option><option value="derecha">Mayor D</option><option value="izquierda">Mayor I</option><option value="asimetrica">Asimétrica</option></select></label><label class="v13-field v13-span2">Hallazgos y análisis<textarea id="v13Finding"></textarea></label><label class="v13-field v13-span2">Objetivo / indicación clínica<textarea id="v13Goal"></textarea></label><label class="v13-field">Referencia mínima (U)<input id="v13Min" type="number" min="0" step="0.1"></label><label class="v13-field">Referencia máxima (U)<input id="v13Max" type="number" min="0" step="0.1"></label><label class="v13-field v13-span2">Comentario técnico<textarea id="v13Note"></textarea></label></div><button class="v13-save" id="v13SaveZone">Guardar análisis de zona</button><button class="v13-add" id="v13AddZone">Agregar punto en Glabela ＋</button><div class="v13-editor" id="v13Editor"><div class="v13-grid"><label class="v13-field">Etiqueta<input id="v13PointLabel"></label><label class="v13-field">Estado<select id="v13PointState"><option value="planificado">Planificado</option><option value="administrado">Administrado</option><option value="omitido">Omitido</option></select></label><label class="v13-field">Plan (U)<input id="v13PointPlan" type="number" min="0" step="0.1"></label><label class="v13-field">Administrado (U)<input id="v13PointAdmin" type="number" min="0" step="0.1"></label></div><button class="v13-add" id="v13ApplyPoint">Actualizar punto</button></div><div class="v13-footer-note">Las referencias son configuradas por la profesional; ORION no decide dosis ni convierte unidades entre productos.</div></section>
        </div>
        <section class="v13-card v13-summary"><div class="v13-summary-grid"><div class="v13-summary-item"><span>Total planificado</span><strong id="v13TotalPlan">0 U</strong></div><div class="v13-summary-item"><span>Total administrado</span><strong id="v13TotalAdmin">0 U</strong></div><div class="v13-summary-item"><span>Remanente vial</span><strong id="v13Remain">0 U</strong></div><div class="v13-summary-item"><span>Zonas con puntos</span><strong id="v13ZonesCount">0</strong></div><div class="v13-summary-item"><span>Puntos totales</span><strong id="v13PointsCount">0</strong></div></div></section>
        <section class="v13-card v13-table-card"><div class="v13-table-head"><h4>Plan de puntos</h4><span id="v13TableSummary">0 puntos</span></div><div class="v13-table-wrap"><table class="v13-table"><thead><tr><th>Zona</th><th>Punto</th><th>Plan</th><th>Administrado</th><th>Volumen real</th><th>Estado</th><th>Acciones</th></tr></thead><tbody id="v13Rows"></tbody></table></div></section>
      </div>`;
    panel.appendChild(root);
    installOutput();
    hydrateControls();
    bind();
    selectZone(state.zone);
    render();
    restore();
  }

  function installOutput(){
    const summary=document.querySelector('#printSheet .summary-grid');
    if(summary&&!$('v13OutProfile')){const p=document.createElement('p');p.className='v13-output-study';p.innerHTML='<b>Estudio facial:</b> <span id="v13OutProfile">—</span>';summary.appendChild(p);}
    const pointsSection=$('outPointsSection');
    if(pointsSection&&!$('v13OutStudies')){const section=document.createElement('div');section.className='output-section hidden';section.id='v13OutStudies';section.innerHTML='<h3>Análisis facial por zona</h3><pre id="v13OutStudyText">—</pre>';pointsSection.parentNode.insertBefore(section,pointsSection);}
  }

  function hydrateControls(){
    $('v13Product').value=$('producto')?.value||'';$('v13Vial').value=$('toxVialUnits')?.value||100;$('v13Diluent').value=$('toxDiluent')?.value||'NaCl 0,9%';$('v13Dilution').value=$('toxDilutionMl')?.value||2.5;$('v13Grad').value=$('toxGraduationMl')?.value||0.05;
  }

  function bind(){
    $$('[data-model]').forEach(b=>b.addEventListener('click',()=>setModel(b.dataset.model)));
    $$('[data-lines]').forEach(b=>b.addEventListener('click',()=>setLines(b.dataset.lines)));
    $$('#v13Zones .v13-zone-group').forEach(g=>g.addEventListener('click',e=>{e.stopPropagation();selectZone(g.dataset.zone);}));
    $('v13Map').addEventListener('click',e=>{if(e.target.closest('.v13-zone-group,.v13-point'))return;if(!state.zone)return;const pt=svgPoint(e);addPoint(state.zone,pt.x,pt.y);});
    $('v13AddPoint').addEventListener('click',()=>addPointAtCenter());$('v13AddZone').addEventListener('click',()=>addPointAtCenter());
    $('v13BaseMap').addEventListener('click',()=>{const hidden=$('btnAddPresetPoints');if(hidden){hidden.click();setTimeout(render,20);}});
    $('v13Clear').addEventListener('click',()=>{const hidden=$('btnClearPoints');if(hidden)hidden.click();setTimeout(render,30);});
    $('v13Center').addEventListener('click',()=>{$('v13Map').style.transform='none';});
    ['v13Product','v13Vial','v13Diluent','v13Dilution','v13Grad'].forEach(id=>$(id).addEventListener('input',syncCalculation));
    $('v13SaveZone').addEventListener('click',saveZone);
    $('v13ApplyPoint').addEventListener('click',applyPoint);
    $('v13Rows').addEventListener('click',e=>{const btn=e.target.closest('[data-point]');if(btn)openPoint(btn.dataset.point);});
    $('btnSave')?.addEventListener('click',save);
    $('btnRestore')?.addEventListener('click',()=>setTimeout(restore,10));
    ['pointPlanned','pointAdministered','pointState','pointLabel','zoneRefMin','zoneRefMax'].forEach(id=>$(id)?.addEventListener('input',()=>setTimeout(render,10)));
    setInterval(render,900);
  }

  function svgPoint(e){const svg=$('v13Map'),p=svg.createSVGPoint();p.x=e.clientX;p.y=e.clientY;return p.matrixTransform(svg.getScreenCTM().inverse());}
  function toLegacy(x,y){return [x*420/600,y*620/760];}
  function fromLegacy(x,y){return [x*600/420,y*760/620];}

  function setModel(model){state.model=model;$$('[data-model]').forEach(b=>b.classList.toggle('active',b.dataset.model===model));$('v13Photo').setAttribute('href',PHOTOS[model]);renderNote();renderZoneTips();save();}
  function setLines(mode){state.lineMode=mode;$$('[data-lines]').forEach(b=>b.classList.toggle('active',b.dataset.lines===mode));renderNote();$('v13LineTitle').textContent=mode==='active'?'Solo activas':mode==='passive'?'Solo pasivas':'Activas + pasivas';save();}
  function renderNote(){$('v13MapNote').textContent=`Modelo ${state.model==='woman'?'Mujer':'Hombre'} · visualización ${state.lineMode==='active'?'Solo activas':state.lineMode==='passive'?'Solo pasivas':'Activas + pasivas'}. Las líneas y zonas son una guía clínica tenue.`;}

  function selectZone(key){state.zone=key;API.selectZone(key);$$('.v13-zone-group').forEach(g=>g.classList.toggle('active',g.dataset.zone===key));$('v13ZoneTitle').textContent=ZONES[key].label;$('v13AddZone').textContent=`Agregar punto en ${ZONES[key].label} ＋`;loadStudy();renderZoneTips();save();}
  function renderZoneTips(){const z=ZONES[state.zone];if(!z)return;$('v13WomanTips').innerHTML=z.woman.map(t=>`<li>${t}</li>`).join('');$('v13ManTips').innerHTML=z.man.map(t=>`<li>${t}</li>`).join('');}
  function study(){return state.studies[state.zone]||{};}
  function loadStudy(){const s=study();$('v13ZoneLine').value=s.line||'mixta';$('v13Sym').value=s.sym||'simetrica';$('v13Finding').value=s.finding||'';$('v13Goal').value=s.goal||'';$('v13Min').value=s.min||'';$('v13Max').value=s.max||'';$('v13Note').value=s.note||'';}
  function saveZone(){state.studies[state.zone]={line:$('v13ZoneLine').value,sym:$('v13Sym').value,finding:$('v13Finding').value.trim(),goal:$('v13Goal').value.trim(),min:$('v13Min').value,max:$('v13Max').value,note:$('v13Note').value.trim()};setLegacy('zoneRefMin',$('v13Min').value);setLegacy('zoneRefMax',$('v13Max').value);$('btnApplyReference')?.click();save();updateOutput();}

  function syncCalculation(){setLegacy('producto',$('v13Product').value);setLegacy('toxVialUnits',$('v13Vial').value);setLegacy('toxDiluent',$('v13Diluent').value);setLegacy('toxDilutionMl',$('v13Dilution').value);setLegacy('toxGraduationMl',$('v13Grad').value,'change');setTimeout(render,10);}
  function addPointAtCenter(){const [x,y]=centers[state.zone];addPoint(state.zone,x,y);}
  function addPoint(zone,x,y){const [lx,ly]=toLegacy(x,y);API.addPoint(zone,lx,ly);setTimeout(()=>{render();const ps=points();const last=ps[ps.length-1];if(last)openPoint(last.id);},30);}

  function openPoint(id){const hidden=document.querySelector(`#pointLayer .map-point[data-id="${CSS.escape(id)}"]`);hidden?.dispatchEvent(new MouseEvent('click',{bubbles:true}));state.selectedPoint=id;setTimeout(()=>{const p=points().find(x=>x.id===id);if(!p)return;$('v13PointLabel').value=p.label||'';$('v13PointState').value=normalizeState(p.state);$('v13PointPlan').value=p.planned||0;$('v13PointAdmin').value=p.administered||0;$('v13Editor').classList.add('open');render();},10);}
  function normalizeState(s){s=String(s||'planificado').toLowerCase();if(s.includes('admin'))return'administrado';if(s.includes('omit'))return'omitido';return'planificado';}
  function applyPoint(){if(!state.selectedPoint)return;setLegacy('pointLabel',$('v13PointLabel').value);setLegacy('pointState',$('v13PointState').value,'change');setLegacy('pointPlanned',$('v13PointPlan').value);setLegacy('pointAdministered',$('v13PointAdmin').value);setTimeout(render,20);}

  function render(){const ps=points(),c=calc();renderPoints(ps);$('v13Conc').textContent=c.concentration?`${fmt(c.concentration)} U/mL`:'—';$('v13U01').textContent=c.perTenth?`${fmt(c.perTenth)} U`:'—';$('v13U005').textContent=c.perHalf?`${fmt(c.perHalf)} U`:'—';$('v13MlU').textContent=c.mlPerUnit?`${fmt(c.mlPerUnit,3)} mL`:'—';$('v13TotalPlan').textContent=`${fmt(c.plannedUnits)} U`;$('v13TotalAdmin').textContent=`${fmt(c.adminUnits)} U`;$('v13Remain').textContent=`${fmt(c.remaining)} U`;$('v13ZonesCount').textContent=new Set(ps.map(p=>p.zone)).size;$('v13PointsCount').textContent=ps.length;$('v13TableSummary').textContent=`${ps.length} puntos · ${fmt(c.plannedUnits)} U planificadas · ${fmt(c.adminUnits)} U administradas`;updateOutput();}
  function renderPoints(ps){const layer=$('v13Points');layer.innerHTML='';ps.forEach(p=>{const [x,y]=fromLegacy(p.x,p.y),s=normalizeState(p.state),g=document.createElementNS('http://www.w3.org/2000/svg','g');g.setAttribute('class',`v13-point ${s==='administrado'?'admin':s==='omitido'?'omit':'plan'} ${state.selectedPoint===p.id?'selected':''}`);g.dataset.point=p.id;g.innerHTML=`<circle cx="${x}" cy="${y}" r="11"></circle><text x="${x}" y="${y+1}">${p.label||'•'}</text>`;g.addEventListener('click',e=>{e.stopPropagation();openPoint(p.id);});layer.appendChild(g);});const rows=$('v13Rows');if(!ps.length){rows.innerHTML='<tr><td colspan="7" class="v13-empty">Aún no hay puntos registrados. Selecciona una zona y agrega el primero.</td></tr>';return;}const c=calc();rows.innerHTML=ps.map(p=>`<tr><td>${ZONES[p.zone]?.label||p.zone}</td><td>${p.label||'—'}</td><td>${fmt(p.planned)} U</td><td>${fmt(p.administered)} U</td><td>${fmt((Number(p.administered)||0)*c.mlPerUnit,3)} mL</td><td>${normalizeState(p.state)}</td><td><button class="v13-row-btn" data-point="${p.id}">Editar</button></td></tr>`).join('');}

  function profileText(){return `Modelo ${state.model==='woman'?'Mujer':'Hombre'} · estudio ${state.lineMode==='active'?'líneas activas':state.lineMode==='passive'?'líneas pasivas':'líneas activas y pasivas'}.`;}
  function studyText(){const keys=Object.keys(state.studies);if(!keys.length)return'Sin análisis de zona registrado.';return keys.map(k=>{const s=state.studies[k];return `${ZONES[k].label}\nLínea: ${s.line||'—'} · Simetría: ${s.sym||'—'} · Referencia: ${s.min||'—'} a ${s.max||'—'} U\nHallazgos: ${s.finding||'—'}\nObjetivo: ${s.goal||'—'}\nNota: ${s.note||'—'}`;}).join('\n\n');}
  function updateOutput(){if($('v13OutProfile'))$('v13OutProfile').textContent=profileText();if($('v13OutStudyText'))$('v13OutStudyText').textContent=studyText();$('v13OutStudies')?.classList.toggle('hidden',!Object.keys(state.studies).length);}
  function save(){sessionStorage.setItem(STORE,JSON.stringify({state,controls:{product:$('v13Product')?.value,vial:$('v13Vial')?.value,diluent:$('v13Diluent')?.value,dilution:$('v13Dilution')?.value,grad:$('v13Grad')?.value}}));}
  function restore(){try{const data=JSON.parse(sessionStorage.getItem(STORE)||'null');if(!data)return;Object.assign(state,data.state||{});if(data.controls){$('v13Product').value=data.controls.product||'';$('v13Vial').value=data.controls.vial||100;$('v13Diluent').value=data.controls.diluent||'NaCl 0,9%';$('v13Dilution').value=data.controls.dilution||2.5;$('v13Grad').value=data.controls.grad||.05;syncCalculation();}setModel(state.model||'woman');setLines(state.lineMode||'both');selectZone(state.zone||'glabela');render();}catch(e){console.warn('ORION V1.3: no fue posible restaurar',e);}}

  build();
})();
