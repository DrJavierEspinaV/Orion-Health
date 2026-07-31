(()=>{
  const REQUEST_TOP='ORION_SCROLL_MODULE_TOP';
  const targetOrigin=()=>location.origin&&location.origin!=='null'?location.origin:'*';

  function resetDrawerScroll(){
    const drawer=document.getElementById('interDrawer');
    if(!drawer) return;

    try{ drawer.scrollTo({top:0,left:0,behavior:'auto'}); }catch(_){ drawer.scrollTop=0; }

    const scrollables=[drawer,...drawer.querySelectorAll('.overflow-y-auto,.overflow-auto,[style*="overflow-y"],[style*="overflow: auto"]')];
    scrollables.forEach(node=>{
      try{ node.scrollTop=0; }catch(_){}
    });

    try{
      window.parent.postMessage({type:REQUEST_TOP,anchor:'interconsulta'},targetOrigin());
    }catch(_){}
  }

  function scheduleReset(){
    [0,40,120,260].forEach(delay=>setTimeout(resetDrawerScroll,delay));
  }

  document.addEventListener('click',event=>{
    const trigger=event.target?.closest?.('#btnDocInter');
    if(!trigger) return;
    scheduleReset();
  },true);

  const drawer=document.getElementById('interDrawer');
  if(drawer){
    const observer=new MutationObserver(()=>{
      const isOpen=!drawer.classList.contains('translate-x-full');
      if(isOpen) scheduleReset();
    });
    observer.observe(drawer,{attributes:true,attributeFilter:['class']});
  }
})();
