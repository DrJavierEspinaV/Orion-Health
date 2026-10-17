import {test,expect} from '@playwright/test';

const root='/apps/orion-health/index.html';
const modules=[
  {key:'comunicaciones',anchor:'#orionDriveStatusCard'},
  {key:'insumos',anchor:'#search'},
  {key:'cmf',anchor:'#selInd'},
  {key:'endo',anchor:'#p_nombre'},
  {key:'orto',anchor:'#fSearch'},
  {key:'odontopediatria',anchor:'#fSearch'},
  {key:'armonizacion',anchor:'#atlasShell'}
];
const shared=[
  'health-os-design-tokens-v2.css',
  'health-os-ui-components-v2.css',
  'health-os-ux-modules-v2.css'
];

const portalWidths=[320,390,768,1024,1366];
for(const width of portalWidths){
  test('UX V2 centro de aplicaciones '+width+'px sin scroll horizontal',async({page})=>{
    await page.setViewportSize({width,height:850});
    await page.goto(root,{waitUntil:'domcontentloaded'});
    const cards=page.locator('.menu-btn[data-app]');
    await expect(cards).toHaveCount(7);
    await expect(page.locator('.portal-external-link')).toHaveCount(1);
    await expect(page.locator('body')).toHaveClass(/orion-ux-v2/);
    const visual=await page.evaluate(()=>{
      const menu=document.querySelector('.menu');
      const links=[...document.styleSheets].map(sheet=>sheet.href||'');
      const css=getComputedStyle(document.documentElement);
      return{
        columns:getComputedStyle(menu).gridTemplateColumns.split(' ').filter(Boolean).length,
        scrollWidth:document.documentElement.scrollWidth,
        clientWidth:document.documentElement.clientWidth,
        externalTag:document.querySelector('.portal-external-link')?.tagName,
        hasTokens:links.some(url=>url.includes('health-os-design-tokens-v2.css')),
        hasComponents:links.some(url=>url.includes('health-os-ui-components-v2.css')),
        hasPortal:links.some(url=>url.includes('portal-ux-v2.css')),
        token:css.getPropertyValue('--orion-ui-primary').trim()
      };
    });
    expect(visual.columns).toBe(width<=640?1:width<=1100?2:4);
    expect(visual.scrollWidth).toBeLessThanOrEqual(visual.clientWidth+3);
    expect(visual.externalTag).toBe('A');
    expect(visual.hasTokens&&visual.hasComponents&&visual.hasPortal).toBe(true);
    expect(visual.token).toBe('#1F3F5B');
    if(width===390||width===1366)await page.screenshot({path:'test-results/orion-ux-v2-portal-'+width+'.png',animations:'disabled'});
  });
}

for(const module of modules){
  test('UX V2 '+module.key+': CSS compartido sin perder el módulo',async({page})=>{
    await page.setViewportSize({width:1366,height:850});
    await page.goto(root,{waitUntil:'domcontentloaded'});
    await page.locator('.menu-btn[data-app="'+module.key+'"]').click();
    const frame=page.frameLocator('#appFrame');
    await expect(frame.locator(module.anchor)).toBeAttached({timeout:45000});
    await expect.poll(()=>frame.locator('html').evaluate(node=>{
      const links=[...node.ownerDocument.styleSheets].map(sheet=>sheet.href||'');
      return node.classList.contains('orion-ux-v2')&&links.some(x=>x.includes('health-os-ux-modules-v2.css'));
    }),{timeout:15000}).toBe(true);
    const state=await frame.locator('html').evaluate((node,names)=>{
      const links=[...node.ownerDocument.styleSheets].map(sheet=>sheet.href||'');
      return {
        module:node.dataset.orionModule,
        present:names.map(name=>links.some(link=>link.includes(name))),
        primary:getComputedStyle(node).getPropertyValue('--orion-ui-primary').trim()
      };
    },shared);
    expect(state.module).toBe(({endo:'endodoncia',orto:'ortodoncia'})[module.key]||module.key);
    expect(state.present).toEqual([true,true,true]);
    expect(state.primary).toBe('#1F3F5B');
    if(module.key==='comunicaciones')await expect(frame.locator('#orionDriveModal')).toBeHidden();
    if(module.key==='cmf'){
      await expect(frame.locator('#printSheet')).toBeAttached();
      await expect(frame.locator('#printSheet2')).toBeAttached();
    }
    await page.screenshot({path:'test-results/orion-ux-v2-'+module.key+'-desktop.png',animations:'disabled'});
  });
}

for(const module of [{key:'comunicaciones',anchor:'#orionDriveStatusCard'},{key:'cmf',anchor:'#selInd'},{key:'odontopediatria',anchor:'#fSearch'}]){
  test('UX V2 '+module.key+' móvil 390px: interacción y recursos presentes',async({page})=>{
    await page.setViewportSize({width:390,height:844});
    await page.goto(root,{waitUntil:'domcontentloaded'});
    await page.locator('.menu-btn[data-app="'+module.key+'"]').click();
    const frame=page.frameLocator('#appFrame');
    await expect(frame.locator(module.anchor)).toBeAttached({timeout:45000});
    await expect(frame.locator('html')).toHaveAttribute('data-orion-module',module.key);
    await expect.poll(()=>frame.locator('html').evaluate(node=>[...node.ownerDocument.styleSheets].some(x=>x.href?.includes('health-os-ui-components-v2.css'))),{timeout:15000}).toBe(true);
  });
}

test('UX V2: manifiesto publica siete módulos y el portal conserva enlace externo',async({page,request})=>{
  await page.goto(root,{waitUntil:'domcontentloaded'});
  const response=await request.get('/apps/orion-health/manifest.webmanifest');
  expect(response.ok()).toBe(true);
  const manifest=await response.json();
  expect(manifest.description).toMatch(/siete módulos/i);
  await expect(page.locator('.menu-btn[data-app]')).toHaveCount(7);
  const external=page.locator('a.portal-external-link');
  await expect(external).toHaveAttribute('target','_blank');
  await expect(external).toHaveAttribute('rel',/noopener/);
});

test('UX V2: identidad y accesibilidad no alteran impresión de CMF',async({page})=>{
  await page.goto(root,{waitUntil:'domcontentloaded'});
  await page.locator('.menu-btn[data-app="cmf"]').click();
  const frame=page.frameLocator('#appFrame');
  await expect(frame.locator('#selInd')).toBeVisible({timeout:45000});
  await page.emulateMedia({media:'print'});
  await expect(frame.locator('header.no-print')).toBeHidden();
  await expect(frame.locator('#printSheet')).toBeAttached();
  await expect(frame.locator('#printSheet2')).toBeAttached();
});
