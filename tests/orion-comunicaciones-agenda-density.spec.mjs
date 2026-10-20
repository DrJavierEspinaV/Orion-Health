import { test, expect } from '@playwright/test';

async function openAgenda(page, width, height) {
  await page.setViewportSize({width, height});
  await page.goto('/apps/orion-health/index.html', {waitUntil:'domcontentloaded'});
  await page.locator('.menu-btn[data-app="comunicaciones"]').click();
  const frame=page.frameLocator('#appFrame');
  await expect(frame.locator('#list')).toBeAttached({timeout:30000});
  await frame.locator('#list').evaluate(list => {
    // Fila sintética. Ningún paciente ni número real participa en la prueba.
    const row=document.createElement('div');
    row.className='row';
    row.innerHTML=[
      '<div>',
      '<div class="paciente-top">',
      ' <label class="udc-wrap"><input class="udc-check" type="checkbox"><span class="udc-label">UDC</span></label>',
      ' <label class="retraso-wrap retraso-llegada"><input class="retraso-check" type="checkbox"><span class="retraso-label">RET. LLEGADA</span></label>',
      ' <label class="retraso-wrap retraso-atencion"><input class="retraso-check" type="checkbox"><span class="retraso-label">RET. ATENCIÓN</span></label>',
      ' <label class="retraso-estimado-wrap"><span>⏱</span><select class="retraso-minutos"><option>Sin ETA</option><option>+10 min</option></select></label>',
      '</div>',
      '<div class="paciente-nombre">PACIENTE SINTÉTICO DE PRUEBA</div>',
      '<div class="muted">+56900000000</div>',
      '<div class="wa-row-line"><a class="btn whatsapp wa-action" href="#">WhatsApp</a></div>',
      '</div>',
      '<div>TEST-RUN</div><div>20-10-2026</div><div>09:00</div>',
      '<div><span class="pill">Citado</span></div><div>CONTROL SINTÉTICO</div>'
    ].join('');
    row.querySelector('.udc-check').addEventListener('change', () => {
      document.body.dataset.orionTestUdc='preserved';
    });
    list.appendChild(row);
  });
  await expect(frame.locator('#list .row .orion-clinical-tools')).toBeVisible();
  return frame;
}

for (const size of [{width:1440,height:900},{width:390,height:844}]) {
  test('agenda ORION '+size.width+': nombre prioritario y controles clínicos plegados',async ({page}) => {
    const frame=await openAgenda(page,size.width,size.height);
    const row=frame.locator('#list .row');
    await expect(row.locator('.patient-main')).toBeVisible();
    await expect(row.locator('.patient-run')).toBeVisible();
    await expect(row.locator('.patient-date')).toBeVisible();
    await expect(row.locator('.patient-time')).toBeVisible();
    await expect(row.locator('.patient-status')).toBeVisible();
    await expect(row.locator('.patient-motive')).toBeVisible();
    await expect(row.locator('.orion-clinical-tools')).not.toHaveAttribute('open','');
    await expect(row.locator('.paciente-top')).toBeHidden();
    await expect(row.locator('.orion-clinical-tools > summary')).toHaveText('Acciones');
    // UDC no se esconde ni depende de abrir Acciones: queda junto al nombre.
    const udc=row.locator('.orion-patient-heading .udc-wrap.orion-udc-visible');
    await expect(udc).toBeVisible();
    await expect(udc.locator('.udc-check')).toBeVisible();
    await expect(row.locator('.orion-clinical-tools .udc-check')).toHaveCount(0);
    await expect(row.locator('.orion-patient-heading .paciente-nombre'))
      .toHaveText('PACIENTE SINTÉTICO DE PRUEBA');
    const geo=await row.locator('.patient-main').evaluate(main => {
      const phone=main.querySelector('.orion-patient-phone');
      const wa=main.querySelector('.wa-action');
      const line=main.querySelector('.wa-row-line');
      return {
        phoneInsideLine:phone?.parentElement===line,
        width:wa?.getBoundingClientRect().width,
        height:wa?.getBoundingClientRect().height,
        mainHeight:main.getBoundingClientRect().height,
        overflow:document.documentElement.scrollWidth > document.documentElement.clientWidth+3
      };
    });
    expect(geo.phoneInsideLine).toBe(true);
    expect(geo.width).toBeLessThanOrEqual(118);
    expect(geo.height).toBeLessThanOrEqual(36);
    expect(geo.mainHeight).toBeLessThan(105);
    expect(geo.overflow).toBe(false);

    // Click directo UDC conserva el evento original, incluso con Acciones cerrado.
    await udc.locator('.udc-check').check();
    await expect.poll(async()=>frame.locator('body').evaluate(el=>el.dataset.orionTestUdc)).toBe('preserved');
    await expect(udc.locator('.udc-check')).toBeChecked();
    await row.locator('.orion-clinical-tools > summary').click();
    await expect(row.locator('.paciente-top')).toBeVisible();
    await expect(row.locator('.retraso-check')).toHaveCount(2);
    await expect(row.locator('.retraso-minutos')).toBeVisible();
    await expect(row.locator('.orion-clinical-tools .udc-wrap')).toHaveCount(0);
    await row.locator('.orion-clinical-tools > summary').click();
    await expect(row.locator('.paciente-top')).toBeHidden();
    await expect(udc).toBeVisible();
  });
}
