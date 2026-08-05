(()=>{
  'use strict';

  const VERSION='1.6.11';
  const MODEL_KEYS=['orion_aesthetic_model_v164','orion_aesthetic_model_v165'];
  const $=id=>document.getElementById(id);
  let atlasSource='';
  let refreshTimer=0;
  let applying=false;

  function resolveAtlas(){
    const source=window.ORION_ANATOMY_ATLAS_FEMALE||$('atlasImage')?.src||'';
    if(source&&(!atlasSource||source.startsWith('data:image')))atlasSource=source;
    return atlasSource;
  }

  function clearModelState(){
    MODEL_KEYS.forEach(key=>sessionStorage.removeItem(key));
    document.documentElement.classList.add('oa-single-atlas');
    document.documentElement.dataset.oaModel='single';
    document.documentElement.dataset.oaModelV165='single';
    document.documentElement.dataset.orionAestheticsVersion=VERSION;
  }

  function removeModelControls(){
    [
      '#oaV164ModelSwitch',
      '.oa-v164-model-note',
      '.oa-v168-atlas-warning',
      '.oa-v167-model-note'
    ].forEach(selector=>document.querySelectorAll(selector).forEach(node=>node.remove()));
  }

  function removeFinalMapCards(){
    [
      '#oaV160FinalMap',
      '.oa-v160-final-map',
      '.oa-v160-final-map-card',
      '.oa-v164-final-map',
      '.oa-final-map-card'
    ].forEach(selector=>document.querySelectorAll(selector).forEach(node=>node.remove()));

    document.querySelectorAll('h1,h2,h3,strong').forEach(title=>{
      if(title.textContent.trim()!=='Mapa final del procedimiento')return;
      const card=title.closest('section,article,.oa-card,div');
      if(card&&!card.closest('.oa-letter-report,.oa-v164-page,.page'))card.remove();
    });
  }

  function forceSingleAtlas(){
    const image=$('atlasImage');
    const source=resolveAtlas();
    if(!image||!source)return;
    if(image.src!==source){
      applying=true;
      image.src=source;
      requestAnimationFrame(()=>{applying=false;});
    }
    image.alt='Atlas clínico anatómico facial frontal';
    image.style.objectFit='cover';
    image.style.objectPosition='center top';
    image.style.filter='none';
    image.style.transform='none';
  }

  function rewriteReport(html){
    const source=resolveAtlas()||$('atlasImage')?.src||'';
    let output=String(html);
    if(source){
      output=output.replace(/https:\/\/images\.pexels\.com\/[^"'\s>]+/g,source);
      output=output.replace(/https:\/\/upload\.wikimedia\.org\/[^"'\s>]+/g,source);
      output=output.replace(/(<div class="(?:oa-v164-atlas|atlas)[^"]*"><img src=")[^"]+("[^>]*>)/g,`$1${source}$2`);
    }
    output=output.replace(/(<span>Modelo anatómico<\/span>\s*<strong>)(?:Mujer|Hombre)(<\/strong>)/g,'$1Atlas clínico único$2');
    output=output.replace(/(<span>Modelo<\/span>\s*<strong>)(?:Mujer|Hombre)(<\/strong>)/g,'$1Atlas clínico único$2');
    output=output.replace(/alt="Atlas (?:Mujer|Hombre)"/g,'alt="Atlas clínico anatómico"');
    output=output.replace(/class="atlas (?:woman|man)"/g,'class="atlas single"');
    return output;
  }

  function patchReportWindow(){
    if(window.__oaSingleAtlasWindowPatched)return;
    window.__oaSingleAtlasWindowPatched=true;
    const previousOpen=window.open.bind(window);
    window.open=(...args)=>{
      const popup=previousOpen(...args);
      if(!popup?.document)return popup;
      const previousWrite=popup.document.write.bind(popup.document);
      popup.document.write=html=>previousWrite(rewriteReport(html));
      return popup;
    };
  }

  function refresh(){
    clearTimeout(refreshTimer);
    refreshTimer=0;
    clearModelState();
    removeModelControls();
    removeFinalMapCards();
    forceSingleAtlas();
    document.title=`ORION Armonización Orofacial V${VERSION}`;
    document.querySelectorAll('.oa-version').forEach(node=>{node.textContent=`V${VERSION}`;});
  }

  function queueRefresh(){
    if(refreshTimer)return;
    refreshTimer=setTimeout(refresh,180);
  }

  function observe(){
    new MutationObserver(queueRefresh).observe(document.body,{subtree:true,childList:true});
    const image=$('atlasImage');
    if(image){
      new MutationObserver(()=>{if(!applying)queueRefresh();}).observe(image,{attributes:true,attributeFilter:['src']});
    }
  }

  function boot(){
    if(!$('atlasImage')){
      setTimeout(boot,100);
      return;
    }
    resolveAtlas();
    patchReportWindow();
    refresh();
    observe();
  }

  boot();
})();
