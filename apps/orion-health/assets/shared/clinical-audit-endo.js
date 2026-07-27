(()=>{
  'use strict';

  const AUDIT_VERSION='ENDO-2026.07.26-V1';
  const $=id=>document.getElementById(id);

  const ADULT={
    Endo_Urgencia:`IBUPROFENO 400 mg
1 comprimido cada 8 horas por 24–48 horas; luego solo si es necesario.
Máximo en esta plantilla: 1.200 mg/día. No usar si existe contraindicación para AINE.

PARACETAMOL 500 mg
1 comprimido junto con ibuprofeno cada 8 horas por 24–48 horas; luego solo si es necesario.
Máximo: 3.000 mg/día, considerando todas las fuentes de paracetamol.

Antibióticos: no se indican de rutina en dolor pulpar o periapical localizado sin compromiso sistémico. Priorizar tratamiento endodóntico definitivo.`,

    Endo_Post:`IBUPROFENO 400 mg
1 comprimido cada 8 horas por 24–48 horas; luego solo si es necesario.
Máximo en esta plantilla: 1.200 mg/día. No usar si existe contraindicación para AINE.

PARACETAMOL 500 mg
1 comprimido junto con ibuprofeno cada 8 horas por 24–48 horas; luego solo si es necesario.
Máximo: 3.000 mg/día.

Evitar masticar hasta que pase la anestesia y mientras exista una restauración provisional.`,

    Endo_Infeccion:`INFECCIÓN ENDODÓNTICA CON COMPROMISO SISTÉMICO
Usar antibiótico solo cuando exista fiebre, malestar, celulitis, diseminación o una indicación médica concreta, y siempre junto con el tratamiento odontológico definitivo.

AMOXICILINA 500 mg
1 comprimido cada 8 horas por 3–7 días.
Reevaluar dentro de 3 días. Suspender 24 horas después de la resolución completa de los signos y síntomas sistémicos.

ALERGIA A PENICILINA — cuando corresponda
AZITROMICINA 500 mg el día 1; luego 250 mg cada 24 horas durante los días 2 a 5.

Clindamicina no queda como alternativa automática por su mayor riesgo de infección por C. difficile. Individualizar cuando no exista una opción más segura.`
  };

  function pediatricPain(){
    const kg=Number($('p_peso')?.value||0);
    const age=Number($('p_edad')?.value||0);
    if(!(kg>0&&kg<=150)) return 'INGRESE Y CONFIRME UN PESO VÁLIDO ANTES DE CALCULAR.';
    const apap=Math.min(1000,Math.round(kg*15));
    const apapMl=((apap/120)*5).toFixed(1);
    const lines=['PARACETAMOL suspensión 120 mg/5 ml',`Dosis calculada: ${apap} mg (≈ ${apapMl} ml) cada 6 horas solo si es necesario.`,'Límite: 75 mg/kg/día y nunca más de 3.000 mg/día en esta plantilla.'];
    if(age>=0.5){
      const ibu=Math.min(400,Math.round(kg*10));
      const ibuMl=((ibu/100)*5).toFixed(1);
      lines.push('','IBUPROFENO suspensión 100 mg/5 ml',`Dosis calculada: ${ibu} mg (≈ ${ibuMl} ml) cada 8 horas solo si es necesario.`,'Límite: 30 mg/kg/día y máximo 1.200 mg/día en esta plantilla. No usar si existe contraindicación para AINE.');
    }else{
      lines.push('','IBUPROFENO: no se genera porque la edad registrada es menor de 6 meses o no está confirmada.');
    }
    lines.push('','CONFIRMAR: edad, peso, alergias, hidratación, función renal/hepática, presentación comercial y dosis máxima antes de emitir.');
    return lines.join('\n');
  }

  function pediatricAmoxicillin(){
    const kg=Number($('p_peso')?.value||0);
    if(!(kg>0&&kg<=150)) return 'INGRESE Y CONFIRME UN PESO VÁLIDO ANTES DE CALCULAR.';
    const dose=Math.min(875,Math.round(kg*22.5));
    const ml=((dose/250)*5).toFixed(1);
    return `AMOXICILINA suspensión 250 mg/5 ml
Dosis calculada: ${dose} mg (≈ ${ml} ml) cada 12 horas.
Duración orientativa: 3–7 días, solo ante infección con compromiso sistémico y junto con tratamiento endodóntico definitivo.
Máximo por toma: 875 mg. Reevaluar dentro de 3 días y suspender 24 horas después de la resolución completa de signos y síntomas sistémicos.

CONFIRMAR: edad, peso, alergia a betalactámicos, función renal, diagnóstico, presentación comercial y dosis adulta máxima antes de emitir.`;
  }

  function setRecipe(text){
    const recipe=$('receta');
    if(!recipe)return;
    recipe.value=text||'';
    try{if(typeof window.render==='function')window.render();}catch(_){ }
    recipe.dispatchEvent(new Event('input',{bubbles:true}));
  }

  function overrides(){
    const adult=$('tplAdulto');
    const pedia=$('tplPedia');
    adult?.addEventListener('change',()=>setTimeout(()=>setRecipe(ADULT[adult.value]||''),0),true);
    pedia?.addEventListener('change',()=>setTimeout(()=>{
      if(pedia.value==='pedia_dolor')setRecipe(pediatricPain());
      else if(pedia.value==='pedia_amoxi')setRecipe(pediatricAmoxicillin());
      else setRecipe('');
    },0),true);
    ['p_peso','p_edad'].forEach(id=>$(id)?.addEventListener('change',()=>{
      if(pedia?.value==='pedia_dolor')setRecipe(pediatricPain());
      if(pedia?.value==='pedia_amoxi')setRecipe(pediatricAmoxicillin());
    }));
  }

  function disableComponents(){
    const mode=$('modoComp');
    if(mode){
      mode.disabled=true;
      const label=mode.closest('label');
      if(label){label.style.display='none';label.setAttribute('aria-hidden','true');}
    }
    $('panelComponentes')?.classList.add('hidden');
    if($('modoPlant'))$('modoPlant').checked=true;
  }

  function safetyGate(){
    const main=document.querySelector('main');
    if(!main||$('orionClinicalAuditENDO'))return;
    const box=document.createElement('section');
    box.id='orionClinicalAuditENDO';
    box.className='no-print';
    box.style.cssText='max-width:72rem;margin:12px auto;padding:14px 16px;border:1px solid #f59e0b;border-radius:16px;background:#fffbeb;color:#78350f;font:14px/1.45 Segoe UI,Arial,sans-serif';
    box.innerHTML=`<strong>Control clínico Endodoncia · ${AUDIT_VERSION}</strong><br>Plantillas revisadas para el piloto. El tratamiento odontológico definitivo tiene prioridad; los antibióticos requieren compromiso sistémico u otra indicación concreta.<label style="display:flex;gap:9px;align-items:flex-start;margin-top:9px;font-weight:700"><input id="orionClinicalConfirmENDO" type="checkbox" style="margin-top:3px">Confirmo que revisé diagnóstico, alergias, comorbilidades, interacciones, embarazo/lactancia, función renal/hepática, peso y dosis máxima antes de emitir.</label>`;
    main.insertBefore(box,main.firstChild);
    const protectedIds=new Set(['btnPrint','btnPdf','btnWA','btnCopy']);
    document.addEventListener('click',event=>{
      const button=event.target?.closest?.('button,a');
      if(!button||!protectedIds.has(button.id))return;
      if(!$('orionClinicalConfirmENDO')?.checked){
        event.preventDefault();event.stopImmediatePropagation();
        alert('Debes completar la confirmación clínica antes de emitir, imprimir, copiar o enviar la receta.');
      }
    },true);
  }

  window.ORION_CLINICAL_AUDIT_ENDO={version:AUDIT_VERSION,status:'PILOTO FINAL'};
  document.addEventListener('DOMContentLoaded',()=>{disableComponents();overrides();safetyGate();},{once:true});
})();
