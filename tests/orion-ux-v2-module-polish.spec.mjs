import {test,expect} from '@playwright/test';

const portal='/apps/orion-health/index.html';
const modules=[
  {key:'comunicaciones',name:'comunicaciones',anchor:'#mensajeTipo'},
  {key:'cmf',name:'cmf',anchor:'#selInd'},
  {key:'insumos',name:'insumos',anchor:'#search'},
  {key:'endo',name:'endodoncia',anchor:'#p_nombre'},
  {key:'orto',name:'ortodoncia',anchor:'#fSearch'},
  {key:'odontopediatria',name:'odontopediatria',anchor:'#fSearch'},
  {key:'armonizacion',name:'armonizacion',anchor:'#atlasShell'}
];

for(const module of modules){
  test('UX V2.0.2 '+module.name+' funciona a 390px y conserva pantalla clínica',async({page})=>{
    await page.setViewportSize({width:390,height:844});
    await page.goto(portal,{waitUntil:'domcontentloaded'});
    await page.locator('.menu-btn[data-app="'+module.key+'"]').click();
    const frame=page.frameLocator('#appFrame');
    await expect(frame.locator(module.anchor)).toBeVisible({timeout:45000});
    const meta=await frame.locator('html').evaluate(node=>({
      module:node.dataset.orionModule,
      token:getComputedStyle(node).getPropertyValue('--orion-ui-primary').trim(),
      bodyClass:node.classList.contains('orion-ux-v2'),
      css:[...document.styleSheets].some(s=>s.href?.includes('health-os-ux-modules-v2.css'))
    }));
    expect(meta.module).toBe(module.name);
    expect(meta.bodyClass&&meta.css).toBe(true);
    expect(meta.token).toBe('#1F3F5B');

    if(module.key==='comunicaciones'){
      await expect(frame.locator('#orionHdr h1')).toContainText('V5.7.12');
      await expect(frame.locator('#orionDriveModal')).toBeHidden();
      const size=await frame.locator('#mensajeTipo').evaluate(el=>parseFloat(getComputedStyle(el).fontSize));
      expect(size).toBeGreaterThanOrEqual(13);
    }
    if(module.key==='insumos'){
      await expect(frame.locator('#orionCatalogCard')).toBeVisible();
      const columns=await frame.locator('#tabla').evaluate(el=>getComputedStyle(el).fontVariantNumeric);
      expect(columns).toContain('tabular-nums');
    }
    if(module.key==='cmf'||module.key==='endo'){
      if(module.key==='endo')await expect(frame.locator('header.no-print h1')).toContainText('V4.6.3');
      const selector=module.key==='cmf'?'#selInd':'#p_nombre';
      const input=frame.locator(selector);
      const height=await input.evaluate(el=>el.getBoundingClientRect().height);
      expect(height).toBeGreaterThanOrEqual(35);
      await expect(frame.locator('#printSheet')).toBeAttached();
    }
    if(module.key==='orto'||module.key==='odontopediatria'){
      const size=await frame.locator('#fSearch').evaluate(el=>parseFloat(getComputedStyle(el).fontSize));
      expect(size).toBeGreaterThanOrEqual(13);
      const header=await frame.locator('.topbar > header.wrap').evaluate(el=>({
        background:getComputedStyle(el).backgroundColor,
        titleColor:getComputedStyle(el.querySelector('h1')).color
      }));
      expect(header.background).toBe('rgb(31, 63, 91)');
      expect(header.titleColor).toBe('rgb(255, 255, 255)');
      await expect(frame.locator('.topbar h1')).toContainText(module.key==='orto'?'ORION Ortodoncia':'ORION Odontopediatría');
      await expect(frame.locator('.topbar h1')).toContainText(module.key==='orto'?'v1.2.1':'v1.5.2');
    }
    if(module.key==='armonizacion'){
      await expect(frame.locator('#atlasImage')).toBeAttached();
      await expect(frame.locator('#pointLayer')).toBeAttached();
    }
    await page.screenshot({path:'test-results/orion-ux-v2-'+module.name+'-mobile.png',animations:'disabled'});
  });
}
