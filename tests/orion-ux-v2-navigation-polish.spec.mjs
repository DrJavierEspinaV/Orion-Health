import {test,expect} from '@playwright/test';

const portal='/apps/orion-health/index.html';

test('UX V2.0.1: carga de módulo comunica progreso real y finaliza con iframe accesible',async({page})=>{
  await page.setViewportSize({width:1366,height:850});
  await page.route('**/modules/comunicaciones/index.html',async route=>{
    await new Promise(resolve=>setTimeout(resolve,500));
    await route.continue();
  });
  await page.goto(portal,{waitUntil:'domcontentloaded'});
  const indicator=page.locator('#moduleLoadStatus');
  const frame=page.locator('#appFrame');
  await expect(indicator).toHaveAttribute('role','status');
  await expect(indicator).toHaveAttribute('aria-live','polite');
  await expect(indicator).toBeHidden();

  // Disparar la acción sin el auto-wait de Playwright, para observar el estado transitorio.
  await page.locator('.menu-btn[data-app="comunicaciones"]').evaluate(el=>el.click());
  await expect(indicator).toBeVisible();
  await expect(frame).toHaveAttribute('aria-busy','true');
  await expect(frame).toHaveAttribute('title','ORION Comunicaciones Clínicas');
  await expect(page.frameLocator('#appFrame').locator('#orionDriveStatusCard')).toBeAttached({timeout:45000});
  await expect(indicator).toBeHidden({timeout:30000});
  await expect(frame).toHaveAttribute('aria-busy','false');

  await page.locator('#btnChangeModule').click();
  await expect(indicator).toBeHidden();
  await expect(frame).toHaveAttribute('title','Aplicación ORION');
  await expect(frame).toHaveAttribute('aria-busy','false');
  await expect(page.locator('.menu-btn[data-app]')).toHaveCount(7);
});

for(const width of [390,1024,1366]){
  test('UX V2.0.1: portal sin estilos superpuestos heredados a '+width+'px',async({page})=>{
    await page.setViewportSize({width,height:840});
    await page.goto(portal,{waitUntil:'domcontentloaded'});
    const d=await page.evaluate(()=>{
      const styles=[...document.styleSheets].map(s=>s.href||'');
      const menu=document.querySelector('.menu');
      return {
        legacy:styles.some(s=>s.includes('portal-aesthetic-v144r7.css')),
        healthOs:styles.some(s=>s.includes('portal-health-os-bridge-v1.css')),
        ux:styles.some(s=>s.includes('portal-ux-v2.css')),
        grid:getComputedStyle(menu).gridTemplateColumns.split(' ').length,
        scroll:document.documentElement.scrollWidth,
        width:document.documentElement.clientWidth
      };
    });
    expect(d.legacy).toBe(false);
    expect(d.healthOs&&d.ux).toBe(true);
    expect(d.grid).toBe(width<=640?1:width<=1100?2:4);
    expect(d.scroll).toBeLessThanOrEqual(d.width+3);
  });
}

test('UX V2.0.1: cambiar y recargar módulo conserva sus rutas y el estado de carga',async({page})=>{
  await page.goto(portal,{waitUntil:'domcontentloaded'});
  await page.locator('.menu-btn[data-app="cmf"]').click();
  const frame=page.locator('#appFrame');
  await expect(page.frameLocator('#appFrame').locator('#selInd')).toBeVisible({timeout:45000});
  await expect(frame).toHaveAttribute('title','ORION Clínico CMF');
  await expect(frame).toHaveAttribute('aria-busy','false');

  await page.locator('#btnReloadApp').click();
  await expect(page.frameLocator('#appFrame').locator('#selInd')).toBeVisible({timeout:45000});
  await expect(frame).toHaveAttribute('aria-busy','false');
  await expect(page.locator('#moduleLoadStatus')).toBeHidden();
});
