import { test, expect } from '@playwright/test';

const portal = '/apps/orion-health/index.html';

async function openCmf(page, width) {
  await page.setViewportSize({width, height:900});
  await page.goto(portal, {waitUntil:'domcontentloaded'});
  await page.locator('.menu-btn[data-app="cmf"]').click();
  const frame=page.frameLocator('#appFrame');
  await expect(frame.locator('#cmfPatientCard')).toBeVisible({timeout:30000});
  await expect(frame.locator('#cmfClinicalContent')).toBeVisible();
  return frame;
}

for (const width of [1440,390]) {
  test('CMF 1-2-3 '+width+'px: jerarquía compacta sin marca de agua, preservando receta',async ({page})=>{
    const frame=await openCmf(page,width);
    await expect(frame.locator('#p_nombre')).toBeVisible();
    await expect(frame.locator('#tplAdulto')).toBeVisible();
    await expect(frame.locator('#receta')).toBeVisible();
    await expect(frame.locator('#indicaciones')).toBeVisible();
    await expect(frame.locator('#cmfDocumentOptions h2')).toContainText('2)');
    await expect(frame.locator('#cmfClinicalContent h2')).toContainText('3)');
    const layout=await frame.locator('body').evaluate(()=>{
      const rect=id=>document.getElementById(id)?.getBoundingClientRect();
      const a=rect('cmfPatientCard'), b=rect('cmfDocumentOptions'),
            c=rect('cmfClinicalContent');
      const logo=document.querySelector('body > header.no-print img[alt="Maxilofacial PRO+"]');
      const panel=document.getElementById('orionClinicalEditPane');
      const pseudo=getComputedStyle(panel,'::before');
      return {
        patient:a&&{top:a.top,bottom:a.bottom},
        options:b&&{top:b.top,left:b.left,right:b.right},
        content:c&&{top:c.top,left:c.left},
        viewWidth:document.documentElement.clientWidth,
        scrollWidth:document.documentElement.scrollWidth,
        logoWidth:logo?.getBoundingClientRect().width||0,
        logoSrc:logo?.getAttribute('src')||'',
        watermarkImage:pseudo.backgroundImage,
        watermarkOpacity:Number(pseudo.opacity),
        paneIds:['cmfPatientCard','cmfDocumentOptions','cmfClinicalContent']
          .every(id=>document.querySelectorAll('#'+id).length===1),
        recipeWithinContent:document.getElementById('receta')
          .closest('#cmfClinicalContent')!==null,
        pDxWithinOptions:document.getElementById('p_dx')
          .closest('#cmfDocumentOptions')!==null,
        allPrintPages:['printSheet','printSheet2','printDoc','printExamLab',
          'printExamImg','printInter'].every(id=>Boolean(document.getElementById(id)))
      };
    });
    expect(layout.paneIds&&layout.recipeWithinContent&&layout.pDxWithinOptions).toBe(true);
    expect(layout.allPrintPages).toBe(true);
    expect(layout.patient.bottom).toBeLessThan(layout.options.top+15);
    expect(layout.logoSrc).toContain('maxilofacial-pro-plus.svg');
    expect(layout.watermarkOpacity).toBe(1);
    expect(layout.scrollWidth).toBeLessThanOrEqual(layout.viewWidth+4);
    if(width>=1081){
      expect(layout.logoWidth).toBeLessThanOrEqual(160);
      expect(layout.options.left).toBeLessThan(layout.content.left);
      expect(Math.abs(layout.options.top-layout.content.top)).toBeLessThan(10);
      expect(layout.options.right).toBeLessThan(layout.content.left);
    }else{
      expect(layout.logoWidth).toBeLessThanOrEqual(110);
      expect(layout.options.top).toBeLessThan(layout.content.top);
    }
    // El formulario real mantiene los identificadores y la escritura del profesional.
    await frame.locator('#p_nombre').fill('Paciente ficticio de revisión');
    await frame.locator('#receta').fill('Texto de prueba; no es una indicación clínica.');
    await expect(frame.locator('#receta'))
      .toHaveValue('Texto de prueba; no es una indicación clínica.');
  });
}

test('CMF V4.3.44 no introduce reglas de impresión ni toca documentos Statement',async ({page})=>{
  const frame=await openCmf(page,1440);
  const data=await frame.locator('body').evaluate(()=>{
    const css=[...document.styleSheets].find(sheet=>sheet.href?.includes('cmf-workflow-123-v1.css'));
    return {
      loaded:!!css,
      mediaOnly:css?.cssRules.length>0 && [...css.cssRules].every(rule=>
        rule.type===CSSRule.MEDIA_RULE && /\bscreen\b/.test(rule.conditionText)),
      pdfNodes:['printSheet','printSheet2','printDoc','printExamLab',
        'printExamImg','printInter'].every(id=>document.getElementById(id)?.classList.contains('page')),
      logoOriginal:Boolean(document.querySelector('body > header.no-print img[alt="Maxilofacial PRO+"]'))
    };
  });
  expect(data.loaded&&data.mediaOnly&&data.pdfNodes&&data.logoOriginal).toBe(true);
});
