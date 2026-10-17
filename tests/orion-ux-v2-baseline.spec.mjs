import {test,expect} from '@playwright/test';

const base='/apps/orion-health/index.html';
const routes=[
  {key:'comunicaciones',selector:'#orionPatientPriorityControls'},
  {key:'insumos',selector:'#search'},
  {key:'cmf',selector:'#selInd'},
  {key:'endo',selector:'#p_nombre'},
  {key:'orto',selector:'#fSearch'},
  {key:'odontopediatria',selector:'#fSearch'},
  {key:'armonizacion',selector:'#atlasShell'}
];

test('UX V2: paleta canónica, componentes opt-in y siete rutas estables',async({page})=>{
  await page.goto(base,{waitUntil:'load'});
  await expect(page.locator('.menu-btn[data-app]')).toHaveCount(7);
  await expect(page.locator('.portal-external-link')).toHaveCount(1);
  const styles=await page.evaluate(()=>{
    const computed=getComputedStyle(document.documentElement);
    return {
      files:[...document.styleSheets].map(s=>s.href||'').filter(Boolean),
      primary:computed.getPropertyValue('--orion-os-primary').trim(),
      border:computed.getPropertyValue('--orion-os-border').trim(),
      optin:document.body.classList.contains('orion-os-ui'),
      active:document.body.classList.contains('route-selector-mode')
    };
  });
  for(const name of ['health-os-design-tokens-v2.css','health-os-ui-components-v2.css','portal-health-os-ux-v2.css']) {
    expect(styles.files.some(file=>file.includes(name))).toBe(true);
  }
  expect(styles.primary).toBe('#1F3F5B');
  expect(styles.border).toBe('#D9DEE3');
  expect(styles.optin&&styles.active).toBe(true);
  const manifest=await (await page.request.get('/apps/orion-health/manifest.webmanifest')).json();
  expect(manifest.description).toContain('siete módulos');
});

test('UX V2: navegación por teclado y preferencias de movimiento',async({page})=>{
  await page.goto(base,{waitUntil:'load'});
  const first=page.locator('.menu-btn[data-app="comunicaciones"]');
  await first.focus();
  expect(await first.evaluate(el=>getComputedStyle(el).outlineStyle)).not.toBe('none');
  await expect(page.locator('.portal-external-link')).toHaveAttribute('target','_blank');
  await page.emulateMedia({reducedMotion:'reduce'});
  expect(await first.evaluate(el=>getComputedStyle(el).transitionDuration)).toBe('0s');
  await first.press('Enter');
  await expect(page.locator('body')).toHaveClass(/module-selected/);
  await expect(page.frameLocator('#appFrame').locator('#orionPatientPriorityControls')).toBeVisible({timeout:30000});
});

for(const size of [{width:1366,height:850},{width:390,height:844}]) {
  test('UX V2: portal legible y sin desborde a '+size.width+'px',async({page},testInfo)=>{
    await page.setViewportSize(size);
    await page.goto(base,{waitUntil:'load'});
    await expect(page.locator('.menu-btn[data-app]')).toHaveCount(7);
    const metrics=await page.evaluate(()=>({
      scroll:document.documentElement.scrollWidth,
      client:document.documentElement.clientWidth,
      cards:[...document.querySelectorAll('.menu-btn[data-app]')].every(el=>el.getBoundingClientRect().width>130)
    }));
    expect(metrics.scroll).toBeLessThanOrEqual(metrics.client+3);
    expect(metrics.cards).toBe(true);
    await testInfo.attach('ux-v2-portal-'+size.width+'.png',{body:await page.screenshot({animations:'disabled'}),contentType:'image/png'});
  });
}

for(const route of routes) {
  test('UX-00 línea base de módulo '+route.key,async({page},testInfo)=>{
    await page.setViewportSize({width:1366,height:850});
    await page.goto(base,{waitUntil:'domcontentloaded'});
    await page.locator('.menu-btn[data-app="'+route.key+'"]').click();
    await expect(page.frameLocator('#appFrame').locator(route.selector)).toBeVisible({timeout:45000});
    await expect(page.locator('body')).toHaveClass(/module-selected/);
    const check=await page.frameLocator('#appFrame').locator('body').evaluate(body=>({
      width:document.documentElement.clientWidth,
      scroll:document.documentElement.scrollWidth,
      hasText:body.innerText.trim().length>50
    }));
    expect(check.hasText).toBe(true);
    expect(check.scroll).toBeLessThanOrEqual(check.width+8);
    await testInfo.attach('ux00-'+route.key+'-1366.png',{body:await page.screenshot({animations:'disabled'}),contentType:'image/png'});
  });
}

test('UX-00: impresión CMF conserva hojas originales fuera del refinamiento de pantalla',async({page})=>{
  await page.goto(base,{waitUntil:'domcontentloaded'});
  await page.locator('.menu-btn[data-app="cmf"]').click();
  const frame=page.frameLocator('#appFrame');
  await expect(frame.locator('#selInd')).toBeVisible({timeout:30000});
  await expect(frame.locator('#printSheet')).toBeAttached();
  await expect(frame.locator('#printSheet2')).toBeAttached();
  await page.emulateMedia({media:'print'});
  expect(await frame.locator('#printSheet').evaluate(el=>getComputedStyle(el).display)).not.toBe('none');
});
