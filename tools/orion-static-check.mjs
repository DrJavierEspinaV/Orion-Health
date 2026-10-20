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
if(version.modules?.comunicaciones!=='5.7.17')failures.push(`Versión Comunicaciones inesperada: ${version.modules?.comunicaciones}`);
if(version.modules?.cmf!=='4.3.43')failures.push(`Versión CMF inesperada: ${version.modules?.cmf}`);
if(version.modules?.insumos!=='4.5.4')failures.push(`Versión Insumos inesperada: ${version.modules?.insumos}`);
if(!String(version.modules?.armonizacion_orofacial||'').startsWith('2.1.0'))failures.push(`Versión Armonización inesperada: ${version.modules?.armonizacion_orofacial}`);

const manifest=JSON.parse(read('manifest.webmanifest'));
if(manifest.start_url!=='./index.html')failures.push('start_url PWA incorrecta');
if(manifest.scope!=='./')failures.push('scope PWA incorrecto');
if(manifest.display!=='standalone')failures.push('display PWA debe ser standalone');

// ORION UX V2 · contrato visual opt-in, seguridad de impresión y siete módulos.
const uxVersion=String(version.ux_version||'');
if(uxVersion!=='2.0.2')failures.push('UX V2 debe constar en VERSION.json.');
if(!/siete módulos/i.test(manifest.description||''))failures.push('El manifiesto PWA debe declarar siete módulos.');

for(const path of [
  'assets/shared/health-os-design-tokens-v2.css',
  'assets/shared/health-os-ui-components-v2.css',
  'assets/shared/portal-ux-v2.css',
  'assets/shared/health-os-ux-modules-v2.css'
]) {
  const css=read(path);
  if(!css.includes('@media screen')&&path!=='assets/shared/health-os-design-tokens-v2.css')
    failures.push('UX V2: reglas de interfaz sin ámbito de pantalla en '+path);
  if(/@media\\s+print/i.test(css))failures.push('UX V2 no debe intervenir impresión: '+path);
}
const uxTokens=read('assets/shared/health-os-design-tokens-v2.css');
includesAll('Tokens canónicos UX V2',uxTokens,[
  '--orion-ui-primary: #1F3F5B',
  '--orion-ui-accent: #8C8C8C',
  '--orion-ui-bg: #F3F3F3',
  '--orion-ui-success: #12805C'
]);
for(const path of [
  'modules/comunicaciones/loader.js','modules/cmf/loader.js',
  'modules/insumos/loader.js','modules/endodoncia/loader.js',
  'modules/ortodoncia/loader.js','modules/odontopediatria/loader.js',
  'modules/armonizacion/index.html'
]){
  const source=read(path);
  for(const asset of ['health-os-design-tokens-v2.css','health-os-ui-components-v2.css','health-os-ux-modules-v2.css'])
    if(!source.includes(asset))failures.push('UX V2: falta '+asset+' en '+path);
  if(!source.includes('orion-ux-v2'))failures.push('UX V2: módulo sin opt-in '+path);
}
includesAll('UX V2: accesibilidad por módulo',read('assets/shared/health-os-ux-modules-v2.css'),[
  'UX-04 a UX-09',
  '#orionPatientPriorityControls',
  '#orionClinicalEditPane',
  '#orionPrintPreviewPane',
  '#tabla tbody tr:hover',
  '#filtrosCard',
  '.oa-record-panel:focus-within'
]);
const portalHtml=read('index.html');
if(!read('index.html').includes('id="moduleLoadStatus"'))
  failures.push('UX V2: debe existir una indicación de carga accesible en la navegación.');
if(read('index.html').includes('portal-aesthetic-v144r7.css')||read('service-worker.js').includes('portal-aesthetic-v144r7.css'))
  failures.push('UX V2: puente CSS antiguo sombreado no debe continuar cargándose.');
const stageNavigation=read('script-1.js');
includesAll('UX V2: estado de carga del módulo',stageNavigation,[
  'setModuleLoading(true)',
  'setModuleLoading(false)',
  'appFrame.title = app.title',
  'appFrame?.setAttribute("aria-busy"'
]);

const portal=read('script-1.js');
for(const moduleName of modules)if(!portal.includes(`./modules/${moduleName}/index.html`))failures.push(`Portal no referencia ${moduleName}`);
includesAll('Portal ORION',portalHtml,['orion-identity-system-v140.css','orion-mobile-v141.css','orion-portal','script-1.js','portal-armonizacion-v152.js']);

