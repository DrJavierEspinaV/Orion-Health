(()=>{
  'use strict';

  const VERSION='1.6.3';
  const NativeMutationObserver=window.MutationObserver;
  const nativeSetInterval=window.setInterval.bind(window);
  const nativeScrollTo=window.scrollTo.bind(window);

  /*
   * Las capas históricas del módulo usan varios observadores concurrentes.
   * Esta envoltura mantiene su funcionalidad, pero agrupa ráfagas de cambios
   * en una sola ejecución. Los observadores globales del body se difieren
   * brevemente; los observadores específicos conservan respuesta por frame.
   */
  class OrionMutationObserver{
    constructor(callback){
      this.callback=callback;
      this.pending=[];
      this.timer=0;
      this.frame=0;
      this.global=false;
      this.disconnected=false;
      this.native=new NativeMutationObserver(records=>this.enqueue(records));
    }

    enqueue(records){
      if(this.disconnected)return;
      this.pending.push(...records);
      if(this.global){
        if(this.timer)return;
        this.timer=window.setTimeout(()=>this.flush(),72);
        return;
      }
      if(this.frame)return;
      this.frame=requestAnimationFrame(()=>this.flush());
    }

    flush(){
      if(this.timer){clearTimeout(this.timer);this.timer=0;}
      if(this.frame){cancelAnimationFrame(this.frame);this.frame=0;}
      if(this.disconnected||!this.pending.length)return;
      const records=this.pending.splice(0);
      try{this.callback(records,this);}catch(error){console.error('ORION observer:',error);}
    }

    observe(target,options){
      this.global=target===document.body&&!!options?.subtree;
      this.native.observe(target,options);
    }

    disconnect(){
      this.disconnected=true;
      this.pending.length=0;
      if(this.timer)clearTimeout(this.timer);
      if(this.frame)cancelAnimationFrame(this.frame);
      this.native.disconnect();
    }

    takeRecords(){
      return [...this.pending.splice(0),...this.native.takeRecords()];
    }
  }

  window.MutationObserver=OrionMutationObserver;

  /* El único intervalo de 900 ms del módulo corresponde al historial clínico.
     Se conserva, pero con una cadencia que no interrumpe el desplazamiento. */
  window.setInterval=(callback,delay,...args)=>{
    const normalized=Number(delay)||0;
    const adjusted=normalized>=850&&normalized<=1000?2800:normalized;
    return nativeSetInterval(callback,adjusted,...args);
  };

  /* Evita animaciones de scroll acumuladas cuando se cambia de pestaña o zona. */
  window.scrollTo=(...args)=>{
    if(args[0]&&typeof args[0]==='object'){
      return nativeScrollTo({...args[0],behavior:'auto'});
    }
    return nativeScrollTo(...args);
  };

  const nativeScrollIntoView=Element.prototype.scrollIntoView;
  Element.prototype.scrollIntoView=function(options){
    if(options&&typeof options==='object')return nativeScrollIntoView.call(this,{...options,behavior:'auto'});
    return nativeScrollIntoView.call(this,options);
  };

  document.documentElement.classList.add('oa-performance-v163');
  document.documentElement.dataset.orionPerformanceVersion=VERSION;

  /* Pausa actualizaciones no esenciales mientras el usuario desplaza la vista. */
  let scrollTimer=0;
  const markScrolling=()=>{
    document.documentElement.classList.add('oa-user-scrolling');
    clearTimeout(scrollTimer);
    scrollTimer=window.setTimeout(()=>document.documentElement.classList.remove('oa-user-scrolling'),120);
  };
  window.addEventListener('scroll',markScrolling,{passive:true,capture:true});
  document.addEventListener('touchmove',markScrolling,{passive:true,capture:true});
})();
