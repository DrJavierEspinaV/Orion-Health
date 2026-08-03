(()=>{
  'use strict';

  const VERSION='1.5.4';
  const KEY='orion_aesthetic_procedure_v145';
  const MIGRATION_KEY='orion_aesthetic_admin_only_v154';
  const $=id=>document.getElementById(id);
  let observerMounted=false;
  let refreshQueued=false;

  function setText(node,text){
    if(node&&node.textContent!==text)node.textContent=text;
  }

  function replaceOwnText(label,text){
    if(!label)return;
    const node=Array.from(label.childNodes).find(item=>item.nodeType===Node.TEXT_NODE&&item.textContent.trim());
    if(node&&node.textContent.trim()!==text)node.textContent=text;
  }

  function loadState(){
    try{return JSON.parse(sessionStorage.getItem(KEY)||'null');}
    catch(_){return null;}
  }

  function saveState(state){
    try{sessionStorage.setItem(KEY,JSON.stringify(state));return true;}
    catch(_){return false;}
  }

  function migrateAdministrationOnly(){
    if(sessionStorage.getItem(MIGRATION_KEY)==='1')return false;
    const state=loadState();
    if(!state||!Array.isArray(state.points)){
      sessionStorage.setItem(MIGRATION_KEY,'1');
      return false;
    }

    state.points.forEach(point=>{
      point.planned=0;
      if(point.status!=='omitted'){
        point.status=Number(point.administered||0)>0?'administered':'suggested';
      }
    });
    saveState(state);
    sessionStorage.setItem(MIGRATION_KEY,'1');
    return true;
  }

  function hideClosestLabel(id){
    const field=$(id);
    const label=field?.closest('label');
    if(label&&!label.classList.contains('oa-v154-hide'))label.classList.add('oa-v154-hide');
  }

  function removePlanningUI(){
    ['oaV148Plan','pointPlanned','bulkPlan'].forEach(hideClosestLabel);
    ['zonePlanned','zonePlannedPoints','totalPlanned'].forEach(id=>{
      const node=$(id);
      const container=node?.closest('div');
      if(container&&!container.classList.contains('oa-v154-hide'))container.classList.add('oa-v154-hide');
    });

    const copy=$('oaV148Copy');
    if(copy&&!copy.classList.contains('oa-v154-hide'))copy.classList.add('oa-v154-hide');

    document.querySelectorAll('label').forEach(label=>{
      const text=label.textContent.trim();
      if((/^Planificado$/i.test(text)||/^Planificado por punto$/i.test(text)||/^U plan por punto$/i.test(text))&&!label.classList.contains('oa-v154-hide')){
        label.classList.add('oa-v154-hide');
      }
    });
  }

  function removeDuplicateEditors(){
    ['oaRecordSelectionCard','oaInlineGoRecord','oaV153SeeAtlas'].forEach(id=>{
      const node=$(id);
      if(node&&!node.classList.contains('oa-v154-hide'))node.classList.add('oa-v154-hide');
    });
    const pointEditor=document.querySelector('.oa-record-panel .oa-point-editor');
    if(pointEditor&&!pointEditor.classList.contains('oa-v154-hide'))pointEditor.classList.add('oa-v154-hide');
  }

  function renameAdministrationTerms(){
    replaceOwnText($('oaQuantity')?.closest('label'),'Cantidad administrada');
    const notes=$('oaProcedureNotes');
    if(notes&&notes.placeholder!=='Secuencia, lateralidad, asimetrías y observaciones')notes.placeholder='Secuencia, lateralidad, asimetrías y observaciones';
    setText(document.querySelector('.oa-record-heading p'),'Administración y volumen calculado por punto.');

    document.querySelectorAll('.oa-traffic-item').forEach(item=>{
      if(item.querySelector('.planned')&&!item.classList.contains('oa-v154-hide'))item.classList.add('oa-v154-hide');
    });

    document.querySelectorAll('span,strong,th').forEach(node=>{
      const value=node.textContent.trim();
      if(/^Cantidad prevista$/i.test(value))setText(node,'Cantidad administrada');
      if(/^Planificación$/i.test(value))setText(node,'Administración');
    });
  }

  function renameAdministrationFlow(){
    setText($('oaApplySelection'),'Administrar selección');
    setText($('oaV148Save'),'Guardar administración');

    const ids=document.querySelectorAll('#pointLayer .oa-point.multi-selected').length;
    setText($('oaV148Title'),ids>=2?'Administración conjunta':'Administración del punto');
    setText($('oaV148Subtitle'),ids>=2?'La cantidad se aplicará a todos los puntos seleccionados.':'Registra unidades y observaciones del punto.');
    setText($('oaV148Help'),ids>=2?'La cantidad administrada se aplicará individualmente a cada punto seleccionado.':'La ubicación y la cantidad pueden modificarse antes de guardar.');

    const adminInput=$('oaV148Admin');
    if(adminInput){
      if(adminInput.placeholder!=='Unidades administradas')adminInput.placeholder='Unidades administradas';
      replaceOwnText(adminInput.closest('label'),'Administrado');
    }

    const mapContext=$('oaInlineEditorContext');
    if(mapContext){
      setText(mapContext.querySelector('strong'),ids>=2?`Administración conjunta de ${ids} puntos`:'Administración directa del punto');
      setText(mapContext.querySelector('span'),'Este es el único formulario de tratamiento por punto.');
    }
  }

  function normalizeStatusToAdministration(){
    const status=$('oaV148Status');
    if(status){
      if(status.value!=='auto')status.value='auto';
      const label=status.closest('label');
      if(label&&!label.classList.contains('oa-v154-hide'))label.classList.add('oa-v154-hide');
    }
    const pointStatus=$('pointStatus');
    const pointLabel=pointStatus?.closest('label');
    if(pointLabel&&!pointLabel.classList.contains('oa-v154-hide'))pointLabel.classList.add('oa-v154-hide');
  }

  function simplifySummaryAndTable(){
    const table=document.querySelector('.oa-table-card table');
    if(table){
      const plannedHead=table.querySelector('thead th:nth-child(4)');
      if(plannedHead&&plannedHead.textContent)plannedHead.textContent='';
      const step=table.closest('.oa-table-card')?.querySelector('.oa-step-title');
      if(step)step.childNodes.forEach(node=>{
        if(node.nodeType===Node.TEXT_NODE&&/Plan de puntos/i.test(node.textContent))node.textContent=' Registro de puntos administrados';
      });
    }

    document.querySelectorAll('.oa-general-summary .oa-section-title').forEach(node=>{
      if(/Resumen general/i.test(node.textContent))setText(node,'Resumen de administración');
    });
  }

  function bindAdministrationSave(){
    const input=$('oaV148Admin');
    if(input&&!input.dataset.oaV154Bound){
      input.dataset.oaV154Bound='true';
      input.addEventListener('input',()=>{
        const status=$('oaV148Status');
        if(status&&status.value!=='auto')status.value='auto';
      });
    }
  }

  function updateVersion(){
    document.documentElement.classList.add('oa-admin-v154');
    if(document.documentElement.dataset.orionAestheticsVersion!==VERSION)document.documentElement.dataset.orionAestheticsVersion=VERSION;
    const expected=`ORION Armonización Orofacial V${VERSION}`;
    if(document.title!==expected)document.title=expected;
    document.querySelectorAll('.oa-version').forEach(node=>setText(node,`V${VERSION}`));
  }

  function refresh(){
    refreshQueued=false;
    updateVersion();
    removePlanningUI();
    removeDuplicateEditors();
    renameAdministrationTerms();
    normalizeStatusToAdministration();
    renameAdministrationFlow();
    simplifySummaryAndTable();
    bindAdministrationSave();
  }

  function queueRefresh(){
    if(refreshQueued)return;
    refreshQueued=true;
    requestAnimationFrame(refresh);
  }

  function observe(){
    if(observerMounted)return;
    observerMounted=true;
    new MutationObserver(queueRefresh).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class','hidden']});
  }

  function boot(){
    if(!$('atlasShell')||!$('pointLayer')){
      setTimeout(boot,100);
      return;
    }
    if(migrateAdministrationOnly()){
      location.reload();
      return;
    }
    refresh();
    observe();
    window.dispatchEvent(new Event('resize'));
  }

  boot();
})();
