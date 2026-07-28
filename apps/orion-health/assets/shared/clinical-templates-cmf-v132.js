(()=>{
  'use strict';

  const TEMPLATES={
    Post_Qx1:`PARACETAMOL 1 g
1 comprimido cada 8 horas por 3–5 días o SOS.
Máximo: 3 g/día.

KETOPROFENO 50 mg
1 cápsula cada 8 horas por 3 días o SOS.
Tomar con alimentos. No combinar con otro AINE.

DEXAMETASONA 8 mg
Dosis única perioperatoria, solo si fue indicada por el clínico.

Control: ____________________ a las __________ horas.`,

    Post_Qx2:`IBUPROFENO 400 mg
1 comprimido cada 8 horas por 48–72 horas; luego SOS.
Máximo: 1.200 mg/día.

PARACETAMOL 500 mg
1 comprimido junto con ibuprofeno cada 8 horas por 48–72 horas; luego SOS.
Máximo total: 3 g/día.

CLORHEXIDINA 0,12% — solo si fue indicada
15 ml durante 30 segundos cada 12 horas. No ingerir.

Control: ____________________ a las __________ horas.`,

    PRE_QX:`PARACETAMOL 1 g
1 comprimido cada 8 horas; comenzar 24 horas antes.
Máximo: 3 g/día.

KETOPROFENO 50 mg
1 cápsula cada 8 horas; comenzar 24 horas antes.
No combinar con otro AINE.

DEXAMETASONA 8 mg
Dosis única 1 hora antes, solo si fue indicada por el clínico.

Confirmar contraindicaciones antes de usar.`
  };

  const setRecipe=text=>{
    const recipe=document.getElementById('receta');
    if(!recipe)return;
    recipe.value=text||'';
    recipe.dispatchEvent(new Event('input',{bubbles:true}));
    const confirm=document.getElementById('orionClinicalConfirmCMF');
    if(confirm)confirm.checked=false;
    try{if(typeof window.render==='function')window.render();}catch(_){ }
  };

  document.addEventListener('DOMContentLoaded',()=>{
    const adult=document.getElementById('tplAdulto');
    adult?.addEventListener('change',()=>{
      const text=TEMPLATES[adult.value];
      if(text)setTimeout(()=>setRecipe(text),0);
    },true);
    window.ORION_CMF_TEMPLATES_V132={version:'CMF-2026.07.28-V2',templates:Object.keys(TEMPLATES)};
  },{once:true});
})();