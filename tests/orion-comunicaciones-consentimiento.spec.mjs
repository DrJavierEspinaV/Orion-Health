import { test, expect } from '@playwright/test';

const portal = '/apps/orion-health/index.html';

async function openComunicaciones(page) {
  // Instrumentación exclusiva de Playwright: las funciones clínicas siguen
  // encapsuladas en la aplicación distribuida (sin API global de pruebas).
  await page.route('**/modules/comunicaciones/source.html*', async route => {
    const response = await route.fetch();
    const html = await response.text();
    const end = '}); // DOMContentLoaded';
    if (!html.includes(end)) throw new Error('Ancla de instrumentación ausente');
    const instrumented = html.replace(end, `
window.__orionCommsTest = {
  prepRow,
  getManualLink,
  seed(rows) {
    DATA.splice(0, DATA.length, ...rows.map(prepRow));
    render();
  }
};
` + end);
    await route.fulfill({ response, body: instrumented });
  });
  await page.goto(portal, { waitUntil: 'domcontentloaded' });
  await page.locator('.menu-btn[data-app="comunicaciones"]').click();
  const frame = page.frameLocator('#appFrame');
  await expect(frame.locator('#tipoMensaje')).toBeVisible({ timeout: 30000 });
  return frame;
}

async function seedSyntheticPatients(frame) {
  await frame.locator('body').evaluate(() => {
    // Datos totalmente ficticios; no usa Drive ni contactos reales.
    window.__orionCommsTest.seed([
      {
        'Paciente': 'CASO SIN CONSENTIMIENTO',
        'RUN': '12.345.678-5', 'WhatsApp': '56911111111',
        'fecha': '19/10/2026', 'hora': '12:00', 'Estado': 'Citado'
      },
      {
        'Paciente': 'CASO CON CONSENTIMIENTO',
        'RUN': '11.111.111-1', 'WhatsApp': '56922222222',
        'fecha': '19/10/2026', 'hora': '13:00', 'Estado': 'Citado',
        'Consentimiento Promociones': 'Sí'
      }
    ]);
  });
}

test('promoción bloqueada por defecto y permitida solo con autorización explícita', async ({ page }) => {
  const frame = await openComunicaciones(page);
  await seedSyntheticPatients(frame);

  await frame.locator('#tipoMensaje').selectOption('promocion');
  const rows = frame.locator('#list .row');
  await expect(rows).toHaveCount(2);
  const blocked = rows.filter({ hasText: 'CASO SIN CONSENTIMIENTO' });
  const allowed = rows.filter({ hasText: 'CASO CON CONSENTIMIENTO' });
  await expect(blocked.locator('.orion-promo-blocked')).toContainText('consentimiento no registrado');
  await expect(blocked.locator('a.wa-action')).toHaveCount(0);
  await expect(allowed.locator('a.wa-action')).toHaveCount(1);

  await frame.locator('#tipoMensaje').selectOption('ausente');
  await expect(blocked.locator('.orion-promo-blocked')).toHaveCount(0);
  await expect(blocked.locator('a.wa-action')).toHaveCount(1);

  await frame.locator('#tipoMensaje').selectOption('promocion');
  await expect(blocked.locator('a.wa-action')).toHaveCount(0);
});

test('un valor ambiguo o negativo de consentimiento no autoriza promociones', async ({ page }) => {
  const frame = await openComunicaciones(page);
  const parsed = await frame.locator('body').evaluate(() => [
    window.__orionCommsTest.prepRow({ 'Paciente': 'X', 'Consentimiento Promociones': 'NO' }).consentimientoPromociones,
    window.__orionCommsTest.prepRow({ 'Paciente': 'X', 'Consentimiento Promociones': 'pendiente' }).consentimientoPromociones,
    window.__orionCommsTest.prepRow({ 'Paciente': 'X', 'Consentimiento Promociones': '' }).consentimientoPromociones,
    window.__orionCommsTest.prepRow({ 'Paciente': 'X', 'Consentimiento Promociones': 'revocado' }).consentimientoPromociones,
    window.__orionCommsTest.prepRow({ 'Paciente': 'X', 'Consentimiento Promociones': true }).consentimientoPromociones
  ]);
  expect(parsed).toEqual([false, false, false, false, true]);
});

test('el envío manual promocional no conserva ni ejecuta un enlace previo', async ({ page }) => {
  const frame = await openComunicaciones(page);
  await frame.locator('#tipoMensaje').selectOption('ausente');
  await frame.locator('#manualPhone').fill('912345678');
  await frame.locator('#manualName').fill('PACIENTE FICTICIO');
  // Evitar abrir WhatsApp: comprobar únicamente preparación del enlace.
  await frame.locator('#manualOpen').evaluate(el => el.setAttribute('href', 'https://example.invalid/old-link'));
  await frame.locator('#tipoMensaje').selectOption('promocion');
  const result = await frame.locator('#manualOpen').evaluate(el => ({
    mode: document.getElementById('tipoMensaje').value,
    link: window.__orionCommsTest.getManualLink(),
    oldHref: el.getAttribute('href')
  }));
  expect(result.mode).toBe('promocion');
  expect(result.link).toBe('');
  // La navegación solo se bloquea al click: nunca queda habilitada la URL anterior.
  page.on('dialog', dialog => dialog.dismiss());
  await frame.locator('#manualOpen').evaluate(el => el.click());
  await expect(frame.locator('#manualOpen')).not.toHaveAttribute('href', /.+/);
});
