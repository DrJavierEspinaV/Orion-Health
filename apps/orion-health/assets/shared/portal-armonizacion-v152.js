(()=>{
  'use strict';
  try{
    if(typeof APPS!=='undefined'&&APPS.armonizacion){
      APPS.armonizacion.src='./modules/armonizacion/index.html?v=1.6.10';
      APPS.armonizacion.desc='Aplicación clínica con navegación Registro/Mapa/Resumen restaurada, administración por mapa e informe tamaño carta.';
    }
  }catch(error){console.warn('ORION: no fue posible actualizar la ruta de Armonización.',error);}
  if('serviceWorker' in navigator){navigator.serviceWorker.getRegistration('./').then(async registration=>{if(!registration)return;try{await registration.update();if(registration.waiting)registration.waiting.postMessage({type:'SKIP_WAITING'});}catch(error){console.warn('ORION: no fue posible actualizar la caché del portal.',error);}}).catch(()=>{});}
})();