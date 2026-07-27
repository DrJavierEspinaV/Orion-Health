(()=>{
  'use strict';

  const TOKEN_KEY='orion_comunicaciones_token';
  const AUTOLOAD_DELAY_MS=500;

  const session={
    get(key){try{return sessionStorage.getItem(key)||'';}catch(_){return'';}},
    set(key,value){try{sessionStorage.setItem(key,String(value||''));}catch(_){}},
    remove(key){try{sessionStorage.removeItem(key);}catch(_){} }
  };

  function elements(){
    return{
      token:document.getElementById('dbToken'),
      url:document.getElementById('dbWebappUrl'),
      sheet:document.getElementById('dbSheet'),
      load:document.getElementById('dbLoad'),
      ping:document.getElementById('dbPing'),
      status:document.getElementById('dbStatus'),
      details:document.querySelector('.bdDetails'),
      card:document.querySelector('.bdCard')
    };
  }

  function injectStyles(){
    if(document.getElementById('orionDriveSecureStyles'))return;
    const style=document.createElement('style');
    style.id='orionDriveSecureStyles';
    style.textContent=`
      .orion-drive-card{margin:0 0 12px;padding:14px 16px;border:1px solid #bae6fd;border-radius:16px;background:linear-gradient(135deg,#eff6ff,#ecfeff);box-shadow:0 8px 20px rgba(14,116,144,.08)}
      .orion-drive-row{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}
      .orion-drive-title{font-weight:900;color:#0f3f5f;font-size:13px;text-transform:uppercase;letter-spacing:.25px}
      .orion-drive-text{margin-top:4px;color:#475569;font-size:12px;line-height:1.35}
      .orion-drive-badge{display:inline-flex;align-items:center;min-height:30px;padding:0 11px;border-radius:999px;background:#e2e8f0;color:#475569;font-size:11px;font-weight:900;white-space:nowrap}
      .orion-drive-badge.connecting{background:#fef3c7;color:#92400e}.orion-drive-badge.ready{background:#dcfce7;color:#166534}.orion-drive-badge.error{background:#fee2e2;color:#991b1b}
      .orion-drive-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}.orion-drive-btn{appearance:none;border:1px solid #bfd0df;background:#fff;color:#17324d;border-radius:12px;padding:8px 12px;font-size:12px;font-weight:800;cursor:pointer}.orion-drive-btn.primary{border-color:#0e7490;background:#0e7490;color:#fff}
      .orion-drive-modal{position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;padding:18px;background:rgba(2,6,23,.58);backdrop-filter:blur(6px)}.orion-drive-modal[hidden]{display:none!important}.orion-drive-dialog{width:min(460px,100%);border-radius:22px;background:#fff;padding:22px;box-shadow:0 24px 70px rgba(2,6,23,.32)}.orion-drive-dialog h2{margin:0;color:#17324d;font-size:22px}.orion-drive-dialog p{margin:8px 0 16px;color:#64748b;font-size:13px;line-height:1.45}.orion-drive-input{width:100%;border:1px solid #cbd5e1;border-radius:14px;padding:12px 14px;font:inherit}.orion-drive-error{min-height:18px;margin-top:7px;color:#b91c1c;font-size:12px;font-weight:700}.orion-drive-dialog-actions{display:flex;gap:10px;margin-top:12px}.orion-drive-dialog-actions button{flex:1}.bdDetails>summary .muted{font-weight:800!important}
      @media(max-width:640px){.orion-drive-dialog-actions{flex-direction:column}.orion-drive-dialog-actions button{width:100%}}
    `;
    document.head.appendChild(style);
  }

  function secureTechnicalFields(e){
    if(e.details){
      e.details.open=false;
      const label=e.details.querySelector('summary .muted');
      if(label)label.textContent='Configuración avanzada';
    }
    [e.url,e.sheet].forEach(field=>{
      if(!field)return;
      field.readOnly=true;
      field.setAttribute('aria-readonly','true');
    });
    if(e.token){
      e.token.type='password';
      e.token.autocomplete='off';
      e.token.value=session.get(TOKEN_KEY);
      e.token.dataset.orionSessionKey=TOKEN_KEY;
      e.token.addEventListener('input',()=>session.set(TOKEN_KEY,e.token.value));
    }
  }

  function createCard(e){
    if(!e.card)return;
    let card=document.getElementById('orionDriveStatusCard');
    if(card)return card;
    card=document.createElement('div');
    card.id='orionDriveStatusCard';
    card.className='orion-drive-card';
    card.innerHTML=`<div class="orion-drive-row"><div><div class="orion-drive-title">Base clínica en Drive</div><div class="orion-drive-text" id="orionDriveStatusText">Acceso protegido por sesión.</div></div><span class="orion-drive-badge" id="orionDriveStatusBadge">Pendiente</span></div><div class="orion-drive-actions"><button class="orion-drive-btn primary" id="orionDriveReconnect" type="button">Conectar / recargar</button><button class="orion-drive-btn" id="orionDriveChangeAccess" type="button">Cambiar acceso</button><button class="orion-drive-btn" id="orionDriveForget" type="button">Cerrar acceso</button></div>`;
    e.card.prepend(card);
    return card;
  }

  function createModal(){
    let modal=document.getElementById('orionDriveModal');
    if(modal)return modal;
    modal=document.createElement('div');
    modal.id='orionDriveModal';
    modal.className='orion-drive-modal';
    modal.hidden=true;
    modal.innerHTML=`<div class="orion-drive-dialog" role="dialog" aria-modal="true" aria-labelledby="orionDriveModalTitle"><h2 id="orionDriveModalTitle">Conectar base clínica</h2><p>La clave no se guarda en GitHub ni se incorpora a la dirección web. Se conserva únicamente durante esta sesión del navegador.</p><label for="orionDriveTokenInput" style="display:block;font-size:12px;font-weight:800;color:#475569;margin-bottom:6px">Clave de acceso ORION</label><input class="orion-drive-input" id="orionDriveTokenInput" type="password" autocomplete="off" placeholder="Clave vigente"><div class="orion-drive-error" id="orionDriveModalError"></div><div class="orion-drive-dialog-actions"><button class="orion-drive-btn primary" id="orionDriveConnectNow" type="button">Conectar ahora</button><button class="orion-drive-btn" id="orionDriveCancel" type="button">Cancelar</button></div></div>`;
    document.body.appendChild(modal);
    return modal;
  }

  function setStatus(mode,message){
    const badge=document.getElementById('orionDriveStatusBadge');
    const text=document.getElementById('orionDriveStatusText');
    if(badge){
      badge.className=`orion-drive-badge${mode?` ${mode}`:''}`;
      badge.textContent=mode==='ready'?'Conectado':mode==='connecting'?'Conectando':mode==='error'?'Revisar acceso':'Pendiente';
    }
    if(text)text.textContent=message;
  }

  function openModal(prefill=''){
    const modal=createModal();
    const input=document.getElementById('orionDriveTokenInput');
    const error=document.getElementById('orionDriveModalError');
    if(input)input.value=prefill||session.get(TOKEN_KEY)||'';
    if(error)error.textContent='';
    modal.hidden=false;
    setTimeout(()=>input?.focus(),30);
  }

  function closeModal(){const modal=document.getElementById('orionDriveModal');if(modal)modal.hidden=true;}

  function applyToken(value,e){
    const token=String(value||'').trim();
    if(!token)return false;
    session.set(TOKEN_KEY,token);
    if(e.token){e.token.value=token;e.token.dispatchEvent(new Event('input',{bubbles:true}));}
    return true;
  }

  function connect(e,{pingFirst=false}={}){
    const token=String(e.token?.value||session.get(TOKEN_KEY)||'').trim();
    if(!token){setStatus('error','Ingresa la clave vigente para esta sesión.');openModal();return;}
    applyToken(token,e);
    setStatus('connecting','Conectando con la base clínica de Google Drive…');
    if(e.status)e.status.textContent='Conectando con Google Sheets…';
    if(pingFirst&&e.ping)e.ping.click();
    setTimeout(()=>e.load?.click(),pingFirst?450:80);
  }

  function observeStatus(e){
    if(!e.status)return;
    const update=()=>{
      const value=String(e.status.textContent||'').trim();
      if(!value)return;
      if(/error|fall|invál|incorrect|deneg|token|permiso|no se pudo/i.test(value))setStatus('error',value);
      else if(/cargad|conectad|ok|éxito|listo|paciente/i.test(value))setStatus('ready',value);
      else if(/cargando|conectando|leyendo|consultando/i.test(value))setStatus('connecting',value);
    };
    new MutationObserver(update).observe(e.status,{childList:true,subtree:true,characterData:true});
    update();
  }

  function init(){
    injectStyles();
    const e=elements();
    if(!e.token||!e.load||!e.card)return;
    secureTechnicalFields(e);
    createCard(e);
    createModal();
    observeStatus(e);

    document.getElementById('orionDriveReconnect')?.addEventListener('click',()=>connect(e,{pingFirst:true}));
    document.getElementById('orionDriveChangeAccess')?.addEventListener('click',()=>openModal(e.token.value));
    document.getElementById('orionDriveForget')?.addEventListener('click',()=>{
      session.remove(TOKEN_KEY);
      e.token.value='';
      if(e.status)e.status.textContent='';
      setStatus('error','Acceso cerrado en esta sesión.');
      openModal();
    });
    document.getElementById('orionDriveConnectNow')?.addEventListener('click',()=>{
      const input=document.getElementById('orionDriveTokenInput');
      const error=document.getElementById('orionDriveModalError');
      const token=String(input?.value||'').trim();
      if(!token){if(error)error.textContent='Ingresa la clave vigente.';return;}
      applyToken(token,e);closeModal();connect(e,{pingFirst:true});
    });
    document.getElementById('orionDriveCancel')?.addEventListener('click',closeModal);
    document.getElementById('orionDriveTokenInput')?.addEventListener('keydown',event=>{if(event.key==='Enter')document.getElementById('orionDriveConnectNow')?.click();});

    const active=session.get(TOKEN_KEY);
    if(active){applyToken(active,e);setStatus('connecting','Acceso reconocido. Actualizando pacientes…');setTimeout(()=>connect(e),AUTOLOAD_DELAY_MS);}
    else{setStatus('error','Primera conexión pendiente. Pulsa “Conectar / recargar”.');setTimeout(()=>openModal(),250);}
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
