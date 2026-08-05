(()=>{
  'use strict';

  const VERSION='1.6.9';
  const PROCEDURE_KEY='orion_aesthetic_procedure_v145';
  const MULTI_KEY='orion_aesthetic_multi_selection_v148';
  const SETTINGS_KEY='orion_aesthetic_v160_settings';
  const LOCK_KEY='orion_aesthetic_v160_lock';
  const $=id=>document.getElementById(id);
  const mobileQuery=window.matchMedia('(max-width:920px)');

  let dock=null;
  let openingContext=false;
  let refreshQueued=false;
  let holdMapUntil=0;
  let explicitTabUntil=0;

  const num=value=>{
    const parsed=Number.parseFloat(String(value??'').replace(',','.'));
    return Number.isFinite(parsed)?parsed:0;
  };
  const fmt=(value,decimals=2)=>num(value).toLocaleString('es-CL',{minimumFractionDigits:decimals,maximumFractionDigits:decimals});
  const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[char]));

  function loadJSON(key,fallback){
    try{return JSON.parse(sessionStorage.getItem(key)||'null')??fallback;}
    catch(_){return fallback;}
  }

  function saveJSON(key,value){
    try{sessionStorage.setItem(key,JSON.stringify(value));return true;}
    catch(_){return false;}
  }

  function procedure(){
    return loadJSON(PROCEDURE_KEY,{points:[],vial:{units:0,dilution:1}});
  }

  function selectedIds(state=procedure()){
    let ids=loadJSON(MULTI_KEY,[]);
    if(!Array.isArray(ids))ids=[];
    const valid=new Set((state.points||[]).map(point=>point.id));
    ids=ids.filter(id=>valid.has(id));
    if(!ids.length&&state.selectedPointId&&valid.has(state.selectedPointId))ids=[state.selectedPointId];
    return ids;
  }

  function settings(){
    return {...{distributionMode:'perPoint'},...loadJSON(SETTINGS_KEY,{})};
  }

  function isLocked(){
    return !!loadJSON(LOCK_KEY,{closed:false}).closed;
  }

  function selectionSignature(ids){
    return ids.slice().sort().join('|');
  }

  function currentTab(){
    return document.body.dataset.mobileTab||procedure().mobileTab||'record';
  }

  function isMapTab(){
    return currentTab()==='map';
  }

  function forceMapTab(explicit=false){
    if(!mobileQuery.matches)return;
    if(!explicit&&!isMapTab())return;
    document.body.dataset.mobileTab='map';
    document.querySelectorAll('[data-mobile-tab]').forEach(button=>{
      button.classList.toggle('active',button.dataset.mobileTab==='map');
    });
    const state=procedure();
    if(state.mobileTab!=='map'){
      state.mobileTab='map';
      saveJSON(PROCEDURE_KEY,state);
    }
  }

  function preserveMapFor(ms=1200,explicit=false){
    holdMapUntil=Date.now()+ms;
    forceMapTab(explicit);
  }

  function labelsFor(ids,state=procedure()){
    return ids.map(id=>state.points.find(point=>point.id===id)?.label||'Punto').filter(Boolean);
  }

  function buildDock(){
    if(dock)return true;
    const atlas=$('atlasShell');
    const mapPanel=document.querySelector('.oa-map-panel');
    const sheet=$('oaPointSheetV148');
    if(!atlas||!mapPanel||!sheet)return false;

    sheet.scrollIntoView=()=>{};

    dock=document.createElement('section');
    dock.id='oaV161MobileDock';
    dock.className='oa-v161-mobile-dock';
    dock.dataset.visible='false';
    dock.dataset.manualHidden='false';
    dock.innerHTML=`
      <div class="oa-v161-dock-head">
        <div><strong id="oaV161DockTitle">Administración del punto</strong><span id="oaV161DockDetail">Ingresa la cantidad sin abandonar el mapa.</span></div>
        <button type="button" class="oa-v161-dock-close" id="oaV161DockClose" aria-label="Minimizar administración">⌄</button>
      </div>
      <div class="oa-v161-selected-chips" id="oaV161DockChips"></div>
      <div class="oa-v161-mode-group">
        <button type="button" data-oa-v161-mode="perPoint">Cantidad por punto</button>
        <button type="button" data-oa-v161-mode="total">Total a distribuir</button>
      </div>
      <div class="oa-v161-entry-grid">
        <label><span id="oaV161AdminLabel">Administrado por punto</span><input id="oaV161Admin" type="number" min="0" step="0.1" inputmode="decimal" placeholder="0"></label>
        <label class="oa-v161-comment-field">Comentario / terapia<textarea id="oaV161Comment" rows="2" placeholder="Producto, plano, técnica u observación"></textarea></label>
      </div>
      <div class="oa-v161-preview">
        <div><span>Puntos</span><strong id="oaV161PreviewCount">0</strong></div>
        <div><span>Por punto</span><strong id="oaV161PreviewPer">0 U</strong></div>
        <div><span>Total / volumen</span><strong id="oaV161PreviewTotal">0 U</strong></div>
      </div>
      <div class="oa-v161-dock-actions">
        <button type="button" class="oa-v161-save" id="oaV161Save">Revisar y guardar</button>
        <button type="button" class="oa-v161-delete" id="oaV161Delete">Eliminar</button>
      </div>
      <p class="oa-v161-map-note">El atlas permanece abierto. Arrastra los puntos para ajustar su ubicación antes de guardar.</p>`;

    atlas.parentNode.insertBefore(dock,atlas);

    $('oaV161DockClose').addEventListener('click',()=>{
      dock.dataset.manualHidden='true';
      dock.dataset.visible='false';
      preserveMapFor(500,false);
    });

    dock.querySelectorAll('[data-oa-v161-mode]').forEach(button=>{
      button.addEventListener('click',()=>{
        const original=document.querySelector(`[data-oa-v160-mode="${button.dataset.oaV161Mode}"]`);
        if(original)original.click();
        else{
          const current=settings();
          current.distributionMode=button.dataset.oaV161Mode;
          saveJSON(SETTINGS_KEY,current);
        }
        syncDock();
      });
    });

    $('oaV161Admin').addEventListener('input',event=>{
      const original=$('oaV148Admin');
      if(original){
        original.value=event.target.value;
        original.dispatchEvent(new Event('input',{bubbles:true}));
      }
      updatePreview();
    });

    $('oaV161Comment').addEventListener('input',event=>{
      const original=$('oaV148Comment');
      if(original){
        original.value=event.target.value;
        original.dispatchEvent(new Event('input',{bubbles:true}));
      }
    });

    $('oaV161Save').addEventListener('click',()=>{
      if(isLocked())return;
      syncHiddenFields();
      preserveMapFor(1600,false);
      $('oaV148Save')?.click();
    });

    $('oaV161Delete').addEventListener('click',()=>{
      if(isLocked())return;
      preserveMapFor(800,false);
      $('oaV148Delete')?.click();
    });

    return true;
  }

  function syncHiddenFields(){
    const admin=$('oaV148Admin');
    const comment=$('oaV148Comment');
    if(admin){
      admin.value=$('oaV161Admin')?.value||'';
      admin.dispatchEvent(new Event('input',{bubbles:true}));
    }
    if(comment){
      comment.value=$('oaV161Comment')?.value||'';
      comment.dispatchEvent(new Event('input',{bubbles:true}));
    }
  }

  function ensureEditorContext(ids){
    if(!isMapTab()||!ids.length||openingContext)return;
    const signature=selectionSignature(ids);
    if(dock?.dataset.contextSignature===signature)return;
    const apply=$('oaApplySelection');
    if(!apply||apply.disabled)return;

    openingContext=true;
    dock.dataset.contextSignature=signature;
    apply.click();
    setTimeout(()=>{
      openingContext=false;
      const sheet=$('oaPointSheetV148');
      if(sheet)sheet.classList.remove('open');
      syncDock(true);
    },40);
  }

  function updatePreview(){
    if(!dock)return;
    const ids=selectedIds();
    const count=ids.length;
    const value=num($('oaV161Admin')?.value);
    const mode=settings().distributionMode;
    const perPoint=count?(mode==='total'?value/count:value):0;
    const total=count?(mode==='total'?value:value*count):0;
    const state=procedure();
    const concentration=num(state.vial?.units)/Math.max(.001,num(state.vial?.dilution));
    const volume=concentration?total/concentration:0;

    $('oaV161PreviewCount').textContent=String(count);
    $('oaV161PreviewPer').textContent=`${fmt(perPoint,2)} U`;
    $('oaV161PreviewTotal').textContent=`${fmt(total,2)} U · ${fmt(volume,3)} mL`;
    $('oaV161AdminLabel').textContent=mode==='total'?'Administrado total':'Administrado por punto';

    dock.querySelectorAll('[data-oa-v161-mode]').forEach(button=>{
      button.classList.toggle('active',button.dataset.oaV161Mode===mode);
    });
  }

  function syncDock(force=false){
    if(!mobileQuery.matches||!buildDock())return;

    if(!isMapTab()){
      dock.dataset.visible='false';
      return;
    }

    const state=procedure();
    const ids=selectedIds(state);
    const count=ids.length;
    const multiActive=$('oaMultiToggle')?.classList.contains('active');
    const shouldShow=count>0&&(!multiActive||count>=2);

    if(!count){
      dock.dataset.visible='false';
      dock.dataset.contextSignature='';
      dock.dataset.manualHidden='false';
      return;
    }

    const signature=selectionSignature(ids);
    const selectionChanged=dock.dataset.selectionSignature!==signature;
    if(selectionChanged){
      dock.dataset.selectionSignature=signature;
      dock.dataset.manualHidden='false';
      dock.dataset.contextSignature='';
    }

    if(shouldShow)ensureEditorContext(ids);

    const manualHidden=dock.dataset.manualHidden==='true';
    dock.dataset.visible=String(shouldShow&&!manualHidden);
    if(!shouldShow||manualHidden)return;

    const labels=labelsFor(ids,state);
    $('oaV161DockTitle').textContent=count===1?'Administración del punto':`Administración conjunta de ${count} puntos`;
    $('oaV161DockDetail').textContent=count===1?'Ingresa la cantidad y guarda sin abandonar el mapa.':'La cantidad se aplicará a la selección activa.';
    $('oaV161DockChips').innerHTML=labels.map(label=>`<span>${esc(label)}</span>`).join('');
    $('oaV161Delete').textContent=count===1?'Eliminar':'Eliminar selección';

    const originalAdmin=$('oaV148Admin');
    const originalComment=$('oaV148Comment');
    if((force||selectionChanged||document.activeElement!==$('oaV161Admin'))&&originalAdmin){
      $('oaV161Admin').value=originalAdmin.value||'';
    }
    if((force||selectionChanged||document.activeElement!==$('oaV161Comment'))&&originalComment){
      $('oaV161Comment').value=originalComment.value||'';
    }

    const locked=isLocked();
    ['oaV161Admin','oaV161Comment','oaV161Save','oaV161Delete'].forEach(id=>{if($(id))$(id).disabled=locked;});
    dock.querySelectorAll('[data-oa-v161-mode]').forEach(button=>{button.disabled=locked;});
    updatePreview();
  }

  function queueSync(force=false){
    if(refreshQueued&&!force)return;
    refreshQueued=true;
    requestAnimationFrame(()=>{
      refreshQueued=false;
      syncDock(force);
    });
  }

  function bindMapEvents(){
    const layer=$('pointLayer');
    if(layer&&!layer.dataset.oaV161Bound){
      layer.dataset.oaV161Bound='true';
      layer.addEventListener('pointerdown',event=>{
        if(!event.target.closest('.oa-point'))return;
        explicitTabUntil=0;
        preserveMapFor(1500,true);
      },true);
      layer.addEventListener('pointerup',event=>{
        if(!event.target.closest('.oa-point'))return;
        preserveMapFor(1500,true);
        setTimeout(()=>queueSync(true),60);
      },true);
    }

    ['oaApplySelection','oaSelectZonePoints','oaMultiToggle'].forEach(id=>{
      const button=$(id);
      if(!button||button.dataset.oaV161Bound)return;
      button.dataset.oaV161Bound='true';
      button.addEventListener('click',()=>{
        dock&&(dock.dataset.manualHidden='false');
        preserveMapFor(1500,true);
        setTimeout(()=>queueSync(true),50);
      },true);
    });

    document.querySelectorAll('[data-mobile-tab]').forEach(button=>{
      if(button.dataset.oaV161Bound)return;
      button.dataset.oaV161Bound='true';
      button.addEventListener('pointerdown',()=>{
        explicitTabUntil=Date.now()+1800;
        if(button.dataset.mobileTab!=='map'){
          holdMapUntil=0;
          if(dock)dock.dataset.visible='false';
        }
      },true);
      button.addEventListener('click',()=>{
        if(button.dataset.mobileTab!=='map'){
          holdMapUntil=0;
          if(dock)dock.dataset.visible='false';
        }
        setTimeout(()=>queueSync(true),40);
      },true);
    });
  }

  function observe(){
    const sheet=$('oaPointSheetV148');
    if(sheet&&!sheet.dataset.oaV161Observed){
      sheet.dataset.oaV161Observed='true';
      sheet.scrollIntoView=()=>{};
      new MutationObserver(()=>{
        if(!mobileQuery.matches)return;
        if(sheet.classList.contains('open')){
          sheet.classList.remove('open');
          if(isMapTab()){
            preserveMapFor(1600,false);
            queueSync(true);
          }
        }
      }).observe(sheet,{attributes:true,attributeFilter:['class']});
    }

    const selection=$('oaSelectionCount');
    if(selection&&!selection.dataset.oaV161Observed){
      selection.dataset.oaV161Observed='true';
      new MutationObserver(()=>queueSync(true)).observe(selection,{childList:true,characterData:true,subtree:true});
    }

    const layer=$('pointLayer');
    if(layer&&!layer.dataset.oaV161Observed){
      layer.dataset.oaV161Observed='true';
      new MutationObserver(()=>queueSync()).observe(layer,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});
    }

    if(!document.body.dataset.oaV161Observed){
      document.body.dataset.oaV161Observed='true';
      new MutationObserver(()=>{
        if(!mobileQuery.matches)return;
        if(!isMapTab()&&dock)dock.dataset.visible='false';
      }).observe(document.body,{attributes:true,attributeFilter:['data-mobile-tab']});
    }
  }

  function updateVersion(){
    document.documentElement.dataset.orionAestheticsVersion=VERSION;
    document.documentElement.classList.add('oa-v161');
    document.title=`ORION Armonización Orofacial V${VERSION}`;
    document.querySelectorAll('.oa-version').forEach(node=>{node.textContent=`V${VERSION}`;});
  }

  function boot(){
    if(!$('atlasShell')||!$('pointLayer')||!$('oaPointSheetV148')||!$('oaSelectionBar')){
      setTimeout(boot,100);
      return;
    }
    updateVersion();
    buildDock();
    bindMapEvents();
    observe();
    queueSync(true);
    mobileQuery.addEventListener?.('change',()=>{
      if(mobileQuery.matches)queueSync(true);
      else if(dock)dock.dataset.visible='false';
    });
  }

  boot();
})();
