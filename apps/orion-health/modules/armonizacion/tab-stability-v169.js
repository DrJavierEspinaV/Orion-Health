(()=>{
  'use strict';

  const VERSION='1.6.9';
  const PROCEDURE_KEY='orion_aesthetic_procedure_v145';
  const $=id=>document.getElementById(id);
  let protectedTab='';
  let explicitTabChangeUntil=0;
  let restoring=false;

  function saveTab(tab){
    try{
      const state=JSON.parse(sessionStorage.getItem(PROCEDURE_KEY)||'{}');
      if(state.mobileTab===tab)return;
      state.mobileTab=tab;
      sessionStorage.setItem(PROCEDURE_KEY,JSON.stringify(state));
    }catch(_){}
  }

  function activate(tab){
    if(restoring||!tab)return;
    restoring=true;
    document.body.dataset.mobileTab=tab;
    document.querySelectorAll('[data-mobile-tab]').forEach(button=>{
      button.classList.toggle('active',button.dataset.mobileTab===tab);
    });
    saveTab(tab);
    requestAnimationFrame(()=>{restoring=false;});
  }

  function panelTab(node){
    if(!node?.closest)return '';
    if(node.closest('.oa-record-panel,#recordPanel,[data-tab-panel="record"]'))return 'record';
    if(node.closest('.oa-summary-panel,#summaryPanel,[data-tab-panel="summary"]'))return 'summary';
    if(node.closest('.oa-map-panel,#mapPanel,[data-tab-panel="map"]'))return 'map';
    return '';
  }

  function protectFromInteraction(event){
    const tab=panelTab(event.target);
    if(tab!=='record'&&tab!=='summary')return;
    protectedTab=tab;
    explicitTabChangeUntil=0;
    if(document.body.dataset.mobileTab!==tab)activate(tab);
  }

  function bindTabs(){
    document.querySelectorAll('[data-mobile-tab]').forEach(button=>{
      if(button.dataset.oaV169Bound)return;
      button.dataset.oaV169Bound='true';
      button.addEventListener('pointerdown',()=>{
        explicitTabChangeUntil=Date.now()+1600;
        protectedTab='';
      },true);
      button.addEventListener('click',()=>{
        const tab=button.dataset.mobileTab;
        protectedTab=tab==='record'||tab==='summary'?tab:'';
        setTimeout(()=>activate(tab),0);
      },true);
    });
  }

  function observeTab(){
    new MutationObserver(()=>{
      if(restoring||Date.now()<explicitTabChangeUntil||!protectedTab)return;
      if(document.body.dataset.mobileTab!==protectedTab)activate(protectedTab);
    }).observe(document.body,{attributes:true,attributeFilter:['data-mobile-tab']});
  }

  function updateVersion(){
    document.documentElement.dataset.orionAestheticsVersion=VERSION;
    document.title=`ORION Armonización Orofacial V${VERSION}`;
    document.querySelectorAll('.oa-version').forEach(node=>{node.textContent=`V${VERSION}`;});
  }

  function boot(){
    if(!document.querySelector('[data-mobile-tab]')||!document.querySelector('.oa-record-panel')){
      setTimeout(boot,90);
      return;
    }
    updateVersion();
    bindTabs();
    document.addEventListener('focusin',protectFromInteraction,true);
    document.addEventListener('input',protectFromInteraction,true);
    document.addEventListener('change',protectFromInteraction,true);
    document.addEventListener('pointerdown',protectFromInteraction,true);
    protectedTab=document.body.dataset.mobileTab==='record'||document.body.dataset.mobileTab==='summary'?document.body.dataset.mobileTab:'';
    observeTab();
  }

  boot();
})();
