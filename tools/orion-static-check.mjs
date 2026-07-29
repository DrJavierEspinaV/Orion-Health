import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const root=path.resolve('apps/orion-health');
const failures=[];
const requireFile=relative=>{
  const full=path.join(root,relative);
  if(!fs.existsSync(full))failures.push(`Falta ${relative}`);
  return full;
};
const read=relative=>fs.readFileSync(requireFile(relative),'utf8');

const modules=['comunicaciones','insumos','cmf','endodoncia','ortodoncia','odontopediatria'];
for(const moduleName of modules)requireFile(`modules/${moduleName}/index.html`);
requireFile('assets/brand/maxilofacial-pro-plus.svg');
requireFile('assets/brand/orion-health.png');
requireFile('assets/brand/firma-javier-espina-navy.svg');
requireFile('assets/shared/orion-identity-system-v140.css');
requireFile('assets/shared/clinical-prescription-auth-cmf-v139.js');
requireFile('assets/shared/clinical-prescription-share-cmf-v139.js');

const version=JSON.parse(read('VERSION.json'));
if(!String(version.version).startsWith('1.4.0'))failures.push(`Versión inesperada: ${version.version}`);
if(version.modules?.cmf!=='4.3.34')failures.push(`Versión CMF inesperada: ${version.modules?.cmf}`);
if(version.modules?.insumos!=='4.5.4')failures.push(`Versión Insumos inesperada: ${version.modules?.insumos}`);

const manifest=JSON.parse(read('manifest.webmanifest'));
if(manifest.start_url!=='./index.html')failures.push('start_url PWA incorrecta');
if(manifest.scope!=='./')failures.push('scope PWA incorrecto');
if(manifest.display!=='standalone')failures.push('display PWA debe ser standalone');

const portalHtml=read('index.html');
const portal=read('script-1.js');
for(const moduleName of modules){
  if(!portal.includes(`./modules/${moduleName}/index.html`))failures.push(`Portal no referencia ${moduleName}`);
}
if(!portalHtml.includes('orion-identity-system-v140.css'))failures.push('Portal no carga el sistema visual ORION V1.4.0');
if(!portalHtml.includes('class="orion-portal"'))failures.push('Portal no activa el alcance visual ORION');

const identity=read('assets/shared/orion-identity-system-v140.css');
for(const required of [
  "--orion-blue:#1F3F5B",
  "--orion-gray:#8C8C8C",
  "--orion-white:#FFFFFF",
  "--orion-surface:#F3F3F3",
  "--orion-font:'Montserrat'",
  'min-width:160px',
  'background-image:none!important'
]){
  if(!identity.includes(required))failures.push(`Sistema visual ORION incompleto: ${required}`);
}
if(!identity.includes("@import url('https://fonts.googleapis.com/css2?family=Montserrat"))failures.push('Sistema visual ORION no carga Montserrat');

