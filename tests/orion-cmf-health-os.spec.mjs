import {test,expect} from '@playwright/test';

const portal='/apps/orion-health/index.html';

async function openCmf(page){
  await page.goto(portal,{waitUntil:'domcontentloaded'});
  await expect(page.locator('body')).toHaveClass(/route-selector-mode/);
  await page.locator('.menu-btn[data-app="cmf"]').click();
  const frame=page.frameLocator('#appFrame');
  await expect(frame.locator('#p_nombre')).toBeVisible({timeout:30000});
  await expect(frame.locator('#orionClinicalTabEdit')).toBeVisible({timeout:30000});
  return frame;
}

test('CMF utiliza identidad Health OS y mantiene el formulario de prescripción',async({page})=>{
  await page.setViewportSize({width:1440,height:900});
  const frame=await openCmf(page);

  const observed=await frame.locator('body').evaluate(()=>{
    const header=document.querySelector('body > header.no-print');
    const logo=header?.querySelector('img[alt="Maxilofacial PRO+"]');
    const firstCard=document.querySelector('#orionClinicalEditPane > section.card.no-print');
    const tab=document.getElementById('orionClinicalTabEdit');
    const name=document.getElementById('p_nombre');
    const print=document.getElementById('printSheet');
    const css=[...document.styleSheets].find(s=>s.href?.includes('health-os-cmf-v1.css'));
    return {
      cssLoaded:Boolean(css),
      rulesScreenOnly:css?.cssRules.length>0&&[...css.cssRules].every(rule=>rule.type===CSSRule.MEDIA_RULE&&/screen/.test(rule.conditionText)),
      background:getComputedStyle(document.body).backgroundColor,
      font:getComputedStyle(document.body).fontFamily,
      headerBackground:header?getComputedStyle(header).backgroundColor:'',
      logoSrc:logo?.getAttribute('src')||'',
      logoHeight:logo?.getBoundingClientRect().height||0,
      cardBackground:firstCard?getComputedStyle(firstCard).backgroundColor:'',
      cardRadius:firstCard?getComputedStyle(firstCard).borderTopLeftRadius:'',
      inputRadius:name?getComputedStyle(name).borderTopLeftRadius:'',
      tabActive:tab?.getAttribute('aria-selected'),
      printPageUnchanged:print?.classList.contains('page'),
      fields:['p_nombre','p_rut','p_edad','p_peso','tplAdulto','tplPedia','p_dx','receta','indicaciones']
        .every(id=>Boolean(document.getElementById(id))),
      docButtons:['btnDocCert','btnDocBiopsia','btnDocExams','btnDocInter']
        .every(id=>Boolean(document.getElementById(id))),
    };
  });

  expect(observed.cssLoaded).toBe(true);
  expect(observed.rulesScreenOnly).toBe(true);
  expect(observed.background).toBe('rgb(243, 243, 243)');
  expect(observed.font).toMatch(/Montserrat/);
  expect(observed.headerBackground).toBe('rgb(255, 255, 255)');
  expect(observed.logoSrc).toContain('maxilofacial-pro-plus.svg');
  expect(observed.logoHeight).toBeGreaterThan(45);
  expect(observed.logoHeight).toBeLessThanOrEqual(78);
  expect(observed.cardBackground).toBe('rgb(255, 255, 255)');
  expect(observed.cardRadius).toBe('16px');
  expect(observed.inputRadius).toBe('10px');
  expect(observed.tabActive).toBe('true');
  expect(observed.printPageUnchanged&&observed.fields&&observed.docButtons).toBe(true);
});

test('CMF móvil prioriza edición legible sin desborde y conserva documentos',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  const frame=await openCmf(page);
  const observed=await frame.locator('body').evaluate(()=>{
    const html=document.documentElement;
    const logo=document.querySelector('body > header.no-print img[alt="Maxilofacial PRO+"]');
    const tabs=document.getElementById('orionClinicalTabs');
    const buttons=['btnDocCert','btnDocBiopsia','btnDocExams','btnDocInter'];
    return {
      mobileClass:document.body.classList.contains('orion-cmf-mobile'),
      width:html.clientWidth,
      scrollWidth:html.scrollWidth,
      logoHeight:logo?.getBoundingClientRect().height||0,
      tabsColumns:getComputedStyle(tabs).gridTemplateColumns.split(' ').length,
      allActionsWithinViewport:buttons.every(id=>{
        const rect=document.getElementById(id)?.getBoundingClientRect();
        return rect&&rect.left>=-2&&rect.right<=html.clientWidth+2;
      }),
      printIds:['printSheet','printSheet2','printDoc','printExamLab','printExamImg','printInter']
        .every(id=>Boolean(document.getElementById(id))),
    };
  });
  expect(observed.mobileClass).toBe(true);
  expect(observed.scrollWidth).toBeLessThanOrEqual(observed.width+3);
  expect(observed.logoHeight).toBeLessThanOrEqual(58);
  expect(observed.tabsColumns).toBe(2);
  expect(observed.allActionsWithinViewport).toBe(true);
  expect(observed.printIds).toBe(true);
});

test('La capa Health OS de CMF no invade los estilos de impresión Statement',async({page})=>{
  const frame=await openCmf(page);
  const cssScope=await frame.locator('body').evaluate(()=>{
    const sheet=[...document.styleSheets].find(s=>s.href?.includes('/health-os-cmf-v1.css'));
    return {
      exists:Boolean(sheet),
      cssRules:sheet?.cssRules.length||0,
      allRulesScreenOnly:[...sheet.cssRules].every(rule=>
        rule.type===CSSRule.MEDIA_RULE&&/screen/.test(rule.conditionText)
      ),
      printPages:['printSheet','printSheet2','printDoc','printExamLab','printExamImg','printInter']
        .map(id=>document.getElementById(id)).every(Boolean),
      footerCount:document.querySelectorAll('[id^="fixedFoot"]').length
    };
  });
  expect(cssScope.exists).toBe(true);
  expect(cssScope.cssRules).toBeGreaterThan(0);
  expect(cssScope.allRulesScreenOnly).toBe(true);
  expect(cssScope.printPages).toBe(true);
  expect(cssScope.footerCount).toBeGreaterThanOrEqual(6);
  await page.emulateMedia({media:'print'});
  await expect(frame.locator('body > header.no-print')).toBeHidden();
  const printDisplay=await frame.locator('#printSheet').evaluate(el=>getComputedStyle(el).display);
  expect(printDisplay).not.toBe('none');
});

test('El CSS propio de CMF no aparece en Comunicaciones',async({page})=>{
  await page.goto(portal,{waitUntil:'domcontentloaded'});
  await page.locator('.menu-btn[data-app="comunicaciones"]').click();
  const frame=page.frameLocator('#appFrame');
  await expect(frame.locator('#orionPatientPriorityControls')).toBeVisible({timeout:30000});
  const hasCmfCss=await frame.locator('body').evaluate(()=>
    [...document.styleSheets].some(sheet=>sheet.href?.includes('health-os-cmf-v1.css'))
  );
  expect(hasCmfCss).toBe(false);
});
