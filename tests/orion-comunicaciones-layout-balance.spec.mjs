import {test,expect} from '@playwright/test';

async function openComms(page,width) {
  await page.setViewportSize({width,height:900});
  await page.goto('/apps/orion-health/index.html',{waitUntil:'domcontentloaded'});
  await page.locator('.menu-btn[data-app="comunicaciones"]').click();
  const frame=page.frameLocator('#appFrame');
  await expect(frame.locator('.orion-message-workspace')).toBeVisible({timeout:30000});
  await expect(frame.locator('#orionPatientPriorityControls')).toBeVisible();
  return frame;
}

for(const width of [1600,1440,1100,390]) {
  test('ORION layout '+width+'px: balance de agenda y editor', async ({page})=>{
    const frame=await openComms(page,width);
    const layout=await frame.locator('.crm-layout').evaluate(el=>{
      const area=el.getBoundingClientRect();
      const editor=el.querySelector('.crm-left')?.getBoundingClientRect();
      const agenda=el.querySelector('.crm-sidebar')?.getBoundingClientRect();
      const styles=getComputedStyle(el);
      const valid=x=>x&&Number.isFinite(x.width)&&Number.isFinite(x.height);
      return {
        innerWidth:document.documentElement.clientWidth,
        gridColumns:styles.gridTemplateColumns,
        editorWidth:editor?.width, agendaWidth:agenda?.width,
        editorTop:editor?.top, agendaTop:agenda?.top,
        editorLeft:editor?.left, agendaLeft:agenda?.left,
        areaWidth:area.width, documentsVisible:!!document.querySelector('#documentoStatus'),
        inside:valid(area)&&valid(editor)&&valid(agenda),
        ratio:editor&&agenda?agenda.width/(editor.width+agenda.width):0
      };
    });
    expect(layout.inside).toBe(true);
    expect(layout.documentsVisible).toBe(true);
    if(layout.innerWidth>=1260){
      expect(layout.agendaLeft).toBeGreaterThan(layout.editorLeft);
      expect(Math.abs(layout.agendaTop-layout.editorTop)).toBeLessThan(7);
      expect(layout.ratio).toBeGreaterThan(0.56);
      expect(layout.ratio).toBeLessThan(0.65);
    }else{
      expect(layout.agendaTop).toBeLessThan(layout.editorTop);
      expect(layout.agendaWidth).toBeLessThanOrEqual(layout.areaWidth+3);
      expect(layout.editorWidth).toBeLessThanOrEqual(layout.areaWidth+3);
    }
    await expect(frame.locator('#orionSapSourceStatus')).toContainText('SAP');
    await expect(frame.locator('#file')).toBeVisible();
    await expect(frame.locator('#tipoMensaje')).toBeVisible();
    await expect(frame.locator('#mensajeTipo')).toBeVisible();
  });
}

test('Pantalla de Comunicaciones: UDC y WhatsApp continúan con dimensiones clínicas',async({page})=>{
  const frame=await openComms(page,1440);
  await frame.locator('#list').evaluate(list=>{
    const row=document.createElement('div');
    row.className='row';
    row.innerHTML=[
      '<div><div class="paciente-top">',
      '<label class="udc-wrap"><input type="checkbox" class="udc-check"><span class="udc-label">UDC</span></label>',
      '<label class="retraso-wrap"><input type="checkbox" class="retraso-check">Retraso</label>',
      '</div><div class="paciente-nombre">PACIENTE FICTICIO</div>',
      '<div class="muted">+56900000000</div>',
      '<div class="wa-row-line"><a class="btn whatsapp wa-action" href="#">WhatsApp</a></div></div>',
      '<div>RUN-TEST</div><div>20-10-2026</div><div>09:00</div>',
      '<div><span class="pill">Citado</span></div><div>Control sintético</div>'
    ].join('');
    list.append(row);
  });
  const row=frame.locator('#list .row');
  await expect(row.locator('.orion-patient-heading .udc-check')).toBeVisible();
  await expect(row.locator('.orion-clinical-tools')).not.toHaveAttribute('open','');
  await expect(row.locator('.orion-clinical-tools .retraso-check')).toBeHidden();
  const width=await row.locator('.wa-action').evaluate(el=>el.getBoundingClientRect().width);
  expect(width).toBeLessThanOrEqual(118);
});
