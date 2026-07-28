(()=>{
  'use strict';

  const NPS_VERSION='CMF-NPS-2026.07.28-V1';
  const NPS_LABEL='Encuesta de satisfacción (NPS):';
  const NPS_TEXT='Encuesta de satisfacción (NPS): Puede recibir una encuesta aleatoria sobre su experiencia de hoy. Responderla toma 1 min y nos ayuda a mejorar. ¡Gracias por su tiempo!';
  const OUTPUT_CONTROLS=new Set(['btnPrint','btnPdf','btnWA','btnCopy','orionClinicalTabPreview']);
  const RECIPE_CONTROLS=new Set(['tplAdulto','tplPedia','selAnalgesico','selATB','selCorti','addAnalgesico','addATB','addCorti']);

  const recipe=()=>document.getElementById('receta');

  function withoutNpsLines(value){
    return String(value||'')
      .split(/\r?\n/)
      .filter(line=>!/^\s*Encuesta de satisfacción \(NPS\):/i.test(line))
      .join('\n')
      .replace(/\n{3,}/g,'\n\n')
      .trim();
  }

  function composeWithNps(value){
    const clean=withoutNpsLines(value);
    if(!clean)return NPS_TEXT;

    const lines=clean.split('\n');
    const closingIndex=lines.findIndex(line=>/^\s*(?:Control:|Ya tiene Cita\b)/i.test(line));
    if(closingIndex<0)return `${clean}\n\n${NPS_TEXT}`;

    const before=lines.slice(0,closingIndex).join('\n').trimEnd();
    const after=lines.slice(closingIndex).join('\n').trimStart();
    return `${before}\n\n${NPS_TEXT}\n\n${after}`.trim();
  }

  function ensureNps({render=true}={}){
    const field=recipe();
    if(!field)return false;
    const next=composeWithNps(field.value);
    if(field.value===next)return false;
    field.value=next;
    if(render){
      try{if(typeof window.render==='function')window.render();}catch(_){ }
    }
    return true;
  }

  function scheduleEnsure(){
    window.setTimeout(()=>ensureNps(),0);
  }

  function installListeners(){
    document.addEventListener('click',event=>{
      const control=event.target?.closest?.('button,a');
      if(!control)return;
      if(OUTPUT_CONTROLS.has(control.id))ensureNps();
      else if(RECIPE_CONTROLS.has(control.id))scheduleEnsure();
    },true);

    document.addEventListener('change',event=>{
      if(RECIPE_CONTROLS.has(event.target?.id))scheduleEnsure();
    });

    document.addEventListener('blur',event=>{
      if(event.target?.id==='receta')ensureNps();
    },true);
  }

  function init(){
    ensureNps();
    installListeners();
    window.ORION_CMF_NPS_V136={
      version:NPS_VERSION,
      mandatory:true,
      label:NPS_LABEL,
      ensure:ensureNps
    };
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