const comunicacionesLoader=read('modules/comunicaciones/loader.js');
const insumosLoader=read('modules/insumos/loader.js');
const cmfLoader=read('modules/cmf/loader.js');
const endoLoader=read('modules/endodoncia/loader.js');
const ortoLoader=read('modules/ortodoncia/loader.js');
const odontoLoader=read('modules/odontopediatria/loader.js');
for(const [name,text] of [
  ['Comunicaciones',comunicacionesLoader],
  ['Insumos',insumosLoader],
  ['CMF',cmfLoader],
  ['Endodoncia',endoLoader],
  ['Ortodoncia',ortoLoader],
  ['Odontopediatría',odontoLoader]
]){
  if(!text.includes('orion-identity-system-v140.css'))failures.push(`${name} no carga el sistema visual ORION V1.4.0`);
}
if(!comunicacionesLoader.includes('communications-priority-layout.js'))failures.push('Comunicaciones no carga el layout con prioridad de pacientes');
if(!cmfLoader.includes('clinical-nps-cmf-v136.js'))failures.push('CMF no carga NPS obligatorio V1.3.6');
if(!cmfLoader.includes('clinical-audit-cmf.js'))failures.push('CMF no carga auditoría clínica');
if(!cmfLoader.includes('clinical-templates-cmf-v132.js'))failures.push('CMF no carga plantillas V1.3.2');
if(!cmfLoader.includes('clinical-output-cmf-v134.js'))failures.push('CMF no carga salidas V1.3.4');
if(!cmfLoader.includes('clinical-preview-cmf-v135.js'))failures.push('CMF no carga pestañas de vista previa V1.3.5');
if(!cmfLoader.includes('clinical-prescription-auth-cmf-v139.js'))failures.push('CMF no carga autorización de receta V1.3.9');
if(!cmfLoader.includes('clinical-prescription-share-cmf-v139.js'))failures.push('CMF no carga salida firmada V1.3.9');
if(!cmfLoader.includes('maxilofacial-pro-plus.svg'))failures.push('CMF no carga Maxilofacial PRO+ en el encabezado del módulo');
if(!cmfLoader.includes('orion-health.png'))failures.push('CMF no conserva el logo ORION previo en documentos');
if(!cmfLoader.includes('firma-javier-espina-navy.svg'))failures.push('CMF no restaura la firma manuscrita');
if(!cmfLoader.includes('#printSheet #fixedFoot .firmaimg'))failures.push('CMF no limita la firma a la página de receta');
if(cmfLoader.includes('maxilofacial-pro-plus-compact.svg'))failures.push('CMF aún usa Maxilofacial PRO+ en documentos');
if(/replace\(\/\<img\[\^>\]\*class="firmaimg"/.test(cmfLoader))failures.push('CMF todavía elimina la firma manuscrita');
if(!endoLoader.includes('clinical-audit-endo.js'))failures.push('Endodoncia no carga auditoría clínica');
if(!cmfLoader.includes('clinical-components-restore.js'))failures.push('CMF no restaura catálogo por fármacos');
if(!endoLoader.includes('clinical-components-restore.js'))failures.push('Endodoncia no restaura catálogo por fármacos');

const cmfLogo=read('assets/brand/maxilofacial-pro-plus.svg');
for(const required of ['Maxilofacial PRO+','maxilofacial-pro-plus-user-supplied']){
  if(!cmfLogo.includes(required))failures.push(`Logo CMF no contiene: ${required}`);
}

const signature=read('assets/brand/firma-javier-espina-navy.svg');
for(const required of ['Firma manuscrita Dr. Javier Espina Videla','fill="#07142f"','viewBox="0 0 300 299"']){
  if(!signature.includes(required))failures.push(`Firma CMF incompleta: ${required}`);
}

const sessionConfig=read('assets/shared/session-config.js');
if(/extractTokenFromHash|HASH_KEYS|orion-token|location\.hash/i.test(sessionConfig))failures.push('La conexión Drive aún admite credenciales por URL/hash');
if(!sessionConfig.includes('sessionStorage'))failures.push('La credencial no está limitada a sessionStorage');

const communicationsLayout=read('assets/shared/communications-priority-layout.js');
for(const required of ['orionPatientPriorityControls','orionDataSourcePanel','orionDataSourceStatus','PATIENTS_FIRST']){
  if(!communicationsLayout.includes(required))failures.push(`Layout de Comunicaciones incompleto: ${required}`);
}

const cmfAudit=read('assets/shared/clinical-audit-cmf.js');
const endoAudit=read('assets/shared/clinical-audit-endo.js');
for(const [name,text] of [['CMF',cmfAudit],['Endodoncia',endoAudit]]){
  if(!text.includes('Confirmo que revisé'))failures.push(`${name} no exige confirmación profesional`);
  if(!text.includes('C. difficile'))failures.push(`${name} no registra cautela de clindamicina`);
}
if(/MELOXICAM 15 mg[\s\S]{0,80}cada 12/i.test(cmfAudit))failures.push('Pauta insegura de meloxicam en auditoría CMF');

const cmfTemplates=read('assets/shared/clinical-templates-cmf-v132.js');
for(const required of ['Post_Qx1','Post_Qx2','PRE_QX','PARACETAMOL 1 g','KETOPROFENO 50 mg','DEXAMETASONA 8 mg','Dosis única 1 hora antes']){
  if(!cmfTemplates.includes(required))failures.push(`Plantillas CMF V1.3.2 sin contenido requerido: ${required}`);
}
if(!cmfTemplates.includes('solo si fue indicada por el clínico'))failures.push('Dexametasona sin control de indicación clínica');

const cmfNps=read('assets/shared/clinical-nps-cmf-v136.js');
for(const required of [
  'Encuesta de satisfacción (NPS):',
  'Puede recibir una encuesta aleatoria sobre su experiencia de hoy.',
  'Responderla toma 1 min y nos ayuda a mejorar.',
  'ensureNps',
  'mandatory:true',
  'ORION_CMF_NPS_V136'
]){
  if(!cmfNps.includes(required))failures.push(`NPS CMF V1.3.6 incompleto: ${required}`);
}
if(!cmfNps.includes("new Set(['btnPrint','btnPdf','btnWA','btnCopy','orionClinicalTabPreview'])"))failures.push('NPS CMF no se asegura antes de todas las salidas');

const rxAuth=read('assets/shared/clinical-prescription-auth-cmf-v139.js');
for(const required of ['ORH-CMF-RX-','verificationCode','issuedLabel','indexedDB','appendAudit','authorize','logOutput','verifyCurrent',"signature:'recipe-only'"]){
  if(!rxAuth.includes(required))failures.push(`Autorización CMF V1.3.9 incompleta: ${required}`);
}
if(!rxAuth.includes("PROTECTED_FIELDS=['p_nombre','p_rut','p_edad','p_peso','p_dx','p_dx2','receta','indicaciones']"))failures.push('Autorización CMF no invalida al editar datos clínicos');

const rxShare=read('assets/shared/clinical-prescription-share-cmf-v139.js');
for(const required of ['setProperties','navigator.share','navigator.canShare','files:[file]','WHATSAPP_PDF_DOWNLOADED','firmaimg','ORION_CMF_RX_AUTH','Folio: ${auth.folio}','Código: ${auth.verificationCode}']){
  if(!rxShare.includes(required))failures.push(`Salida firmada CMF V1.3.9 incompleta: ${required}`);
}
if(!rxShare.includes("new Set(['btnPdf','btnWA','btnPrint','btnCopy'])"))failures.push('Salida firmada CMF no controla todos los métodos de emisión');

const cmfOutput=read('assets/shared/clinical-output-cmf-v134.js');
for(const required of ['orion-actions-top','api.whatsapp.com/send?text=','whatsapp://send?text=','format:[5.5,8.5]','--brand-logo-h:52px','ORION_CMF_OUTPUT_V134']){
  if(!cmfOutput.includes(required))failures.push(`Salida CMF V1.3.4 incompleta: ${required}`);
}
if(!cmfOutput.includes('event.stopImmediatePropagation()'))failures.push('Salida CMF no reemplaza los controladores antiguos');

const cmfPreview=read('assets/shared/clinical-preview-cmf-v135.js');
for(const required of ['orionClinicalTabEdit','orionClinicalTabPreview','orionClinicalEditPane','orionPrintPreviewPane','orionPrintPreviewPages','ORION_CMF_PREVIEW_V135','defaultTab:\'edit\'','preview:\'on-demand\'']){
  if(!cmfPreview.includes(required))failures.push(`Vista previa CMF V1.3.5 incompleta: ${required}`);
}
if(!cmfPreview.includes('@media print'))failures.push('Vista previa CMF no fuerza las hojas durante impresión');

const componentRestore=read('assets/shared/clinical-components-restore.js');
if(!componentRestore.includes('ACTIVO CON CONTROL CLÍNICO'))failures.push('Catálogo farmacológico restaurado sin estado de control clínico');
if(!componentRestore.includes('invalidateConfirmation'))failures.push('Catálogo farmacológico no reinicia la confirmación clínica al editar');

for(const candidate of fs.readdirSync(root,{recursive:true})){
  const relative=String(candidate);
  const full=path.join(root,relative);
  if(!fs.statSync(full).isFile())continue;
  if(/firma_tinta/i.test(relative))failures.push(`Archivo obsoleto de firma publicado: ${relative}`);
  if(!/\.(?:html|js|part)$/i.test(relative))continue;
  const text=fs.readFileSync(full,'utf8');
  for(const match of text.matchAll(/<input\b[^>]*(?:id|name)=["'][^"']*token[^"']*["'][^>]*>/gi)){
    const inputValue=match[0].match(/\bvalue=["']([^"']*)["']/i)?.[1]||'';
    if(inputValue.trim())failures.push(`Credencial predeterminada en ${relative}`);
  }
  if(/(?:#|\?|&)orion[-_]?token=/i.test(text))failures.push(`Credencial admitida por URL en ${relative}`);
  if(/ORION-[A-Z0-9]{4,}-[A-Z0-9-]{4,}/.test(text))failures.push(`Posible secreto ORION incrustado en ${relative}`);
}

const catalogMeta=JSON.parse(read('data/catalogo-insumos.json'));
if(catalogMeta.encoding!=='gzip+base64'||!catalogMeta.data)failures.push('Catálogo de Insumos no tiene formato esperado');
else{
  const decoded=JSON.parse(zlib.gunzipSync(Buffer.from(catalogMeta.data,'base64')).toString('utf8'));
  if(!Array.isArray(decoded.items)||decoded.items.length!==538)failures.push(`Catálogo integrado: ${decoded.items?.length??0} registros; se esperaban 538`);
}

const serviceWorker=read('service-worker.js');
if(!serviceWorker.includes('orion-dental-app-v1.4.0'))failures.push('Service worker no usa caché V1.4.0');
if(!serviceWorker.includes('orion-identity-system-v140.css'))failures.push('Service worker no incluye el sistema visual ORION V1.4.0');
if(!serviceWorker.includes('communications-priority-layout.js'))failures.push('Service worker no incluye el layout de Comunicaciones');
if(!serviceWorker.includes('clinical-nps-cmf-v136.js'))failures.push('Service worker no incluye NPS CMF V1.3.6');
if(!serviceWorker.includes('clinical-components-restore.js'))failures.push('Service worker no incluye el restaurador farmacológico');
if(!serviceWorker.includes('clinical-templates-cmf-v132.js'))failures.push('Service worker no incluye plantillas CMF V1.3.2');
if(!serviceWorker.includes('clinical-prescription-auth-cmf-v139.js'))failures.push('Service worker no incluye autorización de receta CMF');
if(!serviceWorker.includes('clinical-prescription-share-cmf-v139.js'))failures.push('Service worker no incluye salida firmada CMF');
if(!serviceWorker.includes('firma-javier-espina-navy.svg'))failures.push('Service worker no incluye la firma manuscrita');
if(!serviceWorker.includes('clinical-output-cmf-v134.js'))failures.push('Service worker no incluye salidas CMF V1.3.4');
if(!serviceWorker.includes('clinical-preview-cmf-v135.js'))failures.push('Service worker no incluye vista previa CMF V1.3.5');
if(!serviceWorker.includes('maxilofacial-pro-plus.svg'))failures.push('Service worker no incluye el logo de interfaz CMF');
if(serviceWorker.includes('maxilofacial-pro-plus-compact.svg'))failures.push('Service worker aún distribuye un logo CMF para documentos');

if(failures.length){
  console.error('\nORION V1.4.0 — VERIFICACIÓN FALLIDA');
  [...new Set(failures)].forEach(item=>console.error(`- ${item}`));
  process.exit(1);
}
console.log('ORION V1.4.0 — verificación estática aprobada');
console.log(`Módulos: ${modules.length} | Identidad: Montserrat + Azul ORION + retícula de logos | CMF: documentos preservados | PWA: ${manifest.display}`);
