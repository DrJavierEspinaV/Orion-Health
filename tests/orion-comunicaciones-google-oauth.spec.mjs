import {test,expect} from '@playwright/test';

async function open(page){
  await page.goto('/apps/orion-health/index.html',{waitUntil:'domcontentloaded'});
  await page.locator('.menu-btn[data-app="comunicaciones"]').click();
  const f=page.frameLocator('#appFrame');
  await expect(f.locator('#orionGoogleOAuthPanel')).toBeAttached({timeout:30000});
  return f;
}
test('Comunicaciones presenta acceso Google sin exigir clave ORION',async({page})=>{
  const f=await open(page);
  await f.locator('#orionGoogleLogin').click();
  await expect(f.locator('#orionGoogleConfig')).toBeVisible();
  await expect(f.locator('#orionGoogleStatus')).toContainText('Configura');
  await expect(f.locator('#orionDriveModal')).toBeHidden();
});

test('Una lectura OAuth autorizada carga filas sin token en URL',async({page})=>{
  await page.addInitScript(()=>{
    localStorage.setItem('orion_google_db_config_v1',JSON.stringify({
      clientId:'123456-abcdef.apps.googleusercontent.com',sheetId:'A'.repeat(44)
    }));
    window.google={accounts:{oauth2:{initTokenClient:params=>({
      requestAccessToken:()=>params.callback({access_token:'mock_access',expires_in:3600})
    })}}};
  });
  await page.route('**/sheets.googleapis.com/v4/spreadsheets/**',async route=>{
    const req=route.request();
    expect(req.headers().authorization).toBe('Bearer mock_access');
    expect(req.url()).not.toContain('mock_access');
    await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({
      values:[['PACIENTE','RUN','FECHA','HORA','ESTADO'],['Paciente Prueba','11111111-1','18-11-2026','10:00','Citado']]
    })});
  });
  const f=await open(page);
  await f.locator('#orionGoogleLogin').click();
  await expect(f.locator('#orionGoogleStatus')).toContainText('1 registros');
  await expect(f.locator('#orionSapSourceStatus')).toContainText('Google');
  const data=await f.locator('body').evaluate(()=>({
    tokenLocal:localStorage.getItem('orion_google_token'),
    tokenSession:sessionStorage.getItem('orion_google_token'),
    cache:localStorage.getItem('orion_comunicaciones_cache_v9'),
    importedText:document.getElementById('orionSapSourceStatus')?.textContent
  }));
  expect(data.tokenLocal).toBeNull();
  expect(data.tokenSession).toBeNull();
  expect(data.cache).toBeNull();
  expect(data.importedText).toContain('1 registros');
});