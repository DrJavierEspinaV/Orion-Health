// Read-only regression audit of the delivered A47 event handlers.
// Synthetic coordinates only. No browser, network or clinical fixtures.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=__dirname,target=process.argv[2]||path.join(root,'ORION_Craniofacial_Analysis_Avance47_MODULO_LIMPIO.html'),html=fs.readFileSync(target,'utf8');
const scripts=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
const source=scripts[0],ui=scripts.at(-1);
const bindings=source.slice(source.indexOf('function bindPointEvents(){'),source.indexOf('function nudge('));
const lateListener=ui.split('\n').find(line=>line.includes("svg.addEventListener('pointerdown'"));
assert(bindings);
const eventNode=()=>({handlers:{},classList:{add(){},remove(){}},addEventListener(name,fn){(this.handlers[name]??=[]).push(fn);},dispatch(name,event){for(const fn of this.handlers[name]||[])fn(event);},setPointerCapture(){},getBoundingClientRect(){return{width:1000,height:1000};}});
function setup(){
 const nodes=new Map(),node=id=>{if(!nodes.has(id))nodes.set(id,{value:'',textContent:'',classList:{remove(){},add(){}}});return nodes.get(id);};
 const svg=eventNode(),point=eventNode();point.dataset={k:'M'};
 const x={svg,pgroup:{querySelectorAll:()=>[point]},point,P:{M:[100,100]},stat:{M:'UNFROZEN'},selected:'M',placeMode:false,calMode:null,calA:null,calB:null,draggingPoint:null,panning:false,last:null,VB:{x:0,y:0,w:1000,h:1000},dirty:false,document:{getElementById:node},renderPointList(){},showGuide(){},renderCalibration(){},draw(){},setVB(){},svgPoint:e=>[e.clientX,e.clientY],a47HasImage:()=>true,constrain:(_k,p)=>p,autoVisibility(){},a47SetDirty(value){x.dirty=value;},persistLocal(){x.dirty=true;}};
 vm.createContext(x);vm.runInContext(bindings+'\n'+(lateListener||''),x);x.bindPointEvents();x.node=node;return x;
}
function pointer(x,y){return{clientX:x,clientY:y,pointerId:1,target:{closest:()=>null},preventDefault(){},stopPropagation(){this.stopped=true;}};}
const tests=[];
function test(name,body){try{body();tests.push({name,status:'passed'});}catch(error){tests.push({name,status:'failed',failure:error.message});}}
test('Placing a point after saving marks the study dirty',()=>{const x=setup();x.placeMode=true;x.svg.dispatch('pointerdown',pointer(200,300));assert.deepEqual(x.P.M,[200,300]);assert.equal(x.dirty,true,'Coordinates changed but unsaved flag remained false');});
test('Dragging an unfrozen point after saving marks the study dirty',()=>{const x=setup();const start=pointer(100,100);x.point.dispatch('pointerdown',start);assert(start.stopped);x.svg.dispatch('pointermove',pointer(250,350));assert.deepEqual(x.P.M,[250,350]);assert.equal(x.dirty,true,'Drag changed coordinates but unsaved flag remained false');});
test('Placing calibration marker A after saving marks the study dirty',()=>{const x=setup();x.calMode='A';x.svg.dispatch('pointerdown',pointer(200,300));assert.deepEqual(x.calA,[200,300]);assert.equal(x.dirty,true,'Calibration marker changed but unsaved flag remained false');});
test('Calculating a new calibration after saving marks the study dirty',()=>{const x=setup();const binding=source.split('\n').find(line=>line.includes("document.getElementById('calcCal').onclick="));assert(binding);vm.runInContext(binding,x);x.calA=[0,0];x.calB=[100,0];x.node('calMM').value='10';x.node('pxmm').value='5';x.node('calcCal').onclick();assert.equal(x.node('pxmm').value,'10.0000');assert.equal(x.dirty,true,'Calibration changed but unsaved flag remained false');});
test('Panning without clinical edits does not mark the study dirty',()=>{const x=setup();x.svg.dispatch('pointerdown',pointer(100,100));x.svg.dispatch('pointermove',pointer(200,200));assert.equal(x.dirty,false);assert.equal(x.VB.x,-100);});
test('Selecting a frozen point does not alter its coordinates',()=>{const x=setup();x.stat.M='FROZEN';x.point.dispatch('pointerdown',pointer(100,100));x.svg.dispatch('pointermove',pointer(200,300));assert.deepEqual(x.P.M,[100,100]);assert.equal(x.dirty,false);});
const result={file:path.basename(target),method:'Node event-handler harness using delivered HTML; not browser end-to-end testing',fixtures:'Synthetic only',passed:tests.filter(t=>t.status==='passed').length,failed:tests.filter(t=>t.status==='failed').length,tests};
console.log(JSON.stringify(result,null,2));
process.exitCode=result.failed?1:0;
