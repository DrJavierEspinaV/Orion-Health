(()=>{
  'use strict';

  const OUTPUT_IDS=new Set(['btnPrint','btnPdf','btnWA','btnCopy','orionClinicalTabPreview']);
  const SVG_URL=new URL('../../assets/brand/firma-javier-espina-navy.svg',document.baseURI).href;
  const DATA_ATTRIBUTE='data-orion-signature-format';
  let pngData='';
  let settled=false;
  let promise=null;

  function imageFromUrl(url){
    return new Promise((resolve,reject)=>{
      const image=new Image();
      image.onload=()=>resolve(image);
      image.onerror=()=>reject(new Error('No fue posible rasterizar la firma.'));
      image.src=url;
    });
  }

  function applyPng(root=document){
    if(!pngData) return 0;
    const images=Array.from(root.querySelectorAll?.('.firmaimg')||[]);
    images.forEach(image=>{
      image.style.removeProperty('display');
      image.decoding='sync';
      image.srcset=`${pngData} 1x`;
      image.sizes='300px';
      image.dataset.orionSignaturePng=pngData;
      image.dataset.orionSignatureFormat='png-v142';
      image.setAttribute(DATA_ATTRIBUTE,'png-v142');

      if(image.dataset.orionPngFallback!=='1'){
        image.dataset.orionPngFallback='1';
        image.addEventListener('error',()=>{
          if(!pngData||image.src===pngData) return;
          image.removeAttribute('srcset');
          image.src=pngData;
        },{once:true});
      }
    });
    return images.length;
  }

  async function rasterize(){
    if(promise) return promise;
    promise=(async()=>{
      try{
        const response=await fetch(SVG_URL,{cache:'force-cache'});
        if(!response.ok) throw new Error(`HTTP ${response.status}`);
        const svgText=await response.text();
        const blobUrl=URL.createObjectURL(new Blob([svgText],{type:'image/svg+xml;charset=utf-8'}));
        try{
          const source=await imageFromUrl(blobUrl);
          const canvas=document.createElement('canvas');
          canvas.width=600;
          canvas.height=598;
          const context=canvas.getContext('2d',{alpha:true});
          if(!context) throw new Error('Canvas no disponible.');
          context.clearRect(0,0,canvas.width,canvas.height);
          context.drawImage(source,0,0,canvas.width,canvas.height);
          pngData=canvas.toDataURL('image/png');
          applyPng(document);
        }finally{
          URL.revokeObjectURL(blobUrl);
        }
      }catch(error){
        console.warn('ORION mantendrá la firma vectorial como respaldo.',error);
      }finally{
        settled=true;
      }
      return pngData;
    })();
    return promise;
  }

  const observer=new MutationObserver(records=>{
    if(!pngData) return;
    for(const record of records){
      for(const node of record.addedNodes){
        if(!(node instanceof Element)) continue;
        if(node.matches('.firmaimg')) applyPng(node.parentElement||document);
        else if(node.querySelector('.firmaimg')) applyPng(node);
      }
    }
  });

  function start(){
    observer.observe(document.documentElement,{childList:true,subtree:true});
    rasterize();
  }

  document.addEventListener('click',event=>{
    const button=event.target instanceof Element?event.target.closest('button'):null;
    if(!button||!OUTPUT_IDS.has(button.id)||settled) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    rasterize().finally(()=>button.click());
  },true);

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();

  window.ORION_CMF_SIGNATURE_V142={
    version:'1.4.2',
    ready:()=>rasterize(),
    apply:()=>applyPng(document),
    format:()=>pngData?'png-srcset':'svg-fallback'
  };
})();
