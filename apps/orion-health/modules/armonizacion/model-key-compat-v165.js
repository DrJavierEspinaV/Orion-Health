(()=>{
  'use strict';
  const OLD_KEY='orion_aesthetic_model_v164';
  const NEW_KEY='orion_aesthetic_model_v165';
  const current=sessionStorage.getItem(OLD_KEY);
  if((current==='man'||current==='woman')&&!sessionStorage.getItem(NEW_KEY))sessionStorage.setItem(NEW_KEY,current);
  new MutationObserver(()=>{
    const model=document.documentElement.dataset.oaModelV165;
    if(model==='man'||model==='woman')sessionStorage.setItem(OLD_KEY,model);
  }).observe(document.documentElement,{attributes:true,attributeFilter:['data-oa-model-v165']});
})();
