(()=>{
  'use strict';

  const PROCEDURE_KEY='orion_aesthetic_procedure_v145';
  const $=id=>document.getElementById(id);
  let scale=1;

  function clamp(value,min,max){return Math.max(min,Math.min(max,value));}

  function resetLegacyZoom(){
    try{
      const state=JSON.parse(sessionStorage.getItem(PROCEDURE_KEY)||'null');
      if(state&&typeof state==='object'){
        state.zoom=1;
        sessionStorage.setItem(PROCEDURE_KEY,JSON.stringify(state));
      }
    }catch(_){/* sesión no disponible */}
  }

  function updateView(next,{announce=false}={}){
    scale=clamp(Number(next)||1,.8,1.35);
    const root=document.documentElement;
    root.style.setProperty('--oa-map-scale',String(scale));
    const value=$('oaV150ScaleValue');
    if(value)value.textContent=`${Math.round(scale*100)} %`;
    if(announce){
      const live=$('oaV150ViewLive');
      if(live)live.textContent=`Vista del mapa ajustada a ${Math.round(scale*100)} por ciento.`;
    }
  }

  function fitView(announce=false){
    updateView(1,{announce});
    const shell=$('atlasShell');
    if(shell){
      shell.scrollLeft=0;
      shell.scrollTop=0;
    }
  }

  function intercept(button,action){
    if(!button)return;
    button.addEventListener('click',event=>{
      event.preventDefault();
      event.stopImmediatePropagation();
      action();
    },true);
  }

  function mountStatus(){
    const footer=document.querySelector('.oa-map-footer');
    if(!footer||$('oaV150ViewStatus'))return;
    const status=document.createElement('div');
    status.id='oaV150ViewStatus';
    status.className='oa-v150-view-status';
    status.innerHTML='<span>Escala estable: <strong id="oaV150ScaleValue">100 %</strong></span><button type="button" id="oaV150Fit">Ajustar vista</button><span id="oaV150ViewLive" class="sr-only" aria-live="polite"></span>';
    footer.insertAdjacentElement('afterend',status);
    $('oaV150Fit').addEventListener('click',()=>fitView(true));
  }

  function bindControls(){
    intercept($('btnFit'),()=>fitView(true));
    intercept($('btnZoomIn'),()=>updateView(scale+.1,{announce:true}));
    intercept($('btnZoomOut'),()=>updateView(scale-.1,{announce:true}));

    const shell=$('atlasShell');
    if(shell){
      shell.addEventListener('dblclick',event=>event.preventDefault(),{passive:false});
      shell.addEventListener('wheel',event=>{
        if(event.ctrlKey)event.preventDefault();
      },{passive:false});
    }
  }

  function ensureImageVisible(){
    const image=$('atlasImage');
    const transform=$('atlasTransform');
    const shell=$('atlasShell');
    if(!image||!transform||!shell)return;

    transform.hidden=false;
    transform.style.visibility='visible';
    transform.style.opacity='1';
    image.hidden=false;
    image.style.visibility='visible';
    image.style.opacity='1';

    if(!image.getAttribute('src')){
      const live=$('oaV150ViewLive');
      if(live)live.textContent='La imagen anatómica aún no está disponible.';
    }
  }

  function bindImage(){
    const image=$('atlasImage');
    if(!image)return;
    const ready=()=>{
      fitView(false);
      ensureImageVisible();
    };
    if(image.complete)requestAnimationFrame(ready);
    image.addEventListener('load',ready,{once:false});
  }

  function observeViewport(){
    const shell=$('atlasShell');
    if(!shell||!('ResizeObserver' in window))return;
    let lastWidth=0;
    let lastHeight=0;
    const observer=new ResizeObserver(entries=>{
      const rect=entries[0]?.contentRect;
      if(!rect)return;
      const meaningful=Math.abs(rect.width-lastWidth)>80||Math.abs(rect.height-lastHeight)>120;
      lastWidth=rect.width;
      lastHeight=rect.height;
      ensureImageVisible();
      if(meaningful&&scale===1)requestAnimationFrame(()=>fitView(false));
    });
    observer.observe(shell);
  }

  function boot(){
    if(!$('atlasShell')||!$('atlasTransform')||!$('atlasImage')){
      setTimeout(boot,100);
      return;
    }
    document.documentElement.classList.add('oa-viewport-v150');
    resetLegacyZoom();
    mountStatus();
    bindControls();
    bindImage();
    observeViewport();
    fitView(false);
    ensureImageVisible();
  }

  boot();
})();
