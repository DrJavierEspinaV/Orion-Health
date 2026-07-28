import {test,expect} from '@playwright/test';

const appUrl='/apps/orion-health/index.html';
const modules=[
  ['comunicaciones','comunicaciones',/Comunicaciones/i],
  ['insumos','insumos',/538 insumos/i],
  ['cmf','cmf',/Control clínico CMF/i],
  ['endo','endodoncia',/Control clínico Endodoncia/i],
  ['orto','ortodoncia',/Ortodoncia/i],
  ['odontopediatria','odontopediatria',/Odontopediatría/i]
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
  const frame=await selectModule(page,'insumos','insumos',/538 insumos/i);
  await expect(frame.locator('#search')).toBeVisible();
  await frame.locator('#search').fill('membrana');
  await expect(frame.locator('#selector')).toContainText(/MEMBRANA/i);
});

test('Comunicaciones prioriza búsqueda, fechas y pacientes sobre la conexión Drive',async({page})=>{
  await openPortal(page);
  const frame=await selectModule(page,'comunicaciones','comunicaciones',/Comunicaciones/i);
  await expect(frame.locator('#orionPatientPriorityControls')).toBeVisible();
  await expect(frame.locator('#orionPatientPriorityControls #q')).toBeVisible();
  await expect(frame.locator('#orionPatientPriorityControls #fFechaFrom')).toBeVisible();
  await expect(frame.locator('#orionPatientPriorityControls #fFechaTo')).toBeVisible();
  await expect(frame.locator('.card.table')).toBeVisible();
  await expect(frame.locator('#orionDataSourcePanel > summary')).toBeVisible();
  await expect(frame.locator('#orionDataSourceStatus')).toBeVisible();

  const layout=await frame.locator('body').evaluate(()=>{
    const priority=document.getElementById('orionPatientPriorityControls');
    const table=document.querySelector('.crm-sidebar > .card.table');
    const data=document.getElementById('orionDataSourcePanel');
    return{
      dataCollapsed:!!data&&!data.open,
      priorityBeforeTable:!!priority&&!!table&&Boolean(priority.compareDocumentPosition(table)&Node.DOCUMENT_POSITION_FOLLOWING),
      tableBeforeData:!!table&&!!data&&Boolean(table.compareDocumentPosition(data)&Node.DOCUMENT_POSITION_FOLLOWING)
    };
  });
  expect(layout.dataCollapsed).toBeTruthy();
  expect(layout.priorityBeforeTable).toBeTruthy();
  expect(layout.tableBeforeData).toBeTruthy();
});

test('CMF y Endodoncia conservan auditoría y catálogo por fármacos',async({page})=>{
  await openPortal(page);
  let frame=await selectModule(page,'cmf','cmf',/Control clínico CMF/i);
  await expect(frame.locator('#orionClinicalConfirmCMF')).toBeVisible();
  await expect(frame.locator('#modoComp')).toBeEnabled();
  await frame.locator('#modoComp').check();
  await expect(frame.locator('#panelComponentes')).toBeVisible();
  await expect(frame.locator('#selAnalgesico')).toBeVisible();
  await expect(frame.locator('#selATB')).toBeVisible();
  await expect(frame.locator('#selCorti')).toBeVisible();
  await expect(frame.locator('#orionComponentCatalogNotice')).toBeVisible();

  frame=await selectModule(page,'endo','endodoncia',/Control clínico Endodoncia/i);
  await expect(frame.locator('#orionClinicalConfirmENDO')).toBeVisible();
  await expect(frame.locator('#modoComp')).toBeEnabled();
  await frame.locator('#modoComp').check();
  await expect(frame.locator('#panelComponentes')).toBeVisible();
  await expect(frame.locator('#selAnalgesico')).toBeVisible();
  await expect(frame.locator('#selATB')).toBeVisible();
  await expect(frame.locator('#selCorti')).toBeVisible();
  await expect(frame.locator('#orionComponentCatalogNotice')).toBeVisible();
});

test('CMF usa las tres plantillas breves auditadas V1.3.2',async({page})=>{
  await openPortal(page);
  const frame=await selectModule(page,'cmf','cmf',/Control clínico CMF/i);
  const selector=frame.locator('#tplAdulto');
  const receta=frame.locator('#receta');

  await selector.selectOption('Post_Qx1');
  await expect(receta).toHaveValue(/PARACETAMOL 1 g[\s\S]*KETOPROFENO 50 mg[\s\S]*DEXAMETASONA 8 mg/);
  await expect(receta).toHaveValue(/solo si fue indicada por el clínico/i);

  await selector.selectOption('Post_Qx2');
  await expect(receta).toHaveValue(/IBUPROFENO 400 mg[\s\S]*PARACETAMOL 500 mg[\s\S]*CLORHEXIDINA 0,12%/);

  await selector.selectOption('PRE_QX');
  await expect(receta).toHaveValue(/PARACETAMOL 1 g[\s\S]*comenzar 24 horas antes[\s\S]*KETOPROFENO 50 mg[\s\S]*DEXAMETASONA 8 mg/);
  await expect(receta).toHaveValue(/Dosis única 1 hora antes/i);
});

test('portal usa una sola página continua sin desborde horizontal',async({page})=>{
  await openPortal(page);
  await selectModule(page,'insumos','insumos',/538 insumos/i);
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
