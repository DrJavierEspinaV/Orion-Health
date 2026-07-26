(async()=>{
  try{
    let h=await fetch('./source.html',{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('HTTP '+r.status);return r.text()});
    h=h
      .replace(/src="orion-logo\.png"/g,'src="../../assets/brand/orion-health.png"')
      .replace(/ORION Comunicaciones - Plataforma Clínica/g,'ORION Clínico CMF')
      .replace(/<img[^>]*class="firmaimg"[^>]*>/g,'')
      .replace(/MELOXICAM 15 mg\s*\n1 comprimido cada 12 horas por 3 días/g,'MELOXICAM 7,5 mg\n1 comprimido cada 24 horas por 3 días (máx. 15 mg/día)')
      .replace(/localStorage/g,'sessionStorage')
      .replace('</body>','<script src="../../assets/shared/patient-bridge.js"></script></body>');
    document.open();document.write(h);document.close();
  }catch(e){document.body.textContent='No se pudo cargar ORION Clínico CMF.';console.error(e)}
})();
