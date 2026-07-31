(()=>{
  'use strict';

  const PATCH_VERSION='CMF-OUTPUT-FIXES-2026.07.31-R4';
  const PDF_BUNDLE_URL='https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
  const PAGE_IDS=['printSheet','printSheet2','printDoc','printExamLab','printExamImg','printInter'];
  const PAGE_NAMES={
    printSheet:'Receta',
    printSheet2:'Indicaciones',
    printDoc:'Documento',
    printExamLab:'Orden_Laboratorio',
    printExamImg:'Orden_Imagenologia',
    printInter:'Interconsulta'
  };
  const $=id=>document.getElementById(id);
  let pdfLibraryPromise=null;
  let pdfRunning=false;

  const isVisible=element=>{
    if(!element||element.classList.contains('hidden')||element.getAttribute('aria-hidden')==='true')return false;
    const style=getComputedStyle(element);
    return style.display!=='none'&&style.visibility!=='hidden';
  };

  const visiblePages=()=>PAGE_IDS.map(id=>$(id)).filter(isVisible);

  const safeValue=id=>String($(id)?.value||'').trim();

  const cleanToken=value=>String(value||'')
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-zA-Z0-9]+/g,'_')
    .replace(/^_+|_+$/g,'');

  const pdfFilename=pages=>{
    const patient=cleanToken(safeValue('p_nombre'));
    const labels=[...new Set(pages.map(page=>PAGE_NAMES[page.id]||'Documento'))];
    const documentName=labels.length===1?labels[0]:'Documentos_Clinicos';
    return `${documentName}_ORION${patient?`_${patient}`:''}.pdf`;
  };

  const loadPdfLibrary=()=>{
    if(typeof window.html2pdf==='function')return Promise.resolve(window.html2pdf);
    if(pdfLibraryPromise)return pdfLibraryPromise;

    pdfLibraryPromise=new Promise((resolve,reject)=>{
      const finish=()=>{
        if(typeof window.html2pdf==='function')resolve(window.html2pdf);
        else reject(new Error('El motor html2pdf no quedó disponible.'));
      };
      const existing=[...document.scripts].find(script=>String(script.src||'').includes('html2pdf'));
      if(existing){
        if(existing.dataset.orionLoaded==='1')finish();
        else{
          existing.addEventListener('load',()=>{existing.dataset.orionLoaded='1';finish();},{once:true});
          existing.addEventListener('error',()=>reject(new Error('No fue posible cargar html2pdf.')),{once:true});
          setTimeout(finish,0);
        }
        return;
      }

      const script=document.createElement('script');
      script.src=PDF_BUNDLE_URL;
      script.async=true;
      script.dataset.orionPdfBundle='r4';
      script.onload=()=>{script.dataset.orionLoaded='1';finish();};
      script.onerror=()=>reject(new Error('No fue posible cargar el motor PDF.'));
      document.head.appendChild(script);
    }).catch(error=>{
      pdfLibraryPromise=null;
      throw error;
    });

    return pdfLibraryPromise;
  };

  const createPdfStage=pages=>{
    const stage=document.createElement('div');
    stage.id='orionPdfStageR4';
    stage.style.cssText='position:absolute;left:-12000px;top:0;width:528px;background:#fff;z-index:-1;pointer-events:none;';

    const css=document.createElement('style');
    css.textContent=`
      #orionPdfStageR4{font-family:Montserrat,Arial,sans-serif!important;}
      #orionPdfStageR4 .orion-pdf-paper{
        display:block!important;
        width:528px!important;
        height:816px!important;
        min-height:816px!important;
        max-height:816px!important;
        padding:26.4567px!important;
        margin:0!important;
        box-sizing:border-box!important;
        overflow:hidden!important;
        background:#fff!important;
        position:relative!important;
        break-after:page!important;
        page-break-after:always!important;
      }
      #orionPdfStageR4 .orion-pdf-paper:last-of-type{
        break-after:auto!important;
        page-break-after:auto!important;
      }
      #orionPdfStageR4 .orion-pdf-paper>.page{
        display:block!important;
        width:100%!important;
        height:100%!important;
        min-height:0!important;
        max-height:none!important;
        margin:0!important;
        padding-top:68.0315px!important;
        box-sizing:border-box!important;
        position:relative!important;
        overflow:hidden!important;
        background:#fff!important;
        border:0!important;
        border-radius:0!important;
        box-shadow:none!important;
      }
      #orionPdfStageR4 .hidden,
      #orionPdfStageR4 .no-print{display:none!important;}
      #orionPdfStageR4 .orion-print-only{display:block!important;}
      #orionPdfStageR4 [contenteditable="true"]{border:0!important;padding:0!important;background:transparent!important;}
      #orionPdfStageR4 [id^="fixedFoot"] .brand .logo{max-height:52px!important;width:auto!important;}
      #orionPdfStageR4 #printDoc [id^="fixedFoot"] .brand .logo{max-height:58px!important;}
      #orionPdfStageR4 img,#orionPdfStageR4 svg{-webkit-print-color-adjust:exact;print-color-adjust:exact;}
    `;
    stage.appendChild(css);

    pages.forEach(source=>{
      const paper=document.createElement('div');
      paper.className='orion-pdf-paper';
      const clone=source.cloneNode(true);
      clone.classList.remove('hidden','force-break');
      clone.removeAttribute('aria-hidden');
      paper.appendChild(clone);
      stage.appendChild(paper);
    });

    document.body.appendChild(stage);
    return stage;
  };

  const waitForImages=async root=>{
    const images=[...root.querySelectorAll('img')];
    await Promise.all(images.map(image=>{
      if(image.complete)return image.decode?.().catch(()=>{})||Promise.resolve();
      return new Promise(resolve=>{
        image.addEventListener('load',resolve,{once:true});
        image.addEventListener('error',resolve,{once:true});
      });
    }));
  };

  const setPdfButtonState=(busy,label)=>{
    const button=$('btnPdf');
    if(!button)return;
    button.disabled=busy;
    button.setAttribute('aria-busy',busy?'true':'false');
    button.textContent=label;
  };

  async function generateStatementPdf(){
    if(pdfRunning)return;
    pdfRunning=true;
    const button=$('btnPdf');
    const originalLabel=button?.textContent||'PDF';
    setPdfButtonState(true,'Generando PDF…');

    let stage=null;
    try{
      try{if(typeof window.render==='function')window.render();}catch(_){ }
      await window.ORION_CMF_MOBILE_V142?.prepareOutput?.();
      const html2pdf=await loadPdfLibrary();
      const pages=visiblePages();
      if(!pages.length)throw new Error('No hay hojas clínicas visibles para exportar.');

      stage=createPdfStage(pages);
      await waitForImages(stage);

      const worker=html2pdf().set({
        margin:0,
        filename:pdfFilename(pages),
        image:{type:'jpeg',quality:.98},
        html2canvas:{
          scale:2,
          useCORS:true,
          allowTaint:false,
          backgroundColor:'#FFFFFF',
          logging:false,
          scrollX:0,
          scrollY:0,
          windowWidth:528,
          windowHeight:816
        },
        jsPDF:{orientation:'portrait',unit:'in',format:[5.5,8.5],compress:true},
        pagebreak:{mode:['css','legacy']}
      }).from(stage);

      await worker.save();
    }catch(error){
      console.error('ORION PDF R4:',error);
      alert('No fue posible generar el PDF directo. Se abrirá la impresión en formato Statement para guardarlo como PDF.');
      window.print();
    }finally{
      stage?.remove();
      setPdfButtonState(false,originalLabel);
      pdfRunning=false;
    }
  }

  const drawerContent=drawer=>drawer?.querySelector(':scope > .p-4.space-y-3');

  const drawerIsOpen=drawer=>!!drawer
    &&!drawer.classList.contains('hidden')
    &&!drawer.classList.contains('translate-x-full');

  const resetDrawerToTop=drawer=>{
    if(!drawer)return;
    drawer.scrollTop=0;
    const content=drawerContent(drawer);
    if(content)content.scrollTop=0;
    const firstField=content?.querySelector('select,input,textarea,button');
    firstField?.blur?.();
  };

  const scheduleDrawerReset=id=>{
    const run=()=>{
      const drawer=$(id);
      if(drawerIsOpen(drawer))resetDrawerToTop(drawer);
    };
    requestAnimationFrame(()=>requestAnimationFrame(run));
    setTimeout(run,80);
    setTimeout(run,240);
  };

  const scrollDocumentToTop=id=>{
    const target=$(id);
    if(!target)return;
    const localTop=Math.max(0,target.getBoundingClientRect().top+window.scrollY-12);
    window.scrollTo({top:localTop,behavior:'smooth'});

    try{
      const frame=window.frameElement;
      if(frame&&window.parent&&window.parent!==window){
        const frameTop=frame.getBoundingClientRect().top+window.parent.scrollY;
        window.parent.scrollTo({top:Math.max(0,frameTop+localTop-82),behavior:'smooth'});
      }
    }catch(_){ }
  };

  const watchDrawers=()=>{
    ['examDrawer','interDrawer'].forEach(id=>{
      const drawer=$(id);
      if(!drawer)return;
      let wasOpen=drawerIsOpen(drawer);
      new MutationObserver(()=>{
        const open=drawerIsOpen(drawer);
        if(open&&!wasOpen)resetDrawerToTop(drawer);
        wasOpen=open;
      }).observe(drawer,{attributes:true,attributeFilter:['class']});
    });
  };

  const installHandlers=()=>{
    document.addEventListener('click',event=>{
      const control=event.target instanceof Element?event.target.closest('button,a'):null;
      if(!control)return;

      if(control.id==='btnPdf'){
        event.preventDefault();
        event.stopImmediatePropagation();
        generateStatementPdf();
        return;
      }

      if(control.id==='btnDocInter')scheduleDrawerReset('interDrawer');
      if(control.id==='btnDocExams')scheduleDrawerReset('examDrawer');
      if(control.id==='btnInterGenerate'){
        setTimeout(()=>scrollDocumentToTop('printInter'),80);
        setTimeout(()=>scrollDocumentToTop('printInter'),260);
      }
    },true);
  };

  function init(){
    watchDrawers();
    installHandlers();
    window.ORION_CMF_OUTPUT_FIXES_R4={
      version:PATCH_VERSION,
      pdf:'html2pdf-direct-statement',
      actions:'normal-flow-mobile',
      interconsulta:'drawer-top-reset'
    };
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
