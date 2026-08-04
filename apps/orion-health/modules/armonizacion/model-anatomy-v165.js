(()=>{
  'use strict';

  const VERSION='1.6.5';
  const MODEL_KEY='orion_aesthetic_model_v164';
  const MALE_CACHE_KEY='orion_aesthetic_male_atlas_v165';
  const SOURCE_URL='https://upload.wikimedia.org/wikipedia/commons/1/19/1106_Front_and_Side_Views_of_the_Muscles_of_Facial_Expressions.jpg';
  const $=id=>document.getElementById(id);

  let activeMaleSource='';
  let malePromise=null;
  let enforcing=false;

  function selectedModel(){
    return sessionStorage.getItem(MODEL_KEY)==='man'?'man':'woman';
  }

  function updateVersion(){
    document.documentElement.dataset.orionAestheticsVersion=VERSION;
    document.documentElement.classList.add('oa-v165-model');
    document.title=`ORION Armonización Orofacial V${VERSION}`;
    document.querySelectorAll('.oa-version').forEach(node=>{node.textContent=`V${VERSION}`;});
  }

  function loadImage(url){
    return new Promise((resolve,reject)=>{
      const image=new Image();
      image.crossOrigin='anonymous';
      image.referrerPolicy='no-referrer';
      image.onload=()=>resolve(image);
      image.onerror=()=>reject(new Error('No fue posible cargar el atlas anatómico masculino.'));
      image.src=url;
    });
  }

  function sample(source,width,height,x,y,channel){
    const px=Math.max(0,Math.min(width-1,Math.round(x)));
    const py=Math.max(0,Math.min(height-1,Math.round(y)));
    return source[(py*width+px)*4+channel];
  }

  function cleanLeaderLine(sourceData,sourceWidth,sourceHeight,halfData){
    const x0=55;
    const y0=105;
    const halfWidth=465;
    const halfHeight=1255;
    const x1=344;
    const y1=1035;
    const x2=875;
    const y2=1256;
    const vx=x2-x1;
    const vy=y2-y1;
    const length=Math.hypot(vx,vy);
    const normalX=-vy/length;
    const normalY=vx/length;
    const denominator=vx*vx+vy*vy;
    const radius=8;
    const sampleDistance=13;

    for(let localY=0;localY<halfHeight;localY+=1){
      const sourceY=y0+localY;
      if(sourceY<1018||sourceY>1140)continue;

      for(let localX=0;localX<halfWidth;localX+=1){
        const sourceX=x0+localX;
        if(sourceX<332||sourceX>520)continue;

        const rawT=((sourceX-x1)*vx+(sourceY-y1)*vy)/denominator;
        const t=Math.max(0,Math.min(1,rawT));
        const projectionX=x1+t*vx;
        const projectionY=y1+t*vy;
        const signedDistance=(sourceX-projectionX)*normalX+(sourceY-projectionY)*normalY;
        if(Math.abs(signedDistance)>=radius)continue;

        const alpha=(signedDistance+radius)/(radius*2);
        const destination=(localY*halfWidth+localX)*4;
        for(let channel=0;channel<3;channel+=1){
          const sideA=sample(sourceData,sourceWidth,sourceHeight,sourceX+normalX*sampleDistance,sourceY+normalY*sampleDistance,channel);
          const sideB=sample(sourceData,sourceWidth,sourceHeight,sourceX-normalX*sampleDistance,sourceY-normalY*sampleDistance,channel);
          halfData.data[destination+channel]=Math.round(sideA*(1-alpha)+sideB*alpha);
        }
        halfData.data[destination+3]=255;
      }
    }
  }

  async function buildMaleAtlas(){
    if(activeMaleSource)return activeMaleSource;

    try{
      const cached=localStorage.getItem(MALE_CACHE_KEY);
      if(cached&&cached.startsWith('data:image/')&&cached.length>10000){
        activeMaleSource=cached;
        return activeMaleSource;
      }
    }catch(_){/* almacenamiento no disponible */}

    if(malePromise)return malePromise;

    malePromise=(async()=>{
      const sourceImage=await loadImage(SOURCE_URL);
      const sourceCanvas=document.createElement('canvas');
      sourceCanvas.width=sourceImage.naturalWidth||2407;
      sourceCanvas.height=sourceImage.naturalHeight||1460;
      const sourceContext=sourceCanvas.getContext('2d',{willReadFrequently:true});
      sourceContext.drawImage(sourceImage,0,0);
      const sourcePixels=sourceContext.getImageData(0,0,sourceCanvas.width,sourceCanvas.height);

      const halfCanvas=document.createElement('canvas');
      halfCanvas.width=465;
      halfCanvas.height=1255;
      const halfContext=halfCanvas.getContext('2d',{willReadFrequently:true});
      halfContext.drawImage(sourceImage,55,105,465,1255,0,0,465,1255);
      const halfPixels=halfContext.getImageData(0,0,465,1255);
      cleanLeaderLine(sourcePixels.data,sourceCanvas.width,sourceCanvas.height,halfPixels);
      halfContext.putImageData(halfPixels,0,0);

      const symmetricCanvas=document.createElement('canvas');
      symmetricCanvas.width=929;
      symmetricCanvas.height=1255;
      const symmetricContext=symmetricCanvas.getContext('2d');
      symmetricContext.fillStyle='#f7f2ec';
      symmetricContext.fillRect(0,0,symmetricCanvas.width,symmetricCanvas.height);
      symmetricContext.drawImage(halfCanvas,0,0);
      symmetricContext.save();
      symmetricContext.translate(symmetricCanvas.width,0);
      symmetricContext.scale(-1,1);
      symmetricContext.drawImage(halfCanvas,0,0);
      symmetricContext.restore();

      const output=document.createElement('canvas');
      output.width=900;
      output.height=1200;
      const context=output.getContext('2d');
      context.fillStyle='#f5eee7';
      context.fillRect(0,0,output.width,output.height);
      const scale=Math.max(output.width/symmetricCanvas.width,output.height/symmetricCanvas.height);
      const drawWidth=symmetricCanvas.width*scale;
      const drawHeight=symmetricCanvas.height*scale;
      context.drawImage(symmetricCanvas,(output.width-drawWidth)/2,(output.height-drawHeight)/2,drawWidth,drawHeight);

      activeMaleSource=output.toDataURL('image/jpeg',0.9);
      try{localStorage.setItem(MALE_CACHE_KEY,activeMaleSource);}catch(_){/* cuota o modo privado */}
      return activeMaleSource;
    })().finally(()=>{malePromise=null;});

    return malePromise;
  }

  function alignAtlas(){
    const image=$('atlasImage');
    if(!image)return;
    image.style.setProperty('width','100%','important');
    image.style.setProperty('height','100%','important');
    image.style.setProperty('object-fit','contain','important');
    image.style.setProperty('object-position','center top','important');
  }

  function syncFinalAtlas(source){
    document.querySelectorAll('#oaV160FinalAtlas img,.oa-v164-atlas img').forEach(image=>{
      if(selectedModel()==='man')image.src=source;
      image.style.objectPosition='center top';
      image.style.objectFit='contain';
    });
  }

  async function applyModel(model=selectedModel(),notify=false){
    const image=$('atlasImage');
    if(!image)return;

    alignAtlas();
    document.documentElement.dataset.oaModel=model;

    if(model!=='man'){
      image.classList.remove('oa-v165-loading');
      return;
    }

    image.classList.add('oa-v165-loading');
    try{
      const source=await buildMaleAtlas();
      if(selectedModel()!=='man')return;
      enforcing=true;
      image.src=source;
      image.alt='Modelo anatómico masculino frontal de cara y cuello';
      image.dataset.oaV165Male='true';
      syncFinalAtlas(source);
      if(notify){
        const toast=$('toast');
        if(toast){
          toast.textContent='Modelo anatómico masculino alineado.';
          toast.classList.add('show');
          setTimeout(()=>toast.classList.remove('show'),1600);
        }
      }
    }catch(error){
      console.error('ORION no pudo preparar el modelo masculino:',error);
      const toast=$('toast');
      if(toast){
        toast.textContent='No fue posible cargar el modelo anatómico masculino.';
        toast.classList.add('show');
        setTimeout(()=>toast.classList.remove('show'),2200);
      }
    }finally{
      image.classList.remove('oa-v165-loading');
      requestAnimationFrame(()=>{enforcing=false;});
    }
  }

  function removeButtonPhotos(){
    const switcher=$('oaV164ModelSwitch');
    if(switcher){
      switcher.style.removeProperty('--oa-v164-woman-thumb');
      switcher.style.removeProperty('--oa-v164-man-thumb');
    }

    document.querySelectorAll('.oa-v164-model-button').forEach(button=>{
      button.style.removeProperty('background-image');
    });

    const note=document.querySelector('.oa-v164-model-note');
    if(note&&!note.querySelector('.oa-v165-source')){
      const source=document.createElement('small');
      source.className='oa-v165-source';
      source.textContent=' Modelo masculino adaptado de OpenStax Anatomy & Physiology (CC BY 4.0).';
      note.appendChild(source);
    }
  }

  function bindModelButtons(){
    document.addEventListener('click',event=>{
      const button=event.target.closest('[data-oa-v164-model]');
      if(!button)return;
      const model=button.dataset.oaV164Model==='man'?'man':'woman';
      setTimeout(()=>applyModel(model,true),0);
    });
  }

  function observeAtlas(){
    const image=$('atlasImage');
    if(image){
      new MutationObserver(()=>{
        if(enforcing||selectedModel()!=='man')return;
        if(activeMaleSource&&image.src===activeMaleSource)return;
        applyModel('man');
      }).observe(image,{attributes:true,attributeFilter:['src']});
    }

    new MutationObserver(()=>{
      removeButtonPhotos();
      alignAtlas();
      if(selectedModel()==='man'&&activeMaleSource)syncFinalAtlas(activeMaleSource);
    }).observe(document.body,{childList:true,subtree:true});
  }

  function boot(){
    if(!$('atlasImage')||!$('oaV164ModelSwitch')){
      setTimeout(boot,80);
      return;
    }

    updateVersion();
    removeButtonPhotos();
    alignAtlas();
    bindModelButtons();
    observeAtlas();
    applyModel(selectedModel());
  }

  boot();
})();
