import {test,expect} from '@playwright/test';

test('CMF selector Postquirúrgico 1 conserva exclusividad y validación',async({page})=>{
  await page.goto('/apps/orion-health/index.html',{waitUntil:'domcontentloaded'});
  await page.locator('.menu-btn[data-app="cmf"]').click();
  const frame=page.frameLocator('#appFrame');
  const tpl=frame.locator('#tplAdulto');
  const select=frame.locator('#orionPostSteroid');
  const rx=frame.locator('#receta');
  await expect(tpl).toBeVisible({timeout:30000});
  await tpl.selectOption('Post_Qx1');
  await expect(rx).toHaveValue(/DEXAMETASONA 8 mg/);

  page.once('dialog',d=>d.dismiss());
  await select.selectOption('dexametasona_postqx');
  await expect(select).toHaveValue('dexametasona');

  page.once('dialog',d=>d.accept());
  await select.selectOption('dexametasona_postqx');
  await expect(rx).toHaveValue(/DEXAMETASONA 4 mg[\s\S]*cada 6 horas durante 3 días[\s\S]*16 mg\/día/);
  await expect(rx).not.toHaveValue(/PREDNISONA 5 mg/);

  page.once('dialog',d=>d.accept());
  await select.selectOption('prednisona_postqx');
  await expect(rx).toHaveValue(/PREDNISONA 5 mg[\s\S]*cada 6 horas durante 3 días[\s\S]*20 mg\/día/);
  await expect(rx).not.toHaveValue(/DEXAMETASONA 4 mg/);

  await select.selectOption('ninguno');
  await expect(rx).not.toHaveValue(/DEXAMETASONA 4 mg|PREDNISONA 5 mg|DEXAMETASONA 8 mg/);
});