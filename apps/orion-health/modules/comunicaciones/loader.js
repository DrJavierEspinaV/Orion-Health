(async()=>{
  try{
    let h=await fetch('./source.html',{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('HTTP '+r.status);return r.text()});
    h=h
      .replace(/src="orion-logo\.png"/g,'src="../../assets/brand/orion-comunicaciones.png"')
      .replace(/src="logo_orion_health_spa_oficial_azul\.png"/g,'src="../../assets/brand/orion-health.png"')
      .replace(/href="\.\.\/\.\.\/icons\/icon-192\.png"/g,'href="../../assets/icons/icon-192.png"')
      .replace(/value="ORION-CLINICA-2026"/g,'value="" placeholder="Token de sesión" autocomplete="off" data-orion-session-key="orion_comunicaciones_token"')
      .replace(/type="text" id="dbToken"/g,'type="password" id="dbToken"')
      .replace(/id="dbToken" type="text"/g,'id="dbToken" type="password"')
      .replace(/localStorage/g,'sessionStorage')
      .replace(/\.\.\/\.\.\/sw\.js/g,'../../service-worker.js')
      .replace(
        /const url = \(document\.getElementById\('dbWebappUrl'\)\?\.value \|\| ''\)\.trim\(\);\s*if\(!url\) return;\s*loadDb_\(\);/,
        "const url = (document.getElementById('dbWebappUrl')?.value || '').trim(); const tok = (document.getElementById('dbToken')?.value || '').trim(); if(!url || !tok) return; loadDb_();"
      )
      .replace('</body>','<script src="../../assets/shared/session-config.js"></script></body>');
    document.open();document.write(h);document.close();
  }catch(e){document.body.textContent='No se pudo cargar ORION Comunicaciones Clínicas.';console.error(e)}
})();
