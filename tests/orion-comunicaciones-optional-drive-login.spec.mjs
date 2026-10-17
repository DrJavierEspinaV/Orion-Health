import {test,expect} from '@playwright/test';

const portal='/apps/orion-health/index.html';
async function openComunicaciones(page){
  await page.goto(portal,{waitUntil:'domcontentloaded'});
  await page.locator('.menu-btn[data-app="comunicaciones"]').click();
  const frame=page.frameLocator('#appFrame');
  await expect(frame.locator('#orionDriveStatusCard')).toBeAttached({timeout:30000});
  await expect(frame.locator('#orionDriveModal')).toBeAttached();
  return frame;
}

for(const viewport of [{width:1440,height:900},{width:390,height:844}]){
  test('Comunicaciones abre sin modal obligatorio ni token de Drive ('+viewport.width+')',async({page})=>{
    await page.setViewportSize(viewport);
    const frame=await openComunicaciones(page);
    await expect(frame.locator('#orionDriveModal')).toBeHidden();
    await expect(frame.locator('#orionDriveStatusBadge')).toHaveText('Pendiente');
    await expect(frame.locator('#orionDriveStatusText')).toContainText('Sin conexión a Drive');
    await expect(frame.locator('#orionDriveStatusCard')).toBeHidden();
    await frame.locator('#orionDataSourcePanel > summary').click();
    await expect(frame.locator('#orionDriveReconnect')).toBeVisible();
    await expect(frame.locator('#orionPatientPriorityControls')).toBeVisible();
    await expect(frame.locator('#mensajeTipo')).toBeVisible();
    await page.waitForTimeout(450);
    await expect(frame.locator('#orionDriveModal')).toBeHidden();

    const auth=await frame.locator('body').evaluate(()=>({
      sessionToken:sessionStorage.getItem('orion_comunicaciones_token')||'',
      localToken:localStorage.getItem('orion_comunicaciones_token')||'',
      noSecretInHtml:!document.documentElement.outerHTML.includes('token='),
      moduleVisible:Boolean(document.getElementById('mensajeTipo'))
    }));
    expect(auth.sessionToken).toBe('');
    expect(auth.localToken).toBe('');
    expect(auth.moduleVisible).toBe(true);
  });
}

test('Conexión a Drive se ofrece a solicitud y Cancelar permite continuar sin clave',async({page})=>{
  const frame=await openComunicaciones(page);
  const modal=frame.locator('#orionDriveModal');
  await frame.locator('#orionDataSourcePanel > summary').click();
  await expect(frame.locator('#orionDriveReconnect')).toBeVisible();
  await frame.locator('#orionDriveReconnect').click();
  await expect(modal).toBeVisible();
  await expect(frame.locator('#orionDriveTokenInput')).toHaveAttribute('type','password');
  await expect(frame.locator('#orionDriveConnectNow')).toBeVisible();
  await frame.locator('#orionDriveCancel').click();
  await expect(modal).toBeHidden();
  await expect(frame.locator('#mensajeTipo')).toBeVisible();
  await frame.locator('#orionDriveChangeAccess').click();
  await expect(modal).toBeVisible();
  await frame.locator('#orionDriveCancel').click();
  await expect(modal).toBeHidden();
});

test('Cerrar acceso no vuelve a abrir el cuadro de contraseña automáticamente',async({page})=>{
  const frame=await openComunicaciones(page);
  const modal=frame.locator('#orionDriveModal');
  await frame.locator('#orionDataSourcePanel > summary').click();
  await expect(frame.locator('#orionDriveForget')).toBeVisible();
  await frame.locator('#orionDriveForget').click();
  await expect(modal).toBeHidden();
  await expect(frame.locator('#orionDriveStatusText')).toContainText('Acceso a Drive cerrado');
  await expect(frame.locator('#orionDriveStatusBadge')).toHaveText('Pendiente');
  await frame.locator('#orionDriveReconnect').click();
  await expect(modal).toBeVisible();
});

test('Autorización de Drive no se elimina ni se reemplaza por un token público',async({request})=>{
  const res=await request.get('/apps/orion-health/assets/shared/session-config.js');
  expect(res.ok()).toBe(true);
  const js=await res.text();
  expect(js).toContain("sessionStorage");
  expect(js).toContain("if(!token)");
  expect(js).toContain("openModal()");
  expect(js).not.toContain('setTimeout(()=>openModal(),250)');
  expect(js).not.toMatch(/const\s+(?:TOKEN|PASSWORD|SECRET)\s*=\s*['"][^'"]{8,}['"]/);
});
