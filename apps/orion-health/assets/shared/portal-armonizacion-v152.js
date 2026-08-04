(()=>{
  'use strict';

  try{
    if(typeof APPS!=='undefined'&&APPS.armonizacion){
      APPS.armonizacion.src='./modules/armonizacion/index.html?v=1.6.3';
      APPS.armonizacion.desc='Aplicación optimizada para administración, cierre, mapa anatómico e informe clínico integrado tamaño carta.';
    }
  }catch(error){
    console.warn('ORION: no fue posible actualizar la ruta de Armonización.',error);
  }

  if('serviceWorker' in navigator){
    navigator.serviceWorker.getRegistration('./').then(async registration=>{
      if(!registration)return;
      try{
        await registration.update();
        if(registration.waiting)registration.waiting.postMessage({type:'SKIP_WAITING'});
      }catch(error){
        console.warn('ORION: no fue posible actualizar la caché del portal.',error);
      }
    }).catch(()=>{});
  }
})();
