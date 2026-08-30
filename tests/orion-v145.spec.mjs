import {test,expect} from '@playwright/test';

async function open(page,key){
  await page.goto('/apps/orion-health/index.html');
  await page.locator(`.menu-btn[data-app="${key}"]`).click();
  const frame=page.frameLocator('#appFrame');
  await expect(frame.locator(key==='cmf'?'#tplAdulto':'#showFilter')).toBeVisible();
  return frame;
}

test('Excel y Drive conservan estados distintos y filtros sin convertir Citado en Ausente',async({page})=>{
  await page.route('**/modules/comunicaciones/source.html',async route=>{
    const response=await route.fetch();
    const body=(await response.text()).replace('}); // DOMContentLoaded',`window.__statusTest={prepRow,prepRowFromDb_,statusPill,load(rows){DATA=rows; poblarEstadosUnicos(); document.getElementById('fFechaFrom').value='';document.getElementById('fFechaTo').value='';render();}};
}); // DOMContentLoaded`);
    await route.fulfill({response,body});
  });
  const frame=await open(page,'comunicaciones');
  const state=await frame.locator('body').evaluate(()=>{
    const {prepRow,prepRowFromDb_,statusPill,load}=window.__statusTest;
    const rows=[{' Texto status consulta ':'Citado'},{ESTADO:'Atendido'},{Status:'Ausente'},{Estado:'No asistió'},{STATUS:'',Estado:'Cancelado'},{estado:'<b>Confirmado</b>'},{}];
    const excel=rows.map(r=>prepRow(r).estado);
    const db=rows.map(r=>prepRowFromDb_(r).estado);
    load(rows.map((r,i)=>prepRow({...r,Paciente:`Paciente prueba ${i}`,Fecha:'2026-08-30',Hora:'09:00'})));
    return {excel,db,pills:[...document.querySelectorAll('#list .pill')].map(x=>x.textContent),html:statusPill('<b>Confirmado</b>')};
  });
  expect(state.excel).toEqual(['Citado','Atendido','Ausente','No asistió','Cancelado','<b>Confirmado</b>','']);
  expect(state.db).toEqual(state.excel);
  expect(state.pills).toContain('Citado');expect(state.pills).toContain('Atendido');expect(state.pills).toContain('Sin estado');
  expect(state.html).toContain('&lt;b&gt;');
  await frame.locator('#showFilter').selectOption('Citado');
  await expect(frame.locator('#list .row')).toHaveCount(1);
  await expect(frame.locator('#list .pill')).toHaveText('Citado');
});

test('Generar interconsulta permanece junto a Cerrar al escribir y desplazar',async({page})=>{
  const frame=await open(page,'cmf');
  await frame.locator('#btnDocInter').click();
  await frame.locator('#interTextoLibre').fill('Dolor orofacial persistente. Solicito evaluación especializada.\n'.repeat(18));
  await frame.locator('#interDrawer>.space-y-3').evaluate(el=>el.scrollTop=el.scrollHeight);
  const metrics=await frame.locator('#btnInterGenerate').evaluate(button=>{
    const b=button.getBoundingClientRect(),c=document.getElementById('btnInterClose').getBoundingClientRect();
    return {sameParent:button.parentElement===document.getElementById('btnInterClose').parentElement,top:b.top,bottom:b.bottom,height:innerHeight,right:b.right,width:innerWidth,closeTop:c.top};
  });
  const frameRect=await page.locator('#appFrame').boundingBox();
  const visibleHeight=await page.evaluate(()=>window.visualViewport?.height||innerHeight);
  expect(metrics.top+frameRect.y).toBeGreaterThanOrEqual(-2);
  expect(metrics.bottom+frameRect.y).toBeLessThanOrEqual(visibleHeight+2);
  expect(metrics.sameParent).toBeTruthy();expect(metrics.top).toBeGreaterThanOrEqual(0);
  expect(metrics.bottom).toBeLessThanOrEqual(metrics.height);expect(metrics.right).toBeLessThanOrEqual(metrics.width);
  expect(Math.abs(metrics.top-metrics.closeTop)).toBeLessThan(12);
  await frame.locator('#btnInterGenerate').click();
  await expect(frame.locator('#v_inter_text')).toContainText('Dolor orofacial persistente');
});

