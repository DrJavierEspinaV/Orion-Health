(function(){
  const $ = sel => document.querySelector(sel);
  const $$ = sel => Array.from(document.querySelectorAll(sel));
  const get = id => document.getElementById(id);
  const val = id => (get(id)?.value || '').trim();

  function fillHeader(){
    const now = new Date().toLocaleDateString('es-CL');
    $$('.v_fecha3').forEach(e=> e.textContent = now);
    $$('.v_nombre3').forEach(e=> e.textContent = val('p_nombre'));
    $$('.v_rut3').forEach(e=> e.textContent = val('p_rut'));
    $$('.v_edad3').forEach(e=> e.textContent = val('p_edad') ? `${val('p_edad')} años` : '');
    $$('.v_peso3').forEach(e=> e.textContent = val('p_peso') ? `${val('p_peso')} kg` : '');
    const motivo = (val('p_motivo') || '').trim();
    const dxCore = (val('p_dx2') || val('p_dx') || '').trim();
    const dxFinal = [motivo, dxCore].filter(Boolean).join(' — ');
    $$('.v_dx3').forEach(e=> e.textContent = dxFinal);
  }

  function tplCertificado(){
    const now = new Date().toLocaleDateString('es-CL');
    const nombre = val('p_nombre') || '____________________';
    const run = val('p_rut') || '________________';
    const dias = parseInt(val('reposoDias'),10) || 0;
    const espTxt = (val('especialidad') || 'Odontología').trim();
    const motivo = (val('p_motivo') || '').trim();
    const dxCore = (val('p_dx2') || val('p_dx') || '').trim();
    const dxFinal = [motivo, dxCore].filter(Boolean).join(' — ');
    const extra = dias ? `

Se indica reposo por ${dias} día${dias>1?'s':''} a contar de la fecha.` : '';
    const por = dxFinal ? ` por ${dxFinal}` : '';
    return `CERTIFICADO DE ATENCIÓN ODONTOLÓGICA — ${espTxt}

El/la profesional que suscribe certifica que ${nombre} (RUN ${run}) fue atendid@${por} el día ${now}.

Este certificado se emite a solicitud del/la interesad@ para fines de reposo o justificación según corresponda.` + extra;
  }

  function tplBiopsia(){
    return `ORDEN DE EXAMEN – BIOPSIA

SE INDICA BIOPSIA MUCOSA

CÓDIGO: 0801005 - 0801008
RUT LAB: 9.202.238-2

INDICACIONES:
1° Comprar Bono Fonasa o Isapre (Ejecutivas Dental)
2° Presentarse con esta orden y cédula de identidad
3° Entregar resultados al profesional tratante`;
  }

  // Clonar pie de firma de hoja 1 a Hoja 3 si no existe
  document.addEventListener('DOMContentLoaded', () => {
    const srcFoot = document.querySelector('#printSheet [id^="fixedFoot"]')
                 || document.querySelector('#printSheet2 [id^="fixedFoot"]');
    const sec = document.getElementById('printDoc');
    if(srcFoot && sec && !sec.querySelector('[id^="fixedFoot"]')){
      const clone = srcFoot.cloneNode(true);
      if (clone.id) clone.id = (clone.id.replace(/\d*$/, '') + '3');
      if (getComputedStyle(sec).position === 'static') sec.style.position = 'relative';
      sec.appendChild(clone);
    }
  });

  function showDoc(mode){
    const s3 = get('printDoc');
    fillHeader();
    const titulo = get('docTitulo'), cuerpo = get('v_doc');
    const espTxt = (val('especialidad') || 'Endodoncia');
    const t3 = document.getElementById('sp_title3');
    if(t3) t3.textContent = espTxt;
    if(!titulo || !cuerpo){ alert('Falta estructura de Hoja 3'); return; }
    if(mode==='cert'){
      titulo.textContent = `CERTIFICADO DE ATENCIÓN — ${espTxt}`;
      cuerpo.textContent = tplCertificado();
    }else if(mode==='bio'){
      titulo.textContent = 'ORDEN DE EXAMEN – BIOPSIA';
      cuerpo.textContent = tplBiopsia();
    }else{
      return;
    }
    s3.classList.remove('hidden'); s3.removeAttribute('aria-hidden');
    s3.scrollIntoView({behavior:'smooth', block:'start'});
  }

  document.addEventListener('DOMContentLoaded', function(){
    const b1 = get('btnDocCert'), b2 = get('btnDocBiopsia');
    if(b1){ b1.onclick = function(e){ e.preventDefault(); showDoc('cert'); }; }
    if(b2){ b2.onclick = function(e){ e.preventDefault(); showDoc('bio');  }; }
  });
})();
