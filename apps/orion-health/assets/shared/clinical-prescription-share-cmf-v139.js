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
    // El bundle expone html2pdf; no exige html2canvas ni jsPDF como globals.
    if(typeof window.html2pdf==='function')return Promise.resolve(window.html2pdf);
    if(pdfLibraryPromise)return pdfLibraryPromise;
    pdfLibraryPromise=new Promise((resolve,reject)=>{
      const existing=document.querySelector('script[data-orion-pdf-bundle="1"]');
      const script=existing||document.createElement('script');
      const verify=()=>{
        if(typeof window.html2pdf==='function')resolve(window.html2pdf);
        else reject(new Error('Motor PDF no disponible. Revisa el acceso a la biblioteca PDF.'));
      };
      script.addEventListener('load',verify,{once:true});
      script.addEventListener('error',()=>reject(new Error('No fue posible cargar el motor PDF.')),{once:true});
      if(!existing){
        script.src=PDF_BUNDLE_URL;
        script.async=true;
        script.dataset.orionPdfBundle='1';
        document.head.appendChild(script);
      }else if(script.readyState==='complete'){
        verify();
      }
    }).catch(error=>{pdfLibraryPromise=null;throw error;});
    return pdfLibraryPromise;
  }

  function visiblePages(){
    const base=PAGE_IDS.map(id=>$(id)).filter(Boolean);
    const extra=[...document.querySelectorAll('[data-orion-document]')];
    const pages=[];
    for(const page of base){
      if(!page.classList.contains('hidden')&&page.getAttribute('aria-hidden')!=='true')pages.push(page);
      if(page.id==='printDoc')for(const documentPage of extra){
        if(!documentPage.classList.contains('hidden'))pages.push(documentPage);
      }
    }
    return pages;
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
    stage.style.cssText='position:absolute;left:0;top:0;width:528px;background:#fff;z-index:99999;pointer-events:none;overflow:visible;';

    const css=document.createElement('style');
    css.textContent=`
      #orionSignedPdfStage .orion-pdf-paper{
        margin:0!important;transform:none!important;left:0!important;top:0!important;
        width:528px!important;
        height:816px!important;
        padding:26.4567px!important;
        box-sizing:border-box!important;
        overflow:hidden!important;
        background:#fff!important;
        position:relative!important;
        break-after:page!important;
        page-break-after:always!important;
      }
      #orionSignedPdfStage .orion-pdf-paper>.page{
        display:block!important;
        width:100%!important;
        max-width:none!important;margin:0!important;transform:none!important;
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
    const html2pdf=await ensurePdfLibrary();
    const pages=visiblePages();
    if(!pages.length)throw new Error('No hay hojas clínicas visibles para generar.');

    const stage=createPdfStage(pages);
    try{
      await waitForImages(stage);
      const papers=[...stage.querySelectorAll('.orion-pdf-paper')];
      const options={
        margin:0,
        image:{type:'jpeg',quality:0.97},
        html2canvas:{scale:2,useCORS:true,allowTaint:false,backgroundColor:'#FFFFFF',
          logging:false,scrollX:0,scrollY:0,windowWidth:528,windowHeight:816,
          onclone:doc=>{
            const stage=doc.getElementById('orionSignedPdfStage');
            if(stage){stage.style.position='absolute';stage.style.left='0';stage.style.top='0';}
            for(const el of doc.querySelectorAll('#orionSignedPdfStage .orion-pdf-paper,#orionSignedPdfStage .page')){
              el.style.margin='0';el.style.transform='none';el.style.left='0';el.style.top='0';
            }
          }},
        jsPDF:{orientation:'portrait',unit:'in',format:[5.5,8.5],compress:true},
        pagebreak:{mode:[]}
      };
      // Cada hoja se rasteriza por separado: no se divide un contenedor alto
      // mediante reglas CSS de salto que producían páginas sin contenido.
      let pdf=null;
      for(let index=0;index<papers.length;index++){
        const worker=html2pdf().set(options).from(papers[index]);
        const canvas=await worker.toCanvas().get('canvas');
        if(!canvas||canvas.width===0||canvas.height===0){
          throw new Error('No se pudo representar la hoja '+(index+1)+'.');
        }
        const context=canvas.getContext('2d',{willReadFrequently:true});
        if(!context)throw new Error('No se puede verificar el contenido de la hoja '+(index+1)+'.');
        const {data}=context.getImageData(0,0,canvas.width,canvas.height);
        let hasInk=false;
        for(let p=0;p<data.length;p+=Math.max(4,Math.floor(data.length/40000/4)*4)){
          if(data[p+3]>100&&(data[p]<218||data[p+1]<218||data[p+2]<218)){hasInk=true;break;}
        }
        if(!hasInk)throw new Error('La hoja '+(index+1)+' está en blanco. Se canceló la exportación.');
        if(!pdf){
          pdf=await worker.toPdf().get('pdf');
          if(!pdf)throw new Error('No se pudo crear el PDF.');
        }else{
          pdf.addPage([5.5,8.5],'portrait');
          pdf.addImage(canvas.toDataURL('image/jpeg',0.97),'JPEG',0,0,5.5,8.5,undefined,'FAST');
        }
      }
      if(pdf.internal?.getNumberOfPages?.()!==pages.length){
        throw new Error('PDF incompleto: el número de hojas no coincide.');
      }
      pdf.setProperties?.({
        title:`Receta ORION ${auth.folio}`,
        subject:`Prescripción autorizada ${auth.folio} · ${auth.verificationCode} · ${auth.issuedLabel}`,
        author:'Dr. Javier Espina Videla',
        keywords:`${auth.folio},${auth.verificationCode},${auth.contentHash}`,
        creator:'ORION Dental App'
      });
      try{pdf.setCreationDate?.(new Date(auth.issuedAt));}catch(_){ }
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

  async function shareWhatsApp(reservedTab=null,recipient=''){
    const auth=await authorization('WHATSAPP');
    if(!auth){reservedTab?.close?.();return;}
    const text=buildClinicalText(auth);
    const webUrl='https://api.whatsapp.com/send?phone='+recipient+'&text='+encodeURIComponent(text);
    // Solo abrir WhatsApp con el texto clínico: no generar ni descargar PDF.
    if(reservedTab&&!reservedTab.closed)reservedTab.location.replace(webUrl);
    else window.location.assign(webUrl);
    await window.ORION_CMF_RX_AUTH?.logOutput?.('WHATSAPP_TEXT_PREPARED',auth);
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

  async function handle(control,reservedTab=null,recipient=''){
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
        await shareWhatsApp(reservedTab,recipient);
      }else if(control.id==='btnPrint'){
        await printPrescription();
      }else if(control.id==='btnCopy'){
        await copyPrescription();
      }
    }catch(error){
      reservedTab?.close?.();
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
      // Reservar la pestaña durante el gesto del usuario evita bloqueos de popup
      // después de la generación asíncrona del documento.
      let recipient='';
      if(control.id==='btnWA'){
        const raw=window.prompt('Número WhatsApp del paciente con código de país (ej.: 56912345678):','');
        if(raw===null)return;
        recipient=String(raw).replace(/[^0-9]/g,'');
        if(!/^[0-9]{8,15}$/.test(recipient)){
          alert('Ingresa un número válido con código de país, sin + ni espacios.');
          return;
        }
      }
      const reservedTab=control.id==='btnWA'&&!(/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent))
        ?window.open('about:blank','_blank'):null;
      handle(control,reservedTab,recipient);
    },true);
    window.ORION_CMF_RX_SHARE={version:VERSION,pdf:'signed-statement',whatsapp:'file-share+fallback'};
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
})();
