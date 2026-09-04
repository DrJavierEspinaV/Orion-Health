(async()=>{
  try{
    let h=await fetch('./source.html',{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('HTTP '+r.status);return r.text()});
    h=h
      .replace(/src="orion-logo\.png"/,'src="../../assets/brand/maxilofacial-pro-plus.svg"')
      .replace(/src="orion-logo\.png"/g,'src="../../assets/brand/orion-health.png"')
      .replace(/src="firma_tinta_pluma_navy_transp\.png"/g,'src="../../assets/brand/firma-javier-espina-navy.svg"')
      .replace(/alt="Orion Comunicaciones"/,'alt="Maxilofacial PRO+"')
      .replace(/class="w-16 h-16 md:w-20 md:h-20 object-contain select-none"/,'class="h-20 md:h-24 w-auto max-w-[280px] object-contain select-none"')
      .replace(/Orion — Recetas Tipo v4\.3_24 \(Interconsulta caja única\)/g,'ORION Clínico CMF — Maxilofacial PRO+ v4.3.41')
      .replace(/ORION Comunicaciones - Plataforma Clínica/g,'ORION Clínico CMF')
      .replace(/— v4\.3\.24 PRO/g,'— v4.3.41')
      .replace(/Recetas e Indicaciónes PreQx y PostQx/g,'Recetas, indicaciones y documentos clínicos maxilofaciales')
      .replace(/• Asistir con tiempo \(15 min\) y sin esmalte de uñas \(monitoreo\)\./g,'• IMPORTANTE: Debe presentarse con 15 minutos de anticipación a la hora programada de pabellón. Si no cumple con este horario, el procedimiento será reprogramado.\n• Sin esmalte de uñas si se realizará monitoreo.')
      .replace(/v_ind2\.textContent\s*=\s*indTxt;/,()=>"v_ind2.innerHTML = escapeHTML(indTxt).replace(/^(.*IMPORTANTE: Debe presentarse con 15 minutos de anticipación a la hora programada de pabellón\\. Si no cumple con este horario, el procedimiento será reprogramado\\.)$/m, '<strong>$1</strong>');")
      .replace(/localStorage/g,'sessionStorage')
      .replace('</head>','<link rel="stylesheet" href="../../assets/shared/orion-identity-system-v140.css?v=1.4.5"><link rel="stylesheet" href="../../assets/shared/orion-mobile-v141.css?v=1.4.5"><link rel="stylesheet" href="../../assets/shared/clinical-mobile-actions-cmf-v141.css?v=1.4.5"><link rel="stylesheet" href="../../assets/shared/clinical-mobile-cmf-v142.css?v=1.4.5"><link rel="stylesheet" href="../../assets/shared/clinical-output-fixes-cmf-v144r4.css?v=1.4.5"><link rel="stylesheet" href="../../assets/shared/clinical-certificate-cmf-v144r6.css?v=1.4.5"><style id="mxpBrandV144">header.no-print img[alt="Maxilofacial PRO+"]{object-fit:contain}[id^="fixedFoot"] .firmaimg{display:none!important}#printSheet #fixedFoot .firmaimg,#printDoc:not(.hidden) #fixedFoot3 .firmaimg,#printExamLab:not(.hidden) #fixedFoot4 .firmaimg,#printExamImg:not(.hidden) #fixedFoot5 .firmaimg,#printInter:not(.hidden) #fixedFoot6 .firmaimg{display:block!important}@media(max-width:700px){header.no-print img[alt="Maxilofacial PRO+"]{min-width:150px;max-width:215px;height:auto}}</style></head>')
      .replace('</body>','<script src="../../assets/shared/clinical-nps-cmf-v136.js?v=1.4.5"></script><script src="../../assets/shared/clinical-components-restore.js?v=1.4.5"></script><script src="../../assets/shared/patient-bridge.js?v=1.4.5"></script><script src="../../assets/shared/clinical-prescription-auth-cmf-v139.js?v=1.4.5"></script><script src="../../assets/shared/clinical-output-fixes-cmf-v144r4.js?v=1.4.5"></script><script src="../../assets/shared/clinical-navigation-cmf-v144r5.js?v=1.4.5"></script><script src="../../assets/shared/clinical-prescription-share-cmf-v139.js?v=1.4.5"></script><script src="../../assets/shared/clinical-output-cmf-v134.js?v=1.4.5"></script><script src="../../assets/shared/clinical-preview-cmf-v135.js?v=1.4.5"></script><script src="../../assets/shared/clinical-mobile-docs-cmf-v141.js?v=1.4.5"></script><script src="../../assets/shared/clinical-mobile-cmf-v142.js?v=1.4.5"></script></body>');
    document.open();document.write(h);document.close();
  }catch(e){
    document.body.textContent='No se pudo cargar ORION Clínico CMF.';
    console.error(e);
  }
})();
