(async()=>{
  try{
    let h=await fetch('./source.html',{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('HTTP '+r.status);return r.text()});
    h=h
      .replace(/src="orion-logo\.png"/g,'src="../../assets/brand/orion-health.png"')
      .replace(/ORION Comunicaciones - Plataforma Clínica/g,'ORION Clínico CMF')
      .replace(/<img[^>]*class="firmaimg"[^>]*>/g,'')
      .replace(/localStorage/g,'sessionStorage')
      .replace('</body>','<script src="../../assets/shared/clinical-audit-cmf.js?v=1.3.4"></script><script src="../../assets/shared/clinical-templates-cmf-v132.js?v=1.3.4"></script><script src="../../assets/shared/clinical-components-restore.js?v=1.3.4"></script><script src="../../assets/shared/patient-bridge.js?v=1.3.4"></script><script src="../../assets/shared/clinical-output-cmf-v134.js?v=1.3.4"></script></body>');
    document.open();document.write(h);document.close();
  }catch(e){
    document.body.textContent='No se pudo cargar ORION Clínico CMF.';
    console.error(e);
  }
})();