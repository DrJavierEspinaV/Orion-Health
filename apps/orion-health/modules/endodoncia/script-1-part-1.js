/* ========= PLANTILLAS (EDITA AQUÍ POSOLOGÍA RÁPIDO) ========= */
  const PLANTILLAS = {
    Endo_Urgencia:
`IBUPROFENO 600 mg
1 comprimido cada 6–8 hr por 24–48 hr, luego SOS.
(o alternativa: Paracetamol 1 g c/6–8 hr)

PARACETAMOL 1 g (si dolor)
1 comprimido cada 6–8 hr (máx. 3 g/día) por 2–3 días.

*Antibióticos NO de rutina: solo si hay compromiso sistémico, celulitis, fiebre o riesgo médico.`,

    Endo_Post:
`IBUPROFENO 400–600 mg
1 comprimido cada 6–8 hr por 24–48 hr, luego SOS.

PARACETAMOL 1 g (alternativa/adjunto)
1 comprimido cada 6–8 hr por 2–3 días.

*Evitar masticar hasta que pase la anestesia y mientras haya provisional.`,

    Endo_Infeccion:
`IBUPROFENO 400–600 mg
1 comprimido cada 6–8 hr por 24–48 hr, luego SOS.

AMOXICILINA 500 mg
1 comprimido cada 8 hr por 5–7 días
(o AMOXICILINA/CLAVULÁNICO 875/125 mg c/12 hr).

Si alergia a penicilina:
CLINDAMICINA 300 mg
1 comprimido cada 6–8 hr por 5–7 días.

*Antibiótico solo si está indicado clínicamente (sistémico/celulitis).`

  };



  const PEDIA = {
    pedia_dolor: (kg)=> {
      const paracetamolMg = Math.round(kg * 12.5);
      const ibuprofenoMg = Math.round(kg * 10);
      return `PARACETAMOL jarabe (120 mg/5 ml)
Dosis: ${paracetamolMg} mg cada 6–8 horas (≈ ${((paracetamolMg/120)*5).toFixed(1)} ml) por 3–5 días

IBUPROFENO jarabe (100 mg/5 ml)
Dosis: ${ibuprofenoMg} mg cada 6–8 horas (≈ ${((ibuprofenoMg/100)*5).toFixed(1)} ml) por 3–5 días`;
    },
    pedia_amoxi: (kg)=> {
      const totalDia = Math.round(kg * 30);
      const c8h = Math.round(totalDia/3);
      return `AMOXICILINA jarabe 250 mg/5 ml
Dosis diaria: ${totalDia} mg/día en 3 tomas (cada 8 h)
≈ ${((c8h/250)*5).toFixed(1)} ml por toma por 7 días`;
    }
  };

  /* ========= INDICACIONES ========= */
  const INDICACIONES = {

    ind_endo_urgencia: `✅ Post-procedimiento (Urgencia endodóntica)
• Evitar comer/masticar hasta que pase la anestesia (riesgo de morderse).
• Es normal sensibilidad 24–72 hr (a veces más) y dolor al morder si hubo oclusión/periodontitis apical.
• Analgesia según receta; si duele al morder, preferir dieta blanda 48 hr.
• Mantener el diente en reposo (evitar masticar de ese lado).
• Si quedó provisional: NO masticar chicles/caramelos duros; mantener higiene normal y NO “hurgar” con palillos.
• Control/continuación de tratamiento en 7–14 días (o según indicación).

⚠️ Alertas (contactar)
• Aumento rápido de inflamación facial, fiebre >38°C, dificultad para tragar/respirar.
• Dolor que empeora progresivamente pese a analgésicos.
• Provisional se desprende completamente con dolor intenso.`,

    ind_endo_drenaje: `✅ Post-procedimiento (Drenaje / absceso)
• Puede haber drenaje/filtración 24–48 hr: es esperable y ayuda a descomprimir.
• Higiene suave; enjuagues tibios con agua y sal desde el día 2 (no vigorosos).
• Analgesia según receta; dieta blanda.
• Control cercano: 24–72 hr si había inflamación importante.

⚠️ Alertas (contactar)
• Inflamación que se expande, fiebre, escalofríos o malestar general.
• Trismus progresivo o dificultad para abrir la boca.
• Dolor severo persistente o empeoramiento luego de 48–72 hr.`,

    ind_endo_temporal: `✅ Post-procedimiento (Provisional / medicación intracanal)
• Evitar masticar fuerte de ese lado (especialmente alimentos duros/pegajosos).
• Si quedó un material temporal: mantenerlo seco las primeras horas y NO manipularlo.
• Analgesia SOS según receta; sensibilidad al frío/calor puede ocurrir.
• Continuación del tratamiento: idealmente 7–21 días (según caso).

⚠️ Alertas (contactar)
• Pérdida total del temporal con dolor o ingreso de alimentos.
• Dolor que aumenta o aparición de inflamación.`,

    ind_endo_obturacion: `✅ Post-procedimiento (Obturación / finalización)
• Puede haber dolor al morder/sensibilidad 24–72 hr; usualmente cede con AINE/Paracetamol.
• Evitar masticar alimentos duros 24 hr.
• Programar rehabilitación definitiva (resina/corona) lo antes posible para evitar fractura.
• Mantener higiene normal.

⚠️ Alertas (contactar)
• Dolor intenso que no cede, inflamación facial o fiebre.
• Sensación de “diente alto” (oclusión) que persiste: puede requerir ajuste.`,

    ind_endo_retrat: `✅ Post-procedimiento (Retratamiento endodóntico)
• Se puede esperar mayor sensibilidad 48–96 hr.
• Analgesia según receta; dieta blanda si hay dolor al morder.
• Reforzar rehabilitación final (corona) cuando corresponda.
• Control según plan.

⚠️ Alertas (contactar)
• Inflamación, fiebre, malestar general.
• Dolor progresivo o supuración.`

  };


  /* ========= PREQUIRÚRGICAS (base) ========= */

  const PRE_ENDO = `✅ Preprocedimiento (Endodoncia)
• No requiere ayuno (salvo sedación/indicación específica).
• Comer liviano antes de venir (evita llegar en “modo hipoglicemia + drama”).
• Informar alergias, embarazo, anticoagulantes, diabetes/HTA, inmunosupresión.
• Si viene con dolor fuerte, puede tomar su analgésico habitual 30–60 min antes (según tolerancia).
• Traer Rx/CBCT si corresponde y lista de medicamentos actuales.
• Si fue indicado, antibiótico solo en los casos que corresponden (compromiso sistémico/celulitis).`;

  // ==== Inserción PRE/POST ====
  (function(){
    const selInd = document.getElementById('selInd');
    const indicaciones = document.getElementById('indicaciones');
    const safeRender = ()=>{ try{ if(typeof render === 'function') render(); }catch(_){} };

    function insertPre(){
      if(!indicaciones) return;
      const current = (indicaciones.value || '').trim();
      const add = PRE_ENDO.trim();
      indicaciones.value = current ? `${current}\n\n${add}` : add;
      safeRender();
    }
    function insertPost(){
      if(!selInd || !indicaciones) return;
      const key = selInd.value; if(!key) return;
      const post = (INDICACIONES[key] || '').trim();
      const current = (indicaciones.value || '').trim();
      indicaciones.value = current ? `${current}\n\n${post}` : post;
      safeRender();
    }
    function insertAmbas(){
      if(!selInd || !indicaciones) return;
      const key = selInd.value; if(!key) return;
      const post = (INDICACIONES[key] || '').trim();
      const pre = PRE_ENDO.trim();
      indicaciones.value = `${pre}

${post}`.trim();
      safeRender();
    }

    // Desacoplar listeners duplicados
    ['insPre','insPost','insAmbas'].forEach(id=>{
      const old = document.getElementById(id);
      if(!old) return;
      const clone = old.cloneNode(true);
      old.parentNode.replaceChild(clone, old);
    });
    document.getElementById('insPre')?.addEventListener('click', insertPre);
    document.getElementById('insPost')?.addEventListener('click', insertPost);
    document.getElementById('insAmbas')?.addEventListener('click', insertAmbas);
  })();

  /* ========= DOM ========= */
  const $ = (id)=>document.getElementById(id);
  const p_nombre=$('p_nombre'), p_rut=$('p_rut'), p_edad=$('p_edad'), p_peso=$('p_peso');
  const p_dx=$('p_dx'), p_dx2=$('p_dx2');
  const p_motivo=$('p_motivo');
  const especialidad=$('especialidad');
  const v_fecha=$('v_fecha'), v_nombre=$('v_nombre'), v_rut=$('v_rut'),
        v_edad=$('v_edad'), v_peso=$('v_peso'), v_dx=$('v_dx');
  const receta=$('receta'), indicaciones=$('indicaciones');
  const tplAdulto=$('tplAdulto'), tplPedia=$('tplPedia');
  const panelPlantillas=$('panelPlantillas'), panelComponentes=$('panelComponentes');
  const modoPlant=$('modoPlant'), modoComp=$('modoComp');
  const selInd=$('selInd');

  v_fecha.textContent = new Date().toLocaleDateString('es-CL');

  function syncModo(){
    const isPlant = modoPlant.checked;
    panelPlantillas.classList.toggle('hidden', !isPlant);
    panelComponentes.classList.toggle('hidden', isPlant);
  }
  modoPlant.addEventListener('change', syncModo);
  modoComp.addEventListener('change', syncModo);
  syncModo();

  tplAdulto?.addEventListener('change', ()=>{ receta.value = PLANTILLAS[tplAdulto.value] || ''; render(); });
