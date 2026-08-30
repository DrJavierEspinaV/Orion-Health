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
  'assets/brand/maxilofacial-pro-plus.svg','assets/brand/orion-health.png','assets/brand/firma-javier-espina-navy.svg',
  'assets/shared/orion-identity-system-v140.css','assets/shared/orion-mobile-v141.css',
  'assets/shared/clinical-mobile-docs-cmf-v141.js','assets/shared/clinical-mobile-cmf-v142.css','assets/shared/clinical-mobile-cmf-v142.js',
  'assets/shared/clinical-prescription-auth-cmf-v139.js','assets/shared/clinical-prescription-share-cmf-v139.js',
  'modules/comunicaciones/mobile-v142.css',
  'modules/armonizacion/index.html','modules/armonizacion/filler-engine-v170.js','modules/armonizacion/caha-engine-v180.js',
  'modules/armonizacion/plla-engine-v190.js','modules/armonizacion/skinbooster-engine-v200.js',
  'modules/armonizacion/skinbooster-engine-v200.css'
])requireFile(file);

const version=JSON.parse(read('VERSION.json'));
if(!String(version.version).startsWith('1.4.5'))failures.push(`Versión inesperada: ${version.version}`);
if(!String(version.modules?.portal||'').startsWith('1.4.5'))failures.push(`Versión Portal inesperada: ${version.modules?.portal}`);
if(version.modules?.comunicaciones!=='5.7.8')failures.push(`Versión Comunicaciones inesperada: ${version.modules?.comunicaciones}`);
if(version.modules?.cmf!=='4.3.41')failures.push(`Versión CMF inesperada: ${version.modules?.cmf}`);
if(version.modules?.insumos!=='4.5.4')failures.push(`Versión Insumos inesperada: ${version.modules?.insumos}`);
if(!String(version.modules?.armonizacion_orofacial||'').startsWith('2.1.0'))failures.push(`Versión Armonización inesperada: ${version.modules?.armonizacion_orofacial}`);

const manifest=JSON.parse(read('manifest.webmanifest'));
if(manifest.start_url!=='./index.html')failures.push('start_url PWA incorrecta');
if(manifest.scope!=='./')failures.push('scope PWA incorrecto');
if(manifest.display!=='standalone')failures.push('display PWA debe ser standalone');

const portalHtml=read('index.html');
const portal=read('script-1.js');
for(const moduleName of modules)if(!portal.includes(`./modules/${moduleName}/index.html`))failures.push(`Portal no referencia ${moduleName}`);
includesAll('Portal ORION',portalHtml,['orion-identity-system-v140.css','orion-mobile-v141.css','orion-portal','script-1.js','portal-armonizacion-v152.js']);

const identity=read('assets/shared/orion-identity-system-v140.css');
includesAll('Sistema visual ORION',identity,[
  '--orion-blue:#1F3F5B','--orion-gray:#8C8C8C','--orion-white:#FFFFFF','--orion-surface:#F3F3F3',
  "--orion-font:'Montserrat'",'min-width:160px','background-image:none!important',"@import url('https://fonts.googleapis.com/css2?family=Montserrat"
]);

const comunicacionesLoader=read('modules/comunicaciones/loader.js');
const insumosLoader=read('modules/insumos/loader.js');
const cmfLoader=read('modules/cmf/loader.js');
const endoLoader=read('modules/endodoncia/loader.js');
const ortoLoader=read('modules/ortodoncia/loader.js');
const odontoLoader=read('modules/odontopediatria/loader.js');
for(const [name,text] of [['Comunicaciones',comunicacionesLoader],['Insumos',insumosLoader],['CMF',cmfLoader],['Endodoncia',endoLoader],['Ortodoncia',ortoLoader],['Odontopediatría',odontoLoader]]){
  if(!text.includes('orion-identity-system-v140.css'))failures.push(`${name} no carga el sistema visual ORION`);
}
includesAll('Comunicaciones móvil V1.4.4',comunicacionesLoader,['communications-priority-layout.js','responsive-fixes.css','mobile-v142.css','v=1.4.2']);

