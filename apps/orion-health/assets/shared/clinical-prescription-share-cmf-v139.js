(()=>{
  'use strict';

  const VERSION='CMF-RX-SHARE-2026.07.29-V1';
  const PDF_BUNDLE_URL='https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
  const PAGE_IDS=['printSheet','printSheet2','printDoc','printExamLab','printExamImg','printInter'];
  const HANDLED_IDS=new Set(['btnPdf','btnWA','btnPrint','btnCopy']);
  let pdfLibraryPromise=null;
  let running=false;
  const $=id=>document.getElementById(id);

  function value(id){
    return String($(id)?.value||'').trim();
  }

  function buildClinicalText(auth){
    const diagnosis=value('p_dx2')||value('p_dx');
    const lines=[
      'ORION Health — Receta e Indicaciones',
      `Folio: ${auth.folio}`,
      `Emisión: ${auth.issuedLabel}`,
      `Código: ${auth.verificationCode}`,
      '',
      `Paciente: ${value('p_nombre')}`,
      `RUN: ${value('p_rut')}`,
      `Edad: ${value('p_edad')}${value('p_edad')?' años':''}`,
      `Peso: ${value('p_peso')}${value('p_peso')?' kg':''}`,
      `Diagnóstico/Procedimiento: ${diagnosis}`,
      '',
      'RECETA',
      value('receta'),
      '',
      'INDICACIONES',
      value('indicaciones').replace(/^\s*indicaciones?\s*—.*?\n+/i,'').trim(),
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

  function ensurePdfLibrary(){
    if(window.html2canvas&&window.jspdf?.jsPDF)return Promise.resolve();
    if(pdfLibraryPromise)return pdfLibraryPromise;
    pdfLibraryPromise=new Promise((resolve,reject)=>{
      const existing=document.querySelector('script[data-orion-pdf-bundle="1"]');
      if(existing){
        existing.addEventListener('load',resolve,{once:true});
        existing.addEventListener('error',()=>reject(new Error('No fue posible cargar el motor PDF.')),{once:true});
        return;
      }
      const script=document.createElement('script');
      script.src=PDF_BUNDLE_URL;
      script.async=true;
      script.dataset.orionPdfBundle='1';
      script.onload=resolve;
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

  function filename(auth){
    const patient=value('p_nombre')
      .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
      .replace(/[^a-zA-Z0-9]+/g,'_')
      .replace(/^_+|_+$/g,'');
    const base=patient?`Receta_ORION_${patient}`:'Receta_ORION';
    return `${base}_${auth.folio}.pdf`;
  }

  function createPdfStage(pages){
    const stage=document.createElement('div');
    stage.id='orionSignedPdfStage';
    stage.style.cssText='position:absolute;left:-12000px;top:0;width:528px;background:#fff;z-index:-1;';

    const css=document.createElement('style');
    css.textContent=`
      #orionSignedPdfStage .orion-pdf-paper{
        width:528px!important;
        height:816px!important;
        padding:26.4567px!important;
        box-sizing:border-box!important;
        overflow:hidden!important;
        background:#fff!important;
        position:relative!important;
      }
      #orionSignedPdfStage .orion-pdf-paper>.page{
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
      #orionSignedPdfStage .hidden,#orionSignedPdfStage .no-print{display:none!important;}
      #orionSignedPdfStage .orion-print-only{display:block!important;}
      #orionSignedPdfStage [contenteditable="true"]{border:0!important;padding:0!important;background:transparent!important;}
      #orionSignedPdfStage [id^="fixedFoot"] .brand .logo{max-height:52px!important;width:auto!important;}
      #orionSignedPdfStage #printDoc [id^="fixedFoot"] .brand .logo{max-height:58px!important;}
      #orionSignedPdfStage .firmaimg{display:none!important;}
      #orionSignedPdfStage #printSheet .firmaimg{display:block!important;height:100px!important;width:auto!important;opacity:.98!important;margin-bottom:4px!important;}
      #orionSignedPdfStage img,#orionSignedPdfStage svg{-webkit-print-color-adjust:exact;print-color-adjust:exact;}
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
    await Promise.all(images.map(image=>{
      if(image.complete)return image.decode?.().catch(()=>{})||Promise.resolve();
      return new Promise(resolve=>{
        image.addEventListener('load',resolve,{once:true});
        image.addEventListener('error',resolve,{once:true});
      });
    }));
  }

  async function buildSignedPdf(auth){
    try{if(typeof window.render==='function')window.render();}catch(_){ }
    await ensurePdfLibrary();
    if(!window.html2canvas||!window.jspdf?.jsPDF)throw new Error('Motor PDF incompleto.');

    const pages=visiblePages();
    if(!pages.length)throw new Error('No hay hojas visibles para generar.');
    const stage=createPdfStage(pages);

    try{
      await waitForImages(stage);
      const papers=Array.from(stage.querySelectorAll('.orion-pdf-paper'));
      const {jsPDF}=window.jspdf;
      const pdf=new jsPDF({orientation:'portrait',unit:'in',format:[5.5,8.5],compress:true});
      pdf.setProperties?.({
        title:`Receta ORION ${auth.folio}`,
        subject:`Prescripción autorizada ${auth.folio} · ${auth.verificationCode} · ${auth.issuedLabel}`,
        author:'Dr. Javier Espina Videla',
        keywords:`${auth.folio},${auth.verificationCode},${auth.contentHash}`,
        creator:'ORION Dental App 1.3.9'
      });
      try{pdf.setCreationDate?.(new Date(auth.issuedAt));}catch(_){ }

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
      return pdf;
    }finally{
      stage.remove();
    }
  }

  async function authorization(output){
    const api=window.ORION_CMF_RX_AUTH;
    if(!api?.authorize)throw new Error('Módulo de autorización de receta no disponible.');
    return api.authorize(output);
  }

  async function savePdf(){
    const auth=await authorization('PDF');
    if(!auth)return;
    const pdf=await buildSignedPdf(auth);
    pdf.save(filename(auth));
    await window.ORION_CMF_RX_AUTH?.logOutput?.('PDF',auth);
  }

  async function shareWhatsApp(){
    const auth=await authorization('WHATSAPP');
    if(!auth)return;
    const pdf=await buildSignedPdf(auth);
    const blob=pdf.output('blob');
    const file=new File([blob],filename(auth),{type:'application/pdf',lastModified:Date.now()});
    const text=buildClinicalText(auth);

    if(navigator.share&&navigator.canShare?.({files:[file]})){
      try{
        await navigator.share({title:`Receta ORION · ${auth.folio}`,text,files:[file]});
        await window.ORION_CMF_RX_AUTH?.logOutput?.('WHATSAPP_FILE',auth);
        return;
      }catch(error){
        if(error?.name==='AbortError')return;
        console.warn('ORION WhatsApp share:',error);
      }
    }

    pdf.save(filename(auth));
    const encoded=encodeURIComponent(text);
    const webUrl=`https://api.whatsapp.com/send?text=${encoded}`;
    const mobile=/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
    if(mobile){
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
    }else{
      openExternal(webUrl);
    }
    await window.ORION_CMF_RX_AUTH?.logOutput?.('WHATSAPP_PDF_DOWNLOADED',auth);
  }

  async function printPrescription(){
    const auth=await authorization('PRINT');
    if(!auth)return;
    try{if(typeof window.render==='function')window.render();}catch(_){ }
    window.print();
    await window.ORION_CMF_RX_AUTH?.logOutput?.('PRINT',auth);
  }

  async function copyPrescription(){
    const auth=await authorization('COPY');
    if(!auth)return;
    const text=buildClinicalText(auth);
    await navigator.clipboard.writeText(text);
    await window.ORION_CMF_RX_AUTH?.logOutput?.('COPY',auth);
    alert('Texto de receta copiado.');
  }

  async function handle(control){
    if(running)return;
    running=true;
    const original=control.textContent;
    try{
      if(control.id==='btnPdf'){
        control.disabled=true;
        control.textContent='Generando PDF…';
        await savePdf();
      }else if(control.id==='btnWA'){
        control.disabled=true;
        control.textContent='Preparando receta…';
        await shareWhatsApp();
      }else if(control.id==='btnPrint'){
        await printPrescription();
      }else if(control.id==='btnCopy'){
        await copyPrescription();
      }
    }catch(error){
      console.error(error);
      alert(error?.message||'No fue posible completar la emisión de la receta.');
    }finally{
      control.disabled=false;
      control.textContent=original;
      running=false;
    }
  }

  function install(){
    document.addEventListener('click',event=>{
      const control=event.target?.closest?.('button,a');
      if(!control||!HANDLED_IDS.has(control.id))return;
      event.preventDefault();
      event.stopImmediatePropagation();
      handle(control);
    },true);
    window.ORION_CMF_RX_SHARE={version:VERSION,pdf:'signed-statement',whatsapp:'file-share+fallback'};
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
})();
