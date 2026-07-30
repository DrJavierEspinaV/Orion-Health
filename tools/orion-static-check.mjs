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
const includesAll=(name,text,required)=>{
  for(const token of required)if(!text.includes(token))failures.push(`${name} incompleto: ${token}`);
};

const modules=['comunicaciones','insumos','cmf','endodoncia','ortodoncia','odontopediatria'];
for(const moduleName of modules)requireFile(`modules/${moduleName}/index.html`);
for(const file of [
  'assets/brand/maxilofacial-pro-plus.svg',
  'assets/brand/orion-health.png',
  'assets/brand/firma-javier-espina-navy.svg',
  'assets/shared/orion-identity-system-v140.css',
  'assets/shared/orion-mobile-v141.css',
  'assets/shared/orion-mobile-fixes-v142.css',
  'assets/shared/clinical-mobile-docs-cmf-v141.js',
  'assets/shared/clinical-mobile-layout-cmf-v142.js',
  'assets/shared/clinical-signature-raster-cmf-v142.js',
  'assets/shared/clinical-prescription-auth-cmf-v139.js',
  'assets/shared/clinical-prescription-share-cmf-v139.js'
])requireFile(file);

const version=JSON.parse(read('VERSION.json'));
if(!String(version.version).startsWith('1.4.2'))failures.push(`Versión inesperada: ${version.version}`);
if(version.modules?.portal!=='1.4.2')failures.push(`Versión Portal inesperada: ${version.modules?.portal}`);
if(version.modules?.cmf!=='4.3.36')failures.push(`Versión CMF inesperada: ${version.modules?.cmf}`);
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
includesAll('Portal V1.4.2',portalHtml,[
  'orion-identity-system-v140.css',
  'orion-mobile-v141.css',
  'orion-mobile-fixes-v142.css',
  'class="orion-portal"',
  'script-1.js?v=1.4.2'
]);

const identity=read('assets/shared/orion-identity-system-v140.css');
includesAll('Sistema visual ORION',identity,[
  '--orion-blue:#1F3F5B',
  '--orion-gray:#8C8C8C',
  '--orion-white:#FFFFFF',
  '--orion-surface:#F3F3F3',
  "--orion-font:'Montserrat'",
  'min-width:160px',
  'background-image:none!important',
  "@import url('https://fonts.googleapis.com/css2?family=Montserrat"
]);

const mobile=read('assets/shared/orion-mobile-v141.css');
includesAll('Sistema móvil ORION V1.4.1',mobile,[
  '@media screen and (max-width:700px)',
  'grid-template-columns:repeat(2,minmax(0,1fr))',
  '#examDrawer,#interDrawer',
  'height:100dvh!important',
  '#printSheet,#printSheet2,#printDoc,#printExamLab,#printExamImg,#printInter',
  '.page [id^="fixedFoot"]',
  'position:relative!important'
]);

const mobileFixes=read('assets/shared/orion-mobile-fixes-v142.css');
includesAll('Correcciones móviles ORION V1.4.2',mobileFixes,[
  '.orion-doc-type-controls',
  '.orion-doc-actions',
  '.orion-mode-switch',
  '.orion-exam-scroll-area',
  'touch-action:pan-y!important',
  '-webkit-overflow-scrolling:touch!important',
  '.orion-exam-actions-top',
  'grid-template-columns:repeat(2,minmax(0,1fr))'
]);

