/* ORION: OAuth de lectura Sheets. Sin token en URLs ni almacenamiento. */
(()=>{
'use strict';
const KEY='orion_google_db_config_v1';
const card=document.querySelector('.bdCard');
if(!card)return;
let token='',expiresAt=0,loading=false,client=null;
const getConfig=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch(_){return {}}};
const validClient=x=>/^[0-9]+-[a-z0-9_-]+\.apps\.googleusercontent\.com$/.test(x||'');
const validSheet=x=>/^[A-Za-z0-9_-]{20,120}$/.test(x||'');
const box=document.createElement('section');
box.id='orionGoogleOAuthPanel';
box.innerHTML='<strong>Acceso con cuenta Google</strong>'+
 '<p>Consulta la base clínica sin clave ORION. Solo lectura, con permisos de Google; no cambia la importación SAP.</p>'+
 '<div class="orion-google-actions"><button type="button" id="orionGoogleLogin">Acceder con Google</button> '+
 '<button type="button" id="orionGoogleRefresh" disabled>Actualizar agenda</button> '+
 '<button type="button" id="orionGoogleSetup">Configuración</button></div>'+
 '<div id="orionGoogleStatus" role="status" aria-live="polite">Configuración pendiente.</div>'+
 '<div id="orionGoogleConfig" hidden>'+
 '<label>OAuth Client ID público<input id="orionGoogleClient" placeholder="…apps.googleusercontent.com" autocomplete="off"></label>'+
 '<label>ID de Google Sheets (ORION_DB_SAP)<input id="orionGoogleSheet" placeholder="ID de la hoja" autocomplete="off"></label>'+
 '<button type="button" id="orionGoogleSave">Guardar</button>'+
 '<p>No pegues contraseñas ni secretos. Solo identificadores públicos; quedan en este navegador.</p></div>';
const css=document.createElement('style');
css.textContent='#orionGoogleOAuthPanel{background:#eff7fc;border:1px solid #bfd9e9;border-radius:14px;padding:13px;margin:10px 0;color:#1f3f5b}'+
'#orionGoogleOAuthPanel strong{font-size:14px}#orionGoogleOAuthPanel p,#orionGoogleStatus{font-size:12px;line-height:1.4}'+
'#orionGoogleOAuthPanel button{padding:8px 11px;margin:3px;border:1px solid #9ebcd2;border-radius:9px;background:white;color:#1f3f5b;font-weight:700}'+
'#orionGoogleLogin{background:#1f3f5b!important;color:white!important}#orionGoogleOAuthPanel button:disabled{opacity:.45}'+
'#orionGoogleOAuthPanel input{width:100%;box-sizing:border-box;border:1px solid #aac4d6;border-radius:8px;padding:9px}'+
'#orionGoogleOAuthPanel label{display:block;font-size:12px;font-weight:700;margin:8px 0}';
document.head.appendChild(css);
card.parentNode.insertBefore(box,card);
const $=id=>document.getElementById(id);
const cfg=getConfig();$('orionGoogleClient').value=cfg.clientId||'';$('orionGoogleSheet').value=cfg.sheetId||'';
function status(msg,error=false){$('orionGoogleStatus').textContent=msg;$('orionGoogleStatus').style.color=error?'#a02438':'#1f3f5b';}
function loadGIS(){
 if(window.google?.accounts?.oauth2)return Promise.resolve();
 return new Promise((resolve,reject)=>{
  const script=document.createElement('script');script.src='https://accounts.google.com/gsi/client';script.async=true;
  script.onload=resolve;script.onerror=()=>reject(Error('No se cargó Google Identity Services.'));
  document.head.appendChild(script);
 });
}
function publish(values){
 const headers=(values[0]||[]).map(x=>String(x||'').trim());
 if(!headers.some(h=>/^(paciente|nombre|run|rut)$/i.test(h)))throw Error('Encabezados de la hoja DB no reconocidos.');
 const rows=values.slice(1).filter(r=>r.some(v=>String(v||'').trim())).map(r=>{
  const o={};headers.forEach((h,i)=>{if(h)o[h]=r[i]??''});return o;
 });
 window.dispatchEvent(new CustomEvent('orion:google-db-loaded',{detail:{rows:rows}}));
 return rows.length;
}
async function refresh(){
 if(loading)return;
 const c=getConfig();
 if(!token||Date.now()>expiresAt-60000){status('La sesión de Google expiró. Accede nuevamente.',true);return;}
 loading=true;$('orionGoogleRefresh').disabled=true;
 try{
  status('Consultando agenda con autorización Google…');
  const range=encodeURIComponent("'DB'!A1:AZ10000");
  const url='https://sheets.googleapis.com/v4/spreadsheets/'+encodeURIComponent(c.sheetId)+'/values/'+range+'?majorDimension=ROWS';
  const response=await fetch(url,{headers:{Authorization:'Bearer '+token},cache:'no-store',credentials:'omit',referrerPolicy:'no-referrer'});
  if(!response.ok){
   if(response.status===401){token='';expiresAt=0;}
   if(response.status===403)throw Error('Acceso denegado: comprueba permisos y Google Sheets API.');
   throw Error('No se pudo consultar DB (HTTP '+response.status+').');
  }
  const payload=await response.json();
  const count=publish(payload.values||[]);
  status('Agenda cargada con Google: '+count+' registros · '+new Date().toLocaleString('es-CL'));
 }catch(error){status(error.message,true)}
 finally{loading=false;$('orionGoogleRefresh').disabled=!token}
}
async function connect(){
 const c=getConfig();
 if(!validClient(c.clientId)||!validSheet(c.sheetId)){
  $('orionGoogleConfig').hidden=false;status('Configura los identificadores de Google una sola vez.',true);return;
 }
 $('orionGoogleLogin').disabled=true;
 try{
  await loadGIS();
  client=window.google.accounts.oauth2.initTokenClient({
   client_id:c.clientId,scope:'https://www.googleapis.com/auth/spreadsheets.readonly',
   callback:answer=>{
    $('orionGoogleLogin').disabled=false;
    if(!answer?.access_token){status('Google no autorizó el acceso.',true);return;}
    token=answer.access_token;expiresAt=Date.now()+Number(answer.expires_in||3000)*1000;
    $('orionGoogleRefresh').disabled=false;refresh();
   },
   error_callback:()=>{$('orionGoogleLogin').disabled=false;status('No se pudo abrir Google.',true)}
  });
  client.requestAccessToken({prompt:''});
 }catch(error){$('orionGoogleLogin').disabled=false;status(error.message,true)}
}
$('orionGoogleSave').addEventListener('click',()=>{
 const c={clientId:$('orionGoogleClient').value.trim(),sheetId:$('orionGoogleSheet').value.trim()};
 if(!validClient(c.clientId)||!validSheet(c.sheetId)){status('Identificadores de Google incorrectos.',true);return;}
 localStorage.setItem(KEY,JSON.stringify(c));token='';expiresAt=0;
 $('orionGoogleRefresh').disabled=true;$('orionGoogleConfig').hidden=true;
 status('Configuración guardada. Accede con tu cuenta Google.');
});
$('orionGoogleSetup').addEventListener('click',()=>{$('orionGoogleConfig').hidden=!$('orionGoogleConfig').hidden});
$('orionGoogleLogin').addEventListener('click',connect);
$('orionGoogleRefresh').addEventListener('click',refresh);
if(validClient(cfg.clientId)&&validSheet(cfg.sheetId))status('Configurado. Accede con Google para cargar la agenda.');
})();