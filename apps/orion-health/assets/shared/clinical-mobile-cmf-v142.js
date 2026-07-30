(()=>{
  'use strict';

  const MOBILE_BREAKPOINT=900;
  const byId=id=>document.getElementById(id);
  let signaturePromise=null;

  const effectiveWidth=()=>{
    const widths=[window.innerWidth,document.documentElement?.clientWidth].filter(Number.isFinite);
    try{
      if(window.parent&&window.parent!==window&&Number.isFinite(window.parent.innerWidth))widths.push(window.parent.innerWidth);
    }catch(_){ }
    return Math.min(...widths.filter(value=>value>0));
  };

  const applyMobileClass=()=>{
    document.body.classList.toggle('orion-cmf-mobile',effectiveWidth()<=MOBILE_BREAKPOINT);
  };

  const placeExamActions=()=>{
    const drawer=byId('examDrawer');
    const content=drawer?.querySelector(':scope > .p-4.space-y-3');
    const footer=drawer?.querySelector(':scope > .p-4.border-t');
    if(!content||!footer)return;
    footer.classList.add('orion-exam-actions-inline');
    const searchRow=content.children[1]||content.firstElementChild;
    if(searchRow?.nextSibling!==footer)content.insertBefore(footer,searchRow?.nextSibling||content.firstChild);
  };

  const loadImage=src=>new Promise((resolve,reject)=>{
    const image=new Image();
    image.onload=()=>resolve(image);
    image.onerror=reject;
    image.src=src;
  });

  async function rasterizeSignature(){
    if(signaturePromise)return signaturePromise;
    signaturePromise=(async()=>{
      const images=[...document.querySelectorAll('img.firmaimg')];
      if(!images.length)return '';
      const original=images.find(image=>!String(image.src||'').startsWith('data:image/png'))||images[0];
      const source=original.dataset.orionSignatureSource||original.getAttribute('src')||original.src;
      images.forEach(image=>{if(!image.dataset.orionSignatureSource)image.dataset.orionSignatureSource=source;});
      const response=await fetch(source,{cache:'force-cache'});
      if(!response.ok)throw new Error(`Firma HTTP ${response.status}`);
      const svgText=await response.text();
      const blobUrl=URL.createObjectURL(new Blob([svgText],{type:'image/svg+xml'}));
      try{
        const image=await loadImage(blobUrl);
        const canvas=document.createElement('canvas');
        canvas.width=900;
        canvas.height=897;
        const context=canvas.getContext('2d');
        context.clearRect(0,0,canvas.width,canvas.height);
        context.drawImage(image,0,0,canvas.width,canvas.height);
        const png=canvas.toDataURL('image/png');
        images.forEach(signature=>{
          signature.removeAttribute('onerror');
          signature.onerror=null;
          signature.style.removeProperty('display');
          signature.src=png;
          signature.dataset.orionSignatureFormat='png-data-uri';
        });
        return png;
      }finally{
        URL.revokeObjectURL(blobUrl);
      }
    })().catch(error=>{
      signaturePromise=null;
      console.error('ORION: no fue posible rasterizar la firma.',error);
      return '';
    });
    return signaturePromise;
  }

  const ensureVisibleSignatures=()=>{
    document.querySelectorAll('#printSheet .firmaimg,#printDoc .firmaimg,#printExamLab .firmaimg,#printExamImg .firmaimg,#printInter .firmaimg').forEach(image=>{
      image.removeAttribute('onerror');
      image.style.removeProperty('display');
    });
  };

  const installSignatureFallback=()=>{
    document.querySelectorAll('img.firmaimg').forEach(image=>{
      const source=image.getAttribute('src')||image.src;
      image.dataset.orionSignatureSource=source;
      image.removeAttribute('onerror');
      image.onerror=()=>rasterizeSignature();
      image.style.removeProperty('display');
    });
  };

  const prepareOutput=async()=>{
    await rasterizeSignature();
    ensureVisibleSignatures();
  };

  function init(){
    applyMobileClass();
    placeExamActions();
    installSignatureFallback();
    ensureVisibleSignatures();

    window.addEventListener('resize',()=>{
      applyMobileClass();
      placeExamActions();
    },{passive:true});

    document.addEventListener('pointerdown',event=>{
      const action=event.target instanceof Element?event.target.closest('#btnPrint,#btnPdf,#btnWA,#btnCopy'):null;
      if(action)prepareOutput();
      const preview=event.target instanceof Element?event.target.closest('#orionClinicalTabPreview'):null;
      if(preview)ensureVisibleSignatures();
    },true);

    document.addEventListener('click',event=>{
      const action=event.target instanceof Element?event.target.closest('#btnDocExams'):null;
      if(action)setTimeout(placeExamActions,0);
    },true);

    window.ORION_CMF_MOBILE_V142={
      version:'1.4.4',
      effectiveWidth,
      prepareOutput,
      placeExamActions,
      signature:'svg-with-png-fallback'
    };
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
