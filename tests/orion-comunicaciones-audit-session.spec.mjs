import { test, expect } from '@playwright/test';

async function openComms(page) {
  await page.goto('/apps/orion-health/index.html', { waitUntil: 'domcontentloaded' });
  await page.locator('.menu-btn[data-app="comunicaciones"]').click();
  const frame = page.frameLocator('#appFrame');
  await expect(frame.locator('#orionAuditToolbar')).toBeVisible({ timeout: 30000 });
  return frame;
}

async function addSyntheticRow(frame) {
  await frame.locator('#list').evaluate(list => {
    const row = document.createElement('div');
    row.className = 'row';
    row.innerHTML =
      '<div><div class="paciente-nombre">CASO FICTICIO</div>' +
      '<div class="wa-row-line"><a class="wa-action" href="#">WhatsApp</a></div></div>' +
      '<div>TEST-RUN</div><div>18/10/2026</div><div>12:30</div>' +
      '<div>PENDIENTE</div><div>CONTROL</div>';
    list.appendChild(row);
  });
}

test('bitácora ORION distingue apertura, confirmación humana, respuesta y corrección', async ({ page }) => {
  const frame = await openComms(page);
  await addSyntheticRow(frame);
  const status = frame.locator('.orion-audit-status');
  await expect(status).toHaveText('Sin registro de comunicación');
  await expect(frame.locator('.orion-audit-actions button')).toHaveCount(3);

  await frame.locator('a.wa-action').click();
  await expect(status).toContainText('envío sin verificar');
  let events = await frame.locator('body').evaluate(() =>
    JSON.parse(sessionStorage.getItem('orion_comunicaciones_bitacora_sesion_v1') || '{}').events || []);
  expect(events).toHaveLength(1);
  expect(events[0].type).toBe('enlace_seleccionado');
  expect(events[0]).not.toHaveProperty('telefono');
  expect(events[0]).not.toHaveProperty('mensaje');

  page.on('dialog', dialog => dialog.accept());
  await frame.getByRole('button', { name: 'Confirmé envío' }).click();
  await expect(status).toHaveText('Envío confirmado manualmente');
  await frame.getByRole('button', { name: 'Registré respuesta' }).click();
  await expect(status).toHaveText('Respuesta registrada manualmente');

  const downloadPromise = page.waitForEvent('download');
  await frame.getByRole('button', { name: 'Exportar bitácora CSV' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('ORION_Comunicaciones_Bitacora_Sesion.csv');

  await frame.getByRole('button', { name: 'Corregir' }).click();
  await expect(status).toContainText('corrección registrada');
  events = await frame.locator('body').evaluate(() =>
    JSON.parse(sessionStorage.getItem('orion_comunicaciones_bitacora_sesion_v1') || '{}').events || []);
  expect(events.map(e => e.type)).toEqual([
    'enlace_seleccionado', 'envio_confirmado_manual', 'respuesta_registrada_manual', 'correccion_manual'
  ]);
});

test('bitácora móvil respeta ancho y no crea registros automáticamente', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const frame = await openComms(page);
  await expect(frame.locator('#orionAuditSummary')).toContainText('Sin verificar: 0');
  await addSyntheticRow(frame);
  await expect(frame.getByRole('button', { name: 'Confirmé envío' })).toBeVisible();
  const saved = await frame.locator('body').evaluate(() => ({
    events: sessionStorage.getItem('orion_comunicaciones_bitacora_sesion_v1'),
    overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 3
  }));
  expect(saved.events).toBeNull();
  expect(saved.overflow).toBe(false);
});
