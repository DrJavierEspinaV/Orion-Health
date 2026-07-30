import {test,expect} from '@playwright/test';

const appUrl='/apps/orion-health/index.html';

async function openCommunications(page){
  await page.setViewportSize({width:390,height:844});
  await page.goto(appUrl,{waitUntil:'domcontentloaded'});
  await page.locator('.menu-btn[data-app="comunicaciones"]').click();
  await page.waitForFunction(()=>{
    const frame=document.getElementById('appFrame');
    try{return !!frame?.contentWindow?.location?.pathname?.includes('/modules/comunicaciones/');}catch(_){return false;}
  },null,{timeout:30000});
  const frame=page.frameLocator('#appFrame');
  await expect(frame.locator('#orionPatientPriorityControls')).toBeVisible({timeout:30000});
  return frame;
}

test('Comunicaciones móvil ordena agenda, pacientes, mensajes y conexión',async({page})=>{
  const frame=await openCommunications(page);

  await frame.locator('#list').evaluate(list=>{
    if(list.children.length)return;
    list.innerHTML=`<div class="row">
      <div>
        <div class="paciente-top"><label class="udc-wrap"><input class="udc-check" type="checkbox"><span class="udc-label">UDC</span></label><label class="retraso-wrap retraso-llegada"><input class="retraso-check" type="checkbox"><span class="retraso-label">RET. LLEGADA</span></label><label class="retraso-wrap retraso-atencion"><input class="retraso-check" type="checkbox"><span class="retraso-label">RET. ATENCIÓN</span></label></div>
        <div class="paciente-nombre">PACIENTE DE PRUEBA MÓVIL</div>
        <div class="muted">+56912345678</div>
        <div class="wa-row-line"><a class="btn whatsapp wa-action">WhatsApp</a></div>
      </div>
      <div>12.345.678-9</div><div>30-07-2026</div><div>10:30</div><div><span class="pill ausente">Ausente</span></div><div>Control dental maxilofacial</div>
    </div>`;
  });

  const metrics=await frame.locator('body').evaluate(()=>{
    const rect=selector=>document.querySelector(selector)?.getBoundingClientRect();
    const sidebar=rect('#orionPatientWorkspace');
    const table=rect('#orionPatientListCard');
    const messages=rect('#orionMessageWorkspace');
    const data=rect('#orionDataSourcePanel');
    const row=document.querySelector('#orionPatientListCard .row');
    const rowRect=row?.getBoundingClientRect();
    const cellRects=row?[...row.children].map(cell=>cell.getBoundingClientRect()):[];
    return{
      sidebarTop:sidebar?.top??0,
      tableTop:table?.top??0,
      messagesTop:messages?.top??0,
      dataTop:data?.top??0,
      rowDisplay:row?getComputedStyle(row).display:'',
      rowWidth:rowRect?.width??0,
      tableWidth:table?.width??0,
      maxCellRight:cellRects.length?Math.max(...cellRects.map(value=>value.right)):0,
      rowRight:rowRect?.right??0,
      headerDisplay:getComputedStyle(document.querySelector('#orionPatientListCard>.header')).display,
      horizontalOverflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,
      layoutVersion:window.ORION_COMMUNICATIONS_PRIORITY_LAYOUT?.version||'',
      layoutStatus:window.ORION_COMMUNICATIONS_PRIORITY_LAYOUT?.status||''
    };
  });

  expect(metrics.sidebarTop).toBeLessThan(metrics.messagesTop);
  expect(metrics.tableTop).toBeLessThan(metrics.messagesTop);
  expect(metrics.dataTop).toBeGreaterThan(metrics.messagesTop);
  expect(metrics.rowDisplay).toBe('grid');
  expect(metrics.headerDisplay).toBe('none');
  expect(metrics.rowWidth).toBeLessThanOrEqual(metrics.tableWidth+1);
  expect(metrics.maxCellRight).toBeLessThanOrEqual(metrics.rowRight+1);
  expect(metrics.horizontalOverflow).toBeLessThanOrEqual(3);
  expect(metrics.layoutVersion).toBe('1.4.2');
  expect(metrics.layoutStatus).toBe('PATIENTS_LIST_MESSAGES_DATA');
});

test('Controles de búsqueda y fechas ocupan el ancho útil del teléfono',async({page})=>{
  const frame=await openCommunications(page);
  const widths=await frame.locator('#orionPatientPriorityControls').evaluate(section=>{
    const sectionRect=section.getBoundingClientRect();
    const selectors=['#q','#showFilter','#export','#fFechaFrom','#fFechaTo'];
    return selectors.map(selector=>{
      const rect=document.querySelector(selector)?.getBoundingClientRect();
      return{selector,left:rect?.left??0,right:rect?.right??0,width:rect?.width??0,sectionLeft:sectionRect.left,sectionRight:sectionRect.right};
    });
  });
  for(const item of widths){
    expect(item.width,item.selector).toBeGreaterThan(200);
    expect(item.left,item.selector).toBeGreaterThanOrEqual(item.sectionLeft-1);
    expect(item.right,item.selector).toBeLessThanOrEqual(item.sectionRight+1);
  }
});