const communicationsLayout=read('assets/shared/communications-priority-layout.js');
includesAll('Layout de Comunicaciones',communicationsLayout,[
  'orionPatientPriorityControls','orionDataSourcePanel','orionDataSourceStatus','orion-communications-mobile',
  'patient-main','patient-run','patient-date','patient-time','patient-status','patient-motive','AGENDA_LIST_MESSAGES_DATA_SOURCE'
]);
const communicationsMobile=read('modules/comunicaciones/mobile-v142.css');
includesAll('Fichas móviles de pacientes',communicationsMobile,[
  'body.orion-communications-mobile .table .row','grid-template-columns:minmax(0,1fr) minmax(0,1fr)',
  '.patient-main','.patient-motive','.crm-left{order:2','.orion-data-source-panel{order:3'
]);

includesAll('CMF loader V1.4.4',cmfLoader,[
  'clinical-nps-cmf-v136.js','clinical-output-cmf-v134.js',
  'clinical-preview-cmf-v135.js','clinical-prescription-auth-cmf-v139.js','clinical-prescription-share-cmf-v139.js',
  'clinical-mobile-docs-cmf-v141.js','clinical-mobile-cmf-v142.css','clinical-mobile-cmf-v142.js',
  'maxilofacial-pro-plus.svg','orion-health.png','firma-javier-espina-navy.svg',
  '#printSheet #fixedFoot .firmaimg','#printDoc:not(.hidden) #fixedFoot3 .firmaimg',
  '#printExamLab:not(.hidden) #fixedFoot4 .firmaimg','#printExamImg:not(.hidden) #fixedFoot5 .firmaimg',
  '#printInter:not(.hidden) #fixedFoot6 .firmaimg'
]);
if(cmfLoader.includes('maxilofacial-pro-plus-compact.svg'))failures.push('CMF aún usa Maxilofacial PRO+ en documentos');
if(!endoLoader.includes('clinical-audit-endo.js'))failures.push('Endodoncia no carga auditoría clínica');
if(!cmfLoader.includes('clinical-components-restore.js'))failures.push('CMF no restaura catálogo por fármacos');
if(!endoLoader.includes('clinical-components-restore.js'))failures.push('Endodoncia no restaura catálogo por fármacos');

const cmfMobile=read('assets/shared/clinical-mobile-cmf-v142.js');
includesAll('CMF móvil V1.4.4',cmfMobile,[
  'orion-cmf-mobile','placeExamActions','orion-exam-actions-inline','touch-action','rasterizeSignature',
  "canvas.toDataURL('image/png')",'png-data-uri','ORION_CMF_MOBILE_V142'
]);
const cmfMobileCss=read('assets/shared/clinical-mobile-cmf-v142.css');
includesAll('CSS CMF móvil V1.4.4',cmfMobileCss,[
  'body.orion-cmf-mobile','touch-action:pan-y!important','orion-exam-actions-inline',
  '#btnExamOrderLab','#btnExamOrderImg','section.card.no-print>.flex.gap-2.mb-4'
]);

const mobileDocs=read('assets/shared/clinical-mobile-docs-cmf-v141.js');
includesAll('Sincronización de órdenes CMF',mobileDocs,['selectedLab','selectedImg','syncOrders','btnExamClose','examBackdrop',"['btnPrint','btnPdf','btnWA','orionClinicalTabPreview']",'printExamLab','printExamImg','ORION_CMF_DOCS_V141']);

const cmfLogo=read('assets/brand/maxilofacial-pro-plus.svg');
includesAll('Logo CMF',cmfLogo,['Maxilofacial PRO+','maxilofacial-pro-plus-user-supplied']);
const signature=read('assets/brand/firma-javier-espina-navy.svg');
includesAll('Firma CMF',signature,['Firma manuscrita Dr. Javier Espina Videla','fill="#07142f"','viewBox="0 0 300 299"']);

const sessionConfig=read('assets/shared/session-config.js');
if(/extractTokenFromHash|HASH_KEYS|orion-token|location\.hash/i.test(sessionConfig))failures.push('La conexión Drive aún admite credenciales por URL/hash');
if(!sessionConfig.includes('sessionStorage'))failures.push('La credencial no está limitada a sessionStorage');

