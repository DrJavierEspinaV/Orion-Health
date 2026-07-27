(()=>{
  'use strict';

  const AUDIT_VERSION = 'CMF-2026.07.26-V1';
  const $ = id => document.getElementById(id);

  const ADULT = {
    Post_Qx1: `IBUPROFENO 400 mg
1 comprimido cada 8 horas por 48–72 horas; luego solo si es necesario.
Máximo en esta plantilla: 1.200 mg/día. No usar si existe contraindicación para AINE.

PARACETAMOL 500 mg
1 comprimido junto con ibuprofeno cada 8 horas por 48–72 horas; luego solo si es necesario.
Máximo: 3.000 mg/día, considerando todas las fuentes de paracetamol.

CLORHEXIDINA 0,12% — solo si fue indicada
Enjuagar con 15 ml durante 30 segundos y eliminar, cada 12 horas por 7–14 días. No ingerir.

Antibiótico y corticoide: no se agregan de rutina; requieren indicación clínica individual.

Control: ____________________ a las __________ horas.`,

    Post_Qx2: `PARACETAMOL 1 g
1 comprimido cada 8 horas por 48–72 horas; luego solo si es necesario.
Máximo: 3.000 mg/día, considerando todas las fuentes de paracetamol.

Usar esta plantilla cuando un AINE no sea apropiado. Verificar enfermedad hepática, consumo de alcohol y medicación concomitante.

Antibiótico y corticoide: no se agregan de rutina; requieren indicación clínica individual.

Control: ____________________ a las __________ horas.`,

    PRE_QX: `MEDICACIÓN PREOPERATORIA
No indicar analgésico, antiinflamatorio, corticoide ni antibiótico sistémico de manera automática.

Definir una pauta individual solo después de revisar:
• diagnóstico y magnitud del procedimiento;
• alergias y reacciones previas;
• embarazo/lactancia;
• función renal y hepática;
• HTA, diabetes, anticoagulantes y antiagregantes;
• indicación específica de profilaxis antimicrobiana.`,

    alergia_penicilina: `INFECCIÓN ODONTOGÉNICA CON COMPROMISO SISTÉMICO — ALERGIA A PENICILINA
Usar únicamente cuando exista indicación de antibiótico y junto con el tratamiento odontológico definitivo.

AZITROMICINA 500 mg
Día 1: 1 comprimido.
Días 2 a 5: 250 mg cada 24 horas.

Reevaluar clínicamente dentro de 3 días. Suspender 24 horas después de la resolución completa de los signos y síntomas sistémicos.

Clindamicina no queda como alternativa automática por su mayor riesgo de infección por C. difficile. Individualizar cuando no exista una opción más segura.`,

    hipertenso: `PARACETAMOL 1 g
1 comprimido cada 8 horas por 48–72 horas; luego solo si es necesario.
Máximo: 3.000 mg/día.

Paciente con HTA:
• comprobar control tensional y tratamiento habitual;
• evitar AINE si la HTA está descompensada, existe nefropatía o hay interacción relevante;
• no incorporar meloxicam de forma automática;
• individualizar toda pauta antiinflamatoria y usar la menor dosis eficaz por el menor tiempo posible.`,

    diabetico: `PARACETAMOL 1 g
1 comprimido cada 8 horas por 48–72 horas; luego solo si es necesario.
Máximo: 3.000 mg/día.

Paciente con diabetes:
• verificar glicemia, función renal, cicatrización y tratamiento habitual;
• no indicar profilaxis antibiótica automática solo por el diagnóstico de diabetes;
• si existe infección con compromiso sistémico, utilizar la pauta específica e indicar control estrecho.`,

    embarazo: `PARACETAMOL 500–1.000 mg
Cada 8 horas solo si es necesario.
Máximo: 3.000 mg/día, considerando todas las fuentes de paracetamol.

Embarazo/lactancia:
• confirmar edad gestacional y antecedentes obstétricos;
• no agregar antibiótico de rutina;
• amoxicilina solo cuando exista una indicación infecciosa concreta y ausencia de alergia;
• evitar AINE, especialmente desde las 20 semanas de gestación, salvo indicación médica específica.`
  };

  function pediatricPain(){
    const kg = Number($('p_peso')?.value || 0);
    const age = Number($('p_edad')?.value || 0);
    if(!(kg > 0 && kg <= 150)) return 'INGRESE Y CONFIRME UN PESO VÁLIDO ANTES DE CALCULAR.';
    const apap = Math.min(1000, Math.round(kg * 15));
    const apapMl = ((apap / 120) * 5).toFixed(1);
    const lines = [
      'PARACETAMOL suspensión 120 mg/5 ml',
      `Dosis calculada: ${apap} mg (≈ ${apapMl} ml) cada 6 horas solo si es necesario.`,
      'Límite: 75 mg/kg/día y nunca más de 3.000 mg/día en esta plantilla.'
    ];
    if(age >= 0.5){
      const ibu = Math.min(400, Math.round(kg * 10));
      const ibuMl = ((ibu / 100) * 5).toFixed(1);
      lines.push('', 'IBUPROFENO suspensión 100 mg/5 ml', `Dosis calculada: ${ibu} mg (≈ ${ibuMl} ml) cada 8 horas solo si es necesario.`, 'Límite: 30 mg/kg/día y máximo 1.200 mg/día en esta plantilla. No usar si existe contraindicación para AINE.');
    }else{
      lines.push('', 'IBUPROFENO: no se genera porque la edad registrada es menor de 6 meses o no está confirmada.');
    }
    lines.push('', 'CONFIRMAR: edad, peso, alergias, hidratación, función renal/hepática, presentación comercial y dosis máxima antes de emitir.');
    return lines.join('\n');
  }

  function pediatricAmoxicillin(){
    const kg = Number($('p_peso')?.value || 0);
    if(!(kg > 0 && kg <= 150)) return 'INGRESE Y CONFIRME UN PESO VÁLIDO ANTES DE CALCULAR.';
    const dose = Math.min(875, Math.round(kg * 22.5));
    const ml = ((dose / 250) * 5).toFixed(1);
    return `AMOXICILINA suspensión 250 mg/5 ml
Dosis calculada: ${dose} mg (≈ ${ml} ml) cada 12 horas.
Duración orientativa: 3–7 días, solo ante infección con indicación antimicrobiana y junto con tratamiento odontológico definitivo.
Máximo por toma: 875 mg. Reevaluar dentro de 3 días y suspender 24 horas después de la resolución completa de signos y síntomas sistémicos.

CONFIRMAR: edad, peso, alergia a betalactámicos, función renal, diagnóstico, presentación comercial y dosis adulta máxima antes de emitir.`;
  }

  function setRecipe(text){
    const recipe = $('receta');
    if(!recipe) return;
    recipe.value = text || '';
    try{ if(typeof window.render === 'function') window.render(); }catch(_){ }
    recipe.dispatchEvent(new Event('input',{bubbles:true}));
  }

  function installTemplateOverrides(){
    const adult = $('tplAdulto');
    const pedia = $('tplPedia');
    adult?.addEventListener('change',()=>setTimeout(()=>setRecipe(ADULT[adult.value] || ''),0),true);
    pedia?.addEventListener('change',()=>setTimeout(()=>{
      if(pedia.value === 'pedia_dolor') setRecipe(pediatricPain());
      else if(pedia.value === 'pedia_amoxi') setRecipe(pediatricAmoxicillin());
      else setRecipe('');
    },0),true);

    ['p_peso','p_edad'].forEach(id=>$(id)?.addEventListener('change',()=>{
      if(pedia?.value === 'pedia_dolor') setRecipe(pediatricPain());
      if(pedia?.value === 'pedia_amoxi') setRecipe(pediatricAmoxicillin());
    }));
  }

  function disableUnauditedComponents(){
    const mode = $('modoComp');
    if(mode){
      mode.disabled = true;
      const label = mode.closest('label');
      if(label){ label.style.display='none'; label.setAttribute('aria-hidden','true'); }
    }
    $('panelComponentes')?.classList.add('hidden');
    if($('modoPlant')) $('modoPlant').checked = true;
  }

  function installSafetyGate(){
    const main = document.querySelector('main');
    if(!main || $('orionClinicalAuditCMF')) return;
    const box = document.createElement('section');
    box.id='orionClinicalAuditCMF';
    box.className='no-print';
    box.style.cssText='max-width:72rem;margin:12px auto;padding:14px 16px;border:1px solid #f59e0b;border-radius:16px;background:#fffbeb;color:#78350f;font:14px/1.45 Segoe UI,Arial,sans-serif';
    box.innerHTML=`<strong>Control clínico CMF · ${AUDIT_VERSION}</strong><br>Plantillas revisadas para el piloto. No sustituyen la evaluación profesional ni autorizan antibióticos, AINE, corticoides o dosis pediátricas sin comprobar antecedentes, indicación y dosis máxima.<label style="display:flex;gap:9px;align-items:flex-start;margin-top:9px;font-weight:700"><input id="orionClinicalConfirmCMF" type="checkbox" style="margin-top:3px">Confirmo que revisé diagnóstico, alergias, comorbilidades, interacciones, embarazo/lactancia, función renal/hepática, peso y dosis máxima antes de emitir.</label>`;
    main.insertBefore(box,main.firstChild);

    const protectedIds = new Set(['btnPrint','btnPdf','btnWA','btnCopy']);
    document.addEventListener('click',event=>{
      const button = event.target?.closest?.('button,a');
      if(!button || !protectedIds.has(button.id)) return;
      if(!$('orionClinicalConfirmCMF')?.checked){
        event.preventDefault();
        event.stopImmediatePropagation();
        alert('Debes completar la confirmación clínica antes de emitir, imprimir, copiar o enviar la receta.');
      }
    },true);
  }

  window.ORION_CLINICAL_AUDIT_CMF={version:AUDIT_VERSION,status:'PILOTO FINAL'};
  document.addEventListener('DOMContentLoaded',()=>{
    disableUnauditedComponents();
    installTemplateOverrides();
    installSafetyGate();
  },{once:true});
})();
