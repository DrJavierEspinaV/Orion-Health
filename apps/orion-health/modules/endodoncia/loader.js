(async()=>{
  try{
    const parts=['./source/source-001.part','./source/source-002.part','./source/source-003.part','./source/source-004.part'];
    let h=(await Promise.all(parts.map(async path=>{
      const response=await fetch(path,{cache:'no-store'});
      if(!response.ok)throw new Error(path);
      return response.text();
    }))).join('');
    h=h
      .replace(/<img[^>]*class="firmaimg"[^>]*>/g,'')
      .replace(/localStorage/g,'sessionStorage')
      .replace('</head>','<link rel="stylesheet" href="../../assets/shared/orion-identity-system-v140.css?v=1.4.0"></head>')
      .replace('</body>','<script src="../../assets/shared/clinical-audit-endo.js?v=1.4.0"></script><script src="../../assets/shared/clinical-components-restore.js?v=1.4.0"></script><script src="../../assets/shared/patient-bridge.js?v=1.4.0"></script></body>');
    document.open();document.write(h);document.close();
  }catch(e){
    document.body.textContent='No se pudo cargar ORION Endodoncia.';
    console.error(e);
  }
})();
