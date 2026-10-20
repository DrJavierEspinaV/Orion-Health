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
      '<div class="wa-row-line"><a class="btn whatsapp wa-action" href="#">WhatsApp</a></div></div>' +
      '<div>TEST-RUN</div><div>18/10/2026</div><div>12:30</div>' +
      '<div>PENDIENTE</div><div>CONTROL</div>';
    list.appendChild(row);
  });
}

test('bitácora ORION distingue apertura, confirmación humana, respuesta y corrección', async ({ page }) => {
  const frame = await openComms(page);
  await addSyntheticRow(frame);
  const status = frame.locator('.orion-audit-status');
  await expect(status).toBeHidden();
  const menu = frame.locator('.orion-audit-menu');
  await expect(menu).toHaveCount(1);
  await expect(menu).not.toHaveAttribute('open','');
  await expect(menu.locator('summary')).toBeVisible();
  await expect(frame.locator('.orion-audit-actions button')).toHaveCount(3);

  await frame.locator('a.wa-action').click();
  await expect(status).toHaveText('Abierto');
  let events = await frame.locator('body').evaluate(() =>
    JSON.parse(sessionStorage.getItem('orion_comunicaciones_bitacora_sesion_v1') || '{}').events || []);
  expect(events).toHaveLength(1);
  expect(events[0].type).toBe('enlace_seleccionado');
  expect(events[0]).not.toHaveProperty('telefono');
  expect(events[0]).not.toHaveProperty('mensaje');

  page.on('dialog', dialog => dialog.accept());
  await menu.locator('summary').click();
  await frame.getByRole('button', { name: 'Confirmé envío' }).click();
  await expect(status).toHaveText('Envío manual');
  await frame.getByRole('button', { name: 'Registré respuesta' }).click();
  await expect(status).toHaveText('Respondió');

  await frame.locator('#orionAuditToolbar > summary').click();
  const downloadPromise = page.waitForEvent('download');
  await frame.getByRole('button', { name: 'Exportar bitácora CSV' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('ORION_Comunicaciones_Bitacora_Sesion.csv');

  await frame.getByRole('button', { name: 'Corregir' }).click();
  await expect(status).toHaveText('Corregido');
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
  await expect(frame.locator('#orionAuditToolbar')).not.toHaveAttribute('open','');
  await expect(frame.getByRole('button', { name: 'Exportar bitácora CSV' })).toBeHidden();
  await addSyntheticRow(frame);
  await expect(frame.locator('.orion-audit-menu > summary')).toBeVisible();
  await expect(frame.getByRole('button', { name: 'Confirmé envío' })).toBeHidden();
  const initial = await frame.locator('#list .row').evaluate(row => ({
    rowHeight: row.getBoundingClientRect().height,
    whatsappWidth: row.querySelector('.wa-action').getBoundingClientRect().width,
    whatsappHeight: row.querySelector('.wa-action').getBoundingClientRect().height,
    menuOpen: row.querySelector('.orion-audit-menu').open
  }));
  expect(initial.whatsappWidth).toBeLessThanOrEqual(118);
  expect(initial.whatsappHeight).toBeLessThanOrEqual(36);
  expect(initial.rowHeight).toBeLessThan(245);
  expect(initial.menuOpen).toBe(false);
  await frame.locator('.orion-audit-menu > summary').click();
  await expect(frame.getByRole('button', { name: 'Confirmé envío' })).toBeVisible();
  const saved = await frame.locator('body').evaluate(() => ({
    events: sessionStorage.getItem('orion_comunicaciones_bitacora_sesion_v1'),
    overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 3
  }));
  expect(saved.events).toBeNull();
  expect(saved.overflow).toBe(false);
});

test('el botón de WhatsApp vence estilos heredados incluso con !important', async ({page}) => {
  await page.setViewportSize({width: 390, height: 844});
  const frame = await openComms(page);
  await frame.locator('#list').evaluate(list => {
    const row = document.createElement('div');
    row.className = 'row';
    row.innerHTML = [
      '<div class="patient-main">',
      '<div class="paciente-nombre">CASO SINTÉTICO</div>',
      '<div class="wa-row-line"><a class="btn whatsapp wa-action" href="#">WhatsApp</a></div>',
      '</div>',
      '<div class="patient-run">TEST-RUN</div>',
      '<div class="patient-date">20-10-2026</div>',
      '<div class="patient-time">09:00</div>',
      '<div class="patient-status">Citado</div>',
      '<div class="patient-motive">CONTROL</div>'
    ].join('');
    const action = row.querySelector('a.whatsapp');
    action.style.setProperty('width','100%','important');
    action.style.setProperty('height','600px','important');
    action.style.setProperty('min-height','600px','important');
    action.style.setProperty('border-radius','999px','important');
    list.appendChild(row);
  });
  const action = frame.locator('#list a.wa-action');
  await expect(action).toHaveCSS('max-width', '112px');
  await expect(action).toHaveCSS('max-height', '34px');
  await expect.poll(async() => action.evaluate(el => {
    const r=el.getBoundingClientRect();
    return r.width <= 118 && r.height <= 36 && getComputedStyle(el).borderRadius === '8px';
  })).toBe(true);
});
