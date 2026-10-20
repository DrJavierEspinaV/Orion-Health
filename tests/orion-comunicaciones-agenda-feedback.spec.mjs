import { test, expect } from '@playwright/test';

async function openAgenda(page, width) {
  await page.setViewportSize({ width, height: 850 });
  // Solo pruebas: exponer un sembrador de filas sintéticas sin alterar la app distribuida.
  await page.route('**/modules/comunicaciones/source.html*', async route => {
    const response = await route.fetch();
    const html = await response.text();
    const anchor = '}); // DOMContentLoaded';
    if (!html.includes(anchor)) throw new Error('No se encontró el ancla de QA de la agenda');
    const instrumented = html.replace(anchor, String.raw`
window.__orionAgendaTest = {
  seed(rows) {
    DATA.splice(0, DATA.length, ...rows.map(prepRow));
    render();
  }
};
` + anchor);
    await route.fulfill({ response, body: instrumented });
  });
  await page.goto('/apps/orion-health/index.html', { waitUntil: 'domcontentloaded' });
  await page.locator('.menu-btn[data-app="comunicaciones"]').click();
  const frame = page.frameLocator('#appFrame');
  await expect(frame.locator('#orionAgendaFeedback')).toBeVisible({ timeout: 30000 });
  return frame;
}

const rows = [
  {'Paciente':'FICTICIO ALFA', 'RUN':'12.345.678-5', 'WhatsApp':'', 'fecha':'20/10/2026', 'hora':'09:00', 'Estado':'Citado'},
  {'Paciente':'FICTICIO BETA', 'RUN':'11.111.111-1', 'WhatsApp':'', 'fecha':'20/10/2026', 'hora':'10:00', 'Estado':'Atendido'},
  {'Paciente':'FICTICIO GAMMA', 'RUN':'22.222.222-2', 'WhatsApp':'', 'fecha':'21/10/2026', 'hora':'13:00', 'Estado':'Citado'}
];

for (const width of [1440, 390]) {
  test('Agenda '+width+'px: resultados, búsqueda sin coincidencia y limpieza integral', async ({ page }) => {
    const frame = await openAgenda(page, width);
    await frame.locator('body').evaluate(rows => window.__orionAgendaTest.seed(rows), rows);
    const count = frame.locator('#orionAgendaCount');
    const empty = frame.locator('#orionAgendaEmpty');
    const clear = frame.locator('#orionAgendaClearFilters');
    const list = frame.locator('#list .row');

    await expect(list).toHaveCount(3);
    await expect(count).toHaveText('3 citas en agenda');
    await expect(clear).toBeHidden();
    await expect(empty).toBeHidden();

    await frame.locator('#q').fill('FICTICIO BETA');
    await expect(list).toHaveCount(1);
    await expect(count).toHaveText('1 de 3 citas');
    await expect(clear).toBeVisible();

    await frame.locator('#q').fill('PACIENTE NO EXISTENTE');
    await expect(list).toHaveCount(0);
    await expect(count).toHaveText('0 de 3 citas');
    await expect(empty).toContainText('No hay citas que coincidan');

    await frame.locator('#q').clear();
    await frame.locator('#fFechaFrom').fill('2026-10-20');
    await frame.locator('#fFechaTo').fill('2026-10-20');
    await expect(count).toHaveText('2 de 3 citas');
    await frame.locator('#showFilter').selectOption({label:'Atendido'});
    await expect(count).toHaveText('1 de 3 citas');

    await clear.click();
    await expect(frame.locator('#q')).toHaveValue('');
    await expect(frame.locator('#showFilter')).toHaveValue('__todos__');
    await expect(frame.locator('#fFechaFrom')).toHaveValue('');
    await expect(frame.locator('#fFechaTo')).toHaveValue('');
    await expect(count).toHaveText('3 citas en agenda');
    await expect(list).toHaveCount(3);
    await expect(clear).toBeHidden();
    await expect(empty).toBeHidden();
    const overflow = await frame.locator('#orionAgendaFeedback').evaluate(el => {
      const rect = el.getBoundingClientRect();
      return rect.width > document.documentElement.clientWidth + 4;
    });
    expect(overflow).toBe(false);
  });
}

test('Sin agenda cargada: mensaje distinto de filtros sin coincidencias', async ({ page }) => {
  const frame = await openAgenda(page, 390);
  await frame.locator('body').evaluate(() => window.__orionAgendaTest.seed([]));
  await expect(frame.locator('#orionAgendaCount')).toHaveText('0 citas en agenda');
  await expect(frame.locator('#orionAgendaEmpty')).toHaveText('No hay citas cargadas todavía.');
});
