(()=>{
  'use strict';

  const VERSION='1.5.3';
  const $=id=>document.getElementById(id);
  let mounted=false;

  function replaceOwnText(label,text){
    if(!label)return;
    const node=Array.from(label.childNodes).find(item=>item.nodeType===Node.TEXT_NODE&&item.textContent.trim());
    if(node)node.textContent=text;
    else label.insertBefore(document.createTextNode(text),label.firstChild||null);
  }

  function renameField(id,text){
    const field=$(id);
    const label=field?.closest('label');
    if(label)replaceOwnText(label,text);
  }

  function normalizeFieldLabels(){
    [
      ['oaV148Plan','Planificado'],
      ['oaV148Admin','Administrado'],
      ['pointPlanned','Planificado'],
      ['pointAdmin','Administrado'],
      ['bulkPlan','Planificado'],
      ['bulkAdmin','Administrado']
    ].forEach(([id,text])=>renameField(id,text));

    document.querySelectorAll('label').forEach(label=>{
      Array.from(label.childNodes).forEach(node=>{
        if(node.nodeType!==Node.TEXT_NODE)return;
        const value=node.textContent.trim();
        if(/^(U\s*)?plan(ificado)?(\s*por punto)?$/i.test(value)||/^Planificado por punto$/i.test(value))node.textContent='Planificado';
        if(/^Administrado(\s*por punto)?$/i.test(value)||/^U administradas por punto$/i.test(value))node.textContent='Administrado';
      });
    });
  }

  function hideStatusField(select){
    if(!select)return;
    const label=select.closest('label');
    if(label)label.classList.add('oa-v153-hidden-status');
    if(Array.from(select.options||[]).some(option=>option.value==='auto'))select.value='auto';
  }

  function removeRedundantStatus(){
    hideStatusField($('oaV148Status'));
    hideStatusField($('pointStatus'));
    document.querySelectorAll('.oa-record-selection-card select,.oa-record-batch-grid select').forEach(select=>{
      const label=select.closest('label');
      if(label&&/estado/i.test(label.textContent))hideStatusField(select);
    });
  }

  function updateVersionIdentity(){
    document.documentElement.classList.add('oa-ui-v153');
    document.documentElement.dataset.orionAestheticsVersion=VERSION;
    document.title=`ORION Armonización Orofacial V${VERSION}`;
    document.querySelectorAll('.oa-version').forEach(node=>{node.textContent=`V${VERSION}`;});
  }

  function normalizeMultiButton(){
    const button=$('oaMultiToggle');
    if(!button)return;
    const expected=button.classList.contains('active')?'✓ Selección múltiple':'Selección múltiple';
    if(button.textContent!==expected)button.textContent=expected;
    button.title='Activa este modo y toca dos o más puntos para editarlos juntos.';
    button.setAttribute('aria-label',button.title);
  }

  function ensureSelectionControls(){
    const tools=$('oaMapMobileTools');
    const selection=$('oaSelectionBar');
    if(tools)tools.hidden=false;
    if(selection)selection.hidden=false;
    normalizeMultiButton();

    const apply=$('oaApplySelection');
    if(apply)apply.textContent='Editar selección';

    const observerTarget=$('oaMultiToggle');
    if(observerTarget&&!observerTarget.dataset.oaV153Observed){
      observerTarget.dataset.oaV153Observed='true';
      new MutationObserver(()=>requestAnimationFrame(normalizeMultiButton)).observe(observerTarget,{childList:true,characterData:true,subtree:true,attributes:true,attributeFilter:['class']});
    }
  }

  function enhanceInlineContext(){
    const context=$('oaInlineEditorContext');
    const atlas=$('atlasShell');
    const panel=document.querySelector('.oa-map-panel');
    if(!context||!atlas||!panel)return;

    const detail=context.querySelector('span');
    if(detail)detail.textContent='Edita un punto o varios sin abandonar el mapa.';

    const recordButton=$('oaInlineGoRecord');
    if(recordButton)recordButton.textContent='Editar en Registro';

    if(!$('oaV153SeeAtlas')){
      const button=document.createElement('button');
      button.type='button';
      button.id='oaV153SeeAtlas';
      button.textContent='Ver punto en mapa';
      button.addEventListener('click',()=>{
        const panelTop=panel.getBoundingClientRect().top;
        const atlasTop=atlas.getBoundingClientRect().top;
        panel.scrollTo({top:Math.max(0,panel.scrollTop+(atlasTop-panelTop)-96),behavior:'smooth'});
      });
      context.append(button);
    }
  }

  function updateViewStatus(){
    const status=$('oaV150ViewStatus');
    if(!status)return;
    const first=status.querySelector('span');
    if(first){
      const value=$('oaV150ScaleValue')?.textContent||'100 %';
      first.innerHTML=`Vista del atlas: <strong id="oaV150ScaleValue">${value}</strong>`;
    }
  }

  function bindPrintConfirmation(button){
    if(!button||button.dataset.oaV153PrintBound)return;
    button.dataset.oaV153PrintBound='true';
    button.addEventListener('click',event=>{
      if(button.dataset.oaV153Approved==='true'){
        delete button.dataset.oaV153Approved;
        return;
      }
      event.preventDefault();
      event.stopImmediatePropagation();
      const approved=window.confirm('Confirma que revisaste el plan de puntos y las cantidades.\n\nAceptar: imprimir o exportar.\nCancelar: volver para modificar el plan.');
      if(!approved)return;
      button.dataset.oaV153Approved='true';
      setTimeout(()=>button.click(),0);
    },true);
  }

  function bindPrintReview(){
    bindPrintConfirmation($('btnPrint'));
    bindPrintConfirmation($('btnPrintTop'));
  }

  function deriveVisibleStatus(){
    const planned=Number.parseFloat(String($('pointPlanned')?.value||'0').replace(',','.'))||0;
    const administered=Number.parseFloat(String($('pointAdmin')?.value||'0').replace(',','.'))||0;
    const status=$('pointStatus');
    if(status)status.value=administered>0?'administered':planned>0?'planned':'suggested';
  }

  function bindAutomaticStatus(){
    ['pointPlanned','pointAdmin'].forEach(id=>{
      const input=$(id);
      if(!input||input.dataset.oaV153Bound)return;
      input.dataset.oaV153Bound='true';
      input.addEventListener('input',deriveVisibleStatus);
    });
  }

  function refresh(){
    updateVersionIdentity();
    normalizeFieldLabels();
    removeRedundantStatus();
    ensureSelectionControls();
    enhanceInlineContext();
    updateViewStatus();
    bindPrintReview();
    bindAutomaticStatus();
  }

  function observeDynamicUI(){
    if(mounted)return;
    mounted=true;
    const observer=new MutationObserver(()=>requestAnimationFrame(refresh));
    observer.observe(document.body,{subtree:true,childList:true});
  }

  function boot(){
    if(!$('atlasShell')||!$('pointLayer')||!document.querySelector('.oa-map-panel')){
      setTimeout(boot,100);
      return;
    }
    refresh();
    observeDynamicUI();
  }

  boot();
})();
