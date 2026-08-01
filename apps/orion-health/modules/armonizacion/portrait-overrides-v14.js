(()=>{
  'use strict';
  const PORTRAITS={
    woman:'https://images.pexels.com/photos/36763373/pexels-photo-36763373.jpeg?auto=compress&cs=tinysrgb&w=1200',
    man:'https://images.pexels.com/photos/32758452/pexels-photo-32758452.jpeg?auto=compress&cs=tinysrgb&w=1200'
  };

  function apply(model){
    const portrait=document.getElementById('v14Portrait');
    const womanThumb=document.querySelector('#v14Model_woman .v14-model-thumb');
    const manThumb=document.querySelector('#v14Model_man .v14-model-thumb');
    if(womanThumb)womanThumb.style.setProperty('background-image',`url("${PORTRAITS.woman}")`,'important');
    if(manThumb)manThumb.style.setProperty('background-image',`url("${PORTRAITS.man}")`,'important');
    if(portrait)portrait.style.setProperty('background-image',`url("${PORTRAITS[model]||PORTRAITS.woman}")`,'important');
  }

  function bind(){
    const woman=document.getElementById('v14Model_woman');
    const man=document.getElementById('v14Model_man');
    if(!woman||!man)return false;
    apply(woman.classList.contains('active')?'woman':man.classList.contains('active')?'man':'woman');
    woman.addEventListener('click',()=>requestAnimationFrame(()=>apply('woman')));
    man.addEventListener('click',()=>requestAnimationFrame(()=>apply('man')));
    return true;
  }

  if(!bind()){
    const observer=new MutationObserver(()=>{
      if(bind())observer.disconnect();
    });
    observer.observe(document.documentElement,{childList:true,subtree:true});
  }
})();
