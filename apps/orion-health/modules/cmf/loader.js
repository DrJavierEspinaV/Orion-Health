(async()=>{
  try{
    let h=await fetch('./source.html',{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('HTTP '+r.status);return r.text()});
    h=h
      .replace(/src="orion-logo\.png"/,'src="../../assets/brand/maxilofacial-pro-plus.svg"')
      .replace(/src="orion-logo\.png"/g,'src="../../assets/brand/orion-health.png"')
      .replace(/alt="Orion Comunicaciones"/,'alt="Maxilofacial PRO+"')
      .replace(/class="w-16 h-16 md:w-20 md:h-20 object-contain select-none"/,'class="h-20 md:h-24 w-auto max-w-[190px] object-contain select-none"')
      .replace(/Orion — Recetas Tipo v4\.3_24 \(Interconsulta caja única\)/g,'ORION Clínico CMF — Maxilofacial PRO+ v4.3.32')
      .replace(/ORION Comunicaciones - Plataforma Clínica/g,'ORION Clínico CMF')
      .replace(/— v4\.3\.24 PRO/g,'— v4.3.32')
      .replace(/Recetas e Indicaciónes PreQx y PostQx/g,'Recetas, indicaciones y documentos clínicos maxilofaciales')
      .replace(/<img[^>]*class="firmaimg"[^>]*>/g,'')
      .replace(/localStorage/g,'sessionStorage')
      .replace('</head>','<style id="mxpBrandV138">header.no-print img[alt="Maxilofacial PRO+"]{object-fit:contain}@media(max-width:700px){header.no-print img[alt="Maxilofacial PRO+"]{max-width:150px;height:72px}}</style></head>')
      .replace('</body>','<script src="../../assets/shared/clinical-nps-cmf-v136.js?v=1.3.8"></script><script src="../../assets/shared/clinical-audit-cmf.js?v=1.3.8"></script><script src="../../assets/shared/clinical-templates-cmf-v132.js?v=1.3.8"></script><script src="../../assets/shared/clinical-components-restore.js?v=1.3.8"></script><script src="../../assets/shared/patient-bridge.js?v=1.3.8"></script><script src="../../assets/shared/clinical-output-cmf-v134.js?v=1.3.8"></script><script src="../../assets/shared/clinical-preview-cmf-v135.js?v=1.3.8"></script></body>');
    document.open();document.write(h);document.close();
  }catch(e){
    document.body.textContent='No se pudo cargar ORION Clínico CMF.';
    console.error(e);
  }
})();