const endoAudit=read('assets/shared/clinical-audit-endo.js');
includesAll('Auditoría Endodoncia conservada',endoAudit,['Confirmo que revisé','C. difficile']);
const cmfSource=read('modules/cmf/source.html');
const cmfTemplates=read('assets/shared/cmf-clinical-v145.js');
includesAll('Fuente clínica CMF',cmfSource,['cmf-clinical-v145.js','ORION_CMF_VALIDATE_OUTPUT','orion-inter-actions']);
includesAll('Plantillas CMF',cmfTemplates,['Post_Qx1','Post_Qx2','PRE_QX','pediatric','ttm_mialgia','pericoronaritis','alveolitis']);
if(cmfLoader.includes('clinical-audit-cmf.js')||cmfLoader.includes('clinical-templates-cmf-v132.js'))failures.push('CMF carga controles o plantillas retirados');
const cmfNps=read('assets/shared/clinical-nps-cmf-v136.js');
includesAll('NPS CMF',cmfNps,['Encuesta de satisfacción (NPS):','Puede recibir una encuesta aleatoria sobre su experiencia de hoy.','Responderla toma 1 min y nos ayuda a mejorar.','ensureNps','mandatory:true','ORION_CMF_NPS_V136']);
const rxAuth=read('assets/shared/clinical-prescription-auth-cmf-v139.js');
includesAll('Autorización CMF',rxAuth,['ORH-CMF-RX-','verificationCode','issuedLabel','indexedDB','appendAudit','authorize','logOutput','verifyCurrent']);
const rxShare=read('assets/shared/clinical-prescription-share-cmf-v139.js');
includesAll('Salida firmada CMF',rxShare,['navigator.share','navigator.canShare','files:[file]','WHATSAPP_PDF_DOWNLOADED','firmaimg','ORION_CMF_RX_AUTH']);
const cmfOutput=read('assets/shared/clinical-output-cmf-v134.js');
includesAll('Salida CMF',cmfOutput,['orion-actions-top','api.whatsapp.com/send?text=','whatsapp://send?text=','format:[5.5,8.5]','ORION_CMF_OUTPUT_V134']);
const cmfPreview=read('assets/shared/clinical-preview-cmf-v135.js');
includesAll('Vista previa CMF',cmfPreview,['orionClinicalTabEdit','orionClinicalTabPreview','orionClinicalEditPane','orionPrintPreviewPane','ORION_CMF_PREVIEW_V135']);
const componentRestore=read('assets/shared/clinical-components-restore.js');
includesAll('Catálogo farmacológico',componentRestore,['ACTIVO CON CONTROL CLÍNICO','invalidateConfirmation']);

const armonizacionIndex=read('modules/armonizacion/index.html');
includesAll('Armonización V2.1.0',armonizacionIndex,[
  "const VERSION='2.1.0'",'filler-engine-v170.js','caha-engine-v180.js','plla-engine-v190.js','skinbooster-engine-v200.js',
  'skinbooster-engine-v200.css','single-atlas-v1611.js'
]);
const skinbooster=read('modules/armonizacion/skinbooster-engine-v200.js');
includesAll('Motor Skinbooster',skinbooster,[
  "const VERSION='2.0.0'","isSkinMode()",'Microdepósito','Secuencia','Área','pointCount','totalVolume',
  'oaSkinRecordCard','oaSkinLayer','oaSkinSummary','ORH-AO-SKN-REG-001','ORH-AO-SKN-MAP-001','ORH-AO-SKN-TRA-001'
]);

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
includesAll('Service worker R47',serviceWorker,[
  'orion-dental-app-v1.4.5','orion-identity-system-v140.css','orion-mobile-v141.css',
  'portal-route-selector-v144r6.css','portal-aesthetic-v144r7.css','portal-armonizacion-v152.js',
  'clinical-certificate-cmf-v144r6.css','modules/armonizacion/index.html','filler-engine-v170.js',
  'caha-engine-v180.js','plla-engine-v190.js','skinbooster-engine-v200.js'
]);
if(serviceWorker.includes('maxilofacial-pro-plus-compact.svg'))failures.push('Service worker aún distribuye un logo CMF para documentos');

if(failures.length){
  console.error('\nORION V1.4.5 / Armonización V2.1.0 — VERIFICACIÓN FALLIDA');
  [...new Set(failures)].forEach(item=>console.error(`- ${item}`));
  process.exit(1);
}
console.log('ORION V1.4.5 / Armonización V2.1.0 — verificación estática aprobada');
console.log(`Módulos base: ${modules.length} | Motores de Armonización: 6 | PWA: ${manifest.display}`);
