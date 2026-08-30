import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const context=vm.createContext({});
for(const file of ['cmf-clinical-v145.js','appointment-status.js'])vm.runInContext(fs.readFileSync(`apps/orion-health/assets/shared/${file}`,'utf8'),context);
const {pediatric}=context.ORION_CMF_CLINICAL;
test('Cálculo pediátrico: concentraciones, unidades y límites en todos los pesos',()=>{
  for(const kg of [2,5,10,19.7,20,40,50,80,150])for(const apap of [120,160,250])for(const ibu of [100,200]){
    const result=pediatric('pedia_postqx',{kg,age:8,apap,ibu});assert.equal(result.error,undefined);
    for(const d of result.doses){
      const cap=d.drug==='apap'?Math.min(60*kg,3000):Math.min(30*kg,1200);
      assert.ok(d.dailyMg<=cap+1e-8);assert.ok(d.mg<=(d.drug==='apap'?750:400));
      assert.ok(Math.abs(d.mg-d.ml*d.concentration/5)<1e-8);
    }
  }
  const r=pediatric('pedia_postqx',{kg:20,age:8,apap:120,ibu:200});
  assert.equal(r.doses[0].ml,12.5);assert.equal(r.doses[0].mg,300);assert.equal(r.doses[1].ml,5);assert.equal(r.doses[1].mg,200);
});
test('No calcular con datos ausentes, concentración incorrecta o lactante menor de 6 meses para ibuprofeno',()=>{
  for(const input of [{kg:0,age:8},{kg:20,age:''},{kg:'abc',age:8},{kg:20,age:8,apap:''},{kg:20,age:8,apap:100},{kg:20,age:18,apap:120}])assert.ok(pediatric('pedia_dolor',input).error);
  assert.ok(pediatric('pedia_ibu',{kg:7,age:0.49,ibu:100}).error);
  assert.equal(pediatric('pedia_ibu',{kg:7,age:0.5,ibu:100}).error,undefined);
});
test('Amoxicilina conserva dosis máxima y equivalencia al cambiar concentración',()=>{
  for(const kg of [5,20,40,100])for(const amoxi of [250,400,500]){
    const r=pediatric('pedia_amoxi',{kg,age:8,amoxi});assert.equal(r.error,undefined);
    const d=r.doses[0];assert.ok(d.mg<=875);assert.ok(d.dailyMg<=45*kg+1e-8);assert.equal(d.interval,12);
  }
});
test('Estados: encabezados variables, campos vacíos, desconocidos y negaciones',()=>{
  const {fromRow,category}=context.ORION_APPOINTMENT_STATUS;
  assert.equal(fromRow({'  TEXTO STATUS CONSULTA  ':' Citado '}),'Citado');
  assert.equal(fromRow({STATUS:'',ESTADO:'Atendido'}),'Atendido');
  assert.equal(fromRow({Estado:'En atención'}),'En atención');assert.equal(fromRow({}),'');
  assert.equal(category('Citado'),'info');assert.equal(category('No confirmado'),'info');assert.equal(category('No asistió'),'ausente');assert.equal(category('Atendido'),'ok');
});
test('Todos los scripts activos de CMF y Comunicaciones tienen sintaxis válida',()=>{
  for(const module of ['cmf','comunicaciones']){
    const html=fs.readFileSync(`apps/orion-health/modules/${module}/source.html`,'utf8');
    for(const match of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi))if(match[1].trim())new vm.Script(match[1]);
  }
});
