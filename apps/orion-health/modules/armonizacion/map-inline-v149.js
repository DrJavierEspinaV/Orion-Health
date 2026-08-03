(()=>{
  'use strict';

  const PROCEDURE_KEY='orion_aesthetic_procedure_v145';
  const $=id=>document.getElementById(id);

  function loadState(){
    try{return JSON.parse(sessionStorage.getItem(PROCEDURE_KEY)||'null');}
    catch(_){return null;}
  }

  function selectionCount(){
    const multi=document.querySelectorAll('#pointLayer .oa-point.multi-selected').length;
    if(multi>0)return multi;
    const state=loadState();
    return state?.selectedPointId?1:0;
  }

  function syncSelectionMode(){
    const count=selectionCount();
    document.body.dataset.oaSelection=count>=2?'multi':count===1?'single':'none';

    const empty=$('emptyPoint');
    const fields=$('pointFields');
    if(count>=2){
      if(empty)empty.hidden=true;
      if(fields)fields.hidden=true;
    }

    const context=$('oaInlineEditorContext');
    if(context){
      const title=context.querySelector('strong');
      const detail=context.querySelector('span');
      if(count>=2){
        title.textContent=`Edición conjunta de ${count} puntos`;
        detail.textContent='Los valores ingresados se aplican a todos los puntos seleccionados.';
      }else if(count===1){
        title.textContent='Edición directa del punto';
        detail.textContent='Planificación, administración, estado y comentario sin abandonar el mapa.';
      }else{
        title.textContent='Editor del mapa';
        detail.textContent='Selecciona un punto o activa la selección múltiple.';
      }
    }
  }

  function mountInlineEditor(){
    const sheet=$('oaPointSheetV148');
    const bar=$('oaSelectionBar');
    const mapPanel=document.querySelector('.oa-map-panel');
    if(!sheet||!bar||!mapPanel)return false;

    sheet.classList.add('oa-inline-map-editor');

    if(!$('oaInlineEditorContext')){
      const context=document.createElement('div');
      context.id='oaInlineEditorContext';
      context.className='oa-inline-editor-context';
      context.innerHTML='<div><strong>Editor del mapa</strong><span>Selecciona un punto o activa la selección múltiple.</span></div><button type="button" id="oaInlineGoRecord">Editar desde Registro</button>';
      bar.insertAdjacentElement('afterend',context);
      $('oaInlineGoRecord').onclick=()=>{
        document.body.dataset.mobileTab='record';
        document.querySelectorAll('[data-mobile-tab]').forEach(button=>button.classList.toggle('active',button.dataset.mobileTab==='record'));
        window.scrollTo({top:0,behavior:'smooth'});
      };
    }

    const context=$('oaInlineEditorContext');
    context.insertAdjacentElement('afterend',sheet);

    const classObserver=new MutationObserver(()=>{
      syncSelectionMode();
      if(sheet.classList.contains('open')){
        requestAnimationFrame(()=>sheet.scrollIntoView({behavior:'smooth',block:'start'}));
      }
    });
    classObserver.observe(sheet,{attributes:true,attributeFilter:['class']});

    syncSelectionMode();
    return true;
  }

  function observeSelection(){
    const layer=$('pointLayer');
    const count=$('oaSelectionCount');
    if(layer){
      new MutationObserver(syncSelectionMode).observe(layer,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});
    }
    if(count){
      new MutationObserver(syncSelectionMode).observe(count,{childList:true,characterData:true,subtree:true});
    }
    document.addEventListener('click',()=>requestAnimationFrame(syncSelectionMode),true);
  }

  function boot(){
    if(!mountInlineEditor()){
      setTimeout(boot,100);
      return;
    }
    observeSelection();
  }

  boot();
})();
