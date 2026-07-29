import {test,expect} from '@playwright/test';

const appUrl='/apps/orion-health/index.html';

async function openCmf(page){
  await page.goto(appUrl,{waitUntil:'domcontentloaded'});
  await page.locator('.menu-btn[data-app="cmf"]').click();
  await page.waitForFunction(()=>{
    const frame=document.getElementById('appFrame');
    try{return !!frame?.contentWindow?.location?.pathname?.includes('/modules/cmf/');}catch(_){return false;}
  },null,{timeout:30000});
  const frame=page.frameLocator('#appFrame');
  await expect(frame.locator('body')).toContainText(/Control clínico CMF/i,{timeout:30000});
  return frame;
}

test('ORION se adapta al teléfono vertical sin desborde horizontal',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  const frame=await openCmf(page);

  const portalMetrics=await page.evaluate(()=>{
    const buttons=[...document.querySelectorAll('.menu-btn')].slice(0,2).map(el=>el.getBoundingClientRect());
    return{
      scrollWidth:document.documentElement.scrollWidth,
      clientWidth:document.documentElement.clientWidth,
      sameRow:buttons.length===2&&Math.abs(buttons[0].top-buttons[1].top)<4,
      separateColumns:buttons.length===2&&buttons[1].left>buttons[0].left
    };
  });
  expect(portalMetrics.scrollWidth).toBeLessThanOrEqual(portalMetrics.clientWidth+3);
  expect(portalMetrics.sameRow).toBeTruthy();
  expect(portalMetrics.separateColumns).toBeTruthy();

  await frame.locator('#btnDocExams').click();
  await expect(frame.locator('#examDrawer')).toBeVisible();
  const cmfMetrics=await frame.locator('body').evaluate(()=>{
    const drawer=document.getElementById('examDrawer')?.getBoundingClientRect();
    return{
      scrollWidth:document.documentElement.scrollWidth,
      clientWidth:document.documentElement.clientWidth,
      drawerLeft:drawer?.left??-1,
      drawerRight:drawer?.right??-1,
      viewport:window.innerWidth
    };
  });
  expect(cmfMetrics.scrollWidth).toBeLessThanOrEqual(cmfMetrics.clientWidth+3);
  expect(cmfMetrics.drawerLeft).toBeGreaterThanOrEqual(-1);
  expect(cmfMetrics.drawerRight).toBeLessThanOrEqual(cmfMetrics.viewport+1);
});

test('CMF conserva exámenes al cerrar y firma documentos autorizados',async({page})=>{
  const frame=await openCmf(page);
  await frame.locator('#p_nombre').fill('Paciente Documento');
  await frame.locator('#p_rut').fill('12.345.678-9');
  await frame.locator('#p_edad').fill('40');
  await frame.locator('#p_dx').fill('Evaluación preoperatoria');

  await frame.locator('#btnDocExams').click();
  await frame.locator('#ex_lab_hem_comp').check({force:true});
  await frame.locator('#tabExamImg').click();
  await frame.locator('#ex_img_pano').check({force:true});
  await frame.locator('#btnExamClose').click();
  await page.waitForTimeout(300);

  await expect(frame.locator('#printExamLab')).not.toHaveClass(/hidden/);
  await expect(frame.locator('#printExamImg')).not.toHaveClass(/hidden/);
  await expect(frame.locator('#v_doc_lab')).toContainText('Hematología completa');
  await expect(frame.locator('#v_doc_img')).toContainText('Rx Panorámica');

  await frame.locator('#orionClinicalTabPreview').click();
  await expect(frame.locator('#printExamLab .firmaimg')).toBeVisible();
  await expect(frame.locator('#printExamImg .firmaimg')).toBeVisible();

  await frame.locator('#orionClinicalTabEdit').click();
  await frame.locator('#btnDocCert').click();
  await frame.locator('#orionClinicalTabPreview').click();
  await expect(frame.locator('#printDoc')).not.toHaveClass(/hidden/);
  await expect(frame.locator('#printDoc .firmaimg')).toBeVisible();

  await frame.locator('#orionClinicalTabEdit').click();
  await frame.locator('#btnDocInter').click();
  await frame.locator('#interEsp').fill('Medicina Interna');
  await frame.locator('#interTextoLibre').fill('Evaluación de condición sistémica previa a cirugía.');
  await frame.locator('#btnInterGenerate').click();
  await frame.locator('#orionClinicalTabPreview').click();
  await expect(frame.locator('#printInter')).not.toHaveClass(/hidden/);
  await expect(frame.locator('#printInter .firmaimg')).toBeVisible();

  const signatureScope=await frame.locator('body').evaluate(()=>({
    recipe:getComputedStyle(document.querySelector('#printSheet .firmaimg')).display,
    indications:getComputedStyle(document.querySelector('#printSheet2 .firmaimg')).display,
    document:getComputedStyle(document.querySelector('#printDoc .firmaimg')).display,
    lab:getComputedStyle(document.querySelector('#printExamLab .firmaimg')).display,
    image:getComputedStyle(document.querySelector('#printExamImg .firmaimg')).display,
    inter:getComputedStyle(document.querySelector('#printInter .firmaimg')).display,
    sync:window.ORION_CMF_DOCS_V141?.version||''
  }));
  expect(signatureScope.recipe).not.toBe('none');
  expect(signatureScope.indications).toBe('none');
  expect(signatureScope.document).not.toBe('none');
  expect(signatureScope.lab).not.toBe('none');
  expect(signatureScope.image).not.toBe('none');
  expect(signatureScope.inter).not.toBe('none');
  expect(signatureScope.sync).toBe('1.4.1');
});
