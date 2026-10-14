import {test,expect} from '@playwright/test';

const portal='/apps/orion-health/index.html';
async function openCmf(page){
  await page.goto(portal,{waitUntil:'domcontentloaded'});
  await expect(page.locator('body')).toHaveClass(/route-selector-mode/);
  await page.locator('.menu-btn[data-app="cmf"]').click();
  const frame=page.frameLocator('#appFrame');
  await expect(frame.locator('#selInd')).toBeVisible({timeout:30000});
  return frame;
}

for(const viewport of [{width:1440,height:900},{width:390,height:844}]){
  test('CMF: alveolitis seca y húmeda se insertan como cuidados directos, sin PRE ni receta automática ('+viewport.width+')',async({page})=>{
    await page.setViewportSize(viewport);
    const frame=await openCmf(page);
    const selector=frame.locator('#selInd');
    const output=frame.locator('#indicaciones');
    const rx=frame.locator('#receta');

    await expect(selector.locator('option[value="ind_alveolitis_seca"]')).toHaveCount(1);
    await expect(selector.locator('option[value="ind_alveolitis_humeda"]')).toHaveCount(1);

    await selector.selectOption('ind_alveolitis_seca');
    await expect(frame.locator('#insPre')).toBeHidden();
    await expect(frame.locator('#insAmbas')).toBeHidden();
    await expect(frame.locator('#insPost')).toHaveText('Insertar indicaciones');
    await frame.locator('#insPost').click();

    await expect(output).toHaveValue(/ALVEOLITIS SECA[\s\S]*24–48 horas[\s\S]*CONSULTA URGENTE/);
    await expect(output).toHaveValue(/no requiere antibióticos de rutina/i);
    await expect(output).not.toHaveValue(/✅ Prequirúrgicas|Llevar Cédula|No es necesario Ayuno/);
    await expect(output).not.toHaveValue(/AMOXICILINA 500 mg|CLINDAMICINA 300 mg/);
    await expect(frame.locator('#v_ind2')).toContainText('ALVEOLITIS SECA');
    await expect(rx).toHaveValue('');

    await output.fill('');
    await selector.selectOption('ind_alveolitis_humeda');
    await expect(frame.locator('#insPre')).toBeHidden();
    await expect(frame.locator('#insAmbas')).toBeHidden();
    await expect(frame.locator('#insPost')).toHaveText('Insertar indicaciones');
    await frame.locator('#insPost').click();

    await expect(output).toHaveValue(/ALVEOLITIS HÚMEDA O SUPURATIVA[\s\S]*PRIORITARIA[\s\S]*ALERTAS DE INFECCIÓN/);
    await expect(output).toHaveValue(/NO iniciar antibióticos por cuenta propia/);
    await expect(output).toHaveValue(/dificultad respiratoria|Dificultad respiratoria/);
    await expect(output).not.toHaveValue(/✅ Prequirúrgicas|Llevar Cédula|No es necesario Ayuno/);
    await expect(output).not.toHaveValue(/AMOXICILINA 500 mg|CLINDAMICINA 300 mg/);
    await expect(frame.locator('#v_ind2')).toContainText('ALVEOLITIS HÚMEDA O SUPURATIVA');
    await expect(rx).toHaveValue('');

    // Las otras opciones antiguas conservan la acción PRE/POST.
    await selector.selectOption('ind_tm');
    await expect(frame.locator('#insPre')).toBeVisible();
    await expect(frame.locator('#insAmbas')).toBeVisible();
    await expect(frame.locator('#insPost')).toHaveText('Insertar POST');
  });
}

test('CMF: las dos indicaciones permanecen editables y la vista de impresión las respeta',async({page})=>{
  const frame=await openCmf(page);
  const sel=frame.locator('#selInd');
  const input=frame.locator('#indicaciones');
  await sel.selectOption('ind_alveolitis_seca');
  await frame.locator('#insPost').click();
  await input.fill('ALVEOLITIS SECA — pauta editada individualmente. Control en 24 horas.');
  await expect(frame.locator('#v_ind2')).toContainText('pauta editada individualmente');
  await expect(frame.locator('#printSheet2')).toBeVisible();
  await page.emulateMedia({media:'print'});
  await expect(frame.locator('#v_ind2')).toContainText('pauta editada individualmente');
  await expect(frame.locator('#printSheet2')).toBeVisible();
});
