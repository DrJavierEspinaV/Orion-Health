  tplPedia?.addEventListener('change', ()=>{
    const kg = parseFloat(p_peso.value||'0');
    if(!kg){ alert('Ingresa peso (kg) para cálculo.'); return; }
    if(!confirm('Confirme edad, peso, alergias, función renal/hepática y dosis máxima antes de insertar una dosis pediátrica.')){ tplPedia.selectedIndex=0; return; }
    const txt = PEDIA[tplPedia.value]?.(kg) || '';
    receta.value = (receta.value?receta.value+'\n\n':'') + txt;
    render();
  });

  function addFrom(selectId){
    const s = $(selectId); if(!s?.value) return;
    receta.value = (receta.value?receta.value+'\n\n':'') + s.value;
    s.selectedIndex = 0; render();
  }
  $('addAnalgesico')?.addEventListener('click', ()=> addFrom('selAnalgesico'));
  $('addATB')?.addEventListener('click', ()=> addFrom('selATB'));
  $('addCorti')?.addEventListener('click', ()=> addFrom('selCorti'));

  // Auto-agregar al seleccionar (sin tener que apretar "Agregar")
  ['selAnalgesico','selATB','selCorti'].forEach(id=>{
    $(id)?.addEventListener('change', ()=> addFrom(id));
  });

  // Auto-insertar indicaciones al seleccionar una opción:
  // - Si el campo está vacío: PRE + POST
  // - Si ya hay texto: agrega solo POST
  selInd?.addEventListener('change', ()=>{
    const key = selInd.value; if(!key) return;
    const post = (INDICACIONES[key] || '').trim();
    if(!post) return;
    const cur = (indicaciones.value || '').trim();
    if(!cur){
      indicaciones.value = `${PRE_ENDO.trim()}

${post}`.trim();
    }else{
      indicaciones.value = `${cur}

${post}`.trim();
    }
    selInd.selectedIndex = 0;
    render();
  });

  /* ========= Layout helpers ========= */
  const rootStyle = document.documentElement.style;
  const cw1 = $('contentWrap');

  function isOverflowing(){
    const foot = document.getElementById('fixedFoot');
    const limitY = foot.offsetTop - 5;
    const contentBottom = cw1.offsetTop + cw1.scrollHeight;
    return (contentBottom > limitY);
  }
  function tryAutofit(){
    const defaultInd = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--ind-font')) || 11.0;
    const minInd = 9.6, step = 0.2;
    rootStyle.setProperty('--ind-font', defaultInd + 'pt');
    let size = defaultInd, guard = 0;
    while (isOverflowing() && size > minInd && guard < 30){
      size = +(size - step).toFixed(2);
      rootStyle.setProperty('--ind-font', size + 'pt');
      guard++;
    }
  }

  function fillSecondPageHeader(){
    document.querySelectorAll('.v_fecha2').forEach(el=> el.textContent = new Date().toLocaleDateString('es-CL'));
    document.querySelectorAll('.v_nombre2').forEach(el=> el.textContent = p_nombre.value||'');
    document.querySelectorAll('.v_rut2').forEach(el=> el.textContent = p_rut.value||'');
    document.querySelectorAll('.v_edad2').forEach(el=> el.textContent = p_edad.value?`${p_edad.value} años`:'');
    document.querySelectorAll('.v_peso2').forEach(el=> el.textContent = p_peso.value?`${p_peso.value} kg`:'');
    const motivo = (document.getElementById('p_motivo')?.value || '').trim();
    const dxCore = (p_dx2.value||p_dx.value||'').trim();
    const dxFinal = [motivo, dxCore].filter(Boolean).join(' — ');
    document.querySelectorAll('.v_dx2').forEach(el=> el.textContent = dxFinal);
  }

  function togglePrintBreak(){
    const sheet1 = document.getElementById('printSheet');
    const sheet2 = document.getElementById('printSheet2');
    sheet1.classList.toggle('force-break', !sheet2.classList.contains('hidden'));
  }
  window.addEventListener('beforeprint', togglePrintBreak);
  window.addEventListener('afterprint', ()=> document.getElementById('printSheet').classList.remove('force-break'));

  /* ========= Render principal ========= */
  function render(){
    const motivo = (document.getElementById('p_motivo')?.value || '').trim();
    const dxCore = (p_dx2.value||p_dx.value||'').trim();
    const dxFinal = [motivo, dxCore].filter(Boolean).join(' — ');
    v_nombre.textContent = p_nombre.value||'';
    v_rut.textContent    = p_rut.value||'';
    v_edad.textContent   = p_edad.value?`${p_edad.value} años`:'';
    v_peso.textContent   = p_peso.value?`${p_peso.value} kg`:'';

    // Especialidad en encabezado
    const espSel = document.getElementById('especialidad');
    const espTxt = (espSel?.value || 'Endodoncia');
    document.getElementById('sp_title1') && (document.getElementById('sp_title1').textContent = espTxt);
    document.getElementById('sp_title2') && (document.getElementById('sp_title2').textContent = espTxt);
    document.getElementById('sp_title3') && (document.getElementById('sp_title3').textContent = espTxt);

    v_dx.textContent     = dxFinal;

    function escapeHTML(s){
      return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
    }
    function formatRecetaHTML(s){
      let esc = escapeHTML((s||'').trim());
      // Pone en negrita toda la línea que comience con "Encuesta de satisfacción (NPS):"
      esc = esc.replace(/^(.*Encuesta de satisfacción \(NPS\):.*)$/m, '<strong>$1</strong>');
      return esc;
    }
    document.getElementById('v_receta').innerHTML = formatRecetaHTML(receta.value||'');

    const indTxt = (indicaciones.value||'').replace(/^\s*indicaciones?\s*—.*?\n+/i,'').trim();
    const v_ind2 = document.getElementById('v_ind2');
    const sheet2 = document.getElementById('printSheet2');

    v_ind2.textContent = indTxt;

    if (indTxt.length > 0){
      fillSecondPageHeader();
      sheet2.classList.remove('hidden');
      sheet2.removeAttribute('aria-hidden');
    }else{
      sheet2.classList.add('hidden');
      sheet2.setAttribute('aria-hidden','true');
    }

    tryAutofit();
    togglePrintBreak();
  }

  [p_nombre,p_rut,p_edad,p_peso,p_dx,p_dx2,p_motivo,especialidad,receta,indicaciones].filter(Boolean).forEach(el=> el.addEventListener('input', render));
  // Selects: asegurar refresco
  especialidad && especialidad.addEventListener('change', render);

  render();

  /* ========= Acciones ========= */
  function enableAll(){
    document.querySelectorAll('button').forEach(b=>{
      b.disabled = false;
      b.classList.remove('opacity-50','pointer-events-none');
    });
  }
  setInterval(enableAll, 1500);
  window.addEventListener('afterprint', enableAll);
  window.addEventListener('focus', enableAll);

  document.getElementById('btnPrint')?.addEventListener('click', ()=>{ render(); window.print(); setTimeout(enableAll,150); });

  // PDF (incluye Hoja 1, Hoja 2 si existe y Hoja 3 si visible)
  document.getElementById('btnPdf')?.addEventListener('click', async ()=> {
    render(); // layout final

    const s1 = document.getElementById('printSheet');
    const s2 = document.getElementById('printSheet2');
    const s3 = document.getElementById('printDoc');
    const container = document.createElement('div');

    Object.assign(container.style, {
      position:'absolute', left:'-10000px', top:'0',
      background:'#fff', width: s1.offsetWidth + 'px'
    });

    const c1 = s1.cloneNode(true); container.appendChild(c1);
    if (!s2.classList.contains('hidden')) {
      const c2 = s2.cloneNode(true); container.appendChild(c2);
    }
    if (s3 && !s3.classList.contains('hidden')) {
      const c3 = s3.cloneNode(true); container.appendChild(c3);
    }

    container.querySelectorAll('.page').forEach((el, i, arr) => {
      el.style.pageBreakAfter = (i === arr.length - 1) ? 'auto' : 'always';
    });

    async function waitImages(root){
      const imgs = Array.from(root.querySelectorAll('img'));
      await Promise.all(imgs.map(img => (img.decode ? img.decode() : Promise.resolve()).catch(()=>{})));
    }

    document.body.appendChild(container);
    await waitImages(container);

    const opt = {
      margin: 0,
      filename: 'Receta-Endodoncia-Orion.pdf',
      image: { type:'jpeg', quality:0.98 },
      html2canvas: {
        scale: 2, useCORS: false, allowTaint: true, backgroundColor: '#FFFFFF',
        imageTimeout: 0, scrollX: 0, scrollY: 0,
        windowWidth: container.scrollWidth, windowHeight: container.scrollHeight
      },
      jsPDF: { unit:'in', format:[5.5,8.5], orientation:'portrait' },
      pagebreak: { mode:['css'], avoid:['.avoid-break'] }
    };

    try{
      await html2pdf().set(opt).from(container).save();
    } finally {
      container.remove();
      enableAll();
    }
  });

  // Compartir / Copiar
