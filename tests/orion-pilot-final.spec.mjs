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

test('CMF mantiene el NPS una sola vez en plantillas y recetas manuales',async({page})=>{
  await openPortal(page);
  const frame=await selectModule(page,'cmf','cmf',/Control clínico CMF/i);
  const selector=frame.locator('#tplAdulto');
  const receta=frame.locator('#receta');
  const nps=/Encuesta de satisfacción \(NPS\): Puede recibir una encuesta aleatoria sobre su experiencia de hoy\./;

  for(const option of ['Post_Qx1','Post_Qx2','PRE_QX']){
    await selector.selectOption(option);
    await expect(receta).toHaveValue(nps);
    const count=await receta.evaluate(el=>(el.value.match(/Encuesta de satisfacción \(NPS\):/g)||[]).length);
    expect(count).toBe(1);
  }

  await receta.fill('PARACETAMOL 1 g\n1 comprimido cada 8 horas.');
  await receta.blur();
  await expect(receta).toHaveValue(nps);
  const manualCount=await receta.evaluate(el=>(el.value.match(/Encuesta de satisfacción \(NPS\):/g)||[]).length);
  expect(manualCount).toBe(1);

  await frame.locator('#orionClinicalTabPreview').click();
  await expect(frame.locator('#v_receta')).toContainText('Encuesta de satisfacción (NPS):');

  const config=await frame.locator('body').evaluate(()=>window.ORION_CMF_NPS_V136||null);
  expect(config?.mandatory).toBeTruthy();
});

test('CMF ubica acciones arriba y configura PDF Statement y WhatsApp',async({page})=>{
  await openPortal(page);
  const frame=await selectModule(page,'cmf','cmf',/Control clínico CMF/i);
  const actions=frame.locator('.orion-actions-top');
  await expect(actions).toBeVisible();
  await expect(actions.locator('#btnPrint')).toBeVisible();
  await expect(actions.locator('#btnPdf')).toBeVisible();
  await expect(actions.locator('#btnWA')).toBeVisible();
  await expect(actions.locator('#btnCopy')).toBeVisible();

  const output=await frame.locator('body').evaluate(()=>{
    const actions=document.querySelector('.orion-actions-top');
    const tabs=document.getElementById('orionClinicalTabs');
    return{
      config:window.ORION_CMF_OUTPUT_V134||null,
      beforeTabs:!!actions&&!!tabs&&Boolean(actions.compareDocumentPosition(tabs)&Node.DOCUMENT_POSITION_FOLLOWING),
      logoHeight:getComputedStyle(document.documentElement).getPropertyValue('--brand-logo-h').trim()
    };
  });
  expect(output.beforeTabs).toBeTruthy();
  expect(output.config?.pdf).toBe('statement-5.5x8.5');
  expect(output.config?.whatsapp).toBe('api+scheme');
  expect(output.logoHeight).toBe('52px');
});

test('CMF oculta las hojas impresas en una pestaña y las abre bajo demanda',async({page})=>{
  await openPortal(page);
  const frame=await selectModule(page,'cmf','cmf',/Control clínico CMF/i);
  const editTab=frame.locator('#orionClinicalTabEdit');
  const previewTab=frame.locator('#orionClinicalTabPreview');
  const editPane=frame.locator('#orionClinicalEditPane');
  const previewPane=frame.locator('#orionPrintPreviewPane');

  await expect(editTab).toHaveAttribute('aria-selected','true');
  await expect(previewTab).toHaveAttribute('aria-selected','false');
  await expect(editPane).toBeVisible();
  await expect(previewPane).toBeHidden();
  await expect(frame.locator('#orionPrintPreviewPages #printSheet')).toHaveCount(1);
  await expect(frame.locator('#orionPrintPreviewPages #printSheet2')).toHaveCount(1);

  await previewTab.click();
  await expect(previewTab).toHaveAttribute('aria-selected','true');
  await expect(editPane).toBeHidden();
  await expect(previewPane).toBeVisible();
  await expect(previewPane.locator('#printSheet')).toBeVisible();

  await editTab.click();
  await expect(editPane).toBeVisible();
  await expect(previewPane).toBeHidden();

  const config=await frame.locator('body').evaluate(()=>window.ORION_CMF_PREVIEW_V135||null);
  expect(config?.defaultTab).toBe('edit');
  expect(config?.preview).toBe('on-demand');
});

