(()=>{
  'use strict';

  const byId=id=>document.getElementById(id);

  function resolveMobileViewportHeight(){
    const ownVisual=Math.round(window.visualViewport?.height||0);
    let parentHeight=0;
    let parentVisual=0;
    try{
      if(window.parent&&window.parent!==window){
        parentHeight=Math.round(window.parent.innerHeight||0);
        parentVisual=Math.round(window.parent.visualViewport?.height||0);
      }
    }catch(_){ }
    const candidates=[ownVisual,parentVisual,parentHeight,Math.round(window.innerHeight||0)].filter(value=>value>=480);
    return candidates.length?Math.min(...candidates):Math.max(560,Math.round(window.innerHeight||0));
  }

  function setMobileViewport(){
    const height=resolveMobileViewportHeight();
    document.documentElement.style.setProperty('--orion-mobile-viewport-h',`${height}px`);
    document.documentElement.dataset.orionMobileViewport=String(height);
    return height;
  }

  function decorateDocumentControls(){
    const certButton=byId('btnDocCert');
    const row=certButton?.closest('.mb-4.flex.items-center.justify-between.gap-3');
    if(row){
      row.classList.add('orion-doc-type-controls');
      const actions=Array.from(row.children).find(child=>child!==row.querySelector('h2'));
      actions?.classList.add('orion-doc-actions');
      byId('fechaCertificado')?.parentElement?.classList.add('orion-doc-meta-field');
      byId('reposoDias')?.parentElement?.classList.add('orion-doc-meta-field');
    }

    const modeRow=byId('modoPlant')?.closest('.flex.gap-2.mb-4');
    modeRow?.classList.add('orion-mode-switch');
  }

  function installTouchDrag(area){
    if(!area||area.dataset.orionTouchDrag==='1') return;
    area.dataset.orionTouchDrag='1';

    let active=false;
    let dragging=false;
    let startY=0;
    let startScroll=0;

    area.addEventListener('touchstart',event=>{
      if(event.touches.length!==1) return;
      active=true;
      dragging=false;
      startY=event.touches[0].clientY;
      startScroll=area.scrollTop;
    },{passive:true});

    area.addEventListener('touchmove',event=>{
      if(!active||event.touches.length!==1) return;
      const delta=startY-event.touches[0].clientY;
      if(!dragging&&Math.abs(delta)<5) return;
      dragging=true;
      area.scrollTop=startScroll+delta;
      event.preventDefault();
    },{passive:false});

    const stop=()=>{active=false;dragging=false;};
    area.addEventListener('touchend',stop,{passive:true});
    area.addEventListener('touchcancel',stop,{passive:true});
  }

  function arrangeExamDrawer(){
    const drawer=byId('examDrawer');
    if(!drawer) return;

    setMobileViewport();
    const scrollArea=Array.from(drawer.children).find(child=>child.classList.contains('space-y-3')&&child.classList.contains('grow'));
    const actionBar=Array.from(drawer.children).find(child=>child.classList.contains('border-t'));
    const firstPanel=byId('examPanelLab');

    if(scrollArea){
      scrollArea.classList.add('orion-exam-scroll-area');
      installTouchDrag(scrollArea);
    }

    if(scrollArea&&actionBar&&firstPanel&&actionBar.parentElement===drawer){
      actionBar.classList.add('orion-exam-actions-top');
      scrollArea.insertBefore(actionBar,firstPanel);
    }else if(actionBar){
      actionBar.classList.add('orion-exam-actions-top');
    }

    const close=byId('btnExamClose');
    if(close) close.title='Cerrar y cargar automáticamente las órdenes seleccionadas';
  }

  function apply(){
    setMobileViewport();
    decorateDocumentControls();
    arrangeExamDrawer();
  }

  const refreshViewport=()=>setMobileViewport();
  window.addEventListener('resize',refreshViewport,{passive:true});
  window.visualViewport?.addEventListener('resize',refreshViewport,{passive:true});
  try{window.parent?.addEventListener?.('resize',refreshViewport,{passive:true});}catch(_){ }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',apply,{once:true});
  else apply();

  window.ORION_CMF_MOBILE_V142={
    version:'1.4.2',
    apply,
    setMobileViewport,
    touchScroll:'manual+native',
    examActions:'below-tabs',
    viewport:'parent-aware'
  };
})();
