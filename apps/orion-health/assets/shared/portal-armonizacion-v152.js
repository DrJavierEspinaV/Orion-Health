(()=>{
  'use strict';
  try{
    if(typeof APPS!=='undefined'&&APPS.armonizacion){
      APPS.armonizacion.src='./modules/armonizacion/index.html?v=2.0.0';
      APPS.armonizacion.desc='Aplicación clínica con motores independientes para toxina botulínica, ácido hialurónico, CaHA, PLLA y Skinbooster / mesoterapia.';
    }
  }catch(error){console.warn('ORION: no fue posible actualizar la ruta de Armonización.',error);}
  if('serviceWorker' in navigator){navigator.serviceWorker.getRegistration('./').then(async registration=>{if(!registration)return;try{await registration.update();if(registration.waiting)registration.waiting.postMessage({type:'SKIP_WAITING'});}catch(error){console.warn('ORION: no fue posible actualizar la caché del portal.',error);}}).catch(()=>{});}
})();