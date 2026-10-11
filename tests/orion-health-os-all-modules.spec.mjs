import {test,expect} from '@playwright/test';

const portal='/apps/orion-health/index.html';

async function openModule(page,key,selector){
  await page.goto(portal,{waitUntil:'domcontentloaded'});
  await expect(page.locator('.menu-btn[data-app]')).toHaveCount(7);
  await page.locator('.menu-btn[data-app="'+key+'"]').click();
  const frame=page.frameLocator('#appFrame');
  await expect(frame.locator(selector)).toBeVisible({timeout:45000});
  return frame;
}

async function metrics(frame,expectedCss){
  return frame.locator('body').evaluate((_element,cssName)=>{
    const cssLoaded=[...document.styleSheets].some(s=>s.href?.includes(cssName));
    return{
      cssLoaded,
      bodyBackground:getComputedStyle(document.body).backgroundColor,
      font:getComputedStyle(document.body).fontFamily,
      clientWidth:document.documentElement.clientWidth,
      scrollWidth:document.documentElement.scrollWidth,
    };
  },expectedCss);
}

test('Insumos conserva catálogo y adopta superficies ORION Health OS',async({page})=>{
  const frame=await openModule(page,'insumos','#search');
  await expect(frame.locator('#orionCatalogCard')).toBeVisible();
  const m=await metrics(frame,'health-os-insumos-v1.css');
  const detail=await frame.locator('body').evaluate(()=>{
    const header=document.querySelector('body > header');
    const logo=header?.querySelector('img');
    return{
      title:header?.querySelector('h1')?.textContent||'',
      headerBackground:getComputedStyle(header).backgroundColor,
      logoSrc:logo?.getAttribute('src')||'',
      nodes:['episodio','pacienteNombre','search','selector','cantidad','addBtn','tabla','copiarBtn']
        .every(id=>Boolean(document.getElementById(id))),
      hasDataSource:!!document.getElementById('orionCatalogCard')
    };
  });
  expect(m.cssLoaded).toBe(true);
  expect(m.bodyBackground).toBe('rgb(243, 243, 243)');
  expect(m.font).toMatch(/Montserrat/);
  expect(detail.headerBackground).toBe('rgb(255, 255, 255)');
  expect(detail.logoSrc).toContain('orion-health.png');
  expect(detail.nodes && detail.hasDataSource).toBe(true);
  expect(m.scrollWidth).toBeLessThanOrEqual(m.clientWidth+3);
});

test('Endodoncia aplica Health OS exclusivamente a pantalla y conserva recetas',async({page})=>{
  const frame=await openModule(page,'endo','#p_nombre');
  const m=await metrics(frame,'health-os-endodoncia-v1.css');
  const d=await frame.locator('body').evaluate(()=>{
    const head=document.querySelector('body > header.no-print');
    const card=document.querySelector('body > main > section.card.no-print');
    return {
      title:head?.querySelector('h1')?.textContent||'',
      headerBg:head?getComputedStyle(head).backgroundColor:'',
      cardBg:card?getComputedStyle(card).backgroundColor:'',
      pages:!!document.getElementById('printSheet')&&!!document.getElementById('printSheet2'),
      fields:['p_nombre','p_rut','p_edad','p_peso','tplAdulto','tplPedia','btnDocCert'].every(id=>!!document.getElementById(id))
    };
  });
  expect(m.cssLoaded).toBe(true);
  expect(m.bodyBackground).toBe('rgb(243, 243, 243)');
  expect(d.headerBg).toBe('rgb(255, 255, 255)');
  expect(d.cardBg).toBe('rgb(255, 255, 255)');
  expect(d.pages && d.fields).toBe(true);
  await page.emulateMedia({media:'print'});
  await expect(frame.locator('header.no-print')).toBeHidden();
  expect(await frame.locator('#printSheet').evaluate(el=>getComputedStyle(el).display)).not.toBe('none');
});

