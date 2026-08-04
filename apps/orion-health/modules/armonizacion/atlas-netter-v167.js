(()=>{
  'use strict';

  const VERSION='1.6.7';
  const MODEL_KEY='orion_aesthetic_model_v165';
  const LEGACY_MODEL_KEY='orion_aesthetic_model_v164';
  const $=id=>document.getElementById(id);
  let femaleSource='';
  let maleSource='';
  let buildingMale=null;
  let applying=false;
  let observersReady=false;

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

  function model(){return sessionStorage.getItem(MODEL_KEY)==='man'?'man':'woman';}

  function buildMale(source){
    if(maleSource)return Promise.resolve(maleSource);
    if(buildingMale)return buildingMale;
    buildingMale=new Promise(resolve=>{
      const image=new Image();
      image.onload=()=>{
        const width=image.naturalWidth||900;
        const height=image.naturalHeight||1200;
        const canvas=document.createElement('canvas');
        canvas.width=width;canvas.height=height;
        const context=canvas.getContext('2d',{alpha:false});
        context.fillStyle='#f7f2ec';context.fillRect(0,0,width,height);
        context.filter='contrast(1.035) saturate(1.02) brightness(.99)';
        const slice=Math.max(2,Math.round(height/360));
        for(let y=0;y<height;y+=slice){
          const ratio=y/height;
          let scale=1.035;
          if(ratio<.18)scale=1.045;
          else if(ratio<.42)scale=1.035;
          else if(ratio<.62)scale=1.055;
          else if(ratio<.80)scale=1.105;
          else scale=1.135;
          const destinationWidth=width*scale;
          context.drawImage(image,0,y,width,Math.min(slice+1,height-y),(width-destinationWidth)/2,y,destinationWidth,Math.min(slice+1,height-y));
        }
        context.filter='none';
        const gradient=context.createLinearGradient(0,height*.08,0,height*.9);
        gradient.addColorStop(0,'rgba(73,38,27,.035)');
        gradient.addColorStop(.55,'rgba(73,38,27,.018)');
        gradient.addColorStop(1,'rgba(73,38,27,.05)');
        context.fillStyle=gradient;context.fillRect(0,0,width,height);
        maleSource=canvas.toDataURL('image/jpeg',.95);
        resolve(maleSource);
      };
      image.onerror=()=>resolve(source);
      image.src=source;
    });
    return buildingMale;
  }

  function syncButtons(selected){
    document.querySelectorAll('[data-oa-v164-model]').forEach(button=>{
      const active=button.dataset.oaV164Model===selected;
      button.classList.toggle('active',active);
      button.setAttribute('aria-pressed',String(active));
    });
  }

  async function atlasFor(selected=model()){
    const woman=femaleSource||await resolveFemale();
    return selected==='man'?buildMale(woman):woman;
  }

  async function applyModel(selected=model(),notify=false){
    selected=selected==='man'?'man':'woman';
    sessionStorage.setItem(MODEL_KEY,selected);
    sessionStorage.setItem(LEGACY_MODEL_KEY,selected);
    document.documentElement.classList.add('oa-v167-atlas');
    document.documentElement.dataset.oaModelV167=selected;
    document.documentElement.dataset.oaModelV165=selected;
    document.documentElement.dataset.oaModel=selected;
    syncButtons(selected);

    const source=await atlasFor(selected);
    const image=$('atlasImage');
    if(image&&source){
      applying=true;
      image.src=source;
      image.alt=selected==='man'?'Atlas clínico anatómico masculino frontal':'Atlas clínico anatómico femenino frontal';
      image.style.objectFit='cover';image.style.objectPosition='center top';
      requestAnimationFrame(()=>{applying=false;});
    }

    if(notify&&$('toast')){
      $('toast').textContent=`Modelo ${selected==='man'?'Hombre':'Mujer'} activado. Mapa y PDF usarán el mismo atlas clínico.`;
      $('toast').classList.add('show');
      clearTimeout(applyModel.timer);
      applyModel.timer=setTimeout(()=>$('toast')?.classList.remove('show'),2200);
    }
  }

  function removeRegisterFinalMap(){
    document.querySelectorAll('h1,h2,h3,strong').forEach(title=>{
      if(title.textContent.trim()!=='Mapa final del procedimiento')return;
      const card=title.closest('section,.oa-card,.oa-v160-final-map,.oa-v160-final-map-card,article');
      if(!card)return;
      if(card.closest('.oa-v162-page,.page,[data-tab-panel="summary"],.oa-summary-panel'))return;
      if(card.closest('.oa-record-panel,#recordPanel,[data-tab-panel="record"],#tabRecord')||!card.closest('.oa-map-panel'))card.classList.add('oa-v167-hide-record-map');
    });
  }

  function patchReport(){
    if(window.__oaV167WindowPatched)return;
    window.__oaV167WindowPatched=true;
    const originalOpen=window.open.bind(window);
    window.open=(...args)=>{
      const popup=originalOpen(...args);
      if(!popup?.document)return popup;
      const originalWrite=popup.document.write.bind(popup.document);
      popup.document.write=html=>{
        const selected=model();
        const source=$('atlasImage')?.src||femaleSource;
        let output=String(html);
        output=output.replace(/(<div class="atlas )(?:man|woman)(">)/,`$1${selected}$2`);
        output=output.replace(/(<div class="atlas (?:man|woman)"><img src=")[^"]+(" alt="Atlas [^"]+">)/,`$1${source}$2`);
        output=output.replace(/https:\/\/upload\.wikimedia\.org\/[^"']+/g,source);
        output=output.replace(/https:\/\/images\.pexels\.com\/[^"']+/g,source);
        return originalWrite(output);
      };
      return popup;
    };
  }

  function intercept(){
    window.addEventListener('click',event=>{
      const button=event.target.closest?.('[data-oa-v164-model]');
      if(!button)return;
      event.preventDefault();event.stopImmediatePropagation();
      applyModel(button.dataset.oaV164Model,true);
    },true);
  }

  function observe(){
    if(observersReady)return;observersReady=true;
    new MutationObserver(()=>requestAnimationFrame(removeRegisterFinalMap)).observe(document.body,{subtree:true,childList:true});
    const image=$('atlasImage');
    if(image)new MutationObserver(()=>{if(!applying)applyModel(model(),false);}).observe(image,{attributes:true,attributeFilter:['src']});
  }

  async function boot(){
    if(!$('atlasImage')||!document.querySelector('[data-oa-v164-model]')){setTimeout(boot,90);return;}
    document.documentElement.dataset.orionAestheticsVersion=VERSION;
    document.title=`ORION Armonización Orofacial V${VERSION}`;
    document.querySelectorAll('.oa-version').forEach(node=>node.textContent=`V${VERSION}`);
    await resolveFemale();
    patchReport();intercept();removeRegisterFinalMap();observe();
    await applyModel(model(),false);
  }

  boot();
})();
