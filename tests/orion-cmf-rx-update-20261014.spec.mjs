import { test, expect } from '@playwright/test';

const portal = '/apps/orion-health/index.html';

async function openCmf(page) {
  await page.goto(portal,{waitUntil:'domcontentloaded'});
  await page.locator('.menu-btn[data-app="cmf"]').click();
  const frame=page.frameLocator('#appFrame');
  await expect(frame.locator('#tplAdulto')).toBeVisible({timeout:30000});
  return frame;
}

for (const viewport of [{width:1440,height:900},{width:390,height:844}]) {
  test('CMF postoperatorio de adulto: 1 g c/8 h, máximo 3 g, tres opciones de corticoide ('+viewport.width+')',async({page})=>{
    await page.setViewportSize(viewport);
    const frame=await openCmf(page);
    const selector=frame.locator('#tplAdulto');
    const rx=frame.locator('#receta');
    const steroid=frame.locator('#orionPostSteroid');
    await selector.selectOption('Post_Qx1');
    await expect(frame.locator('#orionPostSteroidWrap')).toBeVisible();
    await expect(rx).toHaveValue(/PARACETAMOL 1 g[\s\S]*cada 8 horas[\s\S]*3\.000 mg\/día/);
    await expect(rx).toHaveValue(/DEXAMETASONA 8 mg[\s\S]*60–90 minutos[\s\S]*No repetir/);
    await expect(rx).not.toHaveValue(/PREDNISONA 20 mg/);
    await steroid.selectOption('prednisona');
    await expect(rx).toHaveValue(/PREDNISONA 20 mg[\s\S]*40 mg en total[\s\S]*dosis ÚNICA/);
    await expect(rx).not.toHaveValue(/DEXAMETASONA 8 mg/);
    await steroid.selectOption('ninguno');
    await expect(rx).not.toHaveValue(/DEXAMETASONA 8 mg|PREDNISONA 20 mg/);
    await expect(rx).toHaveValue(/KETOPROFENO 50 mg/);
    await selector.selectOption('Post_Qx2');
    await expect(frame.locator('#orionPostSteroidWrap')).toBeHidden();
    await expect(rx).toHaveValue(/PARACETAMOL 1 g[\s\S]*cada 8 horas/);
    await expect(rx).toHaveValue(/IBUPROFENO 400 mg/);
    await selector.selectOption('post_sin_aine');
    await expect(rx).toHaveValue(/PARACETAMOL 1 g[\s\S]*cada 8 horas/);
    await expect(rx).not.toHaveValue(/IBUPROFENO 400 mg|KETOPROFENO 50 mg/);
  });
}

test('Profilaxis cardíaca de alto riesgo: dosis única sin asociar dos antibióticos',async({page})=>{
  const frame=await openCmf(page);
  const adult=frame.locator('#tplAdulto'),rx=frame.locator('#receta');
  await adult.selectOption('profilaxis_ei_amoxicilina');
  await expect(frame.locator('#orionProphylaxisNotice')).toBeVisible();
  await expect(rx).toHaveValue(/AMOXICILINA 500 mg[\s\S]*4 cápsulas \(2 g en total\)[\s\S]*30–60 minutos/);
  await expect(rx).not.toHaveValue(/AZITROMICINA 500 mg/);
  await expect(rx).toHaveValue(/No repetir dosis después/);
  await adult.selectOption('profilaxis_ei_azitromicina');
  await expect(rx).toHaveValue(/AZITROMICINA 500 mg[\s\S]*UNA dosis[\s\S]*30–60 minutos/);
  await expect(rx).not.toHaveValue(/AMOXICILINA 500 mg/);
  await expect(rx).not.toHaveValue(/CLINDAMICINA 600 mg|CLINDAMICINA 300 mg/);
  await adult.selectOption('Post_Qx1');
  await expect(frame.locator('#orionProphylaxisNotice')).toBeHidden();
  await expect(rx).not.toHaveValue(/AMOXICILINA 500 mg|AZITROMICINA 500 mg/);
});

test('El catálogo manual de fármacos usa máximos coherentes y no introduce corticoides cada 8 h',async({page})=>{
  const frame=await openCmf(page);
  await frame.locator('#modoComp').check();
  await expect(frame.locator('#panelComponentes')).toBeVisible();
  const rx=await frame.locator('body').evaluate(()=>{
    const analg=[...document.querySelectorAll('#selAnalgesico option')].find(el=>el.textContent.includes('Paracetamol 1 g'));
    const dex=[...document.querySelectorAll('#selCorti option')].find(el=>el.textContent.includes('Dexametasona —'));
    const pred=[...document.querySelectorAll('#selCorti option')].find(el=>el.textContent.includes('Prednisona —'));
    return{analg:analg?.value||'',dex:dex?.value||'',pred:pred?.value||''};
  });
  expect(rx.analg).toMatch(/PARACETAMOL 1 g[\s\S]*cada 8 horas[\s\S]*3\.000 mg\/día/);
  expect(rx.dex).toMatch(/8 mg total[\s\S]*dosis única/);
  expect(rx.pred).toMatch(/40 mg total[\s\S]*dosis única/);
  expect(rx.dex).not.toMatch(/cada 8 hr por/);
  expect(rx.pred).not.toMatch(/cada 8 hr por/);
});

test('Indicaciones de profilaxis insertan una pauta de selección clínica sin PRE quirúrgico genérico',async({page})=>{
  const frame=await openCmf(page);
  await frame.locator('#selInd').selectOption('ind_profilaxis_ei');
  await expect(frame.locator('#insPre')).toBeHidden();
  await expect(frame.locator('#insPost')).toHaveText('Insertar indicaciones');
  await frame.locator('#insPost').click();
  await expect(frame.locator('#indicaciones')).toHaveValue(/ALTO RIESGO[\s\S]*30–60 minutos/);
  await expect(frame.locator('#indicaciones')).not.toHaveValue(/Cédula y Estudios|Ayuno/);
  const clinical=await frame.locator('body').evaluate(()=>window.ORION_CMF_CLINICAL);
  expect(clinical.adultRegimen('profilaxis_ei_amoxicilina')).toContain('AMOXICILINA 500 mg');
  expect(clinical.adultRegimen('profilaxis_ei_azitromicina')).toContain('AZITROMICINA 500 mg');
});
