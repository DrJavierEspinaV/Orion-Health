(()=>{
  'use strict';

  const selectedLab=new Set();
  const selectedImg=new Set();
  const byId=id=>document.getElementById(id);
  const sectionFor=kind=>byId(kind==='lab'?'printExamLab':'printExamImg');
  const buttonFor=kind=>byId(kind==='lab'?'btnExamOrderLab':'btnExamOrderImg');
  const selectedFor=kind=>kind==='lab'?selectedLab:selectedImg;

  function updateMirror(input){
    if(!input?.id) return;
    let set=null;
    if(input.id.startsWith('ex_lab_')) set=selectedLab;
    if(input.id.startsWith('ex_img_')) set=selectedImg;
    if(!set) return;
    if(input.checked) set.add(input.id);
    else set.delete(input.id);
  }

  function hideSection(kind){
    const section=sectionFor(kind);
    if(!section) return;
    section.classList.add('hidden');
    section.setAttribute('aria-hidden','true');
  }

  function runWithoutScrollAndRoutineAlerts(callback){
    const originalScroll=Element.prototype.scrollIntoView;
    const originalAlert=window.alert;
    Element.prototype.scrollIntoView=function(){};
    window.alert=function(message){
      const text=String(message||'');
      if(/Selecciona al menos 1 examen/i.test(text)) return;
      return originalAlert.call(window,message);
    };
    try{ callback(); }
    finally{
      Element.prototype.scrollIntoView=originalScroll;
      window.alert=originalAlert;
    }
  }

  function syncKind(kind){
    const set=selectedFor(kind);
    if(!set.size){
      hideSection(kind);
      return false;
    }
    const button=buttonFor(kind);
    if(!button) return false;
    runWithoutScrollAndRoutineAlerts(()=>button.click());
    return true;
  }

  function syncOrders(){
    const lab=syncKind('lab');
    const img=syncKind('img');
    try{ window.__orionUpdatePrintBreaks?.(); }catch(_){ }
    try{ window.dispatchEvent(new Event('resize')); }catch(_){ }
    return {lab,img,labCount:selectedLab.size,imgCount:selectedImg.size};
  }

  document.addEventListener('change',event=>{
    const target=event.target;
    if(target instanceof HTMLInputElement) updateMirror(target);
  },true);

  document.addEventListener('click',event=>{
    const target=event.target instanceof Element?event.target.closest('button,#examBackdrop'):null;
    if(!target) return;

    if(target.id==='btnExamClear'){
      selectedLab.clear();
      selectedImg.clear();
      return;
    }

    if(target.id==='btnExamClose'||target.id==='examBackdrop'){
      syncOrders();
      return;
    }

    if(['btnPrint','btnPdf','btnWA','orionClinicalTabPreview'].includes(target.id)){
      syncOrders();
    }
  },true);

  document.addEventListener('keydown',event=>{
    if(event.key==='Escape'&&!byId('examBackdrop')?.classList.contains('hidden')) syncOrders();
  },true);

  window.ORION_CMF_DOCS_V141={
    version:'1.4.1',
    syncOrders,
    getSelection:()=>({lab:[...selectedLab],img:[...selectedImg]})
  };
})();
