const fs=require('fs'),assert=require('assert'),{chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH,args:['--no-sandbox','--disable-dev-shm-usage']});const p=await b.newPage({viewport:{width:1440,height:1000}}),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto('file://'+require('path').resolve(process.env.APP_HTML));
// Synthetic image and coordinates only; never store a clinical fixture in the repository.
await p.evaluate(()=>{const c=document.createElement('canvas');c.width=1518;c.height=1317;currentImageData=c.toDataURL();rx.setAttribute('href',currentImageData);IMG_W=1518;IMG_H=1317;VB={x:0,y:0,w:1518,h:1317};setVB();document.getElementById('pxmm').value='5';document.getElementById('age').value='14';document.getElementById('sex').value='F';document.getElementById('f1mode').value='AUTO';Object.assign(P,{M:[1100,590],Cla:[840,566],Clp:[770,565],Ara:[750,720],Cp:[710,735],Od:[648,786],Pts:[901,660],Pti:[893,768],Atl:[731,801],Na:[1148,566],Op:[160,506],Sc:[442,43],FM:[1109,594],NP:[1073,846],ENA:[1135,846],ENP:[891,825],Me:[1101,1243],Go:[752,1009],No:[819,1053],Arp:[700,699],BpR:[734,958],Occl1:[1069,982],Occl2:[956,957],U1_EDGE:[1155,1001],U1_APEX:[1093,874],L1_EDGE:[1164,1015],L1_APEX:[1104,1140],SYM_ANT:[1127,1228],SYM_POST:[1052,1172],Br:[799,67]});for(const k of A47_KEYS){use[k]='INCLUDE';stat[k]='FROZEN'}layerState.theoretical=true;layerState.cranial=true;layerState.dental=false;layerState.dentalGuides=true;safeDraw('synthetic A78')});


assert.deepEqual(errors,[]);
const state=await p.evaluate(()=>({points:JSON.stringify(P),use:JSON.stringify(use),stat:JSON.stringify(stat)}));
assert(await p.evaluate(()=>!a86FreshBatch()));
await p.evaluate(()=>{document.getElementById('printMode').value='INTERMEDIATE';a77PreparePrint()});
let text=await p.evaluate(()=>a77Sheet.textContent);for(const title of ['Estudio y landmarks','métricas actuales','Compensación desde C3','Relaciones sagitales','Estado del análisis','Diagnóstico integrado ORION','Robustez, sensibilidad'])assert(text.includes(title),title);
for(const title of ['Auditoría metodológica','REVISAR LÍNEAS Y COLORES','Referencias arquitectónicas','Construcciones y mediciones'])assert(!text.includes(title),title);
assert(text.includes('No se atribuye robustez'));
const batch=await p.evaluate(()=>{lastBatchResult=batchSensitivity(1);renderBatch(lastBatchResult);return{count:lastBatchResult.tested_landmarks.length,incomplete:lastBatchResult.incomplete_landmarks,cranial:lastBatchResult.layers.cranial.status,ranges:Object.keys(lastBatchResult.results.M.ranges),fresh:!!a86FreshBatch()}});
assert.equal(batch.count,28);assert.deepEqual(batch.incomplete,[]);assert.equal(batch.cranial,'NUMERIC_ONLY');assert(batch.ranges.includes('c12'));assert(batch.ranges.includes('c14'));assert(batch.fresh);
assert.deepEqual(await p.evaluate(()=>({points:JSON.stringify(P),use:JSON.stringify(use),stat:JSON.stringify(stat)})),state);
await p.evaluate(()=>a77PreparePrint());text=await p.evaluate(()=>a77Sheet.textContent);assert(text.includes('Ensayo vigente: ±1 mm'));
await p.pdf({path:'output/a86-intermediate-test.pdf',format:'Letter',printBackground:true,preferCSSPageSize:true});
const pages=(fs.readFileSync('output/a86-intermediate-test.pdf','latin1').match(/\/Type\s*\/Page\b/g)||[]).length;assert(pages>=5);
await p.evaluate(()=>{P.M[0]+=1;safeDraw('invalidate batch')});assert(await p.evaluate(()=>lastBatchResult===null));
await p.evaluate(()=>{lastBatchResult=batchSensitivity(1);document.getElementById('a76F1Operative').value='REAL';safeDraw('operative changed')});assert(await p.evaluate(()=>lastBatchResult===null));
assert(await p.evaluate(()=>guideExtra.Arp.definition.includes('Intersección')&&guideExtra.Cp.avoid.includes('Cp no es Arp')));
assert.deepEqual(errors,[]);console.log('A86 PASS: four profiles, intermediate exclusions, 28×8 sensitivity, preserved landmarks, stale batch invalidation, distinct Cp/Arp guidance; pages',pages);await b.close()})().catch(e=>{console.error(e);process.exit(1)});
