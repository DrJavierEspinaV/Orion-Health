(()=>{
  'use strict';
  const LEGACY_KEY='orion_aesthetic_model_v164';
  const ACTIVE_KEY='orion_aesthetic_model_v165';

  const legacy=sessionStorage.getItem(LEGACY_KEY);
  if((legacy==='man'||legacy==='woman')&&!sessionStorage.getItem(ACTIVE_KEY)){
    sessionStorage.setItem(ACTIVE_KEY,legacy);
  }

  /* La capa V1.6.5 controla ambos atlas. Mantener la clave heredada en mujer
     evita que el observador V1.6.5 anterior vuelva a sustituir el atlas masculino. */
  sessionStorage.setItem(LEGACY_KEY,'woman');

  new MutationObserver(()=>{
    const selected=document.documentElement.dataset.oaModelV165;
    if(selected==='man'||selected==='woman'){
      sessionStorage.setItem(ACTIVE_KEY,selected);
      sessionStorage.setItem(LEGACY_KEY,'woman');
    }
  }).observe(document.documentElement,{attributes:true,attributeFilter:['data-oa-model-v165']});
})();
