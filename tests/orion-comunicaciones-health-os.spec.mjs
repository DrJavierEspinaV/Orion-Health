import { test, expect } from '@playwright/test';

const portalUrl = '/apps/orion-health/index.html';

async function openComunicaciones(page) {
  await page.goto(portalUrl, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('body')).toHaveClass(/route-selector-mode/);
  await page.locator('.menu-btn[data-app="comunicaciones"]').click();
  await expect(page.locator('body')).toHaveClass(/module-selected/);
  const frame = page.frameLocator('#appFrame');
  await expect(frame.locator('#orionPatientPriorityControls')).toBeVisible();
  await expect(frame.locator('.crm-left #mensajeTipo')).toBeVisible();
  return frame;
}

test('Comunicaciones aplica identidad Health OS a cabecera y controles sin alterar la operación', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const frame = await openComunicaciones(page);

  const metrics = await frame.locator('body').evaluate(() => {
    const header = document.querySelector('#orionHdr');
    const logo = header?.querySelector('img');
    const layout = document.querySelector('.crm-layout');
    const fields = document.querySelector('#q');
    const values = getComputedStyle(document.body);
    return {
      cssLoaded: [...document.styleSheets].some(s => s.href?.includes('health-os-comunicaciones-v1.css')),
      background: values.backgroundColor,
      font: values.fontFamily,
      headerBackground: header ? getComputedStyle(header).backgroundColor : '',
      logoSrc: logo?.getAttribute('src') || '',
      logoHeight: logo ? logo.getBoundingClientRect().height : 0,
      columns: layout ? getComputedStyle(layout).gridTemplateColumns.split(' ').map(Number.parseFloat) : [],
      inputRadius: fields ? getComputedStyle(fields).borderTopLeftRadius : '',
      hasPatientList: !!document.querySelector('.crm-sidebar > .card.table'),
      hasMessages: !!document.querySelector('#mensajeTipo'),
      hasDataPanel: !!document.querySelector('#orionDataSourcePanel'),
      horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 3,
    };
  });

  expect(metrics.cssLoaded).toBe(true);
  expect(metrics.background).toBe('rgb(243, 243, 243)');
  expect(metrics.font).toMatch(/Montserrat/);
  expect(metrics.headerBackground).toBe('rgb(255, 255, 255)');
  expect(metrics.logoSrc).toContain('orion-comunicaciones.png');
  expect(metrics.logoHeight).toBeGreaterThan(30);
  expect(metrics.logoHeight).toBeLessThanOrEqual(64);
  expect(metrics.columns).toHaveLength(2);
  expect(metrics.columns[1]).toBeGreaterThan(metrics.columns[0]);
  expect(metrics.inputRadius).toBe('10px');
  expect(metrics.hasPatientList && metrics.hasMessages && metrics.hasDataPanel).toBe(true);
  expect(metrics.horizontalOverflow).toBe(false);
});

test('Comunicaciones es legible en móvil y prioriza pacientes sin desborde', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const frame = await openComunicaciones(page);
  const metrics = await frame.locator('body').evaluate(() => {
    const layout = document.querySelector('.crm-layout');
    const header = document.querySelector('#orionHdr');
    const logo = header?.querySelector('img');
    const sidebar = document.querySelector('.crm-sidebar');
    const left = document.querySelector('.crm-left');
    return {
      mobileMode: document.body.classList.contains('orion-communications-mobile'),
      isPatientsFirst: sidebar?.nextElementSibling === left,
      layoutDisplay: layout ? getComputedStyle(layout).display : '',
      layoutDirection: layout ? getComputedStyle(layout).flexDirection : '',
      documentWidth: document.documentElement.scrollWidth,
      viewportWidth: document.documentElement.clientWidth,
      logoHeight: logo?.getBoundingClientRect().height || 0,
      searchVisible: !!document.querySelector('#q'),
      messageVisible: !!document.querySelector('#mensajeTipo'),
      dataPanel: !!document.querySelector('#orionDataSourcePanel'),
    };
  });

  expect(metrics.mobileMode).toBe(true);
  expect(metrics.isPatientsFirst).toBe(true);
  expect(metrics.layoutDisplay).toBe('flex');
  expect(metrics.layoutDirection).toBe('column');
  expect(metrics.documentWidth).toBeLessThanOrEqual(metrics.viewportWidth + 3);
  expect(metrics.logoHeight).toBeLessThanOrEqual(48);
  expect(metrics.searchVisible && metrics.messageVisible && metrics.dataPanel).toBe(true);
});

test('CSS exclusivo de Comunicaciones no se inyecta en CMF', async ({ page }) => {
  await page.goto(portalUrl, { waitUntil: 'domcontentloaded' });
  await page.locator('.menu-btn[data-app="cmf"]').click();
  const frame = page.frameLocator('#appFrame');
  await expect(frame.locator('#tplAdulto')).toBeVisible();
  const loaded = await frame.locator('body').evaluate(() =>
    [...document.styleSheets].some(s => s.href?.includes('health-os-comunicaciones-v1.css'))
  );
  expect(loaded).toBe(false);
});
