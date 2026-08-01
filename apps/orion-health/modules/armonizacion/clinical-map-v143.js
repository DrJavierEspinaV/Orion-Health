(()=>{
  'use strict';

  const NS='http://www.w3.org/2000/svg';
  const $=id=>document.getElementById(id);
  const state={anatomyVisible:true,scheduled:false};

  const ANATOMY={
    frente:`
      <path class="v143-muscle v143-muscle-frontal" d="M206 82 C222 62 262 54 294 66 L294 167 C258 171 224 165 202 147 C191 128 191 101 206 82 Z"/>
      <path class="v143-muscle v143-muscle-frontal" d="M394 82 C378 62 338 54 306 66 L306 167 C342 171 376 165 398 147 C409 128 409 101 394 82 Z"/>
      <path class="v143-fibre" d="M218 100 C242 86 265 83 289 86 M213 121 C238 108 264 105 289 108 M311 86 C335 83 358 86 382 100 M311 108 C336 105 362 108 387 121"/>
    `,
    glabela:`
      <path class="v143-muscle v143-muscle-corrugator" d="M246 202 C258 184 279 181 297 197 C282 218 263 227 244 219 Z"/>
      <path class="v143-muscle v143-muscle-corrugator" d="M354 202 C342 184 321 181 303 197 C318 218 337 227 356 219 Z"/>
      <path class="v143-muscle v143-muscle-procerus" d="M286 198 C294 186 306 186 314 198 L322 260 C309 273 291 273 278 260 Z"/>
      <path class="v143-fibre" d="M253 207 C269 199 281 199 294 205 M347 207 C331 199 319 199 306 205 M300 207 L300 252"/>
    `,
    periocular_d:`
      <ellipse class="v143-muscle v143-muscle-orbicular" cx="184" cy="301" rx="72" ry="53"/>
      <ellipse class="v143-cutout" cx="184" cy="301" rx="47" ry="27"/>
      <path class="v143-fibre" d="M121 289 C143 267 174 259 204 267 M119 310 C145 333 178 340 211 328"/>
    `,
    periocular_i:`
      <ellipse class="v143-muscle v143-muscle-orbicular" cx="416" cy="301" rx="72" ry="53"/>
      <ellipse class="v143-cutout" cx="416" cy="301" rx="47" ry="27"/>
      <path class="v143-fibre" d="M479 289 C457 267 426 259 396 267 M481 310 C455 333 422 340 389 328"/>
    `,
    nariz:`
      <path class="v143-muscle v143-muscle-nasalis" d="M254 350 C268 333 287 329 298 347 L295 411 C276 417 260 407 251 391 Z"/>
      <path class="v143-muscle v143-muscle-nasalis" d="M346 350 C332 333 313 329 302 347 L305 411 C324 417 340 407 349 391 Z"/>
      <path class="v143-fibre" d="M263 364 C276 353 286 352 295 359 M337 364 C324 353 314 352 305 359"/>
    `,
    sonrisa:`
      <ellipse class="v143-muscle v143-muscle-oris" cx="300" cy="472" rx="104" ry="55"/>
      <ellipse class="v143-cutout" cx="300" cy="472" rx="65" ry="24"/>
      <path class="v143-muscle v143-muscle-levator" d="M227 367 C240 358 255 362 261 376 L268 446 C252 453 239 444 234 429 Z"/>
      <path class="v143-muscle v143-muscle-levator" d="M373 367 C360 358 345 362 339 376 L332 446 C348 453 361 444 366 429 Z"/>
      <path class="v143-fibre" d="M220 472 C250 448 276 445 300 449 C324 445 350 448 380 472 M220 482 C252 505 278 508 300 504 C322 508 348 505 380 482"/>
    `,
    dao_d:`
      <path class="v143-muscle v143-muscle-dao" d="M198 487 C215 480 232 487 244 502 L267 574 C245 588 220 579 210 558 Z"/>
      <path class="v143-fibre" d="M214 503 C225 521 236 544 245 568"/>
    `,
    dao_i:`
      <path class="v143-muscle v143-muscle-dao" d="M402 487 C385 480 368 487 356 502 L333 574 C355 588 380 579 390 558 Z"/>
      <path class="v143-fibre" d="M386 503 C375 521 364 544 355 568"/>
    `,
    menton:`
      <ellipse class="v143-muscle v143-muscle-mentalis" cx="278" cy="595" rx="37" ry="51"/>
      <ellipse class="v143-muscle v143-muscle-mentalis" cx="322" cy="595" rx="37" ry="51"/>
      <path class="v143-fibre" d="M269 565 C277 584 279 607 277 627 M331 565 C323 584 321 607 323 627"/>
    `,
    masetero_d:`
      <path class="v143-muscle v143-muscle-masseter" d="M105 365 C128 347 164 350 181 370 L203 520 C190 553 147 566 117 543 C96 500 87 415 105 365 Z"/>
      <path class="v143-fibre" d="M119 382 L176 530 M137 367 L191 515 M105 420 L165 552"/>
    `,
    masetero_i:`
      <path class="v143-muscle v143-muscle-masseter" d="M495 365 C472 347 436 350 419 370 L397 520 C410 553 453 566 483 543 C504 500 513 415 495 365 Z"/>
      <path class="v143-fibre" d="M481 382 L424 530 M463 367 L409 515 M495 420 L435 552"/>
    `,
    platisma:`
      <path class="v143-muscle v143-muscle-platysma" d="M205 590 C229 606 260 626 289 642 L281 754 L178 754 C176 706 181 635 205 590 Z"/>
      <path class="v143-muscle v143-muscle-platysma" d="M395 590 C371 606 340 626 311 642 L319 754 L422 754 C424 706 419 635 395 590 Z"/>
      <path class="v143-fibre" d="M213 617 C231 661 236 707 235 744 M258 636 C266 679 269 714 267 750 M387 617 C369 661 364 707 365 744 M342 636 C334 679 331 714 333 750"/>
    `
  };

  const EXPRESSIONS=`
    <g class="v143-expression-set v143-expression-active">
      <path d="M215 104 C266 88 334 88 385 104"/>
      <path d="M209 127 C264 112 336 112 391 127"/>
      <path d="M248 210 C270 202 286 204 299 216 M352 210 C330 202 314 204 301 216"/>
      <path d="M112 287 L82 275 M112 301 L77 301 M115 315 L84 328"/>
      <path d="M488 287 L518 275 M488 301 L523 301 M485 315 L516 328"/>
      <path d="M270 363 C279 355 287 354 294 360 M330 363 C321 355 313 354 306 360"/>
      <path d="M246 442 C261 433 278 431 294 437 M354 442 C339 433 322 431 306 437"/>
    </g>
    <g class="v143-expression-set v143-expression-passive">
      <path d="M225 151 C270 141 330 141 375 151"/>
      <path d="M263 231 C278 228 290 230 300 239 M337 231 C322 228 310 230 300 239"/>
      <path d="M233 500 C253 513 275 518 300 516 C325 518 347 513 367 500"/>
      <path d="M242 542 C259 554 280 560 300 559 C320 560 341 554 358 542"/>
      <path d="M269 610 C280 620 290 624 300 624 C310 624 320 620 331 610"/>
    </g>
  `;

  function svgNode(markup){
    const wrapper=document.createElementNS(NS,'g');
    wrapper.innerHTML=markup;
    return wrapper;
  }

  function addAnatomy(svg){
    Object.entries(ANATOMY).forEach(([zone,markup])=>{
      const group=svg.querySelector(`.g-zone[data-zone="${zone}"]`);
      if(!group||group.querySelector('.v143-anatomy'))return;
      const anatomy=svgNode(markup);
      anatomy.setAttribute('class','v143-anatomy');
      anatomy.setAttribute('aria-hidden','true');
      group.insertBefore(anatomy,group.firstChild);
    });

    if(!svg.querySelector('.v143-expression-lines')){
      const lines=svgNode(EXPRESSIONS);
      lines.setAttribute('class','v143-expression-lines');
      lines.setAttribute('aria-hidden','true');
      svg.insertBefore(lines,svg.firstChild);
    }
  }

  function activeStudy(){
    if($('v14Study_active')?.classList.contains('active'))return'active';
    if($('v14Study_passive')?.classList.contains('active'))return'passive';
    return'both';
  }

  function syncStudy(){
    const svg=$('v14Svg');
    if(!svg)return;
    svg.dataset.study=activeStudy();
  }

  function syncPortraitBackdrop(){
    const stage=document.querySelector('.v14-portrait-stage');
    const portrait=$('v14Portrait');
    if(!stage||!portrait)return;
    const image=portrait.style.backgroundImage||getComputedStyle(portrait).backgroundImage;
    if(image&&image!=='none')stage.style.setProperty('--v143-portrait-image',image);
  }

  function selectedZoneLabel(group){
    return group?.querySelector('.v14-zone-label text')?.textContent?.trim()||'Selecciona una zona';
  }

  function ensureStageChrome(){
    const stage=document.querySelector('.v14-portrait-stage');
    if(!stage)return;
    let tag=stage.querySelector('.v143-map-tag');
    if(!tag){
      tag=document.createElement('div');
      tag.className='v143-map-tag';
      tag.innerHTML='<span class="v143-map-dot"></span><strong>Mapa anatómico</strong><span class="v143-map-mode">Activas + pasivas</span>';
      stage.append(tag);
    }
    let selected=stage.querySelector('.v143-selected-zone');
    if(!selected){
      selected=document.createElement('div');
      selected.className='v143-selected-zone';
      selected.textContent='Glabela';
      stage.append(selected);
    }
  }

  function updateChrome(){
    const stage=document.querySelector('.v14-portrait-stage');
    if(!stage)return;
    const mode=stage.querySelector('.v143-map-mode');
    const study=activeStudy();
    if(mode)mode.textContent=study==='active'?'Líneas activas':study==='passive'?'Líneas pasivas':'Activas + pasivas';
    const selected=stage.querySelector('.v143-selected-zone');
    const active=$('v14Svg')?.querySelector('.g-zone.active');
    if(selected)selected.textContent=selectedZoneLabel(active);
  }

  function updateAnatomyButton(){
    const button=$('v14PresetBtn2');
    if(!button)return;
    button.textContent=state.anatomyVisible?'Ocultar músculos':'Mostrar músculos';
    button.setAttribute('aria-pressed',String(state.anatomyVisible));
  }

  function toggleAnatomy(event){
    event.preventDefault();
    event.stopImmediatePropagation();
    state.anatomyVisible=!state.anatomyVisible;
    document.documentElement.classList.toggle('v143-anatomy-hidden',!state.anatomyVisible);
    updateAnatomyButton();
  }

  function decorate(){
    state.scheduled=false;
    const svg=$('v14Svg');
    if(!svg)return false;
    addAnatomy(svg);
    syncStudy();
    syncPortraitBackdrop();
    ensureStageChrome();
    updateChrome();
    updateAnatomyButton();
    return true;
  }

  function scheduleDecorate(){
    if(state.scheduled)return;
    state.scheduled=true;
    requestAnimationFrame(decorate);
  }

  function bind(){
    const svg=$('v14Svg');
    const portrait=$('v14Portrait');
    const anatomyButton=$('v14PresetBtn2');
    if(!svg||!portrait||!anatomyButton)return false;

    anatomyButton.addEventListener('click',toggleAnatomy,true);

    ['v14Study_both','v14Study_active','v14Study_passive'].forEach(id=>{
      $(id)?.addEventListener('click',()=>requestAnimationFrame(()=>{syncStudy();updateChrome();}));
    });

    svg.addEventListener('click',event=>{
      const group=event.target.closest?.('.g-zone');
      if(group)requestAnimationFrame(updateChrome);
    });

    const svgObserver=new MutationObserver(scheduleDecorate);
    svgObserver.observe(svg,{childList:true,subtree:true});

    const portraitObserver=new MutationObserver(syncPortraitBackdrop);
    portraitObserver.observe(portrait,{attributes:true,attributeFilter:['style']});

    ['v14Model_woman','v14Model_man'].forEach(id=>{
      $(id)?.addEventListener('click',()=>requestAnimationFrame(syncPortraitBackdrop));
    });

    decorate();
    return true;
  }

  if(!bind()){
    const observer=new MutationObserver(()=>{
      if(bind())observer.disconnect();
    });
    observer.observe(document.documentElement,{childList:true,subtree:true});
  }
})();