// Puente visual temporal hacia ORION Health OS (sin alterar los motores clínicos).
const portalOsCss=read('assets/shared/portal-health-os-bridge-v1.css');
includesAll('Puente visual Health OS',portalOsCss,[
  'body.orion-portal.route-selector-mode',
  'grid-template-columns: repeat(4, minmax(0,1fr))',
  '.menu-btn.portal-external-link',
  '@media (max-width: 640px)'
]);
includesAll('Portal Health OS',portalHtml,[
  'portal-health-os-bridge-v1.css',
  'portal-os-intro',
  'portal-external-link'
]);
const moduleAccesses=portalHtml.match(/data-app="/g)||[];
if(moduleAccesses.length!==7)failures.push('Portal debe conservar sus siete rutas clínicas');
if(!portal.includes('document.querySelectorAll(".menu-btn[data-app]")'))failures.push('Portal debe excluir enlaces externos de sus controladores de módulo');

const identity=read('assets/shared/orion-identity-system-v140.css');
includesAll('Sistema visual ORION',identity,[
  '--orion-blue:#1F3F5B','--orion-gray:#8C8C8C','--orion-white:#FFFFFF','--orion-surface:#F3F3F3',
  "--orion-font:'Montserrat'",'min-width:160px','background-image:none!important',"@import url('https://fonts.googleapis.com/css2?family=Montserrat"
]);

// Etapa 2 de unificación visual con ORION Health OS: Comunicaciones.
// Comunicaciones V5.7.9: abrir el módulo sin modal obligatorio; Drive conserva autorización.
const secureSession=read('assets/shared/session-config.js');
includesAll('Comunicaciones acceso opcional',secureSession,[
  'sessionStorage',
  "if(!token){",
  'openModal()',
  'orionDriveReconnect',
  'Sin conexión a Drive. La agenda requiere sesión autorizada.',
  'Acceso a Drive cerrado. El módulo sigue disponible'
]);
if(secureSession.includes('setTimeout(()=>openModal(),250)'))
  failures.push('Comunicaciones no debe mostrar modal de clave al iniciar sin sesión.');
if(!read('modules/comunicaciones/loader.js').includes('session-config.js?v=5.7.17'))
  failures.push('Comunicaciones debe cargar versión actualizada de acceso opcional.');
if(!read('modules/comunicaciones/loader.js').includes('communications-priority-layout.js?v=5.7.17'))
  failures.push('Comunicaciones debe actualizar su controlador responsive.');
if(read('assets/shared/communications-priority-layout.js').includes('dataPanel.open=false'))
  failures.push('El panel de conexión no debe cerrarse automáticamente en resize móvil.');
const communicationsOsCss=read('modules/comunicaciones/health-os-comunicaciones-v1.css');
includesAll('Comunicaciones Health OS Bridge',communicationsOsCss,[
  '--comm-os-primary: #1F3F5B',
  '--comm-os-bg: #F3F3F3',
  '#orionPatientPriorityControls',
  '#orionHdr',
  '#mensajeTipo',
  '#orionDataSourcePanel',
  '@media screen and (max-width: 760px)'
]);
const communicationsLoaderVisual=read('modules/comunicaciones/loader.js');
if(!communicationsLoaderVisual.includes('health-os-comunicaciones-v1.css?v=1'))
  failures.push('El loader de Comunicaciones no aplica el CSS Health OS.');
const osPwa=read('service-worker.js');
includesAll('PWA Health OS',osPwa,[
  'orion-dental-app-v1.4.5-health-os-ui19-comms-sap-manual',
  './modules/comunicaciones/health-os-comunicaciones-v1.css'
]);

// Etapa 3: CMF Health OS Bridge. La impresión Statement queda intacta.
const cmfOsCss=read('modules/cmf/health-os-cmf-v1.css');
includesAll('CMF Health OS Bridge',cmfOsCss,[
  '--cmf-os-primary: #1F3F5B',
  '--cmf-os-bg: #F3F3F3',
  'body #orionClinicalEditPane',
  'body #orionClinicalTabs',
  'body .orion-actions-top.no-print',
  '@media screen and (max-width: 640px)'
]);
if(!cmfOsCss.startsWith('/*') || !cmfOsCss.includes('@media screen {'))
  failures.push('CMF Health OS debe funcionar exclusivamente en pantalla.');
if(/@media\\s+print|#printSheet|#printDoc|#printInter|fixedFoot/.test(cmfOsCss.split('*/').slice(1).join('*/')))
  failures.push('CMF Health OS no puede modificar el aspecto de documentos imprimibles.');
if(!read('modules/cmf/loader.js').includes('health-os-cmf-v1.css?v=1'))
  failures.push('CMF loader no incorpora la nueva capa visual.');
if(!osPwa.includes('./modules/cmf/health-os-cmf-v1.css'))
  failures.push('PWA no conserva la hoja visual CMF en el caché.');

// Etapa 4: resto de los módulos y librería visual compartida.
const commonHealthOs=read('assets/shared/health-os-messaging-v1.css');
const insumosHealthOs=read('modules/insumos/health-os-insumos-v1.css');
const endoHealthOs=read('modules/endodoncia/health-os-endodoncia-v1.css');
const armonizacionHealthOs=read('modules/armonizacion/health-os-armonizacion-v1.css');
for(const [name,css] of [['Mensajería',commonHealthOs],['Insumos',insumosHealthOs],['Endodoncia',endoHealthOs],['Armonización',armonizacionHealthOs]]){
  includesAll('Health OS '+name,css,['@media screen','#1F3F5B','#F3F3F3']);
  if(/@media\s+print\b/.test(css))failures.push('El CSS Health OS de '+name+' contiene reglas de impresión.');
}
const stylesRequired=[
  ['modules/insumos/loader.js','health-os-insumos-v1.css?v=1'],
  ['modules/endodoncia/loader.js','health-os-endodoncia-v1.css?v=1'],
  ['modules/ortodoncia/loader.js','health-os-messaging-v1.css?v=1'],
  ['modules/odontopediatria/loader.js','health-os-messaging-v1.css?v=1'],
  ['modules/armonizacion/index.html','health-os-armonizacion-v1.css']
];
for(const [file,ref] of stylesRequired)if(!read(file).includes(ref))failures.push(file+' no carga '+ref);
for(const ref of [
  './assets/shared/health-os-messaging-v1.css',
  './modules/insumos/health-os-insumos-v1.css',
  './modules/endodoncia/health-os-endodoncia-v1.css',
  './modules/armonizacion/health-os-armonizacion-v1.css'
])if(!osPwa.includes(ref))failures.push('PWA: recurso visual ausente '+ref);

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
includesAll('CMF 4.3.42: dosis y profilaxis',cmfTemplates,[
  'PARACETAMOL 1 g',
  'Máximo de esta pauta: 3.000 mg/día',
  'postSteroids=Object.freeze',
  'adultRegimen',
  'profilaxis_ei_amoxicilina',
  'profilaxis_ei_azitromicina',
  'ind_profilaxis_ei'
]);
includesAll('CMF 4.3.42: UI',cmfSource,[
  'orionPostSteroid',
  'orionProphylaxisNotice',
  'profilaxis_ei_amoxicilina',
  'profilaxis_ei_azitromicina'
]);
if(/Post_Qx1: `PARACETAMOL 500 mg/.test(cmfTemplates))failures.push('CMF aún contiene paracetamol 500 mg en Post_Qx1');
includesAll('CMF 4.3.43: indicaciones de alveolitis',cmfTemplates,[
  'ind_alveolitis_seca',
  'ind_alveolitis_humeda',
  'ALVEOLITIS SECA',
  'ALVEOLITIS HÚMEDA O SUPURATIVA',
  'NO iniciar antibióticos por cuenta propia',
  'no requiere antibióticos de rutina'
]);
includesAll('CMF 4.3.43: dropdown y lógica de cuidados directos',cmfSource,[
  '<option value="ind_alveolitis_seca">',
  '<option value="ind_alveolitis_humeda">',
  "'ind_alveolitis_seca','ind_alveolitis_humeda'",
  'cmf-clinical-v145.js?v=1.4.5-rx3'
]);


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
  'portal-route-selector-v144r6.css','portal-ux-v2.css','portal-armonizacion-v152.js',
  'clinical-certificate-cmf-v144r6.css','modules/armonizacion/index.html','filler-engine-v170.js',
  'caha-engine-v180.js','plla-engine-v190.js','skinbooster-engine-v200.js'
]);
includesAll('PWA UX V2',serviceWorker,[
  'health-os-design-tokens-v2.css',
  'health-os-ui-components-v2.css',
  'portal-ux-v2.css',
  'health-os-ux-modules-v2.css'
]);
includesAll('PWA restauración de estilos',serviceWorker,[
  'ESSENTIAL_SHELL',
  'portal-route-selector-v144r6.css',
  'portal-health-os-bridge-v1.css',
  'cacheShell().then(()=>self.skipWaiting())',
  'ignoreSearch:true',
  'await cache.put(request,response.clone())',
  'precarga esencial incompleta'
]);
if(serviceWorker.includes('maxilofacial-pro-plus-compact.svg'))failures.push('Service worker aún distribuye un logo CMF para documentos');

if(failures.length){
  console.error('\nORION V1.4.5 / Armonización V2.1.0 — VERIFICACIÓN FALLIDA');
  [...new Set(failures)].forEach(item=>console.error(`- ${item}`));
  process.exit(1);
}
console.log('ORION V1.4.5 / Armonización V2.1.0 — verificación estática aprobada');
console.log(`Módulos base: ${modules.length} | Motores de Armonización: 6 | PWA: ${manifest.display}`);
