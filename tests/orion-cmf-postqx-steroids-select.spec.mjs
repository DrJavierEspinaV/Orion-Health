import {test,expect} from '@playwright/test';

test('CMF: dexametasona PREQX y extensión opcional cada 12 h',async({page})=>{
  await page.goto('/apps/orion-health/index.html',{waitUntil:'domcontentloaded'});
  await page.locator('.menu-btn[data-app="cmf"]').click();
  const frame=page.frameLocator('#appFrame');
  const tpl=frame.locator('#tplAdulto'), select=frame.locator('#orionPostSteroid'), rx=frame.locator('#receta');
  await expect(tpl).toBeVisible({timeout:30000});
  await tpl.selectOption('Post_Qx1');
  await expect(select).toHaveValue('dexametasona');
  await expect(rx).toHaveValue(/DEXAMETASONA 8 mg[\s\S]*dosis ÚNICA PREQUIRÚRGICA/);
  await expect(rx).not.toHaveValue(/EXTENSIÓN POSTQUIRÚRGICA/);

  page.once('dialog',d=>d.dismiss());
  await select.selectOption('dexametasona_ext24');
  await expect(select).toHaveValue('dexametasona');

  page.once('dialog',d=>d.accept());
  await select.selectOption('dexametasona_ext24');
  await expect(rx).toHaveValue(/DEXAMETASONA 8 mg[\s\S]*DEXAMETASONA 4 mg[\s\S]*cada 12 horas durante 24 horas/);
  await expect(rx).not.toHaveValue(/PREDNISONA/);

  page.once('dialog',d=>d.accept());
  await select.selectOption('dexametasona_ext48');
  await expect(rx).toHaveValue(/cada 12 horas durante 48 horas/);
  await select.selectOption('ninguno');
  await expect(rx).not.toHaveValue(/DEXAMETASONA 8 mg|EXTENSIÓN POSTQUIRÚRGICA/);
});