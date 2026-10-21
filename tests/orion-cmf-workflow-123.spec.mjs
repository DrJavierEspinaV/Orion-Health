import {test,expect} from '@playwright/test';
async function openCMF(page,width=1440){
  await page.setViewportSize({width,height:900});
  await page.goto('/apps/orion-health/index.html',{waitUntil:'domcontentloaded'});
  await page.locator('.menu-btn[data-app="cmf"]').click();
  const frame=page.frameLocator('#appFrame');
  await expect(frame.locator('#cmfEditorColumns')).toBeVisible({timeout:30000});
  return frame;
}
for(const width of [1440,390]){
  test('CMF V4.3.44: bloques 1-2-3 y marca de agua '+width,async({page})=>{
    const frame=await openCMF(page,width);
    const geo=await frame.locator('body').evaluate(()=>{
      const rect=id=>{const r=document.getElementById(id).getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height};};
      const watermark=getComputedStyle(document.getElementById('orionClinicalEditPane'),'::before');
      const logo=document.querySelector('header.no-print img[alt="Maxilofacial PRO+"]');
      return {one:rect('cmfPatientCard'),two:rect('cmfDocumentOptions'),three:rect('cmfClinicalContent'),
        watermark:watermark.backgroundImage,opacity:watermark.opacity,
        logoWidth:logo.getBoundingClientRect().width,
        isOverflow:document.documentElement.scrollWidth>document.documentElement.clientWidth+4,
        ids:['p_nombre','p_rut','tplAdulto','receta','indicaciones','selInd','btnDocCert'].every(id=>Boolean(document.getElementById(id)))};
    });
    expect(geo.ids).toBe(true);
    expect(geo.one.y).toBeLessThan(geo.two.y);
    expect(geo.one.y).toBeLessThan(geo.three.y);
    if(width>1080){expect(geo.two.x).toBeLessThan(geo.three.x);expect(Math.abs(geo.two.y-geo.three.y)).toBeLessThan(7);}
    else expect(geo.two.y).toBeLessThan(geo.three.y);
    expect(geo.watermark).toContain('maxilofacial-pro-plus.svg');
    expect(Number(geo.opacity)).toBeLessThanOrEqual(.16);
    expect(geo.logoWidth).toBeGreaterThan(155);
    expect(geo.isOverflow).toBe(false);
    await expect(frame.locator('#receta')).toBeVisible();
    await frame.locator('#receta').fill('TEXTO SINTÉTICO DE PRUEBA');
    await expect(frame.locator('#receta')).toHaveValue('TEXTO SINTÉTICO DE PRUEBA');
    await expect(frame.locator('#indicaciones')).toBeVisible();
    await expect(frame.locator('#orionClinicalTabPreview')).toBeVisible();
    await frame.locator('#orionClinicalTabPreview').click();
    await expect(frame.locator('#orionPrintPreviewPane')).toBeVisible();
    await expect(frame.locator('#orionClinicalEditPane')).toBeHidden();
    await frame.locator('#orionClinicalTabEdit').click();
    await expect(frame.locator('#receta')).toHaveValue('TEXTO SINTÉTICO DE PRUEBA');
  });
}
test('CMF: no se modifican los documentos imprimibles ni sus firmas',async({page})=>{
 const frame=await openCMF(page);
 await expect(frame.locator('#printSheet')).toBeAttached();
 await expect(frame.locator('#printSheet2')).toBeAttached();
 await expect(frame.locator('#printDoc')).toBeAttached();
 const css=await frame.locator('body').evaluate(()=>{
  const ss=[...document.styleSheets].find(s=>s.href?.includes('cmf-workflow-123-v1.css'));
  return {present:Boolean(ss),screenOnly:ss?[...ss.cssRules].every(r=>r.type===CSSRule.MEDIA_RULE&&r.conditionText.includes('screen')):false};
 });
 expect(css).toEqual({present:true,screenOnly:true});
});
