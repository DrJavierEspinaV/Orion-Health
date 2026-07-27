  document.getElementById('btnCopy')?.addEventListener('click', ()=>{
    const f = new Date().toLocaleDateString('es-CL');
    const motivo = (document.getElementById('p_motivo')?.value || '').trim();
    const dxCore = (p_dx2.value||p_dx.value||'').trim();
    const dxFinal = [motivo, dxCore].filter(Boolean).join(' — ');
    const txt = `ORION HEALTH SpA — Endodoncia — Receta / Indicaciones
Fecha: ${f}

Paciente: ${p_nombre.value||''}
RUN: ${p_rut.value||''}
Edad: ${p_edad.value?`${p_edad.value} años`:''}
Peso: ${p_peso.value?`${p_peso.value} kg`:''}
Diagnóstico/Procedimiento: ${dxFinal}

Receta:
${(receta.value||'').trim()}

Indicaciones:
${(indicaciones.value||'').replace(/^\s*indicaciones?\s*—.*?\n+/i,'').trim()}

— Dra. PIA CORONADO MADARIAGA • Endodoncia • SOS +56 9 77597927 —`;
    navigator.clipboard.writeText(txt).then(()=> alert('Texto copiado.'));
  });

  document.getElementById('btnWA')?.addEventListener('click', ()=>{
    const url = 'https://wa.me/?text='+encodeURIComponent(location.href);
    const win = window.open(url,'_blank','noopener,noreferrer');
    if(!win) location.href = url;
    setTimeout(enableAll,200);
  });
