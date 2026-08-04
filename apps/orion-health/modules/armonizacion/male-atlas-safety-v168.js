(()=>{
  'use strict';

  const VERSION='1.6.8';
  const MODEL_KEY='orion_aesthetic_model_v165';
  const LEGACY_MODEL_KEY='orion_aesthetic_model_v164';
  const $=id=>document.getElementById(id);
  let femaleSource='';
  let applying=false;

  const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));

  async function resolveFemale(){
    for(let i=0;i<50;i++){
      const source=window.ORION_ANATOMY_ATLAS_FEMALE||$('atlasImage')?.src||'';
      if(source&&source.startsWith('data:image')){femaleSource=source;return source;}
      await wait(80);
    }
    femaleSource=$('atlasImage')?.src||'';
    return femaleSource;
  }

  function toast(message){
    const node=$('toast');
    if(!node)return;
    node.textContent=message;
    node.classList.add('show');
    clearTimeout(toast.timer);
    toast.timer=setTimeout(()=>node.classList.remove('show'),2600);
  }

  function forceWoman(){
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
        button.title='Atlas masculino definitivo pendiente de aprobación clínica y visual.';
      }
    });

    const image=$('atlasImage');
    if(image&&femaleSource&&image.src!==femaleSource){
      applying=true;
      image.src=femaleSource;
      image.alt='Atlas clínico anatómico femenino frontal';
      requestAnimationFrame(()=>{applying=false;});
    }
  }

  function addWarning(){
    const switcher=$('oaV164ModelSwitch');
    if(!switcher||document.querySelector('.oa-v168-atlas-warning'))return;
    const note=document.createElement('div');
    note.className='oa-v168-atlas-warning';
    note.textContent='Modelo Hombre temporalmente desactivado: no se publicará hasta disponer de un atlas anatómico masculino independiente, limpio y homologado con el modelo Mujer.';
    switcher.insertAdjacentElement('afterend',note);
  }

  function removeRecordMap(){
    document.querySelectorAll('h1,h2,h3,strong').forEach(title=>{
      if(title.textContent.trim()!=='Mapa final del procedimiento')return;
      const card=title.closest('section,.oa-card,.oa-v160-final-map,.oa-v160-final-map-card,article,div');
      if(!card)return;
      if(card.closest('.oa-v162-page,.page,[data-tab-panel="summary"],.oa-summary-panel'))return;
      if(card.closest('.oa-record-panel,#recordPanel,[data-tab-panel="record"],#tabRecord')||!card.closest('.oa-map-panel'))card.classList.add('oa-v168-hide-record-map');
    });
  }

  function interceptMale(){
    window.addEventListener('click',event=>{
      const button=event.target.closest?.('[data-oa-v164-model="man"]');
      if(!button)return;
      event.preventDefault();
      event.stopImmediatePropagation();
      forceWoman();
      toast('Modelo Hombre pendiente de atlas anatómico definitivo. Se mantiene Mujer para evitar documentación incorrecta.');
    },true);
  }

  function patchReport(){
    if(window.__oaV168ReportPatched)return;
    window.__oaV168ReportPatched=true;
    const originalOpen=window.open.bind(window);
    window.open=(...args)=>{
      const popup=originalOpen(...args);
      if(!popup?.document)return popup;
      const originalWrite=popup.document.write.bind(popup.document);
      popup.document.write=html=>{
        const source=femaleSource||$('atlasImage')?.src||'';
        let output=String(html);
        output=output.replace(/(<div class="atlas )(?:man|woman)(">)/g,'$1woman$2');
        output=output.replace(/(<div class="atlas (?:man|woman)"><img src=")[^"]+(" alt="Atlas [^"]+">)/g,`$1${source}$2`);
        output=output.replace(/<div class="value">Hombre<\/div>/g,'<div class="value">Mujer</div>');
        output=output.replace(/Modelo:\s*Hombre/gi,'Modelo: Mujer');
        return originalWrite(output);
      };
      return popup;
    };
  }

  function observe(){
    new MutationObserver(()=>requestAnimationFrame(()=>{
      addWarning();removeRecordMap();forceWoman();
    })).observe(document.body,{subtree:true,childList:true});

    const image=$('atlasImage');
    if(image)new MutationObserver(()=>{
      if(!applying&&femaleSource&&image.src!==femaleSource)forceWoman();
    }).observe(image,{attributes:true,attributeFilter:['src']});
  }

  async function boot(){
    if(!$('atlasImage')||!document.querySelector('[data-oa-v164-model]')){setTimeout(boot,90);return;}
    document.documentElement.classList.add('oa-v168-safe');
    document.documentElement.dataset.orionAestheticsVersion=VERSION;
    document.title=`ORION Armonización Orofacial V${VERSION}`;
    document.querySelectorAll('.oa-version').forEach(node=>node.textContent=`V${VERSION}`);
    await resolveFemale();
    forceWoman();addWarning();removeRecordMap();interceptMale();patchReport();observe();
  }

  boot();
})();