const comunicacionesLoader=read('modules/comunicaciones/loader.js');
const insumosLoader=read('modules/insumos/loader.js');
const cmfLoader=read('modules/cmf/loader.js');
const endoLoader=read('modules/endodoncia/loader.js');
const ortoLoader=read('modules/ortodoncia/loader.js');
const odontoLoader=read('modules/odontopediatria/loader.js');
for(const [name,text] of [
  ['Comunicaciones',comunicacionesLoader],['Insumos',insumosLoader],['CMF',cmfLoader],
  ['Endodoncia',endoLoader],['Ortodoncia',ortoLoader],['Odontopediatría',odontoLoader]
]){
  if(!text.includes('orion-identity-system-v140.css'))failures.push(`${name} no carga el sistema visual ORION`);
}
if(!comunicacionesLoader.includes('communications-priority-layout.js'))failures.push('Comunicaciones no carga el layout con prioridad de pacientes');
includesAll('CMF loader V1.4.2',cmfLoader,[
  'clinical-nps-cmf-v136.js','clinical-audit-cmf.js','clinical-templates-cmf-v132.js',
  'clinical-output-cmf-v134.js','clinical-preview-cmf-v135.js',
  'clinical-prescription-auth-cmf-v139.js','clinical-prescription-share-cmf-v139.js',
  'clinical-mobile-docs-cmf-v141.js','orion-mobile-v141.css',
  'orion-mobile-fixes-v142.css','clinical-mobile-layout-cmf-v142.js','clinical-signature-raster-cmf-v142.js',
  'maxilofacial-pro-plus.svg','orion-health.png','firma-javier-espina-navy.svg',
  '#printSheet #fixedFoot .firmaimg','#printDoc:not(.hidden) #fixedFoot3 .firmaimg',
  '#printExamLab:not(.hidden) #fixedFoot4 .firmaimg','#printExamImg:not(.hidden) #fixedFoot5 .firmaimg',
  '#printInter:not(.hidden) #fixedFoot6 .firmaimg','v4.3.36'
]);
if(cmfLoader.includes('maxilofacial-pro-plus-compact.svg'))failures.push('CMF aún usa Maxilofacial PRO+ en documentos');
if(/replace\(\/\<img\[\^>\]\*class="firmaimg"/.test(cmfLoader))failures.push('CMF todavía elimina la firma manuscrita');
if(!endoLoader.includes('clinical-audit-endo.js'))failures.push('Endodoncia no carga auditoría clínica');
if(!cmfLoader.includes('clinical-components-restore.js'))failures.push('CMF no restaura catálogo por fármacos');
if(!endoLoader.includes('clinical-components-restore.js'))failures.push('Endodoncia no restaura catálogo por fármacos');

const mobileDocs=read('assets/shared/clinical-mobile-docs-cmf-v141.js');
includesAll('Sincronización de órdenes CMF',mobileDocs,[
  'selectedLab','selectedImg','syncOrders','btnExamClose','examBackdrop',
  "['btnPrint','btnPdf','btnWA','orionClinicalTabPreview']",
  'printExamLab','printExamImg','ORION_CMF_DOCS_V141'
]);

const mobileLayout=read('assets/shared/clinical-mobile-layout-cmf-v142.js');
includesAll('Layout táctil CMF V1.4.2',mobileLayout,[
  'orion-doc-type-controls','orion-mode-switch','orion-exam-scroll-area',
  'orion-exam-actions-top','touchstart','touchmove','preventDefault',
  'scrollArea.insertBefore(actionBar,firstPanel)','ORION_CMF_MOBILE_V142'
]);

const signatureRaster=read('assets/shared/clinical-signature-raster-cmf-v142.js');
includesAll('Firma rasterizada CMF V1.4.2',signatureRaster,[
  'canvas.toDataURL(\'image/png\')','data-orion-signature-format','png-v142',
  'MutationObserver','ORION_CMF_SIGNATURE_V142','svg-fallback','OUTPUT_IDS'
]);

const cmfLogo=read('assets/brand/maxilofacial-pro-plus.svg');
includesAll('Logo CMF',cmfLogo,['Maxilofacial PRO+','maxilofacial-pro-plus-user-supplied']);
const signature=read('assets/brand/firma-javier-espina-navy.svg');
includesAll('Firma CMF',signature,['Firma manuscrita Dr. Javier Espina Videla','fill="#07142f"','viewBox="0 0 300 299"']);

const sessionConfig=read('assets/shared/session-config.js');
if(/extractTokenFromHash|HASH_KEYS|orion-token|location\.hash/i.test(sessionConfig))failures.push('La conexión Drive aún admite credenciales por URL/hash');
if(!sessionConfig.includes('sessionStorage'))failures.push('La credencial no está limitada a sessionStorage');

const communicationsLayout=read('assets/shared/communications-priority-layout.js');
includesAll('Layout de Comunicaciones',communicationsLayout,['orionPatientPriorityControls','orionDataSourcePanel','orionDataSourceStatus','PATIENTS_FIRST']);

const cmfAudit=read('assets/shared/clinical-audit-cmf.js');
const endoAudit=read('assets/shared/clinical-audit-endo.js');
for(const [name,text] of [['CMF',cmfAudit],['Endodoncia',endoAudit]]){
  if(!text.includes('Confirmo que revisé'))failures.push(`${name} no exige confirmación profesional`);
  if(!text.includes('C. difficile'))failures.push(`${name} no registra cautela de clindamicina`);
}
if(/MELOXICAM 15 mg[\s\S]{0,80}cada 12/i.test(cmfAudit))failures.push('Pauta insegura de meloxicam en auditoría CMF');

const cmfTemplates=read('assets/shared/clinical-templates-cmf-v132.js');
includesAll('Plantillas CMF V1.3.2',cmfTemplates,['Post_Qx1','Post_Qx2','PRE_QX','PARACETAMOL 1 g','KETOPROFENO 50 mg','DEXAMETASONA 8 mg','Dosis única 1 hora antes','solo si fue indicada por el clínico']);

const cmfNps=read('assets/shared/clinical-nps-cmf-v136.js');
includesAll('NPS CMF',cmfNps,['Encuesta de satisfacción (NPS):','Puede recibir una encuesta aleatoria sobre su experiencia de hoy.','Responderla toma 1 min y nos ayuda a mejorar.','ensureNps','mandatory:true','ORION_CMF_NPS_V136',"new Set(['btnPrint','btnPdf','btnWA','btnCopy','orionClinicalTabPreview'])"]);

const rxAuth=read('assets/shared/clinical-prescription-auth-cmf-v139.js');
includesAll('Autorización CMF V1.3.9',rxAuth,['ORH-CMF-RX-','verificationCode','issuedLabel','indexedDB','appendAudit','authorize','logOutput','verifyCurrent',"signature:'recipe-only'","PROTECTED_FIELDS=['p_nombre','p_rut','p_edad','p_peso','p_dx','p_dx2','receta','indicaciones']"]);

const rxShare=read('assets/shared/clinical-prescription-share-cmf-v139.js');
includesAll('Salida firmada CMF V1.3.9',rxShare,['setProperties','navigator.share','navigator.canShare','files:[file]','WHATSAPP_PDF_DOWNLOADED','firmaimg','ORION_CMF_RX_AUTH','Folio: ${auth.folio}','Código: ${auth.verificationCode}',"new Set(['btnPdf','btnWA','btnPrint','btnCopy'])"]);

const cmfOutput=read('assets/shared/clinical-output-cmf-v134.js');
includesAll('Salida CMF V1.3.4',cmfOutput,['orion-actions-top','api.whatsapp.com/send?text=','whatsapp://send?text=','format:[5.5,8.5]','--brand-logo-h:52px','ORION_CMF_OUTPUT_V134','event.stopImmediatePropagation()']);

const cmfPreview=read('assets/shared/clinical-preview-cmf-v135.js');
includesAll('Vista previa CMF V1.3.5',cmfPreview,['orionClinicalTabEdit','orionClinicalTabPreview','orionClinicalEditPane','orionPrintPreviewPane','orionPrintPreviewPages','ORION_CMF_PREVIEW_V135',"defaultTab:'edit'","preview:'on-demand'",'@media print']);

const componentRestore=read('assets/shared/clinical-components-restore.js');
includesAll('Catálogo farmacológico',componentRestore,['ACTIVO CON CONTROL CLÍNICO','invalidateConfirmation']);

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
includesAll('Service worker V1.4.2',serviceWorker,[
  'orion-dental-app-v1.4.2','orion-identity-system-v140.css','orion-mobile-v141.css',
  'orion-mobile-fixes-v142.css','clinical-mobile-docs-cmf-v141.js','clinical-mobile-layout-cmf-v142.js',
  'clinical-signature-raster-cmf-v142.js','communications-priority-layout.js','clinical-nps-cmf-v136.js',
  'clinical-components-restore.js','clinical-templates-cmf-v132.js','clinical-prescription-auth-cmf-v139.js',
  'clinical-prescription-share-cmf-v139.js','firma-javier-espina-navy.svg','clinical-output-cmf-v134.js',
  'clinical-preview-cmf-v135.js','maxilofacial-pro-plus.svg'
]);
if(serviceWorker.includes('maxilofacial-pro-plus-compact.svg'))failures.push('Service worker aún distribuye un logo CMF para documentos');

if(failures.length){
  console.error('\nORION V1.4.2 — VERIFICACIÓN FALLIDA');
  [...new Set(failures)].forEach(item=>console.error(`- ${item}`));
  process.exit(1);
}
console.log('ORION V1.4.2 — verificación estática aprobada');
console.log(`Módulos: ${modules.length} | Android vertical: corregido | CMF: scroll táctil + acciones superiores + firma PNG | PWA: ${manifest.display}`);
