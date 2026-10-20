import {test,expect} from '@playwright/test';

const portal='/apps/orion-health/index.html';
async function openComunicaciones(page,width){
  await page.setViewportSize({width,height:850});
  await page.goto(portal,{waitUntil:'domcontentloaded'});
  await page.locator('.menu-btn[data-app="comunicaciones"]').click();
  const frame=page.frameLocator('#appFrame');
  await expect(frame.locator('.orion-message-workspace')).toBeVisible({timeout:30000});
  return frame;
}

for(const width of [1440,390]){
  test('Editor de ORION Dental App® '+width+'px: jerarquía limpia con funciones intactas',async({page})=>{
    const frame=await openComunicaciones(page,width);
    await expect(frame.locator('#orionSurveyDisclosure')).not.toHaveAttribute('open','');
    await expect(frame.locator('#orionAttachmentsDisclosure')).not.toHaveAttribute('open','');
    await expect(frame.locator('#mensajeTipo')).toBeVisible();
    await expect(frame.locator('#tipoMensaje')).toBeVisible();
    await expect(frame.locator('#bloqueEncuesta')).toBeHidden();
    await expect(frame.locator('#linksStatus')).toBeHidden();
    await expect(frame.locator('#orionSurveyDisclosure > summary')).toBeVisible();
    await expect(frame.locator('#orionAttachmentsDisclosure > summary')).toBeVisible();

    await frame.locator('#tipoMensaje').selectOption('indicaciones');
    await expect(frame.locator('#mensajeTipo')).toContainText('Indicaciones');
    await frame.locator('#orionSurveyDisclosure > summary').click();
    await expect(frame.locator('#encuestaOn')).toBeVisible();
    await frame.locator('#encuestaOn').check();
    await expect(frame.locator('#encuestaOn')).toBeChecked();
    await expect(frame.locator('#encuestaTexto')).not.toBeEmpty();
    await frame.locator('#orionSurveyDisclosure > summary').click();
    await expect(frame.locator('#encuestaOn')).toBeHidden();
    await expect(frame.locator('#encuestaOn')).toBeChecked();
    await frame.locator('#orionAttachmentsDisclosure > summary').click();
    await expect(frame.locator('#linksStatus')).toBeVisible();
    await frame.locator('#orionAttachmentsDisclosure > summary').click();

    // El importador SAP sigue visible y el flujo manual no se modifica.
    await expect(frame.locator('#file')).toBeVisible();
    await expect(frame.locator('#orionSapSourceStatus')).toContainText('SAP');

    const overflow=await frame.locator('.orion-message-workspace').evaluate(el=>
      el.getBoundingClientRect().right>document.documentElement.clientWidth+4);
    expect(overflow).toBe(false);
  });
}

test('Enlace manual: URL oculta por defecto y visible a solicitud',async({page})=>{
  const frame=await openComunicaciones(page,1440);
  await frame.locator('#tipoMensaje').selectOption('derivacion_whatsapp');
  await expect(frame.locator('#whatsappManualCard')).toBeVisible();
  await frame.locator('#manualPhone').fill('912345678');
  await frame.locator('#manualName').fill('PACIENTE SINTÉTICO');
  const details=frame.locator('#orionManualPreviewDetails');
  await expect(details).toBeVisible();
  await expect(details).not.toHaveAttribute('open','');
  await expect(frame.locator('#manualPreview')).toBeHidden();
  await details.locator('summary').click();
  await expect(frame.locator('#manualPreview')).toBeVisible();
  await expect(frame.locator('#manualPreview .orion-manual-link-value')).toContainText('wa.me/');
  const safe=await frame.locator('#manualPreview').evaluate(el=>({
    html:el.innerHTML,
    value:el.querySelector('code')?.textContent || ''
  }));
  expect(safe.value).toContain('wa.me/');
  expect(safe.html).not.toContain('<iframe');
  await details.locator('summary').click();
  await expect(frame.locator('#manualPreview')).toBeHidden();
  // La política anterior sigue denegando promociones a contactos manuales.
  await frame.locator('#tipoMensaje').selectOption('promocion');
  await expect(details).toBeHidden();
  await expect(frame.locator('#manualOpen')).not.toHaveAttribute('href',/wa\.me/);
});
