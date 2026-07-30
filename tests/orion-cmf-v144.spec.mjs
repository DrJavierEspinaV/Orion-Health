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

test('CMF V1.4.4 contiene Tipo de Receta y modos dentro del ancho móvil',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  const frame=await openCmf(page);
  await expect(frame.locator('body')).toHaveClass(/orion-cmf-mobile/);

  const metrics=await frame.locator('body').evaluate(()=>{
    const section=document.querySelector('section:has(#btnDocCert)');
    const header=section?.querySelector(':scope > .mb-4.flex.items-center.justify-between');
    const modes=section?.querySelector(':scope > .flex.gap-2.mb-4');
    const targets=[section,header,modes,...(header?[...header.querySelectorAll('button,input,label')]:[]),...(modes?[...modes.children]:[])].filter(Boolean);
    const rects=targets.map(element=>element.getBoundingClientRect());
    return{
      scrollWidth:document.documentElement.scrollWidth,
      clientWidth:document.documentElement.clientWidth,
      minLeft:Math.min(...rects.map(rect=>rect.left)),
      maxRight:Math.max(...rects.map(rect=>rect.right)),
      viewport:window.innerWidth,
      headerDisplay:header?getComputedStyle(header).display:'',
      modesDisplay:modes?getComputedStyle(modes).display:''
    };
  });

  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth+3);
  expect(metrics.minLeft).toBeGreaterThanOrEqual(-2);
  expect(metrics.maxRight).toBeLessThanOrEqual(metrics.viewport+2);
  expect(metrics.headerDisplay).toBe('block');
  expect(metrics.modesDisplay).toBe('grid');
});

test('CMF V1.4.4 deja acciones de exámenes arriba y scroll táctil central',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  const frame=await openCmf(page);
  await frame.locator('#btnDocExams').click();
  await expect(frame.locator('#examDrawer')).toBeVisible();
  await expect(frame.locator('.orion-exam-actions-inline')).toBeVisible();

  const drawer=await frame.locator('#examDrawer').evaluate(element=>{
    const content=element.querySelector(':scope > .p-4.space-y-3');
    const actions=element.querySelector('.orion-exam-actions-inline');
    const search=document.getElementById('examSearch')?.parentElement;
    const contentStyle=content?getComputedStyle(content):null;
    const actionsRect=actions?.getBoundingClientRect();
    return{
      actionsInsideContent:!!content&&!!actions&&actions.parentElement===content,
      actionsAfterSearch:!!search&&search.nextElementSibling===actions,
      overflowY:contentStyle?.overflowY||'',
      touchAction:contentStyle?.touchAction||'',
      actionsTop:actionsRect?.top??9999,
      viewportHeight:window.innerHeight
    };
  });

  expect(drawer.actionsInsideContent).toBeTruthy();
  expect(drawer.actionsAfterSearch).toBeTruthy();
  expect(drawer.overflowY).toBe('auto');
  expect(drawer.touchAction).toContain('pan-y');
  expect(drawer.actionsTop).toBeLessThan(drawer.viewportHeight*.55);
});

test('CMF V1.4.4 prepara la firma como PNG visible en Android y documentos',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  const frame=await openCmf(page);

  await expect.poll(async()=>frame.locator('#printSheet .firmaimg').getAttribute('data-orion-signature-format'),{timeout:10000}).toBe('png-data-uri');
  const signature=await frame.locator('#printSheet .firmaimg').evaluate(image=>({
    src:image.getAttribute('src')||'',
    srcset:image.getAttribute('srcset')||'',
    currentSrc:image.currentSrc||'',
    display:getComputedStyle(image).display
  }));

  expect(signature.src).toMatch(/firma-javier-espina-navy\.svg/);
  expect(signature.srcset).toMatch(/^blob:/);
  expect(signature.currentSrc).toMatch(/^blob:/);
  expect(signature.display).not.toBe('none');
});
