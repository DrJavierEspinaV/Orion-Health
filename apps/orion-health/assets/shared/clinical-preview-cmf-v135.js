(()=>{
  'use strict';

  const PREVIEW_VERSION='CMF-PREVIEW-2026.07.28-V1';
  const PAGE_IDS=['printSheet','printSheet2','printDoc','printExamLab','printExamImg','printInter'];
  const $=id=>document.getElementById(id);

  function injectStyles(){
    if($('orionCmfPreviewStyles'))return;
    const style=document.createElement('style');
    style.id='orionCmfPreviewStyles';
    style.textContent=`
      .orion-clinical-tabs{
        display:flex;
        align-items:center;
        gap:8px;
        margin:0 0 16px;
        padding:6px;
        border:1px solid #dbe7f3;
        border-radius:14px;
        background:#f8fafc;
      }
      .orion-clinical-tab{
        appearance:none;
        border:1px solid transparent;
        border-radius:10px;
        background:transparent;
        color:#334155;
        padding:10px 14px;
        font-size:13px;
        font-weight:800;
        cursor:pointer;
      }
      .orion-clinical-tab[aria-selected="true"]{
        border-color:#bfdbfe;
        background:#fff;
        color:#0f3f5f;
        box-shadow:0 3px 10px rgba(15,23,42,.06);
      }
      .orion-tab-hidden{display:none!important;}
      #orionClinicalEditPane{min-width:0;}
      #orionPrintPreviewPane{
        min-width:0;
        padding:14px;
        border:1px solid #dbe7f3;
        border-radius:16px;
        background:#eef4f8;
      }
      .orion-preview-header{
        display:flex;
        align-items:flex-start;
        justify-content:space-between;
        gap:12px;
        margin:0 auto 12px;
        max-width:5.5in;
      }
      .orion-preview-title{font-size:15px;font-weight:900;color:#0f3f5f;}
      .orion-preview-help{margin-top:3px;font-size:12px;line-height:1.35;color:#64748b;}
      #orionPrintPreviewPages{min-width:0;}
      #orionPrintPreviewPages>.page{
        width:min(100%,5.5in)!important;
        max-width:5.5in!important;
        margin:0 auto 16px!important;
        background:#fff!important;
        box-shadow:0 8px 22px rgba(15,23,42,.10)!important;
      }
      #orionPrintPreviewPages>.page:last-child{margin-bottom:0!important;}
      @media(max-width:640px){
        .orion-clinical-tabs{display:grid;grid-template-columns:1fr 1fr;}
        .orion-clinical-tab{width:100%;padding:10px 8px;font-size:12px;}
        #orionPrintPreviewPane{padding:8px;}
        .orion-preview-header{padding:4px 2px;}
      }
      @media print{
        #orionClinicalTabs,#orionClinicalEditPane,.orion-preview-header{display:none!important;}
        #orionPrintPreviewPane,
        #orionPrintPreviewPane.orion-tab-hidden{
          display:block!important;
          padding:0!important;
          margin:0!important;
          border:0!important;
          border-radius:0!important;
          background:#fff!important;
        }
        #orionPrintPreviewPages{display:block!important;}
        #orionPrintPreviewPages>.page{
          width:auto!important;
          max-width:none!important;
          margin:0!important;
          box-shadow:none!important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function makeTab(id,label,controls,selected){
    const button=document.createElement('button');
    button.id=id;
    button.type='button';
    button.className='orion-clinical-tab';
    button.setAttribute('role','tab');
    button.setAttribute('aria-controls',controls);
    button.setAttribute('aria-selected',selected?'true':'false');
    button.tabIndex=selected?0:-1;
    button.textContent=label;
    return button;
  }

  function activate(mode,{focus=false}={}){
    const preview=mode==='preview';
    const editPane=$('orionClinicalEditPane');
    const previewPane=$('orionPrintPreviewPane');
    const editTab=$('orionClinicalTabEdit');
    const previewTab=$('orionClinicalTabPreview');
    if(!editPane||!previewPane||!editTab||!previewTab)return;

    if(preview){
      try{if(typeof window.render==='function')window.render();}catch(_){ }
    }

    editPane.classList.toggle('orion-tab-hidden',preview);
    previewPane.classList.toggle('orion-tab-hidden',!preview);
    editPane.setAttribute('aria-hidden',preview?'true':'false');
    previewPane.setAttribute('aria-hidden',preview?'false':'true');
    editTab.setAttribute('aria-selected',preview?'false':'true');
    previewTab.setAttribute('aria-selected',preview?'true':'false');
    editTab.tabIndex=preview?-1:0;
    previewTab.tabIndex=preview?0:-1;
    document.body.classList.toggle('orion-cmf-preview-mode',preview);
    if(focus)(preview?previewTab:editTab).focus();
    window.dispatchEvent(new CustomEvent('ORION_CMF_TAB_CHANGE',{detail:{mode}}));
  }

  function buildTabs(main,pages){
    if($('orionClinicalTabs'))return;
    const actions=document.querySelector('.orion-actions-top');

    const tabs=document.createElement('div');
    tabs.id='orionClinicalTabs';
    tabs.className='orion-clinical-tabs no-print';
    tabs.setAttribute('role','tablist');
    tabs.setAttribute('aria-label','Secciones de ORION Clínico CMF');

    const editTab=makeTab('orionClinicalTabEdit','Edición clínica','orionClinicalEditPane',true);
    const previewTab=makeTab('orionClinicalTabPreview','Vista previa / Impresión','orionPrintPreviewPane',false);
    tabs.append(editTab,previewTab);

    const editPane=document.createElement('div');
    editPane.id='orionClinicalEditPane';
    editPane.setAttribute('role','tabpanel');
    editPane.setAttribute('aria-labelledby','orionClinicalTabEdit');

    const previewPane=document.createElement('section');
    previewPane.id='orionPrintPreviewPane';
    previewPane.className='orion-tab-hidden';
    previewPane.setAttribute('role','tabpanel');
    previewPane.setAttribute('aria-labelledby','orionClinicalTabPreview');
    previewPane.setAttribute('aria-hidden','true');

    const previewHeader=document.createElement('div');
    previewHeader.className='orion-preview-header no-print';
    previewHeader.innerHTML='<div><div class="orion-preview-title">Vista previa de impresión</div><div class="orion-preview-help">Formato Statement 5,5 × 8,5 pulgadas. Solo se muestran aquí las hojas que serán emitidas.</div></div>';

    const previewPages=document.createElement('div');
    previewPages.id='orionPrintPreviewPages';
    previewPane.append(previewHeader,previewPages);

    const originalChildren=Array.from(main.children);
    const pageSet=new Set(pages);
    const editorChildren=originalChildren.filter(node=>node!==actions&&!pageSet.has(node));

    if(actions&&actions.parentElement===main)actions.insertAdjacentElement('afterend',tabs);
    else main.prepend(tabs);
    tabs.insertAdjacentElement('afterend',editPane);
    editorChildren.forEach(node=>editPane.appendChild(node));
    pages.forEach(page=>previewPages.appendChild(page));
    main.appendChild(previewPane);

    editTab.addEventListener('click',()=>activate('edit',{focus:true}));
    previewTab.addEventListener('click',()=>activate('preview',{focus:true}));
    tabs.addEventListener('keydown',event=>{
      if(event.key!=='ArrowLeft'&&event.key!=='ArrowRight')return;
      event.preventDefault();
      activate(editTab.getAttribute('aria-selected')==='true'?'preview':'edit',{focus:true});
    });

    activate('edit');
  }

  function init(){
    injectStyles();
    const main=document.querySelector('main');
    const pages=PAGE_IDS.map(id=>$(id)).filter(Boolean);
    if(!main||!pages.length)return;
    buildTabs(main,pages);
    window.ORION_CMF_PREVIEW_V135={version:PREVIEW_VERSION,defaultTab:'edit',preview:'on-demand',pages:PAGE_IDS.slice()};
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