for(const module of [
  {key:'orto',name:'Ortodoncia'},
  {key:'odontopediatria',name:'Odontopediatría'}
]){
  test(module.name+' utiliza componentes compartidos y logo oficial',async({page})=>{
    const frame=await openModule(page,module.key,'#fSearch');
    const m=await metrics(frame,'health-os-messaging-v1.css');
    const d=await frame.locator('body').evaluate(()=>{
      const head=document.querySelector('.topbar');
      const logo=document.querySelector('.topbar .orion-health-os-logo');
      const nav=document.querySelector('#tabMensajeria');
      return{
        topbarBg:head?getComputedStyle(head).backgroundColor:'',
        logoSrc:logo?.getAttribute('src')||'',
        logoHeight:logo?.getBoundingClientRect().height||0,
        navVisible:nav?.getBoundingClientRect().width>0,
        functionalFields:['fSearch','fTipo','btnApply','btnLoad','tabIngreso','tbody']
          .every(id=>!!document.getElementById(id)),
        hasSheets:!!document.getElementById('sheetPac'),
        filterCols:getComputedStyle(document.querySelector('.filters-grid')).gridTemplateColumns.split(' ').length
      };
    });
    expect(m.cssLoaded).toBe(true);
    expect(m.bodyBackground).toBe('rgb(243, 243, 243)');
    expect(m.font).toMatch(/Montserrat/);
    expect(d.topbarBg).toBe('rgb(31, 63, 91)');
    expect(d.logoSrc).toContain('orion-health.png');
    expect(d.logoHeight).toBeGreaterThan(30);
    expect(d.navVisible&&d.functionalFields&&d.hasSheets).toBe(true);
    if((page.viewportSize()?.width||0)<=520) expect(d.filterCols).toBe(1);
    else expect(d.filterCols).toBeGreaterThan(1);
    expect(m.scrollWidth).toBeLessThanOrEqual(m.clientWidth+3);
  });
}

test('Mensajería clínica en móvil conserva navegación y filtros sin desborde',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  const frame=await openModule(page,'odontopediatria','#fSearch');
  const m=await metrics(frame,'health-os-messaging-v1.css');
  const d=await frame.locator('body').evaluate(()=>{
    const tabs=document.querySelector('.topbar .tabs');
    return{
      display:getComputedStyle(tabs).display,
      gridColumns:getComputedStyle(document.querySelector('.filters-grid')).gridTemplateColumns.split(' ').length,
      logoHeight:document.querySelector('.orion-health-os-logo')?.getBoundingClientRect().height||0,
      navCount:document.querySelectorAll('.topbar .tabBtn').length
    };
  });
  expect(m.cssLoaded).toBe(true);
  expect(d.display).toBe('flex');
  expect(d.gridColumns).toBe(1);
  expect(d.navCount).toBe(3);
  expect(d.logoHeight).toBeGreaterThan(30);
  expect(m.scrollWidth).toBeLessThanOrEqual(m.clientWidth+3);
});

test('Armonización carga tema Health OS sin sustituir atlas ni motores',async({page})=>{
  const frame=await openModule(page,'armonizacion','#atlasShell');
  const m=await metrics(frame,'health-os-armonizacion-v1.css');
  const d=await frame.locator('body').evaluate(()=>{
    const head=document.querySelector('.oa-topbar');
    const logo=document.querySelector('.oa-brand-logo');
    return{
      themeClass:document.documentElement.classList.contains('oa-ui-v153'),
      topbarBg:head?getComputedStyle(head).backgroundColor:'',
      hasAtlas:!!document.getElementById('atlasImage')&&!!document.getElementById('pointLayer'),
      hasPatient:!!document.getElementById('patientName'),
      hasSave:!!document.getElementById('btnSaveTop'),
      logoSrc:logo?.getAttribute('src')||'',
    };
  });
  expect(m.cssLoaded).toBe(true);
  expect(m.bodyBackground).toBe('rgb(243, 243, 243)');
  expect(d.themeClass).toBe(true);
  expect(d.topbarBg).toBe('rgb(31, 63, 91)');
  expect(d.hasAtlas&&d.hasPatient&&d.hasSave).toBe(true);
  expect(d.logoSrc).toContain('orion-health.png');
});