test('CMF restaura firma solo en receta y autoriza con folio, fecha, código y auditoría',async({page})=>{
  await openPortal(page);
  const frame=await selectModule(page,'cmf','cmf',/Control clínico CMF/i);
  const receta=frame.locator('#receta');
  const confirmation=frame.locator('#orionClinicalConfirmCMF');

  await frame.locator('#p_nombre').fill('Paciente Prueba');
  await frame.locator('#p_rut').fill('11.111.111-1');
  await receta.fill('PARACETAMOL 1 g\n1 comprimido cada 8 horas.');
  await receta.blur();
  await frame.locator('#orionClinicalTabPreview').click();

  const recipeSignature=frame.locator('#printSheet .firmaimg');
  await expect(recipeSignature).toHaveCount(1);
  await expect(recipeSignature).toHaveAttribute('src',/firma-javier-espina-navy\.svg/);
  await expect(recipeSignature).toBeVisible();

  const signatureScope=await frame.locator('body').evaluate(()=>({
    recipeVisible:getComputedStyle(document.querySelector('#printSheet .firmaimg')).display!=='none',
    otherHidden:Array.from(document.querySelectorAll('.page:not(#printSheet) .firmaimg')).every(image=>getComputedStyle(image).display==='none'),
    noExtraVisibleBlock:!document.querySelector('.orion-rx-visible-metadata,.orion-rx-visible-verification')
  }));
  expect(signatureScope.recipeVisible).toBeTruthy();
  expect(signatureScope.otherHidden).toBeTruthy();
  expect(signatureScope.noExtraVisibleBlock).toBeTruthy();

  await frame.locator('#orionClinicalTabEdit').click();
  await confirmation.check();
  const authorization=await frame.locator('body').evaluate(async()=>{
    const record=await window.ORION_CMF_RX_AUTH.authorize('TEST');
    const page=document.getElementById('printSheet');
    return{
      record,
      dataset:{
        folio:page.dataset.orionRxFolio,
        issuedAt:page.dataset.orionRxIssuedAt,
        verification:page.dataset.orionRxVerification,
        hash:page.dataset.orionRxContentHash
      },
      authConfig:window.ORION_CMF_RX_AUTH,
      shareConfig:window.ORION_CMF_RX_SHARE
    };
  });

  expect(authorization.record.folio).toMatch(/^ORH-CMF-RX-\d{8}-\d{6}-[A-F0-9]{4}$/);
  expect(authorization.record.verificationCode).toMatch(/^VC-[A-F0-9]{12}$/);
  expect(authorization.record.issuedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  expect(authorization.record.issuedLabel.length).toBeGreaterThan(10);
  expect(authorization.record.contentHash).toMatch(/^[a-f0-9]{64}$/);
  expect(authorization.dataset.folio).toBe(authorization.record.folio);
  expect(authorization.dataset.issuedAt).toBe(authorization.record.issuedAt);
  expect(authorization.dataset.verification).toBe(authorization.record.verificationCode);
  expect(authorization.dataset.hash).toBe(authorization.record.contentHash);
  expect(authorization.authConfig.signature).toBe('recipe-only');
  expect(authorization.authConfig.audit).toBe('indexeddb-local');
  expect(authorization.shareConfig.pdf).toBe('signed-statement');
  expect(authorization.shareConfig.whatsapp).toBe('file-share+fallback');

  const auditCount=await frame.locator('body').evaluate(()=>new Promise((resolve,reject)=>{
    const request=indexedDB.open('orion_cmf_audit_v1');
    request.onerror=()=>reject(request.error);
    request.onsuccess=()=>{
      const db=request.result;
      const transaction=db.transaction('events','readonly');
      const countRequest=transaction.objectStore('events').count();
      countRequest.onsuccess=()=>{resolve(countRequest.result);db.close();};
      countRequest.onerror=()=>{reject(countRequest.error);db.close();};
    };
  }));
  expect(auditCount).toBeGreaterThan(0);

  await receta.fill('RECETA MODIFICADA');
  await expect(confirmation).not.toBeChecked();
  const invalidated=await frame.locator('body').evaluate(()=>({
    current:window.ORION_CMF_RX_AUTH.current(),
    folio:document.getElementById('printSheet').dataset.orionRxFolio||''
  }));
  expect(invalidated.current).toBeNull();
  expect(invalidated.folio).toBe('');
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
