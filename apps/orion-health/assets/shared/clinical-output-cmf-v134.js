(()=>{
  'use strict';

  const OUTPUT_VERSION='CMF-OUTPUT-2026.07.28-V1';
  const PDF_BUNDLE_URL='https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
  const PAGE_IDS=['printSheet','printSheet2','printDoc','printExamLab','printExamImg','printInter'];
  let pdfLibraryPromise=null;
  let pdfRunning=false;

  const $=id=>document.getElementById(id);

  function injectStyles(){
    if($('orionCmfOutputStyles'))return;
    const style=document.createElement('style');
    style.id='orionCmfOutputStyles';
    style.textContent=`
      :root{--brand-logo-h:52px;}
      #printDoc{--brand-logo-h-3:58px;}
      .orion-actions-top{
        position:sticky;
        top:0;
        z-index:60;
        margin:0 0 16px;
        border:1px solid #dbe7f3;
        border-radius:16px;
        background:rgba(255,255,255,.96);
        box-shadow:0 8px 22px rgba(15,23,42,.08);
        backdrop-filter:saturate(180%) blur(8px);
      }
      .orion-actions-top>div{
        max-width:none!important;
        padding:10px 12px!important;
        border-top:0!important;
      }
      .orion-actions-top button{min-height:42px;}
      .orion-actions-top #btnPdf::after{content:' Statement';}
      @media(max-width:640px){
        .orion-actions-top>div{display:grid!important;grid-template-columns:1fr 1fr;gap:8px!important;}
        .orion-actions-top button{width:100%;padding:10px 8px!important;font-size:13px;}
      }
      @media print{
        :root{--brand-logo-h:52px;}
        #printDoc{--brand-logo-h-3:58px;}
      }
    `;
    document.head.appendChild(style);
  }

  function moveActionsToTop(){
    const main=document.querySelector('main');
    const actions=document.querySelector('.actions-bottom');
    if(!main||!actions)return;
    actions.classList.remove('actions-bottom','mt-6');
    actions.classList.add('orion-actions-top');
    const audit=$('orionClinicalAuditCMF');
    if(audit&&audit.parentElement===main)audit.insertAdjacentElement('afterend',actions);
    else main.prepend(actions);
  }

  function safeValue(id){return String($(id)?.value||'').trim();}

  function buildClinicalText(){
    const date=new Date().toLocaleDateString('es-CL');
    const diagnosis=safeValue('p_dx2')||safeValue('p_dx');
    const lines=[
      'ORION Health — Receta e Indicaciones',
      `Fecha: ${date}`,
      '',
      `Paciente: ${safeValue('p_nombre')}`,
      `RUN: ${safeValue('p_rut')}`,
      `Edad: ${safeValue('p_edad')}${safeValue('p_edad')?' años':''}`,
      `Peso: ${safeValue('p_peso')}${safeValue('p_peso')?' kg':''}`,
      `Diagnóstico/Procedimiento: ${diagnosis}`,
      '',
      'RECETA',
      safeValue('receta'),
      '',
      'INDICACIONES',
      safeValue('indicaciones').replace(/^\s*indicaciones?\s*—.*?\n+/i,'').trim(),
      '',
      'Dr. Javier Espina Videla',
      'Cirugía y Traumatología Bucomaxilofacial — Universidad de Chile'
    ];
    return lines.join('\n').replace(/\n{3,}/g,'\n\n').trim();
  }

  function openExternal(url){
    const anchor=document.createElement('a');
    anchor.href=url;
    anchor.target='_blank';
    anchor.rel='noopener noreferrer';
    anchor.style.display='none';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  }

  function shareWhatsApp(){
    const text=buildClinicalText();
    const encoded=encodeURIComponent(text);
    const webUrl=`https://api.whatsapp.com/send?text=${encoded}`;
    const mobile=/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);

    if(!mobile){
      openExternal(webUrl);
      return;
    }

    const scheme=`whatsapp://send?text=${encoded}`;
    const anchor=document.createElement('a');
    anchor.href=scheme;
    anchor.target='_top';
    anchor.style.display='none';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    setTimeout(()=>{
      if(document.visibilityState==='visible')openExternal(webUrl);
    },1100);
  }

  function ensurePdfLibrary(){
    if(window.html2canvas&&window.jspdf?.jsPDF)return Promise.resolve();
    if(pdfLibraryPromise)return pdfLibraryPromise;
    pdfLibraryPromise=new Promise((resolve,reject)=>{
      const existing=document.querySelector('script[data-orion-pdf-bundle="1"]');
      if(existing){
        existing.addEventListener('load',()=>resolve(),{once:true});
        existing.addEventListener('error',()=>reject(new Error('No fue posible cargar el motor PDF.')),{once:true});
        return;
      }
      const script=document.createElement('script');
      script.src=PDF_BUNDLE_URL;
      script.async=true;
      script.dataset.orionPdfBundle='1';
      script.onload=()=>resolve();
      script.onerror=()=>reject(new Error('No fue posible cargar el motor PDF.'));
      document.head.appendChild(script);
    });
    return pdfLibraryPromise;
  }

  function visiblePages(){
    return PAGE_IDS
      .map(id=>$(id))
      .filter(Boolean)
      .filter(page=>!page.classList.contains('hidden')&&page.getAttribute('aria-hidden')!=='true');
  }

  function filename(){
    const patient=safeValue('p_nombre')
      .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
      .replace(/[^a-zA-Z0-9]+/g,'_')
      .replace(/^_+|_+$/g,'');
    return patient?`Receta_ORION_${patient}.pdf`:'Receta_ORION.pdf';
  }

  function createPdfStage(pages){
    const stage=document.createElement('div');
    stage.id='orionPdfStage';
    stage.style.cssText='position:absolute;left:-12000px;top:0;width:528px;background:#fff;z-index:-1;';

    const css=document.createElement('style');
    css.textContent=`
      #orionPdfStage .orion-pdf-paper{
        width:528px!important;
        height:816px!important;
        padding:26.4567px!important;
        box-sizing:border-box!important;
        overflow:hidden!important;
        background:#fff!important;
        position:relative!important;
      }
      #orionPdfStage .orion-pdf-paper>.page{
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
      #orionPdfStage .hidden,#orionPdfStage .no-print{display:none!important;}
      #orionPdfStage .orion-print-only{display:block!important;}
      #orionPdfStage [contenteditable="true"]{border:0!important;padding:0!important;background:transparent!important;}
      #orionPdfStage [id^="fixedFoot"] .brand .logo{max-height:52px!important;width:auto!important;}
      #orionPdfStage #printDoc [id^="fixedFoot"] .brand .logo{max-height:58px!important;}
      #orionPdfStage img,#orionPdfStage svg{-webkit-print-color-adjust:exact;print-color-adjust:exact;}
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
  }

  async function waitForImages(root){
    const images=Array.from(root.querySelectorAll('img'));
    await Promise.all(images.map(img=>{
      if(img.complete)return img.decode?.().catch(()=>{})||Promise.resolve();
      return new Promise(resolve=>{
        img.addEventListener('load',resolve,{once:true});
        img.addEventListener('error',resolve,{once:true});
      });
    }));
  }

  async function generateStatementPdf(){
    if(pdfRunning)return;
    pdfRunning=true;
    const button=$('btnPdf');
    const originalLabel=button?.textContent||'PDF';
    if(button){button.disabled=true;button.textContent='Generando PDF…';}

    let stage=null;
    try{
      try{if(typeof window.render==='function')window.render();}catch(_){ }
      await ensurePdfLibrary();
      if(!window.html2canvas||!window.jspdf?.jsPDF)throw new Error('Motor PDF incompleto.');

      const pages=visiblePages();
      if(!pages.length)throw new Error('No hay hojas visibles para generar.');
      stage=createPdfStage(pages);
      await waitForImages(stage);

      const papers=Array.from(stage.querySelectorAll('.orion-pdf-paper'));
      const {jsPDF}=window.jspdf;
      const pdf=new jsPDF({orientation:'portrait',unit:'in',format:[5.5,8.5],compress:true});

      for(let index=0;index<papers.length;index+=1){
        const canvas=await window.html2canvas(papers[index],{
          scale:2,
          useCORS:true,
          allowTaint:false,
          backgroundColor:'#FFFFFF',
          logging:false,
          width:528,
          height:816,
          windowWidth:528,
          windowHeight:816,
          scrollX:0,
          scrollY:0
        });
        const image=canvas.toDataURL('image/jpeg',0.97);
        if(index>0)pdf.addPage([5.5,8.5],'portrait');
        pdf.addImage(image,'JPEG',0,0,5.5,8.5,undefined,'FAST');
      }

      pdf.save(filename());
    }catch(error){
      console.error(error);
      alert('No fue posible generar el PDF directo. Se abrirá la impresión en formato Statement para guardar como PDF.');
      window.print();
    }finally{
      stage?.remove();
      if(button){button.disabled=false;button.textContent=originalLabel;}
      pdfRunning=false;
    }
  }

  function installOutputHandlers(){
    document.addEventListener('click',event=>{
      const control=event.target?.closest?.('button,a');
      if(!control)return;
      if(control.id==='btnPdf'){
        event.preventDefault();
        event.stopImmediatePropagation();
        generateStatementPdf();
      }
      if(control.id==='btnWA'){
        event.preventDefault();
        event.stopImmediatePropagation();
        shareWhatsApp();
      }
    },true);
  }

  function init(){
    injectStyles();
    moveActionsToTop();
    installOutputHandlers();
    window.ORION_CMF_OUTPUT_V134={version:OUTPUT_VERSION,pdf:'statement-5.5x8.5',whatsapp:'api+scheme'};
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();