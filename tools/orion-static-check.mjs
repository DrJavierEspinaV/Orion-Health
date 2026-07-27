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

const version=JSON.parse(read('VERSION.json'));
if(!String(version.version).startsWith('1.3.0'))failures.push(`Versión inesperada: ${version.version}`);

const manifest=JSON.parse(read('manifest.webmanifest'));
if(manifest.start_url!=='./index.html')failures.push('start_url PWA incorrecta');
if(manifest.scope!=='./')failures.push('scope PWA incorrecto');
if(manifest.display!=='standalone')failures.push('display PWA debe ser standalone');

const portal=read('script-1.js');
for(const moduleName of modules){
  if(!portal.includes(`./modules/${moduleName}/index.html`))failures.push(`Portal no referencia ${moduleName}`);
}

const cmfLoader=read('modules/cmf/loader.js');
const endoLoader=read('modules/endodoncia/loader.js');
if(!cmfLoader.includes('clinical-audit-cmf.js'))failures.push('CMF no carga auditoría clínica');
if(!endoLoader.includes('clinical-audit-endo.js'))failures.push('Endodoncia no carga auditoría clínica');

const sessionConfig=read('assets/shared/session-config.js');
if(/extractTokenFromHash|HASH_KEYS|orion-token|location\.hash/i.test(sessionConfig))failures.push('La conexión Drive aún admite credenciales por URL/hash');
if(!sessionConfig.includes('sessionStorage'))failures.push('La credencial no está limitada a sessionStorage');

const cmfAudit=read('assets/shared/clinical-audit-cmf.js');
const endoAudit=read('assets/shared/clinical-audit-endo.js');
for(const [name,text] of [['CMF',cmfAudit],['Endodoncia',endoAudit]]){
  if(!text.includes('Confirmo que revisé'))failures.push(`${name} no exige confirmación profesional`);
  if(!text.includes('C. difficile'))failures.push(`${name} no registra cautela de clindamicina`);
}
if(/MELOXICAM 15 mg[\s\S]{0,80}cada 12/i.test(cmfAudit))failures.push('Pauta insegura de meloxicam en auditoría CMF');

const source=read('modules/comunicaciones/source.html');
const inputToken=source.match(/<input\b[^>]*\bid=["']dbToken["'][^>]*>/i)?.[0]||'';
const value=inputToken.match(/\bvalue=["']([^"']*)["']/i)?.[1]||'';
if(value.trim())failures.push('Comunicaciones conserva una credencial predeterminada en HTML');

const catalogMeta=JSON.parse(read('data/catalogo-insumos.json'));
if(catalogMeta.encoding!=='gzip+base64'||!catalogMeta.data)failures.push('Catálogo de Insumos no tiene formato esperado');
else{
  const decoded=JSON.parse(zlib.gunzipSync(Buffer.from(catalogMeta.data,'base64')).toString('utf8'));
  if(!Array.isArray(decoded.items)||decoded.items.length!==538)failures.push(`Catálogo integrado: ${decoded.items?.length??0} registros; se esperaban 538`);
}

const serviceWorker=read('service-worker.js');
if(!serviceWorker.includes('orion-dental-app-v1.3.0'))failures.push('Service worker no usa caché V1.3.0');

const signatureMatches=[];
for(const candidate of fs.readdirSync(root,{recursive:true})){
  const relative=String(candidate);
  if(/firma_tinta|firmaimg/i.test(relative))signatureMatches.push(relative);
}
if(signatureMatches.length)failures.push(`Firma manuscrita publicada: ${signatureMatches.join(', ')}`);

if(failures.length){
  console.error('\nORION V1.3 — VERIFICACIÓN FALLIDA');
  failures.forEach(item=>console.error(`- ${item}`));
  process.exit(1);
}
console.log('ORION V1.3 — verificación estática aprobada');
console.log(`Módulos: ${modules.length} | Catálogo: 538 | PWA: ${manifest.display}`);