test('Pediatría requiere concentración, recalcula y no acumula dosis antiguas',async({page})=>{
  const frame=await open(page,'cmf');
  await frame.locator('#p_edad').fill('8');await frame.locator('#p_peso').fill('20');
  await frame.locator('#tplPedia').selectOption('pedia_postqx');
  await expect(frame.locator('#pediaStatus')).toHaveAttribute('data-error','true');
  await expect(frame.locator('#receta')).not.toHaveValue(/mg\) por vía oral/);
  await frame.locator('#pediaApap').selectOption('120');await frame.locator('#pediaIbu').selectOption('100');
  await expect(frame.locator('#receta')).toHaveValue(/12,5 ml \(300 mg\)[\s\S]*10 ml \(200 mg\)/);
  await frame.locator('#pediaIbu').selectOption('200');
  await expect(frame.locator('#receta')).toHaveValue(/5 ml \(200 mg\)/);
  await frame.locator('#p_peso').fill('10');
  await expect(frame.locator('#receta')).toHaveValue(/2,5 ml \(100 mg\)/);
  await frame.locator('#p_edad').fill('0.4');
  await expect(frame.locator('#pediaStatus')).toContainText('menores de 6 meses');
  await expect(frame.locator('#receta')).not.toHaveValue(/IBUPROFENO/);
  await frame.locator('#tplAdulto').selectOption('post_sin_aine');
  await expect(frame.locator('#pediaSettings')).toBeHidden();
  await expect(frame.locator('#orionClinicalAuditCMF')).toHaveCount(0);
});

test('Pautas e indicaciones nuevas se insertan sin instrucciones preoperatorias para TTM',async({page})=>{
  const frame=await open(page,'cmf');
  await frame.locator('#tplAdulto').selectOption('Post_Qx1');
  await expect(frame.locator('#receta')).toHaveValue(/PARACETAMOL 500 mg[\s\S]*cada 6 horas[\s\S]*48 horas[\s\S]*KETOPROFENO 50 mg/);
  await frame.locator('#tplAdulto').selectOption('ttm_relajante');
  await expect(frame.locator('#receta')).toHaveValue(/CICLOBENZAPRINA 5 mg[\s\S]*no conducir[\s\S]*IMAO/);
  await frame.locator('#selInd').selectOption('ind_ttm');
  await expect(frame.locator('#insPre')).toBeHidden();await frame.locator('#insPost').click();
  await expect(frame.locator('#indicaciones')).toHaveValue(/reposo mandibular|Reposo mandibular/);
  await expect(frame.locator('#indicaciones')).not.toHaveValue(/Cédula|Ayuno/);
  await frame.locator('#indicaciones').fill('');await frame.locator('#selInd').selectOption('ind_tm');await frame.locator('#insPost').click();
  await expect(frame.locator('#indicaciones')).toHaveValue(/alveolitis[\s\S]*control anticipado el mismo día/);
});


test('CMF conserva firma, folio y trazabilidad sin la casilla suspendida',async({page})=>{
  const frame=await open(page,'cmf');
  await frame.locator('#p_nombre').fill('Paciente de prueba');
  await frame.locator('#p_rut').fill('11.111.111-1');
  await frame.locator('#receta').fill('Receta de prueba, no válida para uso clínico.');
  const result=await frame.locator('body').evaluate(async()=>{
    const record=await window.ORION_CMF_RX_AUTH.authorize('TEST');
    return {record,signature:document.querySelector('#printSheet .firmaimg')?.getAttribute('src'),gate:!!document.getElementById('orionClinicalConfirmCMF')};
  });
  expect(result.gate).toBeFalsy();expect(result.record.folio).toMatch(/^ORH-CMF-RX-/);
  expect(result.record.contentHash).toMatch(/^[a-f0-9]{64}$/);expect(result.signature).toContain('firma-javier-espina-navy.svg');
  await frame.locator('#receta').fill('Texto corregido.');
  expect(await frame.locator('body').evaluate(()=>window.ORION_CMF_RX_AUTH.current())).toBeNull();
});
