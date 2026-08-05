(()=>{
  'use strict';

  const VERSION='1.6.10';
  const MODEL_KEY='orion_aesthetic_model_v165';
  const LEGACY_MODEL_KEY='orion_aesthetic_model_v164';
  const $=id=>document.getElementById(id);
  let femaleSource='';

  function toast(message){
    const node=$('toast');
    if(!node)return;
    node.textContent=message;
    node.classList.add('show');
    clearTimeout(toast.timer);
    toast.timer=setTimeout(()=>node.classList.remove('show'),2400);
  }

  function resolveFemale(){
    femaleSource=window.ORION_ANATOMY_ATLAS_FEMALE||$('atlasImage')?.src||'';
  }

  function setWomanState(){
    sessionStorage.setItem(MODEL_KEY,'woman');
    sessionStorage.setItem(LEGACY_MODEL_KEY,'woman');
    document.documentElement.dataset.oaModel='woman';
    document.documentElement.dataset.oaModelV165='woman';
    document.documentElement.dataset.oaModelV167='woman';
    document.documentElement.dataset.oaModelV168='woman';

    document.querySelectorAll('[data-oa-v164-model]').forEach(button=>{
      const isWoman=button.dataset.oaV164Model==='woman';
      button.classList.toggle('active',isWoman);
      button.setAttribute('aria-pressed',String(isWoman));
      if(!isWoman){
        button.setAttribute('aria-disabled','true');
        button.title='Atlas masculino definitivo pendiente de integración.';
      }
    });

    const image=$('atlasImage');
    if(image&&femaleSource&&image.src!==femaleSource){
      image.src=femaleSource;
      image.alt='Atlas clínico anatómico femenino frontal';
    }
  }

  function addWarning(){
    const switcher=$('oaV164ModelSwitch');
    if(!switcher||document.querySelector('.oa-v168-atlas-warning'))return;
    const note=document.createElement('div');
    note.className='oa-v168-atlas-warning';
    note.textContent='Modelo Hombre pendiente de atlas anatómico masculino definitivo. El flujo clínico permanece disponible con el modelo Mujer.';
    switcher.insertAdjacentElement('afterend',note);
  }

  function removeRecordMap(){
    const record=document.querySelector('.oa-record-panel,.oa-mobile-record');
    if(!record)return;
    const card=record.querySelector('#oaV160FinalMap,.oa-v160-final-map-card');
    if(card)card.remove();
  }

  function interceptMale(){
    window.addEventListener('click',event=>{
      const button=event.target.closest?.('[data-oa-v164-model="man"]');
      if(!button)return;
      event.preventDefault();
      event.stopImmediatePropagation();
      setWomanState();
      toast('Modelo Hombre aún no está disponible. Se mantiene el atlas Mujer validado.');
    },true);
  }

  function observeRecordOnly(){
    const record=document.querySelector('.oa-record-panel,.oa-mobile-record');
    if(!record)return;
    const observer=new MutationObserver(()=>removeRecordMap());
    observer.observe(record,{childList:true,subtree:true});
  }

  function boot(){
    if(!$('atlasImage')||!document.querySelector('[data-oa-v164-model]')){
      setTimeout(boot,90);
      return;
    }
    document.documentElement.classList.add('oa-v168-safe');
    document.documentElement.dataset.orionAestheticsVersion=VERSION;
    document.title=`ORION Armonización Orofacial V${VERSION}`;
    document.querySelectorAll('.oa-version').forEach(node=>node.textContent=`V${VERSION}`);
    resolveFemale();
    setWomanState();
    addWarning();
    removeRecordMap();
    interceptMale();
    observeRecordOnly();
  }

  boot();
})();
