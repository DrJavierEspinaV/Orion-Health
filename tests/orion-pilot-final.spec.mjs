import {test,expect} from '@playwright/test';

const appUrl='/apps/orion-health/index.html';
const modules=[
  ['comunicaciones','comunicaciones','Comunicaciones'],
  ['insumos','insumos','538 insumos'],
  ['cmf','cmf','Control clínico CMF'],
  ['endo','endodoncia','Control clínico Endodoncia'],
  ['orto','ortodoncia','Ortodoncia'],
  ['odontopediatria','odontopediatria','Odontopediatría']
];

async function openPortal(page){
  await page.goto(appUrl,{waitUntil:'domcontentloaded'});
  await expect(page.locator('h1')).toContainText('ORION Dental App');
  await expect(page.locator('#appFrame')).toBeVisible();
}

async function selectModule(page,key,pathName,expected){
  await page.locator(`.menu-btn[data-app="${key}"]`).click();
  await expect(page.locator('#appFrame')).toHaveAttribute('src',new RegExp(`modules/${pathName}/index\\.html`));
  await page.waitForFunction(expectedPath=>{
    const frame=document.getElementById('appFrame');
    try{return !!frame?.contentWindow?.location?.pathname?.includes(expectedPath);}catch(_){return false;}
  },`/modules/${pathName}/`,{timeout:30000});
  const frame=page.frameLocator('#appFrame');
  await expect(frame.locator('body')).not.toBeEmpty();
  await expect(frame.locator('body')).toContainText(expected,{timeout:30000});
  return frame;
}

test('portal carga y navega los seis módulos',async({page})=>{
  await openPortal(page);
  for(const [key,pathName,expected] of modules)await selectModule(page,key,pathName,expected);
});

test('Insumos abre con catálogo persistente y sin importar Excel',async({page})=>{
  await openPortal(page);
  const frame=await selectModule(page,'insumos','insumos','538 insumos');
  await expect(frame.locator('#search')).toBeVisible();
  await frame.locator('#search').fill('membrana');
  await expect(frame.locator('#selector')).toContainText(/MEMBRANA/i);
});

test('CMF y Endodoncia exigen confirmación clínica',async({page})=>{
  await openPortal(page);
  let frame=await selectModule(page,'cmf','cmf','Control clínico CMF');
  await expect(frame.locator('#orionClinicalConfirmCMF')).toBeVisible();
  await expect(frame.locator('#modoComp')).toBeDisabled();

  frame=await selectModule(page,'endo','endodoncia','Control clínico Endodoncia');
  await expect(frame.locator('#orionClinicalConfirmENDO')).toBeVisible();
  await expect(frame.locator('#modoComp')).toBeDisabled();
});

test('portal usa una sola página continua sin desborde horizontal',async({page})=>{
  await openPortal(page);
  await selectModule(page,'insumos','insumos','538 insumos');
  await page.waitForTimeout(1000);
  const metrics=await page.evaluate(()=>({
    bodyScrollWidth:document.body.scrollWidth,
    viewport:document.documentElement.clientWidth,
    frameHeight:document.getElementById('appFrame')?.getBoundingClientRect().height||0,
    frameScroll:document.getElementById('appFrame')?.getAttribute('scrolling')
  }));
  expect(metrics.bodyScrollWidth).toBeLessThanOrEqual(metrics.viewport+3);
  expect(metrics.frameHeight).toBeGreaterThan(metrics.viewport<=640?600:700);
  expect(metrics.frameScroll).toBe('no');
});

test('PWA publica manifiesto, service worker e iconos',async({request})=>{
  for(const resource of [
    '/apps/orion-health/manifest.webmanifest',
    '/apps/orion-health/service-worker.js',
    '/apps/orion-health/assets/icons/icon-192.png',
    '/apps/orion-health/assets/icons/icon-512.png'
  ]){
    const response=await request.get(resource);
    expect(response.ok(),resource).toBeTruthy();
  }
  const manifest=await (await request.get('/apps/orion-health/manifest.webmanifest')).json();
  expect(manifest.display).toBe('standalone');
  expect(manifest.scope).toBe('./');
});
