import {test,expect} from '@playwright/test';

const portal='/apps/orion-health/index.html';
const assets=[
  './styles-1.css',
  './layout-fixes.css',
  './assets/shared/orion-identity-system-v140.css',
  './assets/shared/portal-route-selector-v144r6.css',
  './assets/shared/portal-health-os-bridge-v1.css'
];

test('PWA conserva interfaz de Health OS offline incluso con consultas CSS de versión nuevas',async({page,context})=>{
  await page.setViewportSize({width:1366,height:860});
  await page.goto(portal,{waitUntil:'load'});
  // La primera visita instala el worker; una navegación adicional lo deja como controlador.
  await page.evaluate(()=>navigator.serviceWorker.ready);
  await page.reload({waitUntil:'load'});
  await expect.poll(()=>page.evaluate(()=>Boolean(navigator.serviceWorker.controller)),{timeout:30000}).toBeTruthy();

  // Esperar explícitamente instalación y precarga para evitar carreras entre
  // la activación del worker y la inspección de CacheStorage.
  await expect.poll(async()=>{
    return await page.evaluate(async paths=>{
      const names=await caches.keys();
      const active=names.find(name=>name.includes('health-os-ui22-cmf-workflow'));
      if(!active)return false;
      const cache=await caches.open(active);
      return (await Promise.all(paths.map(async path=>Boolean(await cache.match(path))))).every(Boolean);
    },assets);
  },{timeout:30000}).toBe(true);

  try{
    await context.setOffline(true);
    await page.goto(portal+'?ui=offline-version-new',{waitUntil:'domcontentloaded'});
    await expect(page.locator('.menu-btn[data-app]')).toHaveCount(7);

    // Estos queries NO estuvieron precargados: se buscan con ignoreSearch en el worker.
    const results=await page.evaluate(async paths=>Promise.all(paths.map(async path=>{
      try{
        const response=await fetch(path+'?v=UNSEEN_OFFLINE_'+Date.now(),{cache:'no-store'});
        const text=await response.text();
        return{ok:response.ok,css:text.includes('{')&&text.includes('}')};
      }catch(error){return{ok:false,css:false,error:String(error)}}
    })),assets);
    for(const result of results){
      expect(result.ok).toBe(true);
      expect(result.css).toBe(true);
    }

    const visual=await page.evaluate(()=>{
      const shell=getComputedStyle(document.querySelector('.shell'));
      const menu=getComputedStyle(document.querySelector('.menu'));
      const sidebar=getComputedStyle(document.querySelector('.sidebar'));
      const main=getComputedStyle(document.querySelector('.main'));
      return {
        shell:shell.display,
        menu:menu.display,
        menuColumns:menu.gridTemplateColumns.split(' ').length,
        sidebarBackground:sidebar.backgroundColor,
        main:main.display,
        headerWidth:document.querySelector('.brand').getBoundingClientRect().width,
        bodyWidth:document.documentElement.scrollWidth,
        viewportWidth:document.documentElement.clientWidth
      };
    });
    expect(visual.shell).toBe('block');
    expect(visual.menu).toBe('grid');
    expect(visual.menuColumns).toBe(4);
    expect(visual.sidebarBackground).toBe('rgb(243, 243, 243)');
    expect(visual.main).toBe('none');
    expect(visual.headerWidth).toBeGreaterThan(650);
    expect(visual.bodyWidth).toBeLessThanOrEqual(visual.viewportWidth+3);
  }finally{
    await context.setOffline(false);
  }
});

test('La portada aplica el diseño Health OS y oculta la ventana de módulo hasta seleccionarlo',async({page})=>{
  await page.setViewportSize({width:1366,height:860});
  await page.goto(portal,{waitUntil:'load'});
  await expect(page.locator('body')).toHaveClass(/route-selector-mode/);
  await expect(page.locator('.portal-external-link')).toHaveCount(1);
  const styling=await page.evaluate(()=>{
    const nav=document.querySelector('.menu');
    const logo=document.querySelector('.portal-corporate-logo');
    const theme=getComputedStyle(document.querySelector('.sidebar'));
    const menuStyle=getComputedStyle(nav);
    return{
      background:theme.backgroundColor,
      grid:menuStyle.display,
      columns:menuStyle.gridTemplateColumns.split(' ').length,
      logoWidth:logo.getBoundingClientRect().width,
      frameHidden:getComputedStyle(document.querySelector('.main')).display==='none',
      stylesheetCount:[...document.styleSheets].filter(x=>x.href&&x.href.includes('/assets/shared/')).length
    };
  });
  expect(styling.background).toBe('rgb(243, 243, 243)');
  expect(styling.grid).toBe('grid');
  expect(styling.columns).toBe(4);
  expect(styling.logoWidth).toBeGreaterThan(40);
  expect(styling.frameHidden).toBe(true);
  expect(styling.stylesheetCount).toBeGreaterThanOrEqual(4);
});
