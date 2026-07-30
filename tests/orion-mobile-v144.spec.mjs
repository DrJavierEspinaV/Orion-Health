import {test,expect} from '@playwright/test';

const appUrl='/apps/orion-health/index.html';

async function openModule(page,key,pathName,expected){
  await page.goto(appUrl,{waitUntil:'domcontentloaded'});
  await page.locator(`.menu-btn[data-app="${key}"]`).click();
  await page.waitForFunction(path=>{
    const frame=document.getElementById('appFrame');
    try{return !!frame?.contentWindow?.location?.pathname?.includes(path);}catch(_){return false;}
  },`/modules/${pathName}/`,{timeout:30000});
  const frame=page.frameLocator('#appFrame');
  await expect(frame.locator('body')).toContainText(expected,{timeout:30000});
  return frame;
}

test('Comunicaciones móvil ordena agenda, lista, mensajes y conexión',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  const frame=await openModule(page,'comunicaciones','comunicaciones',/Comunicaciones/i);
  await expect(frame.locator('body')).toHaveClass(/orion-communications-mobile/);

  await frame.locator('#list').evaluate(list=>{
    const row=document.createElement('div');
    row.className='row';
    row.innerHTML='<div><div class="paciente-top"></div><div class="paciente-nombre">Paciente Prueba</div><div class="wa-row-line"><a class="btn whatsapp wa-action">WhatsApp</a></div></div><div>11.111.111-1</div><div>30-07-2026</div><div>10:00</div><div><span class="pill ausente">Ausente</span></div><div>Control clínico</div>';
    list.appendChild(row);
  });
  await page.waitForTimeout(100);

  const metrics=await frame.locator('body').evaluate(()=>{
    const layout=document.querySelector('.crm-layout');
    const sidebar=document.querySelector('.crm-sidebar');
    const left=document.querySelector('.crm-left');
    const data=document.getElementById('orionDataSourcePanel');
    const row=document.querySelector('#list .row');
    const header=document.querySelector('.table .header');
    return{
      sidebarBeforeLeft:!!sidebar&&!!left&&Boolean(sidebar.compareDocumentPosition(left)&Node.DOCUMENT_POSITION_FOLLOWING),
      leftBeforeData:!!left&&!!data&&Boolean(left.compareDocumentPosition(data)&Node.DOCUMENT_POSITION_FOLLOWING),
      dataDirectChild:data?.parentElement===layout,
      rowDisplay:getComputedStyle(row).display,
      rowColumns:getComputedStyle(row).gridTemplateColumns,
      headerDisplay:getComputedStyle(header).display,
      bodyOverflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,
      decorated:row?.children[0]?.classList.contains('patient-main')&&row?.children[5]?.classList.contains('patient-motive')
    };
  });
  expect(metrics.sidebarBeforeLeft).toBeTruthy();
  expect(metrics.leftBeforeData).toBeTruthy();
  expect(metrics.dataDirectChild).toBeTruthy();
  expect(metrics.rowDisplay).toBe('grid');
  expect(metrics.rowColumns.split(' ').length).toBeGreaterThanOrEqual(2);
  expect(metrics.headerDisplay).toBe('none');
  expect(metrics.bodyOverflow).toBeLessThanOrEqual(3);
  expect(metrics.decorated).toBeTruthy();
});

test('CMF móvil permite scroll central, sube acciones y prepara firma PNG',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  const frame=await openModule(page,'cmf','cmf',/Control clínico CMF/i);
  await expect(frame.locator('body')).toHaveClass(/orion-cmf-mobile/);
  await frame.locator('#btnDocExams').click();
  await expect(frame.locator('#examDrawer')).toBeVisible();

  const layout=await frame.locator('body').evaluate(()=>{
    const drawer=document.getElementById('examDrawer');
    const content=drawer?.querySelector(':scope > .p-4.space-y-3');
    const actions=drawer?.querySelector('.orion-exam-actions-inline');
    const search=content?.children[1];
    return{
      actionsInside:actions?.parentElement===content,
      actionsAfterSearch:search?.nextElementSibling===actions,
      overflowY:getComputedStyle(content).overflowY,
      touchAction:getComputedStyle(content).touchAction,
      widthOverflow:document.documentElement.scrollWidth-document.documentElement.clientWidth
    };
  });
  expect(layout.actionsInside).toBeTruthy();
  expect(layout.actionsAfterSearch).toBeTruthy();
  expect(['auto','scroll']).toContain(layout.overflowY);
  expect(layout.touchAction).toContain('pan-y');
  expect(layout.widthOverflow).toBeLessThanOrEqual(3);
  await expect(frame.locator('#btnExamOrderLab')).toBeVisible();
  await expect(frame.locator('#btnExamOrderImg')).toBeVisible();

  const signature=await frame.locator('body').evaluate(async()=>{
    const api=window.ORION_CMF_MOBILE_V142;
    await api.prepareOutput();
    const image=document.querySelector('#printExamLab .firmaimg');
    return{config:api.signature,src:image?.getAttribute('src')||'',format:image?.dataset.orionSignatureFormat||''};
  });
  expect(signature.config).toBe('svg-with-png-fallback');
  expect(signature.src).toMatch(/^data:image\/png;base64,/);
  expect(signature.format).toBe('png-data-uri');
});
