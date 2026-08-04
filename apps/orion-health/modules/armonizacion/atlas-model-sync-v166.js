(()=>{
  'use strict';

  const VERSION='1.6.6';
  const MODEL_KEY='orion_aesthetic_model_v165';
  const LEGACY_MODEL_KEY='orion_aesthetic_model_v164';
  const WOMAN_FALLBACK='https://images.pexels.com/photos/32758452/pexels-photo-32758452.jpeg?auto=compress&cs=tinysrgb&w=1200';
  const MAN_ATLAS='https://upload.wikimedia.org/wikipedia/commons/c/c2/1106_Front_Views_of_the_Muscles_of_Facial_Expressions.jpg';
  const $=id=>document.getElementById(id);

  let enforcing=false;
  let observerReady=false;

  function currentModel(){
    return sessionStorage.getItem(MODEL_KEY)==='man'?'man':'woman';
  }

  function womanAtlas(){
    return window.ORION_ANATOMY_ATLAS_FEMALE||WOMAN_FALLBACK;
  }

  function atlasFor(model=currentModel()){
    return model==='man'?MAN_ATLAS:womanAtlas();
  }

  function syncButtons(model){
    document.querySelectorAll('[data-oa-v164-model]').forEach(button=>{
      const active=button.dataset.oaV164Model===model;
      button.classList.toggle('active',active);
      button.setAttribute('aria-pressed',String(active));
    });
  }

  function applyModel(model=currentModel(),notify=false){
    const selected=model==='man'?'man':'woman';
    const image=$('atlasImage');

    sessionStorage.setItem(MODEL_KEY,selected);
    sessionStorage.setItem(LEGACY_MODEL_KEY,selected);
    document.documentElement.dataset.oaModelV165=selected;
    document.documentElement.dataset.oaModel=selected;
    document.documentElement.dataset.oaModelV166=selected;
    syncButtons(selected);

    if(image){
      const source=atlasFor(selected);
      enforcing=true;
      if(image.src!==source)image.src=source;
      image.alt=selected==='man'
        ?'Atlas anatómico masculino frontal de musculatura facial y cervical'
        :'Atlas anatómico femenino frontal de musculatura facial y cervical';
      image.style.setProperty('width','100%','important');
      image.style.setProperty('height','100%','important');
      image.style.setProperty('object-fit','cover','important');
      image.style.setProperty('object-position',selected==='man'?'20% top':'center top','important');
      requestAnimationFrame(()=>{enforcing=false;});
    }

    if(notify&&$('toast')){
      $('toast').textContent=selected==='man'
        ?'Modelo Hombre: atlas anatómico masculino activado en mapa e informe.'
        :'Modelo Mujer: atlas anatómico femenino activado en mapa e informe.';
      $('toast').classList.add('show');
      clearTimeout(applyModel.timer);
      applyModel.timer=setTimeout(()=>$('toast')?.classList.remove('show'),2100);
    }
  }

  function interceptModelChoice(){
    window.addEventListener('click',event=>{
      const button=event.target.closest?.('[data-oa-v164-model]');
      if(!button)return;
      const selected=button.dataset.oaV164Model==='man'?'man':'woman';
      setTimeout(()=>applyModel(selected,true),0);
    },true);
  }

  function patchReportWindow(){
    if(window.__oaV166WindowPatched)return;
    window.__oaV166WindowPatched=true;
    const originalOpen=window.open.bind(window);

    window.open=(...args)=>{
      const popup=originalOpen(...args);
      if(!popup?.document)return popup;
      const originalWrite=popup.document.write.bind(popup.document);
      popup.document.write=html=>{
        const selected=currentModel();
        const source=atlasFor(selected);
        let output=String(html);
        output=output.replace(
          /(<div class="atlas (?:man|woman)"><img src=")[^"]+(" alt="Atlas [^"]+">)/,
          `$1${source}$2`
        );
        output=output.replace(
          /(<div class="atlas )(?:man|woman)(">)/,
          `$1${selected}$2`
        );
        output=output.replace(/Modelo anatómico masculino alineado\./g,'Atlas anatómico masculino frontal.');
        return originalWrite(output);
      };
      return popup;
    };
  }

  function observe(){
    if(observerReady)return;
    observerReady=true;

    new MutationObserver(()=>{
      if(enforcing)return;
      applyModel(currentModel(),false);
    }).observe(document.documentElement,{attributes:true,attributeFilter:['data-oa-model-v165','data-oa-model']});

    const image=$('atlasImage');
    if(image){
      new MutationObserver(()=>{
        if(enforcing)return;
        const expected=atlasFor(currentModel());
        if(image.src!==expected)applyModel(currentModel(),false);
      }).observe(image,{attributes:true,attributeFilter:['src']});
    }
  }

  function addAttribution(){
    const note=document.querySelector('.oa-v164-model-note');
    if(note&&!note.querySelector('.oa-v166-attribution')){
      const credit=document.createElement('small');
      credit.className='oa-v166-attribution';
      credit.textContent=' Modelo Hombre: adaptación frontal de OpenStax Anatomy & Physiology, CC BY 4.0.';
      note.append(credit);
    }
  }

  function updateVersion(){
    document.documentElement.dataset.orionAestheticsVersion=VERSION;
    document.title=`ORION Armonización Orofacial V${VERSION}`;
    document.querySelectorAll('.oa-version').forEach(node=>{node.textContent=`V${VERSION}`;});
  }

  function boot(){
    if(!$('atlasImage')||!document.querySelector('[data-oa-v164-model]')){
      setTimeout(boot,80);
      return;
    }
    updateVersion();
    interceptModelChoice();
    patchReportWindow();
    addAttribution();
    applyModel(currentModel(),false);
    observe();
  }

  boot();
})();
