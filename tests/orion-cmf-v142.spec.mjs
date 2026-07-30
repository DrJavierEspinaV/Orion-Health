import {test,expect} from '@playwright/test';

const appUrl='/apps/orion-health/index.html';

async function openCmf(page){
  await page.setViewportSize({width:390,height:844});
  await page.goto(appUrl,{waitUntil:'domcontentloaded'});
  await page.locator('.menu-btn[data-app="cmf"]').click();
  await page.waitForFunction(()=>{
    const frame=document.getElementById('appFrame');
    try{return !!frame?.contentWindow?.location?.pathname?.includes('/modules/cmf/');}catch(_){return false;}
  },null,{timeout:30000});
  const frame=page.frameLocator('#appFrame');
  await expect(frame.locator('body')).toContainText(/Control clínico CMF/i,{timeout:30000});
  await expect(frame.locator('.orion-doc-type-controls')).toBeVisible();
  return frame;
}

async function domClick(frame,id){
  await frame.locator('body').evaluate((_,targetId)=>document.getElementById(targetId)?.click(),id);
}

async function selectExam(frame,id){
  await frame.locator(`#${id}`).evaluate(input=>{
    input.checked=true;
    input.dispatchEvent(new Event('change',{bubbles:true}));
  });
}

test('CMF V1.4.2 contiene controles y selector de modo dentro del teléfono',async({page})=>{
  const frame=await openCmf(page);
  const metrics=await frame.locator('body').evaluate(()=>{
    const row=document.querySelector('.orion-doc-type-controls');
    const actions=document.querySelector('.orion-doc-actions');
    const mode=document.querySelector('.orion-mode-switch');
    const labels=Array.from(mode?.querySelectorAll('.chip')||[]).map(element=>element.getBoundingClientRect());
    const rowBox=row?.getBoundingClientRect();
    const actionsBox=actions?.getBoundingClientRect();
    return{
      scrollWidth:document.documentElement.scrollWidth,
      clientWidth:document.documentElement.clientWidth,
      rowRight:rowBox?.right||0,
      actionsRight:actionsBox?.right||0,
      viewport:window.innerWidth,
      stacked:labels.length===2&&labels[1].top>labels[0].bottom-2,
      modeWidth:mode?.getBoundingClientRect().width||0
    };
  });
  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth+3);
  expect(metrics.rowRight).toBeLessThanOrEqual(metrics.viewport+2);
  expect(metrics.actionsRight).toBeLessThanOrEqual(metrics.viewport+2);
  expect(metrics.stacked).toBeTruthy();
  expect(metrics.modeWidth).toBeLessThanOrEqual(metrics.viewport);
});

test('Exámenes permite arrastre central y muestra acciones bajo pestañas',async({page})=>{
  const frame=await openCmf(page);
  await domClick(frame,'btnDocExams');
  await expect(frame.locator('#examDrawer')).toBeVisible();
  await expect(frame.locator('.orion-exam-scroll-area')).toBeVisible();
  await expect(frame.locator('.orion-exam-actions-top')).toBeVisible();

  const result=await frame.locator('body').evaluate(()=>{
    const area=document.querySelector('.orion-exam-scroll-area');
    const actions=document.querySelector('.orion-exam-actions-top');
    const firstPanel=document.getElementById('examPanelLab');
    if(!area||!actions||!firstPanel) return null;

    area.scrollTop=0;
    const start=new Event('touchstart',{bubbles:true,cancelable:true});
    Object.defineProperty(start,'touches',{value:[{clientY:640}]});
    area.dispatchEvent(start);
    const move=new Event('touchmove',{bubbles:true,cancelable:true});
    Object.defineProperty(move,'touches',{value:[{clientY:300}]});
    area.dispatchEvent(move);

    const style=getComputedStyle(area);
    const actionBox=actions.getBoundingClientRect();
    const panelBox=firstPanel.getBoundingClientRect();
    return{
      scrollTop:area.scrollTop,
      scrollHeight:area.scrollHeight,
      clientHeight:area.clientHeight,
      overflowY:style.overflowY,
      touchAction:style.touchAction,
      actionBeforePanel:actionBox.top<=panelBox.top,
      buttons:Array.from(actions.querySelectorAll('button')).map(button=>button.getBoundingClientRect().width)
    };
  });

  expect(result).not.toBeNull();
  expect(result.scrollHeight).toBeGreaterThan(result.clientHeight);
  expect(result.scrollTop).toBeGreaterThan(50);
  expect(['auto','scroll']).toContain(result.overflowY);
  expect(result.touchAction).toContain('pan-y');
  expect(result.actionBeforePanel).toBeTruthy();
  expect(result.buttons).toHaveLength(2);
  expect(result.buttons.every(width=>width>100)).toBeTruthy();
});

test('Firma de órdenes se rasteriza como PNG visible en Android y PDF',async({page})=>{
  const frame=await openCmf(page);
  await frame.locator('#p_nombre').fill('Paciente Firma PNG');
  await frame.locator('#p_rut').fill('12.345.678-9');
  await frame.locator('#p_edad').fill('40');
  await frame.locator('#p_dx').fill('Evaluación preoperatoria');

  await domClick(frame,'btnDocExams');
  await frame.locator('#examPanelLab details').first().evaluate(element=>{element.open=true;});
  await selectExam(frame,'ex_lab_hem_comp');
  await domClick(frame,'tabExamImg');
  await frame.locator('#examPanelImg details').first().evaluate(element=>{element.open=true;});
  await selectExam(frame,'ex_img_pano');
  await domClick(frame,'btnExamClose');
  await page.waitForTimeout(350);
  await domClick(frame,'orionClinicalTabPreview');

  await frame.locator('body').evaluate(()=>window.ORION_CMF_SIGNATURE_V142?.ready());
  await expect(frame.locator('#printExamLab .firmaimg')).toBeVisible();
  await expect(frame.locator('#printExamImg .firmaimg')).toBeVisible();

  const signatures=await frame.locator('body').evaluate(()=>{
    const read=selector=>{
      const image=document.querySelector(selector);
      return image?{
        src:image.getAttribute('src')||'',
        naturalWidth:image.naturalWidth,
        naturalHeight:image.naturalHeight,
        format:image.dataset.orionSignatureFormat||'',
        display:getComputedStyle(image).display
      }:null;
    };
    return{
      lab:read('#printExamLab .firmaimg'),
      img:read('#printExamImg .firmaimg'),
      config:window.ORION_CMF_SIGNATURE_V142?.format()||''
    };
  });

  for(const signature of [signatures.lab,signatures.img]){
    expect(signature).not.toBeNull();
    expect(signature.src.startsWith('data:image/png')).toBeTruthy();
    expect(signature.naturalWidth).toBeGreaterThan(0);
    expect(signature.naturalHeight).toBeGreaterThan(0);
    expect(signature.format).toBe('png-v142');
    expect(signature.display).not.toBe('none');
  }
  expect(signatures.config).toBe('png-data-url');
});
