(()=>{
  'use strict';

  const VERSION='1.5.1';

  function exposeStandaloneMode(){
    document.documentElement.classList.toggle('oa-standalone',window.top===window.self);
    document.documentElement.dataset.orionAestheticsVersion=VERSION;
  }

  function registerStandaloneWorker(){
    if(window.top!==window.self||!('serviceWorker' in navigator))return;
    window.addEventListener('load',()=>{
      navigator.serviceWorker.register('./standalone-sw.js',{scope:'./'})
        .catch(error=>console.warn('ORION Armonización: service worker no disponible.',error));
    },{once:true});
  }

  function notifyParent(){
    if(window.parent===window)return;
    const target=location.origin==='null'?'*':location.origin;
    window.parent.postMessage({
      type:'ORION_MODULE_READY',
      module:'armonizacion',
      version:VERSION,
      height:Math.max(document.documentElement.scrollHeight,document.body?.scrollHeight||0)
    },target);
  }

  function watchHeight(){
    if(window.parent===window||!('ResizeObserver' in window))return;
    let previous=0;
    const observer=new ResizeObserver(()=>{
      const height=Math.max(document.documentElement.scrollHeight,document.body?.scrollHeight||0);
      if(Math.abs(height-previous)<24)return;
      previous=height;
      notifyParent();
    });
    observer.observe(document.documentElement);
  }

  exposeStandaloneMode();
  registerStandaloneWorker();
  requestAnimationFrame(()=>{
    notifyParent();
    watchHeight();
  });
})();
