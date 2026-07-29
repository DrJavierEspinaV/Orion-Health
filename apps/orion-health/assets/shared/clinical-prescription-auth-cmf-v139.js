(()=>{
  'use strict';

  const VERSION='CMF-RX-AUTH-2026.07.29-V1';
  const SESSION_KEY='orion_cmf_rx_authorization_v139';
  const DB_NAME='orion_cmf_audit_v1';
  const DB_VERSION=1;
  const STORE='events';
  const SIGNATURE_URL='../../assets/brand/firma-javier-espina-navy.svg';
  const PROTECTED_FIELDS=['p_nombre','p_rut','p_edad','p_peso','p_dx','p_dx2','receta','indicaciones'];
  const $=id=>document.getElementById(id);

  function value(id){
    return String($(id)?.value||'').trim();
  }

  function canonicalPayload(){
    return JSON.stringify({
      patient:{
        name:value('p_nombre'),
        run:value('p_rut'),
        age:value('p_edad'),
        weight:value('p_peso')
      },
      diagnosis:value('p_dx2')||value('p_dx'),
      prescription:value('receta'),
      instructions:value('indicaciones'),
      prescriber:{
        name:'Dr. Javier Espina Videla',
        run:'15.699.633-5',
        specialty:'Cirugía y Traumatología Bucomaxilofacial',
        university:'Universidad de Chile'
      }
    });
  }

  function bytesToHex(bytes){
    return Array.from(bytes,value=>value.toString(16).padStart(2,'0')).join('');
  }

  async function sha256(text){
    const input=new TextEncoder().encode(String(text||''));
    if(globalThis.crypto?.subtle){
      const digest=await globalThis.crypto.subtle.digest('SHA-256',input);
      return bytesToHex(new Uint8Array(digest));
    }
    let hash=2166136261;
    for(const byte of input){
      hash^=byte;
      hash=Math.imul(hash,16777619);
    }
    return `${(hash>>>0).toString(16).padStart(8,'0')}${bytesToHex(input.slice(0,12))}`.padEnd(64,'0').slice(0,64);
  }

  function randomHex(length=4){
    const bytes=new Uint8Array(Math.ceil(length/2));
    if(globalThis.crypto?.getRandomValues)globalThis.crypto.getRandomValues(bytes);
    else for(let index=0;index<bytes.length;index+=1)bytes[index]=Math.floor(Math.random()*256);
    return bytesToHex(bytes).slice(0,length).toUpperCase();
  }

  function compactStamp(date){
    const pad=value=>String(value).padStart(2,'0');
    return `${date.getFullYear()}${pad(date.getMonth()+1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
  }

  function issuedLabel(date){
    try{
      return new Intl.DateTimeFormat('es-CL',{
        dateStyle:'short',
        timeStyle:'medium',
        hour12:false,
        timeZone:'America/Santiago'
      }).format(date);
    }catch(_){
      return date.toLocaleString('es-CL',{hour12:false});
    }
  }

  function readSession(){
    try{
      const raw=sessionStorage.getItem(SESSION_KEY);
      return raw?JSON.parse(raw):null;
    }catch(_){
      return null;
    }
  }

  function writeSession(record){
    try{sessionStorage.setItem(SESSION_KEY,JSON.stringify(record));}catch(_){ }
  }

  function clearSession(){
    try{sessionStorage.removeItem(SESSION_KEY);}catch(_){ }
  }

  function openAuditDb(){
    return new Promise((resolve,reject)=>{
      if(!globalThis.indexedDB){resolve(null);return;}
      const request=indexedDB.open(DB_NAME,DB_VERSION);
      request.onupgradeneeded=()=>{
        const db=request.result;
        if(!db.objectStoreNames.contains(STORE)){
          const store=db.createObjectStore(STORE,{keyPath:'id',autoIncrement:true});
          store.createIndex('folio','folio',{unique:false});
          store.createIndex('createdAt','createdAt',{unique:false});
        }
      };
      request.onsuccess=()=>resolve(request.result);
      request.onerror=()=>reject(request.error||new Error('No fue posible abrir la auditoría local.'));
    });
  }

  async function appendAudit(event){
    try{
      const db=await openAuditDb();
      if(!db)return false;
      await new Promise((resolve,reject)=>{
        const transaction=db.transaction(STORE,'readwrite');
        transaction.objectStore(STORE).add(event);
        transaction.oncomplete=()=>resolve();
        transaction.onerror=()=>reject(transaction.error||new Error('No fue posible guardar la auditoría.'));
        transaction.onabort=()=>reject(transaction.error||new Error('Auditoría local cancelada.'));
      });
      db.close();
      return true;
    }catch(error){
      console.warn('ORION CMF audit:',error);
      return false;
    }
  }

  function applySignatureScope(){
    document.querySelectorAll('.firmaimg').forEach(image=>{
      const recipePage=image.closest('#printSheet');
      if(recipePage){
        image.src=SIGNATURE_URL;
        image.alt='Firma manuscrita Dr. Javier Espina Videla';
        image.style.display='block';
        image.removeAttribute('aria-hidden');
      }else{
        image.style.display='none';
        image.setAttribute('aria-hidden','true');
        image.removeAttribute('src');
      }
    });
  }

  function decorateRecipe(record){
    const page=$('printSheet');
    if(!page||!record)return;
    page.dataset.orionRxFolio=record.folio;
    page.dataset.orionRxIssuedAt=record.issuedAt;
    page.dataset.orionRxVerification=record.verificationCode;
    page.dataset.orionRxContentHash=record.contentHash;
  }

  function invalidate({uncheck=true}={}){
    clearSession();
    const page=$('printSheet');
    if(page){
      delete page.dataset.orionRxFolio;
      delete page.dataset.orionRxIssuedAt;
      delete page.dataset.orionRxVerification;
      delete page.dataset.orionRxContentHash;
    }
    if(uncheck){
      const confirmation=$('orionClinicalConfirmCMF');
      if(confirmation)confirmation.checked=false;
    }
  }

  async function authorize(output='EMITIR'){
    const confirmation=$('orionClinicalConfirmCMF');
    if(!confirmation?.checked){
      alert('Debes completar la confirmación clínica antes de emitir, imprimir, copiar o enviar la receta.');
      return null;
    }

    const payload=canonicalPayload();
    const contentHash=await sha256(payload);
    const patientRefHash=await sha256(`${value('p_rut')}|${value('p_nombre')}`);
    const existing=readSession();

    if(existing?.contentHash===contentHash){
      decorateRecipe(existing);
      await appendAudit({
        type:'OUTPUT',
        output,
        folio:existing.folio,
        verificationCode:existing.verificationCode,
        issuedAt:existing.issuedAt,
        contentHash,
        patientRefHash,
        createdAt:new Date().toISOString(),
        version:VERSION
      });
      return existing;
    }

    const issued=new Date();
    const issuedAt=issued.toISOString();
    const folio=`ORH-CMF-RX-${compactStamp(issued)}-${randomHex(4)}`;
    const verificationDigest=await sha256(`${folio}|${issuedAt}|${contentHash}|${randomHex(16)}`);
    const record={
      version:VERSION,
      folio,
      issuedAt,
      issuedLabel:issuedLabel(issued),
      verificationCode:`VC-${verificationDigest.slice(0,12).toUpperCase()}`,
      contentHash
    };

    writeSession(record);
    decorateRecipe(record);
    await appendAudit({
      type:'AUTHORIZED',
      output,
      folio:record.folio,
      verificationCode:record.verificationCode,
      issuedAt:record.issuedAt,
      contentHash,
      patientRefHash,
      createdAt:new Date().toISOString(),
      version:VERSION
    });
    return record;
  }

  async function logOutput(output,record){
    if(!record)return false;
    return appendAudit({
      type:'COMPLETED',
      output,
      folio:record.folio,
      verificationCode:record.verificationCode,
      issuedAt:record.issuedAt,
      contentHash:record.contentHash,
      createdAt:new Date().toISOString(),
      version:VERSION
    });
  }

  async function verifyCurrent(){
    const record=readSession();
    if(!record)return false;
    const currentHash=await sha256(canonicalPayload());
    return currentHash===record.contentHash;
  }

  function installInvalidation(){
    const handler=event=>{
      if(!PROTECTED_FIELDS.includes(event.target?.id))return;
      invalidate();
    };
    document.addEventListener('input',handler,true);
    document.addEventListener('change',handler,true);
  }

  function init(){
    applySignatureScope();
    installInvalidation();
    const existing=readSession();
    if(existing)decorateRecipe(existing);
    window.ORION_CMF_RX_AUTH={
      version:VERSION,
      signature:'recipe-only',
      audit:'indexeddb-local',
      authorize,
      current:readSession,
      invalidate,
      logOutput,
      verifyCurrent
    };
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
