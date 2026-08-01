(()=>{
  'use strict';

  const get=(id)=>document.getElementById(id);

  function currentScale(){
    const value=Number((get('v14ZoomValue')?.textContent||'100').replace(/[^0-9.]/g,''));
    return Number.isFinite(value)&&value>0?value/100:1;
  }

  function synchronizeLayers(){
    const portrait=get('v14Portrait');
    const overlay=get('v14PortraitStage');
    if(!portrait||!overlay)return false;
    const scale=currentScale();
    const transform=`scale(${scale})`;
    portrait.style.transform=transform;
    overlay.style.transform=transform;
    portrait.style.transformOrigin='center top';
    overlay.style.transformOrigin='center top';
    return true;
  }

  function bind(){
    const stage=document.querySelector('.v14-portrait-stage');
    const portrait=get('v14Portrait');
    const overlay=get('v14PortraitStage');
    if(!stage||!portrait||!overlay)return false;

    ['v14ZoomIn','v14ZoomOut','v14CenterBtn','v14CenterBtn2'].forEach(id=>{
      get(id)?.addEventListener('click',()=>requestAnimationFrame(synchronizeLayers));
    });
    ['v14Model_woman','v14Model_man'].forEach(id=>{
      get(id)?.addEventListener('click',()=>requestAnimationFrame(synchronizeLayers));
    });

    const observer=new MutationObserver(synchronizeLayers);
    const zoom=get('v14ZoomValue');
    if(zoom)observer.observe(zoom,{childList:true,characterData:true,subtree:true});

    const resizeObserver='ResizeObserver' in window?new ResizeObserver(synchronizeLayers):null;
    resizeObserver?.observe(stage);

    synchronizeLayers();
    return true;
  }

  if(!bind()){
    const observer=new MutationObserver(()=>{
      if(bind())observer.disconnect();
    });
    observer.observe(document.documentElement,{childList:true,subtree:true});
  }
})();
