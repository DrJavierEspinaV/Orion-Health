(()=>{
  'use strict';

  const EXTERNAL_ATLAS='https://images.pexels.com/photos/32758452/pexels-photo-32758452.jpeg?auto=compress&cs=tinysrgb&w=1200';
  const localAtlas=()=>window.ORION_ANATOMY_ATLAS_FEMALE||document.getElementById('atlasImage')?.src||'';

  function applyLocalAtlas(){
    const image=document.getElementById('atlasImage');
    const source=localAtlas();
    if(!image||!source||image.src===source)return;
    image.src=source;
    image.style.objectFit='cover';
    image.style.objectPosition='center top';
  }

  const originalOpen=window.open.bind(window);
  window.open=(...args)=>{
    const popup=originalOpen(...args);
    if(!popup||!popup.document)return popup;
    const originalWrite=popup.document.write.bind(popup.document);
    popup.document.write=html=>{
      const source=localAtlas();
      const output=source?String(html).split(EXTERNAL_ATLAS).join(source):String(html);
      return originalWrite(output);
    };
    return popup;
  };

  new MutationObserver(()=>requestAnimationFrame(applyLocalAtlas)).observe(document.documentElement,{
    attributes:true,
    attributeFilter:['data-oa-model-v165']
  });

  const image=document.getElementById('atlasImage');
  if(image){
    new MutationObserver(()=>requestAnimationFrame(applyLocalAtlas)).observe(image,{attributes:true,attributeFilter:['src']});
  }

  applyLocalAtlas();
})();
