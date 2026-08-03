(()=>{
  'use strict';

  const VERSION='1.5.4';
  const KEY='orion_aesthetic_procedure_v145';
  const MIGRATION_KEY='orion_aesthetic_admin_only_v154';
  const $=id=>document.getElementById(id);
  let observerMounted=false;

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
    if(label)label.classList.add('oa-v154-hide');
  }

  function removePlanningUI(){
    ['oaV148Plan','pointPlanned','bulkPlan'].forEach(hideClosestLabel);
    ['zonePlanned','zonePlannedPoints','totalPlanned'].forEach(id=>{
      const node=$(id);
      if(node)node.closest('div')?.classList.add('oa-v154-hide');
    });

    const copy=$('oaV148Copy');
    if(copy)copy.classList.add('oa-v154-hide');

    document.querySelectorAll('label').forEach(label=>{
      const text=label.textContent.trim();
      if(/^Planificado$/i.test(text)||/^Planificado por punto$/i.test(text)||/^U plan por punto$/i.test(text)){
        label.classList.add('oa-v154-hide');
      }
    });
  }

  function removeDuplicateEditors(){
    $('oaRecordSelectionCard')?.classList.add('oa-v154-hide');
    document.querySelector('.oa-record-panel .oa-point-editor')?.classList.add('oa-v154-hide');
  }

  function renameAdministrationFlow(){
    const apply=$('oaApplySelection');
    if(apply)apply.textContent='Administrar selección';

    const save=$('oaV148Save');
    if(save)save.textContent='Guardar administración';

    const title=$('oaV148Title');
    const subtitle=$('oaV148Subtitle');
    const help=$('oaV148Help');
    const ids=document.querySelectorAll('#pointLayer .oa-point.multi-selected').length;

    if(title)title.textContent=ids>=2?'Administración conjunta':'Administración del punto';
    if(subtitle)subtitle.textContent=ids>=2?'La cantidad se aplicará a todos los puntos seleccionados.':'Registra unidades y observaciones del punto.';
    if(help)help.textContent=ids>=2?'La cantidad administrada se aplicará individualmente a cada punto seleccionado.':'La ubicación y la cantidad pueden modificarse antes de guardar.';

    const adminInput=$('oaV148Admin');
    if(adminInput){
      adminInput.placeholder='Unidades administradas';
      const label=adminInput.closest('label');
      if(label){
        const textNode=Array.from(label.childNodes).find(node=>node.nodeType===Node.TEXT_NODE&&node.textContent.trim());
        if(textNode)textNode.textContent='Administrado';
      }
    }

    const mapContext=$('oaInlineEditorContext');
    if(mapContext){
      const strong=mapContext.querySelector('strong');
      const detail=mapContext.querySelector('span');
      if(strong)strong.textContent=ids>=2?`Administración conjunta de ${ids} puntos`:'Administración directa del punto';
      if(detail)detail.textContent='Este es el único formulario de tratamiento por punto.';
    }
  }

  function normalizeStatusToAdministration(){
    const status=$('oaV148Status');
    if(status){
      status.value='auto';
      status.closest('label')?.classList.add('oa-v154-hide');
    }
    const pointStatus=$('pointStatus');
    if(pointStatus)pointStatus.closest('label')?.classList.add('oa-v154-hide');
  }

  function simplifySummaryAndTable(){
    const table=document.querySelector('.oa-table-card table');
    if(table){
      const plannedHead=table.querySelector('thead th:nth-child(4)');
      if(plannedHead)plannedHead.textContent='';
      const step=table.closest('.oa-table-card')?.querySelector('.oa-step-title');
      if(step)step.childNodes.forEach(node=>{
        if(node.nodeType===Node.TEXT_NODE&&/Plan de puntos/i.test(node.textContent))node.textContent=' Registro de puntos administrados';
      });
    }

    document.querySelectorAll('.oa-general-summary .oa-section-title').forEach(node=>{
      if(/Resumen general/i.test(node.textContent))node.textContent='Resumen de administración';
    });
  }

  function bindAdministrationSave(){
    const input=$('oaV148Admin');
    if(input&&!input.dataset.oaV154Bound){
      input.dataset.oaV154Bound='true';
      input.addEventListener('input',()=>{
        const status=$('oaV148Status');
        if(status)status.value='auto';
      });
    }
  }

  function updateVersion(){
    document.documentElement.classList.add('oa-admin-v154');
    document.documentElement.dataset.orionAestheticsVersion=VERSION;
    document.title=`ORION Armonización Orofacial V${VERSION}`;
    document.querySelectorAll('.oa-version').forEach(node=>{node.textContent=`V${VERSION}`;});
  }

  function refresh(){
    updateVersion();
    removePlanningUI();
    removeDuplicateEditors();
    normalizeStatusToAdministration();
    renameAdministrationFlow();
    simplifySummaryAndTable();
    bindAdministrationSave();
  }

  function observe(){
    if(observerMounted)return;
    observerMounted=true;
    new MutationObserver(()=>requestAnimationFrame(refresh)).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class','hidden']});
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
