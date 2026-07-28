(()=>{
  'use strict';

  const VERSION='2026.07.28-V1';
  const $=id=>document.getElementById(id);

  function confirmation(){
    return $('orionClinicalConfirmCMF')||$('orionClinicalConfirmENDO');
  }

  function invalidateConfirmation(){
    const control=confirmation();
    if(control)control.checked=false;
  }

  function installNotice(toggleRow){
    if(!toggleRow||$('orionComponentCatalogNotice'))return;
    const notice=document.createElement('div');
    notice.id='orionComponentCatalogNotice';
    notice.className='mt-3 rounded-xl border border-sky-200 bg-sky-50 p-3 text-sm text-sky-900';
    notice.innerHTML='<strong>Catálogo por fármacos activo.</strong> Puedes construir la receta por Analgesia, Antibióticos y Corticoides/Otros. Las dosis siguen siendo editables y cada selección exige una nueva confirmación clínica antes de emitir.';
    toggleRow.insertAdjacentElement('afterend',notice);
  }

  function restore(){
    const componentMode=$('modoComp');
    const templateMode=$('modoPlant');
    const componentPanel=$('panelComponentes');
    if(!componentMode||!componentPanel)return;

    componentMode.disabled=false;
    componentMode.removeAttribute('aria-disabled');
    const label=componentMode.closest('label');
    if(label){
      label.style.display='';
      label.removeAttribute('aria-hidden');
    }

    installNotice(label?.parentElement||componentMode.parentElement);

    componentMode.addEventListener('change',()=>{
      invalidateConfirmation();
      if(componentMode.checked){
        componentPanel.classList.remove('hidden');
        $('panelPlantillas')?.classList.add('hidden');
      }
    },true);

    templateMode?.addEventListener('change',()=>{
      invalidateConfirmation();
      if(templateMode.checked){
        componentPanel.classList.add('hidden');
        $('panelPlantillas')?.classList.remove('hidden');
      }
    },true);

    ['addAnalgesico','addATB','addCorti'].forEach(id=>{
      $(id)?.addEventListener('click',invalidateConfirmation,true);
    });

    ['selAnalgesico','selATB','selCorti'].forEach(id=>{
      $(id)?.addEventListener('change',invalidateConfirmation,true);
    });

    window.ORION_COMPONENT_CATALOG={version:VERSION,status:'ACTIVO CON CONTROL CLÍNICO'};
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',restore,{once:true});
  else setTimeout(restore,0);
})();
