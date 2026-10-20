import {test,expect} from '@playwright/test';

const portal='/apps/orion-health/index.html';

async function openSAP(page,width=1440) {
  await page.setViewportSize({width,height:850});
  await page.route('**/modules/comunicaciones/source.html*',async route=>{
    const response=await route.fetch();
    const html=await response.text();
    const end='}); // DOMContentLoaded';
    if(!html.includes(end))throw new Error('Ancla DOMContentLoaded ausente');
    const fixture = String.raw`
window.__orionSAPTest = {
  async importRows(rows){
    const original=window.XLSX;
    window.XLSX = {
      read:()=>({SheetNames:['SAP'],Sheets:{SAP:{}}}),
      utils:{sheet_to_json:()=>rows}
    };
    try {
      await onExcel({target:{files:[{arrayBuffer:async()=>new ArrayBuffer(4)}]}});
    } finally {window.XLSX=original;}
  }
};
`;
    await route.fulfill({response,body:html.replace(end,fixture+end)});
  });
  await page.goto(portal,{waitUntil:'domcontentloaded'});
  await page.locator('.menu-btn[data-app="comunicaciones"]').click();
  const frame=page.frameLocator('#appFrame');
  await expect(frame.locator('#orionSapSourceStatus')).toBeAttached({timeout:30000});
  await expect.poll(async()=>frame.locator('body').evaluate(()=>typeof window.__orionSAPTest?.importRows==='function')).toBe(true);
  return frame;
}

for(const width of [1440,390]){
  test('ORION SAP manual '+width+'px: importación visible y trazabilidad de carga',async({page})=>{
    page.on('dialog',dialog=>dialog.accept());
    const frame=await openSAP(page,width);
    const picker=frame.locator('#file');
    await expect(picker).toBeVisible();
    await expect(frame.locator('.orion-sap-import-primary')).toBeVisible();
    await expect(frame.locator('#orionSapSourceStatus')).toContainText('no se sincroniza automáticamente');
    const fake=[{'Paciente':'PACIENTE FICTICIO SAP','Nº documento':'12.345.678-5',
      'Fecha':'20/10/2026','Hora':'09:00','Estado':'Citado'}];
    await frame.locator('body').evaluate((_,rows)=>window.__orionSAPTest.importRows(rows),fake);
    await expect(frame.locator('#orionSapSourceStatus')).toContainText('Archivo SAP cargado manualmente');
    await expect(frame.locator('#orionSapSourceStatus')).toContainText('1 registros');
    const state=await frame.locator('body').evaluate(()=>({
      source:document.body.dataset.orionSource,
      cached:JSON.parse(sessionStorage.getItem('orion_comunicaciones_cache_v9')||'{}').dataSourceMeta
    }));
    expect(state.source).toBe('sap-manual');
    expect(state.cached?.kind).toBe('sap-file');
    expect(state.cached?.count).toBe(1);
    await expect(frame.locator('#orionDataSourcePanel')).not.toHaveAttribute('open','');
  });
}

test('SAP manual: no consulta Drive automáticamente aun con token antiguo',async({page})=>{
  await page.addInitScript(()=>sessionStorage.setItem('orion_comunicaciones_token','TEST_TOKEN_NO_VALIDO'));
  let requests=0;
  page.on('request',request=>{if(/script\.google\.com\/macros\//.test(request.url()))requests++;});
  const frame=await openSAP(page);
  await expect(frame.locator('#orionDriveStatusText')).toContainText('Importa manualmente el archivo SAP');
  await page.waitForTimeout(1200);
  expect(requests).toBe(0);
  await expect(frame.locator('#orionDriveModal')).toBeHidden();
});
